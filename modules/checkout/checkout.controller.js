import * as checkoutService from './checkout.service.js';

// ─── POST /api/checkout/initiate ─────────────────────────────────────────────
// Called when user clicks "Complete Order" on Checkout.jsx.
// Validates cart, calculates totals, creates Razorpay payment order.
// Returns: razorpayOrderId + amount for frontend to open payment modal.
export const initiateCheckout = async (req, res) => {
  try {
    const { items } = req.body;

    // Step 1 — Validate all cart items server-side
    const validatedItems = await checkoutService.validateCartService(items);

    // Step 2 — Calculate totals (subtotal, shipping, total)
    const { subtotal, shippingCost, total } = checkoutService.calculateTotalsService(validatedItems);

    // Step 3 — Create Razorpay payment order
    const paymentOrder = await checkoutService.createPaymentOrderService(total);

    res.status(200).json({
      success: true,
      razorpayOrderId: paymentOrder.id,
      amount:          paymentOrder.amount,
      currency:        paymentOrder.currency,
      subtotal,
      shippingCost,
      total,
      validatedItems,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── POST /api/checkout/confirm ───────────────────────────────────────────────
// Called after Razorpay payment modal succeeds on the frontend.
// Verifies signature, places the order, sends confirmation email.
// Returns: created order record.
export const confirmCheckout = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      email,
      shippingAddress,
      validatedItems,
      subtotal,
      shippingCost,
      total,
    } = req.body;

    // Step 4 — Verify Razorpay signature (prevents forged payment confirmations)
    checkoutService.verifyPaymentSignatureService({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    // Step 5 — Create confirmed order in database
    const order = await checkoutService.confirmOrderService({
      email,
      shippingAddress,
      validatedItems,
      subtotal,
      shippingCost,
      total,
      razorpayOrderId,
      razorpayPaymentId,
    });

    // Step 6 — Send confirmation email to customer
    await checkoutService.sendOrderConfirmationService({
      email,
      orderNumber: order.orderNumber,
      total,
      items:       validatedItems,
    });

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── POST /api/checkout/webhook ───────────────────────────────────────────────
// Razorpay webhook for payment failure or refund events.
// Fallback safety net for payment events that miss the confirm flow.
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body      = JSON.stringify(req.body);

    const expected = require('crypto')
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expected) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const { event, payload } = req.body;

    if (event === 'payment.failed') {
      console.warn('Payment failed for order:', payload.payment.entity.order_id);
      // Optionally: mark order as cancelled or notify admin
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};