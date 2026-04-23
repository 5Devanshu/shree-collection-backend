import express from 'express';
import {
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from './product.controller.js';
import protect from '../auth/auth.middleware.js';

const router = express.Router();

// ─── Public Routes ──────────────────────────────────────────
// IMPORTANT: Specific routes MUST come before generic /:id route

// Homepage FeaturedGrid
router.get('/featured', getFeaturedProducts);

// CategoryPage — /collections/:category
router.get('/category/:slug', getProductsByCategory);

// ProductDescription — /product/:id (most specific, goes last)
router.get('/:id', getProductById);

// All products (with optional filters & pagination)
router.get('/', getAllProducts);

// ─── Admin Protected Routes ──────────────────────────────────
// AdminProducts — "+ Add Product"
router.post('/', protect, createProduct);

// AdminProducts — "Edit"
router.patch('/:id', protect, updateProduct);

// AdminProducts — "Delete"
router.delete('/:id', protect, deleteProduct);

export default router;