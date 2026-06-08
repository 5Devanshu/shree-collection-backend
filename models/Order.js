import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Customer from './Customer.js';

const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  customerId: { type: DataTypes.UUID, allowNull: true },
  items: { type: DataTypes.JSONB, allowNull: false },         // [{productId, title, price, qty...}]
  customer: { type: DataTypes.JSONB, allowNull: false },      // snapshot {name, email, phone, address}
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  shippingCost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending',
  },
  paymentStatus: {
    type: DataTypes.ENUM('unpaid', 'paid', 'failed', 'refunded'),
    defaultValue: 'unpaid',
  },
  cashfreeOrderId: { type: DataTypes.STRING, defaultValue: '' },
  cashfreePaymentId: { type: DataTypes.STRING, defaultValue: '' },
  cashfreePaymentSessionId: { type: DataTypes.STRING, defaultValue: '' },
  trackingNumber: { type: DataTypes.STRING, defaultValue: '' },
}, { tableName: 'orders', timestamps: true });

Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customerAccount' });

export default Order;