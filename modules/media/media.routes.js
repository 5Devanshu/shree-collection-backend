import express from 'express';
import multer  from 'multer';
import {
  uploadImage, uploadMultipleImages, getAllMedia,
  getMediaById, getOptimisedUrl, updateMedia, deleteMedia,
  serveFile,
} from './media.controller.js';
import protect from '../auth/auth.middleware.js';

const router = express.Router();

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, and WebP images are allowed'), false);
};
const upload = multer({
  storage, fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── PUBLIC — no auth, must be FIRST ──────────────────────────────────────────
router.get('/file/:key(*)', serveFile);

// ── ADMIN PROTECTED ───────────────────────────────────────────────────────────
router.post('/upload',          protect, upload.single('image'),       uploadImage);
router.post('/upload-multiple', protect, upload.array('images', 20),   uploadMultipleImages);
router.get('/optimised-url',    protect, getOptimisedUrl);
router.get('/',                 protect, getAllMedia);
router.get('/:id',              protect, getMediaById);
router.patch('/:id',            protect, updateMedia);
router.delete('/:id',           protect, deleteMedia);

export default router;