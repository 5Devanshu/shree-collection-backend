import {
  validateCartService,
  calculateTotalsService,
  createPaymentOrderService,
  checkOrderStatusService,
  confirmOrderService,
  sendOrderConfirmationService,
  validateWebhookService,
} from './checkout.service.js';
import {
  StandardCheckoutClient,
  Env,
} from 'phonepe-pg';

// Helper — get the singleton PhonePe client (same instance as service)
const getClient = () => {
  const env = process.env.PHONEPE_ENV === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;
  return StandardCheckoutClient.getInstance(
    process.env.PHONEPE_CLIENT_ID,
    process.env.PHONEPE_CLIENT_SECRET,
    Number(process.env.PHONEPE_CLIENT_VERSION) || 1,
    env
  );
};

// ─── POST /api/checkout/initiate ─────────────────────────────────────────────
// Called when user clicks "Complete Order" on Checkout.jsx.
// Returns: checkoutUrl (load in iframe) + merchantOrderId (store in frontend state)
export const initiateCheckout = async (req, res) => {
  try {
    const { items, email } = req.body;

    // Step 1 — Validate cart items server-side
    const validatedItems = await validateCartService(items);

    // Step 2 — Calculate totals
    const { subtotal, shippingCost, total } = calculateTotalsService(validatedItems);

    // Step 3 — Create PhonePe payment order
    const { checkoutUrl, merchantOrderId, phonePeOrderId } =
      await createPaymentOrderService(total, email);

    res.status(200).json({
      success: true,
      checkoutUrl,       // → load this in your iframe
      merchantOrderId,   // → store in React state, needed for confirm step
      phonePeOrderId,    // → optional, for your records
      amount:    total,
      currency:  'INR',
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
// Called by the frontend after PhonePe redirects to your callback page.
// Verifies payment status via Order Status API, then places the order.
export const confirmCheckout = async (req, res) => {
  try {
    const {
      merchantOrderId,
      email,
      shippingAddress,
      validatedItems,
      subtotal,
      shippingCost,
      total,
    } = req.body;

    // Step 4 — Verify payment with PhonePe Order Status API
    const statusResult = await checkOrderStatusService(merchantOrderId);

    // Only accept COMPLETED status — never trust frontend-reported success
    if (statusResult.state !== 'COMPLETED') {
      return res.status(402).json({
        success: false,
        message: `Payment not completed. Current status: ${statusResult.state}`,
        state:   statusResult.state,
      });
    }

    // Extract PhonePe transaction ID from payment details
    const phonePeTransactionId =
      statusResult.paymentDetails?.[0]?.transactionId || merchantOrderId;

    // Step 5 — Create confirmed order in MongoDB
    const order = await confirmOrderService({
      email,
      shippingAddress,
      validatedItems,
      subtotal,
      shippingCost,
      total,
      merchantOrderId,
      phonePeTransactionId,
    });

    // Step 6 — Send confirmation email
    await sendOrderConfirmationService({
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

// ─── GET /api/checkout/status/:merchantOrderId ────────────────────────────────
// Fallback endpoint — frontend polls this if webhook doesn't arrive in time
// Frontend can call this on the /checkout/callback page after PhonePe redirect
export const getPaymentStatus = async (req, res) => {
  try {
    const { merchantOrderId } = req.params;
    const statusResult = await checkOrderStatusService(merchantOrderId);

    res.status(200).json({
      success: true,
      state:           statusResult.state,        // COMPLETED | FAILED | PENDING
      merchantOrderId: statusResult.merchantOrderId,
      amount:          statusResult.amount / 100,  // convert paise → rupees
      paymentDetails:  statusResult.paymentDetails,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── POST /api/checkout/webhook ───────────────────────────────────────────────
// PhonePe server-to-server callback.
// Events: checkout.order.completed | checkout.order.failed
// pg.refund.completed | pg.refund.failed
export const handleWebhook = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const bodyString = JSON.stringify(req.body);

    const client = getClient();

    // Validates authenticity — throws if credentials don't match
    const callbackResponse = validateWebhookService(
      client,
      process.env.PHONEPE_WEBHOOK_USERNAME,
      process.env.PHONEPE_WEBHOOK_PASSWORD,
      authHeader,
      bodyString
    );

    // Use callbackResponse.event to identify the event type (NOT payload.state)
    const event           = callbackResponse.event;
    const state           = callbackResponse.payload?.state;
    const merchantOrderId = callbackResponse.payload?.merchantOrderId;

    if (event === 'checkout.order.completed' && state === 'COMPLETED') {
      // Payment succeeded — Order was already placed via /confirm
      // This webhook is a safety net to catch any orders that missed /confirm
      console.log(`✅ PhonePe payment completed for order: ${merchantOrderId}`);

      // Optional: update order paymentStatus to 'paid' if it was 'pending'
      // await Order.findOneAndUpdate(
      //   { paymentReference: merchantOrderId, paymentStatus: 'pending' },
      //   { paymentStatus: 'paid' }
      // );
    }

    if (event === 'checkout.order.failed') {
      console.warn(`❌ PhonePe payment failed for order: ${merchantOrderId}`);
      // Optional: mark order as failed, notify admin
    }

    if (event === 'pg.refund.completed') {
      console.log(`💸 Refund completed for order: ${merchantOrderId}`);
    }

    if (event === 'pg.refund.failed') {
      console.warn(`⚠️ Refund failed for order: ${merchantOrderId}`);
    }

    // PhonePe expects a 200 response — else it retries
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};