import jwt from 'jsonwebtoken';
import Admin from './auth.model.js';

// Generate signed JWT token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Login: validate credentials and return token
export const loginService = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const admin = await Admin.findOne({ email }).select('+password');
  if (!admin || !(await admin.comparePassword(password))) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(admin._id);

  return {
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  };
};

// Get current logged-in admin by ID
export const getMeService = async (adminId) => {
  const admin = await Admin.findById(adminId);
  if (!admin) throw new Error('Admin not found');
  return admin;
};

// Change password
export const changePasswordService = async (adminId, { currentPassword, newPassword }) => {
  const admin = await Admin.findById(adminId).select('+password');
  if (!admin) throw new Error('Admin not found');

  const isMatch = await admin.comparePassword(currentPassword);
  if (!isMatch) throw new Error('Current password is incorrect');

  admin.password = newPassword;
  await admin.save();

  return { message: 'Password updated successfully' };
};