import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/db.js';

const Customer = sequelize.define(
  'Customer',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    // No select:false in Sequelize — password is always fetched
    // Never expose it in controller responses manually
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    savedAddresses: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'customers',
    timestamps: true,
  }
);

// Use beforeCreate + beforeUpdate separately — Sequelize has no beforeSave
Customer.beforeCreate(async (customer) => {
  const salt = await bcrypt.genSalt(12);
  customer.password = await bcrypt.hash(customer.password, salt);
});

Customer.beforeUpdate(async (customer) => {
  if (customer.changed('password')) {
    const salt = await bcrypt.genSalt(12);
    customer.password = await bcrypt.hash(customer.password, salt);
  }
});

Customer.prototype.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default Customer;