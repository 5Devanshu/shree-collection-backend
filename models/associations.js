// models/associations.js
// Import all Sequelize models and declare their associations here.
// This file must be imported once in server.js AFTER all model imports.

import Product  from '../modules/product/product.model.js';
import Category from '../modules/category/category.model.js';
import Customer from './Customer.js';
import Order    from '../modules/order/order.model.js';
import Media    from '../modules/media/media.model.js';
import Cart     from '../modules/cart/cart.model.js';
import Admin    from '../modules/auth/auth.model.js';

// Product ↔ Category
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product,   { foreignKey: 'categoryId', as: 'products' });

// Order ↔ Customer (optional FK — guest orders have null)
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customerAccount' });
Customer.hasMany(Order,   { foreignKey: 'customerId', as: 'orders' });

// Media ↔ Product (optional)
Media.belongsTo(Product, { foreignKey: 'attachedProductId', as: 'product' });

export { Product, Category, Customer, Order, Media, Cart, Admin };