const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db.config');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_validator_123';

const generateToken = (userId, email, role) => {
  return jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: '1d' });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }

    // Verificar si el usuario existe
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya está registrado' });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insertar usuario
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name, email, hashedPassword]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.email, user.role);

    // Registrar sesión activa
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 día
    await db.query(
      'INSERT INTO active_sessions (user_id, jwt_token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    // Marcar usuario como activo
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP, last_activity = CURRENT_TIMESTAMP, is_online = true WHERE id = $1', [user.id]);

    res.status(201).json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error del servidor al registrar usuario' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }

    // Buscar usuario
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user || !user.password_hash) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Actualizar last_login y last_activity
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP, last_activity = CURRENT_TIMESTAMP, is_online = true WHERE id = $1', [user.id]);

    // Registrar login history
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    await db.query(
      'INSERT INTO login_history (user_id, ip_address, user_agent, access_method) VALUES ($1, $2, $3, $4)',
      [user.id, ipAddress, userAgent, 'local']
    );

    const token = generateToken(user.id, user.email, user.role);

    // Registrar sesión activa
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.query(
      'INSERT INTO active_sessions (user_id, jwt_token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error del servidor al iniciar sesión' });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await db.query('DELETE FROM active_sessions WHERE jwt_token = $1', [token]);
    }
    // Marcar usuario como inactivo
    if (req.user && req.user.id) {
      await db.query("UPDATE users SET is_online = false WHERE id = $1", [req.user.id]);
    }
    res.json({ message: 'Sesión cerrada exitosamente' });
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    res.status(500).json({ error: 'Error del servidor al cerrar sesión' });
  }
};

const getOnlineUsers = async (req, res) => {
  try {
    // El middleware de actividad ya actualiza last_activity en cada request del usuario actual
    const result = await db.query(`
      SELECT id, name as username
      FROM users
      WHERE is_online = true
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching online users:', err);
    res.status(500).json({ error: 'Error fetching online users' });
  }
};

module.exports = {
  register,
  login,
  logout,
  getOnlineUsers,
  JWT_SECRET
};
