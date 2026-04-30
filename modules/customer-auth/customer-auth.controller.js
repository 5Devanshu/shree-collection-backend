import jwt      from 'jsonwebtoken';
import Customer from '../../models/Customer.js';
import { sendWelcomeEmail } from '../../services/email.service.js';

const generateToken = (id) =>
  jwt.sign({ id, role: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    const existing = await Customer.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }
    const customer = await Customer.create({ name, email, password, phone });
    const token    = generateToken(customer._id);
    sendWelcomeEmail(customer.email, customer.name).catch((err) =>
      console.error('Welcome email failed:', err)
    );
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone },
    });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const customer = await Customer.findOne({ email }).select('+password');
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!customer.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Please contact support.' });
    }
    const isMatch = await customer.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = generateToken(customer._id);
    res.status(200).json({
      success: true,
      token,
      customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone },
    });
  } catch (err) { next(err); }
};

export const getMe = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    res.status(200).json({
      success: true,
      data: {
        id: customer._id, name: customer.name, email: customer.email,
        phone: customer.phone, savedAddresses: customer.savedAddresses, createdAt: customer.createdAt,
      },
    });
  } catch (err) { next(err); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const customer        = await Customer.findById(req.customer._id);
    if (name)  customer.name  = name;
    if (phone) customer.phone = phone;
    const updated = await customer.save();
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { id: updated._id, name: updated.name, email: updated.email, phone: updated.phone },
    });
  } catch (err) { next(err); }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }
    const customer = await Customer.findById(req.customer._id).select('+password');
    const isMatch  = await customer.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    customer.password = newPassword;
    await customer.save();
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
};

export const verifyToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const decoded   = jwt.verify(token, process.env.JWT_SECRET);
    const customer  = await Customer.findById(decoded.id);
    if (!customer || !customer.isActive) {
      return res.status(200).json({ success: false, valid: false });
    }
    res.status(200).json({
      success: true, valid: true,
      customer: { id: customer._id, name: customer.name, email: customer.email },
    });
  } catch {
    res.status(200).json({ success: false, valid: false });
  }
};
