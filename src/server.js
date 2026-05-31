require('dotenv').config();
const { app, server } = require('./app');
const { initDB } = require('./config/db.config');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Intentar inicializar la DB pero no detener el arranque si falla
    try {
      await initDB();
    } catch (dbErr) {
      console.error('⚠️ Advertencia: No se pudo conectar a la Base de Datos. El servidor iniciará de todos modos pero las funciones de base de datos fallarán.');
      console.error(dbErr.message);
    }
    
    server.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════╗');
      console.log('║   SQL/NoSQL Syntax Validator             ║');
      console.log('║   API Server                             ║');
      console.log('╠══════════════════════════════════════════╣');
      console.log(`║   🌐 URL: http://localhost:${PORT}           ║`);
      console.log(`║   🔧 API: http://localhost:${PORT}/api       ║`);
      console.log('╚══════════════════════════════════════════╝');
      console.log('');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;
