const express = require('express');
const router = express.Router();
const { register, login, adminLogin, logout } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/admin-login
router.post('/admin-login', adminLogin);

// POST /api/auth/logout (Protegida)
router.post('/logout', verifyToken, logout);

module.exports = router;
