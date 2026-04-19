import express from 'express';
import multer  from 'multer';
import {
  uploadImage,
  uploadMultipleImages,
  getAllMedia,
  getMediaById,
  getOptimisedUrl,
  updateMedia,
  deleteMedia,
} from './media.controller.js';
import protect from '../auth/auth.middleware.js';

const router = express.Router();

// Multer — stores uploads in memory buffer before sending to Cloudinary
// Accepts: jpg, png, webp — matches product image formats used across the store
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WebP images are allowed'), false);
  }
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },   // 10MB max per file
});

// ─── All Media Routes are Admin Protected ─────────────────────────────────────

// AdminProducts — single product image upload
router.post('/upload', protect, upload.single('image'), uploadImage);

// AdminPanel Media Library — bulk upload
router.post('/upload-multiple', protect, upload.array('images', 20), uploadMultipleImages);

// Optimised URL for specific rendering context (product/detail/thumbnail/hero)
router.get('/optimised-url', protect, getOptimisedUrl);

// AdminPanel Media Library — paginated browser with folder filter
router.get('/', protect, getAllMedia);

// Single media item — AdminProducts image edit prefill
router.get('/:id', protect, getMediaById);

// Update alt text / folder / attached product
router.patch('/:id', protect, updateMedia);

// Delete image from Cloudinary + DB + clears product reference
router.delete('/:id', protect, deleteMedia);

export default router;