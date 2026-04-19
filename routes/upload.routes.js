const express = require('express');
const router  = express.Router();

const {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
} = require('../controllers/upload.controller');

const { protect } = require('../middleware/auth.middleware');
const upload      = require('../middleware/upload.middleware');

// All upload routes are admin only

// ── Single image upload ───────────────────────────────────────────────────────
// Field name must be 'image' in the form data
router.post(
  '/',
  protect,
  upload.single('image'),
  uploadImage
);

// ── Multiple image upload (max 5) ─────────────────────────────────────────────
// Field name must be 'images' in the form data
router.post(
  '/multiple',
  protect,
  upload.array('images', 5),
  uploadMultipleImages
);

// ── Delete image by public_id ─────────────────────────────────────────────────
router.delete(
  '/:public_id',
  protect,
  deleteImage
);

module.exports = router;