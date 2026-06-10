import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const Customer = sequelize.define(
  'Customer',
  {
    id:    { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name:  { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true,
             set(v) { this.setDataValue('email', String(v).toLowerCase().trim()); } },
    phone: { type: DataTypes.STRING, defaultValue: '' },

    // OTP login — store only the hash, never the code
    otpHash:      { type: DataTypes.STRING, defaultValue: null },
    otpExpiresAt: { type: DataTypes.DATE,   defaultValue: null },
    otpAttempts:  { type: DataTypes.INTEGER, defaultValue: 0 },

    isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
    lastLoginAt: { type: DataTypes.DATE, defaultValue: null },
  },
  { tableName: 'customers', timestamps: true, indexes: [{ fields: ['email'] }] }
);

export default Customer;