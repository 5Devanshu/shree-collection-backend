import express from 'express';
import { registerCustomer, requestOtp, verifyOtp } from './customer.controller.js';

const router = express.Router();
router.post('/register',    registerCustomer);
router.post('/request-otp', requestOtp);
router.post('/verify-otp',  verifyOtp);
export default router;