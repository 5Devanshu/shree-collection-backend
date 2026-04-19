import cloudinary from '../../config/cloudinary.js';
import Media from './media.model.js';
import Product from '../product/product.model.js';

// ─── Upload Single Image ──────────────────────────────────────────────────────
// Used by: AdminProducts image upload when adding/editing a product
// Also feeds the Media Library browser in AdminPanel sidebar
export const uploadImageService = async (fileBuffer, { folder = 'product', altText = '', uploadedBy = null, attachedProduct = null } = {}) => {
  // Upload to Cloudinary — stored under /shree/{folder}/
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:         `shree/${folder}`,
        resource_type:  'image',
        // Auto-format: serves WebP to modern browsers, PNG/JPG as fallback
        // Keeps product images crisp on high-DPI screens (ProductDescription full image)
        fetch_format:   'auto',
        quality:        'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });

  // Persist record to Media Library database
  const media = await Media.create({
    originalName:    result.original_filename,
    publicId:        result.public_id,
    url:             result.url,
    secureUrl:       result.secure_url,
    width:           result.width,
    height:          result.height,
    format:          result.format,
    bytes:           result.bytes,
    mimeType:        `image/${result.format}`,
    folder,
    altText,
    attachedProduct,
    uploadedBy,
  });

  return media;
};

// ─── Upload Multiple Images ───────────────────────────────────────────────────
// Bulk upload — used by Media Library batch upload in AdminPanel
export const uploadMultipleImagesService = async (files, options = {}) => {
  const uploads = files.map((file) =>
    uploadImageService(file.buffer, { ...options, originalName: file.originalname })
  );
  return Promise.all(uploads);
};

// ─── Get All Media ────────────────────────────────────────────────────────────
// Feeds the AdminPanel Media Library browser
// Supports filtering by folder (product / hero / category / general)
export const getAllMediaService = async ({ folder, page = 1, limit = 30 } = {}) => {
  const filter = {};
  if (folder) filter.folder = folder;

  const skip = (page - 1) * limit;

  const [media, total] = await Promise.all([
    Media.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('attachedProduct', 'title')
      .populate('uploadedBy', 'name'),
    Media.countDocuments(filter),
  ]);

  return { media, total, page: Number(page), limit: Number(limit) };
};

// ─── Get Single Media by ID ───────────────────────────────────────────────────
// Used to prefill image when editing a product in AdminProducts
export const getMediaByIdService = async (id) => {
  const media = await Media.findById(id)
    .populate('attachedProduct', 'title')
    .populate('uploadedBy', 'name');
  if (!media) throw new Error('Media not found');
  return media;
};

// ─── Get Optimised Image URL ──────────────────────────────────────────────────
// Generates context-aware Cloudinary transformation URLs
// ProductCard.jsx  → 4:5 portrait crop, 600px wide, auto quality
// ProductDescription.jsx → 1200px wide, object-fit contain equivalent
// AdminProducts.jsx → 80px thumbnail (40×40 @2x retina)
// Hero.jsx         → full-width 1920px, auto quality, slight darkening
export const getOptimisedUrlService = (publicId, context = 'product') => {
  const transformations = {
    product: {
      width:   600,
      crop:    'fill',
      gravity: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
    },
    detail: {
      width:   1200,
      crop:    'limit',
      quality: 'auto',
      fetch_format: 'auto',
    },
    thumbnail: {
      width:   80,
      height:  80,
      crop:    'fill',
      gravity: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
    },
    hero: {
      width:   1920,
      crop:    'fill',
      gravity: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
      effect:  'brightness:-10',           // subtle darkening for text legibility
    },
  };

  const transformation = transformations[context] || transformations.product;
  return cloudinary.url(publicId, transformation);
};

// ─── Update Media Metadata ────────────────────────────────────────────────────
// Update alt text or attached product from Media Library
export const updateMediaService = async (id, { altText, attachedProduct, folder }) => {
  const updates = {};
  if (altText !== undefined)        updates.altText = altText;
  if (attachedProduct !== undefined) updates.attachedProduct = attachedProduct;
  if (folder !== undefined)         updates.folder = folder;

  const media = await Media.findByIdAndUpdate(id, updates, { new: true });
  if (!media) throw new Error('Media not found');
  return media;
};

// ─── Delete Image ─────────────────────────────────────────────────────────────
// Deletes from both Cloudinary and the Media Library database record.
// If image is attached to a product, clears the product image reference too.
export const deleteMediaService = async (id) => {
  const media = await Media.findById(id);
  if (!media) throw new Error('Media not found');

  // Remove from Cloudinary CDN
  await cloudinary.uploader.destroy(media.publicId);

  // If attached to a product — clear the product's image field
  if (media.attachedProduct) {
    await Product.findByIdAndUpdate(media.attachedProduct, {
      $unset: { image: '' },
    });
  }

  await Media.findByIdAndDelete(id);
  return { message: 'Image deleted successfully' };
};