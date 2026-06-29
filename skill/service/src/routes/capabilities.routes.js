const express = require('express');
const { listCapabilities } = require('../controllers/capabilities.controller');

const router = express.Router();

router.get('/capabilities', listCapabilities);

module.exports = router;
