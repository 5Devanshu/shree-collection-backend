import express from 'express';
import {
  getAllProducts, getFeaturedProducts,
  getProductsByCategory, getProductById,
  createProduct, updateProduct, deleteProduct,
  toggleFeatured, updateStock, getRelatedProducts,
} from './product.controller.js';
import protect          from '../auth/auth.middleware.js';
import { attachReseller } from '../reseller/reseller.middleware.js';

const router = express.Router();

// ── Public — attachReseller on all GET routes so controller knows who's asking ─
// IMPORTANT: specific paths BEFORE /:id

router.get('/featured',       attachReseller, getFeaturedProducts);
router.get('/category/:slug', attachReseller, getProductsByCategory);
router.get('/',               attachReseller, getAllProducts);
router.get('/:id',            attachReseller, getProductById);

// ── Admin protected ───────────────────────────────────────────────────────────
router.post('/',              protect, createProduct);
router.patch('/:id',          protect, updateProduct);
router.delete('/:id',         protect, deleteProduct);
router.patch('/:id/featured', protect, toggleFeatured);
router.patch('/:id/stock',    protect, updateStock);
router.get('/:id/related',    attachReseller, getRelatedProducts);

export default router;