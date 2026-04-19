const express = require('express');
const router  = express.Router();

const {
  subscribe,
  updateStock,
  getSubscribers,
} = require('../controllers/stock.notify.controller');

const { protect }          = require('../middleware/auth.middleware');
const { attachCustomer }   = require('../middleware/customer.auth.middleware');

// Public — attach customer if logged in so customerId is saved with subscription
router.post('/:productId/subscribe', attachCustomer, subscribe);

// Admin only
router.patch('/:productId/update-stock', protect, updateStock);
router.get('/:productId/subscribers',    protect, getSubscribers);

module.exports = router;