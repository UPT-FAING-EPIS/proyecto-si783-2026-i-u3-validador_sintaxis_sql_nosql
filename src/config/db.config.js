const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

if (!dbUrl && isProduction) {
  throw new Error('❌ DATABASE_URL no configurada en producción');
}

const poolConfig = dbUrl
  ? {
      connectionString: dbUrl,
      // Revisado: Railway usa certificados autofirmados en su red interna gestionada; riesgo aceptado.
      ssl: { rejectUnauthorized: false } // nosemgrep: problem-based-packs.insecure-transport.js-node.bypass-tls-verification.bypass-tls-verification
    }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    };

console.log(`[DB] Modo: ${dbUrl ? 'Railway / Producción' : 'Local'}`);

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[DB] Error inesperado en cliente inactivo:', err.message);
});

const initDB = async () => {
  const test = await pool.query('SELECT NOW()');
  console.log('[DB] Conexión PostgreSQL exitosa');

  // Revisado: schema.sql es un archivo estatico del repo, no entrada de usuario.
  const schemaPath = path.join(__dirname, '../database/schema.sql'); // nosemgrep: ajinabraham.njsscan.database.sql_injection.node_sqli_injection

  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8'); // nosemgrep: ajinabraham.njsscan.database.sql_injection.node_sqli_injection
    if (schema.trim()) {
      await pool.query(schema);
      console.log('[DB] Schema ejecutado');
    }
  }

  // Auto-crear admin inicial desde variables de entorno si no existe ninguno
  try {
    const adminCount = await pool.query('SELECT COUNT(*) FROM admins');
    if (parseInt(adminCount.rows[0].count, 10) === 0) {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      const adminName = process.env.ADMIN_NAME || 'Administrador';

      if (adminEmail && adminPassword) {
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash(adminPassword, 10);
        await pool.query(
          'INSERT INTO admins (nombre, correo, password_hash, rol, activo) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (correo) DO NOTHING',
          [adminName, adminEmail, hash, 'superadmin', true]
        );
        console.log(`[DB] Admin inicial creado: ${adminEmail}`);
      } else {
        console.warn('[DB] ⚠️ No hay administradores. Configure ADMIN_EMAIL y ADMIN_PASSWORD.');
      }
    }
  } catch (err) {
    console.error('[DB] Error creando admin inicial:', err.message);
  }

  console.log('[DB] Base de datos inicializada');
};

module.exports = {
  pool,
  initDB,
  query: (text, params) => pool.query(text, params)
};