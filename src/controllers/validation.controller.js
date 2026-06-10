/**
 * validation.controller.js
 * Controlador - Orquestación de peticiones HTTP.
 */

const { validateQueryAuto } = require('../services/validation.service');
const db = require('../config/db.config');

async function validateQuery(req, res, next) {
  try {
    const { query } = req.body;

    if (query === undefined || query === null || typeof query !== 'string' || query.trim() === '') {
      return res.json({
         valid: false,
         type: 'unknown',
         errors: [{ line: 1, column: 1, message: 'La consulta está vacía o es inválida.' }],
         suggestions: ['Escribe una consulta válida.']
      });
    }

    const result = validateQueryAuto(query);
    
    if (req.user) {
       const ipAddress = req.ip || req.connection.remoteAddress;
       const dialect = result.dialect || 'unknown';
       db.query(
         'INSERT INTO audit_logs (usuario, accion, detalles, ip) VALUES ($1, $2, $3, $4)',
         [req.user.email, 'VALIDATION', `Validación ${dialect} - ${result.valid ? 'Exitosa' : 'Fallida'}`, ipAddress]
       ).catch(err => console.error('Error logging validation:', err));
    }

    return res.json(result);

  } catch (err) {
    next(err);
  }
}

function healthCheck(req, res) {
  res.json({
    status: 'ok',
    message: 'SQL/NoSQL Validator API funcionando correctamente.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
}

function getExamples(req, res) {
  res.json({
    sql: [
      {
        label: 'SELECT básico',
        query: 'SELECT * FROM usuarios WHERE edad > 18 ORDER BY nombre ASC;'
      },
      {
        label: 'SELECT con JOIN',
        query: `SELECT u.nombre, p.descripcion
FROM usuarios u
INNER JOIN pedidos p ON u.id = p.usuario_id
WHERE u.activo = 1;`
      },
      {
        label: 'CTE y Funciones de Ventana (PostgreSQL/SQL Server)',
        query: `WITH VentasCTE AS (
  SELECT empleado_id, SUM(monto) AS total_ventas
  FROM ventas
  GROUP BY empleado_id
)
SELECT empleado_id, total_ventas,
       RANK() OVER (ORDER BY total_ventas DESC) as rango
FROM VentasCTE;`
      },
      {
        label: 'INSERT',
        query: `INSERT INTO productos (nombre, precio, stock)
VALUES ('Laptop', 1299.99, 50);`
      },
      {
        label: 'PostgreSQL - JSONB / UUID / RETURNING',
        query: `UPDATE usuarios
SET metadata = '{"theme": "dark"}'::JSONB
WHERE id = '550e8400-e29b-41d4-a716-446655440000'::UUID
RETURNING id, nombre;`
      },
      {
        label: 'SQL Server - UNIQUEIDENTIFIER / TOP',
        query: `SELECT TOP 10 id, nombre
FROM clientes WITH (NOLOCK)
WHERE id = NEWID();`
      },
      {
        label: 'Oracle - ROWNUM y TO_DATE',
        query: `SELECT nombre, fecha_registro
FROM empleados
WHERE ROWNUM <= 10 AND fecha_registro > TO_DATE('2023-01-01', 'YYYY-MM-DD');`
      },
      {
        label: 'SQL con error estructural',
        query: 'SELECT nombre FORM usuarios;'
      }
    ],
    nosql: [
      {
        label: 'find() básico',
        query: `db.usuarios.find({ activo: true })`
      },
      {
        label: 'find() con operadores de comparación',
        query: `db.productos.find({
  precio: { $gte: 100, $lte: 500 },
  categoria: { $in: ['electrónica', 'hogar'] }
})`
      },
      {
        label: 'insertOne()',
        query: `db.clientes.insertOne({
  nombre: "María García",
  email: "maria@example.com",
  edad: 28,
  ciudad: "Madrid"
})`
      },
      {
        label: 'updateOne() con $set y $inc',
        query: `db.usuarios.updateOne(
  { _id: ObjectId("64abc123") },
  {
    $set: { activo: false, fecha_baja: new Date() },
    $inc: { intentos_login: 1 }
  }
)`
      },
      {
        label: 'aggregate() pipeline',
        query: `db.ventas.aggregate([
  { $match: { anio: 2024 } },
  { $group: { _id: "$categoria", total: { $sum: "$monto" } } },
  { $sort: { total: -1 } },
  { $limit: 10 }
])`
      },
      {
        label: 'Error de Sintaxis (Comando inválido)',
        query: `db.usuarios.selectData({ activo: true })`
      },
      {
        label: 'Error de Sintaxis (Operador inválido)',
        query: `db.posts.find({ vistas: { $mayorQue: 100 } })`
      }
    ]
  });
}

module.exports = {
  validateQuery,
  healthCheck,
  getExamples
};
