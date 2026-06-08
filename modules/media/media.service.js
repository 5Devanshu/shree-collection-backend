import Media from './media.model.js';
import Product from '../product/product.model.js';
import { uploadToS3, deleteFromS3 } from '../../utils/uploadToS3.js';

// ─── Upload Single Image ──────────────────────────────────────────────────────
// Used by: AdminProducts image upload when adding/editing a product
// Also feeds the Media Library browser in AdminPanel sidebar
export const uploadImageService = async (
  fileBuffer,
  mimetype,
  { folder = 'product', altText = '', uploadedBy = null, attachedProduct = null } = {}
) => {
  const { key, url } = await uploadToS3(fileBuffer, mimetype, folder);

  const media = await Media.create({
    originalName:    '',          // multer doesn't expose this here; set in controller if needed
    s3Key:           key,
    url,
    secureUrl:       url,         // Railway Bucket URLs are already HTTPS
    mimeType:        mimetype,
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
    uploadImageService(file.buffer, file.mimetype, {
      ...options,
    })
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

// ─── Get Optimised URL ────────────────────────────────────────────────────────
// Railway Bucket has no built-in transformations like Cloudinary.
// Return the raw URL — resize on the frontend via CSS or use a separate
// image CDN (e.g. Imgix, Cloudflare Images) if transformations are needed.
// Context param is kept for API compatibility but is unused for now.
export const getOptimisedUrlService = (url, context = 'product') => {
  // Future: append width/quality params if using an image proxy in front of the bucket
  return url;
};

// ─── Update Media Metadata ────────────────────────────────────────────────────
// Update alt text or attached product from Media Library
export const updateMediaService = async (id, { altText, attachedProduct, folder }) => {
  const updates = {};
  if (altText !== undefined)         updates.altText = altText;
  if (attachedProduct !== undefined) updates.attachedProduct = attachedProduct;
  if (folder !== undefined)          updates.folder = folder;

  const media = await Media.findByIdAndUpdate(id, updates, { new: true });
  if (!media) throw new Error('Media not found');
  return media;
};

// ─── Delete Image ─────────────────────────────────────────────────────────────
// Deletes from Railway Bucket + Media Library DB record.
// If image is attached to a product, clears the product image reference too.
export const deleteMediaService = async (id) => {
  const media = await Media.findById(id);
  if (!media) throw new Error('Media not found');

  // Remove from Railway Bucket
  await deleteFromS3(media.s3Key);

  // If attached to a product — clear the product's image fields
  if (media.attachedProduct) {
    await Product.findByIdAndUpdate(media.attachedProduct, {
      $unset: { imageUrl: '', imageKey: '' },
    });
  }

  await Media.findByIdAndDelete(id);
  return { message: 'Image deleted successfully' };
};