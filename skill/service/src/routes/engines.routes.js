const express = require('express');
const { listEngines } = require('../controllers/engines.controller');

const router = express.Router();

router.get('/engines', listEngines);

module.exports = router;
