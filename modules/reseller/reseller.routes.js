import express from 'express';
import {
  register, login, getMe,
  getAllResellers, verifyReseller, rejectReseller,
} from './reseller.controller.js';
import { protectReseller } from './reseller.middleware.js';
import protect from '../auth/auth.middleware.js';   // admin JWT guard (same as order routes)

const router = express.Router();

// Public
router.post('/register', register);
router.post('/login',    login);

// Reseller
router.get('/me', protectReseller, getMe);

// Admin
router.get('/',            protect, getAllResellers);
router.patch('/:id/verify', protect, verifyReseller);
router.patch('/:id/reject', protect, rejectReseller);

export default router;