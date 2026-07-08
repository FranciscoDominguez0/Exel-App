const { getPool } = require('../config/db');

async function requireAuth(req, res, next) {
  const username = req.headers['x-username'];
  if (!username) return res.status(401).json({ error: 'No autenticado' });
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT id, role FROM users WHERE username = ?', [username]);
    if (!rows.length) return res.status(401).json({ error: 'Usuario no válido' });
    req.userId = rows[0].id;
    req.userRole = rows[0].role;
    next();
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
}

async function requireAdmin(req, res, next) {
  const username = req.headers['x-username'];
  if (!username) return res.status(403).json({ error: 'No autorizado' });
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT id, role FROM users WHERE username = ?', [username]);
    if (!rows.length || rows[0].role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    req.adminId = rows[0].id;
    next();
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
}

module.exports = {
  requireAuth,
  requireAdmin
};
