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
// Body: { productId, size?, color?, quantity }
// `size` is required whenever the product has sizeEnabled. `color` is
// additionally required whenever the chosen size has colour variants of its
// own (see product.service.js normalizeColorVariants) — the frontend's
// colour selector must send the chosen colour name here.
export const addToCart = async (req, res) => {
  try {
    const sessionId  = getSessionId(req);
    const isReseller = req.reseller != null;

    console.log('CART ADD DEBUG:', {
      isReseller,
      reseller: req.reseller,
      authHeader: req.headers.authorization?.slice(0, 30),
      size: req.body?.size,
      color: req.body?.color,
    });

    const cart = await cartService.addToCartService(sessionId, req.body, isReseller);
    const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    res.status(200).json({ success: true, cart, count });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/cart/item/:productId
// Updates quantity of a specific cart item.
// Body: { quantity, size?, color? } — size AND colour together distinguish
// between different variants of the same product sitting in the cart at once
// (two sizes, or the same size in two different colours).
export const updateCartItem = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { quantity, size, color } = req.body;
    const cart = await cartService.updateCartItemService(
      sessionId,
      req.params.productId,
      quantity,
      size,
      color
    );
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart/item/:productId
// Removes a single item from cart.
// Size and colour are read from the query string (?size=2.4&color=Rose%20Gold)
// since DELETE requests don't reliably carry a body through all clients/proxies.
export const removeFromCart = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const size  = req.query.size  ?? req.body?.size;
    const color = req.query.color ?? req.body?.color;
    const cart = await cartService.removeFromCartService(
      sessionId,
      req.params.productId,
      size,
      color
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