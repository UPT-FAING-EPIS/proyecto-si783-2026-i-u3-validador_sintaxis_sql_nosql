function createRateLimit() {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 900000);
  const max = Number(process.env.RATE_LIMIT_MAX || 100);
  const buckets = new Map();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'anonymous';
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      res.set('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Demasiadas solicitudes. Intente nuevamente más tarde.'
        }
      });
    }

    return next();
  };
}

module.exports = { createRateLimit };
