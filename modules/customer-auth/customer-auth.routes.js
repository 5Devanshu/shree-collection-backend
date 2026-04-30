import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  verifyToken,
} from './customer-auth.controller.js';
import { protectCustomer } from './customer-auth.middleware.js';

const router = express.Router();

router.post('/register',       register);
router.post('/login',          login);
router.post('/verify-token',   verifyToken);
router.get('/me',              protectCustomer, getMe);
router.put('/profile',         protectCustomer, updateProfile);
router.patch('/change-password', protectCustomer, changePassword);

export default router;
