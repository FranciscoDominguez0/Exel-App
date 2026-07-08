const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { requireAdmin } = require('../middlewares/auth');

router.get('/', requireAdmin, productController.getAdminProducts);
router.post('/', requireAdmin, productController.createProduct);
router.patch('/:id', requireAdmin, productController.updateProductActive);
router.delete('/:id', requireAdmin, productController.deleteProduct);

module.exports = router;
