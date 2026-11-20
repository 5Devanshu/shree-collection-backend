import express from 'express';
import {
  createPayment,
  getPaymentStatus,
  handleWebhook,
  getAdminPayments,
  getAdminPaymentSummary,
  getAdminPaymentById,
  refreshAdminPaymentStatus,
} from './customPayment.controller.js';
import protect from '../auth/auth.middleware.js';

const router = express.Router();

const attempts = new Map();
const rateLimit = (limit, windowMs) => (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.startedAt >= windowMs) {
    attempts.set(key, { startedAt: now, count: 1 });
    return next();
  }
  if (entry.count >= limit) {
    return res.status(429).json({ success: false, message: 'Too many payment requests. Please try again later.' });
  }
  entry.count += 1;
  return next();
};

router.post('/phonepe/create', rateLimit(5, 15 * 60 * 1000), createPayment);
router.get('/phonepe/status/:merchantOrderId', rateLimit(30, 15 * 60 * 1000), getPaymentStatus);
router.post('/phonepe/webhook', handleWebhook);
router.get('/admin/summary', protect, getAdminPaymentSummary);
router.get('/admin', protect, getAdminPayments);
router.get('/admin/:id', protect, getAdminPaymentById);
router.post('/admin/:merchantOrderId/refresh', protect, refreshAdminPaymentStatus);

export default router;
