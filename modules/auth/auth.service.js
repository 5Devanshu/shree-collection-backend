import jwt from 'jsonwebtoken';
import Admin from './auth.model.js';

// Generate signed JWT token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Register first admin (only if no admins exist)
export const registerAdminService = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required');
  }

  // Check if any admin exists
  const existingAdmin = await Admin.findOne({});
  if (existingAdmin) {
    throw new Error('Admin already exists. Cannot register another admin.');
  }

  // Check if email is already used
  const emailExists = await Admin.findOne({ email });
  if (emailExists) {
    throw new Error('Email already registered');
  }

  // Create new admin
  const admin = await Admin.create({ name, email, password, role: 'superadmin' });

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

// Login: validate credentials and return token
export const loginService = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  const admin = await Admin.findOne({ email: normalizedEmail }).select('+password');
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