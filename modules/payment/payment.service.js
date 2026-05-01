import { StandardCheckoutClient, Env, StandardCheckoutPayRequest, MetaInfo } from '@phonepe-pg/pg-sdk-node';
import { randomUUID } from 'crypto';
import Order   from '../order/order.model.js';
import Product from '../product/product.model.js';
import { sendOrderConfirmation, sendPaymentConfirmation } from '../../services/email.service.js';

// ── PhonePe SDK singleton ─────────────────────────────────────────────────────
let _client = null;

const getClient = () => {
  if (_client) return _client;

  const clientId      = process.env.PHONEPE_CLIENT_ID      || 'M22WI0U1WRSFJ_2604272338';
  const clientSecret  = process.env.PHONEPE_CLIENT_SECRET  || 'ODliMTYxOWUtNjBkOS00NTFiLThlNzktMWI3YzI0Y2UxMWY4';
  const clientVersion = parseInt(process.env.PHONEPE_CLIENT_VERSION || '1', 10);
  const env           = (process.env.PHONEPE_ENV || 'TEST') === 'PRODUCTION'
    ? Env.PRODUCTION
    : Env.SANDBOX;

  _client = StandardCheckoutClient.getInstance(
    clientId,
    clientSecret,
    clientVersion,
    env
  );

  return _client;
};

// ── Validate cart items server-side ───────────────────────────────────────────
const validateItems = async (items) => {
  if (!items || items.length === 0) throw new Error('Cart is empty');

  const validated = [];
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) throw new Error(`Product not found: ${item.productId}`);
    if (product.stockStatus === 'out_of_stock') {
      throw new Error(`"${product.title}" is currently out of stock`);
    }
    validated.push({
      product:  product._id,
      title:    product.title,
      material: product.material || '',
      price:    product.price,
      quantity: item.quantity || 1,
      image:    product.image?.url || item.image || '',
    });
  }
  return validated;
};

// ── Calculate totals ──────────────────────────────────────────────────────────
const calculateTotals = (validatedItems) => {
  const subtotal     = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingCost = 0;
  const total        = subtotal + shippingCost;
  return { subtotal, shippingCost, total };
};

// ── INITIATE PAYMENT ──────────────────────────────────────────────────────────
// Called by: POST /api/payment/phonepe/initiate
export const initiatePhonePePaymentService = async ({
  items,
  guestEmail,
  guestPhone,
  guestName,
  guestAddress,
}) => {
  const client = getClient();

  // Validate items & calculate total
  const validatedItems              = await validateItems(items);
  const { subtotal, shippingCost, total } = calculateTotals(validatedItems);

  // PhonePe requires minimum ₹1 (100 paise)
  const amountInPaise = Math.round(total * 100);
  if (amountInPaise < 100) throw new Error('Order amount must be at least ₹1.00');

  // Merchant order ID — max 63 chars, only letters, numbers, _ and -
  const merchantOrderId = `SC_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 8)}`;

  const redirectUrl = `${process.env.CLIENT_URL || 'https://shreecollection.co.in'}/checkout/callback?merchantTransactionId=${merchantOrderId}`;

  // Meta info — stores guest details for reference
  const metaInfo = MetaInfo.builder()
    .udf1(guestEmail  || '')
    .udf2(guestPhone  || '')
    .udf3(guestName   || '')
    .build();

  // Build payment request using SDK
  const request = StandardCheckoutPayRequest.builder()
    .merchantOrderId(merchantOrderId)
    .amount(amountInPaise)
    .redirectUrl(redirectUrl)
    .metaInfo(metaInfo)
    .expireAfter(1800)  // 30 minutes
    .build();

  // Call PhonePe — returns { redirectUrl, orderId, expireAt, state }
  const response = await client.pay(request);

  return {
    merchantTransactionId: merchantOrderId,
    redirectUrl:           response.redirectUrl,
    orderId:               response.orderId,
    expireAt:              response.expireAt,
    state:                 response.state,
    validatedItems,
    subtotal,
    shippingCost,
    total,
  };
};

// ── VERIFY PAYMENT ────────────────────────────────────────────────────────────
// Called by: POST /api/payment/phonepe/confirm
export const verifyPhonePePaymentService = async (merchantTransactionId) => {
  const client   = getClient();
  const response = await client.getOrderStatus(merchantTransactionId);
  return response.state === 'COMPLETED';
};

// ── CHECK STATUS ──────────────────────────────────────────────────────────────
// Called by: GET /api/payment/phonepe/status/:merchantTransactionId
export const checkPhonePeStatusService = async (merchantTransactionId) => {
  const client   = getClient();
  const response = await client.getOrderStatus(merchantTransactionId);
  return {
    state:                 response.state,
    merchantTransactionId: response.merchantOrderId,
    amount:                response.amount,
    paymentDetails:        response.paymentDetails || [],
  };
};

// ── CREATE GUEST ORDER IN DB ──────────────────────────────────────────────────
// Called by: POST /api/payment/phonepe/confirm (after payment verified)
// ── CREATE GUEST ORDER IN DB ──────────────────────────────────────────────────
export const createGuestOrderService = async ({
  merchantTransactionId,
  transactionId,
  guestEmail,
  guestPhone,
  guestName,
  guestAddress,
  items,
  subtotal,
  shippingCost,
  total,
  paymentMethod,
}) => {
  const nameParts = (guestName || '').split(' ');

  const order = await Order.create({
    email: guestEmail,
    shippingAddress: {
      firstName:    nameParts[0] || guestName,
      lastName:     nameParts.slice(1).join(' ') || '',
      addressLine1: guestAddress?.line1        || guestAddress?.addressLine1 || '',
      addressLine2: guestAddress?.line2        || guestAddress?.addressLine2 || '',
      city:         guestAddress?.city         || '',
      postalCode:   guestAddress?.pincode      || guestAddress?.postalCode   || '',
      country:      'India',
    },

    // ✅ Map productId → product so Mongoose validation passes
    items: items.map(i => ({
      product:  i.product  || i.productId,   // ← handles both field names
      title:    i.title    || 'Product',
      material: i.material || '',
      price:    i.price    || 0,
      quantity: i.quantity || 1,
      image:    i.image    || '',
    })),

    subtotal:         subtotal     || 0,
    shippingCost:     shippingCost || 0,
    total:            total        || 0,
    paymentStatus:    'paid',
    paymentMethod:    paymentMethod || 'phonepe',
    paymentReference: transactionId || merchantTransactionId,
    status:           'pending',
  });

  return order;
};

// ── MARK PAYMENT FAILED ───────────────────────────────────────────────────────
// Called by: POST /api/payment/phonepe/callback (on failure)
export const markPaymentAsFailedService = async (merchantTransactionId) => {
  try {
    await Order.findOneAndUpdate(
      { paymentReference: merchantTransactionId },
      { paymentStatus: 'unpaid', status: 'cancelled' }
    );
  } catch (err) {
    console.error('markPaymentAsFailedService error:', err.message);
  }
};

// ── SEND CONFIRMATION EMAIL ───────────────────────────────────────────────────
// Called by: POST /api/payment/phonepe/confirm (after order created)
// ── SEND CONFIRMATION EMAIL ───────────────────────────────────────────────────
// ✅ Add subtotal and shippingCost to params
export const sendOrderConfirmationEmailService = async ({
  guestEmail,
  guestName,
  orderNumber,
  total,
  subtotal,      // ← was missing, caused "subtotal is not defined"
  shippingCost,  // ← was missing
  items,
}) => {
  try {
    await sendOrderConfirmation(
      {
        _id:         orderNumber,
        orderStatus: 'Pending',
        items: (items || []).map(i => ({
          title:     i.title     || 'Product',
          productId: i.product   || i.productId,
          qty:       i.quantity  || 1,
          price:     i.price     || 0,
        })),
        subtotal:     subtotal     || total,
        shippingCost: shippingCost || 0,
        total,
        createdAt: new Date(),
        customer: {
          name:    guestName || '',
          phone:   '',
          address: { line1:'', city:'', state:'', pincode:'' },
        },
      },
      guestEmail,
      guestName
    );
  } catch (err) {
    console.error('Order confirmation email failed (non-blocking):', err.message);
  }
};
