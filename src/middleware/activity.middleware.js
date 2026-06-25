const db = require('../config/db.config');

const updateLastActivity = async (req, res, next) => {
  if (req.user && req.user.id) {
    try {
      await db.query('UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = $1', [req.user.id]);
      console.log(`[DEBUG] Usuario: ${req.user.email} | Última actividad: ${new Date().toISOString()} | Estado calculado: online`);
    } catch (err) {
      console.error('Error actualizando last_activity:', err);
    }
  }
  next();
};

module.exports = {
  updateLastActivity
};
