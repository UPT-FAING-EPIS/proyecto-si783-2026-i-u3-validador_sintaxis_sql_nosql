const { Lexer, TokenTypes } = require('../lexer');

const MONGO_OPERATORS = [
  '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin',
  '$and', '$or', '$not', '$nor', '$exists', '$type', '$mod',
  '$regex', '$text', '$where', '$all', '$elemMatch', '$size',
  '$slice', '$set', '$unset', '$inc', '$push', '$pull', '$addToSet',
  '$pop', '$rename', '$currentDate', '$mul', '$min', '$max',
  '$sum', '$avg', '$first', '$last', '$match', '$group', '$sort',
  '$project', '$limit', '$skip', '$unwind', '$lookup', '$count',
  '$addFields', '$replaceRoot', '$out', '$merge', '$bucket',
  '$facet', '$geoNear', '$graphLookup', '$indexStats', '$listSessions',
  '$planCacheStats', '$redact', '$sample', '$sortByCount', '$unionWith',
  '$expr', '$jsonSchema', '$setOnInsert', '$bucketAuto', '$search', '$vectorSearch'
];

const MONGO_COMMANDS = [
  'find', 'findOne', 'insertOne', 'insertMany', 'updateOne',
  'updateMany', 'replaceOne', 'deleteOne', 'deleteMany', 'aggregate',
  'countDocuments', 'estimatedDocumentCount', 'distinct', 'bulkWrite', 
  'createIndex', 'dropIndex', 'dropIndexes', 'renameCollection', 'watch',
  'findOneAndUpdate', 'findOneAndDelete'
];

class MongoParser {
  constructor(query) {
    this.query = query.trim();
    const lexer = new Lexer(this.query, true);
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

    // Comprobar si es JSON puro
    if (this.query.startsWith('{') || this.query.startsWith('[')) {
      return this.parseJSON();
    }

    // Estructura esperada: db.<coleccion>.<comando>(...)
    if (!this.match('db')) {
      const token = this.peek();
      this.addError(`Error de sintaxis.\nSe esperaba:\ndb\n\nSe encontró:\n${token.value || 'FIN DE CONSULTA'}`, token.line, token.column, null, token.value, 'Inicia la consulta con "db."');
      return this.getResult();
    }

    if (!this.match('.')) {
      const token = this.peek();
      this.addError(`Error de sintaxis.\nSe esperaba:\n.\n\nSe encontró:\n${token.value}`, token.line, token.column, null, token.value, 'Utiliza el punto "." para acceder a la colección.');
      return this.getResult();
    }

    // Nombre de colección
    const collectionToken = this.advance();
    if (collectionToken.type !== TokenTypes.IDENTIFIER && collectionToken.type !== TokenTypes.STRING) {
      this.addError(`Error de sintaxis. Nombre de colección no válido.`, collectionToken.line, collectionToken.column, null, collectionToken.value, 'Escribe un nombre de colección válido.');
      return this.getResult();
    }

    if (!this.match('.')) {
      const token = this.peek();
      this.addError(`Error de sintaxis.\nSe esperaba:\n.\n\nSe encontró:\n${token.value}`, token.line, token.column, null, token.value, 'Falta el punto "." antes del comando.');
      return this.getResult();
    }

    // Comando
    const commandToken = this.advance();
    if (!MONGO_COMMANDS.includes(commandToken.value)) {
      this.addError(`Comando desconocido "${commandToken.value}".`, commandToken.line, commandToken.column, null, commandToken.value, `Soportados: ${MONGO_COMMANDS.slice(0, 5).join(', ')}...`);
    }

    if (!this.match('(')) {
      const token = this.peek();
      this.addError(`Error de sintaxis.\nSe esperaba:\n(\n\nSe encontró:\n${token.value}`, token.line, token.column, null, token.value, 'Falta el paréntesis de apertura "(".');
      return this.getResult();
    }

    this.scanObjectAndCheckOperators(1);

    // Check balancing
    if (!this.match(')')) {
      if (this.peek().type !== TokenTypes.EOF) {
        this.advance(); // Consumimos en caso de que hubiera un ')' al final
      } else {
        const token = this.tokens[this.tokens.length - 2] || this.peek();
        this.addError(`Error de sintaxis. Falta paréntesis de cierre.`, token.line, token.column, null, null, 'Agregue ) al final del comando.');
      }
    }

    return this.getResult();
  }

  parseJSON() {
    try {
      // Validate JSON structure
      const parsed = JSON.parse(this.query);
      
      // Check for command
      const keys = Object.keys(parsed);
      let isMongo = false;
      for (const cmd of MONGO_COMMANDS) {
        if (keys.includes(cmd)) {
          isMongo = true;
          break;
        }
      }
      if (!isMongo) {
         // Si no tiene "find", "aggregate", etc, igual podria ser un pipeline suelto, pero avisamos.
         if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
           const stage = Object.keys(parsed[0])[0];
           if (stage && MONGO_OPERATORS.includes(stage)) {
             isMongo = true;
           }
         }
      }

      if (!isMongo) {
         this.addError(`JSON válido pero no parece una consulta MongoDB reconocida.`, 1, 1, null, null, 'Usa comandos como "find", "aggregate", o operadores como "$match".');
      } else {
         // Check invalid operators via naive text scan or lexer
         this.pos = 0; // Reset
         this.scanObjectAndCheckOperators(0, true);
      }
    } catch (e) {
      // Intentar extraer linea/columna del error JSON
      const match = e.message.match(/position (\d+)/);
      let line = 1; let col = 1;
      if (match) {
        const pos = parseInt(match[1], 10);
        const textBefore = this.query.substring(0, pos);
        line = (textBefore.match(/\n/g) || []).length + 1;
        col = pos - textBefore.lastIndexOf('\n');
      }
      this.addError(`Error parseando JSON: ${e.message}`, line, col, null, null, 'Verifica la estructura JSON. Comillas dobles son obligatorias para llaves.');
    }
    return this.getResult();
  }

  scanObjectAndCheckOperators(initialParenCount = 1, isJson = false) {
    let braceCount = 0;
    let bracketCount = 0;
    let parenCount = initialParenCount;

    while (this.peek().type !== TokenTypes.EOF) {
      const token = this.peek();

      if (token.value === '{') braceCount++;
      if (token.value === '}') {
        braceCount--;
        if (braceCount < 0) {
          this.addError('Llave de cierre "}" inesperada o sobrando.', token.line, token.column, null, token.value, 'Elimine esta llave o verifique las aperturas.');
          braceCount = 0;
        }
      }
      if (token.value === '[') bracketCount++;
      if (token.value === ']') {
        bracketCount--;
        if (bracketCount < 0) {
          this.addError('Corchete de cierre "]" inesperado o sobrando.', token.line, token.column, null, token.value, 'Elimine este corchete o verifique las aperturas.');
          bracketCount = 0;
        }
      }
      if (token.value === '(') parenCount++;
      if (token.value === ')') {
        if (!isJson) {
           parenCount--;
           if (parenCount === 0) break; // Fin del comando principal db.col.cmd(...)
           if (parenCount < 0) {
             this.addError('Paréntesis de cierre ")" inesperado o sobrando.', token.line, token.column, null, token.value, 'Elimine este paréntesis o verifique las aperturas.');
             parenCount = 0;
           }
        }
      }

      // Validar operadores
      let valToCheck = token.value;
      if (token.type === TokenTypes.STRING) {
         // Remove quotes to check operators in JSON mode
         valToCheck = valToCheck.replace(/^["']/, '').replace(/["']$/, '');
      }

      if (valToCheck.startsWith('$')) {
        if (!MONGO_OPERATORS.includes(valToCheck)) {
          this.addError(`Operador MongoDB desconocido: ${valToCheck}`, token.line, token.column, valToCheck, valToCheck, 'Asegúrese de escribir correctamente el operador (ej. $match).');
        }
      }

      this.advance();
    }

    if (braceCount > 0) this.addError('Falta cierre de llave.', this.tokens[this.tokens.length-2]?.line || 1, this.tokens[this.tokens.length-2]?.column || 1, null, null, 'Agregue } antes del final del objeto o pipeline.');
    if (bracketCount > 0) this.addError('Falta cierre de corchete.', this.tokens[this.tokens.length-2]?.line || 1, this.tokens[this.tokens.length-2]?.column || 1, null, null, 'Agregue ] antes del final del array.');
    if (!isJson && parenCount > 1) this.addError('Falta cierre de paréntesis.', this.tokens[this.tokens.length-2]?.line || 1, this.tokens[this.tokens.length-2]?.column || 1, null, null, 'Agregue ) para cerrar los argumentos.');
  }

  getResult() {
    if (this.errors.length === 0) {
      this.suggestions.push(`✅ Sintaxis MongoDB correcta.`);
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

module.exports = { MongoParser };
