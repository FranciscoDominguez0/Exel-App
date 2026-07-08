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

async function getCatalog(req, res) {
  try {
    const pool = getPool();
    const userId = req.userId;
    
    // Get all active products
    const [products] = await pool.execute('SELECT * FROM products WHERE active = 1 ORDER BY name');
    
    // Get user's current licenses
    const [licenses] = await pool.execute('SELECT product_id FROM user_licenses WHERE user_id = ? AND expiration_date > ?', [userId, Date.now()]);
    const licensedProductIds = new Set(licenses.map(l => l.product_id));

    // Get user's pending requests
    const [requests] = await pool.execute('SELECT product_id FROM tool_requests WHERE user_id = ? AND status = "pending"', [userId]);
    const requestedProductIds = new Set(requests.map(r => r.product_id));

    const catalog = products.map(p => ({
      ...p,
      hasAccess: licensedProductIds.has(p.id),
      isRequested: requestedProductIds.has(p.id)
    }));

    res.json({ success: true, catalog });
  } catch (e) { res.status(500).json({ error: 'Database error' }); }
}

async function requestProduct(req, res) {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Product ID requerido.' });
  
  try {
    const pool = getPool();
    const userId = req.userId;
    
    // Check if already requested or licensed
    const [existing] = await pool.execute('SELECT id FROM tool_requests WHERE user_id = ? AND product_id = ? AND status = "pending"', [userId, productId]);
    if (existing.length > 0) return res.status(400).json({ error: 'Ya has solicitado esta herramienta.' });
    
    await pool.execute('INSERT INTO tool_requests (user_id, product_id) VALUES (?, ?)', [userId, productId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
}

module.exports = {
  getPublicProducts,
  getAdminProducts,
  createProduct,
  updateProductActive,
  deleteProduct,
  getCatalog,
  requestProduct
};
