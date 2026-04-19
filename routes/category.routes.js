const express = require('express');
const router  = express.Router();

const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');

const { protect } = require('../middleware/auth.middleware');

// Public
router.get('/',      getCategories);
router.get('/:slug', getCategoryBySlug);

// Admin only
router.post('/',       protect, createCategory);
router.put('/:id',    protect, updateCategory);
router.delete('/:id', protect, deleteCategory);

module.exports = router;