const mongoose = require('mongoose');

const detailSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // Primary product info
    name:         { type: String, required: [true, 'Product name is required'], trim: true },
    title:        { type: String, trim: true, default: '' }, // alias for backward compatibility
    material:     { type: String, trim: true, default: '' },
    price:        { type: Number, required: [true, 'Price is required'], min: 0 },
    
    // Images
    mainImage:    { type: String, default: '' },       // main image URL (formerly: image)
    image:        { type: String, default: '' },       // backward compatibility
    images:       { type: [String], default: [] },     // array of Cloudinary URLs (formerly: gallery)
    gallery:      { type: [String], default: [] },     // backward compatibility

    // Category & Description
    categorySlug: { type: String, required: true, lowercase: true, trim: true },
    description:  { type: String, trim: true, default: '' },
    details:      { type: [detailSchema], default: [] },
    tags:         { type: [String], default: [] },
    
    // Stock & Featured
    stock:        { type: Number, default: 0, min: 0 },
    featured:     { type: Boolean, default: false },
    isFeatured:   { type: Boolean, default: false },    // alias for backward compatibility

    // Discounts
    discountEnabled:  { type: Boolean, default: false },
    discountPercent:  { type: Number, default: 0, min: 0, max: 100 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 }, // alias
    discountedPrice:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-compute discountedPrice on save
productSchema.pre('save', function (next) {
  // Ensure name field is set if only title is provided
  if (!this.name && this.title) {
    this.name = this.title;
  }
  
  // Sync image/mainImage
  if (this.mainImage && !this.image) {
    this.image = this.mainImage;
  } else if (this.image && !this.mainImage) {
    this.mainImage = this.image;
  }
  
  // Sync gallery/images
  if (this.gallery.length > 0 && this.images.length === 0) {
    this.images = this.gallery;
  } else if (this.images.length > 0 && this.gallery.length === 0) {
    this.gallery = this.images;
  }
  
  // Sync featured/isFeatured
  if (this.isFeatured) {
    this.featured = true;
  } else if (this.featured) {
    this.isFeatured = true;
  }
  
  // Sync discountPercent/discountPercentage
  if (this.discountPercentage && !this.discountPercent) {
    this.discountPercent = this.discountPercentage;
  } else if (this.discountPercent && !this.discountPercentage) {
    this.discountPercentage = this.discountPercent;
  }

  // Calculate discountedPrice
  if (this.discountEnabled && this.discountPercent > 0) {
    this.discountedPrice = parseFloat(
      (this.price - (this.price * this.discountPercent) / 100).toFixed(2)
    );
  } else {
    this.discountedPrice = this.price;
  }
  next();
});

productSchema.index({ categorySlug: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ name: 'text' });
productSchema.index({ title: 'text' });
productSchema.index({ discountEnabled: 1 });

module.exports = mongoose.model('Product', productSchema);