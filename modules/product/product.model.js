import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';
import Category from '../category/category.model.js';

const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  material: { type: DataTypes.STRING },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  imageUrl: { type: DataTypes.STRING, defaultValue: '' },  // Railway Bucket URL
  imageKey: { type: DataTypes.STRING, defaultValue: '' },  // S3 key
  gallery: { type: DataTypes.JSONB, defaultValue: [] },    // [{url, key}]
  categorySlug: { type: DataTypes.STRING },
  details: { type: DataTypes.JSONB, defaultValue: [] },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  featured: { type: DataTypes.BOOLEAN, defaultValue: false },
  discountEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  discountPercent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  discountedPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  sizes: { type: DataTypes.JSONB, defaultValue: [] },
  stockStatus: {
    type: DataTypes.ENUM('in_stock', 'low_stock', 'out_of_stock'),
    defaultValue: 'in_stock',
  },
}, { tableName: 'products', timestamps: true });

// Auto-compute discountedPrice
Product.beforeSave((product) => {
  if (product.discountEnabled && product.discountPercent > 0) {
    product.discountedPrice = parseFloat(
      (product.price - (product.price * product.discountPercent) / 100).toFixed(2)
    );
  } else {
    product.discountedPrice = product.price;
  }
});

Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId' });

export default Product;