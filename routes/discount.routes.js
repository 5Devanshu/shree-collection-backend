const express = require('express');
const router  = express.Router();

const {
  setDiscount,
  enableDiscount,
  disableDiscount,
  removeDiscount,
  getDiscountedProducts,
} = require('../controllers/discount.controller');

const { protect } = require('../middleware/auth.middleware');

// Public — customers can browse discounted products
router.get('/', getDiscountedProducts);

// Admin only
router.put('/:productId',          protect, setDiscount);
router.patch('/:productId/enable', protect, enableDiscount);
router.patch('/:productId/disable',protect, disableDiscount);
router.delete('/:productId',       protect, removeDiscount);

module.exports = router;