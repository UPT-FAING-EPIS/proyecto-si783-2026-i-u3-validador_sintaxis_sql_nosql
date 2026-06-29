const path = require('path');

const SUPPORTED_ENGINES = [
  'sql-ansi',
  'mysql',
  'mariadb',
  'postgresql',
  'sqlserver',
  'oracle',
  'sqlite',
  'mongodb'
];

const CORE_ENGINE_TO_PUBLIC = {
  'SQL ANSI': 'sql-ansi',
  MySQL: 'mysql',
  MariaDB: 'mariadb',
  PostgreSQL: 'postgresql',
  SQLite: 'sqlite',
  'SQL Server': 'sqlserver',
  Oracle: 'oracle',
  MongoDB: 'mongodb'
};

const PUBLIC_TO_CORE_TYPE = {
  auto: null,
  mongodb: 'mongodb',
  'sql-ansi': 'sql',
  mysql: 'sql',
  mariadb: 'sql',
  postgresql: 'sql',
  sqlserver: 'sql',
  oracle: 'sql',
  sqlite: 'sql'
};

const SIMPLE_FIXES = new Map([
  ['TABL', 'TABLE'],
  ['VARHAR', 'VARCHAR'],
  ['PRIMRY', 'PRIMARY'],
  ['COLLTE', 'COLLATE'],
  ['DEFALT', 'DEFAULT'],
  ['NUL', 'NULL']
]);

function loadCore() {
  const rootDir = path.resolve(__dirname, '../../../..');
  try {
    return require(path.join(rootDir, 'src/services/validation.service'));
  } catch (error) {
    return null;
  }
}

function normalizeEngine(engine) {
  const normalized = String(engine || 'auto').trim().toLowerCase();
  if (normalized === 'sql server' || normalized === 'mssql') return 'sqlserver';
  if (normalized === 'postgres' || normalized === 'postgresql') return 'postgresql';
  if (normalized === 'mongo' || normalized === 'nosql') return 'mongodb';
  if (SUPPORTED_ENGINES.includes(normalized) || normalized === 'auto') return normalized;
  return 'auto';
}

function toPublicEngine(engine) {
  return CORE_ENGINE_TO_PUBLIC[engine] || normalizeEngine(engine);
}

function engineToCoreType(engine) {
  return PUBLIC_TO_CORE_TYPE[normalizeEngine(engine)] || null;
}

function detectMongoSignals(code) {
  const signals = [];
  const text = String(code || '').trim();

  if (/\bdb\.[A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*\s*\(/.test(text)) {
    signals.push('Uso de db.coleccion.metodo()');
  }
  if (/^\s*[\[{]/.test(text) || /[{,]\s*['"]?\$[A-Za-z]+['"]?\s*:/.test(text)) {
    signals.push('Sintaxis de objeto JSON');
  }
  if (/\b(find|aggregate|insertOne|updateOne|deleteOne|createCollection)\s*\(/.test(text)) {
    signals.push('Métodos de MongoDB detectados');
  }

  return signals;
}

function detectSqlSignals(code) {
  const upper = String(code || '').toUpperCase();
  const signals = [];

  if (/\bLIMIT\b/.test(upper)) signals.push('Uso de LIMIT');
  if (/\bTOP\s+\d+\b/.test(upper)) signals.push('Uso de TOP');
  if (/\bAUTO_INCREMENT\b|\bENGINE\s*=/.test(upper)) signals.push('Sintaxis MySQL/MariaDB');
  if (/\bILIKE\b|::\s*\w+|\bRETURNING\b/.test(upper)) signals.push('Sintaxis PostgreSQL');
  if (/\bROWNUM\b|\bVARCHAR2\b|\bSYSDATE\b/.test(upper)) signals.push('Sintaxis Oracle');
  if (/\bPRAGMA\b|\bAUTOINCREMENT\b/.test(upper)) signals.push('Sintaxis SQLite');
  if (/\bSELECT\b|\bCREATE\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/.test(upper)) signals.push('Palabras clave SQL');

  return signals;
}

function fallbackValidate(code, engine = 'auto') {
  const errors = [];
  const trimmed = String(code || '').trim();
  const mongoSignals = detectMongoSignals(trimmed);
  const isMongo = normalizeEngine(engine) === 'mongodb' || (engine === 'auto' && mongoSignals.length > 0);

  if (!trimmed) {
    errors.push({
      line: 1,
      column: 1,
      message: 'La consulta está vacía.',
      fragment: '',
      suggestion: 'Escriba una consulta válida.'
    });
  }

  for (const [from, to] of SIMPLE_FIXES.entries()) {
    const match = new RegExp(`\\b${from}\\b`, 'i').exec(trimmed);
    if (match) {
      const loc = positionFromIndex(trimmed, match.index);
      errors.push({
        line: loc.line,
        column: loc.column,
        message: `${match[0]} no es válido. Se esperaba ${to}.`,
        fragment: match[0],
        suggestion: `Reemplace ${match[0]} por ${to}.`
      });
      break;
    }
  }

  return {
    valid: errors.length === 0,
    dialect: isMongo ? 'MongoDB' : 'SQL ANSI',
    confidence: isMongo ? 95 : 70,
    compatible: isMongo ? ['MongoDB'] : ['SQL ANSI', 'MySQL', 'MariaDB', 'PostgreSQL', 'SQLite'],
    incompatible: isMongo
      ? [{ engine: 'SQL ANSI', reasons: ['Sintaxis MongoDB'] }]
      : [{ engine: 'MongoDB', reasons: ['Sintaxis SQL'] }],
    errors,
    suggestions: errors[0] && errors[0].suggestion ? [errors[0].suggestion] : []
  };
}

function validateWithCore(code, engine = 'auto') {
  const core = loadCore();
  if (!core) return fallbackValidate(code, engine);

  const requestedType = engineToCoreType(engine);
  return core.validateQueryAuto(String(code || ''), requestedType);
}

function publicError(error, detectedEngine) {
  const token = error.fragment || error.operator || '';
  return {
    line: Number(error.line || 1),
    column: Number(error.column || 1),
    token,
    message: error.message || 'Error de sintaxis.',
    suggestion: error.suggestion || null,
    severity: 'error',
    code: detectedEngine === 'mongodb' ? 'MONGODB_SYNTAX_ERROR' : 'SQL_SYNTAX_ERROR'
  };
}

function validate(code, engine = 'auto') {
  const startedAt = process.hrtime.bigint();
  const engineRequested = normalizeEngine(engine);
  const raw = validateWithCore(code, engineRequested);
  const engineDetected = toPublicEngine(raw.dialect);
  const analysisTimeMs = Number((process.hrtime.bigint() - startedAt) / 1000000n);

  return {
    valid: Boolean(raw.valid),
    engineRequested,
    engineDetected,
    errors: (raw.errors || []).map(error => publicError(error, engineDetected)),
    warnings: [],
    compatibleEngines: (raw.compatible || []).map(toPublicEngine),
    incompatibleEngines: (raw.incompatible || []).map(item => ({
      engine: toPublicEngine(item.engine),
      reasons: item.reasons || []
    })),
    confidence: typeof raw.confidence === 'number' ? raw.confidence / (raw.confidence > 1 ? 100 : 1) : null,
    suggestions: raw.suggestions || [],
    analysisTimeMs
  };
}

function diagnostic(code, engine = 'auto') {
  const result = validate(code, engine);
  return {
    diagnostics: result.errors.map((error, index) => {
      const tokenLength = String(error.token || '').length || 1;
      return {
        range: {
          start: { line: error.line, character: error.column },
          end: { line: error.line, character: error.column + tokenLength }
        },
        severity: error.severity,
        code: result.engineDetected === 'mongodb'
          ? `MONGO${String(index + 1).padStart(3, '0')}`
          : `SQL${String(index + 1).padStart(3, '0')}`,
        source: 'sql-validation-skill',
        message: error.message,
        suggestion: error.suggestion
      };
    })
  };
}

function detectEngine(code) {
  const mongoSignals = detectMongoSignals(code);
  if (mongoSignals.length > 0) {
    return {
      engineDetected: 'mongodb',
      confidence: mongoSignals.length >= 2 ? 0.95 : 0.85,
      signals: mongoSignals
    };
  }

  const result = validateWithCore(code, 'auto');
  const engineDetected = toPublicEngine(result.dialect);
  const sqlSignals = detectSqlSignals(code);
  return {
    engineDetected,
    confidence: typeof result.confidence === 'number'
      ? result.confidence / (result.confidence > 1 ? 100 : 1)
      : 0.7,
    signals: sqlSignals.length > 0 ? sqlSignals : ['Sintaxis SQL general']
  };
}

function compatibility(code) {
  const result = validateWithCore(code, 'auto');
  const compatibleEngines = (result.compatible || []).map(toPublicEngine);
  const notCompatibleEngines = (result.incompatible || []).map(item => toPublicEngine(item.engine));
  const upper = String(code || '').toUpperCase();
  let reason = 'Compatibilidad calculada desde las señales del validador multimotor.';

  if (/\bLIMIT\b/.test(upper)) {
    reason = 'La cláusula LIMIT no pertenece a SQL Server ni Oracle clásico.';
  } else if (detectMongoSignals(code).length > 0) {
    reason = 'La sintaxis MongoDB no es compatible con motores SQL.';
  }

  return {
    compatibleEngines: [...new Set(compatibleEngines)],
    notCompatibleEngines: [...new Set(notCompatibleEngines)],
    reason
  };
}

function positionFromIndex(text, index) {
  const before = String(text || '').slice(0, index);
  const lines = before.split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

function fix(code) {
  let fixedCode = String(code || '');
  const changes = [];

  for (const [from, to] of SIMPLE_FIXES.entries()) {
    const regex = new RegExp(`\\b${from}\\b`, 'gi');
    fixedCode = fixedCode.replace(regex, (match, offset) => {
      const loc = positionFromIndex(code, offset);
      changes.push({ from: match, to, line: loc.line, column: loc.column });
      return to;
    });
  }

  return {
    fixed: changes.length > 0,
    fixedCode,
    changes
  };
}

function format(code) {
  let formatted = String(code || '').trim();
  if (!formatted) return { formatted: false, code: '' };

  formatted = formatted
    .replace(/\s+/g, ' ')
    .replace(/\b(select|from|where|group by|order by|having|limit|offset|insert into|values|update|set|delete from)\b/gi, match => match.toUpperCase())
    .replace(/\s+(FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|VALUES|SET)\b/g, '\n$1')
    .replace(/;\s*$/, '');

  return {
    formatted: true,
    code: `${formatted};`
  };
}

function lint(code) {
  const warnings = [];
  const text = String(code || '');
  const upper = text.toUpperCase();
  const add = (index, message, codeValue) => {
    const loc = positionFromIndex(text, Math.max(0, index));
    warnings.push({
      line: loc.line,
      column: loc.column,
      message,
      severity: 'warning',
      code: codeValue
    });
  };

  const selectAll = /\bSELECT\s+\*/i.exec(text);
  if (selectAll) add(selectAll.index, 'Evite SELECT * en consultas de producción.', 'SQL_LINT_SELECT_ALL');

  const deleteMatch = /\bDELETE\s+FROM\b[\s\S]*?(;|$)/gi;
  for (const match of text.matchAll(deleteMatch)) {
    if (!/\bWHERE\b/i.test(match[0])) add(match.index || 0, 'DELETE sin WHERE puede eliminar todos los registros.', 'SQL_LINT_DELETE_WITHOUT_WHERE');
  }

  const updateMatch = /\bUPDATE\b[\s\S]*?(;|$)/gi;
  for (const match of text.matchAll(updateMatch)) {
    if (!/\bWHERE\b/i.test(match[0])) add(match.index || 0, 'UPDATE sin WHERE puede modificar todos los registros.', 'SQL_LINT_UPDATE_WITHOUT_WHERE');
  }

  const passwordMatch = /\b(password|passwd|pwd|contraseña|contrasena)\b\s*[:=]\s*['"][^'"]+['"]/i.exec(text);
  if (passwordMatch) add(passwordMatch.index, 'Evite contraseñas en texto plano dentro de consultas o scripts.', 'SQL_LINT_PLAINTEXT_PASSWORD');

  const statementCount = (text.match(/;/g) || []).length;
  if (upper.length > 3000 && statementCount === 0) {
    add(0, 'Script extenso sin delimitadores claros; agregue separadores de sentencia.', 'SQL_LINT_LONG_SCRIPT_NO_DELIMITERS');
  }

  return { warnings };
}

module.exports = {
  SUPPORTED_ENGINES,
  validate,
  diagnostic,
  detectEngine,
  compatibility,
  fix,
  format,
  lint,
  normalizeEngine
};
