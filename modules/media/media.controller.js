import * as mediaService from './media.service.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import s3, { BUCKET_NAME }  from '../../config/storage.js';
import path from 'node:path';

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
// ─── GET /api/media/file/:key — public, no auth ───────────────────────────────
export const serveFile = async (req, res) => {
  // Express decodes route params once. Decode only if a proxy left the
  // separator encoded, otherwise keys containing percent sequences can be
  // changed by decoding twice.
  const rawKey = req.params.key || '';
  const key = rawKey.includes('%') ? decodeURIComponent(rawKey) : rawKey;

  if (!key || key.includes('..') || key.startsWith('/')) {
    return res.status(400).json({ success: false, message: 'Invalid file key' });
  }

  const contentTypeByExtension = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };

  try {
    const keysToTry = [key];
    // A short-lived earlier uploader stored the encoded separator as part of
    // the object key. Keep reads backward-compatible while new uploads use
    // normal S3 keys.
    if (key.includes('/')) keysToTry.push(key.replaceAll('/', '%2F'));

    let response;
    let resolvedKey = key;
    let lastError;
    for (const candidate of keysToTry) {
      try {
        response = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: candidate }));
        resolvedKey = candidate;
        break;
      } catch (error) {
        lastError = error;
        if (error?.name !== 'NoSuchKey' && error?.$metadata?.httpStatusCode !== 404) {
          throw error;
        }
      }
    }

    if (!response) throw lastError || new Error('File not found');

    // R2 can omit ContentType for objects uploaded by older versions of the
    // service. Without an image MIME type, browsers may classify an error or
    // opaque response as ORB-blocked content.
    res.setHeader(
      'Content-Type',
      response.ContentType || contentTypeByExtension[path.extname(resolvedKey).toLowerCase()] || 'application/octet-stream'
    );
    if (response.ContentLength) res.setHeader('Content-Length', response.ContentLength);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const stream = response.Body;

    // CRITICAL: response.Body is a Node Readable stream. If it emits 'error'
    // with no listener attached, Node throws it as an UNCAUGHT EXCEPTION and
    // kills the whole process — taking every other in-flight request with it.
    stream.on('error', (err) => {
      console.error(`[media] R2 stream error for key "${resolvedKey}":`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ success: false, message: 'Failed to stream file' });
      } else {
        res.destroy();
      }
    });

    res.on('close', () => {
      if (!stream.destroyed) stream.destroy();
    });

    stream.pipe(res);
  } catch (error) {
    console.error(`[media] R2 getObject failed for key "${key}":`, error.message);
    if (!res.headersSent) {
      res.status(404).json({ success: false, message: 'File not found' });
    }
  }
};