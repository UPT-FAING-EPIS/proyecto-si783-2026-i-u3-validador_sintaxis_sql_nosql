const Engines = {
  MYSQL: 'MySQL',
  POSTGRESQL: 'PostgreSQL',
  SQLITE: 'SQLite',
  SQLSERVER: 'SQL Server',
  ORACLE: 'Oracle'
};

const EngineSignatures = {
  [Engines.MYSQL]: {
    types: ['TINYINT', 'MEDIUMINT', 'LONGTEXT', 'ENUM', 'SET', 'DATETIME', 'YEAR', 'MEDIUMTEXT', 'TINYTEXT'],
    keywords: ['AUTO_INCREMENT', 'SHOW DATABASES', 'SHOW TABLES', 'DESCRIBE', 'LIMIT', 'USE', 'ENGINE', 'CHARACTER SET', 'COLLATE', 'ON DUPLICATE KEY UPDATE', 'SQL_CALC_FOUND_ROWS', 'STRAIGHT_JOIN', 'IGNORE'],
    functions: ['NOW', 'CURDATE', 'CURTIME', 'CONCAT', 'IFNULL', 'DATE_ADD', 'DATEDIFF', 'GROUP_CONCAT', 'UNIX_TIMESTAMP', 'LAST_INSERT_ID']
  },
  [Engines.POSTGRESQL]: {
    types: ['UUID', 'JSON', 'JSONB', 'ARRAY', 'SERIAL', 'BIGSERIAL', 'TEXT', 'BYTEA', 'MONEY', 'CIDR', 'INET', 'MACADDR', 'TSVECTOR', 'TSQUERY'],
    keywords: ['RETURNING', 'ILIKE', 'SIMILAR TO', 'LIMIT', 'OFFSET', 'GENERATED ALWAYS AS IDENTITY', 'ON CONFLICT', 'DO NOTHING', 'DO UPDATE SET', 'NULLS FIRST', 'NULLS LAST', 'WINDOW', 'FILTER'],
    functions: ['NOW', 'STRING_AGG', 'COALESCE', 'CURRENT_DATE', 'CURRENT_TIMESTAMP', 'TO_CHAR', 'TO_DATE', 'MAKE_DATE', 'EXTRACT']
  },
  [Engines.SQLITE]: {
    types: ['INTEGER', 'TEXT', 'BLOB', 'REAL', 'NUMERIC'],
    keywords: ['AUTOINCREMENT', 'PRAGMA', 'LIMIT', 'OFFSET', 'WITHOUT ROWID', 'STRICT', 'ON CONFLICT IGNORE', 'ON CONFLICT REPLACE'],
    functions: ['IFNULL', 'STRFTIME', 'DATE', 'TIME', 'DATETIME', 'JULIANDAY', 'LAST_INSERT_ROWID']
  },
  [Engines.SQLSERVER]: {
    types: ['UNIQUEIDENTIFIER', 'NVARCHAR', 'DATETIME2', 'MONEY', 'SMALLMONEY', 'BIT', 'IMAGE', 'HIERARCHYID', 'DATETIMEOFFSET'],
    keywords: ['OUTPUT', 'TOP', 'IDENTITY', 'GO', 'NOLOCK', 'WITH (NOLOCK)', 'CROSS APPLY', 'OUTER APPLY', 'OPTION (RECOMPILE)', 'PIVOT', 'UNPIVOT'],
    functions: ['GETDATE', 'ISNULL', 'NEWID', 'LEN', 'CHARINDEX', 'DATENAME', 'DATEADD', 'DATEDIFF', 'SCOPE_IDENTITY']
  },
  [Engines.ORACLE]: {
    types: ['NUMBER', 'VARCHAR2', 'NVARCHAR2', 'CLOB', 'BLOB', 'BFILE', 'RAW', 'TIMESTAMP', 'ROWID', 'UROWID'],
    keywords: ['ROWNUM', 'MINUS', 'PACKAGE', 'SYNONYM', 'MATERIALIZED VIEW', 'RETURNING', 'CONNECT BY', 'START WITH', 'PRIOR', 'DUAL', 'FETCH FIRST', 'ROWS ONLY'],
    functions: ['SYSDATE', 'NVL', 'NVL2', 'TO_CHAR', 'TO_DATE', 'TO_NUMBER', 'WM_CONCAT', 'LISTAGG', 'TRUNC', 'INSTR', 'SUBSTR']
  }
};

function detectEngine(tokens, queryText) {
  const upperQuery = queryText.toUpperCase();
  const scores = {
    [Engines.MYSQL]: 0,
    [Engines.POSTGRESQL]: 0,
    [Engines.SQLITE]: 0,
    [Engines.SQLSERVER]: 0,
    [Engines.ORACLE]: 0
  };

  const idTokens = tokens.filter(t => t.type === 'IDENTIFIER' || t.type === 'KEYWORD').map(t => t.value.toUpperCase());

  for (const engine in EngineSignatures) {
    const sig = EngineSignatures[engine];
    
    // Check types & keywords
    sig.types.forEach(type => {
      if (idTokens.includes(type)) scores[engine] += 15;
    });
    
    sig.keywords.forEach(kw => {
      if (kw.includes(' ')) {
        if (upperQuery.includes(kw)) scores[engine] += 20;
      } else {
        if (idTokens.includes(kw)) scores[engine] += 15;
      }
    });

    sig.functions.forEach(fn => {
      if (idTokens.includes(fn)) scores[engine] += 10;
    });
  }

  // Extra heuristics explicit in prompt requirements
  if (upperQuery.includes('TOP') && !upperQuery.includes('LIMIT')) scores[Engines.SQLSERVER] += 30;
  if (upperQuery.includes('LIMIT')) {
    scores[Engines.MYSQL] += 10;
    scores[Engines.POSTGRESQL] += 10;
    scores[Engines.SQLITE] += 10;
  }
  if (upperQuery.includes('JSONB')) scores[Engines.POSTGRESQL] += 40;
  if (upperQuery.includes('VARCHAR2')) scores[Engines.ORACLE] += 40;
  if (upperQuery.includes('UNIQUEIDENTIFIER')) scores[Engines.SQLSERVER] += 40;
  if (upperQuery.includes('PRAGMA')) scores[Engines.SQLITE] += 40;
  if (upperQuery.includes('CURDATE()')) scores[Engines.MYSQL] += 30;
  if (upperQuery.includes('GETDATE()')) scores[Engines.SQLSERVER] += 30;
  if (upperQuery.includes('SYSDATE') || upperQuery.includes('DUAL')) scores[Engines.ORACLE] += 30;
  if (upperQuery.includes('ROWNUM')) scores[Engines.ORACLE] += 30;

  // Determinar el máximo
  let maxScore = -1;
  let detectedEngine = Engines.POSTGRESQL; // Default fallback

  let totalScore = 0;
  for (const engine in scores) {
    totalScore += scores[engine];
    if (scores[engine] > maxScore) {
      maxScore = scores[engine];
      detectedEngine = engine;
    }
  }

  let compatible = [];
  if (maxScore === 0) {
    // Si no hay palabras exclusivas, es SQL estándar genérico
    compatible = [Engines.MYSQL, Engines.POSTGRESQL, Engines.SQLITE, Engines.SQLSERVER, Engines.ORACLE];
    return { engine: detectedEngine, confidence: 50, compatible };
  }

  for (const eng in scores) {
    // Si un motor tiene una puntuación no nula, o si la query es tan estándar que no rompe nada
    if (scores[eng] > 0 || maxScore < 30) { 
      if (!compatible.includes(eng)) compatible.push(eng);
    }
  }
  
  if (compatible.length === 0) compatible = [detectedEngine];

  let confidence = Math.round((maxScore / totalScore) * 100);
  if (confidence > 100) confidence = 99; // Cap at 99 unless absolute certainty
  if (totalScore === maxScore && maxScore > 20) confidence = 100;

  return { engine: detectedEngine, confidence, compatible };
}

module.exports = { detectEngine, Engines };
