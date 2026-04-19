import Cart from './cart.model.js';
import Product from '../product/product.model.js';

// ─── Helper: get or create cart by sessionId ─────────────────────────────────
// sessionId drives the guest cart — linked to Navbar Cart (0) counter
const getOrCreateCart = async (sessionId) => {
  let cart = await Cart.findOne({ sessionId });
  if (!cart) cart = new Cart({ sessionId, items: [] });
  return cart;
};

// ─── Get Cart ────────────────────────────────────────────────────────────────
// Returns current cart with all items, subtotal, shipping, total.
// Used to populate: Navbar Cart (0) count + Checkout.jsx Order Summary panel.
export const getCartService = async (sessionId) => {
  const cart = await Cart.findOne({ sessionId }).populate(
    'items.product',
    'title material price image stockStatus'
  );
  if (!cart) return { sessionId, items: [], subtotal: 0, shippingCost: 0, total: 0 };
  return cart;
};

// ─── Add Item to Cart ────────────────────────────────────────────────────────
// Triggered by: ProductCard.jsx "Add to Bag" button
//               ProductDescription.jsx "Add to Bag" button
export const addToCartService = async (sessionId, { productId, quantity = 1 }) => {
  const product = await Product.findById(productId);
  if (!product)                              throw new Error('Product not found');
  if (product.stockStatus === 'out_of_stock') throw new Error(`"${product.title}" is out of stock`);

  const cart = await getOrCreateCart(sessionId);

  // If product already in cart — increment quantity
  const existingIndex = cart.items.findIndex(
    (i) => i.product.toString() === productId
  );

  if (existingIndex > -1) {
    cart.items[existingIndex].quantity += quantity;
  } else {
    // Add new item — snapshot product fields at time of adding
    cart.items.push({
      product:  product._id,
      title:    product.title,
      material: product.material,
      price:    product.price,
      image:    product.image?.url || '',
      quantity,
    });
  }

  await cart.save();
  return cart;
};

// ─── Update Item Quantity ────────────────────────────────────────────────────
// Triggered by quantity +/- controls in cart UI
// If quantity reaches 0, item is automatically removed
export const updateCartItemService = async (sessionId, productId, quantity) => {
  const cart = await Cart.findOne({ sessionId });
  if (!cart) throw new Error('Cart not found');

  const itemIndex = cart.items.findIndex(
    (i) => i.product.toString() === productId
  );
  if (itemIndex === -1) throw new Error('Item not found in cart');

  if (quantity <= 0) {
    // Remove item if quantity is set to zero
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  await cart.save();
  return cart;
};

// ─── Remove Item from Cart ───────────────────────────────────────────────────
// Triggered by remove/delete action on a cart item
export const removeFromCartService = async (sessionId, productId) => {
  const cart = await Cart.findOne({ sessionId });
  if (!cart) throw new Error('Cart not found');

  cart.items = cart.items.filter(
    (i) => i.product.toString() !== productId
  );

  await cart.save();
  return cart;
};

// ─── Clear Cart ──────────────────────────────────────────────────────────────
// Called after a successful checkout (Module 5 confirm flow)
// Empties the cart so Navbar Cart (0) resets to zero
export const clearCartService = async (sessionId) => {
  const cart = await Cart.findOne({ sessionId });
  if (!cart) return { message: 'Cart already empty' };

  cart.items = [];
  await cart.save();
  return { message: 'Cart cleared successfully' };
};

// ─── Get Cart Item Count ─────────────────────────────────────────────────────
// Lightweight query — drives Navbar.jsx "Cart (0)" live count
export const getCartCountService = async (sessionId) => {
  const cart = await Cart.findOne({ sessionId });
  if (!cart) return { count: 0 };

  const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  return { count };
};