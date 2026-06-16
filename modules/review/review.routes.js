import express from 'express';
import {
  getProductReviews,
  createReview,
  getAllReviews,
  deleteReview,
} from './review.controller.js';
import protect from '../auth/auth.middleware.js';

const router = express.Router();

// Public — get reviews for a product
router.get('/product/:productId', getProductReviews);

// Auth-required — post a review (customer or reseller token validated in controller)
router.post('/product/:productId', createReview);

// Admin only
router.get('/',        protect, getAllReviews);
router.delete('/:id',  protect, deleteReview);

export default router;