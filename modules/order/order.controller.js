import * as orderService from './order.service.js';
import { initializePhonePePayment, checkPhonePeTransactionStatus } from '../../config/phonepe.js';
import Order from './order.model.js';

// POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrderService(req.body);
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/orders  [Admin]
export const getAllOrders = async (req, res) => {
  try {
    const result = await orderService.getAllOrdersService(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/recent  [Admin]
export const getRecentOrders = async (req, res) => {
  try {
    const orders = await orderService.getRecentOrdersService(req.query.limit);
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/stats  [Admin]
export const getOrderStats = async (req, res) => {
  try {
    const stats = await orderService.getOrderStatsService();
    res.status(200).json({ success: true, ...stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/export  [Admin]
export const exportOrdersCSV = async (req, res) => {
  try {
    const csv = await orderService.exportOrdersCSVService();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="shree-orders.csv"');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/:id  [Admin]
export const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderByIdService(req.params.id);
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// PATCH /api/orders/:id/status  [Admin]
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await orderService.updateOrderStatusService(req.params.id, req.body);
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/orders/:id  [Admin]
export const deleteOrder = async (req, res) => {
  try {
    const result = await orderService.deleteOrderService(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// POST /api/orders/demo  [Public - Guest Checkout Demo]
export const createDemoOrder = async (req, res) => {
  try {
    const order = await orderService.createOrderService(req.body);
    res.status(201).json({ 
      success: true, 
      data: {
        orderId: order.orderNumber,
        orderNumber: order.orderNumber,
        email: order.email,
        total: order.total,
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/orders/:id/payment/initiate [Public - Payment Gateway Redirect]
export const initiatePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Fetch order from database
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if already paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order already paid' });
    }

    // Prepare PhonePe payment data
    const paymentData = {
      amount: order.total,
      orderId: order.orderNumber,
      customerName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      customerEmail: order.email,
      customerPhone: order.phone,
      redirectUrl: `${process.env.FRONTEND_URL}/payment/success?orderId=${order.orderNumber}`,
      callbackUrl: `${process.env.BACKEND_URL}/api/orders/payment/callback`,
    };

    // Initialize PhonePe payment
    const phonePeResponse = await initializePhonePePayment(paymentData);

    if (phonePeResponse.success) {
      // Return redirect URL to frontend
      res.status(200).json({
        success: true,
        data: {
          orderId: order.orderNumber,
          paymentUrl: phonePeResponse.data.instrumentResponse.redirectUrl,
          transactionId: phonePeResponse.data.transactionId,
        },
      });
    } else {
      throw new Error(phonePeResponse.message || 'Failed to initiate payment');
    }
  } catch (error) {
    console.error('Payment Initiation Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to initiate payment' 
    });
  }
};

// POST /api/orders/payment/callback [PhonePe Webhook]
export const paymentCallback = async (req, res) => {
  try {
    const { merchantTransactionId, status } = req.body;

    if (!merchantTransactionId) {
      return res.status(400).json({ success: false, message: 'Missing transaction ID' });
    }

    // Find order by orderNumber
    const order = await Order.findOne({ orderNumber: merchantTransactionId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update order status based on payment status
    if (status === 'SUCCESS' || status === 'COMPLETED') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.paidAt = new Date();
    } else if (status === 'FAILED') {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
    } else {
      order.paymentStatus = 'pending';
    }

    await order.save();

    res.status(200).json({ 
      success: true, 
      message: 'Payment callback processed',
      data: { orderId: order.orderNumber, status: order.status }
    });
  } catch (error) {
    console.error('Payment Callback Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Callback processing failed' 
    });
  }
};

// GET /api/orders/:id/payment/verify [Public - Verify Payment Status]
export const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find order by orderNumber
    const order = await Order.findOne({ orderNumber: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check PhonePe transaction status
    try {
      const transactionStatus = await checkPhonePeTransactionStatus(orderId);

      if (transactionStatus.success) {
        // Update order if payment is confirmed
        if (transactionStatus.data.state === 'COMPLETED') {
          order.paymentStatus = 'paid';
          order.status = 'confirmed';
          order.paidAt = new Date();
          await order.save();
        }
      }
    } catch (phonePeError) {
      console.warn('PhonePe verification fallback:', phonePeError.message);
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        email: order.email,
      },
    });
  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Verification failed' 
    });
  }
};