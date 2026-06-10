const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/admin.controller');

// Obtener estadísticas generales
router.get('/stats', getGeneralStats);

// Obtener total de usuarios registrados
router.get('/users', getTotalUsers);

// Obtener usuarios activos (actividad en últimos 10 min)
router.get('/active', getActiveUsers);

// Obtener últimos accesos (límite de 10)
router.get('/logins/recent', getRecentLogins);

// Obtener historial completo de inicios de sesión
router.get('/logins/history', getLoginHistory);

// Buscar usuario por correo (?email=...)
router.get('/users/search', searchUserByEmail);

// Obtener registros de auditoría
router.get('/audit', getAuditLogs);

// Obtener administradores
router.get('/admins', getAdmins);

// Crear administrador
router.post('/admins', createAdmin);

// Desactivar administrador
router.put('/admins/:id/deactivate', deactivateAdmin);

module.exports = router;
