import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const Category = sequelize.define('Category', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  image: { type: DataTypes.STRING, defaultValue: '' },    // Railway Bucket URL
  imageKey: { type: DataTypes.STRING, defaultValue: '' }, // S3 key for deletion
}, { tableName: 'categories', timestamps: true });

export default Category;