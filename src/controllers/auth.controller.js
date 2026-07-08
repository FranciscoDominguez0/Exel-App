const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');
const { getUserLicenses } = require('../helpers/license.helper');

async function register(req, res) {
  const { username, nombre, apellido, correo, password, telefono } = req.body;
  if (!username || !nombre || !apellido || !correo || !password)
    return res.status(400).json({ success: false, error: 'Todos los campos obligatorios deben completarse.' });
  try {
    const pool = getPool();
    const hash = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO users (username, nombre, apellido, correo, password, telefono) VALUES (?, ?, ?, ?, ?, ?)',
      [username.trim(), nombre.trim(), apellido.trim(), correo.trim().toLowerCase(), hash, telefono?.trim() || null]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const field = err.message.includes('correo') ? 'correo electrónico' : 'nombre de usuario';
      return res.status(409).json({ success: false, error: `El ${field} ya está registrado.` });
    }
    res.status(500).json({ success: false, error: 'Error del servidor.' });
  }
}

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos.' });
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (!rows.length) return res.status(401).json({ success: false, error: 'Credenciales incorrectas.' });
    const user = rows[0];
    if (!await bcrypt.compare(password, user.password))
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas.' });

    const licenses = await getUserLicenses(user.id);
    res.json({
      success: true,
      token: 'exel-session-token',
      user: { id: user.id, username: user.username, nombre: user.nombre, apellido: user.apellido, correo: user.correo, role: user.role, licenses }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error del servidor.' });
  }
}

module.exports = {
  register,
  login
};
