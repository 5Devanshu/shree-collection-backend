import express from 'express';
import { loginAdmin, logoutAdmin, getMe, changePassword } from './auth.controller.js';
import protect from './auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);

// Protected routes (require valid JWT)
router.get('/me', protect, getMe);
router.patch('/change-password', protect, changePassword);

export default router;