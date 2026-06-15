import * as mediaService from './media.service.js';

// ─── POST /api/media/upload ───────────────────────────────────────────────────
// Single image upload — AdminProducts product image field
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const { folder, altText, attachedProduct } = req.body;

    const media = await mediaService.uploadImageService(
      req.file.buffer,
      req.file.mimetype,
      {
        folder:          folder || 'product',
        altText:         altText || '',
        originalName:    req.file.originalname,
        attachedProduct: attachedProduct || null,
        uploadedBy:      req.admin?.id || null,
      }
    );

    res.status(201).json({ success: true, media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/media/upload-multiple ─────────────────────────────────────────
// Batch upload — AdminPanel Media Library bulk upload
export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files provided' });
    }

    const { folder } = req.body;

    const media = await mediaService.uploadMultipleImagesService(req.files, {
      folder:     folder || 'general',
      uploadedBy: req.admin?.id || null,
    });

    res.status(201).json({ success: true, media, count: media.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/media ───────────────────────────────────────────────────────────
// All media with optional folder filter and pagination
// Powers the AdminPanel Media Library browser
export const getAllMedia = async (req, res) => {
  try {
    const result = await mediaService.getAllMediaService(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/media/optimised-url ────────────────────────────────────────────
// Railway Bucket has no native transforms — returns the stored URL as-is
// Kept for API compatibility with frontend calls that previously used Cloudinary
// NOTE: Must be registered BEFORE /:id route in media.routes.js
export const getOptimisedUrl = (req, res) => {
  try {
    const { url, context } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: 'url is required' });
    }
    // Pass url (not publicId) — service returns it unchanged for now
    const optimisedUrl = mediaService.getOptimisedUrlService(url, context || 'product');
    res.status(200).json({ success: true, url: optimisedUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/media/:id ───────────────────────────────────────────────────────
// Single media item — prefill when editing a product in AdminProducts
export const getMediaById = async (req, res) => {
  try {
    const media = await mediaService.getMediaByIdService(req.params.id);
    res.status(200).json({ success: true, media });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// ─── PATCH /api/media/:id ─────────────────────────────────────────────────────
// Update alt text, folder, or attached product
export const updateMedia = async (req, res) => {
  try {
    const media = await mediaService.updateMediaService(req.params.id, req.body);
    res.status(200).json({ success: true, media });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/media/:id ────────────────────────────────────────────────────
// Delete from Railway Bucket + Media table + clears product image reference
export const deleteMedia = async (req, res) => {
  try {
    const result = await mediaService.deleteMediaService(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// Add this new handler — GET /api/media/file/:key
export const serveFile = async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const s3Module = await import('../../config/storage.js');
    const s3 = s3Module.default;
    const BUCKET_NAME = s3Module.BUCKET_NAME;

    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // Redirect to presigned URL — browser fetches directly from S3
    res.redirect(302, signedUrl);
  } catch (error) {
    res.status(404).json({ success: false, message: 'File not found' });
  }
};