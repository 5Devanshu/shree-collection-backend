import Order    from '../order/order.model.js';
import Product  from '../product/product.model.js';
import Category from '../category/category.model.js';

// ─── Stat Card 1: Total Revenue ───────────────────────────────────────────────
// Maps to AdminDashboard.jsx stat-card "Total Revenue" → "$124,500"
// Aggregates total from all paid orders
export const getTotalRevenueService = async () => {
  const result = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
  ]);
  return result[0]?.totalRevenue ?? 0;
};

// ─── Stat Card 2: Total Orders ────────────────────────────────────────────────
// Maps to AdminDashboard.jsx stat-card "Total Orders" → "248"
// Counts all orders regardless of status
export const getTotalOrdersService = async () => {
  return Order.countDocuments();
};

// ─── Stat Card 3: Products In Stock ──────────────────────────────────────────
// Maps to AdminDashboard.jsx stat-card "Products In Stock" → "1,024"
// Counts products that are either in_stock or low_stock (not out_of_stock)
export const getProductsInStockService = async () => {
  return Product.countDocuments({ stockStatus: { $ne: 'out_of_stock' } });
};

// ─── Stat Card 4: Active Categories ──────────────────────────────────────────
// Maps to AdminDashboard.jsx stat-card "Active Categories" → "12"
export const getActiveCategoriesService = async () => {
  return Category.countDocuments({ isActive: true });
};

// ─── All Four Stat Cards in One Query ────────────────────────────────────────
// Single aggregated call — fetches all AdminDashboard stat cards in parallel
// Avoids four separate round-trips when the dashboard first loads
export const getDashboardStatsService = async () => {
  const [
    totalRevenue,
    totalOrders,
    productsInStock,
    activeCategories,
  ] = await Promise.all([
    getTotalRevenueService(),
    getTotalOrdersService(),
    getProductsInStockService(),
    getActiveCategoriesService(),
  ]);

  return {
    totalRevenue,
    totalOrders,
    productsInStock,
    activeCategories,
  };
};

// ─── Recent Orders Overview Table ────────────────────────────────────────────
// Maps to AdminDashboard.jsx "Recent Orders Overview" table:
// Columns: Order ID, Customer (firstName + lastName), Date, Status, Total, Actions
export const getRecentOrdersService = async (limit = 5) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  // Shape the data to exactly match the table columns in AdminDashboard.jsx
  return orders.map((order) => ({
    orderId:      order.orderNumber,
    customer:     `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
    date:         order.createdAt.toLocaleDateString('en-IN', {
                    day:   '2-digit',
                    month: 'short',
                    year:  'numeric',
                  }),
    status:       order.status,        // pending | shipped | delivered | cancelled
    total:        order.total,
    id:           order._id,
  }));
};

// ─── Revenue Breakdown by Order Status ───────────────────────────────────────
// Breaks down revenue by status — useful for admin to see
// how much is pending vs shipped vs delivered
export const getRevenueByStatusService = async () => {
  const result = await Order.aggregate([
    {
      $group: {
        _id:     '$status',
        revenue: { $sum: '$total' },
        count:   { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  return result.map((r) => ({
    status:  r._id,
    revenue: r.revenue,
    count:   r.count,
  }));
};

// ─── Orders Count by Status ───────────────────────────────────────────────────
// Counts orders grouped by status: pending / shipped / delivered / cancelled
// Useful for status badge breakdown summary on the dashboard
export const getOrdersByStatusService = async () => {
  const result = await Order.aggregate([
    {
      $group: {
        _id:   '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Normalise into a flat object: { pending: N, shipped: N, delivered: N }
  const breakdown = { pending: 0, shipped: 0, delivered: 0, cancelled: 0 };
  result.forEach((r) => {
    if (r._id in breakdown) breakdown[r._id] = r.count;
  });

  return breakdown;
};

// ─── Stock Status Breakdown ───────────────────────────────────────────────────
// Counts products by stock status: in_stock / low_stock / out_of_stock
// Mirrors the status badges shown in AdminProducts table
export const getStockBreakdownService = async () => {
  const result = await Product.aggregate([
    {
      $group: {
        _id:   '$stockStatus',
        count: { $sum: 1 },
      },
    },
  ]);

  const breakdown = { in_stock: 0, low_stock: 0, out_of_stock: 0 };
  result.forEach((r) => {
    if (r._id in breakdown) breakdown[r._id] = r.count;
  });

  return breakdown;
};

// ─── Top Selling Products ─────────────────────────────────────────────────────
// Aggregates which products appear most frequently across all orders
// Useful future addition to the AdminDashboard below the Recent Orders table
export const getTopSellingProductsService = async (limit = 5) => {
  const result = await Order.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id:         '$items.product',
        title:       { $first: '$items.title' },
        totalSold:   { $sum: '$items.quantity' },
        totalRevenue:{ $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: Number(limit) },
  ]);

  return result;
};

// ─── Revenue Over Time ────────────────────────────────────────────────────────
// Groups paid order revenue by month for a time-series chart
// Useful for an analytics chart below the stat cards on AdminDashboard
export const getRevenueOverTimeService = async (months = 6) => {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const result = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        createdAt:     { $gte: since },
      },
    },
    {
      $group: {
        _id: {
          year:  { $year:  '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$total' },
        orders:  { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return result.map((r) => ({
    month:   `${r._id.year}-${String(r._id.month).padStart(2, '0')}`,
    revenue: r.revenue,
    orders:  r.orders,
  }));
};