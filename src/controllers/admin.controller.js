const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');

async function getUsers(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, username, nombre, apellido, correo, telefono, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users: rows });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

async function deleteUser(req, res) {
  try {
    const pool = getPool();
    const [self] = await pool.execute('SELECT username FROM users WHERE id = ?', [req.params.id]);
    if (self.length && self[0].username === req.headers['x-username'])
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo.' });
    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

async function updateUser(req, res) {
  const { nombre, apellido, correo, telefono, password } = req.body;
  try {
    const pool = getPool();
    let query = 'UPDATE users SET nombre = ?, apellido = ?, correo = ?, telefono = ?';
    let params = [nombre.trim(), apellido.trim(), correo.trim().toLowerCase(), telefono?.trim() || null];
    
    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hash);
    }
    
    query += ' WHERE id = ?';
    params.push(req.params.id);
    
    await pool.execute(query, params);
    res.json({ success: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El correo ya está registrado por otro usuario.' });
    res.status(500).json({ error: 'Database error' });
  }
}

async function updateUserRole(req, res) {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'Rol inválido.' });
  try {
    const pool = getPool();
    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

module.exports = {
  getUsers,
  deleteUser,
  updateUser,
  updateUserRole
};
