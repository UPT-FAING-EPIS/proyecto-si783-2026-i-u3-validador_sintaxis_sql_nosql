require('dotenv').config();
const { app, server } = require('./app');
const { initDB } = require('./config/db.config');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    try {
      await initDB();
    } catch (dbErr) {
      console.error('[SERVER] ⚠️ No se pudo conectar a PostgreSQL. El servidor iniciará pero las funciones de BD fallarán.');
      console.error('[SERVER]', dbErr.message);
    }
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[SERVER] SQL/NoSQL Syntax Validator corriendo en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('[SERVER] Error fatal al iniciar:', err.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
