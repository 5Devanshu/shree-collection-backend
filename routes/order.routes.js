const express = require('express');
const router  = express.Router();

const {
  getOrders,
  getOrderById,
  createOrder,
  createDemoOrder,
  verifyPayment,
  cashfreeWebhook,
  updateOrderStatus,
  getOrderStats,
} = require('../controllers/order.controller');

const { protect } = require('../middleware/auth.middleware');

// ── Public ────────────────────────────────────────────────────────────────────

// Cashfree calls this directly — must be public and before protect middleware
router.post('/cashfree-webhook', cashfreeWebhook);

// Demo order (no payment gateway)
router.post('/demo', createDemoOrder);

// Customer places order (with payment gateway)
router.post('/', createOrder);

// Customer verifies payment after Cashfree redirect
router.post('/:id/verify-payment', verifyPayment);

// ── Admin only ────────────────────────────────────────────────────────────────
router.get('/stats',   protect, getOrderStats);
router.get('/',        protect, getOrders);
router.get('/:id',     protect, getOrderById);
router.put('/:id/status', protect, updateOrderStatus);

module.exports = router;