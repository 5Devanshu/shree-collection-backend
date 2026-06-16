import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
} from '@phonepe-pg/pg-sdk-node';
import Order   from '../order/order.model.js';
import Product from '../product/product.model.js';
import { decrementStockForItems } from '../order/order.service.js';
import { sendOrderConfirmationEmail } from '../../services/brevo.service.js';

// ─── PhonePe Client (singleton) ───────────────────────────────────────────────
let phonePeClient;

const getPhonePeClient = () => {
  if (!phonePeClient) {
    const env = process.env.PHONEPE_ENV === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;
 phonePeClient = StandardCheckoutClient.getInstance(
  process.env.PHONEPE_APP_ID,
  process.env.PHONEPE_CLIENT_SECRET,
  Number(process.env.PHONEPE_CLIENT_VERSION) || 1,
  env
);
  }
  return phonePeClient;
};

// ─── Helper: server-side authoritative price ──────────────────────────────────
// Reseller → resellerPrice (if set) · Retail → discountedPrice if active, else price
const resolvePrice = (product, isReseller) => {
  if (isReseller && Number(product.resellerPrice) > 0) return Number(product.resellerPrice);
  if (product.discountEnabled && Number(product.discountedPrice) > 0) return Number(product.discountedPrice);
  return Number(product.price);
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

    const expectedPrice = resolvePrice(product, isReseller);

    // DECIMAL comes back as a string from Postgres — compare as numbers
    if (Number(item.price) !== expectedPrice) {
      throw new Error(`Price mismatch for "${product.title}". Please refresh and try again.`);
    }

    validated.push({
      productId: product.id,
      title:     product.title,
      material:  product.material,
      price:     expectedPrice,
      quantity:  item.quantity || 1,
      image:     product.imageUrl || '',
    });
  }

  return validated;
};

// ─── Step 2: Calculate Totals ─────────────────────────────────────────────────
export const calculateTotalsService = (validatedItems) => {
  const subtotal     = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingCost = 0;   // Complimentary Express Shipping
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
    state:           response.state,   // COMPLETED | FAILED | PENDING
    merchantOrderId: response.merchantOrderId,
    amount:          response.amount,
    paymentDetails:  response.paymentDetails,
  };
};

// ─── Step 5: Confirm & Place Order in DB ─────────────────────────────────────
// Called after PhonePe confirms payment. Creates the order, decrements stock
// (with admin low-stock alerts), and sends the Brevo confirmation email.
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

  const name = `${shippingAddress?.firstName || ''} ${shippingAddress?.lastName || ''}`.trim() || 'Customer';
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