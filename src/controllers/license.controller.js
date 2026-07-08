const { getPool } = require('../config/db');
const { getUserLicenses } = require('../helpers/license.helper');

async function getMyLicenses(req, res) {
  try {
    res.json({ success: true, licenses: await getUserLicenses(req.userId) });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

async function getAdminLicenses(req, res) {
  try {
    const pool = getPool();
    const now = Date.now();
    const [rows] = await pool.execute(`
      SELECT ul.id, ul.user_id, ul.product_id, ul.expiration_date,
             u.username, u.nombre, u.apellido,
             p.name as product_name, p.slug as product_slug
      FROM user_licenses ul
      JOIN users u ON u.id = ul.user_id
      JOIN products p ON p.id = ul.product_id
      ORDER BY ul.created_at DESC
    `);
    const licenses = rows.map(l => ({
      ...l,
      expiration_date: Number(l.expiration_date),
      daysLeft: Math.ceil((Number(l.expiration_date) - now) / (1000 * 60 * 60 * 24)),
      valid: Number(l.expiration_date) > now
    }));
    res.json({ success: true, licenses });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

async function assignLicense(req, res) {
  const { userId, productId, expirationDate } = req.body;
  if (!userId || !productId || !expirationDate) return res.status(400).json({ error: 'Faltan datos.' });
  try {
    const pool = getPool();
    await pool.execute(
      'INSERT INTO user_licenses (user_id, product_id, expiration_date) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE expiration_date = ?',
      [userId, productId, expirationDate, expirationDate]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

async function updateLicense(req, res) {
  const { expirationDate } = req.body;
  if (!expirationDate) return res.status(400).json({ error: 'Faltan datos.' });
  try {
    const pool = getPool();
    await pool.execute('UPDATE user_licenses SET expiration_date = ? WHERE id = ?', [expirationDate, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

async function revokeLicense(req, res) {
  try {
    const pool = getPool();
    await pool.execute('DELETE FROM user_licenses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

module.exports = {
  getMyLicenses,
  getAdminLicenses,
  assignLicense,
  updateLicense,
  revokeLicense
};
