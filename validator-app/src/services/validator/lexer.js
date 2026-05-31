class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }
}

const TokenTypes = {
  KEYWORD: 'KEYWORD',
  IDENTIFIER: 'IDENTIFIER',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  OPERATOR: 'OPERATOR',
  PUNCTUATION: 'PUNCTUATION',
  FUNCTION: 'FUNCTION',
  VARIABLE: 'VARIABLE', // Para NoSQL variables locales
  EOF: 'EOF'
};

class Lexer {
  constructor(input, isNoSQL = false) {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.isNoSQL = isNoSQL;
  }

  advance() {
    if (this.pos >= this.input.length) return null;
    const char = this.input[this.pos];
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.pos++;
    return char;
  }

  peek() {
    return this.pos >= this.input.length ? null : this.input[this.pos];
  }

  tokenize() {
    const tokens = [];
    while (this.pos < this.input.length) {
      let char = this.peek();

      // Ignorar espacios en blanco
      if (/\s/.test(char)) {
        this.advance();
        continue;
      }

      // Comentarios SQL (--) y Multilínea (/* */) y JS (//)
      if (char === '-') {
        if (this.input[this.pos + 1] === '-') {
          while (this.peek() !== '\n' && this.peek() !== null) this.advance();
          continue;
        }
      }
      if (char === '/') {
        if (this.input[this.pos + 1] === '*') {
          this.advance(); this.advance();
          while (!(this.peek() === '*' && this.input[this.pos + 1] === '/') && this.peek() !== null) {
            this.advance();
          }
          this.advance(); this.advance();
          continue;
        }
        if (this.isNoSQL && this.input[this.pos + 1] === '/') {
          while (this.peek() !== '\n' && this.peek() !== null) this.advance();
          continue;
        }
      }

      const startLine = this.line;
      const startCol = this.column;

      // Strings (Comillas simples y dobles)
      if (char === "'" || char === '"' || char === '`') {
        let quote = char;
        let str = '';
        this.advance(); // skip quote
        while (this.peek() !== quote && this.peek() !== null) {
          str += this.advance();
        }
        if (this.peek() === quote) this.advance();
        tokens.push(new Token(TokenTypes.STRING, str, startLine, startCol));
        continue;
      }

      // Números
      if (/\d/.test(char)) {
        let num = '';
        while (/\d/.test(this.peek()) || this.peek() === '.') {
          num += this.advance();
        }
        tokens.push(new Token(TokenTypes.NUMBER, num, startLine, startCol));
        continue;
      }

      // Operadores y Puntuación
      if (/[+\-*/=<>!%^&|]/.test(char)) {
        let op = '';
        while (/[+\-*/=<>!%^&|]/.test(this.peek()) && this.peek() !== null) {
          op += this.advance();
        }
        tokens.push(new Token(TokenTypes.OPERATOR, op, startLine, startCol));
        continue;
      }

      if (/[(),.;{}[\]]/.test(char)) {
        let punct = this.advance();
        tokens.push(new Token(TokenTypes.PUNCTUATION, punct, startLine, startCol));
        continue;
      }

      // Identificadores y Keywords
      if (/[a-zA-Z_$]/.test(char)) {
        let id = '';
        while (/[a-zA-Z0-9_$]/.test(this.peek()) && this.peek() !== null) {
          id += this.advance();
        }

        const upperId = id.toUpperCase();
        
        if (this.isNoSQL) {
           // Si empieza por $ y noSQL, es operador/keyword de MongoDB
           if (id.startsWith('$')) {
              tokens.push(new Token(TokenTypes.KEYWORD, id, startLine, startCol));
           } else {
              tokens.push(new Token(TokenTypes.IDENTIFIER, id, startLine, startCol));
           }
        } else {
           const sqlKeywords = [
             'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
             'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'VIEW', 'TRIGGER', 'FUNCTION', 'PROCEDURE',
             'DATABASE', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'JOIN', 'ON', 'GROUP', 'BY',
             'ORDER', 'ASC', 'DESC', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT', 'AS', 'AND', 'OR',
             'NOT', 'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE', 'EXISTS', 'UNION', 'ALL', 'RETURNING',
             'OUTPUT', 'MERGE', 'UPSERT', 'WITH', 'RECURSIVE', 'OVER', 'PARTITION', 'ROLLUP', 'CUBE',
             'SEQUENCE', 'PACKAGE', 'SYNONYM', 'MATERIALIZED'
           ];
           
           if (sqlKeywords.includes(upperId)) {
             tokens.push(new Token(TokenTypes.KEYWORD, upperId, startLine, startCol));
           } else {
             tokens.push(new Token(TokenTypes.IDENTIFIER, id, startLine, startCol));
           }
        }
        continue;
      }

      // Si no es nada conocido, avanzar y considerarlo error léxico o ignorar temporalmente
      this.advance();
    }

    tokens.push(new Token(TokenTypes.EOF, '', this.line, this.column));
    return tokens;
  }
}

module.exports = { Lexer, Token, TokenTypes };
