/**
 * detector.js — Detector de motor SQL con puntuación de compatibilidad
 * Analiza tokens y texto para determinar compatibilidad con cada motor.
 */

const { TokenTypes } = require('../lexer');

const Engines = {
  ANSI:       'SQL ANSI',
  MYSQL:      'MySQL',
  MARIADB:    'MariaDB',
  POSTGRESQL: 'PostgreSQL',
  SQLITE:     'SQLite',
  SQLSERVER:  'SQL Server',
  ORACLE:     'Oracle'
};

const DIALECT_ENGINES = [
  Engines.MYSQL,
  Engines.MARIADB,
  Engines.POSTGRESQL,
  Engines.SQLITE,
  Engines.SQLSERVER,
  Engines.ORACLE
];
const ALL_ENGINES = Object.values(Engines);

/*
 * Señales de motor: cada señal tiene un peso y los motores donde es válida.
 * Si una señal aparece, los motores donde NO es válida pierden compatibilidad.
 */
const TOKEN_SIGNALS = [
  // MySQL-specific
  { pattern: 'AUTO_INCREMENT',  engines: [Engines.MYSQL, Engines.MARIADB], weight: 30 },
  { pattern: 'ENGINE',          engines: [Engines.MYSQL, Engines.MARIADB], weight: 20, context: 'DDL' },
  { pattern: 'SHOW',            engines: [Engines.MYSQL, Engines.MARIADB], weight: 15 },
  { pattern: 'DESCRIBE',        engines: [Engines.MYSQL, Engines.MARIADB, Engines.ORACLE], weight: 10 },
  { pattern: 'CURDATE',         engines: [Engines.MYSQL, Engines.MARIADB], weight: 20 },
  { pattern: 'CURTIME',         engines: [Engines.MYSQL, Engines.MARIADB], weight: 20 },
  { pattern: 'IFNULL',          engines: [Engines.MYSQL, Engines.MARIADB, Engines.SQLITE], weight: 15 },
  { pattern: 'GROUP_CONCAT',    engines: [Engines.MYSQL, Engines.MARIADB], weight: 25 },
  { pattern: 'LAST_INSERT_ID',  engines: [Engines.MYSQL, Engines.MARIADB], weight: 30 },
  { pattern: 'UNIX_TIMESTAMP',  engines: [Engines.MYSQL, Engines.MARIADB], weight: 25 },
  { pattern: 'USE',             engines: [Engines.MYSQL, Engines.MARIADB, Engines.SQLSERVER], weight: 35 },
  { pattern: 'LOCK',            engines: [Engines.MYSQL, Engines.MARIADB], weight: 30 },
  { pattern: 'UNLOCK',          engines: [Engines.MYSQL, Engines.MARIADB], weight: 30 },
  { pattern: 'DELIMITER',       engines: [Engines.MYSQL, Engines.MARIADB], weight: 35 },

  // PostgreSQL-specific
  { pattern: 'ILIKE',           engines: [Engines.POSTGRESQL], weight: 30 },
  { pattern: 'RETURNING',       engines: [Engines.POSTGRESQL, Engines.SQLITE, Engines.ORACLE], weight: 15 },
  { pattern: 'STRING_AGG',      engines: [Engines.POSTGRESQL, Engines.SQLSERVER], weight: 20 },
  { pattern: 'ARRAY_AGG',       engines: [Engines.POSTGRESQL], weight: 25 },
  { pattern: 'GEN_RANDOM_UUID', engines: [Engines.POSTGRESQL], weight: 30 },
  { pattern: 'NEXTVAL',         engines: [Engines.POSTGRESQL, Engines.ORACLE], weight: 20 },

  // SQL Server-specific
  { pattern: 'TOP',             engines: [Engines.SQLSERVER], weight: 30 },
  { pattern: 'NOLOCK',          engines: [Engines.SQLSERVER], weight: 35 },
  { pattern: 'NEWID',           engines: [Engines.SQLSERVER], weight: 30 },
  { pattern: 'SCOPE_IDENTITY',  engines: [Engines.SQLSERVER], weight: 30 },
  { pattern: 'GETDATE',         engines: [Engines.SQLSERVER], weight: 30 },
  { pattern: 'GO',              engines: [Engines.SQLSERVER], weight: 25, context: 'standalone' },
  { pattern: 'IDENTITY',        engines: [Engines.SQLSERVER], weight: 20 },
  { pattern: 'CHARINDEX',       engines: [Engines.SQLSERVER], weight: 20 },

  // Oracle-specific
  { pattern: 'ROWNUM',          engines: [Engines.ORACLE], weight: 35 },
  { pattern: 'SYSDATE',         engines: [Engines.ORACLE], weight: 30 },
  { pattern: 'SYSTIMESTAMP',    engines: [Engines.ORACLE], weight: 35 },
  { pattern: 'CONNECT',         engines: [Engines.ORACLE], weight: 25 },
  { pattern: 'PRIOR',           engines: [Engines.ORACLE], weight: 20 },
  { pattern: 'DUAL',            engines: [Engines.ORACLE, Engines.MYSQL, Engines.MARIADB], weight: 15 },
  { pattern: 'NVL',             engines: [Engines.ORACLE], weight: 25 },
  { pattern: 'NVL2',            engines: [Engines.ORACLE], weight: 30 },
  { pattern: 'LISTAGG',         engines: [Engines.ORACLE], weight: 30 },
  { pattern: 'DECODE',          engines: [Engines.ORACLE], weight: 20 },
  { pattern: 'MINUS',           engines: [Engines.ORACLE], weight: 20 },

  // SQLite-specific
  { pattern: 'PRAGMA',          engines: [Engines.SQLITE], weight: 40 },
  { pattern: 'AUTOINCREMENT',   engines: [Engines.SQLITE], weight: 35 },
  { pattern: 'STRFTIME',        engines: [Engines.SQLITE], weight: 25 },
  { pattern: 'JULIANDAY',       engines: [Engines.SQLITE], weight: 30 },
  { pattern: 'LAST_INSERT_ROWID', engines: [Engines.SQLITE], weight: 30 },
];

const TYPE_SIGNALS = [
  { pattern: 'NVARCHAR',          engines: [Engines.SQLSERVER, Engines.ORACLE], weight: 25 },
  { pattern: 'VARCHAR2',          engines: [Engines.ORACLE], weight: 35 },
  { pattern: 'UNIQUEIDENTIFIER',  engines: [Engines.SQLSERVER], weight: 35 },
  { pattern: 'JSONB',             engines: [Engines.POSTGRESQL], weight: 40 },
  { pattern: 'UUID',              engines: [Engines.POSTGRESQL], weight: 20 },
  { pattern: 'SERIAL',            engines: [Engines.POSTGRESQL], weight: 25 },
  { pattern: 'BIGSERIAL',         engines: [Engines.POSTGRESQL], weight: 30 },
  { pattern: 'BYTEA',             engines: [Engines.POSTGRESQL], weight: 30 },
  { pattern: 'TSVECTOR',          engines: [Engines.POSTGRESQL], weight: 35 },
  { pattern: 'MONEY',             engines: [Engines.POSTGRESQL, Engines.SQLSERVER], weight: 10 },
  { pattern: 'HIERARCHYID',       engines: [Engines.SQLSERVER], weight: 35 },
  { pattern: 'DATETIMEOFFSET',    engines: [Engines.SQLSERVER], weight: 30 },
  { pattern: 'DATETIME2',         engines: [Engines.SQLSERVER], weight: 30 },
  { pattern: 'TINYTEXT',          engines: [Engines.MYSQL, Engines.MARIADB], weight: 20 },
  { pattern: 'MEDIUMTEXT',        engines: [Engines.MYSQL, Engines.MARIADB], weight: 20 },
  { pattern: 'LONGTEXT',          engines: [Engines.MYSQL, Engines.MARIADB], weight: 20 },
  { pattern: 'ENUM',              engines: [Engines.MYSQL, Engines.MARIADB, Engines.POSTGRESQL], weight: 10 },
];

const TEXT_SIGNALS = [
  { pattern: 'ON DUPLICATE KEY UPDATE', engines: [Engines.MYSQL, Engines.MARIADB], weight: 35 },
  { pattern: 'ON CONFLICT',             engines: [Engines.POSTGRESQL, Engines.SQLITE], weight: 25 },
  { pattern: 'DO NOTHING',              engines: [Engines.POSTGRESQL, Engines.SQLITE], weight: 25 },
  { pattern: 'WITH (NOLOCK)',            engines: [Engines.SQLSERVER], weight: 40 },
  { pattern: 'CROSS APPLY',             engines: [Engines.SQLSERVER], weight: 35 },
  { pattern: 'OUTER APPLY',             engines: [Engines.SQLSERVER], weight: 35 },
  { pattern: 'CONNECT BY',              engines: [Engines.ORACLE], weight: 35 },
  { pattern: 'START WITH',              engines: [Engines.ORACLE], weight: 25 },
  { pattern: 'FETCH FIRST',             engines: [Engines.ORACLE, Engines.POSTGRESQL, Engines.SQLSERVER], weight: 15 },
  { pattern: 'WITHOUT ROWID',           engines: [Engines.SQLITE], weight: 35 },
  { pattern: 'CHARACTER SET',           engines: [Engines.MYSQL, Engines.MARIADB], weight: 20 },
  { pattern: 'START TRANSACTION',       engines: [Engines.MYSQL, Engines.MARIADB, Engines.POSTGRESQL], weight: 20 },
  { pattern: 'DECLARE @',               engines: [Engines.SQLSERVER], weight: 35 },
  { pattern: 'DECLARE ',                engines: [Engines.ANSI, Engines.POSTGRESQL, Engines.SQLSERVER, Engines.ORACLE], weight: 8 },
  { pattern: 'ROLLBACK TO SAVEPOINT',   engines: [Engines.MYSQL, Engines.MARIADB, Engines.POSTGRESQL, Engines.SQLITE], weight: 20 },
  { pattern: 'RELEASE SAVEPOINT',       engines: [Engines.MYSQL, Engines.MARIADB, Engines.POSTGRESQL, Engines.SQLITE], weight: 20 },
  { pattern: 'LOCK TABLES',             engines: [Engines.MYSQL, Engines.MARIADB], weight: 35 },
  { pattern: 'UNLOCK TABLES',           engines: [Engines.MYSQL, Engines.MARIADB], weight: 35 },
  { pattern: 'SET SEARCH_PATH',         engines: [Engines.POSTGRESQL], weight: 35 },
  { pattern: 'SET @',                   engines: [Engines.SQLSERVER], weight: 35 },
];

/**
 * Detecta el motor SQL más probable y compatibilidades.
 * @param {Token[]} tokens - Lista de tokens del lexer
 * @param {string} queryText - Texto original de la consulta
 * @returns {{ engine: string, confidence: number, compatible: string[], incompatible: object[] }}
 */
function stripSQLComments(text) {
  return text
    .replace(/\/\*![\s\S]*?\*\//g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n\r]*/g, ' ');
}

function detectEngine(tokens, queryText) {
  const upperQuery = stripSQLComments(queryText).toUpperCase();

  const scores = {};
  ALL_ENGINES.forEach(e => { scores[e] = 0; });

  const tokenValues = new Set();
  tokens.forEach(t => {
    if (t.type !== TokenTypes.EOF && t.type !== TokenTypes.COMMENT) {
      tokenValues.add(t.value.toUpperCase());
    }
  });

  let validEngines = new Set(ALL_ENGINES);
  const incompatibleReasons = {};

  const applySignal = (sig) => {
    sig.engines.forEach(eng => {
      if (Object.prototype.hasOwnProperty.call(scores, eng)) scores[eng] += sig.weight;
    });
    if (sig.weight >= 15) {
       for (const eng of ALL_ENGINES) {
         if (!sig.engines.includes(eng)) {
           validEngines.delete(eng);
           incompatibleReasons[eng] = incompatibleReasons[eng] || [];
           incompatibleReasons[eng].push(sig.pattern);
         }
       }
    }
  };

  const hasDoubleCast = tokens.some(t => t.type === TokenTypes.DOUBLECOLON);
  if (hasDoubleCast) {
     applySignal({ pattern: 'cast (::)', engines: [Engines.POSTGRESQL], weight: 35 });
  }

  TOKEN_SIGNALS.forEach(sig => {
    if (tokenValues.has(sig.pattern)) applySignal(sig);
  });
  if (tokenValues.has('USE')) {
    scores[Engines.SQLSERVER] += 1;
  }

  TYPE_SIGNALS.forEach(sig => {
    if (tokenValues.has(sig.pattern)) applySignal(sig);
  });

  TEXT_SIGNALS.forEach(sig => {
    if (upperQuery.includes(sig.pattern)) applySignal(sig);
  });

  if (tokenValues.has('LIMIT')) {
    applySignal({ pattern: 'LIMIT', engines: [Engines.MYSQL, Engines.MARIADB, Engines.POSTGRESQL, Engines.SQLITE], weight: 15 });
  }

  let maxScore = 0;
  let detectedEngine = Engines.POSTGRESQL;
  for (const eng of ALL_ENGINES) {
    if (scores[eng] > maxScore) {
      maxScore = scores[eng];
      detectedEngine = eng;
    }
  }

  if (maxScore === 0) {
    return {
      engine: Engines.ANSI,
      confidence: 100,
      compatible: [...ALL_ENGINES],
      incompatible: []
    };
  }

  validEngines.add(detectedEngine);

  const compatible = Array.from(validEngines);
  const incompatible = ALL_ENGINES.filter(e => !validEngines.has(e)).map(e => ({
      engine: e,
      reasons: [...new Set(incompatibleReasons[e])]
  }));

  const totalScore = ALL_ENGINES.reduce((s, e) => s + scores[e], 0);
  let confidence = totalScore > 0 ? Math.round((maxScore / totalScore) * 100) : 50;
  if (confidence > 99) confidence = 100;
  if (totalScore === maxScore && maxScore >= 25) confidence = 100;

  return { engine: detectedEngine, confidence, compatible, incompatible };
}

module.exports = { detectEngine, Engines, ALL_ENGINES };
