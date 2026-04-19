import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../order/order.model.js';
import Product from '../product/product.model.js';

// Razorpay instance — initialised from .env (only if credentials are provided)
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id') {
  razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// ─── Step 1: Validate Cart ────────────────────────────────────────────────────
// Validates each item sent from the Checkout Order Summary panel.
// Checks product exists, is not out of stock, and price has not been tampered.
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

    // Server-side price verification — prevents frontend price tampering
    if (product.price !== item.price) {
      throw new Error(`Price mismatch for "${product.title}". Please refresh and try again.`);
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
// Maps to Checkout.jsx Order Summary:
// Subtotal row, Shipping row ("Complimentary"), Total row
export const calculateTotalsService = (validatedItems) => {
  const subtotal    = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingCost = 0;          // "Complimentary Express Shipping" as shown in frontend
  const total        = subtotal + shippingCost;
  return { subtotal, shippingCost, total };
};

// ─── Step 3: Create Razorpay Payment Order ────────────────────────────────────
// Creates a Razorpay order for the amount.
// Frontend will use the returned order_id to open the Razorpay payment modal.
// Maps to Checkout.jsx Payment section (Card Number, Expiry, Security Code).
export const createPaymentOrderService = async (total) => {
  const options = {
    amount:   Math.round(total * 100),   // Razorpay requires amount in paise
    currency: 'INR',
    receipt:  `receipt_${Date.now()}`,
    payment_capture: 1,                  // auto-capture on successful payment
  };

  const paymentOrder = await razorpay.orders.create(options);
  return paymentOrder;
};

// ─── Step 4: Verify Payment Signature ────────────────────────────────────────
// Verifies the Razorpay payment signature after the user completes payment.
// This is critical — prevents fake/forged payment confirmations reaching backend.
export const verifyPaymentSignatureService = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const body      = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected  = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expected !== razorpaySignature) {
    throw new Error('Payment verification failed. Invalid signature.');
  }

  return true;
};

// ─── Step 5: Confirm & Place Order ───────────────────────────────────────────
// After payment is verified, creates the final Order record in the database.
// Maps to Checkout.jsx "Complete Order" button → onSubmit flow.
// Combines: Contact Information + Shipping Address + validated items + payment ref.
export const confirmOrderService = async ({
  email,
  shippingAddress,
  validatedItems,
  subtotal,
  shippingCost,
  total,
  razorpayOrderId,
  razorpayPaymentId,
}) => {
  const order = await Order.create({
    email,
    shippingAddress,
    items:            validatedItems,
    subtotal,
    shippingCost,
    total,
    paymentStatus:    'paid',
    paymentMethod:    'card',
    paymentReference: razorpayPaymentId,
    status:           'pending',
  });

  return order;
};

// ─── Step 6: Send Order Confirmation Email ────────────────────────────────────
// Sends a confirmation email to the customer after successful order placement.
// Maps to Checkout.jsx Contact Information → email field.
export const sendOrderConfirmationService = async ({ email, orderNumber, total, items }) => {
  const nodemailer  = await import('nodemailer');

  const transporter = nodemailer.default.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const itemList = items
    .map((i) => `<li>${i.title} × ${i.quantity} — ₹${(i.price * i.quantity).toLocaleString()}</li>`)
    .join('');

  await transporter.sendMail({
    from:    `"Shree Jewels" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `Your Shree Order ${orderNumber} is Confirmed ✨`,
    html: `
      <h2>Thank you for your order, ${orderNumber}</h2>
      <p>Your order has been placed successfully and is being prepared with care.</p>
      <h3>Order Summary</h3>
      <ul>${itemList}</ul>
      <p><strong>Total Paid: ₹${total.toLocaleString()}</strong></p>
      <p>Shipping: Complimentary Express Shipping</p>
      <p>Returns: 30-day graceful returns</p>
      <br/>
      <p>— The Shree Team</p>
    `,
  });
};