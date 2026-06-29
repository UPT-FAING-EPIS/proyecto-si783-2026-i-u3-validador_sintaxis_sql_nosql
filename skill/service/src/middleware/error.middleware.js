function notFound(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
    }
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: status === 500 ? 'Error interno del servicio.' : err.message
    }
  });
}

module.exports = { notFound, errorHandler };
