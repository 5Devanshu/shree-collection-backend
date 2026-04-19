import express from 'express';
import {
  search,
  getSuggestions,
} from './search.controller.js';

const router = express.Router();

// Public routes
router.get('/', search);
router.get('/suggestions', getSuggestions);

export default router;
