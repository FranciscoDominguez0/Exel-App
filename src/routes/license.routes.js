const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/license.controller');
const { requireAdmin } = require('../middlewares/auth');

router.get('/', requireAdmin, licenseController.getAdminLicenses);
router.post('/', requireAdmin, licenseController.assignLicense);
router.patch('/:id', requireAdmin, licenseController.updateLicense);
router.delete('/:id', requireAdmin, licenseController.revokeLicense);

module.exports = router;
