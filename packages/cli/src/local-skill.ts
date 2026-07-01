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

const SIMPLE_FIXES = new Map([
  ['TABL', 'TABLE'],
  ['VARHAR', 'VARCHAR'],
  ['PRIMRY', 'PRIMARY'],
  ['COLLTE', 'COLLATE'],
  ['DEFALT', 'DEFAULT'],
  ['NUL', 'NULL']
]);

function normalizeEngine(engine) {
  const normalized = String(engine || 'auto').trim().toLowerCase();
  if (normalized === 'sql server' || normalized === 'mssql') return 'sqlserver';
  if (normalized === 'postgres' || normalized === 'postgresql') return 'postgresql';
  if (normalized === 'mongo' || normalized === 'nosql') return 'mongodb';
  if (SUPPORTED_ENGINES.includes(normalized) || normalized === 'auto') return normalized;
  return 'auto';
}

function engineToCoreType(engine) {
  const normalized = normalizeEngine(engine);
  if (normalized === 'mongodb') return 'mongodb';
  if (normalized === 'auto') return null;
  return 'sql';
}

function toPublicEngine(engine) {
  return CORE_ENGINE_TO_PUBLIC[engine] || normalizeEngine(engine);
}

function loadCore() {
  const candidates = [
    process.env.SQLCHECK_CORE_PATH,
    path.join(__dirname, 'core', 'validation.service.js'),
    path.join(__dirname, '..', 'lib', 'core', 'validation.service.js'),
    path.join(__dirname, '..', 'lib', 'sqlcheck', 'core', 'validation.service.js'),
    '/usr/local/lib/sqlcheck/core/validation.service.js'
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch (_error) {
      // Try the next installed location.
    }
  }

  throw new Error('No se encontro el core local de validacion. Reinstale el paquete sqlcheck.');
}

function positionFromIndex(text, index) {
  const before = String(text || '').slice(0, index);
  const lines = before.split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
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
  const core = loadCore();
  const engineRequested = normalizeEngine(engine);
  const raw = core.validateQueryAuto(String(code || ''), engineToCoreType(engineRequested));
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
    analysisTimeMs,
    source: 'local-core'
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
        source: 'sqlcheck-local',
        message: error.message,
        suggestion: error.suggestion
      };
    })
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

  return { fixed: changes.length > 0, fixedCode, changes };
}

function format(code) {
  let formatted = String(code || '').trim();
  if (!formatted) return { formatted: false, code: '' };

  formatted = formatted
    .replace(/\s+/g, ' ')
    .replace(/\b(select|from|where|group by|order by|having|limit|offset|insert into|values|update|set|delete from)\b/gi, match => match.toUpperCase())
    .replace(/\s+(FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|VALUES|SET)\b/g, '\n$1')
    .replace(/;\s*$/, '');

  return { formatted: true, code: `${formatted};` };
}

function lint(code) {
  const warnings = [];
  const text = String(code || '');
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
  if (selectAll) add(selectAll.index, 'Evite SELECT * en consultas de produccion.', 'SQL_LINT_SELECT_ALL');

  const deleteMatch = /\bDELETE\s+FROM\b[\s\S]*?(;|$)/gi;
  for (const match of text.matchAll(deleteMatch)) {
    if (!/\bWHERE\b/i.test(match[0])) add(match.index || 0, 'DELETE sin WHERE puede eliminar todos los registros.', 'SQL_LINT_DELETE_WITHOUT_WHERE');
  }

  const updateMatch = /\bUPDATE\b[\s\S]*?(;|$)/gi;
  for (const match of text.matchAll(updateMatch)) {
    if (!/\bWHERE\b/i.test(match[0])) add(match.index || 0, 'UPDATE sin WHERE puede modificar todos los registros.', 'SQL_LINT_UPDATE_WITHOUT_WHERE');
  }

  return { warnings };
}

module.exports = {
  validate,
  diagnostic,
  fix,
  format,
  lint,
  normalizeEngine
};
