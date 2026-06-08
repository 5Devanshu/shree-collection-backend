import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../../config/db.js';

const Admin = sequelize.define(
  'Admin',
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
    role: {
      type: DataTypes.ENUM('admin', 'superadmin'),
      defaultValue: 'admin',
    },
  },
  {
    tableName: 'admins',
    timestamps: true,
  }
);

Admin.beforeCreate(async (admin) => {
  admin.password = await bcrypt.hash(admin.password, 12);
});

Admin.beforeUpdate(async (admin) => {
  if (admin.changed('password')) {
    admin.password = await bcrypt.hash(admin.password, 12);
  }
});

Admin.prototype.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default Admin;