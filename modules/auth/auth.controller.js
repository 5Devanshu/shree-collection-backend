import * as authService from './auth.service.js';

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