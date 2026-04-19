const express = require('express');
const router  = express.Router();

const { login, getMe, logout } = require('../controllers/auth.controller');
const { protect }              = require('../middleware/auth.middleware');

// Public
router.post('/login', login);

// Admin only
router.get('/me',       protect, getMe);
router.post('/logout',  protect, logout);

module.exports = router;