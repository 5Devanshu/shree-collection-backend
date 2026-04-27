import Order from '../order/order.model.js';
import Product from '../product/product.model.js';
import {
  initializePhonePePayment,
  checkPhonePeTransactionStatus,
} from '../../config/phonepe.js';
import nodemailer from 'nodemailer';

/**
 * Initialize PhonePe payment service
 * Validates cart items and creates payment request
 */
export const initiatePhonePePaymentService = async ({
  items,
  guestEmail,
  guestPhone,
  guestName,
  guestAddress,
}) => {
  try {
    // Validate cart items server-side
    const validatedItems = await validateCartItemsService(items);

    // Calculate totals
    const { subtotal, shippingCost, total } = calculateOrderTotalsService(validatedItems);

    // Generate unique merchant transaction ID
    const merchantTransactionId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initialize PhonePe payment
    const paymentResponse = await initializePhonePePayment({
      amount: total,
      orderId: merchantTransactionId,
      customerName: guestName,
      customerEmail: guestEmail,
      customerPhone: guestPhone,
      redirectUrl: `${process.env.FRONTEND_URL}/payment-success`,
      callbackUrl: `${process.env.BACKEND_URL}/api/payment/phonepe/callback`,
    });

    if (!paymentResponse.success) {
      throw new Error('Failed to initialize PhonePe payment');
    }

    return {
      merchantTransactionId,
      redirectUrl: paymentResponse.data.instrumentResponse.redirectUrl,
      validatedItems,
      subtotal,
      shippingCost,
      total,
    };
  } catch (error) {
    console.error('PhonePe Payment Initialization Error:', error);
    throw error;
  }
};

/**
 * Validate cart items
 */
const validateCartItemsService = async (items) => {
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

    // Verify price hasn't been tampered with
    if (product.price !== item.price) {
      throw new Error(`Price mismatch for "${product.title}". Please refresh and try again.`);
    }

    validated.push({
      product: product._id,
      title: product.title,
      material: product.material,
      price: product.price,
      quantity: item.quantity || 1,
      image: product.image?.url || '',
    });
  }

  return validated;
};

/**
 * Calculate order totals
 */
const calculateOrderTotalsService = (validatedItems) => {
  const subtotal = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const SHIPPING_THRESHOLD = 500;
  const SHIPPING_CHARGE = 70;
  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const total = subtotal + shippingCost;

  return { subtotal, shippingCost, total };
};

/**
 * Verify PhonePe payment
 */
export const verifyPhonePePaymentService = async (merchantTransactionId) => {
  try {
    const response = await checkPhonePeTransactionStatus(merchantTransactionId);

    if (response.success && response.data?.status === 'COMPLETED') {
      return true;
    }

    return false;
  } catch (error) {
    console.error('PhonePe Verification Error:', error);
    return false;
  }
};

/**
 * Create guest order in database
 */
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
  try {
    // Parse guest name into first and last name
    const nameParts = guestName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const order = await Order.create({
      email: guestEmail,
      phone: guestPhone,
      firstName,
      lastName,
      shippingAddress: {
        firstName,
        lastName,
        addressLine1: guestAddress.line1,
        addressLine2: guestAddress.line2 || '',
        city: guestAddress.city,
        postalCode: guestAddress.pincode,
        country: guestAddress.country || 'India',
      },
      items,
      subtotal,
      shippingCost,
      total,
      paymentStatus: 'paid',
      paymentMethod,
      paymentReference: transactionId,
      merchantTransactionId,
      status: 'pending',
      isGuestOrder: true,
    });

    return order;
  } catch (error) {
    console.error('Order Creation Error:', error);
    throw new Error('Failed to create order: ' + error.message);
  }
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmailService = async ({
  guestEmail,
  guestName,
  orderNumber,
  total,
  items,
}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const itemList = items
      .map((i) => `<li>${i.title} × ${i.quantity} — ₹${(i.price * i.quantity).toLocaleString('en-IN')}</li>`)
      .join('');

    const mailOptions = {
      from: `"Shree Collection" <${process.env.EMAIL_USER}>`,
      to: guestEmail,
      subject: `Your Shree Order ${orderNumber} is Confirmed ✨`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b7355;">Thank you for your order, ${guestName}!</h2>
          <p style="color: #555;">Your order has been placed successfully and is being prepared with care.</p>
          
          <h3 style="color: #8b7355; margin-top: 20px;">Order Summary</h3>
          <p style="color: #666;">Order Number: <strong>${orderNumber}</strong></p>
          
          <ul style="color: #555; line-height: 1.8;">
            ${itemList}
          </ul>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
            <p style="margin: 5px 0; color: #555;">
              <strong>Subtotal:</strong> ₹${items.reduce((sum, i) => sum + i.price * i.quantity, 0).toLocaleString('en-IN')}
            </p>
            <p style="margin: 5px 0; color: #555;">
              <strong>Total Paid:</strong> ₹${total.toLocaleString('en-IN')}
            </p>
          </div>
          
          <p style="margin-top: 20px; color: #666;">
            ✓ Complimentary Express Shipping<br>
            ✓ 30-day graceful returns<br>
            ✓ Secure packaging
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            — The Shree Collection Team<br>
            For support, reply to this email or visit our website.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent to:', guestEmail);
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't throw - email failure shouldn't block order creation
  }
};

/**
 * Mark payment as failed
 */
export const markPaymentAsFailedService = async (merchantTransactionId) => {
  try {
    await Order.findOneAndUpdate(
      { merchantTransactionId },
      {
        paymentStatus: 'failed',
        status: 'cancelled',
      }
    );
  } catch (error) {
    console.error('Failed to mark payment as failed:', error);
  }
};

/**
 * Check payment status
 */
export const checkPhonePeStatusService = async (merchantTransactionId) => {
  try {
    const response = await checkPhonePeTransactionStatus(merchantTransactionId);
    return response;
  } catch (error) {
    console.error('Status check error:', error);
    throw error;
  }
};
