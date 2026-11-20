import * as customPaymentService from './customPayment.service.js';
import { verifyWebhook } from './phonepeV2.service.js';

export const createPayment = async (req, res) => {
  try {
    const result = await customPaymentService.createCustomPayment({
      ...req.body,
      frontendUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Custom payment creation error:', error.message);
    res.status(400).json({ success: false, message: error.message || 'Unable to create payment' });
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const payment = await customPaymentService.checkCustomPayment(req.params.merchantOrderId);
    res.json({
      success: true,
      data: {
        merchantOrderId: payment.merchantOrderId,
        customerName: payment.customerName,
        amount: payment.amount,
        currency: payment.currency,
        paymentStatus: payment.paymentStatus,
        gatewayTransactionId: payment.gatewayTransactionId,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt,
      },
    });
  } catch (error) {
    console.error('Custom payment status error:', error.message);
    res.status(400).json({ success: false, message: error.message || 'Unable to check payment status' });
  }
};

export const handleWebhook = async (req, res) => {
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
  if (!verifyWebhook(rawBody, req.headers)) {
    return res.status(401).json({ success: false, message: 'Invalid webhook authentication' });
  }

  try {
    await customPaymentService.processWebhook(req.body);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Custom payment webhook error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getAdminPayments = async (req, res) => {
  try {
    const result = await customPaymentService.getAdminCustomPayments(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminPaymentSummary = async (_req, res) => {
  try {
    const summary = await customPaymentService.getAdminCustomPaymentSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminPaymentById = async (req, res) => {
  try {
    const payment = await customPaymentService.getAdminCustomPaymentById(req.params.id);
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const refreshAdminPaymentStatus = async (req, res) => {
  try {
    const payment = await customPaymentService.checkCustomPayment(req.params.merchantOrderId);
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
