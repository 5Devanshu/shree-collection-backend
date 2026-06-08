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
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    // Saved addresses — [{ label, line1, line2, city, state, pincode }]
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

// Hash password before create/update
Customer.beforeSave(async (customer) => {
  if (customer.changed('password')) {
    const salt = await bcrypt.genSalt(12);
    customer.password = await bcrypt.hash(customer.password, salt);
  }
});

// Instance method — used in customer.controller.js login
Customer.prototype.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default Customer;