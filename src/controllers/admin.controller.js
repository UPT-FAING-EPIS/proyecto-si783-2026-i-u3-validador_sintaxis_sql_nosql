const db = require('../config/db.config');

const getGeneralStats = async (req, res) => {
  try {
    const totalUsersResult = await db.query('SELECT COUNT(*) as total FROM users');
    
    // Consideramos activos a los que tuvieron actividad en los últimos 10 minutos
    const activeUsersResult = await db.query(`
      SELECT COUNT(*) as active 
      FROM users 
      WHERE last_activity >= NOW() - INTERVAL '10 minutes'
    `);

    res.json({
      totalUsers: parseInt(totalUsersResult.rows[0].total, 10),
      activeUsers: parseInt(activeUsersResult.rows[0].active, 10)
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
    const result = await db.query('SELECT id, name, email, role, created_at, last_login FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

module.exports = {
  getGeneralStats,
  getActiveUsers,
  getRecentLogins,
  getLoginHistory,
  searchUserByEmail,
  getTotalUsers
};
