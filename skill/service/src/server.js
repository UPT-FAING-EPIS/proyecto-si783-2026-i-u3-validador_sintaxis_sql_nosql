require('dotenv').config();

const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health.routes');
const enginesRoutes = require('./routes/engines.routes');
const capabilitiesRoutes = require('./routes/capabilities.routes');
const validateRoutes = require('./routes/validate.routes');
const { createRateLimit } = require('./middleware/rateLimit.middleware');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const { swaggerDocs, openApiYaml } = require('./docs/swagger');

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || '*';

app.set('trust proxy', true);
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '2mb' }));
app.use(createRateLimit());

app.get('/docs', swaggerDocs);
app.get('/openapi.yaml', openApiYaml);

app.use(healthRoutes);
app.use('/api/v1', enginesRoutes);
app.use('/api/v1', capabilitiesRoutes);
app.use('/api/v1', validateRoutes);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SQL_VALIDATION_SKILL] Service listening on port ${PORT}`);
  });
}

module.exports = app;
