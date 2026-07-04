const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'reports', 'bdd', 'cucumber-report.json');
const htmlDir = path.join(__dirname, '..', 'reports', 'bdd', 'html');

async function main() {
  if (!fs.existsSync(jsonPath)) {
    console.error(`No se encontro el reporte de Cucumber en ${jsonPath}`);
    process.exit(1);
  }

  const features = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  let scenarios = 0;
  let scenariosPassed = 0;
  let steps = 0;
  let stepsPassed = 0;

  for (const feature of features) {
    for (const element of feature.elements || []) {
      if (element.type !== 'scenario') continue;
      scenarios++;
      let scenarioOk = true;
      for (const step of element.steps || []) {
        steps++;
        const status = step.result && step.result.status;
        if (status === 'passed') {
          stepsPassed++;
        } else if (status !== 'skipped') {
          scenarioOk = false;
        }
      }
      if (scenarioOk) scenariosPassed++;
    }
  }

  const { generate } = await import('multiple-cucumber-html-reporter');
  await generate({
    jsonDir: path.join(__dirname, '..', 'reports', 'bdd'),
    reportPath: htmlDir,
    reportName: 'Reporte BDD - SQL/NoSQL Validator',
    disableLog: true,
    displayDuration: true
  });

  const summary = `## Reporte BDD (Cucumber)

| Metrica | Resultado |
|---|---|
| Escenarios | ${scenariosPassed}/${scenarios} |
| Pasos | ${stepsPassed}/${steps} |
`;

  console.log(summary);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }

  if (scenariosPassed !== scenarios) {
    process.exitCode = 1;
  }
}

main();
