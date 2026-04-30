import * as customerAuthService from './customer-auth.service.js';

// POST /api/customer-auth/register
export const registerCustomer = async (req, res) => {
  try {
    const result = await customerAuthService.registerCustomerService(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/customer-auth/login
export const loginCustomer = async (req, res) => {
  try {
    const result = await customerAuthService.loginCustomerService(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// GET /api/customer-auth/me
export const getMe = async (req, res) => {
  try {
    const customer = await customerAuthService.getCustomerService(req.customer.id);
    res.status(200).json({ success: true, customer });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// PUT /api/customer-auth/profile
export const updateProfile = async (req, res) => {
  try {
    const customer = await customerAuthService.updateCustomerService(req.customer.id, req.body);
    res.status(200).json({ success: true, customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/customer-auth/change-password
export const changePassword = async (req, res) => {
  try {
    const result = await customerAuthService.changeCustomerPasswordService(req.customer.id, req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/customer-auth/verify-token
export const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    const customer = await customerAuthService.verifyTokenService(token);
    res.status(200).json({ success: true, customer });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};
