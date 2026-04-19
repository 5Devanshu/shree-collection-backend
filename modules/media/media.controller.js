import * as mediaService from './media.service.js';

// POST /api/media/upload
// Single image upload — AdminProducts product image field
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const { folder, altText, attachedProduct } = req.body;

    const media = await mediaService.uploadImageService(req.file.buffer, {
      folder:          folder || 'product',
      altText:         altText || '',
      attachedProduct: attachedProduct || null,
      uploadedBy:      req.admin?._id || null,
    });

    res.status(201).json({ success: true, media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/media/upload-multiple
// Batch upload — AdminPanel Media Library bulk upload
export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files provided' });
    }

    const { folder } = req.body;

    const media = await mediaService.uploadMultipleImagesService(req.files, {
      folder:     folder || 'general',
      uploadedBy: req.admin?._id || null,
    });

    res.status(201).json({ success: true, media, count: media.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/media
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

// GET /api/media/:id
// Single media item — prefill when editing product image
export const getMediaById = async (req, res) => {
  try {
    const media = await mediaService.getMediaByIdService(req.params.id);
    res.status(200).json({ success: true, media });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// GET /api/media/optimised-url
// Returns a context-specific optimised Cloudinary URL
// Contexts: product | detail | thumbnail | hero
export const getOptimisedUrl = (req, res) => {
  try {
    const { publicId, context } = req.query;
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'publicId is required' });
    }
    const url = mediaService.getOptimisedUrlService(publicId, context || 'product');
    res.status(200).json({ success: true, url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/media/:id
// Update alt text, folder, or attached product
export const updateMedia = async (req, res) => {
  try {
    const media = await mediaService.updateMediaService(req.params.id, req.body);
    res.status(200).json({ success: true, media });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/media/:id
// Delete from Cloudinary + Media Library + clears product image reference
export const deleteMedia = async (req, res) => {
  try {
    const result = await mediaService.deleteMediaService(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};