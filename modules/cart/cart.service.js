import { Op } from 'sequelize';
import Cart    from './cart.model.js';
import Product from '../product/product.model.js';

const getOrCreateCart = async (sessionId) => {
  const [cart] = await Cart.findOrCreate({
    where:    { sessionId },
    defaults: { sessionId, items: [] },
  });
  return cart;
};

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

export const addToCartService = async (sessionId, { productId, quantity = 1 }) => {
  const product = await Product.findByPk(productId);
  if (!product) throw new Error('Product not found');
  if (product.stockStatus === 'out_of_stock') {
    throw new Error(`"${product.title}" is out of stock`);
  }

  const cart  = await getOrCreateCart(sessionId);
  const items = [...(cart.items || [])];

  const existingIndex = items.findIndex((i) => i.productId === productId);

  if (existingIndex > -1) {
    items[existingIndex].quantity += quantity;
  } else {
    items.push({
      productId,
      title:    product.title,
      material: product.material || '',
      price:    parseFloat(product.price),
      image:    product.imageUrl || '',
      quantity,
    });
  }

  cart.items = items;
  Cart.recalculate(cart);
  await cart.save();
  return cart.toJSON();
};

export const updateCartItemService = async (sessionId, productId, quantity) => {
  const cart = await Cart.findOne({ where: { sessionId } });
  if (!cart) throw new Error('Cart not found');

  let items = [...(cart.items || [])];
  const itemIndex = items.findIndex((i) => i.productId === productId);
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

export const removeFromCartService = async (sessionId, productId) => {
  const cart = await Cart.findOne({ where: { sessionId } });
  if (!cart) throw new Error('Cart not found');

  cart.items = (cart.items || []).filter((i) => i.productId !== productId);
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