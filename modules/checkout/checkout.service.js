import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
} from '@phonepe-pg/pg-sdk-node';
import Order           from '../order/order.model.js';
import Product         from '../product/product.model.js';
import PendingCheckout  from './pendingCheckout.model.js';
import { decrementStockForItems } from '../order/order.service.js';
import { sendOrderConfirmationEmail } from '../../services/brevo.service.js';
import Cart from '../cart/cart.model.js';
import {
  findSizeEntry, findColorVariant,
  resolveSizePrice, resolveVariantImage,
} from '../product/product.service.js';

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

    // ── Size + colour validation ─────────────────────────────────────────
    let sizeEntry    = null;
    let colorVariant = null;

    if (product.sizeEnabled) {
      if (item.size === undefined || item.size === null || item.size === '') {
        throw new Error(`Please select a size for "${product.title}"`);
      }
      sizeEntry = findSizeEntry(product, item.size);
      if (!sizeEntry) {
        throw new Error(`"${product.title}" is not available in the selected size`);
      }

      const hasColorOptions = Array.isArray(sizeEntry.colors) && sizeEntry.colors.length > 0;
      if (hasColorOptions) {
        if (!item.color) {
          throw new Error(`Please select a colour for "${product.title}" (size ${item.size})`);
        }
        colorVariant = findColorVariant(sizeEntry, item.color);
        if (!colorVariant) {
          throw new Error(`"${product.title}" is not available in the selected colour for size ${item.size}`);
        }
        if ((colorVariant.stock || 0) < (item.quantity || 1)) {
          throw new Error(`"${product.title}" (size ${item.size}, ${colorVariant.color}) doesn't have enough stock`);
        }
      } else if ((sizeEntry.stock || 0) < (item.quantity || 1)) {
        throw new Error(`"${product.title}" (size ${item.size}) doesn't have enough stock`);
      }
    }

    const expectedPrice = resolveSizePrice(product, sizeEntry, isReseller);

    if (Number(item.price) !== expectedPrice) {
      throw new Error(`Price mismatch for "${product.title}". Please refresh and try again.`);
    }

    const resolvedImage = product.sizeEnabled
      ? resolveVariantImage(product, colorVariant)
      : (product.imageUrl || '');
    const resolvedColor = colorVariant?.color || (!product.sizeEnabled ? (product.colour || '') : (item.color || ''));

    validated.push({
      productId: product.id,
      size:      product.sizeEnabled ? Number(item.size) : null,
      color:     resolvedColor || null,
      title:     product.title,
      material:  product.material,
      price:     expectedPrice,
      quantity:  item.quantity || 1,
      image:     resolvedImage,
    });
  }

  return validated;
};

// ─── Step 2: Calculate Totals ─────────────────────────────────────────────────
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

// ─── Step 3b: Snapshot the checkout attempt (safety net) ─────────────────────
// Called right after createPaymentOrderService, before redirecting the
// customer to PhonePe. Never lets a snapshot failure block checkout — the
// primary /confirm path still works without it, this is only the fallback.
export const savePendingCheckoutService = async ({
  merchantOrderId,
  email,
  shippingAddress,
  items,
  subtotal,
  shippingCost,
  total,
  resellerId = null,
  customerId = null,
  sessionId  = null,
}) => {
  try {
    await PendingCheckout.upsert({
      merchantOrderId,
      email,
      shippingAddress: shippingAddress || null,
      items,
      subtotal,
      shippingCost,
      total,
      resellerId,
      customerId,
      sessionId,
    });
  } catch (err) {
    console.error('savePendingCheckoutService error (non-blocking):', err.message);
  }
};

export const getPendingCheckoutService = async (merchantOrderId) => {
  if (!merchantOrderId) return null;
  return PendingCheckout.findOne({ where: { merchantOrderId } });
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
// Called from BOTH POST /checkout/confirm (fast path, frontend-driven) AND
// the /checkout/webhook handler (safety-net path, PhonePe-driven). Must stay
// idempotent on paymentReference since both paths can legitimately fire for
// the same payment.
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
  sessionId = null,
}) => {
  // ── Idempotency guard ──────────────────────────────────────────────────
  // confirmOrderService can legitimately run more than once for the same
  // PhonePe payment (frontend retry, callback page refresh/back-button,
  // double-invoke in React StrictMode, AND now also the webhook safety net
  // racing with /confirm). Without this check, every extra call created a
  // brand-new duplicate order for a single payment.
  // paymentReference is set to the PhonePe transaction id (or, as a
  // fallback, the merchantOrderId), so it uniquely identifies the payment.
  const paymentReference = phonePeTransactionId || merchantOrderId;
  const existingOrder = await Order.findOne({ where: { paymentReference } });
  if (existingOrder) {
    if (merchantOrderId) {
      await PendingCheckout.update(
        { consumedAt: new Date() },
        { where: { merchantOrderId, consumedAt: null } }
      );
    }
    return existingOrder;
  }

  let order;
  try {
    order = await Order.create({
      email,
      shippingAddress,
      items:            validatedItems,
      subtotal,
      shippingCost,
      total,
      paymentStatus:    'paid',
      paymentMethod:    'phonepe',
      paymentReference,
      status:           'pending',
      resellerId,
      customerId,
    });
  } catch (err) {
    // Unique constraint on paymentReference — a concurrent request (the
    // other of /confirm vs webhook) beat us to it. Return that order
    // instead of erroring out.
    if (err.name === 'SequelizeUniqueConstraintError') {
      const winner = await Order.findOne({ where: { paymentReference } });
      if (winner) return winner;
    }
    throw err;
  }

  await decrementStockForItems(validatedItems);

  // Cart is keyed by sessionId only — there is no customerId/resellerId
  // column on the carts table, so clearing must go through sessionId.
  if (sessionId) {
    await Cart.destroy({ where: { sessionId } });
  }

  if (merchantOrderId) {
    await PendingCheckout.update(
      { consumedAt: new Date() },
      { where: { merchantOrderId, consumedAt: null } }
    );
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