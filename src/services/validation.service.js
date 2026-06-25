const { SQLParser } = require('./validator/sql/parser');
const { MongoParser } = require('./validator/nosql/parser');
const { Engines } = require('./validator/sql/detector');

const DIALECTS = Object.values(Engines);

function detectCategory(query, requestedType = null) {
  if (requestedType === 'nosql' || requestedType === 'mongodb') return 'nosql';
  if (requestedType === 'sql') return 'sql';

  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  // JSON puro
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return 'nosql';
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return 'nosql';
  // Sintaxis shell de MongoDB (db.collection...)
  if (trimmed.startsWith('db.') || /\bdb\./.test(trimmed)) return 'nosql';
  if (/^use\s+[a-zA-Z_][a-zA-Z0-9_]*\s*;?/.test(lower) && /\bdb\./.test(trimmed)) return 'nosql';
  if (/^use\s+[a-zA-Z_][a-zA-Z0-9_]*\s*;?\s*$/.test(trimmed)) return 'nosql';

  // Si no es ninguno de esos, asumimos SQL (que pasará por el Lexer de SQL)
  return 'sql';
}

function validateSQL(query) {
  const parser = new SQLParser(query);
  return parser.parse();
}

function validateNoSQL(query) {
  const parser = new MongoParser(query);
  return parser.parse();
}

function validateQueryAuto(query, requestedType = null) {
  const category = detectCategory(query, requestedType);
  if (category === 'nosql') {
    return validateNoSQL(query);
  } else {
    return validateSQL(query);
  }
}

module.exports = {
  validateSQL,
  validateNoSQL,
  validateQueryAuto,
  detectCategory,
  DIALECTS
};
