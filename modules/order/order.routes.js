import express from 'express';
import {
  createOrder,
  createDemoOrder,
  getAllOrders,
  getMyOrders,
  getMyOrdersCustomer,
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
import { protectReseller } from '../reseller/reseller.middleware.js';
import { protectCustomer } from '../customer/customer.middleware.js';

const router = express.Router();

// ─── Payment Routes ──────────────────────────────────────────────
// ⚠️ MUST BE BEFORE /:id routes to avoid route matching conflicts
// PhonePe webhook callback (payment gateway → backend)
router.post('/payment/callback', paymentCallback);

// ─── Admin Protected Routes ──────────────────────────────────────
// ⚠️ MUST BE BEFORE /:id routes to avoid route matching conflicts
// AdminDashboard — Total Revenue + Total Orders stat cards
router.get('/stats',   protect, getOrderStats);

// AdminDashboard — Recent Orders Overview table
router.get('/recent',  protect, getRecentOrders);

// AdminOrders — "Export CSV" button
router.get('/export',  protect, exportOrdersCSV);

// Guest checkout demo endpoint (must be before /:id routes)
router.post('/demo', createDemoOrder);

// ─── Reseller / Customer Protected Routes ─────────────────────────
// ⚠️ MUST BE BEFORE /:id routes — otherwise these get swallowed as if
// the path segment were an :id value.
// Reseller's own order history — scoped to req.reseller.id only.
router.get('/my-orders',          protectReseller, getMyOrders);
// Customer's own order history — scoped to req.customer.id only.
router.get('/my-orders-customer', protectCustomer, getMyOrdersCustomer);

// ─── Public Routes ───────────────────────────────────────────────
// Checkout.jsx "Complete Order" button
router.post('/', createOrder);

// ─── Dynamic ID Routes ───────────────────────────────────────────
// ⚠️ MUST BE AFTER specific routes like /stats, /recent, /demo, /my-orders*, /payment/callback
// Initiate PhonePe payment (frontend after order creation)
router.post('/:id/payment/initiate', initiatePayment);

// Verify payment status (frontend polling or direct check)
router.get('/:id/payment/verify', verifyPayment);

// AdminOrders — full paginated table with status filter
router.get('/',        protect, getAllOrders);

// AdminOrders — "View" button (single order detail)
router.get('/:id',     protect, getOrderById);

// AdminOrders — status badge update: pending → shipped → delivered
router.patch('/:id/status', protect, updateOrderStatus);

// AdminOrders — delete order
router.delete('/:id',  protect, deleteOrder);

export default router;