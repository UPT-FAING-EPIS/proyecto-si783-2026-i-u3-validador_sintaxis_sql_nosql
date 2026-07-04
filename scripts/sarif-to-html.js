const fs = require('fs');
const path = require('path');

const [, , inputPath, outputPath, titleArg] = process.argv;

if (!inputPath || !outputPath) {
  console.error('Uso: node scripts/sarif-to-html.js <entrada.sarif> <salida.html> ["Titulo"]');
  process.exit(1);
}

const title = titleArg || 'Reporte de analisis estatico';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadFindings(sarif) {
  const findings = [];
  for (const run of sarif.runs || []) {
    const rulesById = {};
    for (const rule of run.tool?.driver?.rules || []) {
      rulesById[rule.id] = rule;
    }
    for (const result of run.results || []) {
      // Semgrep conserva en el SARIF los hallazgos silenciados con "// nosemgrep"
      // pero los marca con "suppressions" para que las herramientas los oculten.
      if (result.suppressions && result.suppressions.length > 0) continue;
      const rule = rulesById[result.ruleId] || {};
      const location = result.locations?.[0]?.physicalLocation;
      findings.push({
        ruleId: result.ruleId || 'unknown',
        level: result.level || rule.defaultConfiguration?.level || 'warning',
        message: result.message?.text || '',
        file: location?.artifactLocation?.uri || '',
        line: location?.region?.startLine || '',
        help: rule.help?.text || rule.shortDescription?.text || ''
      });
    }
  }
  return findings;
}

const raw = fs.existsSync(inputPath) ? fs.readFileSync(inputPath, 'utf8') : null;
const sarif = raw ? JSON.parse(raw) : { runs: [] };
const findings = loadFindings(sarif);

const severityOrder = { error: 0, warning: 1, note: 2, none: 3 };
findings.sort((a, b) => (severityOrder[a.level] ?? 9) - (severityOrder[b.level] ?? 9));

const counts = findings.reduce((acc, f) => {
  acc[f.level] = (acc[f.level] || 0) + 1;
  return acc;
}, {});

const rows = findings.map((f) => `
  <tr class="level-${escapeHtml(f.level)}">
    <td>${escapeHtml(f.level)}</td>
    <td>${escapeHtml(f.ruleId)}</td>
    <td>${escapeHtml(f.file)}${f.line ? ':' + escapeHtml(f.line) : ''}</td>
    <td>${escapeHtml(f.message)}</td>
  </tr>`).join('');

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; color: #1a1a1a; }
  h1 { margin-bottom: 0.25rem; }
  .summary { margin-bottom: 1.5rem; color: #444; }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #ddd; font-size: 0.9rem; }
  th { background: #f4f4f4; }
  tr.level-error { background: #fdecea; }
  tr.level-warning { background: #fff8e1; }
  code { background: #f0f0f0; padding: 0.1rem 0.3rem; border-radius: 3px; }
  @media (prefers-color-scheme: dark) {
    body { background: #1e1e1e; color: #e0e0e0; }
    th { background: #2a2a2a; }
    th, td { border-color: #3a3a3a; }
    tr.level-error { background: #3a2323; }
    tr.level-warning { background: #3a3320; }
    code { background: #2a2a2a; }
  }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="summary">
    Total de hallazgos: <strong>${findings.length}</strong>
    ${Object.entries(counts).map(([lvl, n]) => `&nbsp;|&nbsp; ${escapeHtml(lvl)}: <strong>${n}</strong>`).join('')}
  </p>
  <table>
    <thead>
      <tr><th>Severidad</th><th>Regla</th><th>Ubicacion</th><th>Mensaje</th></tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="4">Sin hallazgos.</td></tr>'}
    </tbody>
  </table>
</body>
</html>
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html);
console.log(`Reporte HTML generado en ${outputPath} (${findings.length} hallazgos)`);
