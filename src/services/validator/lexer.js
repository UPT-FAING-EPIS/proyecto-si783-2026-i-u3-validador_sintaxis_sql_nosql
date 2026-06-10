/**
 * lexer.js — Analizador léxico para SQL multimotor
 * Genera tokens tipados a partir de texto SQL crudo.
 */

class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }
}

const TokenTypes = {
  KEYWORD:         'KEYWORD',
  IDENTIFIER:      'IDENTIFIER',
  STRING:          'STRING',
  NUMBER:          'NUMBER',
  OPERATOR:        'OPERATOR',
  PUNCTUATION:     'PUNCTUATION',
  FUNCTION:        'FUNCTION',
  WINDOW_FUNCTION: 'WINDOW_FUNCTION',
  DATA_TYPE:       'DATA_TYPE',
  COMMENT:         'COMMENT',
  DOT:             'DOT',        // Separado para alias.columna
  DOUBLECOLON:     'DOUBLECOLON', // :: para PostgreSQL casts
  STAR:            'STAR',        // * separado de OPERATOR
  VARIABLE:        'VARIABLE',
  EOF:             'EOF'
};

/* ────────────────────────────────────────
   Diccionarios de clasificación léxica
   ──────────────────────────────────────── */

const SQL_KEYWORDS = new Set([
  // DML
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
  'DELETE', 'MERGE', 'UPSERT', 'RETURNING', 'OUTPUT',
  // DDL
  'CREATE', 'TABLE', 'DROP', 'ALTER', 'TRUNCATE', 'INDEX', 'VIEW', 'TRIGGER',
  'PROCEDURE', 'DATABASE', 'SCHEMA',
  // Joins
  'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'OUTER', 'JOIN', 'ON', 'USING',
  'NATURAL',
  // Clauses
  'GROUP', 'BY', 'ORDER', 'ASC', 'DESC', 'HAVING', 'LIMIT', 'OFFSET',
  'FETCH', 'FIRST', 'NEXT', 'ROWS', 'ONLY', 'PERCENT', 'TIES',
  'DISTINCT', 'AS', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'BETWEEN',
  'LIKE', 'ILIKE', 'EXISTS', 'UNION', 'ALL', 'INTERSECT', 'EXCEPT',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'ANY', 'SOME',
  // CTE
  'WITH', 'RECURSIVE',
  // Window
  'OVER', 'PARTITION', 'RANGE', 'UNBOUNDED', 'PRECEDING', 'FOLLOWING',
  'CURRENT', 'ROW', 'WINDOW',
  // Constraints / DDL extras
  'DEFAULT', 'CONSTRAINT', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'CHECK', 'UNIQUE', 'CASCADE', 'RESTRICT', 'ACTION', 'NO',
  // Motor-specific keywords (todos reconocidos como KEYWORD para el lexer)
  'TOP', 'GO', 'NOLOCK', 'IDENTITY', 'AUTO_INCREMENT', 'AUTOINCREMENT',
  'ENGINE', 'SHOW', 'DATABASES', 'TABLES', 'DESCRIBE', 'EXPLAIN',
  'PRAGMA', 'WITHOUT', 'ROWID', 'STRICT',
  'START', 'CONNECT', 'PRIOR', 'DUAL', 'ROWNUM', 'MINUS', 'LEVEL',
  'SYSTIMESTAMP',
  'DO', 'NOTHING', 'CONFLICT', 'IGNORE', 'REPLACE',
  'IF', 'ELSE', 'BEGIN', 'DECLARE', 'EXEC', 'EXECUTE',
  'GRANT', 'REVOKE', 'DENY', 'TO',
  // Misc
  'SIMILAR', 'ESCAPE', 'CAST', 'TRUE', 'FALSE', 'UNKNOWN',
  'TYPE', 'ADD', 'COLUMN', 'RENAME', 'AFTER', 'BEFORE',
  'TEMPORARY', 'TEMP', 'MATERIALIZED', 'SEQUENCE', 'PACKAGE', 'SYNONYM',
  'PIVOT', 'UNPIVOT', 'APPLY',
  'TABLESAMPLE', 'LATERAL',
  'FOR'
]);

const SQL_FUNCTIONS = new Set([
  // Aggregate
  'SUM', 'AVG', 'COUNT', 'MIN', 'MAX',
  // String
  'CONCAT', 'UPPER', 'LOWER', 'TRIM', 'LTRIM', 'RTRIM', 'LENGTH', 'LEN',
  'SUBSTRING', 'SUBSTR', 'REPLACE', 'REVERSE', 'LEFT', 'RIGHT',
  'CHARINDEX', 'INSTR', 'POSITION', 'LPAD', 'RPAD', 'REPEAT',
  'CHAR_LENGTH', 'CHARACTER_LENGTH', 'TRANSLATE', 'ASCII', 'CHAR',
  // Numeric
  'ROUND', 'FLOOR', 'CEIL', 'CEILING', 'ABS', 'MOD', 'POWER', 'SQRT',
  'SIGN', 'TRUNC', 'TRUNCATE', 'LOG', 'LOG10', 'EXP', 'RAND', 'RANDOM',
  // Date / time
  'NOW', 'CURDATE', 'CURTIME', 'CURRENT_DATE', 'CURRENT_TIMESTAMP',
  'CURRENT_TIME', 'SYSDATE', 'SYSTIMESTAMP', 'GETDATE', 'GETUTCDATE',
  'DATE_ADD', 'DATE_SUB', 'DATEADD', 'DATEDIFF', 'DATENAME', 'DATEPART',
  'EXTRACT', 'TO_CHAR', 'TO_DATE', 'TO_NUMBER', 'TO_TIMESTAMP',
  'MAKE_DATE', 'MAKE_TIME', 'MAKE_TIMESTAMP',
  'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND',
  'STRFTIME', 'DATE', 'TIME', 'DATETIME', 'JULIANDAY',
  'AGE', 'DATE_TRUNC', 'DATE_PART',
  // NULL handling
  'COALESCE', 'NULLIF', 'IFNULL', 'ISNULL', 'NVL', 'NVL2',
  // Conversion
  'CAST', 'CONVERT', 'TRY_CAST', 'TRY_CONVERT',
  // Aggregation
  'GROUP_CONCAT', 'STRING_AGG', 'LISTAGG', 'WM_CONCAT', 'ARRAY_AGG',
  'JSON_AGG', 'JSONB_AGG', 'JSON_OBJECT_AGG', 'XMLAGG',
  // ID / unique
  'NEWID', 'UUID', 'GEN_RANDOM_UUID',
  'UNIX_TIMESTAMP', 'LAST_INSERT_ID', 'LAST_INSERT_ROWID', 'SCOPE_IDENTITY',
  'NEXTVAL', 'CURRVAL', 'SETVAL',
  // JSON
  'JSON_VALUE', 'JSON_QUERY', 'JSON_EXTRACT', 'JSON_ARRAY', 'JSON_OBJECT',
  'JSONB_EXTRACT_PATH', 'JSONB_EXTRACT_PATH_TEXT', 'JSON_TYPEOF',
  // Misc
  'GREATEST', 'LEAST', 'DECODE', 'IIF',
  'ROW_COUNT', 'FOUND_ROWS', 'OBJECT_ID',
  'FORMAT', 'STUFF', 'QUOTENAME',
  'REGEXP_REPLACE', 'REGEXP_MATCHES', 'REGEXP_SUBSTR',
  'TYPEOF', 'TOTAL', 'ZEROBLOB', 'LIKELIHOOD', 'UNLIKELY'
]);

const SQL_WINDOW_FUNCTIONS = new Set([
  'RANK', 'DENSE_RANK', 'ROW_NUMBER', 'NTILE',
  'LEAD', 'LAG', 'FIRST_VALUE', 'LAST_VALUE', 'NTH_VALUE',
  'CUME_DIST', 'PERCENT_RANK'
]);

const SQL_DATA_TYPES = new Set([
  'INT', 'INTEGER', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'BIGINT',
  'DECIMAL', 'NUMERIC', 'NUMBER',
  'FLOAT', 'REAL', 'DOUBLE',
  'BIT', 'BOOLEAN', 'BOOL',
  'SERIAL', 'BIGSERIAL', 'SMALLSERIAL',
  'DATE', 'DATETIME', 'DATETIME2', 'TIMESTAMP', 'TIMESTAMPTZ',
  'TIME', 'TIMETZ', 'INTERVAL',
  'CHAR', 'VARCHAR', 'VARCHAR2', 'NCHAR', 'NVARCHAR', 'NVARCHAR2',
  'TEXT', 'NTEXT', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT', 'CLOB', 'NCLOB',
  'BINARY', 'VARBINARY', 'IMAGE',
  'BLOB', 'TINYBLOB', 'MEDIUMBLOB', 'LONGBLOB', 'BFILE', 'RAW',
  'ENUM', 'JSON', 'JSONB', 'XML',
  'UUID', 'UNIQUEIDENTIFIER',
  'ARRAY', 'BYTEA', 'MONEY', 'SMALLMONEY',
  'CIDR', 'INET', 'MACADDR', 'TSVECTOR', 'TSQUERY',
  'HIERARCHYID', 'DATETIMEOFFSET', 'SMALLDATETIME',
  'ROWID', 'UROWID', 'LONG',
  'CURSOR', 'TABLE', 'SQL_VARIANT',
  'GEOGRAPHY', 'GEOMETRY', 'POINT', 'LINESTRING', 'POLYGON'
]);

/* ────────────────────────────────────────
   Clase Lexer
   ──────────────────────────────────────── */
class Lexer {
  constructor(input, isNoSQL = false) {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.isNoSQL = isNoSQL;
  }

  /** Avanza un carácter y actualiza posición */
  advance() {
    if (this.pos >= this.input.length) return null;
    const char = this.input[this.pos];
    this.pos++;
    if (char === '\n') { this.line++; this.column = 1; }
    else { this.column++; }
    return char;
  }

  peek(offset = 0) {
    const idx = this.pos + offset;
    return idx >= this.input.length ? null : this.input[idx];
  }

  /** Verifica si una posición futura tiene un paréntesis abierto (saltando whitespace) */
  nextNonWsIs(ch) {
    let i = this.pos;
    while (i < this.input.length && /\s/.test(this.input[i])) i++;
    return this.input[i] === ch;
  }

  tokenize() {
    const tokens = [];

    while (this.pos < this.input.length) {
      const char = this.peek();

      // ─── Whitespace ───
      if (/\s/.test(char)) { this.advance(); continue; }

      // ─── Comentarios ───
      if (char === '-' && this.peek(1) === '-') {
        const sl = this.line, sc = this.column;
        let text = '';
        while (this.peek() !== null && this.peek() !== '\n') text += this.advance();
        tokens.push(new Token(TokenTypes.COMMENT, text, sl, sc));
        continue;
      }
      if (char === '/' && this.peek(1) === '*') {
        const sl = this.line, sc = this.column;
        let text = this.advance() + this.advance(); // consume /*
        while (this.peek() !== null && !(this.peek() === '*' && this.peek(1) === '/')) {
          text += this.advance();
        }
        if (this.peek() !== null) { text += this.advance(); text += this.advance(); }
        tokens.push(new Token(TokenTypes.COMMENT, text, sl, sc));
        continue;
      }
      if (this.isNoSQL && char === '/' && this.peek(1) === '/') {
        const sl = this.line, sc = this.column;
        let text = '';
        while (this.peek() !== null && this.peek() !== '\n') text += this.advance();
        tokens.push(new Token(TokenTypes.COMMENT, text, sl, sc));
        continue;
      }

      const startLine = this.line;
      const startCol = this.column;

      // ─── Strings ───
      if (char === "'" || char === '"') {
        const quote = char;
        let str = '';
        this.advance(); // skip opening quote
        while (this.peek() !== null) {
          if (this.peek() === quote) {
            // Escaped quote (two consecutive)
            if (this.peek(1) === quote) {
              str += this.advance(); // first quote
              str += this.advance(); // second quote
              continue;
            }
            break;
          }
          if (this.peek() === '\\') { str += this.advance(); } // escape char
          str += this.advance();
        }
        if (this.peek() === quote) this.advance(); // skip closing quote
        tokens.push(new Token(TokenTypes.STRING, str, startLine, startCol));
        continue;
      }

      // ─── Backtick-quoted identifiers ───
      if (char === '`') {
        let id = '';
        this.advance(); // skip `
        while (this.peek() !== null && this.peek() !== '`') id += this.advance();
        if (this.peek() === '`') this.advance();
        tokens.push(new Token(TokenTypes.IDENTIFIER, id, startLine, startCol));
        continue;
      }

      // ─── Bracket-quoted identifiers [name] (SQL Server) ───
      if (char === '[' && !this.isNoSQL) {
        let id = '';
        this.advance(); // skip [
        while (this.peek() !== null && this.peek() !== ']') id += this.advance();
        if (this.peek() === ']') this.advance();
        tokens.push(new Token(TokenTypes.IDENTIFIER, id, startLine, startCol));
        continue;
      }

      // ─── Numbers ───
      if (/\d/.test(char)) {
        let num = '';
        while (this.peek() !== null && /[\d.]/.test(this.peek())) num += this.advance();
        // Scientific notation
        if (this.peek() === 'e' || this.peek() === 'E') {
          num += this.advance();
          if (this.peek() === '+' || this.peek() === '-') num += this.advance();
          while (this.peek() !== null && /\d/.test(this.peek())) num += this.advance();
        }
        tokens.push(new Token(TokenTypes.NUMBER, num, startLine, startCol));
        continue;
      }

      // ─── PostgreSQL cast :: ───
      if (char === ':' && this.peek(1) === ':') {
        this.advance(); this.advance();
        tokens.push(new Token(TokenTypes.DOUBLECOLON, '::', startLine, startCol));
        continue;
      }

      // ─── Colon (for named params :param) ───
      if (char === ':') {
        this.advance();
        if (this.peek() !== null && /[a-zA-Z_]/.test(this.peek())) {
          let name = ':';
          while (this.peek() !== null && /[a-zA-Z0-9_]/.test(this.peek())) name += this.advance();
          tokens.push(new Token(TokenTypes.IDENTIFIER, name, startLine, startCol));
        } else {
          tokens.push(new Token(TokenTypes.PUNCTUATION, ':', startLine, startCol));
        }
        continue;
      }

      // ─── Dot (separate token for alias.column) ───
      if (char === '.') {
        this.advance();
        tokens.push(new Token(TokenTypes.DOT, '.', startLine, startCol));
        continue;
      }

      // ─── Star ───
      if (char === '*') {
        this.advance();
        tokens.push(new Token(TokenTypes.STAR, '*', startLine, startCol));
        continue;
      }

      // ─── Operators ───
      if (/[+\-/=<>!%^&|~]/.test(char)) {
        let op = '';
        // Multi-char operators: >=, <=, <>, !=, ||, &&, etc.
        while (this.peek() !== null && /[+\-/=<>!%^&|~]/.test(this.peek())) {
          op += this.advance();
        }
        tokens.push(new Token(TokenTypes.OPERATOR, op, startLine, startCol));
        continue;
      }

      // ─── Punctuation ───
      if (/[(),.;{}]/.test(char)) {
        this.advance();
        tokens.push(new Token(TokenTypes.PUNCTUATION, char, startLine, startCol));
        continue;
      }

      // ─── Identifiers, Keywords, Functions ───
      if (/[a-zA-Z_]/.test(char) || char === '@' || char === '#' || char === '$') {
        let id = '';
        while (this.peek() !== null && /[a-zA-Z0-9_$@#]/.test(this.peek())) {
          id += this.advance();
        }
        const upper = id.toUpperCase();

        if (this.isNoSQL) {
          if (id.startsWith('$')) {
            tokens.push(new Token(TokenTypes.KEYWORD, id, startLine, startCol));
          } else {
            tokens.push(new Token(TokenTypes.IDENTIFIER, id, startLine, startCol));
          }
          continue;
        }

        // SQL mode: classify the word
        const followedByParen = this.nextNonWsIs('(');

        if (SQL_WINDOW_FUNCTIONS.has(upper) && followedByParen) {
          tokens.push(new Token(TokenTypes.WINDOW_FUNCTION, upper, startLine, startCol));
        } else if (SQL_FUNCTIONS.has(upper) && followedByParen) {
          tokens.push(new Token(TokenTypes.FUNCTION, upper, startLine, startCol));
        } else if (SQL_KEYWORDS.has(upper)) {
          tokens.push(new Token(TokenTypes.KEYWORD, upper, startLine, startCol));
        } else if (SQL_DATA_TYPES.has(upper)) {
          tokens.push(new Token(TokenTypes.DATA_TYPE, upper, startLine, startCol));
        } else {
          // Not a recognized keyword/function → IDENTIFIER (could be table, column, or typo)
          tokens.push(new Token(TokenTypes.IDENTIFIER, id, startLine, startCol));
        }
        continue;
      }

      // ─── Unknown character → skip ───
      this.advance();
    }

    tokens.push(new Token(TokenTypes.EOF, '', this.line, this.column));
    return tokens;
  }
}

module.exports = { Lexer, Token, TokenTypes, SQL_FUNCTIONS, SQL_WINDOW_FUNCTIONS, SQL_KEYWORDS, SQL_DATA_TYPES };
