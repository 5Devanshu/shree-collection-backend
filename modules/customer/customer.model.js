import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../../config/db.js';

const Customer = sequelize.define(
  'Customer',
  {
    id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name:     { type: DataTypes.STRING, allowNull: false },

    // All three are optional individually — but at least one must be provided (enforced in controller)
    email:    { type: DataTypes.STRING, allowNull: true, unique: true,
                set(v) { this.setDataValue('email', v ? String(v).toLowerCase().trim() : null); } },
    phone:    { type: DataTypes.STRING, allowNull: true, unique: true },
    username: { type: DataTypes.STRING, allowNull: true, unique: true,
                set(v) { this.setDataValue('username', v ? String(v).toLowerCase().trim() : null); } },

    password: { type: DataTypes.STRING, allowNull: false },

    // Shipping address stored as JSON
    address: {
      type: DataTypes.JSONB,
      defaultValue: null,
      // { line1, line2, city, state, pincode, country }
    },

    // OTP login — only usable if email is present
    otpHash:      { type: DataTypes.STRING,  allowNull: true, defaultValue: null },
    otpExpiresAt: { type: DataTypes.DATE,    allowNull: true, defaultValue: null },
    otpAttempts:  { type: DataTypes.INTEGER, defaultValue: 0 },

    isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
    lastLoginAt: { type: DataTypes.DATE,    defaultValue: null },
  },
  {
    tableName: 'customers',
    timestamps: true,
    indexes: [
      { fields: ['email'],    where: { email:    { [Symbol.for('ne')]: null } } },
      { fields: ['phone'],    where: { phone:    { [Symbol.for('ne')]: null } } },
      { fields: ['username'], where: { username: { [Symbol.for('ne')]: null } } },
    ],
  }
);

Customer.beforeCreate(async (c) => {
  c.password = await bcrypt.hash(c.password, 12);
});

Customer.beforeUpdate(async (c) => {
  if (c.changed('password')) c.password = await bcrypt.hash(c.password, 12);
});

Customer.prototype.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default Customer;