import mongoose from 'mongoose';

// Tracks every uploaded image in the Media Library
// Maps to AdminPanel.jsx sidebar → "Media Library" nav item
const mediaSchema = new mongoose.Schema(
  {
    // Original filename from the admin's machine
    originalName: {
      type: String,
      required: true,
    },

    // Cloudinary public ID — used for transformations and deletion
    publicId: {
      type: String,
      required: true,
      unique: true,
    },

    // Full CDN URL — served in:
    // ProductCard.jsx .product-image (4:5 aspect ratio object-fit cover)
    // ProductDescription.jsx .product-full-image (max 600px, object-fit contain)
    // FeaturedGrid.jsx product grid images
    // AdminProducts.jsx 40×40 thumbnail column
    // Hero.jsx full-bleed hero image
    url: {
      type: String,
      required: true,
    },

    // Secure HTTPS URL — always used in production
    secureUrl: {
      type: String,
      required: true,
    },

    // Image dimensions — useful for frontend layout calculations
    width:  { type: Number },
    height: { type: Number },

    // File metadata
    format:   { type: String },              // e.g. 'png', 'jpg', 'webp'
    bytes:    { type: Number },              // file size in bytes
    mimeType: { type: String },

    // Organisational tag — e.g. 'product', 'hero', 'category'
    // Allows Media Library to filter by usage context
    folder: {
      type: String,
      enum: ['product', 'hero', 'category', 'general'],
      default: 'general',
    },

    // Optional alt text for accessibility
    altText: {
      type: String,
      default: '',
    },

    // Tracks which product this image is attached to (if applicable)
    // Set when image is uploaded via AdminProducts
    attachedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },

    // Uploaded by which admin user
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast Media Library queries by folder/type
mediaSchema.index({ folder: 1, createdAt: -1 });

const Media = mongoose.model('Media', mediaSchema);
export default Media;