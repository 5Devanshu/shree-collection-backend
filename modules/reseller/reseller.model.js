import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../../config/db.js';

const Reseller = sequelize.define('Reseller', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:     { type: DataTypes.STRING, allowNull: false },
  email:    { type: DataTypes.STRING, allowNull: true, unique: true,
              set(v) { this.setDataValue('email', v ? String(v).toLowerCase().trim() : null); } },
  phone:    { type: DataTypes.STRING, allowNull: true, unique: true },
  username: { type: DataTypes.STRING, allowNull: true, unique: true,
              set(v) { this.setDataValue('username', v ? String(v).toLowerCase().trim() : null); } },
  password: { type: DataTypes.STRING, allowNull: false },
  company:  { type: DataTypes.STRING, defaultValue: '' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  status:   { type: DataTypes.ENUM('pending', 'verified', 'rejected'), defaultValue: 'pending' },
  verifiedAt:   { type: DataTypes.DATE,    defaultValue: null },
  otpHash:      { type: DataTypes.STRING,  allowNull: true, defaultValue: null },
  otpExpiresAt: { type: DataTypes.DATE,    allowNull: true, defaultValue: null },
  otpAttempts:  { type: DataTypes.INTEGER, defaultValue: 0 },
  isVerified:   { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'resellers', timestamps: true });

Reseller.beforeCreate(async (r) => {
  r.password = await bcrypt.hash(r.password, 12);
});
Reseller.beforeUpdate(async (r) => {
  if (r.changed('password')) r.password = await bcrypt.hash(r.password, 12);
});
Reseller.prototype.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default Reseller;