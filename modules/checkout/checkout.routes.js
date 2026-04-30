import express from 'express';
import {
  initiateCheckout,
  confirmCheckout,
  handleWebhook,
  getPaymentStatus,
} from './checkout.controller.js';

const router = express.Router();

// ─── POST /api/checkout/initiate ──────────────────────────────────────────────
// Validates cart → creates PhonePe order → returns checkout URL for iframe
router.post('/initiate', initiateCheckout);

// ─── POST /api/checkout/confirm ───────────────────────────────────────────────
// Called by frontend after PhonePe redirects back — verifies & places order
router.post('/confirm', confirmCheckout);

// ─── GET /api/checkout/status/:merchantOrderId ────────────────────────────────
// Fallback — poll order payment status if webhook missed
router.get('/status/:merchantOrderId', getPaymentStatus);

// ─── POST /api/checkout/webhook ───────────────────────────────────────────────
// PhonePe server-to-server callback (checkout.order.completed / failed)
router.post('/webhook', handleWebhook);

export default router;