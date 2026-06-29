function health(req, res) {
  res.json({
    status: 'ok',
    service: 'sql-validation-skill',
    version: '1.0.0'
  });
}

module.exports = { health };
