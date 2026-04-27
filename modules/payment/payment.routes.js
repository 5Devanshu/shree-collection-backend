import express from 'express';
import {
  initiatePhonePeCheckout,
  confirmPhonePeCheckout,
  handlePhonePeCallback,
  checkPhonePeStatus,
} from './payment.controller.js';

const router = express.Router();

// ─── PhonePe Payment Routes ────────────────────────────────────────────────────

// Step 1 — Initiate PhonePe payment order
// POST /api/payment/phonepe/initiate
// Body: { items[], guestEmail, guestPhone, guestName, shippingAddress }
router.post('/phonepe/initiate', initiatePhonePeCheckout);

// Step 2 — Confirm PhonePe payment after callback
// POST /api/payment/phonepe/confirm
// Body: { merchantTransactionId, transactionId, guestEmail, shippingAddress, items[] }
router.post('/phonepe/confirm', confirmPhonePeCheckout);

// Step 3 — PhonePe callback endpoint
// POST /api/payment/phonepe/callback
router.post('/phonepe/callback', handlePhonePeCallback);

// Step 4 — Check payment status
// GET /api/payment/phonepe/status/:merchantTransactionId
router.get('/phonepe/status/:merchantTransactionId', checkPhonePeStatus);

export default router;
