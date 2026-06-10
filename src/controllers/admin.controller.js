const db = require('../config/db.config');
const bcrypt = require('bcrypt');

const getGeneralStats = async (req, res) => {
  try {
    // Total users
    const totalUsersResult = await db.query('SELECT COUNT(*) as total FROM users');
    
    // Active users (last 10 min)
    const activeUsersResult = await db.query(`
      SELECT COUNT(*) as active 
      FROM users 
      WHERE last_activity >= NOW() - INTERVAL '10 minutes'
    `);

    // Total admins
    const adminsResult = await db.query('SELECT COUNT(*) as total FROM admins WHERE activo = true');

    // SQL validations count
    const sqlValidationsResult = await db.query(
      "SELECT COUNT(*) as total FROM audit_logs WHERE accion = 'VALIDATION' AND detalles ILIKE '%sql%' AND detalles NOT ILIKE '%mongodb%' AND detalles NOT ILIKE '%nosql%'"
    );

    // MongoDB validations count
    const mongoValidationsResult = await db.query(
      "SELECT COUNT(*) as total FROM audit_logs WHERE accion = 'VALIDATION' AND (detalles ILIKE '%mongodb%' OR detalles ILIKE '%nosql%' OR detalles ILIKE '%mongo%')"
    );

    // Total validations
    const totalValidationsResult = await db.query(
      "SELECT COUNT(*) as total FROM audit_logs WHERE accion = 'VALIDATION'"
    );

    // Sessions (logins)
    const sessionsResult = await db.query(
      "SELECT COUNT(*) as total FROM audit_logs WHERE accion IN ('LOGIN', 'ADMIN_LOGIN', 'REGISTER')"
    );

    // Total events
    const eventsResult = await db.query('SELECT COUNT(*) as total FROM audit_logs');

    res.json({
      totalUsers: parseInt(totalUsersResult.rows[0].total, 10),
      activeUsers: parseInt(activeUsersResult.rows[0].active, 10),
      totalAdmins: parseInt(adminsResult.rows[0].total, 10),
      sqlValidations: parseInt(sqlValidationsResult.rows[0].total, 10),
      mongoValidations: parseInt(mongoValidationsResult.rows[0].total, 10),
      totalValidations: parseInt(totalValidationsResult.rows[0].total, 10),
      sessions: parseInt(sessionsResult.rows[0].total, 10),
      totalEvents: parseInt(eventsResult.rows[0].total, 10)
    });
  } catch (err) {
    console.error('Error obteniendo estadísticas:', err);
    res.status(500).json({ error: 'Error del servidor al obtener estadísticas' });
  }
};

const getActiveUsers = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, email, last_activity 
      FROM users 
      WHERE last_activity >= NOW() - INTERVAL '10 minutes'
      ORDER BY last_activity DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios activos' });
  }
};

const getRecentLogins = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT users.name, users.email, login_history.login_time, login_history.ip_address 
      FROM login_history 
      JOIN users ON users.id = login_history.user_id 
      ORDER BY login_history.login_time DESC 
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener últimos accesos' });
  }
};

const getLoginHistory = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT lh.id, u.name, u.email, lh.login_time, lh.ip_address, lh.user_agent 
      FROM login_history lh
      JOIN users u ON u.id = lh.user_id 
      ORDER BY lh.login_time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial de accesos' });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const { filter } = req.query;
    
    let query = 'SELECT id, usuario, accion, detalles, ip, fecha FROM audit_logs';
    let params = [];
    
    if (filter && filter !== 'ALL') {
      const filterMap = {
        'ERRORS': "accion IN ('ERROR')",
        'EVENTS': "accion NOT IN ('LOGIN', 'ADMIN_LOGIN', 'REGISTER', 'LOGOUT', 'VALIDATION', 'ERROR')",
        'ACCESS': "accion IN ('LOGIN', 'ADMIN_LOGIN', 'REGISTER', 'LOGOUT')",
        'VALIDATIONS': "accion = 'VALIDATION'",
        'ADMIN': "accion IN ('ADMIN_LOGIN', 'CREATE_ADMIN', 'DEACTIVATE_ADMIN')"
      };
      
      if (filterMap[filter]) {
        query += ` WHERE ${filterMap[filter]}`;
      }
    }
    
    query += ' ORDER BY fecha DESC LIMIT 200';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo audit logs:', err);
    res.status(500).json({ error: 'Error al obtener registros de auditoría' });
  }
};

const searchUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Debe proporcionar un email para buscar' });
    }
    const result = await db.query('SELECT id, name, email, role, last_login, last_activity, created_at FROM users WHERE email ILIKE $1', [`%${email}%`]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar usuario' });
  }
};

const getTotalUsers = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role, created_at, last_login, last_activity, is_online FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const getAdmins = async (req, res) => {
  try {
    const result = await db.query('SELECT id, nombre, correo, rol, activo, created_at, last_login FROM admins ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo admins:', err);
    res.status(500).json({ error: 'Error al obtener administradores' });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { nombre, correo, password, rol } = req.body;
    if (!nombre || !correo || !password) return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos' });

    const exists = await db.query('SELECT * FROM admins WHERE correo = $1', [correo]);
    if (exists.rows.length > 0) return res.status(400).json({ error: 'El administrador ya existe' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO admins (nombre, correo, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, correo, rol',
      [nombre, correo, hashedPassword, rol || 'admin']
    );

    const ipAddress = req.ip || req.connection.remoteAddress;
    await db.query(
      'INSERT INTO audit_logs (usuario, accion, detalles, ip) VALUES ($1, $2, $3, $4)',
      [req.user.email, 'CREATE_ADMIN', `Administrador creado: ${correo}`, ipAddress]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear administrador' });
  }
};

const deactivateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    
    const target = await db.query('SELECT correo, rol FROM admins WHERE id = $1', [id]);
    if (!target.rows[0]) return res.status(404).json({ error: 'No encontrado' });
    if (target.rows[0].rol === 'superadmin' || target.rows[0].correo === req.user.email) {
      return res.status(403).json({ error: 'No se puede desactivar este administrador' });
    }

    await db.query('UPDATE admins SET activo = false WHERE id = $1', [id]);
    
    const ipAddress = req.ip || req.connection.remoteAddress;
    await db.query(
      'INSERT INTO audit_logs (usuario, accion, detalles, ip) VALUES ($1, $2, $3, $4)',
      [req.user.email, 'DEACTIVATE_ADMIN', `Administrador desactivado: ${target.rows[0].correo}`, ipAddress]
    );

    res.json({ message: 'Administrador desactivado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al desactivar administrador' });
  }
};

module.exports = {
  getGeneralStats,
  getActiveUsers,
  getRecentLogins,
  getLoginHistory,
  searchUserByEmail,
  getTotalUsers,
  getAuditLogs,
  getAdmins,
  createAdmin,
  deactivateAdmin
};
