import Order from './order.model.js';
import { Parser } from 'json2csv';

// Create a new order on checkout form submission
// Maps to Checkout.jsx "Complete Order" button
export const createOrderService = async (data) => {
  const { items, shippingCost = 0 } = data;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total    = subtotal + shippingCost;

  const order = await Order.create({ ...data, subtotal, total });
  return order;
};

// Get all orders with optional filters and pagination
// Maps to AdminOrders full table (Order ID, Customer, Date, Status, Total)
export const getAllOrdersService = async ({ page = 1, limit = 20, status } = {}) => {
  const filter = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('items.product', 'title image'),
    Order.countDocuments(filter),
  ]);

  return { orders, total, page: Number(page), limit: Number(limit) };
};

// Get recent orders for AdminDashboard "Recent Orders Overview" table
export const getRecentOrdersService = async (limit = 5) => {
  return Order.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('items.product', 'title image');
};

// Get a single order by ID
// Maps to AdminOrders "View" button
export const getOrderByIdService = async (id) => {
  const order = await Order.findById(id).populate('items.product', 'title image material');
  if (!order) throw new Error('Order not found');
  return order;
};

// Update order status
// Maps to AdminOrders status badge update: pending → shipped → delivered
export const updateOrderStatusService = async (id, { status, paymentStatus }) => {
  const updates = {};
  if (status)        updates.status        = status;
  if (paymentStatus) updates.paymentStatus = paymentStatus;

  const order = await Order.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
  if (!order) throw new Error('Order not found');
  return order;
};

// Delete / cancel an order
export const deleteOrderService = async (id) => {
  const order = await Order.findByIdAndDelete(id);
  if (!order) throw new Error('Order not found');
  return { message: 'Order deleted successfully' };
};

// Export all orders as CSV
// Maps to AdminOrders "Export CSV" button
export const exportOrdersCSVService = async () => {
  const orders = await Order.find().sort({ createdAt: -1 });

  const rows = orders.map((o) => ({
    orderNumber:   o.orderNumber,
    email:         o.email,
    customerName:  `${o.shippingAddress.firstName} ${o.shippingAddress.lastName}`,
    city:          o.shippingAddress.city,
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

// Aggregated stats for AdminDashboard stat cards
// Total Revenue + Total Orders count
export const getOrderStatsService = async () => {
  const [revenueResult, totalOrders] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
    ]),
    Order.countDocuments(),
  ]);

  const totalRevenue = revenueResult[0]?.totalRevenue ?? 0;
  return { totalRevenue, totalOrders };
};