const { Lexer } = require('../../src/services/validator/lexer');
const { Engines, detectEngine } = require('../../src/services/validator/sql/detector');
const {
  validateSQL,
  validateNoSQL,
  validateQueryAuto,
  detectCategory
} = require('../../src/services/validation.service');

function expectValidSQL(query, dialect) {
  const result = validateSQL(query);

  expect(result.valid).toBe(true);
  expect(result.errors).toEqual([]);
  if (dialect) expect(result.dialect).toBe(dialect);

  return result;
}

function expectInvalidSQL(query, expectedFragments) {
  const result = validateSQL(query);

  expect(result.valid).toBe(false);
  expect(result.errors.length).toBeGreaterThan(0);
  for (const fragment of expectedFragments) {
    expect(result.errors.some(error => error.fragment === fragment || error.message.includes(fragment))).toBe(true);
  }

  return result;
}

describe('core validator - SQL and MongoDB syntax', () => {
  test('validates valid SQL ANSI', () => {
    expectValidSQL('SELECT id, name FROM users WHERE age >= 18;', Engines.ANSI);
  });

  test('rejects invalid SQL ANSI', () => {
    expectInvalidSQL('SELEC id FROM users;', ['SELEC']);
  });

  test('validates valid MySQL', () => {
    expectValidSQL(
      'CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100)) ENGINE=InnoDB;',
      Engines.MYSQL
    );
  });

  test('rejects invalid MySQL table options', () => {
    expectInvalidSQL('CREATE TABLE users (id INT) ENGINE=BrokenDB;', ['ENGINE=BrokenDB']);
  });

  test('validates valid PostgreSQL', () => {
    expectValidSQL('SELECT id FROM users WHERE email ILIKE "%@example.com" LIMIT 5;', Engines.POSTGRESQL);
  });

  test('validates valid Oracle', () => {
    expectValidSQL('SELECT name FROM employees WHERE ROWNUM <= 10;', Engines.ORACLE);
  });

  test('validates valid SQL Server', () => {
    expectValidSQL('SELECT TOP 10 id FROM users WITH (NOLOCK);', Engines.SQLSERVER);
  });

  test('validates valid SQLite', () => {
    expectValidSQL('PRAGMA table_info(users);', Engines.SQLITE);
  });

  test('validates valid MongoDB shell query', () => {
    const result = validateNoSQL('db.users.find({ age: { $gte: 18 } });');

    expect(result.valid).toBe(true);
    expect(result.dialect).toBe('MongoDB');
    expect(result.errors).toEqual([]);
  });

  test('rejects invalid MongoDB command', () => {
    const result = validateNoSQL('db.users.fnd({});');

    expect(result.valid).toBe(false);
    expect(result.dialect).toBe('MongoDB');
    expect(result.errors[0].fragment).toBe('fnd');
  });

  test('validates decimal literals', () => {
    expectValidSQL('SELECT price FROM products WHERE price = 123.45;', Engines.ANSI);
  });

  test('validates date literals', () => {
    expectValidSQL('SELECT id FROM orders WHERE created_at >= DATE "2024-01-01";', Engines.ANSI);
  });

  test('reports CREATE TABLE typos TABL, VARHAR, PRIMRY and COLLTE', () => {
    expectInvalidSQL(
      'CREATE TABL users (id INT PRIMRY KEY, name VARHAR(50)) COLLTE=utf84_general_ci;',
      ['TABL', 'VARHAR', 'PRIMRY', 'COLLTE']
    );
  });

  test('validates CASE WHEN THEN ELSE END expressions', () => {
    expectValidSQL(
      'SELECT CASE WHEN age >= 18 THEN "adult" ELSE "minor" END AS group_name FROM users;',
      Engines.ANSI
    );
  });

  test('validates LOCK TABLES and UNLOCK TABLES', () => {
    expectValidSQL('LOCK TABLES users WRITE; UNLOCK TABLES;', Engines.MYSQL);
  });

  test('validates MySQL DELIMITER scripts', () => {
    expectValidSQL('DELIMITER //\nCREATE PROCEDURE p() BEGIN SELECT 1; END//\nDELIMITER ;', Engines.MYSQL);
  });
});

describe('core validator - engine detection and auto category', () => {
  test('detectCategory routes SQL and MongoDB input', () => {
    expect(detectCategory('SELECT id FROM users;')).toBe('sql');
    expect(detectCategory('db.users.find({});')).toBe('nosql');
    expect(detectCategory('{ "find": "users" }')).toBe('nosql');
  });

  test('validateQueryAuto dispatches to SQL or MongoDB parser', () => {
    expect(validateQueryAuto('SELECT id FROM users;').dialect).toBe(Engines.ANSI);
    expect(validateQueryAuto('db.users.find({});').dialect).toBe('MongoDB');
  });

  test('detectEngine identifies dialect-specific signals', () => {
    const lexer = new Lexer('SELECT TOP 10 id FROM users WITH (NOLOCK);');
    const tokens = lexer.tokenize();
    const result = detectEngine(tokens, 'SELECT TOP 10 id FROM users WITH (NOLOCK);');

    expect(result.engine).toBe(Engines.SQLSERVER);
    expect(result.compatible).toContain(Engines.SQLSERVER);
    expect(result.incompatible.some(item => item.engine === Engines.ANSI)).toBe(true);
  });
});
