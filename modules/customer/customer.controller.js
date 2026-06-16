import crypto from 'crypto';
import jwt    from 'jsonwebtoken';
import { Op } from 'sequelize';
import Customer from './customer.model.js';
import { sendOtpEmail } from '../../services/brevo.service.js';

const hashOtp  = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');
const signToken = (customer) =>
  jwt.sign({ id: customer.id, type: 'customer' }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Build a WHERE clause that matches email OR phone OR username
const identifierWhere = (identifier) => {
  const val = String(identifier || '').trim();
  return {
    [Op.or]: [
      { email:    val.toLowerCase() },
      { phone:    val },
      { username: val.toLowerCase() },
    ],
    isActive: true,
  };
};

const safeCustomer = (c) => ({
  id: c.id, name: c.name, email: c.email,
  phone: c.phone, username: c.username, address: c.address,
});

const issueOtp = async (customer) => {
  if (!customer.email)
    throw new Error('This account has no email address — please log in with your password.');
  const otp = crypto.randomInt(100000, 999999).toString();
  await customer.update({
    otpHash:      hashOtp(otp),
    otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    otpAttempts:  0,
  });
  await sendOtpEmail(customer.email, otp);
};

// ── POST /api/customers/register ─────────────────────────────────────────────
// { name, password, email?, phone?, username?, address? }
export const registerCustomer = async (req, res) => {
  try {
    const { name, password, email, phone, username, address } = req.body;

    if (!name)     return res.status(400).json({ success: false, message: 'Name is required' });
    if (!password) return res.status(400).json({ success: false, message: 'Password is required' });
    if (!email && !phone && !username)
      return res.status(400).json({ success: false, message: 'Provide at least one of: email, phone, or username' });

    // Check uniqueness across all three identifiers
    const orClauses = [];
    if (email)    orClauses.push({ email:    email.toLowerCase().trim() });
    if (phone)    orClauses.push({ phone });
    if (username) orClauses.push({ username: username.toLowerCase().trim() });

    const existing = await Customer.findOne({ where: { [Op.or]: orClauses } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account already exists with that email, phone, or username.' });
    }

    const customer = await Customer.create({
      name, password,
      email:    email    || null,
      phone:    phone    || null,
      username: username || null,
      address:  address  || null,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token:   signToken(customer),
      customer: safeCustomer(customer),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/customers/login ─────────────────────────────────────────────────
// { identifier, password }  — identifier = email | phone | username
export const loginCustomer = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ success: false, message: 'Identifier and password are required' });

    const customer = await Customer.findOne({ where: identifierWhere(identifier) });
    if (!customer || !(await customer.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    await customer.update({ lastLoginAt: new Date() });

    res.status(200).json({
      success: true,
      token:   signToken(customer),
      customer: safeCustomer(customer),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/customers/request-otp ──────────────────────────────────────────
// { identifier }  — must resolve to an account that has an email
export const requestOtp = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier)
      return res.status(400).json({ success: false, message: 'Identifier is required' });

    const customer = await Customer.findOne({ where: identifierWhere(identifier) });

    if (!customer) {
      // Don't reveal whether account exists
      return res.status(200).json({ success: true, message: 'If an account exists, an OTP has been sent.' });
    }

    try {
      await issueOtp(customer);
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    res.status(200).json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/customers/verify-otp ───────────────────────────────────────────
// { identifier, otp }
export const verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp)
      return res.status(400).json({ success: false, message: 'Identifier and OTP are required' });

    const customer = await Customer.findOne({ where: identifierWhere(identifier) });

    if (!customer || !customer.otpHash || new Date() > customer.otpExpiresAt)
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP. Request a new one.' });

    if (customer.otpAttempts >= 5) {
      await customer.update({ otpHash: null, otpExpiresAt: null });
      return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new OTP.' });
    }

    if (customer.otpHash !== hashOtp(otp)) {
      await customer.increment('otpAttempts');
      return res.status(401).json({ success: false, message: 'Incorrect OTP.' });
    }

    await customer.update({ otpHash: null, otpExpiresAt: null, otpAttempts: 0, lastLoginAt: new Date() });

    res.status(200).json({
      success: true,
      token:   signToken(customer),
      customer: safeCustomer(customer),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/customers/me ─────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.customer.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, customer: safeCustomer(customer) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PATCH /api/customers/me ───────────────────────────────────────────────────
export const updateMe = async (req, res) => {
  try {
    const { name, email, phone, username, address } = req.body;
    const customer = req.customer;

    // Check uniqueness if changing identifiers
    const orClauses = [];
    if (email    && email    !== customer.email)    orClauses.push({ email:    email.toLowerCase().trim() });
    if (phone    && phone    !== customer.phone)    orClauses.push({ phone });
    if (username && username !== customer.username) orClauses.push({ username: username.toLowerCase().trim() });

    if (orClauses.length) {
      const conflict = await Customer.findOne({ where: { [Op.or]: orClauses } });
      if (conflict) return res.status(409).json({ success: false, message: 'Email, phone, or username already in use.' });
    }

    await customer.update({
      ...(name     !== undefined && { name }),
      ...(email    !== undefined && { email:    email    || null }),
      ...(phone    !== undefined && { phone:    phone    || null }),
      ...(username !== undefined && { username: username || null }),
      ...(address  !== undefined && { address }),
    });

    res.status(200).json({ success: true, customer: safeCustomer(customer) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/customers/change-password ──────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both passwords are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const customer = req.customer;
    if (!(await customer.matchPassword(currentPassword)))
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    await customer.update({ password: newPassword });
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};