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

async function getStats(req, res) {
  try {
    const pool = getPool();
    const [userRows] = await pool.execute('SELECT COUNT(*) as totalUsers FROM users');
    const [prodRows] = await pool.execute('SELECT COUNT(*) as totalProducts FROM products WHERE active = 1');
    const [licRows] = await pool.execute('SELECT COUNT(*) as activeLicenses FROM user_licenses WHERE expiration_date > ?', [Date.now()]);
    
    const totalUsers = Number(userRows[0].totalUsers);
    const totalProducts = Number(prodRows[0].totalProducts);
    const activeLicenses = Number(licRows[0].activeLicenses);

    // Expiring soon (Next 30 days)
    const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
    const [expiringLicenses] = await pool.execute(`
      SELECT u.nombre, u.apellido, p.name as product_name, l.expiration_date
      FROM user_licenses l
      JOIN users u ON l.user_id = u.id
      JOIN products p ON l.product_id = p.id
      WHERE l.expiration_date > ? AND l.expiration_date <= ?
      ORDER BY l.expiration_date ASC
      LIMIT 6
    `, [Date.now(), thirtyDaysFromNow]);

    const formattedExpiring = expiringLicenses.map(l => ({
      user: `${l.nombre} ${l.apellido}`,
      product: l.product_name,
      expiration: Number(l.expiration_date)
    }));

    // Licenses by product
    const [licensesDist] = await pool.execute(`
      SELECT p.name, COUNT(l.id) as count
      FROM products p
      LEFT JOIN user_licenses l ON p.id = l.product_id AND l.expiration_date > ?
      WHERE p.active = 1
      GROUP BY p.id
    `, [Date.now()]);
    
    const formattedLicensesDist = licensesDist.map(l => ({ name: l.name, count: Number(l.count) }));
    
    res.json({ 
      success: true, 
      stats: { totalUsers, totalProducts, activeLicenses },
      expiringLicenses: formattedExpiring,
      licensesByProduct: formattedLicensesDist
    });
  } catch (e) {
    console.error('getStats Error:', e);
    res.status(500).json({ error: e.message || 'Database error', stack: e.stack }); 
  }
}

async function getRequests(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(`
      SELECT tr.id, tr.status, tr.created_at,
             u.nombre, u.apellido, u.username,
             p.name as product_name
      FROM tool_requests tr
      JOIN users u ON tr.user_id = u.id
      JOIN products p ON tr.product_id = p.id
      ORDER BY tr.created_at DESC
    `);
    res.json({ success: true, requests: rows });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

async function approveRequest(req, res) {
  try {
    const pool = getPool();
    const reqId = req.params.id;
    
    const [requestRows] = await pool.execute('SELECT user_id, product_id, status FROM tool_requests WHERE id = ?', [reqId]);
    if (requestRows.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada.' });
    
    const request = requestRows[0];
    if (request.status !== 'pending') return res.status(400).json({ error: 'La solicitud ya fue procesada.' });

    // Approve request
    await pool.execute('UPDATE tool_requests SET status = "approved" WHERE id = ?', [reqId]);

    // Assign 30-day license
    const expMs = Date.now() + (30 * 24 * 60 * 60 * 1000);
    
    await pool.execute(`
      INSERT INTO user_licenses (user_id, product_id, expiration_date)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE expiration_date = ?
    `, [request.user_id, request.product_id, expMs, expMs]);

    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

async function rejectRequest(req, res) {
  try {
    const pool = getPool();
    const reqId = req.params.id;
    await pool.execute('UPDATE tool_requests SET status = "rejected" WHERE id = ? AND status = "pending"', [reqId]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

module.exports = {
  getStats,
  getUsers,
  deleteUser,
  updateUser,
  updateUserRole,
  getRequests,
  approveRequest,
  rejectRequest
};
