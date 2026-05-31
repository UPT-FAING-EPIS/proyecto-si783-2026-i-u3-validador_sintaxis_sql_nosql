/**
 * errorHandler.middleware.js
 * Middleware centralizado de manejo de errores.
 * Captura todos los errores no manejados y devuelve JSON consistente.
 */

/**
 * middleware de error para Express
 * @param {Error} err - Objeto de error
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {Function} next - Next function
 */
function errorHandler(err, req, res, next) {
  console.error('❌ ERROR:', err);

  // Determinar código de estado
  const statusCode = err.statusCode || 500;

  // Respuesta en desarrollo vs producción
  const isDev = process.env.NODE_ENV !== 'production';

  const response = {
    error: {
      message: err.message || 'Error interno del servidor',
      code: statusCode
    }
  };

  // Incluir stack trace solo en desarrollo
  if (isDev) {
    response.error.stack = err.stack;
    response.error.original = err.original || null;
  }

  // Log detallado del error (siempre en consola)
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${statusCode}`);
  console.error(`   Mensaje: ${err.message}`);

  res.status(statusCode).json(response);
}

/**
 * Middleware 404 - para rutas no encontradas
 * Debe colocarse ANTES del errorHandler
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: {
      message: 'Ruta no encontrada',
      path: req.originalUrl,
      code: 404
    }
  });
}

module.exports = { errorHandler, notFoundHandler };
