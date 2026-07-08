const { getPool } = require('../config/db');

async function getPublicProducts(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM products WHERE active = 1 ORDER BY id');
    res.json({ success: true, products: rows });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

async function getAdminProducts(req, res) {
  try {
    const pool = getPool();
    const [products] = await pool.execute('SELECT * FROM products ORDER BY id');
    const [counts] = await pool.execute('SELECT product_id, COUNT(*) as c FROM user_licenses GROUP BY product_id');
    const countMap = counts.reduce((acc, row) => { acc[row.product_id] = row.c; return acc; }, {});
    res.json({
      success: true,
      products: products.map(p => ({ ...p, license_count: countMap[p.id] || 0 }))
    });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

async function createProduct(req, res) {
  const { name, slug, description } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Nombre y slug requeridos.' });
  try {
    const pool = getPool();
    await pool.execute('INSERT INTO products (name, slug, description) VALUES (?, ?, ?)', [name, slug, description || null]);
    res.json({ success: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El slug ya existe.' });
    res.status(500).json({ error: 'Database error' });
  }
}

async function updateProductActive(req, res) {
  const { active } = req.body;
  try {
    const pool = getPool();
    await pool.execute('UPDATE products SET active = ? WHERE id = ?', [active ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

async function deleteProduct(req, res) {
  try {
    const pool = getPool();
    await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

module.exports = {
  getPublicProducts,
  getAdminProducts,
  createProduct,
  updateProductActive,
  deleteProduct
};
