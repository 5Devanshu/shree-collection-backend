import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
} from '@phonepe-pg/pg-sdk-node';
import crypto from 'crypto';
import Order   from '../order/order.model.js';
import Product from '../product/product.model.js';

// ─── PhonePe Client (singleton) ───────────────────────────────────────────────
// StandardCheckoutClient throws PhonePeException if instantiated more than once
let phonePeClient;

const getPhonePeClient = () => {
  if (!phonePeClient) {
    const env = process.env.PHONEPE_ENV === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

    phonePeClient = StandardCheckoutClient.getInstance(
      process.env.PHONEPE_CLIENT_ID,
      process.env.PHONEPE_CLIENT_SECRET,
      Number(process.env.PHONEPE_CLIENT_VERSION) || 1,
      env
    );
  }
  return phonePeClient;
};

// ─── Step 1: Validate Cart ────────────────────────────────────────────────────
// Server-side validation of every cart item sent from Checkout.jsx
// Checks: product exists, not out of stock, price not tampered
export const validateCartService = async (items) => {
  if (!items || items.length === 0) {
    throw new Error('Cart is empty');
  }

  const validated = [];

  for (const item of items) {
    const product = await Product.findById(item.productId).populate('category', 'name');

    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    if (product.stockStatus === 'out_of_stock') {
      throw new Error(`"${product.title}" is currently out of stock`);
    }

    // Prevents frontend price tampering
    if (product.price !== item.price) {
      throw new Error(
        `Price mismatch for "${product.title}". Please refresh and try again.`
      );
    }

    validated.push({
      product:  product._id,
      title:    product.title,
      material: product.material,
      price:    product.price,
      quantity: item.quantity || 1,
      image:    product.image?.url || '',
    });
  }

  return validated;
};

// ─── Step 2: Calculate Totals ─────────────────────────────────────────────────
// Maps to Checkout.jsx Order Summary: Subtotal, Shipping, Total rows
export const calculateTotalsService = (validatedItems) => {
  const subtotal     = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingCost = 0;   // Complimentary Express Shipping
  const total        = subtotal + shippingCost;
  return { subtotal, shippingCost, total };
};

// ─── Step 3: Create PhonePe Payment Order ────────────────────────────────────
// Builds a StandardCheckoutPayRequest and calls client.pay()
// Returns: { checkoutUrl, merchantOrderId }
// The checkoutUrl is loaded in the iframe on your frontend
export const createPaymentOrderService = async (total, email) => {
  const client = getPhonePeClient();

  // Unique merchant order ID for this transaction
  const merchantOrderId = `SC_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  // Amount in paise (PhonePe requires integer paise, same as Razorpay)
  const amountInPaise = Math.round(total * 100);

  // Redirect URL — PhonePe will send the customer here after payment
  const redirectUrl = `${process.env.FRONTEND_URL}/checkout/callback?merchantOrderId=${merchantOrderId}`;

  const request = StandardCheckoutPayRequest.builder()
    .merchantOrderId(merchantOrderId)
    .amount(amountInPaise)
    .redirectUrl(redirectUrl)
    // Optional: pass expiry (seconds), default is 20 minutes
    // .expireAfter(1200)
    // Optional: pass user-defined fields received back in webhook/status
    .metaInfo({
      udf1: email,
      udf2: 'shree-collection',
    })
    .build();

  const response = await client.pay(request);

  // response.redirectUrl  → PhonePe hosted checkout page URL (use in iframe)
  // response.orderId      → PhonePe internal order id (for reference)
  return {
    checkoutUrl:     response.redirectUrl,
    merchantOrderId,
    phonePeOrderId:  response.orderId,
  };
};

// ─── Step 4: Check Order Payment Status ──────────────────────────────────────
// Use this to manually verify payment when webhook is missed or as a fallback
// Always rely on payload.state (root-level) for the final status
export const checkOrderStatusService = async (merchantOrderId) => {
  const client   = getPhonePeClient();
  const response = await client.getOrderStatus(merchantOrderId);

  // response.state: COMPLETED | FAILED | PENDING
  return {
    state:           response.state,
    merchantOrderId: response.merchantOrderId,
    amount:          response.amount,          // in paise
    paymentDetails:  response.paymentDetails,  // array of payment attempt details
  };
};

// ─── Step 5: Confirm & Place Order in DB ─────────────────────────────────────
// Called after PhonePe confirms payment (via webhook or status poll)
// Creates the Order document in MongoDB — same schema as your existing orders
export const confirmOrderService = async ({
  email,
  shippingAddress,
  validatedItems,
  subtotal,
  shippingCost,
  total,
  merchantOrderId,
  phonePeTransactionId,
}) => {
  const order = await Order.create({
    email,
    shippingAddress,
    items:            validatedItems,
    subtotal,
    shippingCost,
    total,
    paymentStatus:    'paid',
    paymentMethod:    'phonepe',
    paymentReference: phonePeTransactionId || merchantOrderId,
    status:           'pending',
  });

  return order;
};

// ─── Step 6: Send Order Confirmation Email ────────────────────────────────────
// Reuses your existing email.service.js — no changes needed there
export { sendOrderConfirmation } from '../../services/email.service.js';

// ─── Webhook: Validate PhonePe Callback ──────────────────────────────────────
// PhonePe sends a server-to-server POST to /api/checkout/webhook
// Use validateCallback() to verify authenticity before processing
export const validateWebhookService = (client, username, password, authHeader, body) => {
  // Returns a CallbackResponse with: event, state, merchantOrderId, paymentDetails
  return client.validateCallback(username, password, authHeader, body);
};