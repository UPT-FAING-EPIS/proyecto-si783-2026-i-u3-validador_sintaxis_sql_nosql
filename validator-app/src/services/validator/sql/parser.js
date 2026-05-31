const { Parser } = require('node-sql-parser');
const { detectEngine } = require('./detector');

class SQLParser {
  constructor(query) {
    this.query = query;
    this.parser = new Parser();
    this.errors = [];
    this.suggestions = [];
  }

  parse() {
    if (!this.query || this.query.trim() === '') {
      this.errors.push({ line: 1, column: 1, message: 'La consulta está vacía.' });
      return this.getResult('MySQL', 0);
    }

    const { engine, confidence } = detectEngine([], this.query);
    
    // Map our detected engine to node-sql-parser database type
    let parserEngine = 'mysql'; // Default fallback
    const engLower = engine.toLowerCase();
    if (engLower.includes('postgres')) parserEngine = 'postgresql';
    else if (engLower.includes('mariadb')) parserEngine = 'mariadb';
    else if (engLower.includes('sqlite')) parserEngine = 'sqlite'; // Or sqlite3? parser accepts sqlite
    else if (engLower.includes('oracle')) parserEngine = 'postgresql'; // node-sql-parser does not support Oracle fully, fallback to postgresql which is closer in features or use mysql

    try {
      // Check syntax using node-sql-parser
      this.parser.astify(this.query, { database: parserEngine });
    } catch (e) {
      if (e.name === 'SyntaxError') {
        let msg = e.message;
        let suggestion = 'Revisa la sintaxis cerca del error.';
        let foundToken = null;
        
        // Translate error message slightly for better UX
        if (msg.includes('Expected')) {
           const foundMatch = msg.match(/but "(.*)" found/);
           foundToken = foundMatch ? foundMatch[1] : 'fin de consulta';
           msg = `Error de sintaxis.\nProblema: Elemento no esperado o falta una cláusula obligatoria.\nFragmento afectado: "${foundToken}"`;
           
           if (foundToken.toUpperCase() === 'FORM') suggestion = 'Probablemente quisiste escribir FROM en lugar de FORM.';
           else if (foundToken.toUpperCase() === 'SELCT') suggestion = 'Probablemente quisiste escribir SELECT.';
           else if (foundToken.toUpperCase() === 'WERE') suggestion = 'Probablemente quisiste escribir WHERE.';
           else suggestion = `Verifica que no falten palabras clave antes de "${foundToken}" y que esté correctamente escrito.`;
        }

        this.errors.push({
          line: e.location?.start?.line || 1,
          column: e.location?.start?.column || 1,
          message: msg,
          fragment: foundToken && foundToken !== 'fin de consulta' ? foundToken : null,
          suggestion: suggestion
        });
      } else {
        this.errors.push({
          line: 1, column: 1,
          message: e.message,
          suggestion: 'Consulta la documentación de ' + engine
        });
      }
    }

    return this.getResult(engine, confidence);
  }

  getResult(engine, confidence) {
    if (this.errors.length === 0) {
      this.suggestions.push(`✅ Sintaxis SQL correcta para ${engine}.`);
    } else if (this.errors[0] && this.errors[0].suggestion && !this.suggestions.includes(this.errors[0].suggestion)) {
      this.suggestions.push(this.errors[0].suggestion);
    }

    return {
      valid: this.errors.length === 0,
      dialect: engine,
      confidence: confidence,
      errors: this.errors,
      suggestions: this.suggestions
    };
  }
}

module.exports = { SQLParser };
