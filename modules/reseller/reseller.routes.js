import express from 'express';
import { login, getMe } from './reseller.controller.js';
import { protectReseller } from './reseller.middleware.js';

const router = express.Router();

router.post('/login', login);              // Reseller login
router.get('/me', protectReseller, getMe); // Get reseller profile

export default router;