import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
} from '@phonepe-pg/pg-sdk-node';
import Order   from '../order/order.model.js';
import Product from '../product/product.model.js';
import { decrementStockForItems } from '../order/order.service.js';
import { sendOrderConfirmationEmail } from '../../services/brevo.service.js';
import Cart from '../cart/cart.model.js';
import { findSizeEntry, resolveSizePrice, resolveSizeImage, resolveSizeColor } from '../product/product.service.js';

// ─── PhonePe Client (singleton) ───────────────────────────────────────────────
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

// ─── Helper: authoritative delivery charge ────────────────────────────────────
// Customer: FREE at ₹500+, else ₹70 (Maharashtra) / ₹90 (other state)
// Reseller: ALWAYS charged ₹70 (Maharashtra) / ₹90 (other state) — no free threshold
const FREE_DELIVERY_THRESHOLD = { customer: 500, reseller: Infinity };
const DELIVERY_CHARGE         = { maharashtra: 70, other: 90 };

export const calculateDeliveryCharge = ({ subtotal, isReseller = false, state = '' }) => {
  const threshold = isReseller ? FREE_DELIVERY_THRESHOLD.reseller : FREE_DELIVERY_THRESHOLD.customer;
  if (Number(subtotal) >= threshold) return 0;
  const isMaharashtra = String(state || '').trim().toLowerCase() === 'maharashtra';
  return isMaharashtra ? DELIVERY_CHARGE.maharashtra : DELIVERY_CHARGE.other;
};

// ─── Step 1: Validate Cart ────────────────────────────────────────────────────
export const validateCartService = async (items, isReseller = false) => {
  if (!items || items.length === 0) throw new Error('Cart is empty');

  const validated = [];

  for (const item of items) {
    const product = await Product.findByPk(item.productId);

    if (!product) throw new Error(`Product not found: ${item.productId}`);
    if (product.stockStatus === 'out_of_stock') {
      throw new Error(`"${product.title}" is currently out of stock`);
    }

    // ── Size validation ──────────────────────────────────────────────────
    let sizeEntry = null;
    if (product.sizeEnabled) {
      if (item.size === undefined || item.size === null || item.size === '') {
        throw new Error(`Please select a size for "${product.title}"`);
      }
      sizeEntry = findSizeEntry(product, item.size);
      if (!sizeEntry) {
        throw new Error(`"${product.title}" is not available in the selected size`);
      }
      if ((sizeEntry.stock || 0) < (item.quantity || 1)) {
        throw new Error(`"${product.title}" (size ${item.size}) doesn't have enough stock`);
      }
    }

    const expectedPrice = resolveSizePrice(product, sizeEntry, isReseller);

    if (Number(item.price) !== expectedPrice) {
      throw new Error(`Price mismatch for "${product.title}". Please refresh and try again.`);
    }

    // ── Image/colour — size-specific override beats the base product ──────
    const resolvedImage = product.sizeEnabled ? resolveSizeImage(product, sizeEntry) : (product.imageUrl || '');
    const resolvedColor = product.sizeEnabled ? resolveSizeColor(product, sizeEntry) : (product.colour || '');

    validated.push({
      productId: product.id,
      size:      product.sizeEnabled ? Number(item.size) : null,
      title:     product.title,
      material:  product.material,
      price:     expectedPrice,
      quantity:  item.quantity || 1,
      image:     resolvedImage,
      color:     resolvedColor,
    });
  }

  return validated;
};

// ─── Step 2: Calculate Totals ─────────────────────────────────────────────────
// NOTE: caller MUST pass { isReseller, state } or every sub-threshold customer
// defaults to ₹90 and resellers get treated as customers.
export const calculateTotalsService = (validatedItems, { isReseller = false, state = '' } = {}) => {
  const subtotal     = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingCost = calculateDeliveryCharge({ subtotal, isReseller, state });
  const total        = subtotal + shippingCost;
  return { subtotal, shippingCost, total };
};

// ─── Step 3: Create PhonePe Payment Order ────────────────────────────────────
export const createPaymentOrderService = async (total, email) => {
  const client = getPhonePeClient();

  const merchantOrderId = `SC_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const amountInPaise   = Math.round(total * 100);
  const redirectUrl     = `${process.env.FRONTEND_URL}/checkout/callback?merchantOrderId=${merchantOrderId}`;

  const request = StandardCheckoutPayRequest.builder()
    .merchantOrderId(merchantOrderId)
    .amount(amountInPaise)
    .redirectUrl(redirectUrl)
    .metaInfo({ udf1: email, udf2: 'shree-collection' })
    .build();

  const response = await client.pay(request);

  return {
    checkoutUrl:    response.redirectUrl,
    merchantOrderId,
    phonePeOrderId: response.orderId,
  };
};

// ─── Step 4: Check Order Payment Status ──────────────────────────────────────
export const checkOrderStatusService = async (merchantOrderId) => {
  const client   = getPhonePeClient();
  const response = await client.getOrderStatus(merchantOrderId);
  return {
    state:           response.state,
    merchantOrderId: response.merchantOrderId,
    amount:          response.amount,
    paymentDetails:  response.paymentDetails,
  };
};

// ─── Step 5: Confirm & Place Order in DB ─────────────────────────────────────
export const confirmOrderService = async ({
  email,
  shippingAddress,
  validatedItems,
  subtotal,
  shippingCost,
  total,
  merchantOrderId,
  phonePeTransactionId,
  resellerId = null,
  customerId = null,
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
    resellerId,
    customerId,
  });

  await decrementStockForItems(validatedItems);

  if (customerId) {
    await Cart.destroy({ where: { customerId } });
  } else if (resellerId) {
    await Cart.destroy({ where: { resellerId } });
  }

  const name = shippingAddress?.name || 'Customer';
  await sendOrderConfirmationEmail(order.email, {
    orderNumber: order.orderNumber,
    name,
    items: validatedItems,
    total: order.total,
  });

  return order;
};

// ─── Webhook: Validate PhonePe Callback ──────────────────────────────────────
export const validateWebhookService = (client, username, password, authHeader, body) => {
  return client.validateCallback(username, password, authHeader, body);
};