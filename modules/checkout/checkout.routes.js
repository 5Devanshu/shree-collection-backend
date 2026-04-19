import express from 'express';
import {
  initiateCheckout,
  confirmCheckout,
  handleWebhook,
} from './checkout.controller.js';

const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

// Step 1 — Validate cart + create Razorpay order
// Triggered by: Checkout.jsx "Complete Order" button onSubmit
router.post('/initiate', initiateCheckout);

// Step 2 — Verify payment + place order + send email
// Triggered by: Razorpay modal success callback on frontend
router.post('/confirm', confirmCheckout);

// Step 3 — Razorpay webhook (payment.failed / payment.captured events)
// Raw body required for signature verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

export default router;