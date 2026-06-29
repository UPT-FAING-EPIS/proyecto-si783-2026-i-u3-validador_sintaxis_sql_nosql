const skill = require('../lib/skill-core.adapter');

function requireCode(req, res) {
  if (!req.body || typeof req.body.code !== 'string') {
    res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'El campo "code" es obligatorio y debe ser string.'
      }
    });
    return false;
  }
  return true;
}

function validate(req, res) {
  if (!requireCode(req, res)) return;
  res.json(skill.validate(req.body.code, req.body.engine || 'auto'));
}

function diagnostic(req, res) {
  if (!requireCode(req, res)) return;
  res.json(skill.diagnostic(req.body.code, req.body.engine || 'auto'));
}

function detectEngine(req, res) {
  if (!requireCode(req, res)) return;
  res.json(skill.detectEngine(req.body.code));
}

function compatibility(req, res) {
  if (!requireCode(req, res)) return;
  res.json(skill.compatibility(req.body.code));
}

function fix(req, res) {
  if (!requireCode(req, res)) return;
  res.json(skill.fix(req.body.code, req.body.engine || 'auto'));
}

function format(req, res) {
  if (!requireCode(req, res)) return;
  res.json(skill.format(req.body.code, req.body.engine || 'auto'));
}

function lint(req, res) {
  if (!requireCode(req, res)) return;
  res.json(skill.lint(req.body.code, req.body.engine || 'auto'));
}

module.exports = {
  validate,
  diagnostic,
  detectEngine,
  compatibility,
  fix,
  format,
  lint
};
