const { validateQueryAuto, detectCategory } = require('../src/services/validation.service');

function generateTests() {
  const tests = [];

  // PostgreSQL (100)
  for (let i = 0; i < 100; i++) {
    tests.push({
      query: `SELECT id, name FROM users WHERE id = ${i} RETURNING *;`,
      expectedCategory: 'sql',
      expectedEngine: 'PostgreSQL'
    });
  }

  // MySQL (100)
  for (let i = 0; i < 100; i++) {
    tests.push({
      query: `SELECT CURDATE() as date_${i} FROM users LIMIT ${i};`,
      expectedCategory: 'sql',
      expectedEngine: 'MySQL'
    });
  }

  // SQLite (100)
  for (let i = 0; i < 100; i++) {
    tests.push({
      query: `PRAGMA table_info(users_${i});`,
      expectedCategory: 'sql',
      expectedEngine: 'SQLite'
    });
  }

  // SQL Server (100)
  for (let i = 0; i < 100; i++) {
    tests.push({
      query: `SELECT TOP ${i} GETDATE() FROM users WITH (NOLOCK);`,
      expectedCategory: 'sql',
      expectedEngine: 'SQL Server'
    });
  }

  // Oracle (100)
  for (let i = 0; i < 100; i++) {
    tests.push({
      query: `SELECT SYSDATE FROM DUAL WHERE ROWNUM <= ${i};`,
      expectedCategory: 'sql',
      expectedEngine: 'Oracle'
    });
  }

  // MongoDB Shell (100)
  for (let i = 0; i < 100; i++) {
    tests.push({
      query: `db.users_${i}.find({ "age": { "$gte": ${i} } })`,
      expectedCategory: 'nosql',
      expectedEngine: 'MongoDB'
    });
  }

  // MongoDB JSON (100)
  for (let i = 0; i < 100; i++) {
    tests.push({
      query: JSON.stringify({
        find: `users_${i}`,
        filter: { age: { $gte: i } }
      }),
      expectedCategory: 'nosql',
      expectedEngine: 'MongoDB'
    });
  }

  return tests;
}

function runTests() {
  const tests = generateTests();
  let passed = 0;
  let failed = 0;

  const resultsByEngine = {
    'PostgreSQL': { total: 0, passed: 0 },
    'MySQL': { total: 0, passed: 0 },
    'SQLite': { total: 0, passed: 0 },
    'SQL Server': { total: 0, passed: 0 },
    'Oracle': { total: 0, passed: 0 },
    'MongoDB': { total: 0, passed: 0 }
  };

  for (const test of tests) {
    const category = detectCategory(test.query);
    const result = validateQueryAuto(test.query);
    
    resultsByEngine[test.expectedEngine].total++;

    let isSuccess = true;
    
    if (category !== test.expectedCategory) isSuccess = false;
    if (result.dialect !== test.expectedEngine) isSuccess = false;
    if (!result.valid) isSuccess = false;

    if (isSuccess) {
      passed++;
      resultsByEngine[test.expectedEngine].passed++;
    } else {
      failed++;
      console.log(`❌ Fallo en query: ${test.query}`);
      console.log(`   Esperado: ${test.expectedCategory} / ${test.expectedEngine}`);
      console.log(`   Obtenido: ${category} / ${result.dialect}`);
      console.log(`   Valido: ${result.valid}`);
      console.log(`   Errores: ${JSON.stringify(result.errors)}`);
    }
  }

  console.log('\n--- RESULTADOS DE LAS PRUEBAS AUTOMÁTICAS ---');
  for (const engine in resultsByEngine) {
    const { total, passed } = resultsByEngine[engine];
    const percentage = ((passed / total) * 100).toFixed(2);
    console.log(`${engine}: ${passed}/${total} (${percentage}%)`);
  }
  
  const totalPercentage = ((passed / tests.length) * 100).toFixed(2);
  console.log(`\nTOTAL GENERAL: ${passed}/${tests.length} (${totalPercentage}%)`);
}

runTests();
