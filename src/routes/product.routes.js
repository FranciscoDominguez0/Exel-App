const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// Public/User routes
router.get('/catalog', requireAuth, productController.getCatalog);
router.post('/request', requireAuth, productController.requestProduct);

// Admin routes
router.get('/', requireAdmin, productController.getAdminProducts);
router.post('/', requireAdmin, productController.createProduct);
router.patch('/:id', requireAdmin, productController.updateProductActive);
router.delete('/:id', requireAdmin, productController.deleteProduct);

module.exports = router;
