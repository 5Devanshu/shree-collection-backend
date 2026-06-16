import express      from 'express';
import optionalAuth from '../cart/cart.auth.middleware.js';
import {
  initiateCheckout,
  confirmCheckout,
  getPaymentStatus,
  handleWebhook,
} from './checkout.controller.js';

const router = express.Router();

router.post('/initiate', optionalAuth, initiateCheckout);  // ← add optionalAuth
router.post('/confirm',  confirmCheckout);
router.get('/status/:merchantOrderId', getPaymentStatus);
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

export default router;