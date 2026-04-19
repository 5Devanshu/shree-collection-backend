import express from 'express';
import {
  getCart,
  getCartCount,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from './cart.controller.js';

const router = express.Router();

// ─── All Cart Routes are Public ──────────────────────────────────────────────
// No authentication required — Shree uses guest/session-based cart
// matching the storefront design (no login flow in frontend)

// Navbar.jsx "Cart (0)" — lightweight count only
router.get('/count', getCartCount);

// Checkout.jsx Order Summary panel — full cart with items + totals
router.get('/', getCart);

// ProductCard.jsx + ProductDescription.jsx "Add to Bag" button
router.post('/add', addToCart);

// Cart quantity +/- update
router.patch('/item/:productId', updateCartItem);

// Remove single item from cart
router.delete('/item/:productId', removeFromCart);

// Clear entire cart — called after Module 5 checkout confirm
router.delete('/clear', clearCart);

export default router;