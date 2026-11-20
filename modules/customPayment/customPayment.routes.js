import express from 'express';
import {
  createPayment,
  getPaymentStatus,
  handleWebhook,
} from './customPayment.controller.js';

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

export default router;
