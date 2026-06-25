/**
 * validate.routes.js
 * Rutas de la API REST para validación SQL/NoSQL.
 * Patrón MVC: Routes → Controller → Service
 */

const express = require('express');
const router = express.Router();
const {
  validateQuery,
  validateFile,
  healthCheck,
  getExamples
} = require('../controllers/validation.controller');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/validate
 * Valida una consulta SQL o MongoDB
 * Body: { type: 'sql' | 'nosql', query: string }
 */
router.post('/validate', validateQuery);

/**
 * POST /api/validate/file
 * Valida un archivo completo de SQL/NoSQL en streaming
 * Body: form-data (file: File, type: string)
 */
router.post('/validate/file', upload.single('file'), validateFile);

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
