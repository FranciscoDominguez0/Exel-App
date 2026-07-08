const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id', adminController.updateUser);
router.patch('/users/:id/role', adminController.updateUserRole);
router.get('/stats', adminController.getStats);
router.get('/requests', adminController.getRequests);
router.patch('/requests/:id/approve', adminController.approveRequest);
router.patch('/requests/:id/reject', adminController.rejectRequest);

module.exports = router;
