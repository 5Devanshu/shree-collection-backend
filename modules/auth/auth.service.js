import jwt   from 'jsonwebtoken';
import Admin from './auth.model.js';

export const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export const loginService = async ({ email, password }) => {
  if (!email || !password) throw new Error('Email and password are required');

  const admin = await Admin.findOne({ where: { email } });
  if (!admin || !(await admin.comparePassword(password))) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(admin.id);
  return {
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  };
};

export const getMeService = async (adminId) => {
  const admin = await Admin.findByPk(adminId);
  if (!admin) throw new Error('Admin not found');
  return admin;
};

export const changePasswordService = async (adminId, { currentPassword, newPassword }) => {
  const admin = await Admin.findByPk(adminId);
  if (!admin) throw new Error('Admin not found');

  const isMatch = await admin.comparePassword(currentPassword);
  if (!isMatch) throw new Error('Current password is incorrect');

  admin.password = newPassword;
  await admin.save();
  return { message: 'Password updated successfully' };
};