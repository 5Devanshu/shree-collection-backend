import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

// Order table
// items, shippingAddress, customer snapshot stored as JSONB —
// avoids complex join tables while staying fully queryable in PostgreSQL
const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Human-readable order number — e.g. #ORD-001
    // Shown in AdminOrders and AdminDashboard tables
    orderNumber: {
      type: DataTypes.STRING,
      unique: true,
    },

    // Optional FK to Customer — null for guest orders
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
    },
    resellerId: { type: DataTypes.UUID, allowNull: true, defaultValue: null },

    // Contact email — Checkout.jsx Contact Information field
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Shipping address snapshot — Checkout.jsx Shipping Address section
    // { firstName, lastName, addressLine1, addressLine2, city, postalCode, country }
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    // Order items snapshot — Checkout.jsx Order Summary right panel
    // [{ productId, title, material, price, quantity, image }]
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    // Pricing — Checkout.jsx summary totals
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    shippingCost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    // Status — drives AdminOrders status badges
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
      defaultValue: 'pending',
    },

    // Payment
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'paid', 'failed', 'refunded'),
      defaultValue: 'unpaid',
    },
    paymentMethod: {
      type: DataTypes.STRING,
      defaultValue: 'card',
    },
    paymentReference: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      unique: true,
    },

    trackingNumber: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
  },
  {
    tableName: 'orders',
    timestamps: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['paymentStatus'] },
      { fields: ['createdAt'] },
      { fields: ['customerId'] },
      { fields: ['email'] },
    ],
  }
);

// Auto-generate orderNumber before first insert
Order.beforeCreate(async (order) => {
  const count = await Order.count();
  order.orderNumber = `#ORD-${String(count + 1).padStart(3, '0')}`;
});

export default Order;