const Order    = require('../models/Order');
const Product  = require('../models/Product');
const {
  sendOrderConfirmation,
  sendPaymentConfirmation,
  sendShippingNotification,
} = require('../services/email.service');

// ── Cashfree initialisation ───────────────────────────────────────────────────
let Cashfree;
try {
  Cashfree = require('cashfree-pg');
  Cashfree.XClientId     = process.env.CASHFREE_APP_ID;
  Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
  Cashfree.XEnvironment  =
    process.env.CASHFREE_ENV === 'production'
      ? Cashfree.Environment.PRODUCTION
      : Cashfree.Environment.SANDBOX;
} catch (err) {
  console.warn('Cashfree SDK not available:', err.message);
}

// ── Helper — calculate order total from DB prices ────────────────────────────
// Never trust prices sent from the frontend
// Always recalculate from the database
const calculateTotal = (items, dbProducts) => {
  return items.reduce((sum, item) => {
    const dbProduct = dbProducts.find(
      p => p._id.toString() === item.productId.toString()
    );
    if (!dbProduct) throw new Error(`Product not found: ${item.productId}`);
    return sum + dbProduct.price * item.qty;
  }, 0);
};

// ── @desc    Get all orders
// ── @route   GET /api/orders
// ── @access  Admin only
// ── @query   ?status=pending|confirmed|shipped|delivered|cancelled
//             ?paymentStatus=unpaid|paid|failed|refunded
//             ?page=1  &limit=20
const getOrders = async (req, res, next) => {
  try {
    const {
      status,
      paymentStatus,
      page  = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status)        filter.status        = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const pageNum  = Math.max(1, parseInt(page,  10));
    const limitNum = Math.min(50, parseInt(limit, 10));
    const skip     = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count:      orders.length,
      total,
      page:       pageNum,
      totalPages: Math.ceil(total / limitNum),
      data:       orders,
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Get single order by ID
// ── @route   GET /api/orders/:id
// ── @access  Admin only
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Place a new order and create Cashfree payment session
// ── @route   POST /api/orders
// ── @access  Public
const createOrder = async (req, res, next) => {
  try {
    const { items, customer } = req.body;

    // ── Validate input ────────────────────────────────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    if (!customer || !customer.name || !customer.email || !customer.phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, email and phone are required',
      });
    }

    if (
      !customer.address ||
      !customer.address.line1 ||
      !customer.address.city  ||
      !customer.address.state ||
      !customer.address.pincode
    ) {
      return res.status(400).json({
        success: false,
        message: 'Complete delivery address is required',
      });
    }

    // ── Validate qty for each item ────────────────────────────────────────────
    for (const item of items) {
      if (!item.productId || !item.qty || item.qty < 1) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have a valid productId and qty of at least 1',
        });
      }
    }

    // ── Fetch products from DB to verify they exist and get real prices ───────
    const productIds = items.map(i => i.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    if (dbProducts.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more products in your order were not found',
      });
    }

    // ── Check stock for each item ─────────────────────────────────────────────
    for (const item of items) {
      const dbProduct = dbProducts.find(
        p => p._id.toString() === item.productId.toString()
      );

      if (dbProduct.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${dbProduct.title}". Available: ${dbProduct.stock}`,
        });
      }
    }

    // ── Calculate total from DB prices — never trust frontend prices ──────────
    const subtotal = calculateTotal(items, dbProducts);
    
    // ── Calculate shipping charges ────────────────────────────────────────────
    const SHIPPING_THRESHOLD = 500;
    const SHIPPING_CHARGE = 70;
    const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
    const total = subtotal + shippingCost;

    // ── Build order items snapshot ────────────────────────────────────────────
    const orderItems = items.map(item => {
      const dbProduct = dbProducts.find(
        p => p._id.toString() === item.productId.toString()
      );
      return {
        productId: dbProduct._id,
        title:     dbProduct.title,
        material:  dbProduct.material,
        image:     dbProduct.image,
        price:     dbProduct.price,
        qty:       item.qty,
      };
    });

    // ── Create order in DB with paymentStatus unpaid ──────────────────────────
    const order = await Order.create({
      items:    orderItems,
      customer,
      subtotal,
      shippingCost,
      total,
      status:        'pending',
      paymentStatus: 'unpaid',
    });

    // ── Create Cashfree payment session ───────────────────────────────────────
    const cashfreeOrderPayload = {
      order_id:     order._id.toString(),
      order_amount: total,
      order_currency: 'INR',
      customer_details: {
        customer_id:    order._id.toString(),
        customer_name:  customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/order-confirmation?order_id=${order._id}`,
        notify_url: `${process.env.SERVER_URL}/api/orders/cashfree-webhook`,
      },
    };

    const cashfreeResponse = await Cashfree.PGCreateOrder(
      '2023-08-01',
      cashfreeOrderPayload
    );

    const { cf_order_id, payment_session_id } = cashfreeResponse.data;

    // ── Save Cashfree IDs to the order ────────────────────────────────────────
    order.cashfreeOrderId         = cf_order_id;
    order.cashfreePaymentSessionId = payment_session_id;
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId:          order._id,
        total,
        paymentSessionId: payment_session_id,
        cashfreeOrderId:  cf_order_id,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Verify payment after Cashfree redirects customer back
// ── @route   POST /api/orders/:id/verify-payment
// ── @access  Public
const verifyPayment = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Do not re-verify already paid orders
    if (order.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Order is already marked as paid',
        data: { orderId: order._id, paymentStatus: order.paymentStatus },
      });
    }

    // ── Fetch payment status from Cashfree ────────────────────────────────────
    const cashfreeResponse = await Cashfree.PGOrderFetchPayments(
      '2023-08-01',
      order.cashfreeOrderId
    );

    const payments = cashfreeResponse.data;

    if (!payments || payments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No payment found for this order',
      });
    }

    // Get the most recent payment attempt
    const latestPayment = payments[payments.length - 1];
    const paymentStatus = latestPayment.payment_status;

    // ── Handle payment success ────────────────────────────────────────────────
    if (paymentStatus === 'SUCCESS') {
      // Deduct stock for each item
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.qty },
        });
      }

      order.paymentStatus      = 'paid';
      order.paymentId          = latestPayment.cf_payment_id.toString();
      order.cashfreePaymentId  = latestPayment.cf_payment_id.toString();
      order.status             = 'confirmed';
      await order.save();

      // Send payment confirmation email (async, don't wait)
      sendPaymentConfirmation(order, order.customer.email, order.customer.name)
        .catch(err => console.error('Email send error:', err));

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          orderId:       order._id,
          paymentStatus: 'paid',
          orderStatus:   'confirmed',
          total:         order.total,
        },
      });
    }

    // ── Handle payment failure ────────────────────────────────────────────────
    if (paymentStatus === 'FAILED') {
      order.paymentStatus = 'failed';
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Payment failed — please try again',
        data: {
          orderId:       order._id,
          paymentStatus: 'failed',
        },
      });
    }

    // ── Payment still pending ─────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      message: 'Payment is still being processed',
      data: {
        orderId:       order._id,
        paymentStatus: 'unpaid',
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Cashfree webhook — server to server payment confirmation
// ── @route   POST /api/orders/cashfree-webhook
// ── @access  Public (called by Cashfree servers directly)
const cashfreeWebhook = async (req, res, next) => {
  try {
    const {
      data,
      type,
    } = req.body;

    // Only handle payment events
    if (type !== 'PAYMENT_SUCCESS_WEBHOOK' && type !== 'PAYMENT_FAILED_WEBHOOK') {
      return res.status(200).json({ received: true });
    }

    const cashfreeOrderId = data?.order?.cf_order_id?.toString();
    const cfPaymentId     = data?.payment?.cf_payment_id?.toString();
    const paymentStatus   = data?.payment?.payment_status;

    if (!cashfreeOrderId) {
      return res.status(400).json({ success: false, message: 'Missing order ID in webhook' });
    }

    const order = await Order.findOne({ cashfreeOrderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Skip if already processed
    if (order.paymentStatus === 'paid') {
      return res.status(200).json({ received: true });
    }

    if (paymentStatus === 'SUCCESS') {
      // Deduct stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.qty },
        });
      }

      order.paymentStatus     = 'paid';
      order.cashfreePaymentId = cfPaymentId;
      order.status            = 'confirmed';
      await order.save();

      // Send payment confirmation email (async, don't wait)
      sendPaymentConfirmation(order, order.customer.email, order.customer.name)
        .catch(err => console.error('Email send error:', err));
    }

    if (paymentStatus === 'FAILED') {
      order.paymentStatus = 'failed';
      await order.save();
    }

    // Always return 200 to Cashfree so it stops retrying the webhook
    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Update order status
// ── @route   PUT /api/orders/:id/status
// ── @access  Admin only
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber } = req.body;

    const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Do not allow cancelling a delivered order
    if (order.status === 'delivered' && status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'A delivered order cannot be cancelled',
      });
    }

    // If cancelling a paid order restore stock
    if (status === 'cancelled' && order.paymentStatus === 'paid') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.qty },
        });
      }
    }

    order.status = status;
    
    // Save tracking number if provided and status is shipped
    if (status === 'shipped' && trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    
    const updated = await order.save();

    // Send shipping notification if status changed to shipped
    if (status === 'shipped') {
      sendShippingNotification(
        updated,
        updated.customer.email,
        updated.customer.name,
        trackingNumber || 'N/A'
      ).catch(err => console.error('Email send error:', err));
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: {
        orderId: updated._id,
        status:  updated.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Get order summary stats for admin dashboard
// ── @route   GET /api/orders/stats
// ── @access  Admin only
const getOrderStats = async (req, res, next) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      paidOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'confirmed' }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.countDocuments({ paymentStatus: 'paid' }),
    ]);

    // Total revenue from paid orders only
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        paidOrders,
        byStatus: {
          pending:   pendingOrders,
          confirmed: confirmedOrders,
          shipped:   shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Create order for demo (no payment gateway, auto-send email)
// ── @route   POST /api/orders/demo
// ── @access  Public
const createDemoOrder = async (req, res, next) => {
  try {
    const { items, customer } = req.body;

    // ── Validate input ────────────────────────────────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    if (!customer || !customer.name || !customer.email || !customer.phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, email and phone are required',
      });
    }

    if (
      !customer.address ||
      !customer.address.line1 ||
      !customer.address.city  ||
      !customer.address.state ||
      !customer.address.pincode
    ) {
      return res.status(400).json({
        success: false,
        message: 'Complete delivery address is required',
      });
    }

    // ── Validate qty for each item ────────────────────────────────────────────
    for (const item of items) {
      if (!item.productId || !item.qty || item.qty < 1) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have a valid productId and qty of at least 1',
        });
      }
    }

    // ── Fetch products from DB to verify they exist and get real prices ───────
    const productIds = items.map(i => i.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    if (dbProducts.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more products in your order were not found',
      });
    }

    // ── Calculate total from DB prices — never trust frontend prices ──────────
    const subtotal = calculateTotal(items, dbProducts);
    
    // ── Calculate shipping charges ────────────────────────────────────────────
    const SHIPPING_THRESHOLD = 500;
    const SHIPPING_CHARGE = 70;
    const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
    const total = subtotal + shippingCost;

    // ── Build order items snapshot ────────────────────────────────────────────
    const orderItems = items.map(item => {
      const dbProduct = dbProducts.find(
        p => p._id.toString() === item.productId.toString()
      );
      return {
        productId: dbProduct._id,
        title:     dbProduct.title,
        material:  dbProduct.material,
        image:     dbProduct.image,
        price:     dbProduct.price,
        qty:       item.qty,
      };
    });

    // ── Create order in DB (mark as confirmed for demo) ──────────────────────
    const order = await Order.create({
      items:    orderItems,
      customer,
      subtotal,
      shippingCost,
      total,
      status:        'confirmed',
      paymentStatus: 'paid',
      paymentId:     `demo-${Date.now()}`,
    });

    // ── Send order confirmation email ─────────────────────────────────────────
    try {
      await sendOrderConfirmation(order, customer.email, customer.name);
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr.message);
      // Don't fail the order if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Demo order created successfully. Confirmation email sent.',
      data: {
        orderId: order._id,
        total,
        subtotal,
        shippingCost,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  verifyPayment,
  cashfreeWebhook,
  updateOrderStatus,
  getOrderStats,
  createDemoOrder,
};