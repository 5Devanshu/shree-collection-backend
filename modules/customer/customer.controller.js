import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import Customer from './customer.model.js';
import { sendOtpEmail } from '../../services/brevo.service.js';

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');
const signToken = (customer) =>
  jwt.sign({ id: customer.id, type: 'customer' }, process.env.JWT_SECRET, { expiresIn: '30d' });

const issueOtp = async (customer) => {
  const otp = crypto.randomInt(100000, 999999).toString();
  await customer.update({
    otpHash:      hashOtp(otp),
    otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    otpAttempts:  0,
  });
  await sendOtpEmail(customer.email, otp);
};

// POST /api/customers/register  { name, email, phone }
export const registerCustomer = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required' });

    const existing = await Customer.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) return res.status(409).json({ success: false, message: 'Account already exists. Please log in.' });

    const customer = await Customer.create({ name, email, phone });
    await issueOtp(customer);
    res.status(201).json({ success: true, message: 'Account created. OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/customers/request-otp  { email }
export const requestOtp = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { email: String(req.body.email || '').toLowerCase().trim(), isActive: true },
    });
    // Same response whether or not the account exists — prevents email enumeration
    if (customer) await issueOtp(customer);
    res.status(200).json({ success: true, message: 'If an account exists, an OTP has been sent.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/customers/verify-otp  { email, otp }
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const customer = await Customer.findOne({
      where: {
        email:        String(email || '').toLowerCase().trim(),
        otpExpiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!customer || customer.otpAttempts >= 5)
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP. Request a new one.' });

    if (customer.otpHash !== hashOtp(otp)) {
      await customer.increment('otpAttempts');
      return res.status(401).json({ success: false, message: 'Incorrect OTP.' });
    }

    await customer.update({ otpHash: null, otpExpiresAt: null, otpAttempts: 0, lastLoginAt: new Date() });

    res.status(200).json({
      success: true,
      token:   signToken(customer),
      customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};