import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const StockNotification = sequelize.define('StockNotification', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  productId: { type: DataTypes.UUID, allowNull: false },
  email:     { type: DataTypes.STRING, allowNull: false },
  notified:  { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'stock_notifications', timestamps: true });

export default StockNotification;