import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    // Primary product info
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',  // Alias for title
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
    
    // Image - supports both object and string format
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },  // for Cloudinary deletion
    },
    mainImage: {
      type: String,
      default: '',  // Alias for image.url
    },
    
    // Category - supports both reference and slug
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    categorySlug: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    
    stockStatus: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock'],
      default: 'in_stock',
    },
    
    // Featured & discounts
    featured: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,  // drives FeaturedGrid on homepage
    },
    
    discountEnabled: {
      type: Boolean,
      default: false,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountedPrice: {
      type: Number,
      default: 0,
    },
    
    // Additional fields
    tags: {
      type: [String],
      default: [],
    },
    details: {
      type: [Object],
      default: [],
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
productSchema.index({ featured: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ categorySlug: 1 });
productSchema.index({ discountEnabled: 1 });

// ── Pre-save hook: Auto-sync fields and calculate stockStatus ──────
productSchema.pre('save', function (next) {
  // Sync name ↔ title
  if (!this.name && this.title) {
    this.name = this.title;
  } else if (!this.title && this.name) {
    this.title = this.name;
  }
  
  // Sync mainImage ↔ image.url
  if (this.mainImage && !this.image?.url) {
    this.image = { ...this.image, url: this.mainImage };
  } else if (this.image?.url && !this.mainImage) {
    this.mainImage = this.image.url;
  }
  
  // Sync featured ↔ isFeatured
  if (this.isFeatured) {
    this.featured = true;
  } else if (this.featured) {
    this.isFeatured = true;
  }
  
  // Sync discountPercent ↔ discountPercentage
  if (this.discountPercentage && !this.discountPercent) {
    this.discountPercent = this.discountPercentage;
  } else if (this.discountPercent && !this.discountPercentage) {
    this.discountPercentage = this.discountPercent;
  }
  
  // Auto-calculate discountedPrice
  if (this.discountEnabled && this.discountPercent > 0) {
    this.discountedPrice = parseFloat(
      (this.price - (this.price * this.discountPercent) / 100).toFixed(2)
    );
  } else {
    this.discountedPrice = this.price;
  }
  
  // Auto-calculate stockStatus based on stock quantity
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