import * as authService from './auth.service.js';
import Customer from '../customer/customer.model.js';
import Reseller from '../reseller/reseller.model.js';
import { Op } from 'sequelize';

export const identifyAccount = async (req, res) => {
  try {
    const identifier = String(req.body.identifier || req.body.email || '').trim();
    if (!identifier) return res.status(400).json({ success: false, message: 'Identifier is required' });

    const where = {
      [Op.or]: [
        { email:    identifier.toLowerCase() },
        { phone:    identifier },
        { username: identifier.toLowerCase() },
      ],
    };

    const reseller = await Reseller.findOne({ where });
    if (reseller) return res.status(200).json({
      success: true, type: 'reseller',
      status:   reseller.status,
      hasEmail: !!reseller.email,
    });

    const customer = await Customer.findOne({ where });
    if (customer) return res.status(200).json({
      success: true, type: 'customer',
      hasEmail: !!customer.email,
    });

    return res.status(200).json({ success: true, type: 'none' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/register (first admin only)
export const registerAdmin = async (req, res) => {
  try {
    const result = await authService.registerAdminService(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
export const loginAdmin = async (req, res) => {
  try {
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