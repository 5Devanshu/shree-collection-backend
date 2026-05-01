import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'Product title is required'],
      trim:     true,
    },
    description: {
      type:     String,
      required: [true, 'Product description is required'],
    },
    material: {
      type:     String,
      required: [true, 'Material is required'],
      trim:     true,
    },
    price: {
      type:     Number,
      required: [true, 'Price is required'],
      min:      0,
    },
    image: {
      url:      { type: String, required: true },
      publicId: { type: String, default: '' },
    },
    category: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Category',
      required: [true, 'Category is required'],
    },

    // ── Stock count — set by admin ────────────────────────────────────────────
    // stockStatus is auto-derived by pre-save hook — never set manually
    stock: {
      type:    Number,
      default: 10,
      min:     0,
    },

    // ── Stock status — auto-computed, do not set directly ────────────────────
    stockStatus: {
      type:    String,
      enum:    ['in_stock', 'low_stock', 'out_of_stock'],
      default: 'in_stock',
    },

    isFeatured: {
      type:    Boolean,
      default: false,
    },

    gallery: {
      type:    [String],
      default: [],
    },

    delivery: {
      type:    String,
      default: 'Complimentary Express Shipping',
    },
    returns: {
      type:    String,
      default: '30-day graceful returns',
    },
  },
  { timestamps: true }
);

// ── Auto-compute stockStatus on .save() ───────────────────────────────────────
productSchema.pre('save', function (next) {
  if      (this.stock === 0)     this.stockStatus = 'out_of_stock';
  else if (this.stock <= 5)      this.stockStatus = 'low_stock';
  else                           this.stockStatus = 'in_stock';
  next();
});

// ── Auto-compute stockStatus on .findByIdAndUpdate() / .patch() ───────────────
productSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.stock !== undefined) {
    if      (update.stock === 0)   update.stockStatus = 'out_of_stock';
    else if (update.stock <= 5)    update.stockStatus = 'low_stock';
    else                           update.stockStatus = 'in_stock';
    this.setUpdate(update);
  }
  next();
});

productSchema.index({ title: 'text', material: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ isFeatured: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;