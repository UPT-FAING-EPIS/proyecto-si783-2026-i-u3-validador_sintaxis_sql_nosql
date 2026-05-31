/**
 * logger.middleware.js
 * Middleware de logging para todas las peticiones HTTP.
 * Formato: [ISO-TIMESTAMP] METHOD PATH → status-code (duration)
 */

function logger(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Log cuando la respuesta termine
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url, originalUrl } = req;
    const statusCode = res.statusCode;

    // Coloreado por código (funciona en terminales que soportan ANSI)
    let statusColor = '\x1b[90m'; // gris
    if (statusCode >= 200 && statusCode < 300) statusColor = '\x1b[32m'; // verde
    else if (statusCode >= 400 && statusCode < 500) statusColor = '\x1b[33m'; // amarillo
    else if (statusCode >= 500) statusColor = '\x1b[31m'; // rojo

    console.log(
      `\x1b[90m[${timestamp}]\x1b[0m ` +
      `\x1b[36m${method.padEnd(6)}\x1b[0m ` +
      `\x1b[37m${url}\x1b[0m → ` +
      `${statusColor}${statusCode}\x1b[0m ` +
      `\x1b[90m(${duration}ms)\x1b[0m`
    );
  });

  next();
}

module.exports = { logger };
