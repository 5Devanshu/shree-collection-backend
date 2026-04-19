import express from 'express';
import {
  getAllCategories,
  getActiveCategories,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from './category.controller.js';
import protect from '../auth/auth.middleware.js';

const router = express.Router();

// ─── Public Routes ───────────────────────────────────────────────
// Navbar Collections dropdown — all active categories
router.get('/active', getActiveCategories);

// CategoryPage — match by slug from useParams()
router.get('/slug/:slug', getCategoryBySlug);

// AdminCategory — all categories with product counts
router.get('/', getAllCategories);

// Single category by ID
router.get('/:id', getCategoryById);

// ─── Admin Protected Routes ──────────────────────────────────────
// AdminCategory "+ Add Category"
router.post('/', protect, createCategory);

// AdminCategory "Edit"
router.patch('/:id', protect, updateCategory);

// AdminCategory delete
router.delete('/:id', protect, deleteCategory);

export default router;