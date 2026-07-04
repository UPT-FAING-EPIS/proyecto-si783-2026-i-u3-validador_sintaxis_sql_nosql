const { Readable } = require('node:stream');
const app = require('../../skill/service/src/server');

class MockRequest extends Readable {
  constructor(method, url, body = null) {
    super();
    this.method = method;
    this.url = url;
    this.originalUrl = url;
    this.headers = {
      host: 'localhost',
      'content-type': 'application/json'
    };
    this.body = body || undefined;
    this.connection = { remoteAddress: '127.0.0.1' };
    this.socket = this.connection;
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
      status(code) {
        this.statusCode = code;
        return this;
      },
      write(chunk) {
        if (chunk) chunks.push(Buffer.from(chunk));
      },
      end(chunk) {
        if (chunk) chunks.push(Buffer.from(chunk));
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({
          status: this.statusCode,
          headers: this.headers,
          body: text ? JSON.parse(text) : null
        });
      }
    };

    app.handle(req, res, reject);
  });
}

describe('Skill/API integration', () => {
  test('GET /health returns service status', async () => {
    const response = await inject('GET', '/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'sql-validation-skill'
    });
  });

  test('GET /api/v1/engines returns supported engines', async () => {
    const response = await inject('GET', '/api/v1/engines');

    expect(response.status).toBe(200);
    expect(response.body.engines).toEqual(expect.arrayContaining(['sql-ansi', 'mysql', 'postgresql', 'mongodb']));
  });

  test('GET /api/v1/capabilities returns enabled operations', async () => {
    const response = await inject('GET', '/api/v1/capabilities');

    expect(response.status).toBe(200);
    expect(response.body.capabilities).toMatchObject({
      validation: true,
      diagnostics: true,
      engineDetection: true,
      compatibility: true,
      fix: true,
      format: true,
      lint: true
    });
  });

  test('POST /api/v1/validate validates SQL request body', async () => {
    const response = await inject('POST', '/api/v1/validate', {
      engine: 'auto',
      code: 'SELECT id FROM users;'
    });

    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(true);
    expect(response.body.engineRequested).toBe('auto');
    expect(response.body.errors).toEqual([]);
  });

  test('POST /api/v1/diagnostic returns diagnostics', async () => {
    const response = await inject('POST', '/api/v1/diagnostic', {
      engine: 'mysql',
      code: 'CREATE TABL users (id INT);'
    });

    expect(response.status).toBe(200);
    expect(response.body.diagnostics).toHaveLength(1);
    expect(response.body.diagnostics[0].code).toBe('SQL001');
  });

  test('POST /api/v1/fix returns corrected SQL', async () => {
    const response = await inject('POST', '/api/v1/fix', {
      engine: 'mysql',
      code: 'CREATE TABL users (id INT);'
    });

    expect(response.status).toBe(200);
    expect(response.body.fixed).toBe(true);
    expect(response.body.fixedCode).toBe('CREATE TABLE users (id INT);');
  });

  test('POST /api/v1/lint returns warnings', async () => {
    const response = await inject('POST', '/api/v1/lint', {
      engine: 'sql-ansi',
      code: 'UPDATE users SET active = 0;'
    });

    expect(response.status).toBe(200);
    expect(response.body.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'SQL_LINT_UPDATE_WITHOUT_WHERE' })
      ])
    );
  });

  test('POST /api/v1/validate rejects missing code', async () => {
    const response = await inject('POST', '/api/v1/validate', { engine: 'auto' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_REQUEST');
  });
});
