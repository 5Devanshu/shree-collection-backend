import * as cartService from './cart.service.js';

// Helper: extract sessionId from request
// Cookie-based for persistent guest cart across page refreshes
const getSessionId = (req) => {
  const sessionId = req.cookies?.cartSessionId || req.headers['x-session-id'];
  if (!sessionId) throw new Error('Session ID is required');
  return sessionId;
};

// GET /api/cart
// Returns full cart — used by Checkout.jsx Order Summary panel
export const getCart = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const cart = await cartService.getCartService(sessionId);
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/cart/count
// Returns item count only — used by Navbar.jsx "Cart (0)"
export const getCartCount = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const result = await cartService.getCartCountService(sessionId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/cart/add
// Triggered by: "Add to Bag" button on ProductCard & ProductDescription
export const addToCart = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const cart = await cartService.addToCartService(sessionId, req.body);

    // Return updated item count alongside cart — Navbar uses count to update "Cart (N)"
    const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    res.status(200).json({ success: true, cart, count });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/cart/item/:productId
// Updates quantity of a specific cart item
export const updateCartItem = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { quantity } = req.body;
    const cart = await cartService.updateCartItemService(
      sessionId,
      req.params.productId,
      quantity
    );
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart/item/:productId
// Removes a single item from cart
export const removeFromCart = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const cart = await cartService.removeFromCartService(
      sessionId,
      req.params.productId
    );
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart/clear
// Clears full cart — called after successful order in Module 5 confirm flow
export const clearCart = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const result = await cartService.clearCartService(sessionId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};