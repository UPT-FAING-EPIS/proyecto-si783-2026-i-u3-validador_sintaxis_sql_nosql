function listCapabilities(req, res) {
  res.json({
    capabilities: {
      validation: true,
      diagnostics: true,
      engineDetection: true,
      compatibility: true,
      fix: true,
      format: true,
      lint: true
    }
  });
}

module.exports = { listCapabilities };
