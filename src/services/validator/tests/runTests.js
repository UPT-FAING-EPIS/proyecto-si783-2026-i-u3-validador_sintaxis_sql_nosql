const { validateSQL, validateNoSQL } = require('../../validation.service');

const validQueries = [
    // ALIAS
    "SELECT u.nombre, p.descripcion FROM usuarios u INNER JOIN pedidos p ON u.id = p.usuario_id WHERE u.activo = 1;",
    "SELECT db.tabla.columna FROM db.tabla;",
    "SELECT tabla.* FROM schema.tabla;",
    
    // JOIN
    "SELECT a.id FROM tabla_a a LEFT JOIN tabla_b b ON a.id = b.id;",
    "SELECT * FROM a FULL OUTER JOIN b ON a.x = b.y;",
    
    // CTE
    "WITH VentasCTE AS (SELECT empleado_id, SUM(monto) AS total_ventas FROM ventas GROUP BY empleado_id) SELECT * FROM VentasCTE;",
    "WITH RECURSIVE numeros AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM numeros WHERE n < 10) SELECT * FROM numeros;",
    
    // Window Functions
    "SELECT RANK() OVER (PARTITION BY departamento ORDER BY salario DESC) FROM empleados;",
    "SELECT LEAD(fecha) OVER (ORDER BY id) FROM eventos;",
    
    // JSONB / UUID / RETURNING (PostgreSQL)
    "UPDATE usuarios SET metadata = '{\"theme\":\"dark\"}'::JSONB WHERE id = '550e8400-e29b-41d4-a716-446655440000'::UUID RETURNING id, nombre;",
    
    // TOP / NOLOCK (SQL Server)
    "SELECT TOP 10 id, nombre FROM clientes WITH (NOLOCK) WHERE id = NEWID();",
    
    // LIMIT (MySQL/Postgres/SQLite)
    "SELECT * FROM usuarios LIMIT 10 OFFSET 5;",
    
    // ROWNUM (Oracle)
    "SELECT * FROM (SELECT * FROM usuarios ORDER BY id) WHERE ROWNUM <= 10;",
    
    // SYSTIMESTAMP (Oracle)
    "SELECT SYSTIMESTAMP FROM DUAL;",
    
    // SQLite PRAGMA
    "PRAGMA foreign_keys = ON;",

    // Regresión final multimotor
    "SELECT salario * 1.10 AS salario_proyectado FROM empleados;",
    "INSERT INTO empleados VALUES (1, 'Juan', 'Perez', 30, 2500.50, DATE '2021-01-15', 1, 'Activo');",
    `SELECT e.nombre, e.apellido, p.nombre AS proyecto, a.horas, a.tarifa
FROM empleados e
INNER JOIN asignaciones a
ON e.id_empleado = a.id_empleado
INNER JOIN proyectos p
ON a.id_proyecto = p.id_proyecto;`,
    `SELECT nombre, salario,
CASE
WHEN salario >= 4000.00 THEN 'Alto'
WHEN salario >= 3000.00 THEN 'Medio'
ELSE 'Bajo'
END AS nivel_salario
FROM empleados;`,
    "COMMIT;",
    "SET search_path TO empresa;",
    "GO",
    "DECLARE @bono DECIMAL(10,2); SET @bono = 100.50;",
    "SELECT TOP 5 * FROM empleados;",
    "LOCK TABLES articulos WRITE;",
    "LOCK TABLES categorias READ, articulos WRITE;",
    "LOCK TABLES usuario WRITE, articulos WRITE, categorias READ;",
    "UNLOCK TABLES;",
    `CREATE TABLE articulos (
idarticulo INT(11) NOT NULL AUTO_INCREMENT,
titulo VARCHAR(30) DEFAULT NULL,
estado ENUM('Activo','Inactivo') DEFAULT 'Activo',
precio DECIMAL(10,2) DEFAULT 0,
fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (idarticulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,
    `DELIMITER $$
CREATE PROCEDURE listar_articulos()
BEGIN
    SELECT * FROM articulos;
END$$
DELIMITER ;`,
    `DELIMITER //
CREATE TRIGGER trg_articulos_ai
AFTER INSERT ON articulos
FOR EACH ROW
BEGIN
    INSERT INTO log_acciones(descripcion)
    VALUES ('Articulo insertado');
END//
DELIMITER ;`
];

const invalidQueries = [
    // Tipográficos
    { q: "SELECT nombre FORM usuarios;", expectError: "Quizás quiso escribir FROM" },
    { q: "SELCT * FROM tabla;", expectError: "Quizás quiso escribir SELECT" },
    { q: "UPDTE usuarios SET nombre = 'A';", expectError: "Quizás quiso escribir UPDATE" },
    { q: "SELECT * FROM tabla WERE id = 1;", expectError: "Quizás quiso escribir WHERE" },
    { q: "SELECT * FROM tabla ORDER BY id ODER;", expectError: "Quizás quiso escribir ORDER" }, 
    
    // Funciones
    { q: "SELECT S(monto) FROM ventas;", expectError: "Función desconocida \"S\"" },
    { q: "SELECT COUNTT(id) FROM tabla;", expectError: "Función desconocida \"COUNTT\"" },
    { q: "SELECT S() FROM t;", expectError: "Función desconocida \"S\"" },

    // Identificadores consecutivos (Falta coma)
    { q: "SELECT nombre direccion FROM usuarios;", expectError: "Coma (,) o AS" },
    { q: "SELECT a b c d FROM t;", expectError: "Coma (,) o AS" },

    // DDL incompleto
    { q: "CREATE TABLE;", expectError: "requiere un tipo de objeto" },

    // Regresión final MySQL/CASE/transacciones
    { q: "CREATE ABLE articulos (idarticulo INT(11) NOT NULL AUTO_INCREMENT);", expectError: "TABLE" },
    { q: "CREATE TAB usuario (idusuario VARCHAR(20) NOT NULL);", expectError: "TABLE" },
    { q: "CREATE TABL articulos (idarticulo INT(11) NOT NULL AUTO_INCREMENT);", expectError: "TABLE" },
    { q: "CREATE TABLE articulos (titulo VARHAR(30) DEFAULT NULL);", expectError: "VARCHAR" },
    { q: "CREATE TABLE prueba (id it(11));", expectError: "INT" },
    { q: "CREATE TABLE prueba (nombre vchar(100));", expectError: "VARCHAR" },
    { q: "CREATE TABLE prueba (precio deciaml(10,2));", expectError: "DECIMAL" },
    { q: "CREATE TABLE prueba (fecha DATATIME DEFAULT NULL);", expectError: "DATETIME" },
    { q: "CREATE TABLE prueba (cuerpo TEX DEFAULT NULL);", expectError: "TEXT" },
    { q: "CREATE TABLE articulos (idarticulo INT(11), PRIMRY KEY (idarticulo));", expectError: "PRIMARY" },
    { q: "CREATE TABLE articulos (idcategoria INT(11), CONSTRAINT fk FOREIGN KEY (idcategoria) REFERENCES categorias(idcategoria) O UPDATE ASCADE ON DELETE ST NULL);", expectError: "ON UPDATE" },
    { q: "CREATE TABLE articulos (idarticulo INT(11)) ENGINE=InnoDB DEFAULT CHARSET=utb4 COLLATE=utf8mb4_geal_ci;", expectError: "utf8mb4" },
    { q: "CREATE TABLE prueba (id INT) ENGINE=InoDB;", expectError: "InnoDB" },
    { q: "CREATE TABLE prueba (id INT) ENGINE=Anything;", expectError: "ENGINE=Anything" },
    { q: "CREATE TABLE prueba (id INT) ENGIN=InnoDB;", expectError: "ENGINE" },
    { q: "CREATE TABLE prueba (id INT) DEFAULT CHARSET=ut8mb4;", expectError: "utf8mb4" },
    { q: "CREATE TABLE prueba (id INT) DEFAULT CHARSET=abc;", expectError: "CHARSET=abc" },
    { q: "CREATE TABLE prueba (id INT) CHARET=utf8mb4;", expectError: "CHARSET" },
    { q: "CREATE TABLE prueba (id INT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLTE=utf8mb4_general_ci;", expectError: "COLLATE" },
    { q: "CREATE TABLE prueba (id INT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_geal_ci;", expectError: "utf8mb4_general_ci" },
    { q: "CREATE TABLE prueba (id INT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=;", expectError: "COLLATE incompleto" },
    { q: "CREATE TABLE prueba (nombre VARCHAR(100) DEFALT NULL);", expectError: "DEFAULT" },
    { q: "CREATE TABLE prueba (nombre VARCHAR(100) DEFAULT NUL);", expectError: "NULL" },
    { q: "CREATE TABLE prueba (nombre VARCHAR(100) DEFAULT NLL);", expectError: "NULL" },
    { q: "CREATE TABLE prueba (nombre VARCHAR(100) DEFAULT);", expectError: "DEFAULT incompleto" },
    { q: "CREATE TABLE prueba (apellido VARCHAR(100) NOT NUL);", expectError: "NOT NULL" },
    { q: "CREATE TABLE prueba (autor VARCHAR(20) NO NULL);", expectError: "NOT NULL" },
    { q: "CREATE TABLE prueba (autor VARCHAR(20) NOTT NULL);", expectError: "NOT NULL" },
    { q: "CREATE TABLE empleados (id NUMBER GENATED BY DEFAULT AS IDENTITY);", expectError: "GENERATED" },
    { q: "CREATE TABLE empleados (fecha_ingreso DTE);", expectError: "DATE" },
    { q: "CREATE TABLE empleados (activo CHAR(1) DEFALT 'S');", expectError: "DEFAULT" },
    { q: "CREATE TABLE empleados (CONSTINT pk_empleados PRIMARY KEY (id));", expectError: "CONSTRAINT" },
    { q: "COLLATE=utf84_general_ci;", expectError: "utf84_general_ci" },
    { q: "respuesta VARCHAR(40) DEFAULT NULL\ncorreo VARCHAR(40) DEFAULT NULL,", expectError: "Falta coma" },
    { q: "SELECT nombre, CASE WHEN salario > 4000 'Alto' END AS nivel FROM empleados;", expectError: "THEN" },
    { q: "COMMIT empleados;", expectError: "COMMIT no acepta" },
    { q: "ROLLBACK tabla;", expectError: "ROLLBACK solo acepta" },
    { q: "LOCK TABLES;", expectError: "requiere al menos" },
    { q: "LOCK articulos WRITE;", expectError: "TABLES" },
    { q: "LOCK TABLES articulos;", expectError: "READ o WRITE" },
    { q: "UNLOCK;", expectError: "TABLES" },
    { q: "UNLOCK articulos;", expectError: "TABLES" }
];

const multiErrorSQL = [
    {
        label: 'MySQL alterado con múltiples errores',
        minErrors: 7,
        q: `CREATE TABLE articulos (
idarticulo INT(11) NOT NULL AUTO_INCREMENT,
titulo VARHAR(30) DEFAULT NULL,
cuerpo TEXT DEFAULT NULL,
fecha DATETIME DEFAULT NULL,
imagen VARCHAR(100) DEFAULT NULL,
autor VARCHAR(20) DEFAULT NULL,
idcategoria INT(11) DEFAULT NULL,
estado INT(11) DEFAULT NULL,
PRIMRY KEY (idarticulo),
KEY idx_categoria (idcategoria),
CONSTRAINT fk_articulos_categoria
FOREIGN KEY (idcategoria)
REFERENCES categorias(idcategoria)
O UPDATE ASCADE
ON DELETE ST NULL
) ENGINE=InnoDB DEFAULT CHARSET=utb4 COLLATE=utf8mb4_geal_ci;`
    },
    {
        label: 'Oracle alterado con múltiples errores',
        minErrors: 7,
        q: `CREATE TABL empleados (
id NUMBER GENATED BY DEFAULT AS IDENTITY,
nombre VARCHAR2(100) NOT NULL,
apellido VARCHAR2(100) NOT NULL,
edad NUMBER(3)
salario NUMBER(10,2)
fecha_ingreso DTE,
activo CHAR(1) DEFALT 'S',
CONSTINT pk_empleados PRIMARY KEY (id)
);`
    },
    {
        label: 'MySQL tipos, defaults y opciones estrictas',
        minErrors: 13,
        q: `CREATE TABLE articulos (
idarticulo it(11) NOT NULL AUTO_INCREMENT,
titulo vchar(30) DEFALT NUL,
cuerpo TEX DEFAULT NULL,
fecha DATATIME DEFAULT NULL,
imagen VARCHAR(100) DEFAULT NLL,
autor VARCHAR(20) NO NULL,
idcategoria INT(11) DEFAULT NULL,
estado INT(11) DEFAULT NULL,
PRIMRY KEY (idarticulo)
) ENGINE=InoDB DEFAULT CHARSET=utb4 COLLTE=utf8mb4_geal_ci;`
    }
];

const validMongo = [
    '{\n "find":"usuarios",\n "filter":{\n   "edad":{\n      "$gte":18\n   }\n }\n}',
    'db.usuarios.aggregate([ { $match: { estado: "activo" } } ])',
    'db.pedidos.find({ "total": { $gt: 100 } })',
    'db.ventas.aggregate([ { $match: { anio: 2024 } }, { $group: { _id: "$categoria", total: { $sum: "$monto" } } } ])',
    'db.clientes.insertOne({ nombre: "María García", email: "maria@example.com", edad: 28, ciudad: "Madrid" })',
    'db.usuarios.updateOne( { _id: ObjectId("64abc123") }, { $set: { activo: false, fecha_baja: new Date() }, $inc: { intentos_login: 1 } } )',
    'use empresa_db; db.empleados.find();',
    'db.createCollection("empleados");',
    'db.empleados.find({salario:{$gt:3000.00}});',
    'db.empleados.find({nombre:/^M/});',
    'db.empleados.find({fecha:new Date("2021-01-15")});',
    'db.empleados.find({fecha:ISODate("2021-01-15T00:00:00Z")});',
    'db.empleados.find().sort({salario:-1}).limit(5).skip(2);',
    'db.empleados.updateMany({activo:true}, {$mul:{salario:1.10}});',
    'db.empleados.aggregate([{$match:{salario:{$gt:3000}}}, {$group:{_id:"$departamento", total:{$sum:1}}}]);',
    'db.asignaciones.aggregate([{ $project:{ total:{$multiply:["$horas","$tarifa"]} } }]);'
];

const invalidMongo = [
    { q: '{\n "$gteee":18\n}', expectError: 'Quizás quiso escribir: $gte' },
    { q: 'db.usuarios.finnd({ })', expectError: 'Quizás quiso escribir: find' },
    { q: 'db.users.aggregate([ { $macth: {} } ])', expectError: 'Quizás quiso escribir: $match' },
    { q: 'db.usuarios.selectData({ activo: true })', expectError: 'Comando desconocido "selectData"' },
    { q: 'db.posts.find({ vistas: { $mayorQue: 100 } })', expectError: 'desconocido' },
    { q: 'db..find();', expectError: 'no válido' },
    { q: 'db.empleados.find(;', expectError: 'Valor' },
    { q: 'db.empleados.find({edad:30);', expectError: '}' },
    { q: 'db.empleados.insertOne({nombre:});', expectError: 'Falta valor' },
    { q: 'db.empleados.updateOne({_id:1});', expectError: 'requiere filtro' },
    { q: 'db.empleados.updateMany();', expectError: 'requiere filtro' },
    { q: 'db.empleados.deleteOne();', expectError: 'requiere al menos' },
    { q: 'db.empleados.aggregate();', expectError: 'requiere' },
    { q: 'db.empleados.buscar({});', expectError: 'Comando desconocido' },
    { q: 'db.empleados.findAll();', expectError: 'Comando desconocido' }
];

let passed = 0;
let total = validQueries.length + invalidQueries.length + multiErrorSQL.length + validMongo.length + invalidMongo.length;

console.log("=== INICIANDO TESTS DE VALIDACIÓN SQL Y MONGODB ===");

console.log("\n--- CASOS VÁLIDOS SQL ---");
for (let q of validQueries) {
    const result = validateSQL(q);
    if (result.valid) {
        passed++;
        console.log(`[PASS] ${q.substring(0, 50)}...`);
    } else {
        console.log(`[FAIL] ${q}`);
        console.log(`   Esperado: Válido, Obtuvo: Inválido`);
        console.log(`   Errores: `, result.errors[0].message);
    }
}

console.log("\n--- CASOS INVÁLIDOS SQL ---");
for (let test of invalidQueries) {
    const result = validateSQL(test.q);
    if (!result.valid) {
        if (result.errors[0].message.includes(test.expectError) || (result.errors[0].suggestion && result.errors[0].suggestion.includes(test.expectError))) {
            passed++;
            console.log(`[PASS] ${test.q.substring(0, 50)}...`);
        } else {
            console.log(`[FAIL] ${test.q}`);
            console.log(`   Esperado error conteniendo: ${test.expectError}`);
            console.log(`   Obtuvo: ${result.errors[0].message} / Sugerencia: ${result.errors[0].suggestion}`);
        }
    } else {
        console.log(`[FAIL] ${test.q}`);
        console.log(`   Esperado: Inválido, Obtuvo: Válido`);
    }
}

console.log("\n--- CASOS SQL CON MÚLTIPLES ERRORES ---");
for (let test of multiErrorSQL) {
    const result = validateSQL(test.q);
    if (!result.valid && result.errors.length >= test.minErrors) {
        passed++;
        console.log(`[PASS] ${test.label} (${result.errors.length} errores)`);
    } else {
        console.log(`[FAIL] ${test.label}`);
        console.log(`   Esperado: >= ${test.minErrors} errores, Obtuvo: ${result.valid ? 'Válido' : result.errors.length + ' errores'}`);
        if (result.errors[0]) console.log(`   Primer error: ${result.errors[0].message}`);
    }
}

console.log("\n--- CASOS VÁLIDOS MONGODB ---");
for (let q of validMongo) {
    const result = validateNoSQL(q);
    if (result.valid) {
        passed++;
        console.log(`[PASS] ${q.substring(0, 50).replace(/\n/g, '')}...`);
    } else {
        console.log(`[FAIL] ${q}`);
        console.log(`   Esperado: Válido, Obtuvo: Inválido`);
        console.log(`   Errores: `, result.errors[0].message);
    }
}

console.log("\n--- CASOS INVÁLIDOS MONGODB ---");
for (let test of invalidMongo) {
    const result = validateNoSQL(test.q);
    if (!result.valid) {
        if (result.errors[0].message.includes(test.expectError) || (result.errors[0].suggestion && result.errors[0].suggestion.includes(test.expectError))) {
            passed++;
            console.log(`[PASS] ${test.q.substring(0, 50).replace(/\n/g, '')}...`);
        } else {
            console.log(`[FAIL] ${test.q}`);
            console.log(`   Esperado error conteniendo: ${test.expectError}`);
            console.log(`   Obtuvo: ${result.errors[0].message} / Sugerencia: ${result.errors[0].suggestion}`);
        }
    } else {
        console.log(`[FAIL] ${test.q}`);
        console.log(`   Esperado: Inválido, Obtuvo: Válido`);
    }
}

const precision = Math.round((passed / total) * 100);
console.log(`\n=== RESULTADO FINAL ===`);
console.log(`Pruebas ejecutadas: ${total}`);
console.log(`Pruebas aprobadas:  ${passed}`);
console.log(`Precisión:          ${precision}%`);

if (precision >= 90) {
    console.log("✅ Objetivo de precisión superado (>90%).");
} else {
    console.log("❌ No se alcanzó el objetivo de precisión.");
    process.exit(1);
}
