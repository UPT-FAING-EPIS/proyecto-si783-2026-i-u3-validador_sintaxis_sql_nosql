#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const skill = require('./local-skill');

const VERSION = '1.0.0';
const COMMANDS = ['validate', 'diagnostic', 'fix', 'lint', 'format'];

function printHelp() {
  console.log(`sqlcheck ${VERSION}

Uso:
  sqlcheck validate "SELECT * FORM usuarios;"
  sqlcheck validate consulta.sql --engine mysql
  sqlcheck diagnostic "CREATE TABL empleados (id INT);"
  sqlcheck fix "CREATE TABL empleados (id INT);"
  sqlcheck lint consulta.sql
  sqlcheck format consulta.sql
  cat consulta.sql | sqlcheck validate --stdin

Opciones:
  --engine <engine>      Motor solicitado: auto, mysql, postgresql, mongodb, etc.
  --json                Imprime la respuesta completa del validador local.
  --stdin               Lee la consulta desde stdin.
  -h, --help            Muestra ayuda.
  -v, --version         Muestra version.

Este CLI valida con el core local empaquetado. No requiere API, red ni URL remota.
`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    command: null,
    input: null,
    engine: 'auto',
    json: false,
    stdin: false,
    help: false,
    version: false
  };

  const positionals = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--version' || arg === '-v') {
      options.version = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--stdin') {
      options.stdin = true;
    } else if (arg === '--engine') {
      index += 1;
      options.engine = args[index] || 'auto';
    } else if (arg.startsWith('--engine=')) {
      options.engine = arg.slice('--engine='.length) || 'auto';
    } else {
      positionals.push(arg);
    }
  }

  options.command = positionals[0] || null;
  options.input = positionals.slice(1).join(' ') || null;
  return options;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function resolveInput(options) {
  if (options.stdin) {
    const value = await readStdin();
    if (!value.trim()) throw new Error('No se recibio contenido por stdin.');
    return value;
  }

  if (!options.input) {
    throw new Error('Falta la consulta o ruta de archivo. Usa --help para ver ejemplos.');
  }

  const maybeFile = path.resolve(process.cwd(), options.input);
  if (fs.existsSync(maybeFile) && fs.statSync(maybeFile).isFile()) {
    return fs.readFileSync(maybeFile, 'utf8');
  }

  return options.input;
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

function printValidate(data) {
  if (data.valid) {
    console.log('Consulta valida.');
    console.log(`Motor solicitado: ${data.engineRequested || 'auto'}`);
    console.log(`Motor detectado: ${data.engineDetected || 'desconocido'}`);
    if (typeof data.confidence === 'number') {
      console.log(`Confianza: ${Math.round(data.confidence * 100)}%`);
    }
    return;
  }

  console.log('Consulta invalida.');
  console.log(`Motor solicitado: ${data.engineRequested || 'auto'}`);
  console.log(`Motor detectado: ${data.engineDetected || 'desconocido'}`);
  const errors = Array.isArray(data.errors) ? data.errors : [];
  if (errors.length === 0) {
    console.log('No se recibieron detalles de error.');
    return;
  }

  errors.forEach((error, index) => {
    console.log('');
    console.log(`Error ${index + 1}`);
    console.log(`  Linea: ${error.line || 1}`);
    console.log(`  Columna: ${error.column || 1}`);
    console.log(`  Token: ${error.token || '(sin token)'}`);
    console.log(`  Mensaje: ${error.message || 'Error de sintaxis.'}`);
    console.log(`  Sugerencia: ${error.suggestion || 'Revise la sintaxis cerca del token indicado.'}`);
    console.log(`  Severidad: ${error.severity || 'error'}`);
  });
}

function printDiagnostic(data) {
  const diagnostics = Array.isArray(data.diagnostics) ? data.diagnostics : [];
  if (diagnostics.length === 0) {
    console.log('Sin diagnosticos. La consulta no reporta errores.');
    return;
  }

  console.log(`Diagnosticos encontrados: ${diagnostics.length}`);
  diagnostics.forEach((diagnostic, index) => {
    const start = diagnostic.range && diagnostic.range.start ? diagnostic.range.start : {};
    console.log('');
    console.log(`Diagnostico ${index + 1}`);
    console.log(`  Linea: ${start.line || 1}`);
    console.log(`  Columna: ${start.character || 1}`);
    console.log(`  Codigo: ${diagnostic.code || 'N/A'}`);
    console.log(`  Mensaje: ${diagnostic.message || 'Error de sintaxis.'}`);
    console.log(`  Sugerencia: ${diagnostic.suggestion || 'Revise la consulta.'}`);
    console.log(`  Severidad: ${diagnostic.severity || 'error'}`);
  });
}

function printFix(data) {
  if (!data.fixed) {
    console.log('No se encontraron correcciones automaticas.');
    return;
  }
  console.log('Consulta corregida:');
  console.log(data.fixedCode || '');
  const changes = Array.isArray(data.changes) ? data.changes : [];
  changes.forEach(change => {
    console.log(`- ${change.from} -> ${change.to} en linea ${change.line}, columna ${change.column}`);
  });
}

function printFormat(data) {
  if (!data.formatted) {
    console.log('No se pudo formatear la consulta.');
    return;
  }
  console.log(data.code || '');
}

function printLint(data) {
  const warnings = Array.isArray(data.warnings) ? data.warnings : [];
  if (warnings.length === 0) {
    console.log('Sin advertencias de lint.');
    return;
  }
  console.log(`Advertencias: ${warnings.length}`);
  warnings.forEach((warning, index) => {
    console.log('');
    console.log(`Advertencia ${index + 1}`);
    console.log(`  Linea: ${warning.line || 1}`);
    console.log(`  Columna: ${warning.column || 1}`);
    console.log(`  Codigo: ${warning.code || 'N/A'}`);
    console.log(`  Mensaje: ${warning.message || 'Advertencia.'}`);
    console.log(`  Severidad: ${warning.severity || 'warning'}`);
  });
}

async function main() {
  const options = parseArgs(process.argv);

  if (options.help) {
    printHelp();
    return 0;
  }

  if (options.version) {
    console.log(VERSION);
    return 0;
  }

  if (!options.command || !COMMANDS.includes(options.command)) {
    printHelp();
    return 2;
  }

  const code = await resolveInput(options);
  const payload = { engine: options.engine || 'auto', code };
  const data = skill[options.command](payload.code, payload.engine);

  if (options.json) {
    printJson(data);
  } else if (options.command === 'validate') {
    printValidate(data);
  } else if (options.command === 'diagnostic') {
    printDiagnostic(data);
  } else if (options.command === 'fix') {
    printFix(data);
  } else if (options.command === 'format') {
    printFormat(data);
  } else if (options.command === 'lint') {
    printLint(data);
  }

  if (options.command === 'validate') return data.valid ? 0 : 1;
  if (options.command === 'diagnostic') return Array.isArray(data.diagnostics) && data.diagnostics.length > 0 ? 1 : 0;
  if (options.command === 'lint') return Array.isArray(data.warnings) && data.warnings.length > 0 ? 1 : 0;
  return 0;
}

main()
  .then(code => {
    process.exitCode = code;
  })
  .catch(error => {
    console.error(error.message || String(error));
    process.exitCode = error.exitCode || 2;
  });
