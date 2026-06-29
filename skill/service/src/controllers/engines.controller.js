const { SUPPORTED_ENGINES } = require('../lib/skill-core.adapter');

function listEngines(req, res) {
  res.json({ engines: SUPPORTED_ENGINES });
}

module.exports = { listEngines };
