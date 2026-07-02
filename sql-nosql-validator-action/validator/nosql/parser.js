const { Lexer, TokenTypes } = require('../lexer');

const MONGO_OPERATORS = [
  '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin',
  '$and', '$or', '$not', '$nor', '$exists', '$type', '$mod',
  '$regex', '$text', '$where', '$all', '$elemMatch', '$size',
  '$slice', '$set', '$unset', '$inc', '$push', '$pull', '$addToSet',
  '$pop', '$rename', '$currentDate', '$mul', '$min', '$max',
  '$sum', '$avg', '$first', '$last', '$multiply', '$match', '$group', '$sort',
  '$project', '$limit', '$skip', '$unwind', '$lookup', '$count',
  '$addFields', '$replaceRoot', '$out', '$merge', '$bucket',
  '$facet', '$geoNear', '$graphLookup', '$indexStats', '$listSessions',
  '$planCacheStats', '$redact', '$sample', '$sortByCount', '$unionWith',
  '$expr', '$jsonSchema', '$setOnInsert', '$bucketAuto', '$search', '$vectorSearch',
  // Additional common operators
  '$each', '$position', '$sort', '$natural',
  '$cond', '$ifNull', '$switch', '$dateToString', '$toString',
  '$toInt', '$toLong', '$toDouble', '$toObjectId', '$toDate',
  '$concat', '$substr', '$toLower', '$toUpper', '$trim',
  '$arrayElemAt', '$filter', '$map', '$reduce', '$concatArrays',
  '$isArray', '$reverseArray', '$zip',
  '$abs', '$ceil', '$floor', '$log', '$pow', '$sqrt', '$trunc',
  '$dayOfMonth', '$dayOfWeek', '$dayOfYear', '$hour', '$minute',
  '$second', '$millisecond', '$month', '$week', '$year',
  '$dateFromParts', '$dateToParts', '$dateFromString',
  '$literal', '$meta', '$objectToArray', '$arrayToObject',
  '$mergeObjects', '$setEquals', '$setIntersection', '$setUnion',
  '$setDifference', '$setIsSubset', '$anyElementTrue', '$allElementsTrue',
  '$replaceWith', '$replaceAll', '$regexFind', '$regexFindAll', '$regexMatch',
  '$accumulator', '$function', '$let', '$rand', '$sampleRate',
  '$densify', '$fill', '$setWindowFields', '$documents'
];

const MONGO_OPERATOR_SET = new Set(MONGO_OPERATORS);

// Operators that appear as KEYS in objects (left side of colon)
const MONGO_KEY_OPERATORS = new Set([
  '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin',
  '$and', '$or', '$not', '$nor', '$exists', '$type', '$mod',
  '$regex', '$text', '$where', '$all', '$elemMatch', '$size',
  '$slice', '$set', '$unset', '$inc', '$push', '$pull', '$addToSet',
  '$pop', '$rename', '$currentDate', '$mul', '$min', '$max',
  '$match', '$group', '$sort', '$project', '$limit', '$skip',
  '$unwind', '$lookup', '$count', '$addFields', '$replaceRoot',
  '$out', '$merge', '$bucket', '$facet', '$geoNear', '$graphLookup',
  '$redact', '$sample', '$sortByCount', '$unionWith',
  '$expr', '$jsonSchema', '$setOnInsert', '$bucketAuto',
  '$search', '$vectorSearch', '$each', '$position',
  '$cond', '$ifNull', '$switch', '$dateToString', '$toString',
  '$concat', '$substr', '$toLower', '$toUpper', '$trim',
  '$arrayElemAt', '$filter', '$map', '$reduce', '$concatArrays',
  '$sum', '$avg', '$first', '$last', '$multiply',
  '$literal', '$meta', '$objectToArray', '$arrayToObject',
  '$mergeObjects', '$replaceWith', '$let',
  '$densify', '$fill', '$setWindowFields', '$documents',
  '$natural', '$indexStats', '$listSessions', '$planCacheStats'
]);

const MONGO_COMMANDS = [
  'find', 'findOne', 'insertOne', 'insertMany', 'updateOne',
  'updateMany', 'replaceOne', 'deleteOne', 'deleteMany', 'aggregate',
  'countDocuments', 'estimatedDocumentCount', 'distinct', 'bulkWrite',
  'createIndex', 'dropIndex', 'dropIndexes', 'renameCollection', 'watch',
  'findOneAndUpdate', 'findOneAndDelete', 'findOneAndReplace',
  'sort', 'limit', 'skip', 'count', 'explain', 'toArray', 'pretty',
  'forEach', 'map', 'hasNext', 'next', 'drop', 'remove', 'save',
  'update', 'insert', 'getIndexes', 'stats', 'validate',
  'createCollection', 'renameCollection'
];

const MONGO_COLLECTION_COMMANDS = new Set([
  'find', 'findOne', 'insertOne', 'insertMany', 'updateOne',
  'updateMany', 'replaceOne', 'deleteOne', 'deleteMany', 'aggregate',
  'countDocuments', 'estimatedDocumentCount', 'distinct', 'bulkWrite',
  'createIndex', 'dropIndex', 'dropIndexes', 'renameCollection', 'watch',
  'findOneAndUpdate', 'findOneAndDelete', 'findOneAndReplace',
  'drop', 'remove', 'save', 'update', 'insert', 'getIndexes', 'stats',
  'validate'
]);

const MONGO_DB_COMMANDS = new Set([
  'createCollection'
]);

const MONGO_CHAIN_COMMANDS = new Set([
  'sort', 'limit', 'skip', 'count', 'explain', 'toArray', 'pretty',
  'forEach', 'map', 'hasNext', 'next'
]);

const MONGO_VALUE_FUNCTIONS = new Set([
  'ObjectId', 'Date', 'ISODate', 'NumberInt', 'NumberLong', 'NumberDouble',
  'Decimal128', 'RegExp', 'BinData', 'UUID', 'Timestamp'
]);

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

function findSimilar(word, list) {
  for (let kw of list) {
    if (word === kw) continue;
    const dist = levenshtein(word, kw);
    if (dist <= 2 && word.length >= 3) {
      if (dist === 1 || (dist === 2 && word.length >= 4)) {
        return kw;
      }
    }
  }
  return null;
}

/**
 * Checks if a $-prefixed value is a field path reference vs an operator.
 * Field paths are values like "$categoria", "$monto" used in aggregation
 * to reference document fields. They appear as VALUES (right side of colon),
 * not as KEYS (left side of colon).
 *
 * Context tracking: We track whether a $-prefixed token appears in key or value position.
 */
function isFieldPathReference(val) {
  // Field paths: $fieldName, $$variable (system variables like $$ROOT, $$NOW)
  // They do NOT start with a known operator prefix pattern
  // Single $ + lowercase name without known operator = field path
  if (val.startsWith('$$')) return true; // System variables
  if (MONGO_OPERATOR_SET.has(val)) return false; // Known operator
  // If it looks like $someFieldName (not a known operator), it's a field reference
  return /^\$[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(val);
}

class MongoParser {
  constructor(query, startLine = 1) {
    this.query = query.trim();
    this.startLine = startLine;
    const { Lexer } = require('../lexer'); // ensure lexer is available
    const lexer = new Lexer(this.query, true, this.startLine);
    this.tokens = lexer.tokenize();
    this.pos = 0;
    this.errors = [];
    this.suggestions = [];
  }

  peek() {
    return this.tokens[this.pos];
  }

  advance() {
    if (this.pos < this.tokens.length) {
      return this.tokens[this.pos++];
    }
    return this.tokens[this.tokens.length - 1];
  }

  match(expectedValue) {
    const token = this.peek();
    if (token.type === TokenTypes.EOF) return false;
    if (token.value === expectedValue) {
      this.advance();
      return true;
    }
    return false;
  }

  addError(message, line, column, operator = null, fragment = null, suggestion = null) {
    this.errors.push({ line, column, message, operator, fragment, suggestion });
  }

  parse() {
    if (this.tokens.length <= 1) {
      this.addError('La consulta está vacía.', 1, 1, null, null, 'Escribe una consulta válida.');
      return this.getResult();
    }

    if (this.query.startsWith('{') || this.query.startsWith('[')) {
      return this.parseJSON();
    }

    if (!this.match('db')) {
      const token = this.peek();
      this.addError(
        `Error de sintaxis.\nSe esperaba:\ndb\n\nSe encontró:\n${token.value || 'FIN DE CONSULTA'}`,
        token.line, token.column, null, token.value,
        'Inicia la consulta con "db."'
      );
      return this.getResult();
    }

    if (!this.match('.')) {
      const token = this.peek();
      this.addError(
        `Error de sintaxis.\nSe esperaba:\n.\n\nSe encontró:\n${token.value}`,
        token.line, token.column, null, token.value,
        'Utiliza el punto "." para acceder a la colección.'
      );
      return this.getResult();
    }

    const collectionToken = this.advance();
    if (collectionToken.type !== TokenTypes.IDENTIFIER && collectionToken.type !== TokenTypes.STRING) {
      this.addError(
        `Error de sintaxis. Nombre de colección no válido.`,
        collectionToken.line, collectionToken.column, null, collectionToken.value,
        'Escribe un nombre de colección válido.'
      );
      return this.getResult();
    }

    if (!this.match('.')) {
      const token = this.peek();
      this.addError(
        `Error de sintaxis.\nSe esperaba:\n.\n\nSe encontró:\n${token.value}`,
        token.line, token.column, null, token.value,
        'Falta el punto "." antes del comando.'
      );
      return this.getResult();
    }

    const commandToken = this.advance();
    if (!MONGO_COMMANDS.includes(commandToken.value)) {
      const sim = findSimilar(commandToken.value, MONGO_COMMANDS);
      if (sim) {
        this.addError(
          `Comando desconocido "${commandToken.value}".`,
          commandToken.line, commandToken.column, null, commandToken.value,
          `Quizás quiso escribir: ${sim}`
        );
      } else {
        this.addError(
          `Comando desconocido "${commandToken.value}".`,
          commandToken.line, commandToken.column, null, commandToken.value,
          `Soportados: ${MONGO_COMMANDS.slice(0, 10).join(', ')}...`
        );
      }
    }

    if (!this.match('(')) {
      const token = this.peek();
      this.addError(
        `Error de sintaxis.\nSe esperaba:\n(\n\nSe encontró:\n${token.value}`,
        token.line, token.column, null, token.value,
        'Falta el paréntesis de apertura "(".'
      );
      return this.getResult();
    }

    this.scanObjectAndCheckOperators(1);

    if (!this.match(')')) {
      if (this.peek().type !== TokenTypes.EOF) {
        this.advance();
      } else {
        const token = this.tokens[this.tokens.length - 2] || this.peek();
        this.addError(
          `Error de sintaxis. Falta paréntesis de cierre.`,
          token.line, token.column, null, null,
          'Agregue ) al final del comando.'
        );
      }
    }

    // Support chained methods: .sort(), .limit(), .skip(), .pretty(), etc.
    while (this.peek().type !== TokenTypes.EOF && this.peek().type === TokenTypes.DOT) {
      this.advance(); // consume '.'
      const chainToken = this.peek();
      if (chainToken.type === TokenTypes.IDENTIFIER) {
        const chainCmd = chainToken.value;
        this.advance();
        if (MONGO_COMMANDS.includes(chainCmd) || ['sort','limit','skip','pretty','toArray','count','explain','forEach','map','hasNext','next'].includes(chainCmd)) {
          if (this.match('(')) {
            this.scanObjectAndCheckOperators(1);
            if (!this.match(')')) {
              if (this.peek().type === TokenTypes.EOF) {
                this.addError('Falta paréntesis de cierre para método encadenado.',
                  chainToken.line, chainToken.column, null, chainCmd,
                  `Agregue ) al final de .${chainCmd}()`);
              }
            }
          }
        } else {
          const sim = findSimilar(chainCmd, MONGO_COMMANDS);
          if (sim) {
            this.addError(`Método encadenado desconocido "${chainCmd}".`,
              chainToken.line, chainToken.column, null, chainCmd,
              `Quizás quiso escribir: ${sim}`);
          }
        }
      }
    }

    return this.getResult();
  }

  parseJSON() {
    try {
      const parsed = JSON.parse(this.query);

      const keys = Object.keys(parsed);
      let isMongo = false;
      for (const cmd of MONGO_COMMANDS) {
        if (keys.includes(cmd)) {
          isMongo = true;
          break;
        }
      }
      if (!isMongo) {
         for (const k of keys) {
            if (k.startsWith('$')) isMongo = true;
         }
         if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
           const stage = Object.keys(parsed[0])[0];
           if (stage && (MONGO_OPERATOR_SET.has(stage) || stage.startsWith('$'))) {
             isMongo = true;
           }
         }
      }

      if (!isMongo) {
         this.addError(
           `JSON válido pero no parece una consulta MongoDB reconocida.`, 1, 1,
           null, null,
           'Usa comandos como "find", "aggregate", o operadores como "$match".'
         );
      } else {
         this.pos = 0;
         this.scanObjectAndCheckOperators(0, true);
      }
    } catch (e) {
      const match = e.message.match(/position (\d+)/);
      let line = 1; let col = 1;
      if (match) {
        const pos = parseInt(match[1], 10);
        const textBefore = this.query.substring(0, pos);
        line = (textBefore.match(/\n/g) || []).length + 1;
        col = pos - textBefore.lastIndexOf('\n');
      }
      this.addError(
        `Error parseando JSON: ${e.message}`, line, col, null, null,
        'Verifica la estructura JSON. Comillas dobles son obligatorias para llaves.'
      );
    }
    return this.getResult();
  }

  scanObjectAndCheckOperators(initialParenCount = 1, isJson = false) {
    let braceCount = 0;
    let bracketCount = 0;
    let parenCount = initialParenCount;

    // Context tracking: detect key vs value position
    // After '{' we're in key position. After ':' we're in value position.
    // After ',' inside an object, we're back to key position.
    let contextStack = []; // stack of 'object' | 'array'
    let inKeyPosition = false;

    while (this.peek().type !== TokenTypes.EOF) {
      const token = this.peek();

      if (token.value === '{') {
        braceCount++;
        contextStack.push('object');
        inKeyPosition = true;
      }
      if (token.value === '}') {
        braceCount--;
        if (braceCount < 0) {
          this.addError('Llave de cierre "}" inesperada o sobrando.',
            token.line, token.column, null, token.value,
            'Elimine esta llave o verifique las aperturas.');
          braceCount = 0;
        }
        if (contextStack.length > 0 && contextStack[contextStack.length - 1] === 'object') {
          contextStack.pop();
        }
        inKeyPosition = contextStack.length > 0 && contextStack[contextStack.length - 1] === 'object';
      }
      if (token.value === '[') {
        bracketCount++;
        contextStack.push('array');
        inKeyPosition = false;
      }
      if (token.value === ']') {
        bracketCount--;
        if (bracketCount < 0) {
          this.addError('Corchete de cierre "]" inesperado o sobrando.',
            token.line, token.column, null, token.value,
            'Elimine este corchete o verifique las aperturas.');
          bracketCount = 0;
        }
        if (contextStack.length > 0 && contextStack[contextStack.length - 1] === 'array') {
          contextStack.pop();
        }
        inKeyPosition = contextStack.length > 0 && contextStack[contextStack.length - 1] === 'object';
      }
      if (token.value === '(') parenCount++;
      if (token.value === ')') {
        if (!isJson) {
           parenCount--;
           if (parenCount === 0) break;
           if (parenCount < 0) {
             this.addError('Paréntesis de cierre ")" inesperado o sobrando.',
               token.line, token.column, null, token.value,
               'Elimine este paréntesis o verifique las aperturas.');
             parenCount = 0;
           }
        }
      }

      // Colon means we transition from key to value
      if (token.value === ':') {
        inKeyPosition = false;
      }

      // Comma: back to key position if inside object, stays value if array
      if (token.value === ',') {
        if (contextStack.length > 0 && contextStack[contextStack.length - 1] === 'object') {
          inKeyPosition = true;
        }
      }

      // Check $-prefixed tokens
      let valToCheck = token.value;
      if (token.type === TokenTypes.STRING) {
         valToCheck = valToCheck.replace(/^["']/, '').replace(/["']$/, '');
      }

      if (valToCheck.startsWith('$')) {
        if (inKeyPosition) {
          // In key position: must be a known operator
          if (!MONGO_KEY_OPERATORS.has(valToCheck) && !MONGO_OPERATOR_SET.has(valToCheck)) {
            const sim = findSimilar(valToCheck, MONGO_OPERATORS);
            if (sim) {
               this.addError(
                 `Operador MongoDB desconocido: ${valToCheck}`,
                 token.line, token.column, valToCheck, valToCheck,
                 `Quizás quiso escribir: ${sim}`
               );
            } else {
               this.addError(
                 `Operador MongoDB desconocido: ${valToCheck}`,
                 token.line, token.column, valToCheck, valToCheck,
                 'Asegúrese de escribir correctamente el operador (ej. $match).'
               );
            }
          }
        } else {
          // In value position: could be a field path reference like "$campo"
          // Only flag if it doesn't look like a field path AND isn't a known operator
          if (!isFieldPathReference(valToCheck) && !MONGO_OPERATOR_SET.has(valToCheck)) {
            const sim = findSimilar(valToCheck, MONGO_OPERATORS);
            if (sim) {
               this.addError(
                 `Operador MongoDB desconocido: ${valToCheck}`,
                 token.line, token.column, valToCheck, valToCheck,
                 `Quizás quiso escribir: ${sim}`
               );
            }
            // If no similar operator found, it's likely a field path — don't error
          }
        }
      }

      this.advance();
    }

    if (braceCount > 0) {
      this.addError('Falta cierre de llave.',
        this.tokens[this.tokens.length-2]?.line || 1,
        this.tokens[this.tokens.length-2]?.column || 1,
        null, null, 'Agregue } antes del final del objeto o pipeline.');
    }
    if (bracketCount > 0) {
      this.addError('Falta cierre de corchete.',
        this.tokens[this.tokens.length-2]?.line || 1,
        this.tokens[this.tokens.length-2]?.column || 1,
        null, null, 'Agregue ] antes del final del array.');
    }
    if (!isJson && parenCount > 1) {
      this.addError('Falta cierre de paréntesis.',
        this.tokens[this.tokens.length-2]?.line || 1,
        this.tokens[this.tokens.length-2]?.column || 1,
        null, null, 'Agregue ) para cerrar los argumentos.');
    }
  }

  getResult() {
    if (this.errors.length === 0) {
      this.suggestions.push(`✅ Sintaxis MongoDB correcta.`);
    } else if (this.errors[0] && this.errors[0].suggestion && !this.suggestions.includes(this.errors[0].suggestion)) {
      this.suggestions.push(this.errors[0].suggestion);
    }

    return {
      valid: this.errors.length === 0,
      dialect: 'MongoDB',
      confidence: 100,
      errors: this.errors,
      suggestions: this.suggestions
    };
  }
}

class StrictMongoParser {
  constructor(query, startLine = 1) {
    this.query = query.trim();
    this.startLine = startLine;
    const lexer = new Lexer(this.query, true, this.startLine);
    this.tokens = lexer.tokenize().filter(t => t.type !== TokenTypes.COMMENT);
    this.pos = 0;
    this.errors = [];
    this.suggestions = [];
    this.collection = null;
    this.command = null;
  }

  peek(offset = 0) {
    return this.tokens[this.pos + offset] || this.tokens[this.tokens.length - 1];
  }

  previous() {
    return this.tokens[Math.max(0, this.pos - 1)] || this.peek();
  }

  advance() {
    const token = this.peek();
    if (token.type !== TokenTypes.EOF) this.pos++;
    return token;
  }

  match(value) {
    if (this.peek().value === value) {
      this.advance();
      return true;
    }
    return false;
  }

  charPosition(line, column) {
    const relLine = Math.max(1, line - this.startLine + 1);
    const lines = this.query.split('\n');
    let pos = 0;
    for (let i = 0; i < relLine - 1; i++) pos += (lines[i] || '').length + 1;
    return pos + column;
  }

  addError(message, line, column, operator = null, fragment = null, suggestion = null) {
    if (this.errors.length > 0) return;
    this.errors.push({
      line,
      column,
      position: this.charPosition(line, column),
      message,
      operator,
      fragment,
      suggestion
    });
  }

  failAt(token, message, expected = null, suggestion = null) {
    const found = token && token.type !== TokenTypes.EOF ? token.value : 'FIN_DE_CONSULTA';
    const text = expected
      ? `${message}\nEncontrado: ${found}\nSe esperaba: ${expected}`
      : message;
    this.addError(text, token.line || this.startLine, token.column || 1, null, found, suggestion);
    return false;
  }

  expect(value, message, suggestion = null) {
    if (this.match(value)) return true;
    return this.failAt(this.peek(), message, value, suggestion);
  }

  isIdentifierToken(token) {
    return token.type === TokenTypes.IDENTIFIER || token.type === TokenTypes.KEYWORD;
  }

  parse() {
    if (!this.query) {
      this.addError('La consulta está vacía.', 1, 1, null, null, 'Escribe una consulta MongoDB válida.');
      return this.getResult();
    }

    if (this.query.startsWith('{') || this.query.startsWith('[')) {
      return this.parseJSON();
    }

    return this.parseScript();
  }

  parseScript() {
    while (this.peek().type !== TokenTypes.EOF) {
      if (this.match(';')) continue;

      if (this.peek().value === 'use') {
        this.parseUseStatement();
      } else {
        this.parseDbStatement();
      }
      if (this.errors.length > 0) return this.getResult();

      this.match(';');
      if (this.peek().type !== TokenTypes.EOF && this.peek().value !== 'db' && this.peek().value !== 'use') {
        this.failAt(this.peek(), 'Tokens inesperados después de la sentencia MongoDB.', 'Fin de sentencia o nueva sentencia db/use');
        return this.getResult();
      }
    }
    return this.getResult();
  }

  parseUseStatement() {
    const useToken = this.advance();
    const dbToken = this.peek();
    if (!this.isIdentifierToken(dbToken) && dbToken.type !== TokenTypes.STRING) {
      this.failAt(dbToken, 'use requiere el nombre de la base de datos.', 'Nombre de base de datos');
      return;
    }
    this.command = 'use';
    this.collection = dbToken.value;
    this.advance();
  }

  parseDbStatement() {
    if (!this.expect('db', 'La consulta MongoDB debe iniciar con db o use.', 'Usa use base; o db.coleccion.metodo(...).')) return;
    if (!this.expect('.', 'Falta el punto después de db.', 'Usa db.coleccion.metodo(...).')) return;

    const firstToken = this.peek();
    if (!this.isIdentifierToken(firstToken)) {
      this.failAt(firstToken, 'Nombre de colección o método de base no válido.', 'Colección o método');
      return;
    }

    if (MONGO_DB_COMMANDS.has(firstToken.value)) {
      this.command = firstToken.value;
      this.collection = null;
      this.advance();
      this.parseCallAndValidate(this.command, firstToken);
      return;
    }

    this.collection = firstToken.value;
    this.advance();

    if (!this.expect('.', 'Falta el punto antes del método.', 'Usa db.coleccion.metodo(...).')) return;

    const commandToken = this.peek();
    if (!this.isIdentifierToken(commandToken)) {
      this.failAt(commandToken, 'Método MongoDB no válido.', 'Método existente', 'Escribe un método como find, insertOne, updateOne o aggregate.');
      return;
    }
    this.command = commandToken.value;
    this.advance();

    if (!MONGO_COLLECTION_COMMANDS.has(this.command)) {
      const sim = findSimilar(this.command, [...MONGO_COLLECTION_COMMANDS, ...MONGO_DB_COMMANDS]);
      this.addError(
        `Comando desconocido "${this.command}". Método MongoDB inexistente.`,
        commandToken.line,
        commandToken.column,
        null,
        this.command,
        sim ? `Quizás quiso escribir: ${sim}` : 'Use un método MongoDB válido como find, insertOne, updateOne, deleteOne o aggregate.'
      );
      return;
    }

    this.parseCallAndValidate(this.command, commandToken);
    if (this.errors.length > 0) return;
    this.parseChainedMethods();
  }

  parseCallAndValidate(command, commandToken) {
    if (!this.expect('(', 'Falta abrir paréntesis del método.', 'Agregue "(" después del método.')) return;
    const args = this.parseArgumentList(')');
    if (this.errors.length > 0) return;
    if (!this.expect(')', 'Falta cerrar paréntesis ")".', 'Agregue ")" al final del método.')) return;
    this.validateCommandArguments(command, args, commandToken);
  }

  parseJSON() {
    try {
      const parsed = JSON.parse(this.query);
      if (!this.looksLikeMongoJSON(parsed)) {
        this.addError(
          'JSON válido, pero no parece una consulta MongoDB reconocida.',
          1,
          1,
          null,
          null,
          'Usa comandos como "find", "aggregate" u operadores como "$match".'
        );
      } else {
        this.validateParsedJSONOperators(parsed);
      }
    } catch (e) {
      const match = e.message.match(/position (\d+)/);
      let line = 1;
      let col = 1;
      if (match) {
        const pos = parseInt(match[1], 10);
        const textBefore = this.query.substring(0, pos);
        line = (textBefore.match(/\n/g) || []).length + 1;
        col = pos - textBefore.lastIndexOf('\n');
      }
      this.addError(
        `JSON inválido: ${e.message}`,
        line,
        col,
        null,
        null,
        'Verifica llaves, valores y comillas dobles en JSON puro.'
      );
    }
    return this.getResult();
  }

  looksLikeMongoJSON(value) {
    if (Array.isArray(value)) return value.some(item => this.looksLikeMongoJSON(item));
    if (value && typeof value === 'object') {
      return Object.keys(value).some(key =>
        MONGO_COLLECTION_COMMANDS.has(key) ||
        MONGO_OPERATOR_SET.has(key) ||
        key.startsWith('$') ||
        this.looksLikeMongoJSON(value[key])
      );
    }
    return false;
  }

  validateParsedJSONOperators(value) {
    if (Array.isArray(value)) {
      value.forEach(item => this.validateParsedJSONOperators(item));
      return;
    }
    if (!value || typeof value !== 'object') return;
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') && !MONGO_KEY_OPERATORS.has(key) && !MONGO_OPERATOR_SET.has(key)) {
        const sim = findSimilar(key, MONGO_OPERATORS);
        this.addError(
          `Operador MongoDB desconocido: ${key}`,
          1,
          1,
          key,
          key,
          sim ? `Quizás quiso escribir: ${sim}` : 'Revise el nombre del operador MongoDB.'
        );
        return;
      }
      this.validateParsedJSONOperators(value[key]);
      if (this.errors.length > 0) return;
    }
  }

  parseChainedMethods() {
    while (this.peek().type === TokenTypes.DOT) {
      this.advance();
      const token = this.peek();
      if (!this.isIdentifierToken(token)) {
        this.failAt(token, 'Método encadenado no válido.', 'Método encadenado');
        return;
      }
      const name = token.value;
      this.advance();
      if (!MONGO_CHAIN_COMMANDS.has(name)) {
        const sim = findSimilar(name, [...MONGO_CHAIN_COMMANDS]);
        this.addError(
          `Método encadenado desconocido: ${name}`,
          token.line,
          token.column,
          null,
          name,
          sim ? `Quizás quiso escribir: ${sim}` : 'Use métodos encadenados válidos como sort, limit, skip o pretty.'
        );
        return;
      }
      if (!this.expect('(', `Falta abrir paréntesis en .${name}().`, 'Agregue "(" en el método encadenado.')) return;
      const args = this.parseArgumentList(')');
      if (this.errors.length > 0) return;
      if (!this.expect(')', `Falta cerrar paréntesis en .${name}().`, 'Agregue ")" en el método encadenado.')) return;
      this.validateChainArguments(name, args, token);
      if (this.errors.length > 0) return;
    }
  }

  parseArgumentList(closeValue) {
    const args = [];
    if (this.peek().type === TokenTypes.EOF) {
      this.failAt(this.previous(), `Falta cerrar ${closeValue}.`, closeValue);
      return args;
    }
    if (this.peek().value === closeValue) return args;

    while (this.peek().type !== TokenTypes.EOF && this.peek().value !== closeValue) {
      const value = this.parseValue();
      if (this.errors.length > 0) return args;
      args.push(value);

      if (this.peek().value === ',') {
        const comma = this.advance();
        if (this.peek().value === closeValue || this.peek().type === TokenTypes.EOF) {
          this.failAt(comma, 'Coma final sin argumento.', 'Otro argumento');
          return args;
        }
        continue;
      }
      if (this.peek().value !== closeValue) {
        this.failAt(this.peek(), 'Falta coma entre argumentos.', `, o ${closeValue}`);
        return args;
      }
    }

    if (this.peek().type === TokenTypes.EOF) this.failAt(this.previous(), `Falta cerrar ${closeValue}.`, closeValue);
    return args;
  }

  parseValue() {
    const token = this.peek();
    if (token.type === TokenTypes.EOF) {
      this.failAt(token, 'Valor incompleto.', 'Valor');
      return { kind: 'invalid' };
    }
    if (token.value === '{') return this.parseObject();
    if (token.value === '[') return this.parseArray();
    if (token.type === TokenTypes.OPERATOR && token.value.startsWith('/')) return this.parseRegexLiteral();
    if (token.type === TokenTypes.STRING) {
      this.advance();
      return { kind: 'string' };
    }
    if (token.type === TokenTypes.NUMBER) {
      if (!/^\d+(\.\d+)?([eE][+-]?\d+)?$/.test(token.value)) {
        this.failAt(token, 'Literal numérico no válido.', 'Número');
        return { kind: 'invalid' };
      }
      this.advance();
      return { kind: 'number' };
    }
    if (token.type === TokenTypes.OPERATOR && token.value === '-') {
      const next = this.peek(1);
      if (next.type === TokenTypes.NUMBER) {
        this.advance();
        this.advance();
        return { kind: 'number' };
      }
      this.failAt(token, 'Signo negativo sin número.', 'Número');
      return { kind: 'invalid' };
    }
    if (this.isIdentifierToken(token)) {
      if (['true', 'false', 'null'].includes(token.value)) {
        this.advance();
        return { kind: token.value };
      }
      if (isFieldPathReference(token.value)) {
        this.advance();
        return { kind: 'fieldPath' };
      }
      if (token.value === 'new') return this.parseNewExpression();
      if (this.peek(1).value === '(' && MONGO_VALUE_FUNCTIONS.has(token.value)) return this.parseFunctionValue();
      this.failAt(token, `Valor no válido: ${token.value}`, 'Objeto, array, string, número, booleano, null o función MongoDB válida');
      return { kind: 'invalid' };
    }
    this.failAt(token, 'Valor no válido o incompleto.', 'Valor');
    return { kind: 'invalid' };
  }

  parseRegexLiteral() {
    const start = this.advance();
    if (start.value.length > 1 && start.value.endsWith('/')) {
      return { kind: 'regex' };
    }
    while (this.peek().type !== TokenTypes.EOF) {
      const token = this.advance();
      if (token.type === TokenTypes.OPERATOR && token.value.includes('/')) {
        if (this.peek().type === TokenTypes.IDENTIFIER && /^[gimsuy]+$/.test(this.peek().value)) {
          this.advance();
        }
        return { kind: 'regex' };
      }
    }
    this.failAt(start, 'Expresión regular sin cierre "/".', 'Cierre de regex /');
    return { kind: 'invalid' };
  }

  parseObject() {
    this.advance();
    let entries = 0;
    if (this.match('}')) return { kind: 'object', entries };

    while (this.peek().type !== TokenTypes.EOF && this.peek().value !== '}') {
      const keyToken = this.peek();
      if (!this.isObjectKey(keyToken)) {
        this.failAt(keyToken, 'Clave de objeto MongoDB no válida.', 'Nombre de campo u operador');
        return { kind: 'object', entries };
      }
      const key = keyToken.value;
      this.validateOperatorKey(keyToken);
      if (this.errors.length > 0) return { kind: 'object', entries };
      this.advance();

      if (!this.expect(':', 'Falta ":" después de la clave del objeto.', 'Dos puntos (:)')) return { kind: 'object', entries };
      if ([',', '}', ']', ')'].includes(this.peek().value) || this.peek().type === TokenTypes.EOF) {
        this.failAt(this.peek(), `Falta valor para la clave "${key}".`, 'Valor');
        return { kind: 'object', entries };
      }
      this.parseValue();
      if (this.errors.length > 0) return { kind: 'object', entries };
      entries++;

      if (this.match(',')) {
        if (this.peek().value === '}') {
          this.failAt(this.previous(), 'Coma final dentro del objeto.', 'Otra clave');
          return { kind: 'object', entries };
        }
        continue;
      }
      if (this.peek().value !== '}') {
        this.failAt(this.peek(), 'Falta coma entre propiedades del objeto.', ', o }');
        return { kind: 'object', entries };
      }
    }

    if (!this.expect('}', 'Falta cerrar llave "}".', 'Llave de cierre }')) {
      const last = this.previous();
      this.addError('Falta cerrar llave "}".', last.line, last.column, null, null, 'Agregue "}" para cerrar el objeto.');
    }
    return { kind: 'object', entries };
  }

  parseArray() {
    this.advance();
    let items = 0;
    if (this.match(']')) return { kind: 'array', items };

    while (this.peek().type !== TokenTypes.EOF && this.peek().value !== ']') {
      this.parseValue();
      if (this.errors.length > 0) return { kind: 'array', items };
      items++;
      if (this.match(',')) {
        if (this.peek().value === ']') {
          this.failAt(this.previous(), 'Coma final dentro del array.', 'Otro valor');
          return { kind: 'array', items };
        }
        continue;
      }
      if (this.peek().value !== ']') {
        this.failAt(this.peek(), 'Falta coma entre valores del array.', ', o ]');
        return { kind: 'array', items };
      }
    }

    if (!this.expect(']', 'Falta cerrar corchete "]".', 'Corchete de cierre ]')) {
      const last = this.previous();
      this.addError('Falta cerrar corchete "]".', last.line, last.column, null, null, 'Agregue "]" para cerrar el array.');
    }
    return { kind: 'array', items };
  }

  parseFunctionValue() {
    const fn = this.advance();
    this.expect('(', `Falta abrir paréntesis en ${fn.value}().`, '(');
    if (this.errors.length > 0) return { kind: 'function' };
    this.parseArgumentList(')');
    if (this.errors.length > 0) return { kind: 'function' };
    this.expect(')', `Falta cerrar paréntesis en ${fn.value}().`, ')');
    return { kind: 'function', name: fn.value };
  }

  parseNewExpression() {
    const newToken = this.advance();
    const fn = this.peek();
    if (!this.isIdentifierToken(fn) || !MONGO_VALUE_FUNCTIONS.has(fn.value)) {
      this.failAt(fn, 'Constructor MongoDB no válido después de new.', 'Date u otro constructor soportado');
      return { kind: 'function' };
    }
    this.advance();
    if (!this.expect('(', `Falta abrir paréntesis en new ${fn.value}().`, '(')) return { kind: 'function' };
    this.parseArgumentList(')');
    if (this.errors.length > 0) return { kind: 'function' };
    this.expect(')', `Falta cerrar paréntesis en new ${fn.value}().`, ')');
    return { kind: 'function', name: `${newToken.value} ${fn.value}` };
  }

  isObjectKey(token) {
    return token.type === TokenTypes.IDENTIFIER ||
      token.type === TokenTypes.KEYWORD ||
      token.type === TokenTypes.STRING ||
      token.type === TokenTypes.NUMBER;
  }

  validateOperatorKey(token) {
    if (!String(token.value).startsWith('$')) return;
    if (MONGO_KEY_OPERATORS.has(token.value) || MONGO_OPERATOR_SET.has(token.value)) return;
    const sim = findSimilar(token.value, MONGO_OPERATORS);
    this.addError(
      `Operador MongoDB desconocido: ${token.value}`,
      token.line,
      token.column,
      token.value,
      token.value,
      sim ? `Quizás quiso escribir: ${sim}` : 'Revise el nombre del operador MongoDB.'
    );
  }

  validateCommandArguments(command, args, token) {
    const count = args.length;
    const requireAtLeast = (n, message) => {
      if (count < n) {
        this.addError(message, token.line, token.column, null, command, 'Agregue los argumentos obligatorios del método.');
      }
    };

    if (command === 'createCollection') {
      requireAtLeast(1, 'createCollection requiere el nombre de la colección.');
      return;
    }
    if (['find', 'findOne', 'estimatedDocumentCount', 'getIndexes', 'stats', 'validate', 'drop', 'watch'].includes(command)) return;
    if (['insertOne', 'insertMany', 'deleteOne', 'deleteMany', 'remove', 'save', 'insert', 'createIndex', 'dropIndex', 'renameCollection', 'distinct', 'bulkWrite'].includes(command)) {
      requireAtLeast(1, `${command} requiere al menos 1 argumento.`);
      return;
    }
    if (['updateOne', 'updateMany', 'replaceOne', 'update', 'findOneAndUpdate', 'findOneAndReplace'].includes(command)) {
      requireAtLeast(2, `${command} requiere filtro y documento de actualización/reemplazo.`);
      return;
    }
    if (command === 'findOneAndDelete') {
      requireAtLeast(1, `${command} requiere un filtro.`);
      return;
    }
    if (command === 'aggregate') {
      requireAtLeast(1, 'aggregate requiere un pipeline array.');
      if (count >= 1 && args[0].kind !== 'array') {
        this.addError('aggregate requiere que el primer argumento sea un array de etapas.', token.line, token.column, null, command, 'Use aggregate([{ $match: ... }]).');
      }
    }
  }

  validateChainArguments(command, args, token) {
    if (['sort', 'limit', 'skip'].includes(command) && args.length < 1) {
      this.addError(`.${command}() requiere un argumento.`, token.line, token.column, null, command, 'Agregue el argumento del método encadenado.');
    }
  }

  getResult() {
    if (this.errors.length > 0 && this.errors[0].suggestion) this.suggestions.push(this.errors[0].suggestion);

    return {
      valid: this.errors.length === 0,
      dialect: 'MongoDB',
      confidence: 100,
      type: this.command || 'json',
      collection: this.collection || null,
      compatible: ['MongoDB'],
      incompatible: [
        { engine: 'SQL ANSI', reasons: ['Sintaxis MongoDB'] },
        { engine: 'MySQL', reasons: ['Sintaxis MongoDB'] },
        { engine: 'PostgreSQL', reasons: ['Sintaxis MongoDB'] },
        { engine: 'SQL Server', reasons: ['Sintaxis MongoDB'] },
        { engine: 'Oracle', reasons: ['Sintaxis MongoDB'] },
        { engine: 'SQLite', reasons: ['Sintaxis MongoDB'] }
      ],
      errors: this.errors,
      suggestions: this.suggestions
    };
  }
}

module.exports = { MongoParser: StrictMongoParser };
