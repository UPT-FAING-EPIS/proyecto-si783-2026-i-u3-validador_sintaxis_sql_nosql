const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '..', 'reports', 'mutation', 'mutation.json');

if (!fs.existsSync(reportPath)) {
  console.error(`No se encontro el reporte de mutacion en ${reportPath}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const counts = { Killed: 0, Survived: 0, NoCoverage: 0, Timeout: 0, CompileError: 0, RuntimeError: 0, Ignored: 0 };

for (const file of Object.values(report.files || {})) {
  for (const mutant of file.mutants || []) {
    counts[mutant.status] = (counts[mutant.status] || 0) + 1;
  }
}

const killed = counts.Killed || 0;
const survived = counts.Survived || 0;
const noCoverage = counts.NoCoverage || 0;
const totalDetectable = killed + survived + noCoverage;
const score = totalDetectable > 0 ? ((killed / totalDetectable) * 100).toFixed(2) : '0.00';

const summary = `## Reporte de mutacion (Stryker)

| Estado | Cantidad |
|---|---|
| Killed | ${killed} |
| Survived | ${survived} |
| No coverage | ${noCoverage} |
| Timeout | ${counts.Timeout || 0} |
| Errores | ${(counts.CompileError || 0) + (counts.RuntimeError || 0)} |

**Mutation score: ${score}%**
`;

console.log(summary);

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
