const fs = require('fs');
const path = require('path');
const { validateQueryAuto } = require('./validator/validation.service');

// ── GitHub Actions helpers ──────────────────────────────────────────────────

function getInput(name) {
  const key = `INPUT_${name.toUpperCase().replaceAll('-', '_')}`;
  return (process.env[key] || '').trim();
}

function setOutput(name, value) {
  const envFile = process.env.GITHUB_OUTPUT;
  if (envFile) {
    fs.appendFileSync(envFile, `${name}=${value}\n`);
  } else {
    process.stdout.write(`::set-output name=${name}::${value}\n`);
  }
}

const ann = {
  error:    (file, line, col, msg) => process.stdout.write(`::error file=${file},line=${line},col=${col}::${msg}\n`),
  warning:  (msg)                  => process.stdout.write(`::warning::${msg}\n`),
  notice:   (msg)                  => process.stdout.write(`::notice::${msg}\n`),
  group:    (name)                 => process.stdout.write(`::group::${name}\n`),
  endGroup: ()                     => process.stdout.write(`::endgroup::\n`),
};

// ── File finder ─────────────────────────────────────────────────────────────

const SKIP_DIRS = new Set(['.git', 'node_modules', '.github', 'dist', 'build']);

function findFiles(dir, ext, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) {
      findFiles(path.join(dir, entry.name), ext, results);
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

// ── Validation ───────────────────────────────────────────────────────────────

function validateFile(filePath, type) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.trim()) return { valid: true, errors: [], skipped: true };
  const resolvedType = type === 'auto' ? null : type;
  return validateQueryAuto(content, resolvedType);
}

// ── Main ─────────────────────────────────────────────────────────────────────

function run() {
  const searchPath  = getInput('path') || '.';
  const extension   = getInput('extension') || '.sql';
  const failOnError = getInput('fail-on-error') !== 'false';
  const type        = getInput('type') || 'auto';

  const absPath = path.resolve(process.cwd(), searchPath);
  const files   = findFiles(absPath, extension);
  const cwd     = process.cwd();

  if (files.length === 0) {
    ann.warning(`No se encontraron archivos *${extension} en: ${searchPath}`);
    setOutput('error-count', '0');
    setOutput('file-count', '0');
    process.exit(0);
  }

  ann.notice(`Validando ${files.length} archivo(s) *${extension}...`);

  let totalErrors = 0;
  let validFiles  = 0;

  for (const file of files) {
    const rel = path.relative(cwd, file);
    ann.group(rel);

    try {
      const result = validateFile(file, type);

      if (result.skipped) {
        ann.notice(`${rel}: archivo vacío, omitido.`);
      } else if (result.valid) {
        process.stdout.write(`✓ ${rel}\n`);
        validFiles++;
      } else {
        for (const err of result.errors || []) {
          ann.error(rel, err.line || 1, err.column || 1, err.message + (err.suggestion ? ` → ${err.suggestion}` : ''));
          totalErrors++;
        }
      }
    } catch (err) {
      ann.warning(`No se pudo validar ${rel}: ${err.message}`);
    }

    ann.endGroup();
  }

  setOutput('error-count', String(totalErrors));
  setOutput('file-count', String(files.length));

  if (totalErrors > 0) {
    process.stdout.write(`\n::error::❌ ${totalErrors} error(es) en ${files.length} archivo(s). Corrige los errores antes de hacer merge.\n`);
    if (failOnError) process.exit(1);
  } else {
    ann.notice(`✅ ${validFiles} archivo(s) validado(s) sin errores.`);
  }
}

try {
  run();
} catch (err) {
  process.stdout.write(`::error::Error inesperado: ${err.message}\n`);
  process.exit(1);
}
