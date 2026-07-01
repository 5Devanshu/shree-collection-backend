import * as mediaService from './media.service.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import s3, { BUCKET_NAME }  from '../../config/storage.js';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided' });
    const { folder, altText, attachedProductId } = req.body;
    const media = await mediaService.uploadImageService(
      req.file.buffer, req.file.mimetype, {
        folder:           folder || 'product',
        altText:          altText || '',
        originalName:     req.file.originalname,
        attachedProductId: attachedProductId || null,
        uploadedById:     req.admin?.id || null,
      }
    );
    res.status(201).json({ success: true, media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'No files provided' });
    const media = await mediaService.uploadMultipleImagesService(req.files, {
      folder:      req.body.folder || 'general',
      uploadedById: req.admin?.id || null,
    });
    res.status(201).json({ success: true, media, count: media.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllMedia = async (req, res) => {
  try {
    const result = await mediaService.getAllMediaService(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOptimisedUrl = (req, res) => {
  try {
    const { url, context } = req.query;
    if (!url) return res.status(400).json({ success: false, message: 'url is required' });
    res.status(200).json({ success: true, url: mediaService.getOptimisedUrlService(url, context || 'product') });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMediaById = async (req, res) => {
  try {
    const media = await mediaService.getMediaByIdService(req.params.id);
    res.status(200).json({ success: true, media });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateMedia = async (req, res) => {
  try {
    const media = await mediaService.updateMediaService(req.params.id, req.body);
    res.status(200).json({ success: true, media });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const result = await mediaService.deleteMediaService(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// ─── GET /api/media/file/:key — public, no auth ───────────────────────────────
// Streams the file directly from R2 to the browser. A 302 redirect to a
// presigned URL was used before, but R2 presigned URLs are blocked by the
// browser when the referrer is a different origin (CORS + presigned URL
// restrictions). Streaming through the backend avoids this entirely and works
// regardless of bucket CORS policy.
export const serveFile = async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const command  = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const response = await s3.send(command);

    // Forward content headers so the browser renders images correctly
    if (response.ContentType)   res.setHeader('Content-Type',   response.ContentType);
    if (response.ContentLength) res.setHeader('Content-Length', response.ContentLength);

    // Cache for 1 hour — same lifetime as old presigned URLs
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Pipe the R2 readable stream straight to the HTTP response
    response.Body.pipe(res);
  } catch (error) {
    res.status(404).json({ success: false, message: 'File not found' });
  }
};