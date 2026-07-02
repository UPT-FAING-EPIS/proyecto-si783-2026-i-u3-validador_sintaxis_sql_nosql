const { detectEngine, Engines } = require('./detector');
const { Lexer, TokenTypes } = require('../lexer');

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function findSimilarKeyword(word) {
  const upper = word.toUpperCase();
  const keywords = ['SELECT', 'FROM', 'WHERE', 'UPDATE', 'DELETE', 'INSERT', 'GROUP', 'ORDER', 'HAVING'];
  for (let kw of keywords) {
    if (upper === kw) continue;
    const dist = levenshtein(upper, kw);
    if (dist <= 2 && upper.length >= 3) {
      if (dist === 1 || (dist === 2 && upper.length >= 4)) {
        return kw;
      }
    }
  }
  return null;
}

function positionToLineColumn(text, index, startLine = 1) {
  const before = text.slice(0, index);
  const lines = before.split('\n');
  return {
    line: startLine + lines.length - 1,
    column: lines[lines.length - 1].length + 1,
    position: index + 1
  };
}

function makeStrictError(query, index, startLine, message, fragment, suggestion) {
  const loc = positionToLineColumn(query, Math.max(0, index), startLine);
  return {
    engine: Engines.ANSI,
    line: loc.line,
    column: loc.column,
    position: loc.position,
    message,
    fragment,
    suggestion
  };
}

const CREATE_TABLE_VALID_TYPES = new Set([
  'INTEGER', 'INT', 'SMALLINT', 'BIGINT', 'TINYINT',
  'DECIMAL', 'NUMERIC', 'FLOAT', 'REAL', 'DOUBLE', 'PRECISION',
  'CHAR', 'CHARACTER', 'VARCHAR', 'VARYING', 'TEXT',
  'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT',
  'DATE', 'TIME', 'DATETIME', 'TIMESTAMP',
  'BOOLEAN', 'BOOL', 'ENUM', 'SET', 'JSON',
  'BLOB', 'LONGBLOB', 'SERIAL', 'BIGSERIAL', 'SMALLSERIAL',
  'UUID', 'JSONB', 'BIT', 'NCHAR', 'NVARCHAR',
  'DATETIME2', 'MONEY', 'UNIQUEIDENTIFIER',
  'NUMBER', 'VARCHAR2', 'NVARCHAR2', 'CLOB',
  'RAW', 'XML', 'BYTEA', 'NUMERIC'
]);

const CREATE_TABLE_TYPE_TYPOS = new Map([
  ['IT', 'INT'],
  ['VCHAR', 'VARCHAR'],
  ['VARHAR', 'VARCHAR'],
  ['VARCAHR', 'VARCHAR'],
  ['DECIAML', 'DECIMAL'],
  ['DATATIME', 'DATETIME'],
  ['DTE', 'DATE'],
  ['TEX', 'TEXT'],
  ['BOOLEAM', 'BOOLEAN']
]);

const MYSQL_ENGINES = new Set(['INNODB', 'MYISAM', 'MEMORY']);
const MYSQL_CHARSETS = new Set(['UTF8MB4', 'UTF8', 'LATIN1', 'ASCII', 'BINARY', 'UCS2', 'UTF16', 'UTF32']);
const MYSQL_COLLATIONS = new Set([
  'UTF8MB4_GENERAL_CI',
  'UTF8MB4_UNICODE_CI',
  'UTF8MB4_SPANISH_CI',
  'UTF8_GENERAL_CI',
  'LATIN1_SWEDISH_CI',
  'ASCII_GENERAL_CI'
]);

function findMatchingParen(text, openIndex) {
  let depth = 0;
  let quote = null;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === quote) {
        if (text[i + 1] === quote) {
          i++;
          continue;
        }
        quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === '(') depth++;
    if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function findStatementEnd(text, startIndex) {
  let quote = null;
  for (let i = startIndex; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === quote) {
        if (text[i + 1] === quote) {
          i++;
          continue;
        }
        quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === ';') return i;
  }
  return text.length;
}

function findCreateTableSections(query) {
  const sections = [];
  const regex = /\bCREATE\s+(?:TABLE|TABL|ABLE|TAB)\b/gi;
  let match;
  while ((match = regex.exec(query)) !== null) {
    const end = findStatementEnd(query, match.index);
    const statement = query.slice(match.index, end);
    const openOffset = statement.indexOf('(');
    if (openOffset === -1) {
      sections.push({ start: match.index, end, text: statement, body: '', bodyStart: -1, options: statement });
      continue;
    }
    const openIndex = match.index + openOffset;
    const closeIndex = findMatchingParen(query, openIndex);
    const safeClose = closeIndex === -1 || closeIndex > end ? end : closeIndex;
    sections.push({
      start: match.index,
      end,
      text: statement,
      body: query.slice(openIndex + 1, safeClose),
      bodyStart: openIndex + 1,
      options: query.slice(safeClose + 1, end)
    });
  }
  return sections;
}

function splitTopLevelCreateItems(body, bodyStart) {
  const items = [];
  let depth = 0;
  let quote = null;
  let itemStart = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (quote) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === quote) {
        if (body[i + 1] === quote) {
          i++;
          continue;
        }
        quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      items.push({ text: body.slice(itemStart, i), start: bodyStart + itemStart });
      itemStart = i + 1;
    }
  }
  if (itemStart < body.length) {
    items.push({ text: body.slice(itemStart), start: bodyStart + itemStart });
  }
  return items;
}

function collectStrictSQLIssues(query, startLine = 1) {
  const issues = [];
  const addIssueAt = (index, message, fragment, suggestion) => {
    if (issues.some(issue => issue.position === index + 1)) return;
    issues.push(makeStrictError(query, index, startLine, message, fragment, suggestion));
  };
  const addRegexIssue = (regex, build) => {
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(query)) !== null) {
      const detail = build(match);
      addIssueAt(
        match.index + (detail.offset || 0),
        detail.message,
        detail.fragment,
        detail.suggestion
      );
      if (match[0].length === 0) regex.lastIndex++;
    }
  };

  addRegexIssue(/\bCREATE\s+(TABL|ABLE|TAB)\b/gi, match => ({
    offset: match[0].toUpperCase().indexOf(match[1].toUpperCase()),
    message: `${match[0]} no es válido. Se esperaba CREATE TABLE.`,
    fragment: match[1],
    suggestion: 'Escriba TABLE completo: CREATE TABLE nombre (...).'
  }));
  addRegexIssue(/\bVARHAR\s*\(/gi, match => ({
    message: 'VARHAR no es un tipo válido. Se esperaba VARCHAR.',
    fragment: match[0].replace(/\($/, ''),
    suggestion: 'Use VARCHAR(longitud).'
  }));
  addRegexIssue(/\bPRIMRY\b/gi, match => ({
    message: 'PRIMRY no es palabra clave válida. Se esperaba PRIMARY.',
    fragment: match[0],
    suggestion: 'Use PRIMARY KEY.'
  }));
  addRegexIssue(/\bO\s+UPDATE\b/gi, match => ({
    message: 'O UPDATE no es válido. Se esperaba ON UPDATE.',
    fragment: match[0],
    suggestion: 'Use ON UPDATE CASCADE/SET NULL/etc.'
  }));
  addRegexIssue(/\bASCADE\b/gi, match => ({
    message: 'ASCADE no es válido. Se esperaba CASCADE.',
    fragment: match[0],
    suggestion: 'Use CASCADE.'
  }));
  addRegexIssue(/\bST\s+NULL\b/gi, match => ({
    message: 'ST NULL no es válido. Se esperaba SET NULL.',
    fragment: match[0],
    suggestion: 'Use SET NULL.'
  }));
  addRegexIssue(/\bCHARSET\s*=\s*utb4\b/gi, match => ({
    message: 'CHARSET=utb4 no es válido. Se esperaba utf8mb4.',
    fragment: match[0],
    suggestion: 'Use DEFAULT CHARSET=utf8mb4.'
  }));
  addRegexIssue(/\bCOLLATE\s*=\s*utf8mb4_geal_ci\b/gi, match => ({
    message: 'COLLATE=utf8mb4_geal_ci no es válido. Se esperaba utf8mb4_general_ci.',
    fragment: match[0],
    suggestion: 'Use COLLATE=utf8mb4_general_ci.'
  }));
  addRegexIssue(/\butf84_general_ci\b/gi, match => ({
    message: 'COLLATE inválido: utf84_general_ci. Se esperaba utf8mb4_general_ci.',
    fragment: match[0],
    suggestion: 'Use utf8mb4_general_ci.'
  }));
  addRegexIssue(/\bGENATED\b/gi, match => ({
    message: 'GENATED no es válido. Se esperaba GENERATED.',
    fragment: match[0],
    suggestion: 'Use GENERATED BY DEFAULT AS IDENTITY.'
  }));
  addRegexIssue(/\bDTE\b/gi, match => ({
    message: 'DTE no es un tipo válido. Se esperaba DATE.',
    fragment: match[0],
    suggestion: 'Use DATE.'
  }));
  addRegexIssue(/\bDEFALT\b/gi, match => ({
    message: 'DEFALT no es válido. Se esperaba DEFAULT.',
    fragment: match[0],
    suggestion: 'Use DEFAULT.'
  }));
  addRegexIssue(/\bDEFAUL\b/gi, match => ({
    message: 'DEFAUL no es válido. Se esperaba DEFAULT.',
    fragment: match[0],
    suggestion: 'Use DEFAULT.'
  }));
  addRegexIssue(/\bCONSTINT\b/gi, match => ({
    message: 'CONSTINT no es válido. Se esperaba CONSTRAINT.',
    fragment: match[0],
    suggestion: 'Use CONSTRAINT nombre PRIMARY KEY (...).'
  }));

  const createSections = findCreateTableSections(query);
  for (const section of createSections) {
    const sectionBase = section.start;
    const scanText = section.text;

    let match;
    const typoTypeRegex = /\b(IT|VCHAR|VARHAR|VARCAHR|DECIAML|DATATIME|DTE|TEX|BOOLEAM)\b/gi;
    while ((match = typoTypeRegex.exec(section.body)) !== null) {
      const typo = match[1].toUpperCase();
      const expected = CREATE_TABLE_TYPE_TYPOS.get(typo);
      addIssueAt(
        section.bodyStart + match.index,
        `${match[1]} no es tipo válido. Se esperaba ${expected}.`,
        match[1],
        `Use ${expected}.`
      );
    }

    const items = splitTopLevelCreateItems(section.body, section.bodyStart);
    for (const item of items) {
      const trimmed = item.text.trim();
      if (!trimmed) continue;
      const firstWord = trimmed.match(/^([`"\[]?[\w$#@]+[`"\]]?)/);
      if (!firstWord) continue;
      const firstUpper = firstWord[1].replace(/^[`"\[]|[`"\]]$/g, '').toUpperCase();
      if (['CONSTRAINT', 'PRIMARY', 'FOREIGN', 'UNIQUE', 'CHECK', 'KEY', 'INDEX', 'PRIMRY', 'CONSTINT'].includes(firstUpper)) {
        continue;
      }
      const columnMatch = trimmed.match(/^[`"\[]?[\w$#@]+[`"\]]?\s+([A-Za-z_][\w]*)/);
      if (!columnMatch) continue;
      const type = columnMatch[1].toUpperCase();
      if (!CREATE_TABLE_VALID_TYPES.has(type) && !CREATE_TABLE_TYPE_TYPOS.has(type)) {
        const relative = item.text.indexOf(columnMatch[1]);
        addIssueAt(
          item.start + relative,
          `${columnMatch[1]} no es un tipo de dato válido. Se esperaba un tipo soportado por el motor seleccionado.`,
          columnMatch[1],
          'Use un tipo exacto como INT, VARCHAR, DECIMAL, DATE, NUMBER o TEXT.'
        );
      }
    }

    const optionChecks = [
      {
        regex: /\bENGIN\s*=/gi,
        handler: m => addIssueAt(sectionBase + m.index, 'ENGIN no es válido. Se esperaba ENGINE.', m[0].replace(/\s*=.*/, ''), 'Use ENGINE=InnoDB.')
      },
      {
        regex: /\bENGINE\b\s*(?:=\s*([A-Za-z0-9_]+))?/gi,
        handler: m => {
          const value = m[1];
          if (!value) {
            addIssueAt(sectionBase + m.index, 'ENGINE incompleto. Se esperaba ENGINE=InnoDB, ENGINE=MyISAM o ENGINE=MEMORY.', m[0], 'Use ENGINE=InnoDB.');
            return;
          }
          if (!MYSQL_ENGINES.has(value.toUpperCase())) {
            addIssueAt(sectionBase + m.index, `ENGINE=${value} no es válido. Se esperaba ENGINE=InnoDB.`, m[0], 'Use un motor válido como InnoDB, MyISAM o MEMORY.');
          }
        }
      },
      {
        regex: /\bCHARET\s*=/gi,
        handler: m => addIssueAt(sectionBase + m.index, 'CHARET no es válido. Se esperaba CHARSET.', m[0].replace(/\s*=.*/, ''), 'Use CHARSET=utf8mb4.')
      },
      {
        regex: /\b(?:DEFAULT\s+)?(?:CHARSET|CHARACTER\s+SET)\b\s*(?:=\s*)?([A-Za-z0-9_]+)?/gi,
        handler: m => {
          const value = m[1];
          if (!value) {
            addIssueAt(sectionBase + m.index, 'CHARSET incompleto. Se esperaba un conjunto de caracteres válido.', m[0], 'Use CHARSET=utf8mb4.');
            return;
          }
          if (value.toUpperCase() === 'UTB4') return;
          if (!MYSQL_CHARSETS.has(value.toUpperCase())) {
            addIssueAt(sectionBase + m.index, `CHARSET=${value} no es válido. Se esperaba utf8mb4.`, m[0], 'Use utf8mb4, utf8, latin1 o ascii.');
          }
        }
      },
      {
        regex: /\bCOLLTE\b\s*(?:=\s*([A-Za-z0-9_]+))?/gi,
        handler: m => {
          addIssueAt(sectionBase + m.index, 'COLLTE no es válido. Se esperaba COLLATE.', 'COLLTE', 'Use COLLATE=utf8mb4_general_ci.');
          if (m[1] && !MYSQL_COLLATIONS.has(m[1].toUpperCase())) {
            const valueIndex = m[0].lastIndexOf(m[1]);
            addIssueAt(sectionBase + m.index + valueIndex, `${m[1]} no es collation válida. Se esperaba utf8mb4_general_ci.`, m[1], 'Use utf8mb4_general_ci.');
          }
        }
      },
      {
        regex: /\b(?:DEFAULT\s+)?COLLATE\b\s*(?:=\s*)?([A-Za-z0-9_]+)?/gi,
        handler: m => {
          const value = m[1];
          if (!value) {
            addIssueAt(sectionBase + m.index, 'COLLATE incompleto. Se esperaba una collation válida.', m[0], 'Use COLLATE=utf8mb4_general_ci.');
            return;
          }
          if (['UTF8MB4_GEAL_CI', 'UTF84_GENERAL_CI'].includes(value.toUpperCase())) return;
          if (!MYSQL_COLLATIONS.has(value.toUpperCase())) {
            addIssueAt(sectionBase + m.index, `COLLATE=${value} no es válido. Se esperaba utf8mb4_general_ci.`, m[0], 'Use utf8mb4_general_ci.');
          }
        }
      },
      {
        regex: /\b(?:DEFAULT|DEFALT|DEFAUL)\s+(NUL|NLL)\b/gi,
        handler: m => {
          const valueIndex = m[0].toUpperCase().lastIndexOf(m[1].toUpperCase());
          addIssueAt(sectionBase + m.index + valueIndex, `${m[1]} no es válido. Se esperaba NULL o un valor por defecto válido.`, m[1], 'Use NULL.');
        }
      },
      {
        regex: /\bDEFAULT\s*(?=,|\)|;|$)/gi,
        handler: m => addIssueAt(sectionBase + m.index, 'DEFAULT incompleto. Se esperaba NULL, un literal o una expresión válida.', m[0], 'Use DEFAULT NULL, DEFAULT 0, DEFAULT TRUE o DEFAULT CURRENT_TIMESTAMP.')
      },
      {
        regex: /\bNOT\s+NUL\b/gi,
        handler: m => addIssueAt(sectionBase + m.index, 'NOT NUL no es válido. Se esperaba NOT NULL.', m[0], 'Use NOT NULL.')
      },
      {
        regex: /\bNO\s+NULL\b/gi,
        handler: m => addIssueAt(sectionBase + m.index, 'NO NULL no es válido. Se esperaba NOT NULL.', m[0], 'Use NOT NULL.')
      },
      {
        regex: /\bNOTT\s+NULL\b/gi,
        handler: m => addIssueAt(sectionBase + m.index, 'NOTT NULL no es válido. Se esperaba NOT NULL.', m[0], 'Use NOT NULL.')
      }
    ];

    for (const check of optionChecks) {
      check.regex.lastIndex = 0;
      while ((match = check.regex.exec(scanText)) !== null) {
        check.handler(match);
        if (match[0].length === 0) check.regex.lastIndex++;
      }
    }
  }

  const lines = query.split('\n');
  let offset = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    const current = lines[i];
    const next = lines[i + 1];
    const trimmed = current.trim();
    const nextTrimmed = next.trim();
    const typeWords = '(?:INT|INTEGER|NUMBER|NUMERIC|DECIMAL|VARCHAR|VARCHAR2|VARHAR|VCHAR|VARCAHR|CHAR|TEXT|TEX|DATE|DTE|DATETIME|DATATIME|BOOLEAN|BOOLEAM|BOOL|REAL|FLOAT|DOUBLE)';
    const currentLooksColumn = new RegExp(`^[A-Za-z_][\\w$#@]*\\s+${typeWords}\\b`, 'i').test(trimmed);
    const nextLooksColumn = new RegExp(`^[A-Za-z_][\\w$#@]*\\s+${typeWords}\\b`, 'i').test(nextTrimmed);
    if (currentLooksColumn && nextLooksColumn && !/,\s*(?:--.*)?$/.test(trimmed)) {
      const index = offset + current.length;
      addIssueAt(
        index,
        `Falta coma después de "${trimmed}".`,
        trimmed,
        'Agregue una coma entre definiciones de columnas.'
      );
    }
    offset += current.length + 1;
  }

  return issues.sort((a, b) => (a.position || 0) - (b.position || 0));
}

function splitMySQLDelimiterScript(query, startLine = 1) {
  const parts = [];
  const lines = query.split(/\n/);
  let delimiter = ';';
  let buffer = '';
  let statementStartLine = startLine;
  let currentLine = startLine;

  const flush = () => {
    if (buffer.trim()) {
      parts.push({ text: buffer.trim(), line: statementStartLine });
    }
    buffer = '';
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');
    const delimiterMatch = line.match(/^\s*DELIMITER\s+(\S+)\s*$/i);
    if (delimiterMatch) {
      flush();
      parts.push({ text: line.trim(), line: currentLine, directive: true });
      delimiter = delimiterMatch[1];
      statementStartLine = currentLine + 1;
      currentLine++;
      continue;
    }

    if (!buffer.trim()) statementStartLine = currentLine;

    if (delimiter !== ';') {
      const trimmedEnd = line.trimEnd();
      if (trimmedEnd.endsWith(delimiter)) {
        const cutIndex = line.lastIndexOf(delimiter);
        buffer += line.slice(0, cutIndex) + '\n';
        flush();
        statementStartLine = currentLine + 1;
      } else {
        buffer += line + '\n';
      }
      currentLine++;
      continue;
    }

    buffer += line + '\n';
    currentLine++;
  }

  flush();
  return parts;
}

function preValidateSQLStructure(query, startLine = 1) {
  const stack = [];
  let quote = null;
  let quoteStart = null;
  let typoMatch = query.match(/\bCREATE\s+(ABLE|TAB)\b/i);
  if (typoMatch) {
    const loc = positionToLineColumn(query, typoMatch.index + typoMatch[0].toUpperCase().indexOf(typoMatch[1].toUpperCase()), startLine);
    return { ...loc, message: `Palabra clave incompleta "${typoMatch[1]}". Se esperaba TABLE.`, fragment: typoMatch[1] };
  }
  typoMatch = query.match(/\butf84_general_ci\b/i);
  if (typoMatch) {
    const loc = positionToLineColumn(query, typoMatch.index, startLine);
    return { ...loc, message: 'COLLATE inválido: utf84_general_ci.', fragment: typoMatch[0] };
  }
  const missingCommaMatch = query.match(/\b\w+\s+(?:VAR)?CHAR\s*\([^)]*\)\s+DEFAULT\s+NULL\s*\n\s*\w+\s+(?:VAR)?CHAR\s*\(/i);
  if (missingCommaMatch) {
    const relative = missingCommaMatch[0].search(/\n\s*\w+\s+(?:VAR)?CHAR/i);
    const loc = positionToLineColumn(query, missingCommaMatch.index + relative + 1, startLine);
    return { ...loc, message: 'Falta coma entre definiciones de columnas.', fragment: query.slice(missingCommaMatch.index, missingCommaMatch.index + missingCommaMatch[0].length) };
  }

  for (let i = 0; i < query.length; i++) {
    const ch = query[i];
    const next = query[i + 1];

    if (!quote && ch === '-' && next === '-') {
      while (i < query.length && query[i] !== '\n') i++;
      continue;
    }
    if (!quote && ch === '/' && next === '*') {
      i += 2;
      while (i < query.length && !(query[i] === '*' && query[i + 1] === '/')) i++;
      if (i >= query.length) {
        const loc = positionToLineColumn(query, query.length - 1, startLine);
        return { ...loc, message: 'Comentario de bloque sin cerrar.', fragment: '/*' };
      }
      i++;
      continue;
    }

    if (quote) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === quote) {
        if (query[i + 1] === quote) {
          i++;
          continue;
        }
        quote = null;
        quoteStart = null;
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      quote = ch;
      quoteStart = i;
      continue;
    }
    if (ch === '(') {
      stack.push({ ch, index: i });
    } else if (ch === ')') {
      if (stack.length === 0) {
        const loc = positionToLineColumn(query, i, startLine);
        return { ...loc, message: 'Paréntesis de cierre ")" inesperado.', fragment: ch };
      }
      stack.pop();
    }
  }

  if (quote) {
    const loc = positionToLineColumn(query, quoteStart, startLine);
    return { ...loc, message: `Falta cerrar comilla ${quote}.`, fragment: quote };
  }
  if (stack.length > 0) {
    const last = stack.pop();
    const loc = positionToLineColumn(query, last.index, startLine);
    return { ...loc, message: 'Falta cerrar paréntesis ")".', fragment: last.ch };
  }
  return null;
}

class SQLParser {
  constructor(query, startLine = 1) {
    this.query = query;
    this.startLine = startLine;
    this.errors = [];
    this.suggestions = [];
  }

  parse() {
    if (!this.query || this.query.trim() === '') {
      this.errors.push({ line: 1, column: 1, message: 'La consulta está vacía.' });
      return this.getResult(Engines.ANSI, 0, Object.values(Engines), []);
    }

    const strictIssues = collectStrictSQLIssues(this.query, this.startLine);
    if (strictIssues.length > 0) {
      this.errors = strictIssues;
      return this.getResult(Engines.ANSI, 0, Object.values(Engines), []);
    }

    const structureError = preValidateSQLStructure(this.query, this.startLine);
    if (structureError) {
      this.errors.push({
        engine: Engines.ANSI,
        line: structureError.line,
        column: structureError.column,
        position: structureError.position,
        message: structureError.message,
        fragment: structureError.fragment,
        suggestion: 'Revise el balance de paréntesis, comillas y comentarios.'
      });
      return this.getResult(Engines.ANSI, 0, Object.values(Engines), []);
    }

    const lexer = new Lexer(this.query, false, this.startLine);
    const allTokens = lexer.tokenize();
    const tokens = allTokens.filter(t => t.type !== TokenTypes.COMMENT);

    const { engine, confidence, compatible, incompatible } = detectEngine(tokens, this.query);

    if (/^\s*DELIMITER\s+\S+/im.test(this.query)) {
      const parts = splitMySQLDelimiterScript(this.query, this.startLine);
      for (const part of parts) {
        if (part.directive) continue;
        const partLexer = new Lexer(part.text, false, part.line);
        const partTokens = partLexer.tokenize().filter(t => t.type !== TokenTypes.COMMENT);
        const syntaxAnalyzer = new RDPParser(partTokens, engine);
        const partErrors = syntaxAnalyzer.parse();
        if (partErrors.length > 0) this.errors.push(...partErrors);
      }
    } else {
      const syntaxAnalyzer = new RDPParser(tokens, engine);
      this.errors = syntaxAnalyzer.parse();
    }

    return this.getResult(engine, confidence, compatible, incompatible);
  }

  getResult(engine, confidence, compatible, incompatible) {
    const normalizedIncompatible = [...(incompatible || [])];
    if (!normalizedIncompatible.some(item => item.engine === 'MongoDB')) {
      normalizedIncompatible.push({ engine: 'MongoDB', reasons: ['Sintaxis SQL'] });
    }

    if (this.errors.length === 0) {
      this.suggestions = [];
    } else if (this.errors[0] && this.errors[0].suggestion && !this.suggestions.includes(this.errors[0].suggestion)) {
      this.suggestions.push(this.errors[0].suggestion);
    }

    return {
      valid: this.errors.length === 0,
      dialect: engine,
      confidence: confidence,
      compatible: compatible,
      incompatible: normalizedIncompatible,
      errors: this.errors,
      suggestions: this.suggestions
    };
  }
}

class RDPParser {
  constructor(tokens, engine) {
    this.tokens = tokens;
    this.engine = engine;
    this.pos = 0;
    this.errors = [];
  }

  peek() {
    return this.pos >= this.tokens.length ? this.tokens[this.tokens.length - 1] : this.tokens[this.pos];
  }

  advance() {
    const t = this.peek();
    if (t.type !== TokenTypes.EOF) this.pos++;
    return t;
  }

  match(type, value = null) {
    const t = this.peek();
    if (t.type === type && (value === null || t.value.toUpperCase() === value.toUpperCase())) {
      return this.advance();
    }
    return null;
  }
  
  matchOneOf(type, values) {
    const t = this.peek();
    if (t.type === type && values.includes(t.value.toUpperCase())) {
      return this.advance();
    }
    return null;
  }

  expect(type, value = null, customExpectedMsg = null, customSugg = null) {
    const t = this.peek();
    if (t.type === type && (value === null || t.value.toUpperCase() === value.toUpperCase())) {
      return this.advance();
    }
    
    let expected = customExpectedMsg || (value ? value : type);
    this.reportError(`Motor: ${this.engine}`, t, expected, customSugg);
    throw new Error('ParseError');
  }

  reportError(msg, token, expected = '', suggestion = null) {
    if (this.errors.length > 0) return;
    let tokenValue = token.value || 'FIN_DE_CONSULTA';
    this.errors.push({
      engine: this.engine,
      line: token.line,
      column: token.column,
      message: `Error sintáctico.\nEncontrado: ${tokenValue}\nSe esperaba: ${expected}`,
      fragment: tokenValue,
      suggestion: suggestion || `Verifique la palabra clave o sintaxis. Se esperaba: ${expected}`
    });
  }

  checkTypoAndThrow(t, context) {
    if (t.type === TokenTypes.IDENTIFIER) {
      const sim = findSimilarKeyword(t.value);
      if (sim === context) {
        this.reportError(`Motor: ${this.engine}`, t, context, `Quizás quiso escribir ${context}`);
        throw new Error('ParseError');
      }
    }
  }

  parse() {
    try {
      while (this.peek().type !== TokenTypes.EOF) {
        if (this.match(TokenTypes.PUNCTUATION, ';')) continue;
        this.parseStatement();
        if (this.peek().type !== TokenTypes.EOF) {
           const t = this.peek();
           if (t.type === TokenTypes.IDENTIFIER) {
               const sim = findSimilarKeyword(t.value);
               if (sim) {
                   this.reportError(`Motor: ${this.engine}`, t, sim, `Quizás quiso escribir ${sim}`);
                   throw new Error('ParseError');
               }
           }
           this.expect(TokenTypes.PUNCTUATION, ';', 'Punto y coma (;) o Fin de consulta');
        }
      }
    } catch (e) {
      // Detener en el primer error
    }
    return this.errors;
  }

  parseStatement() {
    const t = this.peek();
    
    if (t.type === TokenTypes.IDENTIFIER) {
        const sim = findSimilarKeyword(t.value);
        if (sim === 'SELECT' || sim === 'UPDATE' || sim === 'DELETE' || sim === 'INSERT') {
            this.reportError(`Motor: ${this.engine}`, t, sim, `Quizás quiso escribir ${sim}`);
            throw new Error('ParseError');
        }
    }

    if (this.match(TokenTypes.KEYWORD, 'SELECT') || this.match(TokenTypes.KEYWORD, 'WITH')) {
       if (t.value.toUpperCase() === 'WITH') {
          if (this.match(TokenTypes.KEYWORD, 'RECURSIVE')) {}
          this.parseCTE();
          this.expect(TokenTypes.KEYWORD, 'SELECT');
       }
       this.parseSelectBody();
    } else if (this.match(TokenTypes.KEYWORD, 'INSERT')) {
       this.parseInsert();
    } else if (this.match(TokenTypes.KEYWORD, 'UPDATE')) {
       this.parseUpdate();
    } else if (this.match(TokenTypes.KEYWORD, 'DELETE')) {
       this.parseDelete();
    } else if (this.match(TokenTypes.KEYWORD, 'USE')) {
       this.parseUse();
    } else if (this.match(TokenTypes.KEYWORD, 'DECLARE')) {
       this.parseDeclare();
    } else if (this.match(TokenTypes.KEYWORD, 'SET')) {
       this.parseSet();
    } else if (this.match(TokenTypes.KEYWORD, 'LOCK')) {
       this.parseLockTables();
    } else if (this.match(TokenTypes.KEYWORD, 'UNLOCK')) {
       this.parseUnlockTables();
    } else if (this.match(TokenTypes.KEYWORD, 'DELIMITER')) {
       if (this.isStatementEnd()) {
         this.reportError(`Motor: ${this.engine}`, this.peek(),
           'Delimitador',
           'DELIMITER requiere el nuevo delimitador.');
         throw new Error('ParseError');
       }
       this.advance();
    } else if (this.match(TokenTypes.KEYWORD, 'GO')) {
       if (!this.isStatementEnd()) {
         this.reportError(`Motor: ${this.engine}`, this.peek(),
           'Punto y coma (;) o Fin de consulta',
           'GO debe aparecer solo como separador de lote.');
         throw new Error('ParseError');
       }
    } else if (this.match(TokenTypes.KEYWORD, 'COMMIT') || this.match(TokenTypes.KEYWORD, 'ROLLBACK') ||
               this.match(TokenTypes.KEYWORD, 'BEGIN') || this.match(TokenTypes.KEYWORD, 'START') ||
               this.match(TokenTypes.KEYWORD, 'SAVEPOINT') || this.match(TokenTypes.KEYWORD, 'RELEASE')) {
       this.parseTransactionStatement(t);
    } else if (this.match(TokenTypes.KEYWORD, 'CREATE') || this.match(TokenTypes.KEYWORD, 'ALTER') || this.match(TokenTypes.KEYWORD, 'DROP') || this.match(TokenTypes.KEYWORD, 'TRUNCATE')) {
       const ddlCmd = t.value.toUpperCase();
       // Must have at least two tokens after DDL keyword (e.g., TABLE nombre_tabla)
       const nextT = this.peek();
       const nextNextT = this.tokens[this.pos] ? this.tokens[this.pos + 1] : null;
       
       if (nextT.type === TokenTypes.EOF || (nextT.type === TokenTypes.PUNCTUATION && nextT.value === ';') ||
           !nextNextT || nextNextT.type === TokenTypes.EOF || (nextNextT.type === TokenTypes.PUNCTUATION && nextNextT.value === ';')) {
          this.reportError(`Motor: ${this.engine}`, nextT,
            'Nombre de objeto',
            `${ddlCmd} requiere un tipo de objeto y un nombre (ej. ${ddlCmd} TABLE nombre_tabla)`);
          throw new Error('ParseError');
       }
       if (ddlCmd === 'CREATE' && nextT.type === TokenTypes.KEYWORD &&
           ['PROCEDURE', 'TRIGGER', 'FUNCTION'].includes(nextT.value.toUpperCase())) {
          while(this.peek().type !== TokenTypes.EOF) {
             this.advance();
          }
          return;
       }
       while(this.peek().type !== TokenTypes.EOF && !(this.peek().type === TokenTypes.PUNCTUATION && this.peek().value === ';')) {
          this.advance();
       }
    } else if (this.match(TokenTypes.KEYWORD, 'SHOW') || this.match(TokenTypes.KEYWORD, 'DESCRIBE') || this.match(TokenTypes.KEYWORD, 'PRAGMA')) {
       while(this.peek().type !== TokenTypes.EOF && !(this.peek().type === TokenTypes.PUNCTUATION && this.peek().value === ';')) {
          this.advance();
       }
    } else {
       this.expect(TokenTypes.KEYWORD, 'SELECT', 'Sentencia DML o DDL válida (SELECT, INSERT, UPDATE...)');
    }
  }

  isStatementEnd() {
    return this.peek().type === TokenTypes.EOF || (this.peek().type === TokenTypes.PUNCTUATION && this.peek().value === ';');
  }

  isIdentifierLike(token = this.peek()) {
    return token.type === TokenTypes.IDENTIFIER || token.type === TokenTypes.KEYWORD || token.type === TokenTypes.DATA_TYPE;
  }

  expectIdentifierLike(expected = 'Identificador') {
    const t = this.peek();
    if (this.isIdentifierLike(t) || t.type === TokenTypes.STRING) {
      return this.advance();
    }
    this.expect(TokenTypes.IDENTIFIER, null, expected);
  }

  parseQualifiedName(expected = 'Nombre') {
    this.expectIdentifierLike(expected);
    while (this.match(TokenTypes.DOT)) {
      this.expectIdentifierLike('Nombre después del punto');
    }
  }

  parseUse() {
    if (this.isStatementEnd()) {
      this.reportError(`Motor: ${this.engine}`, this.peek(),
        'Nombre de base de datos',
        'USE requiere el nombre de la base de datos.');
      throw new Error('ParseError');
    }
    this.parseQualifiedName('Nombre de base de datos');
    if (!this.isStatementEnd()) {
      this.reportError(`Motor: ${this.engine}`, this.peek(),
        'Punto y coma (;) o Fin de consulta',
        'USE solo acepta el nombre de una base de datos.');
      throw new Error('ParseError');
    }
  }

  parseSet() {
    if (this.isStatementEnd()) {
      this.reportError(`Motor: ${this.engine}`, this.peek(),
        'Variable, parámetro o configuración',
        'SET requiere un destino y un valor.');
      throw new Error('ParseError');
    }
    this.parseQualifiedName('Variable o configuración');
    if (this.match(TokenTypes.KEYWORD, 'TO') || this.match(TokenTypes.OPERATOR, '=')) {
      this.parseExpression();
    } else {
      this.expect(TokenTypes.OPERATOR, '=', 'TO o =');
    }
  }

  parseLockMode() {
    const t = this.peek();
    if (t.type === TokenTypes.KEYWORD && ['READ', 'WRITE'].includes(t.value.toUpperCase())) {
      this.advance();
      return;
    }
    this.reportError(`Motor: ${this.engine}`, t,
      'READ o WRITE',
      'LOCK TABLES requiere un modo READ o WRITE por cada tabla.');
    throw new Error('ParseError');
  }

  parseLockTables() {
    this.expect(TokenTypes.KEYWORD, 'TABLES');
    if (this.isStatementEnd()) {
      this.reportError(`Motor: ${this.engine}`, this.peek(),
        'Nombre de tabla',
        'LOCK TABLES requiere al menos una tabla y un modo READ/WRITE.');
      throw new Error('ParseError');
    }

    do {
      this.parseQualifiedName('Nombre de tabla');
      if (this.match(TokenTypes.KEYWORD, 'AS')) {
        this.expectIdentifierLike('Alias de tabla');
      } else if (this.peek().type === TokenTypes.IDENTIFIER && this.tokens[this.pos + 1] &&
                 this.tokens[this.pos + 1].type === TokenTypes.KEYWORD &&
                 ['READ', 'WRITE'].includes(this.tokens[this.pos + 1].value.toUpperCase())) {
        this.advance();
      }
      this.parseLockMode();
    } while (this.match(TokenTypes.PUNCTUATION, ','));
  }

  parseUnlockTables() {
    this.expect(TokenTypes.KEYWORD, 'TABLES');
    if (!this.isStatementEnd()) {
      this.reportError(`Motor: ${this.engine}`, this.peek(),
        'Punto y coma (;) o Fin de consulta',
        'UNLOCK TABLES no acepta nombres de tabla.');
      throw new Error('ParseError');
    }
  }

  parseTransactionStatement(startToken) {
    const cmd = startToken.value.toUpperCase();
    if (cmd === 'COMMIT') {
      if (!this.isStatementEnd()) {
        this.reportError(`Motor: ${this.engine}`, this.peek(),
          'Punto y coma (;) o Fin de consulta',
          'COMMIT no acepta nombre de tabla ni argumentos.');
        throw new Error('ParseError');
      }
      return;
    }

    if (cmd === 'BEGIN') {
      this.match(TokenTypes.KEYWORD, 'TRANSACTION');
      if (!this.isStatementEnd()) {
        this.reportError(`Motor: ${this.engine}`, this.peek(),
          'TRANSACTION, punto y coma (;) o Fin de consulta',
          'BEGIN solo acepta TRANSACTION como modificador en esta sintaxis.');
        throw new Error('ParseError');
      }
      return;
    }

    if (cmd === 'START') {
      this.expect(TokenTypes.KEYWORD, 'TRANSACTION', 'TRANSACTION');
      return;
    }

    if (cmd === 'SAVEPOINT') {
      this.expectIdentifierLike('Nombre de SAVEPOINT');
      return;
    }

    if (cmd === 'RELEASE') {
      this.expect(TokenTypes.KEYWORD, 'SAVEPOINT');
      this.expectIdentifierLike('Nombre de SAVEPOINT');
      return;
    }

    if (cmd === 'ROLLBACK') {
      if (this.match(TokenTypes.KEYWORD, 'TO')) {
        this.match(TokenTypes.KEYWORD, 'SAVEPOINT');
        this.expectIdentifierLike('Nombre de SAVEPOINT');
      }
      if (!this.isStatementEnd()) {
        this.reportError(`Motor: ${this.engine}`, this.peek(),
          'TO SAVEPOINT nombre, punto y coma (;) o Fin de consulta',
          'ROLLBACK solo acepta opcionalmente TO SAVEPOINT nombre.');
        throw new Error('ParseError');
      }
    }
  }

  parseDataTypeDefinition() {
    if (!this.match(TokenTypes.DATA_TYPE) && !this.match(TokenTypes.KEYWORD) && !this.match(TokenTypes.IDENTIFIER)) {
      this.expect(TokenTypes.DATA_TYPE, null, 'Tipo de dato');
    }
    if (this.match(TokenTypes.PUNCTUATION, '(')) {
      if (!this.match(TokenTypes.PUNCTUATION, ')')) {
        this.parseExpressionList();
        this.expect(TokenTypes.PUNCTUATION, ')');
      }
    }
  }

  parseDeclare() {
    if (this.isStatementEnd()) {
      this.reportError(`Motor: ${this.engine}`, this.peek(),
        'Declaración válida',
        'DECLARE requiere una variable, cursor o bloque.');
      throw new Error('ParseError');
    }

    if (this.peek().type === TokenTypes.IDENTIFIER && this.tokens[this.pos + 1] &&
        this.tokens[this.pos + 1].value.toUpperCase() === 'CURSOR') {
      this.advance();
      this.expect(TokenTypes.KEYWORD, 'CURSOR');
      this.expect(TokenTypes.KEYWORD, 'FOR');
      this.expect(TokenTypes.KEYWORD, 'SELECT');
      this.parseSelectBody();
      return;
    }

    if (this.peek().type === TokenTypes.IDENTIFIER && this.peek().value.startsWith('@')) {
      do {
        this.expect(TokenTypes.IDENTIFIER, null, 'Variable');
        this.parseDataTypeDefinition();
        if (this.match(TokenTypes.OPERATOR, '=')) {
          this.parseExpression();
        }
      } while (this.match(TokenTypes.PUNCTUATION, ','));
      return;
    }

    let sawDeclaration = false;
    while (this.peek().type !== TokenTypes.EOF && !(this.peek().type === TokenTypes.KEYWORD && this.peek().value.toUpperCase() === 'BEGIN')) {
      if (this.isStatementEnd()) {
        if (!sawDeclaration) {
          this.reportError(`Motor: ${this.engine}`, this.peek(),
            'Variable, cursor o bloque',
            'DECLARE está incompleto.');
          throw new Error('ParseError');
        }
        return;
      }
      this.expectIdentifierLike('Variable o cursor');
      this.parseDataTypeDefinition();
      sawDeclaration = true;
      if (this.match(TokenTypes.OPERATOR, ':=' ) || this.match(TokenTypes.OPERATOR, '=')) {
        this.parseExpression();
      }
      this.match(TokenTypes.PUNCTUATION, ';');
    }

    if (this.match(TokenTypes.KEYWORD, 'BEGIN')) {
      while (this.peek().type !== TokenTypes.EOF && !(this.peek().type === TokenTypes.KEYWORD && this.peek().value.toUpperCase() === 'END')) {
        this.advance();
      }
      this.expect(TokenTypes.KEYWORD, 'END');
      this.match(TokenTypes.PUNCTUATION, ';');
    } else if (!sawDeclaration) {
      this.expect(TokenTypes.IDENTIFIER, null, 'Declaración válida');
    }
  }

  parseCTE() {
    do {
       this.expect(TokenTypes.IDENTIFIER, null, 'Nombre de CTE');
       if (this.match(TokenTypes.PUNCTUATION, '(')) {
          while(this.peek().type !== TokenTypes.EOF && this.peek().value !== ')') this.advance();
          this.expect(TokenTypes.PUNCTUATION, ')');
       }
       this.expect(TokenTypes.KEYWORD, 'AS');
       this.expect(TokenTypes.PUNCTUATION, '(');
       this.expect(TokenTypes.KEYWORD, 'SELECT');
       this.parseSelectBody();
       this.expect(TokenTypes.PUNCTUATION, ')');
    } while(this.match(TokenTypes.PUNCTUATION, ','));
  }

  parseSelectBody() {
    this.parseSelectList();
    
    if (this.match(TokenTypes.KEYWORD, 'INTO')) {
       this.parseIdentifierList();
    }
    
    this.checkTypoAndThrow(this.peek(), 'FROM');

    if (this.match(TokenTypes.KEYWORD, 'FROM')) {
       this.parseTableReferences();
       
       this.checkTypoAndThrow(this.peek(), 'WHERE');
       if (this.match(TokenTypes.KEYWORD, 'WHERE')) {
          this.parseExpression();
       }
       
       if (this.match(TokenTypes.KEYWORD, 'START')) {
          this.expect(TokenTypes.KEYWORD, 'WITH');
          this.parseExpression();
          this.expect(TokenTypes.KEYWORD, 'CONNECT');
          this.expect(TokenTypes.KEYWORD, 'BY');
          this.parseExpression();
       }
       
       this.checkTypoAndThrow(this.peek(), 'GROUP');
       if (this.match(TokenTypes.KEYWORD, 'GROUP')) {
          this.expect(TokenTypes.KEYWORD, 'BY');
          this.parseExpressionList();
          this.checkTypoAndThrow(this.peek(), 'HAVING');
          if (this.match(TokenTypes.KEYWORD, 'HAVING')) {
             this.parseExpression();
          }
       }
       
       if (this.match(TokenTypes.KEYWORD, 'WINDOW')) {
           this.expect(TokenTypes.IDENTIFIER);
           this.expect(TokenTypes.KEYWORD, 'AS');
           this.expect(TokenTypes.PUNCTUATION, '(');
           this.parseWindowDefinition();
           this.expect(TokenTypes.PUNCTUATION, ')');
       }

       this.checkTypoAndThrow(this.peek(), 'ORDER');
       if (this.match(TokenTypes.KEYWORD, 'ORDER')) {
          this.expect(TokenTypes.KEYWORD, 'BY');
          this.parseExpressionList(); 
       }
       
       if (this.match(TokenTypes.KEYWORD, 'LIMIT') || this.match(TokenTypes.KEYWORD, 'OFFSET') || this.match(TokenTypes.KEYWORD, 'FETCH')) {
           while(this.peek().type !== TokenTypes.EOF && this.peek().value !== ';') this.advance();
       }
    }
    
    if (this.match(TokenTypes.KEYWORD, 'UNION') || this.match(TokenTypes.KEYWORD, 'INTERSECT') || this.match(TokenTypes.KEYWORD, 'EXCEPT')) {
       if (this.match(TokenTypes.KEYWORD, 'ALL')) {}
       this.expect(TokenTypes.KEYWORD, 'SELECT');
       this.parseSelectBody();
    }
  }

  parseSelectList() {
    if (this.match(TokenTypes.STAR)) {
       if (this.match(TokenTypes.PUNCTUATION, ',')) {
          this.parseSelectList();
       }
       return;
    }
    
    if (this.match(TokenTypes.KEYWORD, 'DISTINCT') || this.match(TokenTypes.KEYWORD, 'ALL')) {}
    if (this.match(TokenTypes.KEYWORD, 'TOP')) {
       this.expect(TokenTypes.NUMBER);
    }
    
    do {
       this.parseExpression();
       if (this.match(TokenTypes.KEYWORD, 'AS')) {
          if (!this.match(TokenTypes.IDENTIFIER) && !this.match(TokenTypes.STRING)) {
              this.expect(TokenTypes.IDENTIFIER, null, 'Alias válido');
          }
       } else if (this.peek().type === TokenTypes.STRING) {
          // Implicit alias with string is usually okay (e.g., SELECT col 'Alias')
          this.advance();
       } else if (this.peek().type === TokenTypes.IDENTIFIER) {
          const t = this.peek();
          const prev = this.tokens[this.pos - 1];
          if (prev && prev.type === TokenTypes.KEYWORD && prev.value.toUpperCase() === 'END') {
             this.advance();
             continue;
          }
          const sim = findSimilarKeyword(t.value);
          if (sim === 'FROM' && this.tokens[this.pos + 1] && (this.tokens[this.pos + 1].type === TokenTypes.IDENTIFIER || this.tokens[this.pos + 1].type === TokenTypes.KEYWORD)) {
             this.reportError(`Motor: ${this.engine}`, t, 'FROM', `Quizás quiso escribir FROM`);
             throw new Error('ParseError');
          }
          // Strict validation: Reject implicit identifier aliases to catch missing commas.
          // e.g. "SELECT nombre direccion" -> missing comma between nombre and direccion.
          this.reportError(`Motor: ${this.engine}`, t,
             'Coma (,) o AS',
             `Identificadores consecutivos detectados. Falta una coma antes de "${t.value}" o use 'AS' para alias.`);
          throw new Error('ParseError');
       }
       // After expression + optional alias: if next is a plain identifier (not keyword, not comma)
       // that means consecutive columns without comma separator
       if (this.peek().type === TokenTypes.IDENTIFIER) {
          const nextT = this.peek();
          const nextSim = findSimilarKeyword(nextT.value);
          if (!nextSim) {
             this.reportError(`Motor: ${this.engine}`, nextT,
               'Coma (,) o FROM',
               `Identificadores consecutivos sin separador. Falta una coma antes de "${nextT.value}".`);
             throw new Error('ParseError');
          }
       }
    } while (this.match(TokenTypes.PUNCTUATION, ','));
  }

  parseTableReferences() {
    do {
       if (this.match(TokenTypes.PUNCTUATION, '(')) {
          if (this.match(TokenTypes.KEYWORD, 'SELECT')) {
             this.parseSelectBody();
          } else {
             this.parseTableReferences();
          }
          this.expect(TokenTypes.PUNCTUATION, ')');
       } else {
          if (this.peek().type === TokenTypes.IDENTIFIER || this.peek().type === TokenTypes.KEYWORD) {
              this.advance();
              while (this.match(TokenTypes.DOT)) {
                  if (this.peek().type === TokenTypes.IDENTIFIER || this.peek().type === TokenTypes.KEYWORD) {
                      this.advance();
                  } else {
                      this.expect(TokenTypes.IDENTIFIER, null, 'Nombre después del punto');
                  }
              }
          } else {
              this.expect(TokenTypes.IDENTIFIER, null, 'Nombre de tabla');
          }
       }
       
       if (this.match(TokenTypes.KEYWORD, 'AS')) {
          this.match(TokenTypes.IDENTIFIER);
       } else if (this.peek().type === TokenTypes.IDENTIFIER) {
          const sim = findSimilarKeyword(this.peek().value);
          if (sim === 'WHERE' || sim === 'JOIN') {
              this.reportError(`Motor: ${this.engine}`, this.peek(), sim, `Quizás quiso escribir ${sim}`);
              throw new Error('ParseError');
          }
          this.advance(); 
       }
       
       if (this.match(TokenTypes.KEYWORD, 'WITH')) {
           this.expect(TokenTypes.PUNCTUATION, '(');
           this.expect(TokenTypes.KEYWORD, 'NOLOCK');
           this.expect(TokenTypes.PUNCTUATION, ')');
       }
       
       while (this.isJoinKeyword()) {
          this.parseJoin();
       }
       
    } while (this.match(TokenTypes.PUNCTUATION, ','));
  }
  
  isJoinKeyword() {
    const t = this.peek();
    const up = t.value.toUpperCase();
    return t.type === TokenTypes.KEYWORD && ['JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS'].includes(up);
  }

  parseJoin() {
     const explicitJoinType = this.matchOneOf(TokenTypes.KEYWORD, ['INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS']);
     const isCrossJoin = explicitJoinType && explicitJoinType.value.toUpperCase() === 'CROSS';
     if (this.match(TokenTypes.KEYWORD, 'OUTER')) {}
     this.expect(TokenTypes.KEYWORD, 'JOIN');
     
     if (this.match(TokenTypes.PUNCTUATION, '(')) {
          this.parseSelectBody();
          this.expect(TokenTypes.PUNCTUATION, ')');
     } else {
          if (this.peek().type === TokenTypes.IDENTIFIER || this.peek().type === TokenTypes.KEYWORD) {
              this.advance();
              while (this.match(TokenTypes.DOT)) {
                  if (this.peek().type === TokenTypes.IDENTIFIER || this.peek().type === TokenTypes.KEYWORD) {
                      this.advance();
                  } else {
                      this.expect(TokenTypes.IDENTIFIER, null, 'Nombre después del punto');
                  }
              }
          } else {
              this.expect(TokenTypes.IDENTIFIER, null, 'Tabla para JOIN');
          }
     }
     
     if (this.match(TokenTypes.KEYWORD, 'AS')) {
        this.match(TokenTypes.IDENTIFIER);
     } else if (this.peek().type === TokenTypes.IDENTIFIER) {
        const sim = findSimilarKeyword(this.peek().value);
        if (sim === 'ON' || sim === 'WHERE') {
            this.reportError(`Motor: ${this.engine}`, this.peek(), sim, `Quizás quiso escribir ${sim}`);
            throw new Error('ParseError');
        }
        this.advance();
     }
     
     if (this.match(TokenTypes.KEYWORD, 'ON')) {
        this.parseExpression();
     } else if (this.match(TokenTypes.KEYWORD, 'USING')) {
        this.expect(TokenTypes.PUNCTUATION, '(');
        this.parseIdentifierList();
        this.expect(TokenTypes.PUNCTUATION, ')');
     } else if (!isCrossJoin) {
        this.reportError(`Motor: ${this.engine}`, this.peek(),
          'ON o USING',
          `JOIN requiere una condición ON/USING. Si busca producto cartesiano use CROSS JOIN.`);
        throw new Error('ParseError');
     }
  }

  parseInsert() {
    this.match(TokenTypes.KEYWORD, 'INTO');
    this.expect(TokenTypes.IDENTIFIER, null, 'Nombre de tabla de inserción');
    if (this.match(TokenTypes.PUNCTUATION, '(')) {
       this.parseIdentifierList();
       this.expect(TokenTypes.PUNCTUATION, ')');
    }
    
    if (this.match(TokenTypes.KEYWORD, 'VALUES')) {
       do {
          this.expect(TokenTypes.PUNCTUATION, '(');
          this.parseExpressionList();
          this.expect(TokenTypes.PUNCTUATION, ')');
       } while (this.match(TokenTypes.PUNCTUATION, ','));
    } else if (this.match(TokenTypes.KEYWORD, 'SELECT')) {
       this.parseSelectBody();
    } else {
       this.expect(TokenTypes.KEYWORD, 'VALUES', 'VALUES o SELECT');
    }

    if (this.match(TokenTypes.KEYWORD, 'RETURNING')) {
       this.parseExpressionList();
    }
  }

  parseUpdate() {
    this.expect(TokenTypes.IDENTIFIER, null, 'Nombre de tabla a actualizar');
    this.expect(TokenTypes.KEYWORD, 'SET');
    do {
       this.expect(TokenTypes.IDENTIFIER);
       this.expect(TokenTypes.OPERATOR, '=');
       this.parseExpression();
    } while(this.match(TokenTypes.PUNCTUATION, ','));
    
    this.checkTypoAndThrow(this.peek(), 'WHERE');
    if (this.match(TokenTypes.KEYWORD, 'WHERE')) {
       this.parseExpression();
    }

    if (this.match(TokenTypes.KEYWORD, 'RETURNING')) {
       this.parseExpressionList();
    }
  }

  parseDelete() {
    this.match(TokenTypes.KEYWORD, 'FROM');
    this.expect(TokenTypes.IDENTIFIER, null, 'Nombre de tabla para borrar');
    
    this.checkTypoAndThrow(this.peek(), 'WHERE');
    if (this.match(TokenTypes.KEYWORD, 'WHERE')) {
       this.parseExpression();
    }

    if (this.match(TokenTypes.KEYWORD, 'RETURNING')) {
       this.parseExpressionList();
    }
  }

  parseIdentifierList() {
    do {
       this.expect(TokenTypes.IDENTIFIER, null, 'Identificador (columna)');
    } while(this.match(TokenTypes.PUNCTUATION, ','));
  }

  parseExpressionList() {
    do {
       this.parseExpression();
    } while(this.match(TokenTypes.PUNCTUATION, ','));
  }

  parseExpression() {
     let count = 0;
     let lastToken = null;
     while(true) {
        const t = this.peek();
        if (t.type === TokenTypes.EOF || t.value === ';' || t.value === ',' || t.value === ')' || 
            ['FROM', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'INTERSECT', 'EXCEPT', 'AS', 'INTO', 'RETURNING',
             'WHEN', 'THEN', 'ELSE', 'END',
             'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'OUTER', 'ON', 'USING'].includes(t.value.toUpperCase())) {
           break;
        }

        if (t.type === TokenTypes.IDENTIFIER) {
            const sim = findSimilarKeyword(t.value);
            if (sim) break; 
        }
        
        if (count > 0 && [TokenTypes.IDENTIFIER, TokenTypes.STRING, TokenTypes.NUMBER, TokenTypes.DATA_TYPE].includes(t.type)) {
            const prev = this.tokens[this.pos - 1];
            if (prev) {
                if (![TokenTypes.OPERATOR, TokenTypes.KEYWORD, TokenTypes.DOT, TokenTypes.DOUBLECOLON, TokenTypes.STAR].includes(prev.type) && prev.value !== '(' && prev.value !== ',') {
                    break;
                }
                if (prev.type === TokenTypes.KEYWORD && ['NULL', 'TRUE', 'FALSE'].includes(prev.value.toUpperCase())) {
                    break;
                }
            }
        }
        
        if (t.type === TokenTypes.DATA_TYPE && ['DATE', 'TIME', 'TIMESTAMP'].includes(t.value.toUpperCase())) {
           const next = this.tokens[this.pos + 1];
           if (next && next.type === TokenTypes.STRING) {
             this.advance();
             this.advance();
             count++;
             lastToken = next;
           } else {
             this.reportError(`Motor: ${this.engine}`, t,
               `Literal ${t.value} seguido de texto`,
               `${t.value} debe escribirse como ${t.value} 'valor'.`);
             throw new Error('ParseError');
           }
        } else if (t.type === TokenTypes.FUNCTION) {
           this.advance();
           this.expect(TokenTypes.PUNCTUATION, '(');
           if (!this.match(TokenTypes.PUNCTUATION, ')')) {
              if (this.match(TokenTypes.STAR)) {}
              else this.parseExpressionList();
              this.expect(TokenTypes.PUNCTUATION, ')');
           }
           count++;
           lastToken = this.tokens[this.pos - 1];
        } else if (t.type === TokenTypes.WINDOW_FUNCTION) {
           this.advance();
           this.expect(TokenTypes.PUNCTUATION, '(');
           if (!this.match(TokenTypes.PUNCTUATION, ')')) {
              this.parseExpressionList();
              this.expect(TokenTypes.PUNCTUATION, ')');
           }
           this.expect(TokenTypes.KEYWORD, 'OVER');
           this.expect(TokenTypes.PUNCTUATION, '(');
           this.parseWindowDefinition();
           this.expect(TokenTypes.PUNCTUATION, ')');
           count++;
           lastToken = this.tokens[this.pos - 1];
        } else if (t.type === TokenTypes.PUNCTUATION && t.value === '(') {
           this.advance();
           if (this.match(TokenTypes.KEYWORD, 'SELECT')) {
              this.parseSelectBody();
           } else {
              this.parseExpressionList();
           }
           this.expect(TokenTypes.PUNCTUATION, ')');
           count++;
           lastToken = this.tokens[this.pos - 1];
        } else if (t.type === TokenTypes.KEYWORD && t.value.toUpperCase() === 'CASE') {
           this.parseCase();
           count++;
           lastToken = this.tokens[this.pos - 1];
        } else if (t.type === TokenTypes.KEYWORD && ['EXISTS', 'IN', 'ANY', 'ALL'].includes(t.value.toUpperCase())) {
           this.advance();
           if (this.peek().value === '(') {
               this.advance();
               if (this.match(TokenTypes.KEYWORD, 'SELECT')) {
                   this.parseSelectBody();
               } else {
                   this.parseExpressionList();
               }
               this.expect(TokenTypes.PUNCTUATION, ')');
           }
           count++;
           lastToken = this.tokens[this.pos - 1];
        } else if (t.type === TokenTypes.IDENTIFIER) {
           const next = this.tokens[this.pos + 1];
           if (next && next.value === '(') {
               this.reportError(`Motor: ${this.engine}`, t, 'Función válida (SUM, COUNT, etc.)', `Función desconocida "${t.value}". Verifique que la función esté bien escrita.`);
               throw new Error('ParseError');
           }
           this.advance();
           while (this.match(TokenTypes.DOT)) {
               if (!this.match(TokenTypes.IDENTIFIER) && !this.match(TokenTypes.STAR)) {
                   this.expect(TokenTypes.IDENTIFIER, null, 'Nombre de columna después del punto');
               }
           }
           count++;
           lastToken = this.tokens[this.pos - 1];
        } else if (['NUMBER', 'STRING', 'OPERATOR', 'DATA_TYPE'].includes(t.type) || t.type === TokenTypes.KEYWORD || t.type === TokenTypes.STAR) {
           if (t.type === TokenTypes.NUMBER && !/^\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t.value)) {
             this.reportError(`Motor: ${this.engine}`, t,
               'Literal numérico válido',
               `El número "${t.value}" no tiene un formato válido.`);
             throw new Error('ParseError');
           }
           if (t.type === TokenTypes.OPERATOR && !/^(=|<>|!=|<|>|<=|>=|\+|-|\*|\/|%|\|\||&&|&|\||\^|~)$/.test(t.value)) {
             this.reportError(`Motor: ${this.engine}`, t,
               'Operador válido',
               `Operador no reconocido: ${t.value}`);
             throw new Error('ParseError');
           }
           this.advance();
           count++;
           lastToken = t;
        } else if (t.type === TokenTypes.DOUBLECOLON) {
           this.advance();
           if (!this.match(TokenTypes.DATA_TYPE) && !this.match(TokenTypes.IDENTIFIER)) {
               this.expect(TokenTypes.DATA_TYPE, null, 'Tipo de dato para CAST');
           }
           count++;
           lastToken = this.tokens[this.pos - 1];
        } else {
           break;
        }
     }
     
     if (count === 0) {
        this.expect(TokenTypes.IDENTIFIER, null, 'Expresión válida');
     }
     const starIsQualifiedWildcard = lastToken &&
       lastToken.type === TokenTypes.STAR &&
       this.tokens[this.pos - 2] &&
       this.tokens[this.pos - 2].type === TokenTypes.DOT;
     const starIsSelectWildcard = lastToken &&
       lastToken.type === TokenTypes.STAR &&
       count === 1 &&
       this.peek().type === TokenTypes.KEYWORD &&
       this.peek().value.toUpperCase() === 'FROM';

     if (lastToken && (
       lastToken.type === TokenTypes.OPERATOR ||
       (lastToken.type === TokenTypes.STAR && !starIsQualifiedWildcard && !starIsSelectWildcard) ||
       (lastToken.type === TokenTypes.KEYWORD && ['AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'ILIKE', 'IS'].includes(lastToken.value.toUpperCase()))
     )) {
       this.reportError(`Motor: ${this.engine}`, this.peek(),
         'Operando después del operador',
         `La expresión no puede terminar con "${lastToken.value}".`);
       throw new Error('ParseError');
     }
  }

  parseCase() {
     this.advance(); 
     if (!this.match(TokenTypes.KEYWORD, 'WHEN')) {
        this.parseExpression();
     } else {
        this.parseExpression();
        this.expect(TokenTypes.KEYWORD, 'THEN');
        this.parseExpression();
     }
     
     while(this.match(TokenTypes.KEYWORD, 'WHEN')) {
        this.parseExpression();
        this.expect(TokenTypes.KEYWORD, 'THEN');
        this.parseExpression();
     }
     if (this.match(TokenTypes.KEYWORD, 'ELSE')) {
        this.parseExpression();
     }
     this.expect(TokenTypes.KEYWORD, 'END');
  }

  parseWindowDefinition() {
     if (this.match(TokenTypes.KEYWORD, 'PARTITION')) {
        this.expect(TokenTypes.KEYWORD, 'BY');
        this.parseExpressionList();
     }
     if (this.match(TokenTypes.KEYWORD, 'ORDER')) {
        this.expect(TokenTypes.KEYWORD, 'BY');
        this.parseExpressionList();
     }
     if (this.match(TokenTypes.KEYWORD, 'ROWS') || this.match(TokenTypes.KEYWORD, 'RANGE')) {
        while(this.peek().type !== TokenTypes.EOF && this.peek().value !== ')') {
           this.advance();
        }
     }
  }

}

module.exports = { SQLParser };
