const { validateSQL, validateNoSQL } = require('../../src/services/validation.service');

// ---------------------------------------------------------------------------
// Helpers de generacion de typos (garantizan distancia de edicion conocida)
// ---------------------------------------------------------------------------
function deleteLast(word) {
  return word.slice(0, -1);
}

function transposeMiddle(word) {
  if (word.length < 4) return null;
  const i = Math.floor(word.length / 2);
  return word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
}

function deleteSecond(word) {
  if (word.length < 5) return null;
  return word.slice(0, 1) + word.slice(2);
}

function deletePenultimate(word) {
  if (word.length < 5) return null;
  return word.slice(0, -2) + word.slice(-1);
}

function buildTypoSet(words, extraCheckList = []) {
  const known = new Set([...words, ...extraCheckList]);
  const out = [];
  const seen = new Set();
  const tryAdd = (w, typo, style) => {
    if (!typo || known.has(typo) || seen.has(typo)) return;
    seen.add(typo);
    out.push({ original: w, typo, style });
  };
  for (const w of words) {
    tryAdd(w, deleteLast(w), 'delete-last');
    tryAdd(w, transposeMiddle(w), 'transpose');
    tryAdd(w, deleteSecond(w), 'delete-second');
    tryAdd(w, deletePenultimate(w), 'delete-penultimate');
  }
  return out;
}

// ---------------------------------------------------------------------------
// SQL: consultas validas multi-motor
// ---------------------------------------------------------------------------
const validSQLQueries = [
  'SELECT * FROM empleados;',
  'SELECT id, nombre FROM empleados WHERE activo = 1;',
  'SELECT DISTINCT ciudad FROM clientes;',
  'SELECT ALL nombre FROM clientes;',
  'SELECT TOP 5 * FROM empleados;',
  'SELECT id AS identificador, nombre AS "Nombre completo" FROM empleados;',
  "SELECT nombre 'Nombre' FROM empleados;",
  'SELECT tabla.* FROM esquema.tabla;',
  'SELECT db.tabla.columna FROM db.tabla;',
  'SELECT u.nombre, p.descripcion FROM usuarios u INNER JOIN pedidos p ON u.id = p.usuario_id;',
  'SELECT a.id FROM tabla_a a LEFT JOIN tabla_b b ON a.id = b.id;',
  'SELECT a.id FROM tabla_a a LEFT OUTER JOIN tabla_b b ON a.id = b.id;',
  'SELECT a.id FROM tabla_a a RIGHT JOIN tabla_b b ON a.id = b.id;',
  'SELECT a.id FROM tabla_a a RIGHT OUTER JOIN tabla_b b ON a.id = b.id;',
  'SELECT a.id FROM tabla_a a FULL JOIN tabla_b b ON a.id = b.id;',
  'SELECT * FROM a FULL OUTER JOIN b ON a.x = b.y;',
  'SELECT * FROM a CROSS JOIN b;',
  'SELECT a.id FROM tabla_a a JOIN tabla_b b USING (id);',
  'SELECT * FROM tabla_a JOIN (SELECT id FROM tabla_b) sub ON tabla_a.id = sub.id;',
  'SELECT * FROM empleados e, departamentos d WHERE e.dep_id = d.id;',
  'SELECT * FROM empleados WHERE edad BETWEEN 18 AND 30;',
  'SELECT * FROM empleados WHERE nombre LIKE "A%";',
  'SELECT * FROM empleados WHERE nombre ILIKE "a%";',
  'SELECT * FROM empleados WHERE id IN (1, 2, 3);',
  'SELECT * FROM empleados WHERE id IN (SELECT empleado_id FROM asignaciones);',
  'SELECT * FROM empleados WHERE EXISTS (SELECT 1 FROM asignaciones WHERE asignaciones.empleado_id = empleados.id);',
  'SELECT * FROM empleados WHERE salario > ANY (SELECT salario FROM empleados WHERE departamento = 1);',
  'SELECT * FROM empleados WHERE salario > ALL (SELECT salario FROM empleados WHERE departamento = 1);',
  'SELECT * FROM empleados WHERE activo IS NOT NULL;',
  'SELECT * FROM empleados WHERE activo IS NULL;',
  'SELECT nombre, salario, CASE WHEN salario >= 4000 THEN \'Alto\' WHEN salario >= 3000 THEN \'Medio\' ELSE \'Bajo\' END AS nivel FROM empleados;',
  'SELECT CASE nombre WHEN \'Ana\' THEN 1 ELSE 0 END FROM empleados;',
  'SELECT RANK() OVER (PARTITION BY departamento ORDER BY salario DESC) FROM empleados;',
  'SELECT LEAD(fecha) OVER (ORDER BY id) FROM eventos;',
  'SELECT LAG(fecha) OVER (ORDER BY id) FROM eventos;',
  'SELECT ROW_NUMBER() OVER (ORDER BY id ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) FROM empleados;',
  'SELECT SUM(salario) OVER (PARTITION BY departamento) FROM empleados;',
  'WITH VentasCTE AS (SELECT empleado_id, SUM(monto) AS total_ventas FROM ventas GROUP BY empleado_id) SELECT * FROM VentasCTE;',
  'WITH RECURSIVE numeros AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM numeros WHERE n < 10) SELECT * FROM numeros;',
  'WITH a AS (SELECT 1 AS x), b AS (SELECT 2 AS y) SELECT * FROM a, b;',
  'SELECT id FROM empleados UNION SELECT id FROM ex_empleados;',
  'SELECT id FROM empleados UNION ALL SELECT id FROM ex_empleados;',
  'SELECT id FROM empleados INTERSECT SELECT id FROM activos;',
  'SELECT id FROM empleados EXCEPT SELECT id FROM inactivos;',
  'SELECT nombre FROM empleados GROUP BY nombre HAVING COUNT(*) > 1;',
  'SELECT departamento, COUNT(*) FROM empleados GROUP BY departamento ORDER BY departamento ASC;',
  'SELECT * FROM empleados ORDER BY salario DESC, nombre ASC;',
  'SELECT * FROM empleados LIMIT 10 OFFSET 5;',
  'SELECT * FROM empleados FETCH FIRST 5 ROWS ONLY;',
  'SELECT nombre INTO respaldo_nombres FROM empleados;',
  'SELECT salario * 1.10 AS salario_proyectado FROM empleados;',
  'SELECT COUNT(*) FROM empleados;',
  'SELECT COUNT(*) FROM empleados WHERE salario IS NOT NULL;',
  "SELECT SYSTIMESTAMP FROM DUAL;",
  'SELECT SYSDATE FROM DUAL;',
  'SELECT NVL(comision, 0) FROM empleados;',
  'SELECT NVL2(comision, 1, 0) FROM empleados;',
  'SELECT DECODE(estado, 1, \'Activo\', \'Inactivo\') FROM empleados;',
  "SELECT LISTAGG(nombre, '-') FROM empleados;",
  'SELECT * FROM empleados WHERE ROWNUM <= 10;',
  'SELECT * FROM (SELECT * FROM empleados ORDER BY id) WHERE ROWNUM <= 10;',
  'SELECT TOP 10 id, nombre FROM clientes WITH (NOLOCK) WHERE id = NEWID();',
  'SELECT SCOPE_IDENTITY();',
  'SELECT GETDATE();',
  'SELECT CHARINDEX(\'a\', nombre) FROM empleados;',
  'SELECT * FROM empleados WHERE id = 1 IDENTITY;',
  "SELECT CURDATE();",
  "SELECT CURTIME();",
  "SELECT IFNULL(comision, 0) FROM empleados;",
  "SELECT GROUP_CONCAT(nombre) FROM empleados;",
  "SELECT LAST_INSERT_ID();",
  "SELECT UNIX_TIMESTAMP();",
  'SHOW TABLES;',
  'DESCRIBE empleados;',
  'PRAGMA foreign_keys = ON;',
  'SELECT STRFTIME(\'%Y\', fecha) FROM eventos;',
  'SELECT JULIANDAY(\'now\');',
  'SELECT LAST_INSERT_ROWID();',
  'SELECT gen_random_uuid();',
  'SELECT ARRAY_AGG(nombre) FROM empleados;',
  "SELECT STRING_AGG(nombre, '-') FROM empleados;",
  'SELECT NEXTVAL(\'empleados_seq\');',
  "UPDATE usuarios SET metadata = '{\"theme\":\"dark\"}'::JSONB WHERE id = '550e8400-e29b-41d4-a716-446655440000'::UUID RETURNING id, nombre;",
  'INSERT INTO empleados (id, nombre) VALUES (1, \'Juan\');',
  'INSERT INTO empleados VALUES (1, \'Juan\', \'Perez\', 30);',
  'INSERT INTO empleados (id, nombre) VALUES (1, \'Juan\'), (2, \'Ana\');',
  'INSERT INTO respaldo SELECT * FROM empleados;',
  'INSERT INTO empleados (id) VALUES (1) RETURNING id;',
  'UPDATE empleados SET salario = 3000 WHERE id = 1;',
  'UPDATE empleados SET salario = 3000, activo = 1 WHERE id = 1;',
  'UPDATE empleados SET salario = salario * 1.1 WHERE departamento = 1 RETURNING id;',
  'DELETE FROM empleados WHERE id = 1;',
  'DELETE FROM empleados WHERE activo = 0 RETURNING id;',
  'DELETE FROM empleados;',
  'COMMIT;',
  'ROLLBACK;',
  'ROLLBACK TO SAVEPOINT sp1;',
  'ROLLBACK TO sp1;',
  'BEGIN;',
  'BEGIN TRANSACTION;',
  'START TRANSACTION;',
  'SAVEPOINT sp1;',
  'RELEASE SAVEPOINT sp1;',
  'SET search_path TO empresa;',
  'SET @bono = 100.50;',
  'GO',
  'USE empresa;',
  'USE master;',
  'DECLARE @bono DECIMAL(10,2);',
  'DECLARE @bono DECIMAL(10,2) = 100.50;',
  'DECLARE @a INT, @b INT;',
  'DECLARE cur CURSOR FOR SELECT id FROM empleados;',
  'DECLARE total NUMBER; BEGIN total := 1; END;',
  'LOCK TABLES articulos WRITE;',
  'LOCK TABLES categorias READ, articulos WRITE;',
  'LOCK TABLES usuario WRITE, articulos WRITE, categorias READ;',
  'LOCK TABLES articulos AS a WRITE;',
  'UNLOCK TABLES;',
  'CREATE TABLE articulos (id INT NOT NULL AUTO_INCREMENT, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;',
  'DELIMITER $$\nCREATE PROCEDURE listar_articulos()\nBEGIN\n  SELECT * FROM articulos;\nEND$$\nDELIMITER ;',
  'DELIMITER //\nCREATE TRIGGER trg_articulos_ai AFTER INSERT ON articulos FOR EACH ROW BEGIN INSERT INTO log_acciones(descripcion) VALUES (\'x\'); END//\nDELIMITER ;',
  'CREATE FUNCTION calcular_bono() RETURNS INT BEGIN RETURN 1; END;',
  'ALTER TABLE empleados ADD COLUMN bono DECIMAL(10,2);',
  'DROP TABLE empleados;',
  'TRUNCATE TABLE empleados;'
];

test.each(validSQLQueries)('SQL valido: %s', (query) => {
  const result = validateSQL(query);
  if (!result.valid) {
    throw new Error(`Se esperaba valido. Errores: ${JSON.stringify(result.errors)}`);
  }
  expect(result.valid).toBe(true);
});

// ---------------------------------------------------------------------------
// SQL: tipos de dato validos en CREATE TABLE (recorre todo CREATE_TABLE_VALID_TYPES)
// ---------------------------------------------------------------------------
const validColumnTypes = [
  'INTEGER', 'INT', 'SMALLINT', 'BIGINT', 'TINYINT',
  'DECIMAL', 'NUMERIC', 'FLOAT', 'REAL', 'DOUBLE',
  'CHAR', 'CHARACTER', 'VARCHAR', 'TEXT',
  'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT',
  'DATE', 'TIME', 'DATETIME', 'TIMESTAMP',
  'BOOLEAN', 'BOOL', 'ENUM', 'SET', 'JSON',
  'BLOB', 'LONGBLOB', 'SERIAL', 'BIGSERIAL', 'SMALLSERIAL',
  'UUID', 'JSONB', 'BIT', 'NCHAR', 'NVARCHAR',
  'DATETIME2', 'MONEY', 'UNIQUEIDENTIFIER',
  'NUMBER', 'VARCHAR2', 'NVARCHAR2', 'CLOB',
  'RAW', 'XML', 'BYTEA'
];

test.each(validColumnTypes)('SQL valido: CREATE TABLE con tipo %s', (type) => {
  const query = `CREATE TABLE tabla_prueba (columna1 ${type});`;
  const result = validateSQL(query);
  if (!result.valid) {
    throw new Error(`Tipo ${type} deberia ser valido. Errores: ${JSON.stringify(result.errors)}`);
  }
  expect(result.valid).toBe(true);
});

// ---------------------------------------------------------------------------
// SQL: typos de tipos de dato en CREATE TABLE (CREATE_TABLE_TYPE_TYPOS)
// ---------------------------------------------------------------------------
const typeTypos = [
  ['IT', 'INT'], ['VCHAR', 'VARCHAR'], ['VARHAR', 'VARCHAR'], ['VARCAHR', 'VARCHAR'],
  ['DECIAML', 'DECIMAL'], ['DATATIME', 'DATETIME'], ['DTE', 'DATE'], ['TEX', 'TEXT'],
  ['BOOLEAM', 'BOOLEAN']
];

test.each(typeTypos)('SQL invalido: CREATE TABLE con tipo mal escrito %s', (typo, expected) => {
  const query = `CREATE TABLE tabla_prueba (columna1 ${typo});`;
  const result = validateSQL(query);
  expect(result.valid).toBe(false);
  expect(result.errors[0].message).toContain(expected);
});

// ---------------------------------------------------------------------------
// SQL: typos estructurales de CREATE TABLE (regex especificos de collectStrictSQLIssues)
// ---------------------------------------------------------------------------
const ddlStructuralTypos = [
  { q: 'CREATE TABL articulos (id INT);', expect: 'TABLE' },
  { q: 'CREATE ABLE articulos (id INT);', expect: 'TABLE' },
  { q: 'CREATE TAB articulos (id INT);', expect: 'TABLE' },
  { q: 'CREATE TABLE articulos (nombre VARHAR(30));', expect: 'VARCHAR' },
  { q: 'CREATE TABLE articulos (id INT, PRIMRY KEY (id));', expect: 'PRIMARY' },
  { q: 'CREATE TABLE articulos (idcategoria INT, CONSTRAINT fk FOREIGN KEY (idcategoria) REFERENCES categorias(id) O UPDATE ASCADE ON DELETE ST NULL);', expect: 'ON UPDATE' },
  { q: 'CREATE TABLE articulos (id INT) DEFAULT CHARSET=utb4;', expect: 'utf8mb4' },
  { q: 'CREATE TABLE articulos (id INT) COLLATE=utf8mb4_geal_ci;', expect: 'utf8mb4_general_ci' },
  { q: 'COLLATE=utf84_general_ci;', expect: 'utf84_general_ci' },
  { q: 'CREATE TABLE empleados (id NUMBER GENATED BY DEFAULT AS IDENTITY);', expect: 'GENERATED' },
  { q: 'CREATE TABLE empleados (fecha DTE);', expect: 'DATE' },
  { q: 'CREATE TABLE empleados (nombre VARCHAR(10) DEFALT NULL);', expect: 'DEFAULT' },
  { q: 'CREATE TABLE empleados (nombre VARCHAR(10) DEFAUL NULL);', expect: 'DEFAULT' },
  { q: 'CREATE TABLE empleados (CONSTINT pk PRIMARY KEY (id));', expect: 'CONSTRAINT' }
];

test.each(ddlStructuralTypos)('SQL invalido: DDL estructural $q', ({ q, expect: expected }) => {
  const result = validateSQL(q);
  expect(result.valid).toBe(false);
  expect(result.errors[0].message).toContain(expected);
});

// ---------------------------------------------------------------------------
// SQL: motores, charsets y collations de MySQL (validos e invalidos)
// ---------------------------------------------------------------------------
const mysqlEngines = ['InnoDB', 'MyISAM', 'MEMORY'];
test.each(mysqlEngines)('SQL valido: ENGINE=%s', (engine) => {
  const result = validateSQL(`CREATE TABLE t (id INT) ENGINE=${engine};`);
  expect(result.valid).toBe(true);
});
test('SQL invalido: ENGINE desconocido', () => {
  const result = validateSQL('CREATE TABLE t (id INT) ENGINE=RocksDB;');
  expect(result.valid).toBe(false);
  expect(result.errors[0].message).toContain('ENGINE=RocksDB');
});
test('SQL invalido: ENGINE incompleto', () => {
  const result = validateSQL('CREATE TABLE t (id INT) ENGINE=;');
  expect(result.valid).toBe(false);
});
test('SQL invalido: ENGIN mal escrito', () => {
  const result = validateSQL('CREATE TABLE t (id INT) ENGIN=InnoDB;');
  expect(result.valid).toBe(false);
  expect(result.errors[0].message).toContain('ENGINE');
});

const mysqlCharsets = ['utf8mb4', 'utf8', 'latin1', 'ascii', 'binary', 'ucs2', 'utf16', 'utf32'];
test.each(mysqlCharsets)('SQL valido: CHARSET=%s', (charset) => {
  const result = validateSQL(`CREATE TABLE t (id INT) DEFAULT CHARSET=${charset};`);
  expect(result.valid).toBe(true);
});
test('SQL invalido: CHARSET desconocido', () => {
  const result = validateSQL('CREATE TABLE t (id INT) DEFAULT CHARSET=klingon;');
  expect(result.valid).toBe(false);
});
test('SQL invalido: CHARET mal escrito', () => {
  const result = validateSQL('CREATE TABLE t (id INT) CHARET=utf8mb4;');
  expect(result.valid).toBe(false);
  expect(result.errors[0].message).toContain('CHARSET');
});

const mysqlCollations = [
  'utf8mb4_general_ci', 'utf8mb4_unicode_ci', 'utf8mb4_spanish_ci',
  'utf8_general_ci', 'latin1_swedish_ci', 'ascii_general_ci'
];
test.each(mysqlCollations)('SQL valido: COLLATE=%s', (collation) => {
  const result = validateSQL(`CREATE TABLE t (id INT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=${collation};`);
  expect(result.valid).toBe(true);
});
test('SQL invalido: COLLATE desconocida', () => {
  const result = validateSQL('CREATE TABLE t (id INT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=klingon_ci;');
  expect(result.valid).toBe(false);
});
test('SQL invalido: COLLTE mal escrito', () => {
  const result = validateSQL('CREATE TABLE t (id INT) COLLTE=utf8mb4_general_ci;');
  expect(result.valid).toBe(false);
  expect(result.errors[0].message).toContain('COLLATE');
});

// ---------------------------------------------------------------------------
// SQL: JOIN (validos e invalidos)
// ---------------------------------------------------------------------------
const joinTypes = ['INNER', 'LEFT', 'RIGHT', 'FULL'];
test.each(joinTypes)('SQL valido: %s JOIN con ON', (joinType) => {
  const result = validateSQL(`SELECT * FROM a JOIN b ON a.id = b.id;`.replace('JOIN', `${joinType} JOIN`));
  expect(result.valid).toBe(true);
});
test.each(joinTypes)('SQL valido: %s JOIN con USING', (joinType) => {
  const result = validateSQL(`SELECT * FROM a JOIN b USING (id);`.replace('JOIN', `${joinType} JOIN`));
  expect(result.valid).toBe(true);
});
test('SQL valido: CROSS JOIN sin condicion', () => {
  const result = validateSQL('SELECT * FROM a CROSS JOIN b;');
  expect(result.valid).toBe(true);
});
test('SQL invalido: JOIN sin ON/USING', () => {
  const result = validateSQL('SELECT * FROM a JOIN b;');
  expect(result.valid).toBe(false);
  expect(result.errors[0].message).toContain('ON o USING');
});
test('SQL invalido: JOIN con WERE en vez de WHERE', () => {
  const result = validateSQL('SELECT * FROM a JOIN b ON a.id=b.id WERE a.x=1;');
  expect(result.valid).toBe(false);
});
test('SQL invalido: tabla FORM en vez de FROM', () => {
  const result = validateSQL('SELECT nombre FORM usuarios;');
  expect(result.valid).toBe(false);
  expect(result.errors[0].suggestion).toContain('FROM');
});

// ---------------------------------------------------------------------------
// SQL: sentencias de transaccion (validas e invalidas)
// ---------------------------------------------------------------------------
const validTransactions = [
  'COMMIT;', 'ROLLBACK;', 'ROLLBACK TO SAVEPOINT sp1;', 'BEGIN;', 'BEGIN TRANSACTION;',
  'START TRANSACTION;', 'SAVEPOINT sp1;', 'RELEASE SAVEPOINT sp1;'
];
test.each(validTransactions)('SQL valido: transaccion %s', (query) => {
  const result = validateSQL(query);
  expect(result.valid).toBe(true);
});

const invalidTransactions = [
  { q: 'COMMIT empleados;', expect: 'COMMIT no acepta' },
  { q: 'ROLLBACK tabla;', expect: 'ROLLBACK solo acepta' },
  { q: 'BEGIN empleados;', expect: 'BEGIN solo acepta' },
  { q: 'START empleados;', expect: null },
  { q: 'SAVEPOINT;', expect: null }
];
test.each(invalidTransactions)('SQL invalido: transaccion malformada $q', ({ q, expect: expected }) => {
  const result = validateSQL(q);
  expect(result.valid).toBe(false);
  if (expected) expect(result.errors[0].suggestion).toContain(expected);
});

// ---------------------------------------------------------------------------
// SQL: DECLARE, LOCK/UNLOCK (validos e invalidos)
// ---------------------------------------------------------------------------
test('SQL invalido: DECLARE vacio', () => {
  const result = validateSQL('DECLARE;');
  expect(result.valid).toBe(false);
});
test('SQL invalido: LOCK sin TABLES', () => {
  const result = validateSQL('LOCK articulos WRITE;');
  expect(result.valid).toBe(false);
  expect(result.errors[0].message).toContain('TABLES');
});
test('SQL invalido: LOCK TABLES sin tablas', () => {
  const result = validateSQL('LOCK TABLES;');
  expect(result.valid).toBe(false);
});
test('SQL invalido: LOCK TABLES sin modo', () => {
  const result = validateSQL('LOCK TABLES articulos;');
  expect(result.valid).toBe(false);
  expect(result.errors[0].message).toContain('READ o WRITE');
});
test('SQL invalido: UNLOCK sin TABLES', () => {
  const result = validateSQL('UNLOCK;');
  expect(result.valid).toBe(false);
});
test('SQL invalido: UNLOCK TABLES con nombre de tabla', () => {
  const result = validateSQL('UNLOCK TABLES articulos;');
  expect(result.valid).toBe(false);
});

// ---------------------------------------------------------------------------
// SQL: palabras clave DML mal escritas (typos generados con distancia de edicion conocida)
// ---------------------------------------------------------------------------
const dmlKeywordTemplates = {
  SELECT: (kw) => `${kw} id FROM empleados;`,
  FROM: (kw) => `SELECT id ${kw} empleados;`,
  WHERE: (kw) => `SELECT id FROM empleados ${kw} id = 1;`,
  GROUP: (kw) => `SELECT id FROM empleados ${kw} BY id;`,
  ORDER: (kw) => `SELECT id FROM empleados ${kw} BY id;`,
  HAVING: (kw) => `SELECT id FROM empleados GROUP BY id ${kw} COUNT(*) > 1;`,
  UPDATE: (kw) => `${kw} empleados SET id = 1;`,
  DELETE: (kw) => `${kw} FROM empleados;`,
  INSERT: (kw) => `${kw} INTO empleados VALUES (1);`
};

const dmlKeywords = Object.keys(dmlKeywordTemplates);
const dmlTypoFixtures = buildTypoSet(dmlKeywords);

test.each(dmlTypoFixtures)('SQL invalido: keyword mal escrito ($original -> $typo)', ({ original, typo }) => {
  const query = dmlKeywordTemplates[original](typo);
  const result = validateSQL(query);
  expect(result.valid).toBe(false);
});

// ---------------------------------------------------------------------------
// SQL: deteccion de motor por consulta (recorre senales de detector.js)
// ---------------------------------------------------------------------------
const engineDetectionQueries = [
  { q: 'CREATE TABLE t (id INT AUTO_INCREMENT) ENGINE=InnoDB;', engine: 'MySQL' },
  { q: 'SELECT * FROM t WHERE nombre ILIKE \'a%\';', engine: 'PostgreSQL' },
  { q: 'SELECT ARRAY_AGG(nombre) FROM t;', engine: 'PostgreSQL' },
  { q: 'SELECT TOP 5 * FROM t WITH (NOLOCK);', engine: 'SQL Server' },
  { q: 'SELECT NEWID();', engine: 'SQL Server' },
  { q: 'SELECT * FROM t WHERE ROWNUM <= 5;', engine: 'Oracle' },
  { q: 'SELECT SYSTIMESTAMP FROM DUAL;', engine: 'Oracle' },
  { q: 'PRAGMA foreign_keys = ON;', engine: 'SQLite' },
  { q: 'SELECT AUTOINCREMENT FROM t;', engine: 'SQLite' },
  { q: 'SELECT * FROM t LIMIT 5;', engine: null }
];
test.each(engineDetectionQueries)('SQL deteccion de motor: $q', ({ q, engine }) => {
  const result = validateSQL(q);
  expect(result.valid).toBe(true);
  if (engine) expect(result.dialect).toBe(engine);
});

// ---------------------------------------------------------------------------
// SQL: expresiones invalidas
// ---------------------------------------------------------------------------
const invalidExpressions = [
  { q: 'SELECT S(monto) FROM ventas;', expect: 'Función desconocida', field: 'suggestion' },
  { q: 'SELECT COUNTT(id) FROM tabla;', expect: 'Función desconocida', field: 'suggestion' },
  { q: 'SELECT nombre direccion FROM usuarios;', expect: 'Coma (,) o AS', field: 'message' },
  { q: 'SELECT a b c d FROM t;', expect: 'Coma (,) o AS', field: 'message' },
  { q: 'CREATE TABLE;', expect: 'requiere un tipo de objeto', field: 'suggestion' },
  { q: 'SELECT nombre, CASE WHEN salario > 4000 \'Alto\' END AS nivel FROM empleados;', expect: 'THEN', field: 'message' },
  { q: 'SELECT * FROM t WHERE id = 1 AND;', expect: null },
  { q: 'SELECT 1abc FROM t;', expect: null },
  { q: 'SELECT * FROM t WHERE id = ;', expect: null }
];
test.each(invalidExpressions)('SQL invalido: expresion $q', ({ q, expect: expected, field }) => {
  const result = validateSQL(q);
  expect(result.valid).toBe(false);
  if (expected) expect(result.errors[0][field || 'message']).toContain(expected);
});

// ---------------------------------------------------------------------------
// MongoDB: comandos de coleccion validos (recorre MONGO_COLLECTION_COMMANDS)
// ---------------------------------------------------------------------------
const mongoValidCommandCalls = {
  find: 'find({ activo: true })',
  findOne: 'findOne({ activo: true })',
  insertOne: 'insertOne({ nombre: "Ana" })',
  insertMany: 'insertMany([{ nombre: "Ana" }])',
  updateOne: 'updateOne({ id: 1 }, { $set: { activo: false } })',
  updateMany: 'updateMany({ activo: true }, { $set: { activo: false } })',
  replaceOne: 'replaceOne({ id: 1 }, { nombre: "Ana" })',
  deleteOne: 'deleteOne({ id: 1 })',
  deleteMany: 'deleteMany({ activo: false })',
  aggregate: 'aggregate([{ $match: { activo: true } }])',
  countDocuments: 'countDocuments({ activo: true })',
  estimatedDocumentCount: 'estimatedDocumentCount()',
  distinct: 'distinct("nombre")',
  bulkWrite: 'bulkWrite([{ insertOne: { nombre: "Ana" } }])',
  createIndex: 'createIndex({ nombre: 1 })',
  dropIndex: 'dropIndex("nombre_1")',
  dropIndexes: 'dropIndexes()',
  renameCollection: 'renameCollection("nueva")',
  watch: 'watch()',
  findOneAndUpdate: 'findOneAndUpdate({ id: 1 }, { $set: { activo: false } })',
  findOneAndDelete: 'findOneAndDelete({ id: 1 })',
  findOneAndReplace: 'findOneAndReplace({ id: 1 }, { nombre: "Ana" })',
  drop: 'drop()',
  remove: 'remove({ id: 1 })',
  save: 'save({ nombre: "Ana" })',
  update: 'update({ id: 1 }, { $set: { activo: false } })',
  insert: 'insert({ nombre: "Ana" })',
  getIndexes: 'getIndexes()',
  stats: 'stats()',
  validate: 'validate()'
};

test.each(Object.entries(mongoValidCommandCalls))('Mongo valido: %s', (command, call) => {
  const result = validateNoSQL(`db.coleccion.${call};`);
  if (!result.valid) {
    throw new Error(`Comando ${command} deberia ser valido. Errores: ${JSON.stringify(result.errors)}`);
  }
  expect(result.valid).toBe(true);
});

// ---------------------------------------------------------------------------
// MongoDB: db.createCollection (comando de nivel de base de datos)
// ---------------------------------------------------------------------------
test('Mongo valido: db.createCollection', () => {
  const result = validateNoSQL('db.createCollection("empleados");');
  expect(result.valid).toBe(true);
});
test('Mongo invalido: createCollection sin argumentos', () => {
  const result = validateNoSQL('db.createCollection();');
  expect(result.valid).toBe(false);
});

// ---------------------------------------------------------------------------
// MongoDB: metodos encadenados validos e invalidos
// ---------------------------------------------------------------------------
const mongoChainCalls = [
  '.sort({ salario: -1 })',
  '.limit(5)',
  '.skip(2)',
  '.count()',
  '.explain()',
  '.toArray()',
  '.pretty()',
  '.forEach()',
  '.map()',
  '.hasNext()',
  '.next()'
];
test.each(mongoChainCalls)('Mongo valido: metodo encadenado %s', (chain) => {
  const result = validateNoSQL(`db.empleados.find({})${chain};`);
  expect(result.valid).toBe(true);
});
test.each(['.sort()', '.limit()', '.skip()'])('Mongo invalido: %s sin argumento', (chain) => {
  const result = validateNoSQL(`db.empleados.find({})${chain};`);
  expect(result.valid).toBe(false);
});

// ---------------------------------------------------------------------------
// MongoDB: sintaxis JSON de pipeline y comandos
// ---------------------------------------------------------------------------
const validMongoJSON = [
  '{ "find": "usuarios", "filter": { "edad": { "$gte": 18 } } }',
  '[{ "$match": { "activo": true } }, { "$group": { "_id": "$categoria", "total": { "$sum": 1 } } }]',
  '{ "$match": { "activo": true } }',
  '[{ "$sort": { "fecha": -1 } }, { "$limit": 10 }]'
];
test.each(validMongoJSON)('Mongo valido JSON: %s', (query) => {
  const result = validateNoSQL(query);
  expect(result.valid).toBe(true);
});
test('Mongo invalido JSON: no reconocido como consulta MongoDB', () => {
  const result = validateNoSQL('{ "clave": "valor" }');
  expect(result.valid).toBe(false);
});
test('Mongo invalido JSON: sintaxis JSON rota', () => {
  const result = validateNoSQL('{ "find": "usuarios", }');
  expect(result.valid).toBe(false);
});
test('Mongo invalido JSON: operador desconocido en pipeline', () => {
  const result = validateNoSQL('[{ "$macth": { "activo": true } }]');
  expect(result.valid).toBe(false);
});

// ---------------------------------------------------------------------------
// MongoDB: tipos de valor (regex, fechas, ObjectId, arrays, negativos, booleanos)
// ---------------------------------------------------------------------------
const validMongoValueQueries = [
  'db.empleados.find({ nombre: /^M/ });',
  'db.empleados.find({ nombre: /^M/i });',
  'db.empleados.find({ fecha: new Date() });',
  'db.empleados.find({ fecha: new Date("2021-01-15") });',
  'db.empleados.find({ fecha: ISODate("2021-01-15T00:00:00Z") });',
  'db.empleados.find({ _id: ObjectId("64abc123") });',
  'db.empleados.find({ codigo: NumberLong(5) });',
  'db.empleados.find({ salario: { $gt: -100 } });',
  'db.empleados.find({ activo: true, borrado: false, extra: null });',
  'db.empleados.find({ tags: ["a", "b", "c"] });',
  'db.empleados.find({ direccion: { calle: "x", numero: 5 } });',
  'db.ventas.aggregate([{ $group: { _id: "$categoria", total: { $sum: "$monto" } } }]);',
  'db.ventas.aggregate([{ $project: { total: { $multiply: ["$horas", "$tarifa"] } } }]);',
  'db.empleados.updateOne({ activo: true }, { $inc: { intentos: 1 } });',
  'db.empleados.find().sort({ salario: -1 }).limit(5).skip(2);'
];
test.each(validMongoValueQueries)('Mongo valido: tipos de valor %s', (query) => {
  const result = validateNoSQL(query);
  if (!result.valid) {
    throw new Error(`Deberia ser valido. Errores: ${JSON.stringify(result.errors)}`);
  }
  expect(result.valid).toBe(true);
});

// ---------------------------------------------------------------------------
// MongoDB: comandos desconocidos (typos generados sobre MONGO_COMMANDS)
// ---------------------------------------------------------------------------
const MONGO_COMMANDS = [
  'find', 'findOne', 'insertOne', 'insertMany', 'updateOne',
  'updateMany', 'replaceOne', 'deleteOne', 'deleteMany', 'aggregate',
  'countDocuments', 'estimatedDocumentCount', 'distinct', 'bulkWrite',
  'createIndex', 'dropIndex', 'dropIndexes', 'renameCollection', 'watch',
  'findOneAndUpdate', 'findOneAndDelete', 'findOneAndReplace',
  'sort', 'limit', 'skip', 'count', 'explain', 'toArray', 'pretty',
  'forEach', 'map', 'hasNext', 'next', 'drop', 'remove', 'save',
  'update', 'insert', 'getIndexes', 'stats', 'validate',
  'createCollection', 'renameCollection'
];
const mongoCommandTypos = buildTypoSet([...new Set(MONGO_COMMANDS)]);

test.each(mongoCommandTypos)('Mongo invalido: comando mal escrito ($original -> $typo)', ({ original, typo }) => {
  const result = validateNoSQL(`db.coleccion.${typo}();`);
  expect(result.valid).toBe(false);
  expect(result.errors[0].message).toContain(typo);
});

// ---------------------------------------------------------------------------
// MongoDB: operadores desconocidos (typos generados sobre MONGO_OPERATORS)
// ---------------------------------------------------------------------------
const MONGO_OPERATORS = [
  '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin',
  '$and', '$or', '$not', '$nor', '$exists', '$type', '$mod',
  '$regex', '$text', '$where', '$all', '$elemMatch', '$size',
  '$slice', '$set', '$unset', '$inc', '$push', '$pull', '$addToSet',
  '$pop', '$rename', '$currentDate', '$mul', '$min', '$max',
  '$sum', '$avg', '$first', '$last', '$multiply', '$match', '$group', '$sort',
  '$project', '$limit', '$skip', '$unwind', '$lookup', '$count',
  '$addFields', '$replaceRoot', '$out', '$merge', '$bucket',
  '$facet', '$geoNear', '$graphLookup', '$indexStats', '$listSessions',
  '$planCacheStats', '$redact', '$sample', '$sortByCount', '$unionWith',
  '$expr', '$jsonSchema', '$setOnInsert', '$bucketAuto', '$search', '$vectorSearch',
  '$each', '$position', '$natural',
  '$cond', '$ifNull', '$switch', '$dateToString', '$toString',
  '$toInt', '$toLong', '$toDouble', '$toObjectId', '$toDate',
  '$concat', '$substr', '$toLower', '$toUpper', '$trim',
  '$arrayElemAt', '$filter', '$map', '$reduce', '$concatArrays',
  '$isArray', '$reverseArray', '$zip',
  '$abs', '$ceil', '$floor', '$log', '$pow', '$sqrt', '$trunc',
  '$dayOfMonth', '$dayOfWeek', '$dayOfYear', '$hour', '$minute',
  '$second', '$millisecond', '$month', '$week', '$year',
  '$dateFromParts', '$dateToParts', '$dateFromString',
  '$literal', '$meta', '$objectToArray', '$arrayToObject',
  '$mergeObjects', '$setEquals', '$setIntersection', '$setUnion',
  '$setDifference', '$setIsSubset', '$anyElementTrue', '$allElementsTrue',
  '$replaceWith', '$replaceAll', '$regexFind', '$regexFindAll', '$regexMatch',
  '$accumulator', '$function', '$let', '$rand', '$sampleRate',
  '$densify', '$fill', '$setWindowFields', '$documents'
];
const mongoOperatorTypos = buildTypoSet([...new Set(MONGO_OPERATORS)]);

test.each(mongoOperatorTypos)('Mongo invalido: operador mal escrito ($original -> $typo)', ({ original, typo }) => {
  const result = validateNoSQL(`db.coleccion.find({ ${typo}: 1 });`);
  expect(result.valid).toBe(false);
  expect(result.errors[0].message).toContain(typo);
});

// ---------------------------------------------------------------------------
// MongoDB: validacion de cantidad de argumentos
// ---------------------------------------------------------------------------
const mongoArgCountErrors = [
  { q: 'db.empleados.aggregate();', expect: 'requiere' },
  { q: 'db.empleados.aggregate({ $match: {} });', expect: 'array' },
  { q: 'db.empleados.updateOne({ id: 1 });', expect: 'requiere' },
  { q: 'db.empleados.updateMany();', expect: 'requiere' },
  { q: 'db.empleados.deleteOne();', expect: 'requiere' },
  { q: 'db.empleados.insertOne();', expect: 'requiere' },
  { q: 'db.empleados.findOneAndUpdate({ id: 1 });', expect: 'requiere' },
  { q: 'db.createCollection();', expect: 'requiere' }
];
test.each(mongoArgCountErrors)('Mongo invalido: argumentos $q', ({ q, expect: expected }) => {
  const result = validateNoSQL(q);
  expect(result.valid).toBe(false);
  expect(result.errors[0].message).toContain(expected);
});

// ---------------------------------------------------------------------------
// MongoDB: errores estructurales de sintaxis
// ---------------------------------------------------------------------------
const mongoStructuralErrors = [
  'coleccion.find({});',
  'db find({});',
  'db.find({});',
  'db..find({});',
  'db.empleados find({});',
  'db.empleados.find({;',
  'db.empleados.find({ id: 1);',
  'db.empleados.find({ id: 1 }',
  'db.empleados.find({ id: 1 },);',
  'db.empleados.find({ id: });',
  'db.empleados.find({ id: 1, });',
  'db.empleados.find([1, 2,]);',
  'db.empleados.buscar({});',
  'db.empleados.findAll();',
  '',
  '{ "find": "usuarios"',
  'db.empleados.find({ nombre: /sin cierre });',
  'db.empleados.find({ x: new Foo() });',
  'db.empleados.find({ x: -abc });'
];
test.each(mongoStructuralErrors)('Mongo invalido: estructural %s', (query) => {
  const result = validateNoSQL(query);
  expect(result.valid).toBe(false);
});
