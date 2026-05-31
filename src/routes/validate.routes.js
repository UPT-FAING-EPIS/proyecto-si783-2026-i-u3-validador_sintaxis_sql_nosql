/**
 * validate.routes.js
 * Rutas de la API REST para validación SQL/NoSQL.
 * Patrón MVC: Routes → Controller → Service
 */

const express = require('express');
const router = express.Router();
const {
  validateQuery,
  healthCheck,
  getExamples
} = require('../controllers/validation.controller');

/**
 * POST /api/validate
 * Valida una consulta SQL o MongoDB
 * Body: { type: 'sql' | 'nosql', query: string }
 */
router.post('/validate', validateQuery);

/**
 * GET /api/health
 * Health check del servidor
 */
router.get('/health', healthCheck);

/**
 * GET /api/examples
 * Ejemplos de consultas para el frontend
 */
router.get('/examples', getExamples);

module.exports = router;
