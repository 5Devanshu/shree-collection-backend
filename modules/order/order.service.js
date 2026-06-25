import { Op } from 'sequelize';
import { Parser } from 'json2csv';
import Order   from './order.model.js';
import Product from '../product/product.model.js';
import { sendOrderConfirmationEmail, sendLowStockAlert } from '../../services/brevo.service.js';

// ── Helper: decrement stock for each ordered item + low-stock alerts ──────────
export const decrementStockForItems = async (items) => {
  for (const item of items) {
    const product = await Product.findByPk(item.productId || item.product);
    if (!product) continue;

    const previousStock = product.stock;
    const newStock      = Math.max(0, previousStock - (item.quantity || 1));

    const stockStatus =
      newStock === 0  ? 'out_of_stock' :
      newStock <= 5   ? 'low_stock'    : 'in_stock';

    await product.update({ stock: newStock, stockStatus });

    if (newStock <= 5 && previousStock > 5) {
      await sendLowStockAlert(product);
    }
  }
};

// ── Create order ──────────────────────────────────────────────────────────────
export const createOrderService = async (data) => {
  const { items, shippingCost = 0 } = data;

  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * (i.quantity || 1), 0);
  const total    = subtotal + Number(shippingCost);

  const order = await Order.create({ ...data, subtotal, total });

  await decrementStockForItems(items);

  const name = data.shippingAddress
    ? `${data.shippingAddress.firstName || ''} ${data.shippingAddress.lastName || ''}`.trim() || 'Customer'
    : 'Customer';
  await sendOrderConfirmationEmail(order.email, {
    orderNumber: order.orderNumber,
    name,
    items: order.items,
    total: order.total,
  });

  return order;
};

// ── Get all orders (AdminOrders table) ────────────────────────────────────────
// buyerType: 'reseller' → resellerId set · 'customer' → resellerId null (incl. guests)
export const getAllOrdersService = async ({ page = 1, limit = 20, status, buyerType } = {}) => {
  const where = {};
  if (status) where.status = status;

  if (buyerType === 'reseller') {
    where.resellerId = { [Op.ne]: null };
  } else if (buyerType === 'customer') {
    where.resellerId = { [Op.is]: null };
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { rows: orders, count: total } = await Order.findAndCountAll({
    where,
    order:  [['createdAt', 'DESC']],
    offset,
    limit:  Number(limit),
  });

  return { orders, total, page: Number(page), limit: Number(limit) };
};

// ── ADD this function anywhere in order.service.js, e.g. after getAllOrdersService ──

// ── My Orders (reseller's own order history) ──────────────────────────────────
// Unlike getAllOrdersService (admin, sees everyone), this is scoped to a single
// resellerId so a reseller can only ever see their own orders.
export const getResellerOrdersService = async (resellerId, { page = 1, limit = 20, status } = {}) => {
  const where = { resellerId };
  if (status) where.status = status;

  const offset = (Number(page) - 1) * Number(limit);

  const { rows: orders, count: total } = await Order.findAndCountAll({
    where,
    order:  [['createdAt', 'DESC']],
    offset,
    limit:  Number(limit),
  });

  return { orders, total, page: Number(page), limit: Number(limit) };
};

// ── Recent orders (AdminDashboard) ────────────────────────────────────────────
export const getRecentOrdersService = async (limit = 5) => {
  return Order.findAll({ order: [['createdAt', 'DESC']], limit: Number(limit) });
};

// ── Single order ──────────────────────────────────────────────────────────────
export const getOrderByIdService = async (id) => {
  const order = await Order.findByPk(id);
  if (!order) throw new Error('Order not found');
  return order;
};

// ── Update status / payment status ────────────────────────────────────────────
export const updateOrderStatusService = async (id, { status, paymentStatus, trackingNumber }) => {
  const order = await Order.findByPk(id);
  if (!order) throw new Error('Order not found');

  const updates = {};
  if (status)         updates.status         = status;
  if (paymentStatus)  updates.paymentStatus  = paymentStatus;
  if (trackingNumber !== undefined) updates.trackingNumber = trackingNumber;

  await order.update(updates);
  return order;
};

// ── Delete order ──────────────────────────────────────────────────────────────
export const deleteOrderService = async (id) => {
  const order = await Order.findByPk(id);
  if (!order) throw new Error('Order not found');
  await order.destroy();
  return { message: 'Order deleted successfully' };
};

// ── Export CSV (AdminOrders) ──────────────────────────────────────────────────
export const exportOrdersCSVService = async () => {
  const orders = await Order.findAll({ order: [['createdAt', 'DESC']] });

  const rows = orders.map((o) => ({
    orderNumber:   o.orderNumber,
    email:         o.email,
    customerName:  `${o.shippingAddress?.firstName || ''} ${o.shippingAddress?.lastName || ''}`.trim(),
    buyerType:     o.resellerId ? 'reseller' : 'customer',
    city:          o.shippingAddress?.city || '',
    status:        o.status,
    paymentStatus: o.paymentStatus,
    subtotal:      o.subtotal,
    shippingCost:  o.shippingCost,
    total:         o.total,
    date:          o.createdAt.toISOString().split('T')[0],
  }));

  const parser = new Parser();
  return parser.parse(rows);
};

// ── Stats (AdminDashboard stat cards) ─────────────────────────────────────────
export const getOrderStatsService = async () => {
  const [totalRevenue, totalOrders] = await Promise.all([
    Order.sum('total', { where: { paymentStatus: 'paid' } }),
    Order.count(),
  ]);

  return { totalRevenue: Number(totalRevenue) || 0, totalOrders };
};