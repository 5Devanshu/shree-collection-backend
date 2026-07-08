import { Op } from 'sequelize';
import Cart    from './cart.model.js';
import Product from '../product/product.model.js';
import { findSizeEntry, resolveSizePrice, resolveSizeImage, resolveSizeColor } from '../product/product.service.js';

const getOrCreateCart = async (sessionId) => {
  const [cart] = await Cart.findOrCreate({
    where:    { sessionId },
    defaults: { sessionId, items: [] },
  });
  return cart;
};

// Two cart lines are "the same" only if productId AND size match. A product
// with no sizing has size === null, so it still dedupes normally.
const normalizeSizeKey = (size) =>
  size === undefined || size === null || size === '' ? null : Number(size);

const itemsMatch = (item, productId, size) =>
  item.productId === productId && normalizeSizeKey(item.size) === normalizeSizeKey(size);

export const getCartService = async (sessionId) => {
  const cart = await Cart.findOne({ where: { sessionId } });
  if (!cart) return { sessionId, items: [], subtotal: 0, shippingCost: 0, total: 0 };
  return cart.toJSON();
};

export const getCartCountService = async (sessionId) => {
  const cart = await Cart.findOne({ where: { sessionId } });
  if (!cart) return { count: 0 };
  const count = (cart.items || []).reduce((sum, i) => sum + i.quantity, 0);
  return { count };
};

export const addToCartService = async (sessionId, { productId, size, quantity = 1 }, isReseller = false) => {
  const product = await Product.findByPk(productId);
  if (!product) throw new Error('Product not found');
  if (product.stockStatus === 'out_of_stock') {
    throw new Error(`"${product.title}" is out of stock`);
  }

  // ── Resolve the size, if this product is sized ──────────────────────────
  const sizeKey   = normalizeSizeKey(size);
  const sizeEntry = product.sizeEnabled ? findSizeEntry(product, sizeKey) : null;

  if (product.sizeEnabled) {
    if (sizeKey === null) throw new Error(`Please select a size for "${product.title}"`);
    if (!sizeEntry) throw new Error(`"${product.title}" is not available in the selected size`);
    if ((sizeEntry.stock || 0) <= 0) {
      throw new Error(`"${product.title}" (size ${sizeKey}) is out of stock`);
    }
  }

  // ── Resolve price/image/color — size-specific values beat the base product ──
  const resolvedPrice = resolveSizePrice(product, sizeEntry, isReseller);
  const resolvedImage = product.sizeEnabled ? resolveSizeImage(product, sizeEntry) : (product.imageUrl || '');
  const resolvedColor = product.sizeEnabled ? resolveSizeColor(product, sizeEntry) : (product.colour || '');

  const cart  = await getOrCreateCart(sessionId);
  const items = [...(cart.items || [])];

  const existingIndex = items.findIndex((i) => itemsMatch(i, productId, sizeKey));

  if (existingIndex > -1) {
    items[existingIndex].quantity += quantity;
    items[existingIndex].price = resolvedPrice;   // update price if role/rate changed
    items[existingIndex].image = resolvedImage;
    items[existingIndex].color = resolvedColor;
  } else {
    items.push({
      productId,
      size:     sizeKey,
      title:    product.title,
      material: product.material || '',
      price:    resolvedPrice,                    // ← resolved price (size-aware)
      image:    resolvedImage,                    // ← resolved image (size-aware)
      color:    resolvedColor,                    // ← resolved colour (size-aware)
      quantity,
    });
  }

  cart.items = items;
  Cart.recalculate(cart);
  await cart.save();
  return cart.toJSON();
};

export const updateCartItemService = async (sessionId, productId, quantity, size) => {
  const cart = await Cart.findOne({ where: { sessionId } });
  if (!cart) throw new Error('Cart not found');

  let items = [...(cart.items || [])];
  const itemIndex = items.findIndex((i) => itemsMatch(i, productId, size));
  if (itemIndex === -1) throw new Error('Item not found in cart');

  if (quantity <= 0) {
    items.splice(itemIndex, 1);
  } else {
    items[itemIndex].quantity = quantity;
  }

  cart.items = items;
  Cart.recalculate(cart);
  await cart.save();
  return cart.toJSON();
};

export const removeFromCartService = async (sessionId, productId, size) => {
  const cart = await Cart.findOne({ where: { sessionId } });
  if (!cart) throw new Error('Cart not found');

  cart.items = (cart.items || []).filter((i) => !itemsMatch(i, productId, size));
  Cart.recalculate(cart);
  await cart.save();
  return cart.toJSON();
};

export const clearCartService = async (sessionId) => {
  const cart = await Cart.findOne({ where: { sessionId } });
  if (!cart) return { message: 'Cart already empty' };

  cart.items        = [];
  cart.subtotal     = 0;
  cart.shippingCost = 0;
  cart.total        = 0;
  await cart.save();
  return { message: 'Cart cleared' };
};