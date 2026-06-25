import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    material: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    // Railway Bucket URL — served in ProductCard, ProductDescription, FeaturedGrid
    imageUrl: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    // S3 key — used for deletion from Railway Bucket
    imageKey: {
      type: DataTypes.STRING,
      defaultValue: '',
    },

    // Additional product images — [{ url, key }]
    gallery: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },

    // FK to Category — stored as UUID
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    // Slug copy for fast filtering without join
    categorySlug: {
      type: DataTypes.STRING,
      defaultValue: '',
    },

    // Product details — [{ label, value }]
    details: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },

    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    stockStatus: {
      type: DataTypes.ENUM('in_stock', 'low_stock', 'out_of_stock'),
      defaultValue: 'in_stock',
    },

    // Drives FeaturedGrid on homepage
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    discountEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    discountPercent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    discountedPrice: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    // Flat list of sizes — auto-generated server-side from sizeMin/sizeMax/sizeStep
    // when sizeEnabled is true. Kept as JSONB array for simple rendering on storefront.
    sizes: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },

    // ── Category-aware sizing ──────────────────────────────────────────────
    // Single source of truth for whether a size selector shows at all.
    // Replaces the old "guess from category name / ring slug" approach.
    sizeEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Admin-editable label shown above the size selector, e.g. "Necklace Size".
    // Auto-suggested from the product's category name when sizing is first enabled.
    sizeLabel: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    // Range the admin sets, e.g. min=1, max=10, step=1 → sizes [1,2,...,10]
    sizeMin: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    sizeMax: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    sizeStep: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 1,
    },
    // Per-size stock — only populated when admin enables size-wise inventory.
    // Shape: [{ size: 6, stock: 4 }, { size: 7, stock: 0 }, ...]
    // When empty, the storefront falls back to the single top-level `stock` field.
    sizeStock: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },

    colour:    { type: DataTypes.STRING, defaultValue: '' },
    plating:   { type: DataTypes.STRING, defaultValue: '' },
    stoneType: { type: DataTypes.STRING, defaultValue: '' },
    sku:       { type: DataTypes.STRING, defaultValue: '' },

    delivery: {
      type: DataTypes.STRING,
      defaultValue: 'Complimentary Express Shipping',
    },
    returns: {
      type: DataTypes.STRING,
      defaultValue: '30-day graceful returns',
    },
    resellerPrice: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,   // 0 means use normal price — admin sets this per product
    },
  },
  {
    tableName: 'products',
    timestamps: true,
    indexes: [
      { fields: ['categoryId'] },
      { fields: ['categorySlug'] },
      { fields: ['featured'] },
      { fields: ['stockStatus'] },
      { fields: ['discountEnabled'] },
    ],
  }
);

// Auto-compute discountedPrice before every save
Product.beforeSave((product) => {
  if (product.discountEnabled && product.discountPercent > 0) {
    product.discountedPrice = parseFloat(
      (product.price - (product.price * product.discountPercent) / 100).toFixed(2)
    );
  } else {
    product.discountedPrice = parseFloat(product.price);
  }
});

export default Product;