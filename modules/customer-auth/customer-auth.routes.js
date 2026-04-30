import express from 'express';
import * as customerAuthController from './customer-auth.controller.js';
import { protectCustomer } from './customer-auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', customerAuthController.registerCustomer);
router.post('/login', customerAuthController.loginCustomer);
router.post('/verify-token', customerAuthController.verifyToken);

// Protected routes
router.get('/me', protectCustomer, customerAuthController.getMe);
router.put('/profile', protectCustomer, customerAuthController.updateProfile);
router.patch('/change-password', protectCustomer, customerAuthController.changePassword);

export default router;
