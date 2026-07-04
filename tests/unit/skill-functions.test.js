const skill = require('../../skill/service/src/lib/skill-core.adapter');

describe('Skill core adapter functions', () => {
  test('validate returns normalized validation output', () => {
    const result = skill.validate('SELECT id FROM users;', 'auto');

    expect(result.valid).toBe(true);
    expect(result.engineRequested).toBe('auto');
    expect(result.errors).toEqual([]);
    expect(Array.isArray(result.compatibleEngines)).toBe(true);
  });

  test('diagnostic returns editor-style diagnostics for invalid SQL', () => {
    const result = skill.diagnostic('CREATE TABL users (id INT);', 'mysql');

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      severity: 'error',
      source: 'sql-validation-skill'
    });
    expect(result.diagnostics[0].message).toContain('CREATE TABLE');
  });

  test('detectEngine detects MongoDB and SQL signals', () => {
    const mongo = skill.detectEngine('db.users.find({});');
    const sql = skill.detectEngine('SELECT id FROM users LIMIT 5;');

    expect(mongo.engineDetected).toBe('mongodb');
    expect(mongo.confidence).toBeGreaterThanOrEqual(0.85);
    expect(sql.signals.length).toBeGreaterThan(0);
  });

  test('compatibility reports incompatible engines', () => {
    const result = skill.compatibility('SELECT id FROM users LIMIT 5;');

    expect(result.compatibleEngines).toEqual(expect.arrayContaining(['mysql', 'postgresql', 'sqlite']));
    expect(result.notCompatibleEngines).toEqual(expect.arrayContaining(['mongodb']));
  });

  test('fix replaces common SQL typos without changing unrelated text', () => {
    const result = skill.fix('CREATE TABL users (id INT PRIMRY KEY);');

    expect(result.fixed).toBe(true);
    expect(result.fixedCode).toBe('CREATE TABLE users (id INT PRIMARY KEY);');
    expect(result.changes.map(change => change.from)).toEqual(['TABL', 'PRIMRY']);
  });

  test('lint warns about risky SQL patterns', () => {
    const result = skill.lint('SELECT * FROM users; DELETE FROM users;');

    expect(result.warnings.map(warning => warning.code)).toEqual(
      expect.arrayContaining(['SQL_LINT_SELECT_ALL', 'SQL_LINT_DELETE_WITHOUT_WHERE'])
    );
  });

  test('format normalizes basic SQL layout', () => {
    const result = skill.format('select id from users where active = 1');

    expect(result.formatted).toBe(true);
    expect(result.code).toContain('SELECT id');
    expect(result.code).toContain('\nFROM users');
    expect(result.code.endsWith(';')).toBe(true);
  });
});
