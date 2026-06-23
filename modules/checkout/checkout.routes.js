import express      from 'express';
import optionalAuth from '../cart/cart.auth.middleware.js';
import {
  initiateCheckout,
  confirmCheckout,
  getPaymentStatus,
  handleWebhook,
} from './checkout.controller.js';

const router = express.Router();

router.post('/initiate', optionalAuth, initiateCheckout);
router.post('/confirm',  optionalAuth, confirmCheckout);   // ← add optionalAuth
router.get('/status/:merchantOrderId', getPaymentStatus);
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

export default router;