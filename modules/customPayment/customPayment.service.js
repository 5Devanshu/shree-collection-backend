import CustomPayment from './customPayment.model.js';
import { Op } from 'sequelize';
import { createPayment, getOrderStatus } from './phonepeV2.service.js';

const phonePattern = /^[6-9]\d{9}$/;

export const validatePaymentInput = ({ name, mobile, amount }) => {
  const customerName = String(name || '').trim().replace(/\s+/g, ' ');
  const customerMobile = String(mobile || '').replace(/\D/g, '');
  const numericAmount = Number(amount);

  if (customerName.length < 2 || customerName.length > 100) {
    throw new Error('Please enter a valid name');
  }
  if (!phonePattern.test(customerMobile)) {
    throw new Error('Please enter a valid Indian mobile number');
  }
  if (!Number.isFinite(numericAmount) || !Number.isInteger(numericAmount * 100)) {
    throw new Error('Please enter a valid payment amount');
  }
  const minAmount = Number(process.env.CUSTOM_PAYMENT_MIN_AMOUNT || 1);
  const maxAmount = Number(process.env.CUSTOM_PAYMENT_MAX_AMOUNT || 200000);
  if (numericAmount < minAmount || numericAmount > maxAmount) {
    throw new Error(`Payment amount must be between ₹${minAmount.toLocaleString('en-IN')} and ₹${maxAmount.toLocaleString('en-IN')}`);
  }

  return { customerName, customerMobile, amount: Math.round(numericAmount * 100) / 100 };
};

const newMerchantOrderId = () =>
  `SC-PAY-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

const mapGatewayState = (state) => {
  const normalized = String(state || '').toUpperCase();
  if (normalized === 'COMPLETED' || normalized === 'SUCCESS') return 'COMPLETED';
  if (normalized === 'FAILED' || normalized === 'CANCELLED') return 'FAILED';
  if (normalized === 'EXPIRED') return 'EXPIRED';
  return 'PENDING';
};

const applyGatewayStatus = async (payment, gatewayResponse, webhookVerified = false) => {
  const state = gatewayResponse?.state || gatewayResponse?.status;
  const paymentStatus = mapGatewayState(state);
  const update = {
    lastGatewayState: String(state || ''),
    webhookVerified: payment.webhookVerified || webhookVerified,
  };

  if (paymentStatus === 'COMPLETED' && payment.paymentStatus !== 'COMPLETED') {
    update.paymentStatus = 'COMPLETED';
    update.paidAt = new Date();
    update.gatewayTransactionId =
      gatewayResponse?.paymentDetails?.[0]?.transactionId ||
      gatewayResponse?.transactionId ||
      payment.gatewayTransactionId;
    update.paymentMethod =
      gatewayResponse?.paymentDetails?.[0]?.paymentMode ||
      gatewayResponse?.paymentMethod ||
      payment.paymentMethod;
  } else if (payment.paymentStatus === 'PENDING' && paymentStatus !== 'PENDING') {
    update.paymentStatus = paymentStatus;
  }

  if (payment.paymentStatus === 'COMPLETED') return payment;
  await payment.update(update);
  return payment;
};

export const createCustomPayment = async ({ name, mobile, amount, frontendUrl }) => {
  const input = validatePaymentInput({ name, mobile, amount });
  const merchantOrderId = newMerchantOrderId();
  const payment = await CustomPayment.create({
    merchantOrderId,
    customerName: input.customerName,
    customerMobile: input.customerMobile,
    amount: input.amount,
  });

  try {
    const gateway = await createPayment({
      merchantOrderId,
      amount: input.amount,
      redirectUrl: `${frontendUrl}/payment/processing?merchantOrderId=${encodeURIComponent(merchantOrderId)}`,
    });
    if (!gateway.redirectUrl) throw new Error('PhonePe did not return a checkout URL');
    payment.gatewayOrderId = gateway.gatewayOrderId;
    await payment.save();
    return { merchantOrderId, amount: input.amount, currency: 'INR', redirectUrl: gateway.redirectUrl };
  } catch (error) {
    await payment.update({ paymentStatus: 'FAILED' });
    throw error;
  }
};

export const checkCustomPayment = async (merchantOrderId) => {
  const payment = await CustomPayment.findOne({ where: { merchantOrderId } });
  if (!payment) throw new Error('Payment not found');
  if (payment.paymentStatus === 'COMPLETED') return payment;

  const gatewayResponse = await getOrderStatus(merchantOrderId);
  return (await applyGatewayStatus(payment, gatewayResponse)) || payment;
};

export const processWebhook = async (payload) => {
  const merchantOrderId = payload?.payload?.merchantOrderId || payload?.merchantOrderId;
  if (!merchantOrderId) throw new Error('Webhook is missing merchantOrderId');
  const payment = await CustomPayment.findOne({ where: { merchantOrderId } });
  if (!payment) return null;
  return applyGatewayStatus(payment, payload?.payload || payload, true);
};

export const getAdminCustomPayments = async ({ page = 1, limit = 20, status = '', search = '' }) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (safePage - 1) * safeLimit;
  const where = {};

  if (status) where.paymentStatus = String(status).toUpperCase();
  if (search) {
    const term = String(search).trim();
    if (term) {
      where[Op.or] = [
        { merchantOrderId: { [Op.iLike]: `%${term}%` } },
        { gatewayOrderId: { [Op.iLike]: `%${term}%` } },
        { gatewayTransactionId: { [Op.iLike]: `%${term}%` } },
        { customerName: { [Op.iLike]: `%${term}%` } },
        { customerMobile: { [Op.iLike]: `%${term}%` } },
      ];
    }
  }

  const result = await CustomPayment.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
    offset,
  });

  return {
    payments: result.rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: result.count,
      totalPages: Math.ceil(result.count / safeLimit) || 1,
    },
  };
};

export const getAdminCustomPaymentById = async (id) => {
  const payment = await CustomPayment.findByPk(id);
  if (!payment) throw new Error('Custom payment not found');
  return payment;
};

export const getAdminCustomPaymentSummary = async () => {
  const [total, completed, pending, failed, expired] = await Promise.all([
    CustomPayment.count(),
    CustomPayment.count({ where: { paymentStatus: 'COMPLETED' } }),
    CustomPayment.count({ where: { paymentStatus: 'PENDING' } }),
    CustomPayment.count({ where: { paymentStatus: 'FAILED' } }),
    CustomPayment.count({ where: { paymentStatus: 'EXPIRED' } }),
  ]);
  const completedRows = await CustomPayment.findAll({
    attributes: ['amount'],
    where: { paymentStatus: 'COMPLETED' },
  });
  const totalCollected = completedRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return { total, completed, pending, failed, expired, totalCollected };
};

export { mapGatewayState };
