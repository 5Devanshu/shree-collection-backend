import express from 'express';
import {
  getDashboardStats,
  getRecentOrders,
  getRevenueByStatus,
  getOrdersByStatus,
  getStockBreakdown,
  getTopSellingProducts,
  getRevenueOverTime,
} from './dashboard.controller.js';
import protect from '../auth/auth.middleware.js';

const router = express.Router();

// ─── All Dashboard Routes are Admin Protected ─────────────────────────────────

// AdminDashboard stat-cards row —
// Total Revenue | Total Orders | Products In Stock | Active Categories
router.get('/stats', protect, getDashboardStats);

// AdminDashboard "Recent Orders Overview" table
// ?limit=5
router.get('/recent-orders', protect, getRecentOrders);

// Revenue broken down by order status
router.get('/revenue-by-status', protect, getRevenueByStatus);

// Order count per status badge type (pending / shipped / delivered)
router.get('/orders-by-status', protect, getOrdersByStatus);

// Product stock status breakdown (in_stock / low_stock / out_of_stock)
router.get('/stock-breakdown', protect, getStockBreakdown);

// Top selling products — ?limit=5
router.get('/top-products', protect, getTopSellingProducts);

// Monthly revenue time-series — ?months=6
router.get('/revenue-over-time', protect, getRevenueOverTime);

export default router;