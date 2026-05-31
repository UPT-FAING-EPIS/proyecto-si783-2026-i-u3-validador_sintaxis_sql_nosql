const http = require('http');

const runTest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve({ status: res.statusCode, body: JSON.parse(data || '{}') }); });
    });
    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
};

(async () => {
  try {
    console.log('--- Probando healthCheck ---');
    const health = await runTest({ host: 'localhost', port: 3000, path: '/api/health', method: 'GET' });
    console.log(health);

    console.log('\n--- Probando Validación SQL (PostgreSQL auto-detect) ---');
    const sqlValid = await runTest(
      { host: 'localhost', port: 3000, path: '/api/validate', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { type: 'sql', query: 'SELECT * FROM usuarios WHERE id = 1;' }
    );
    console.log(sqlValid.body);

    console.log('\n--- Probando Validación SQL con Error ---');
    const sqlError = await runTest(
      { host: 'localhost', port: 3000, path: '/api/validate', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { type: 'sql', query: 'SELECT * FORM usuarios;' }
    );
    console.log(sqlError.body);

    console.log('\n--- Probando Validación NoSQL (MongoDB) ---');
    const noSqlValid = await runTest(
      { host: 'localhost', port: 3000, path: '/api/validate', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { type: 'nosql', query: 'db.users.find({ activo: true })' }
    );
    console.log(noSqlValid.body);

  } catch (err) {
    console.error('Error en las pruebas:', err);
  }
})();
