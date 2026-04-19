const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin');

// ── Helper — generate JWT ─────────────────────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ── @desc    Login admin
// ── @route   POST /api/auth/login
// ── @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find admin — explicitly include password for comparison
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      token,
      admin: {
        id:    admin._id,
        email: admin.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Get current logged-in admin
// ── @route   GET /api/auth/me
// ── @access  Admin only
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      admin: {
        id:        req.admin._id,
        email:     req.admin.email,
        createdAt: req.admin.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Logout (client simply drops the token — this is a clean confirm)
// ── @route   POST /api/auth/logout
// ── @access  Admin only
const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe, logout };