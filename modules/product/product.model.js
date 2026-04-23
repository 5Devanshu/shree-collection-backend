import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    material: {
      type: String,
      required: [true, 'Material is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      default: 0,
      min: 0,
    },
    image: {
      url: { type: String, required: true },
      publicId: { type: String },       // for Cloudinary deletion
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    stockStatus: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock'],
      default: 'in_stock',
    },
    isFeatured: {
      type: Boolean,
      default: false,                   // drives FeaturedGrid on homepage
    },
    delivery: {
      type: String,
      default: 'Complimentary Express Shipping',
    },
    returns: {
      type: String,
      default: '30-day graceful returns',
    },
  },
  { timestamps: true }
);

// Text index for search module
productSchema.index({ title: 'text', material: 'text', description: 'text' });

// ── Pre-save hook: Auto-calculate stockStatus based on stock quantity ──────
productSchema.pre('save', function (next) {
  if (this.stock === 0) {
    this.stockStatus = 'out_of_stock';
  } else if (this.stock > 0 && this.stock <= 5) {
    this.stockStatus = 'low_stock';
  } else {
    this.stockStatus = 'in_stock';
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;