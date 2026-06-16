import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  // Either customerId or resellerId will be set — not both
  customerId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  resellerId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  reviewerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  reviewerType: {
    type: DataTypes.ENUM('customer', 'reseller'),
    allowNull: false,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'reviews',
  timestamps: true,
  indexes: [
    { fields: ['productId'] },
    { fields: ['customerId'] },
    { fields: ['resellerId'] },
  ],
});

export default Review;