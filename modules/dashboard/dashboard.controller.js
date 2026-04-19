import * as dashboardService from './dashboard.service.js';

// GET /api/dashboard/stats
// Returns all four AdminDashboard stat cards in a single response:
// Total Revenue | Total Orders | Products In Stock | Active Categories
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await dashboardService.getDashboardStatsService();
    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/recent-orders
// Returns AdminDashboard "Recent Orders Overview" table data
// Query param: ?limit=5 (default 5 rows)
export const getRecentOrders = async (req, res) => {
  try {
    const { limit } = req.query;
    const orders = await dashboardService.getRecentOrdersService(limit);
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/revenue-by-status
// Revenue breakdown by order status: pending / shipped / delivered
export const getRevenueByStatus = async (req, res) => {
  try {
    const data = await dashboardService.getRevenueByStatusService();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/orders-by-status
// Order count breakdown: pending / shipped / delivered / cancelled
// Maps to the three status badge styles in AdminDashboard:
// status-pending | status-shipped | status-delivered
export const getOrdersByStatus = async (req, res) => {
  try {
    const breakdown = await dashboardService.getOrdersByStatusService();
    res.status(200).json({ success: true, breakdown });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/stock-breakdown
// Stock status breakdown: in_stock / low_stock / out_of_stock
// Maps to AdminProducts status badges
export const getStockBreakdown = async (req, res) => {
  try {
    const breakdown = await dashboardService.getStockBreakdownService();
    res.status(200).json({ success: true, breakdown });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/top-products
// Top selling products by quantity sold
// Query param: ?limit=5
export const getTopSellingProducts = async (req, res) => {
  try {
    const { limit } = req.query;
    const products = await dashboardService.getTopSellingProductsService(limit);
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/revenue-over-time
// Monthly revenue time-series for analytics chart
// Query param: ?months=6
export const getRevenueOverTime = async (req, res) => {
  try {
    const { months } = req.query;
    const data = await dashboardService.getRevenueOverTimeService(months);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};