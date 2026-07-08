import { Op } from 'sequelize';
import Cart    from './cart.model.js';
import Product from '../product/product.model.js';
import {
  findSizeEntry, findColorVariant,
  resolveSizePrice, resolveVariantImage, resolveVariantStock,
} from '../product/product.service.js';

const getOrCreateCart = async (sessionId) => {
  const [cart] = await Cart.findOrCreate({
    where:    { sessionId },
    defaults: { sessionId, items: [] },
  });
  return cart;
};

const normalizeSizeKey = (size) =>
  size === undefined || size === null || size === '' ? null : Number(size);

// Colour is compared case-insensitively as free text (matches
// findColorVariant's own matching rule).
const normalizeColorKey = (color) =>
  color === undefined || color === null || color === '' ? null : String(color).trim().toLowerCase();

// Two cart lines are "the same" only if productId AND size AND colour all
// match. A product with no sizing has size === null and colour === null, so
// it still dedupes normally. Two different colours of the same size are now
// separate lines, same as two different sizes always were.
const itemsMatch = (item, productId, size, color) =>
  item.productId === productId &&
  normalizeSizeKey(item.size)   === normalizeSizeKey(size) &&
  normalizeColorKey(item.color) === normalizeColorKey(color);

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

export const addToCartService = async (sessionId, { productId, size, color, quantity = 1 }, isReseller = false) => {
  const product = await Product.findByPk(productId);
  if (!product) throw new Error('Product not found');
  if (product.stockStatus === 'out_of_stock') {
    throw new Error(`"${product.title}" is out of stock`);
  }

  // ── Resolve the size, if this product is sized ──────────────────────────
  const sizeKey   = normalizeSizeKey(size);
  const sizeEntry = product.sizeEnabled ? findSizeEntry(product, sizeKey) : null;

  // ── Resolve the colour variant, if this size has colour options ─────────
  // A size with colours REQUIRES one to be picked; a size with none behaves
  // exactly like before (no colour selection needed).
  let colorVariant = null;

  if (product.sizeEnabled) {
    if (sizeKey === null) throw new Error(`Please select a size for "${product.title}"`);
    if (!sizeEntry) throw new Error(`"${product.title}" is not available in the selected size`);

    const hasColorOptions = Array.isArray(sizeEntry.colors) && sizeEntry.colors.length > 0;

    if (hasColorOptions) {
      if (!color) throw new Error(`Please select a colour for "${product.title}" (size ${sizeKey})`);
      colorVariant = findColorVariant(sizeEntry, color);
      if (!colorVariant) {
        throw new Error(`"${product.title}" is not available in the selected colour for size ${sizeKey}`);
      }
    }

    const stockAvailable = resolveVariantStock(sizeEntry, colorVariant);
    if (stockAvailable <= 0) {
      const label = colorVariant ? `${sizeKey}, ${colorVariant.color}` : `${sizeKey}`;
      throw new Error(`"${product.title}" (size ${label}) is out of stock`);
    }
  }

  // ── Resolve price/image — price is size-level only; image is colour-aware ──
  const resolvedPrice = resolveSizePrice(product, sizeEntry, isReseller);
  const resolvedImage = product.sizeEnabled
    ? resolveVariantImage(product, colorVariant)
    : (product.imageUrl || '');
  const resolvedColor = colorVariant?.color || (!product.sizeEnabled ? (product.colour || '') : '');
  const colorKey       = resolvedColor || null;

  const cart  = await getOrCreateCart(sessionId);
  const items = [...(cart.items || [])];

  const existingIndex = items.findIndex((i) => itemsMatch(i, productId, sizeKey, colorKey));

  if (existingIndex > -1) {
    items[existingIndex].quantity += quantity;
    items[existingIndex].price = resolvedPrice;
    items[existingIndex].image = resolvedImage;
    items[existingIndex].color = colorKey;
  } else {
    items.push({
      productId,
      size:     sizeKey,
      color:    colorKey,
      title:    product.title,
      material: product.material || '',
      price:    resolvedPrice,
      image:    resolvedImage,
      quantity,
    });
  }

  cart.items = items;
  Cart.recalculate(cart);
  await cart.save();
  return cart.toJSON();
};

export const updateCartItemService = async (sessionId, productId, quantity, size, color) => {
  const cart = await Cart.findOne({ where: { sessionId } });
  if (!cart) throw new Error('Cart not found');

  let items = [...(cart.items || [])];
  const itemIndex = items.findIndex((i) => itemsMatch(i, productId, size, color));
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

export const removeFromCartService = async (sessionId, productId, size, color) => {
  const cart = await Cart.findOne({ where: { sessionId } });
  if (!cart) throw new Error('Cart not found');

  cart.items = (cart.items || []).filter((i) => !itemsMatch(i, productId, size, color));
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