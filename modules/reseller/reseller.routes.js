import express from 'express';
import {
  register, login, getMe, updateMe,
  getAllResellers, verifyReseller, rejectReseller, deleteReseller,
  requestOtp, verifyOtp,
} from './reseller.controller.js';
import { protectReseller } from './reseller.middleware.js';
import protect from '../auth/auth.middleware.js';   // admin JWT guard (same as order routes)

const router = express.Router();

// Public
router.post('/register',    register);
router.post('/login',       login);
router.post('/otp/request', requestOtp);
router.post('/otp/verify',  verifyOtp);

// Reseller
router.get('/me',   protectReseller, getMe);
router.patch('/me', protectReseller, updateMe);

// Admin
router.get('/',             protect, getAllResellers);
router.patch('/:id/verify', protect, verifyReseller);
router.patch('/:id/reject', protect, rejectReseller);
router.delete('/:id',       protect, deleteReseller);

export default router;