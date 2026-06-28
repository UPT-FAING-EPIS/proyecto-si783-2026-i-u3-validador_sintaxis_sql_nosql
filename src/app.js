const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

// Importar capas MVC
const { logger } = require('./middleware/logger.middleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler.middleware');
const validateRoutes = require('./routes/validate.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const { verifyToken, isAdmin } = require('./middleware/auth.middleware');
const { updateLastActivity } = require('./middleware/activity.middleware');

// Crear aplicación Express
const app = express();
const server = http.createServer(app);

// 1. CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Confiar en el proxy (Railway)
app.set('trust proxy', true);

// 2. Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 3. Logger global
app.use(logger);

// Middleware para decodificar token opcionalmente y actualizar actividad (Para usuarios logueados)
app.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_validator_123');
        req.user = decoded;
      } catch (err) {
        // Ignorar si el token es inválido aquí, auth.middleware se encargará si la ruta está protegida
      }
    }
  }
  next();
});

// Middleware de actualización de actividad (solo si hay user en req)
app.use(updateLastActivity);

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/admin', verifyToken, isAdmin, adminRoutes); // Protegemos el panel de administración
app.use('/api', validateRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Servir frontend
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath, { maxAge: 0, etag: true }));

// Rutas HTML específicas
app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin-login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin.html'));
});

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

// Manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app, server };
