import Product  from '../modules/product/product.model.js';
import Category from '../modules/category/category.model.js';
import Order    from '../modules/order/order.model.js';
import Admin    from '../modules/auth/auth.model.js';
import Media    from '../modules/media/media.model.js';
import Cart     from '../modules/cart/cart.model.js';
import Reseller from '../modules/reseller/reseller.model.js';
import Customer from '../modules/customer/customer.model.js';

// ── Product ↔ Category ────────────────────────────────────────────────────────
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product,   { foreignKey: 'categoryId', as: 'products' });

// ── Order ↔ Reseller (nullable — guest orders) ────────────────────────────────
Order.belongsTo(Reseller, { foreignKey: 'resellerId', as: 'reseller' });
Reseller.hasMany(Order,   { foreignKey: 'resellerId', as: 'orders' });

// ── Order ↔ Customer (nullable — guest orders) ────────────────────────────────
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customerAccount' });
Customer.hasMany(Order,   { foreignKey: 'customerId', as: 'orders' });

// ── Media ↔ Product ───────────────────────────────────────────────────────────
Media.belongsTo(Product, { foreignKey: 'attachedProductId', as: 'product' });

export { Product, Category, Order, Admin, Media, Cart, Reseller, Customer };