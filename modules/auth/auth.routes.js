import express from 'express';
import { registerAdmin, loginAdmin, logoutAdmin, getMe, changePassword, identifyAccount } from './auth.controller.js';
import protect from './auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);
router.post('/identify', identifyAccount); 

// Protected routes (require valid JWT)
router.get('/me', protect, getMe);
router.patch('/change-password', protect, changePassword);

export default router;