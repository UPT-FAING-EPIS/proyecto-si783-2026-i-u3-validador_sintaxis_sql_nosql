const express = require('express');
const controller = require('../controllers/validate.controller');

const router = express.Router();

router.post('/detect-engine', controller.detectEngine);
router.post('/validate', controller.validate);
router.post('/diagnostic', controller.diagnostic);
router.post('/compatibility', controller.compatibility);
router.post('/fix', controller.fix);
router.post('/format', controller.format);
router.post('/lint', controller.lint);

module.exports = router;
