const express = require('express');
const router  = express.Router();

const {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  addAddress,
  deleteAddress,
} = require('../controllers/customer.auth.controller');

const { getMyOrders, getMyOrderById } = require('../controllers/customer.order.controller');
const { protectCustomer }             = require('../middleware/customer.auth.middleware');

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login',    login);

// ── Customer only ─────────────────────────────────────────────────────────────
router.get('/me',    protectCustomer, getMe);
router.put('/me',    protectCustomer, updateMe);
router.put('/me/change-password', protectCustomer, changePassword);

// Saved addresses
router.post('/me/addresses',               protectCustomer, addAddress);
router.delete('/me/addresses/:addressId',  protectCustomer, deleteAddress);

// Customer order history
router.get('/orders',     protectCustomer, getMyOrders);
router.get('/orders/:id', protectCustomer, getMyOrderById);

module.exports = router;