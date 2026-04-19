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
    title:        { type: String, required: [true, 'Product title is required'], trim: true },
    material:     { type: String, trim: true, default: '' },
    price:        { type: Number, required: [true, 'Price is required'], min: 0 },
    image:        { type: String, default: '' },       // main image URL

    // ── Gallery — additional product images ──────────────────────────────────
    gallery:      { type: [String], default: [] },     // array of Cloudinary URLs

    categorySlug: { type: String, required: true, lowercase: true, trim: true },
    description:  { type: String, trim: true, default: '' },
    details:      { type: [detailSchema], default: [] },
    stock:        { type: Number, default: 0, min: 0 },
    featured:     { type: Boolean, default: false },

    discountEnabled:  { type: Boolean, default: false },
    discountPercent:  { type: Number, default: 0, min: 0, max: 100 },
    discountedPrice:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-compute discountedPrice on save
productSchema.pre('save', function (next) {
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
productSchema.index({ title: 'text' });
productSchema.index({ discountEnabled: 1 });

module.exports = mongoose.model('Product', productSchema);