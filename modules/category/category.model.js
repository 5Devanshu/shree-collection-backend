import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    // slug drives URL — e.g. "rings" → /collections/rings
    // matches useParams() in CategoryPage.jsx
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    // Railway Bucket URL — category image
    image: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    // S3 key for deletion
    imageKey: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'categories',
    timestamps: true,
    indexes: [
      { fields: ['slug'] },
      { fields: ['isActive'] },
    ],
  }
);

export default Category;