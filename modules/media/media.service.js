import { Op }    from 'sequelize';
import Media     from './media.model.js';
import Product   from '../product/product.model.js';
import { uploadToS3, deleteFromS3 } from '../../utils/uploadToS3.js';

// ─── Upload Single Image ──────────────────────────────────────────────────────
export const uploadImageService = async (
  fileBuffer, mimetype,
  { folder = 'product', altText = '', originalName = '', uploadedById = null, attachedProductId = null } = {}
) => {
  const { key, url } = await uploadToS3(fileBuffer, mimetype, folder);

  const media = await Media.create({
    originalName,
    s3Key:    key,
    url,
    secureUrl: url,
    mimeType:  mimetype,
    folder,
    altText,
    attachedProductId,
    uploadedById,
  });

  return media;
};

// ─── Upload Multiple Images ───────────────────────────────────────────────────
export const uploadMultipleImagesService = async (files, options = {}) => {
  return Promise.all(
    files.map(file => uploadImageService(file.buffer, file.mimetype, {
      ...options,
      originalName: file.originalname,
    }))
  );
};

// ─── Get All Media ────────────────────────────────────────────────────────────
export const getAllMediaService = async ({ folder, page = 1, limit = 30 } = {}) => {
  const where = {};
  if (folder) where.folder = folder;

  const offset = (Number(page) - 1) * Number(limit);

  const { rows: media, count: total } = await Media.findAndCountAll({
    where,
    order:  [['createdAt', 'DESC']],
    offset,
    limit:  Number(limit),
  });

  return { media, total, page: Number(page), limit: Number(limit) };
};

// ─── Get Single Media by ID ───────────────────────────────────────────────────
export const getMediaByIdService = async (id) => {
  const media = await Media.findByPk(id);
  if (!media) throw new Error('Media not found');
  return media;
};

// ─── Get Optimised URL ────────────────────────────────────────────────────────
export const getOptimisedUrlService = (url, context = 'product') => url;

// ─── Update Media Metadata ────────────────────────────────────────────────────
export const updateMediaService = async (id, { altText, attachedProductId, folder }) => {
  const media = await Media.findByPk(id);
  if (!media) throw new Error('Media not found');

  const updates = {};
  if (altText            !== undefined) updates.altText            = altText;
  if (attachedProductId  !== undefined) updates.attachedProductId  = attachedProductId;
  if (folder             !== undefined) updates.folder             = folder;

  await media.update(updates);
  return media;
};

// ─── Delete Image ─────────────────────────────────────────────────────────────
export const deleteMediaService = async (id) => {
  const media = await Media.findByPk(id);
  if (!media) throw new Error('Media not found');

  await deleteFromS3(media.s3Key);

  if (media.attachedProductId) {
    await Product.update(
      { imageUrl: '', imageKey: '' },
      { where: { id: media.attachedProductId } }
    );
  }

  await media.destroy();
  return { message: 'Image deleted successfully' };
};