import express from 'express';
import {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  addAddress,
  deleteAddress,
  getMyOrders,
  getMyOrderById,
} from './customer.controller.js';
import { protectCustomer } from './customer.middleware.js';

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login',    login);

// ── Customer only ─────────────────────────────────────────────────────────────
router.get('/me',    protectCustomer, getMe);
router.put('/me',    protectCustomer, updateMe);
router.put('/me/change-password', protectCustomer, changePassword);

// Saved addresses
router.post('/me/addresses',               protectCustomer, addAddress);
router.delete('/me/addresses/:addressId',  protectCustomer, deleteAddress);

// Customer order history
router.get('/orders',     protectCustomer, getMyOrders);
router.get('/orders/:id', protectCustomer, getMyOrderById);

export default router;
