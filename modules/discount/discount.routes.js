import express from 'express';
import protect from '../auth/auth.middleware.js';
import * as ctrl from './discount.controller.js';

const router = express.Router();

// Admin routes — protected
router.get('/',       protect, ctrl.getAllDiscounts);
router.post('/',      protect, ctrl.createDiscount);
router.put('/:id',    protect, ctrl.updateDiscount);
router.delete('/:id', protect, ctrl.deleteDiscount);

// Public routes — used by checkout
router.post('/validate', ctrl.validateCode);
router.post('/apply',    ctrl.applyDiscount);

export default router;
