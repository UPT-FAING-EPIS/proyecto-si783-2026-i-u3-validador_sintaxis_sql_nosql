const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const app = require('../src/server');

class MockRequest extends Readable {
  constructor(method, url, body = null) {
    super();
    this.method = method;
    this.url = url;
    this.originalUrl = url;
    this.headers = {};
    this.body = body || undefined;
    this.connection = { remoteAddress: '127.0.0.1' };
    this.socket = this.connection;
    this._sent = false;
  }

  _read() {
    this.push(null);
  }
}

function inject(method, path, body) {
  return new Promise((resolve, reject) => {
    const req = new MockRequest(method, path, body);
    const chunks = [];
    const res = {
      statusCode: 200,
      headers: {},
      locals: {},
      setHeader(name, value) {
        this.headers[String(name).toLowerCase()] = value;
      },
      getHeader(name) {
        return this.headers[String(name).toLowerCase()];
      },
      removeHeader(name) {
        delete this.headers[String(name).toLowerCase()];
      },
      end(chunk) {
        if (chunk) chunks.push(Buffer.from(chunk));
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({
          status: this.statusCode,
          headers: this.headers,
          body: text ? JSON.parse(text) : null
        });
      },
      write(chunk) {
        if (chunk) chunks.push(Buffer.from(chunk));
      }
    };

    app.handle(req, res, reject);
  });
}

test('GET /health returns service status', async () => {
  const response = await inject('GET', '/health');
  const body = response.body;

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'sql-validation-skill');
  assert.equal(body.version, '1.0.0');
});

test('GET /api/v1/engines returns supported engines', async () => {
  const response = await inject('GET', '/api/v1/engines');
  const body = response.body;

  assert.equal(response.status, 200);
  assert.ok(body.engines.includes('mysql'));
  assert.ok(body.engines.includes('mongodb'));
});

test('POST /api/v1/validate accepts a valid SQL query', async () => {
  const { status, body } = await inject('POST', '/api/v1/validate', {
    engine: 'auto',
    code: 'SELECT id FROM empleados;'
  });

  assert.equal(status, 200);
  assert.equal(body.valid, true);
  assert.equal(body.engineRequested, 'auto');
});

test('POST /api/v1/validate reports an invalid SQL query', async () => {
  const { status, body } = await inject('POST', '/api/v1/validate', {
    engine: 'auto',
    code: 'CREATE TABL empleados (id INT);'
  });

  assert.equal(status, 200);
  assert.equal(body.valid, false);
  assert.ok(body.errors.length > 0);
  assert.equal(body.errors[0].severity, 'error');
});

test('POST /api/v1/detect-engine detects MongoDB syntax', async () => {
  const { status, body } = await inject('POST', '/api/v1/detect-engine', {
    code: 'db.empleados.find({});'
  });

  assert.equal(status, 200);
  assert.equal(body.engineDetected, 'mongodb');
  assert.ok(body.confidence >= 0.85);
});

test('POST /api/v1/fix fixes TABL typo', async () => {
  const { status, body } = await inject('POST', '/api/v1/fix', {
    engine: 'mysql',
    code: 'CREATE TABL empleados (id INT);'
  });

  assert.equal(status, 200);
  assert.equal(body.fixed, true);
  assert.equal(body.fixedCode, 'CREATE TABLE empleados (id INT);');
  assert.equal(body.changes[0].from, 'TABL');
});
