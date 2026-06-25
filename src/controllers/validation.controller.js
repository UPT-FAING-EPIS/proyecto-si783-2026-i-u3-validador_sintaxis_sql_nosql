/**
 * validation.controller.js
 * Controlador - Orquestación de peticiones HTTP.
 */

const { validateQueryAuto, validateSQL, validateNoSQL } = require('../services/validation.service');
const { SQLParser } = require('../services/validator/sql/parser');
const { MongoParser } = require('../services/validator/nosql/parser');
const db = require('../config/db.config');
const { getClientIP } = require('../utils/ip.util');
const fs = require('fs');
const readline = require('readline');

async function validateQuery(req, res, next) {
  try {
    const { query, type } = req.body;

    if (query === undefined || query === null || typeof query !== 'string' || query.trim() === '') {
      return res.json({
         valid: false,
         type: 'unknown',
         errors: [{ line: 1, column: 1, message: 'La consulta está vacía o es inválida.' }],
         suggestions: ['Escribe una consulta válida.']
      });
    }

    const result = validateQueryAuto(query, type);
    
    if (req.user) {
       const ipAddress = getClientIP(req);
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

async function validateFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { type } = req.body; // 'sql' or 'nosql'
    const filePath = req.file.path;
    
    // Configurar SSE (Server-Sent Events) para el progreso
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    const stats = fs.statSync(filePath);
    const totalSize = stats.size;
    let processedSize = 0;
    
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let buffer = '';
    let startLine = 1;
    let currentLine = 1;
    let errors = [];
    
    // Variables para balance de brackets en NoSQL
    let braceCount = 0;
    let bracketCount = 0;

    for await (const line of rl) {
      processedSize += Buffer.byteLength(line, 'utf8') + 1; // +1 por newline
      
      const progress = Math.round((processedSize / totalSize) * 100);
      if (progress % 5 === 0 || currentLine % 1000 === 0) {
          res.write(`data: ${JSON.stringify({ type: 'progress', percent: progress })}\n\n`);
      }
      
      buffer += line + '\n';
      
      let shouldProcess = false;
      
      if (type === 'sql') {
          // El parser SQL separa sentencias y respeta DELIMITER; procesamos al final.
          shouldProcess = false;
      } else {
          // Para NoSQL tratamos de procesar cuando se balancean llaves, o al final
          for (let char of line) {
              if (char === '{') braceCount++;
              if (char === '}') braceCount--;
              if (char === '[') bracketCount++;
              if (char === ']') bracketCount--;
          }
          if (braceCount === 0 && bracketCount === 0 && buffer.trim().length > 0) {
              // Pequeño workaround para NoSQL: a veces es mejor procesar el todo de una vez.
              // En este caso lo intentamos.
          }
      }

      if (type === 'sql' && shouldProcess) {
          const parser = new SQLParser(buffer, startLine);
          const result = parser.parse();
          if (!result.valid) {
              errors = result.errors;
              break; // Paramos en el primer error de chunk
          }
          buffer = '';
          startLine = currentLine + 1;
      }
      
      currentLine++;
    }
    
    // Procesar cualquier remanente en el buffer
    if (errors.length === 0 && buffer.trim().length > 0) {
        if (type === 'sql') {
            const parser = new SQLParser(buffer, startLine);
            const result = parser.parse();
            if (!result.valid) errors = result.errors;
        } else {
            const parser = new MongoParser(buffer, startLine);
            const result = parser.parse();
            if (!result.valid) errors = result.errors;
        }
    }
    
    // Loguear auditoria
    if (req.user) {
       const ipAddress = getClientIP(req);
       db.query(
         'INSERT INTO audit_logs (usuario, accion, detalles, ip) VALUES ($1, $2, $3, $4)',
         [req.user.email, 'VALIDATION', `Validación Archivo Grande ${type} - ${errors.length === 0 ? 'Exitosa' : 'Fallida'}`, ipAddress]
       ).catch(err => console.error('Error logging file validation:', err));
    }
    
    fs.unlinkSync(filePath); // Limpiar archivo
    
    const finalResult = {
        valid: errors.length === 0,
        dialect: type === 'sql' ? 'SQL' : 'MongoDB',
        errors: errors,
        suggestions: errors.length > 0 ? [errors[0].suggestion] : ['Sintaxis correcta.']
    };
    
    res.write(`data: ${JSON.stringify({ type: 'result', data: finalResult })}\n\n`);
    res.end();

  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
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
  validateFile,
  healthCheck,
  getExamples
};
