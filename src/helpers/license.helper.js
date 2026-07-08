const { getPool } = require('../config/db');

async function getUserLicenses(userId) {
  const pool = getPool();
  const now = Date.now();
  const [rows] = await pool.execute(`
    SELECT ul.id, ul.expiration_date,
           p.id as product_id, p.name as product_name,
           p.slug as product_slug, p.description as product_desc
    FROM user_licenses ul
    JOIN products p ON p.id = ul.product_id
    WHERE ul.user_id = ?
    ORDER BY p.name
  `, [userId]);

  return rows.map(l => ({
    id: l.id,
    productId: l.product_id,
    productName: l.product_name,
    productSlug: l.product_slug,
    productDesc: l.product_desc,
    expirationDate: Number(l.expiration_date),
    daysLeft: Math.ceil((Number(l.expiration_date) - now) / (1000 * 60 * 60 * 24)),
    valid: Number(l.expiration_date) > now,
  }));
}

module.exports = {
  getUserLicenses
};
