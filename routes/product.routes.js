const express = require('express');
const router  = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleFeatured,
  updateStock,
} = require('../controllers/product.controller');

const { protect } = require('../middleware/auth.middleware');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/',    getProducts);
router.get('/:id', getProductById);

// ── Admin only ────────────────────────────────────────────────────────────────
router.post('/',                     protect, createProduct);
router.put('/:id',                   protect, updateProduct);
router.delete('/:id',               protect, deleteProduct);
router.patch('/:id/featured',       protect, toggleFeatured);
router.patch('/:id/stock',          protect, updateStock);

module.exports = router;