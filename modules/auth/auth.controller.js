import * as authService from './auth.service.js';
import Customer from '../../models/Customer.js';
import jwt from 'jsonwebtoken';

// POST /api/auth/register (supports both admin and customer)
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    // Check if customer already exists
    const existing = await Customer.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Create customer account
    const customer = await Customer.create({ name, email, password, phone });
    const token = jwt.sign({ id: customer._id, role: 'customer' }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: 'customer',
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login (supports both admin and customer)
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Try customer login first
    const customer = await Customer.findOne({ email }).select('+password');
    if (customer) {
      if (!customer.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
        });
      }

      const isMatch = await customer.matchPassword(password);
      if (isMatch) {
        const token = jwt.sign({ id: customer._id, role: 'customer' }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        });

        return res.status(200).json({
          success: true,
          token,
          customer: {
            id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            role: 'customer',
          },
        });
      }
    }

    // Try admin login if customer login failed
    const result = await authService.loginService(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// POST /api/auth/logout
export const logoutAdmin = (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const admin = await authService.getMeService(req.admin.id);
    res.status(200).json({ success: true, admin });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// PATCH /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const result = await authService.changePasswordService(req.admin.id, req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};