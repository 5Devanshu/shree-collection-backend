import express from 'express';
import {
  createOrder,
  createDemoOrder,
  getAllOrders,
  getRecentOrders,
  getOrderStats,
  exportOrdersCSV,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  initiatePayment,
  paymentCallback,
  verifyPayment,
} from './order.controller.js';
import protect from '../auth/auth.middleware.js';

const router = express.Router();

// ─── Public Routes ───────────────────────────────────────────────
// Checkout.jsx "Complete Order" button
router.post('/', createOrder);

// ─── Payment Routes ──────────────────────────────────────────────
// Initiate PhonePe payment (frontend after order creation)
router.post('/:id/payment/initiate', initiatePayment);

// PhonePe webhook callback (payment gateway → backend)
router.post('/payment/callback', paymentCallback);

// Verify payment status (frontend polling or direct check)
router.get('/:id/payment/verify', verifyPayment);

// ─── Admin Protected Routes ──────────────────────────────────────
// AdminDashboard — Total Revenue + Total Orders stat cards
router.get('/stats',   protect, getOrderStats);

// AdminDashboard — Recent Orders Overview table
router.get('/recent',  protect, getRecentOrders);

// AdminOrders — "Export CSV" button
router.get('/export',  protect, exportOrdersCSV);

// Guest checkout demo endpoint (must be before /:id routes)
router.post('/demo', createDemoOrder);

// AdminOrders — full paginated table with status filter
router.get('/',        protect, getAllOrders);

// AdminOrders — "View" button (single order detail)
router.get('/:id',     protect, getOrderById);

// AdminOrders — status badge update: pending → shipped → delivered
router.patch('/:id/status', protect, updateOrderStatus);

// AdminOrders — delete order
router.delete('/:id',  protect, deleteOrder);

export default router;