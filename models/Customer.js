import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/db.js';

const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING },
  password: { type: DataTypes.STRING, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  // Stored as JSON array of address objects
  savedAddresses: { type: DataTypes.JSONB, defaultValue: [] },
}, { tableName: 'customers', timestamps: true });

Customer.beforeSave(async (customer) => {
  if (customer.changed('password')) {
    customer.password = await bcrypt.hash(customer.password, 12);
  }
});

Customer.prototype.matchPassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default Customer;