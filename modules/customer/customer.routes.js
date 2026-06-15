import express from 'express';
import { registerCustomer, loginCustomer, requestOtp, verifyOtp, getMe, updateMe, changePassword } from './customer.controller.js';
import { protectCustomer } from './customer.middleware.js';

const router = express.Router();
router.post('/register',    registerCustomer);
router.post('/login',       loginCustomer);
router.post('/request-otp', requestOtp);
router.post('/verify-otp',  verifyOtp);
router.get('/me',              protectCustomer, getMe);
router.patch('/me',            protectCustomer, updateMe);
router.post('/change-password', protectCustomer, changePassword);
export default router;