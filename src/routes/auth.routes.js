const express = require('express');
const router = express.Router();
const { register, login, logout, getOnlineUsers } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout (Protegida)
router.post('/logout', verifyToken, logout);

// GET /api/auth/online-users (Protegida)
router.get('/online-users', verifyToken, getOnlineUsers);

module.exports = router;
