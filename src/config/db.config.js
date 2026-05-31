const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('====================================');
console.log('CONFIGURACIÓN CARGADA');
console.log('====================================');

// Validación de DATABASE_URL
let dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  const isPlaceholder = dbUrl.includes('user:password') || dbUrl.includes('host:port');
  if (isPlaceholder) {
    console.log('⚠️ Se detectó una DATABASE_URL de prueba/placeholder. Ignorando...');
    dbUrl = null;
  }
}

let poolConfig = {};

if (dbUrl) {
  console.log('Modo: Railway / Producción (usando DATABASE_URL)');
  poolConfig = {
    connectionString: dbUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
} else {
  console.log('Modo: Local / Desarrollo (usando variables individuales)');
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'validator_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Validator2026'
  };
}

console.log('Configuración activa:', {
  host: poolConfig.host || 'Usando Connection String',
  port: poolConfig.port || 'N/A',
  database: poolConfig.database || 'N/A',
  user: poolConfig.user || 'N/A',
  password: '***'
});
console.log('====================================');

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Función para inicializar la base de datos
const initDB = async () => {
  try {
    console.log('🔄 Probando conexión PostgreSQL...');

    const test = await pool.query('SELECT NOW()');

    console.log('✅ Conexión PostgreSQL exitosa');
    console.log('Hora servidor:', test.rows[0].now);

    const schemaPath = path.join(__dirname, '../database/schema.sql');

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');

      if (schema.trim()) {
        await pool.query(schema);
        console.log('✅ Schema ejecutado correctamente');
      } else {
        console.log('⚠️ schema.sql está vacío');
      }
    } else {
      console.log('⚠️ schema.sql no encontrado:', schemaPath);
    }

    console.log('✅ Base de datos PostgreSQL inicializada correctamente');
  } catch (err) {
    console.error('❌ Error inicializando base de datos:', err);
    throw err;
  }
};

module.exports = {
  pool,
  initDB,
  query: (text, params) => pool.query(text, params)
};
