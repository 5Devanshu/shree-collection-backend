import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const CustomPayment = sequelize.define(
  'CustomPayment',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    merchantOrderId: { type: DataTypes.STRING, allowNull: false, unique: true },
    customerName: { type: DataTypes.STRING, allowNull: false },
    customerMobile: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'INR' },
    gateway: { type: DataTypes.STRING, allowNull: false, defaultValue: 'phonepe' },
    gatewayOrderId: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    gatewayTransactionId: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    paymentStatus: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'EXPIRED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    paymentMethod: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    webhookVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    lastGatewayState: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
  },
  {
    tableName: 'custom_payments',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['merchantOrderId'] },
      { fields: ['paymentStatus'] },
      { fields: ['createdAt'] },
    ],
  }
);

export default CustomPayment;
