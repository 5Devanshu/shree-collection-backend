import {
  validateCartService,
  calculateTotalsService,
  createPaymentOrderService,
  checkOrderStatusService,
  confirmOrderService,
  validateWebhookService,
} from './checkout.service.js';
import {
  StandardCheckoutClient,
  Env,
} from '@phonepe-pg/pg-sdk-node';

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
export const initiateCheckout = async (req, res) => {
  try {
    const { items, email } = req.body;
    const isReseller = req.reseller != null;

    // Shipping state — read defensively across possible payload shapes
    const state =
      req.body.guestAddress?.state    ||
      req.body.shippingAddress?.state ||
      req.body.address?.state         ||
      req.body.state                  || '';

    console.log('CHECKOUT INITIATE DEBUG:', {
      isReseller,
      state,
      reseller: req.reseller,
      authHeader: req.headers.authorization?.slice(0, 30),
      itemPrices: items?.map(i => ({ title: i.title, price: i.price })),
    });

    // Step 1 — Validate cart items server-side
    const validatedItems = await validateCartService(items, isReseller);

    // Step 2 — Calculate totals (delivery charge applied here, authoritatively)
    const { subtotal, shippingCost, total } =
      calculateTotalsService(validatedItems, { isReseller, state });

    // Step 3 — Create PhonePe payment order
    const { checkoutUrl, merchantOrderId, phonePeOrderId } =
      await createPaymentOrderService(total, email);

    res.status(200).json({
      success: true,
      checkoutUrl,
      merchantOrderId,
      phonePeOrderId,
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
export const confirmCheckout = async (req, res) => {
  try {
    const {
      merchantOrderId,
      email,
      shippingAddress,
      validatedItems,
    } = req.body;

    // Guard — reject malformed confirms so blank/null-email orders can't be created
    if (!email || !merchantOrderId || !Array.isArray(validatedItems) || validatedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing order details.' });
    }

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

    const phonePeTransactionId =
      statusResult.paymentDetails?.[0]?.transactionId || merchantOrderId;

    // ── Authoritative totals ──────────────────────────────────────────────────
    // Source of truth = amount PhonePe actually captured + server-validated prices.
    // Client-sent money fields are ignored. Delivery charge = captured − subtotal.
    const lineItems = validatedItems || [];
    const subtotal  = lineItems.length
      ? lineItems.reduce((sum, i) => sum + Number(i.price) * (i.quantity || 1), 0)
      : Number(req.body.subtotal) || 0;

    const total        = Number(statusResult.amount) / 100;          // paise → rupees
    const shippingCost = Math.max(0, Number((total - subtotal).toFixed(2)));

    // Step 5 — Create confirmed order in Postgres
    const order = await confirmOrderService({
      email,
      shippingAddress,
      validatedItems,
      subtotal,
      shippingCost,
      total,
      merchantOrderId,
      phonePeTransactionId,
      resellerId: req.reseller?.id ?? null,
      customerId: req.customer?.id ?? null,
    });

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── GET /api/checkout/status/:merchantOrderId ────────────────────────────────
export const getPaymentStatus = async (req, res) => {
  try {
    const { merchantOrderId } = req.params;
    const statusResult = await checkOrderStatusService(merchantOrderId);

    res.status(200).json({
      success: true,
      state:           statusResult.state,
      merchantOrderId: statusResult.merchantOrderId,
      amount:          statusResult.amount / 100,
      paymentDetails:  statusResult.paymentDetails,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── POST /api/checkout/webhook ───────────────────────────────────────────────
export const handleWebhook = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const bodyString = JSON.stringify(req.body);

    const client = getClient();

    const callbackResponse = validateWebhookService(
      client,
      process.env.PHONEPE_WEBHOOK_USERNAME,
      process.env.PHONEPE_WEBHOOK_PASSWORD,
      authHeader,
      bodyString
    );

    const event           = callbackResponse.event;
    const state           = callbackResponse.payload?.state;
    const merchantOrderId = callbackResponse.payload?.merchantOrderId;

    if (event === 'checkout.order.completed' && state === 'COMPLETED') {
      console.log(`✅ PhonePe payment completed for order: ${merchantOrderId}`);
    }

    if (event === 'checkout.order.failed') {
      console.warn(`❌ PhonePe payment failed for order: ${merchantOrderId}`);
    }

    if (event === 'pg.refund.completed') {
      console.log(`💸 Refund completed for order: ${merchantOrderId}`);
    }

    if (event === 'pg.refund.failed') {
      console.warn(`⚠️ Refund failed for order: ${merchantOrderId}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};