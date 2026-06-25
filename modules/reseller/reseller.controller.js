import jwt      from 'jsonwebtoken';
import { Op }   from 'sequelize';
import Reseller from './reseller.model.js';
import {
  sendResellerPendingEmail,
  sendResellerVerifiedEmail,
  sendResellerApplicationAlert,
  sendOtpEmail,
} from '../../services/brevo.service.js';
import { generateOtp, hashOtp } from '../../utils/otp.js';
import bcrypt from 'bcryptjs';

const OTP_TTL_MS       = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const generateToken = (id, name) =>
  jwt.sign({ id, role: 'reseller', name }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
const statusGate = (reseller) => {
  if (!reseller.isActive)
    return { httpStatus: 403, body: { success: false, message: 'Account deactivated. Contact admin.' } };
  if (reseller.status === 'pending')
    return { httpStatus: 403, body: { success: false, code: 'NOT_VERIFIED',
      message: 'Your account is awaiting admin verification. You will receive an email once verified.' } };
  if (reseller.status === 'rejected')
    return { httpStatus: 403, body: { success: false, code: 'REJECTED',
      message: 'Your reseller application was not approved. Contact us for details.' } };
  return null;
};

// Build a WHERE clause that matches email OR phone OR username
const identifierWhere = (identifier) => {
  const val = String(identifier || '').trim();
  return {
    [Op.or]: [
      { email:    val.toLowerCase() },
      { phone:    val },
      { username: val.toLowerCase() },
    ],
  };
};

// ── POST /api/resellers/register ─────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, company } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await Reseller.findOne({ where: { email: normalizedEmail } });
    if (existing)
      return res.status(409).json({
        success: false, exists: true,
        message: 'Account already exists. Login with your password or request an OTP.',
      });

    const reseller = await Reseller.create({
      name, email: normalizedEmail, password, phone, company,
      status: 'pending',
    });

    await sendResellerPendingEmail(reseller.email, reseller.name);
    await sendResellerApplicationAlert(reseller);

    res.status(201).json({
      success: true,
      message: 'Application received. You will get an email once your account is verified by our team.',
    });
  } catch (err) { next(err); }
};

// ── POST /api/resellers/login ─────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { identifier, email, password } = req.body;
    const lookup = identifier || email;

    if (!lookup || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const reseller = await Reseller.findOne({ where: identifierWhere(lookup) });
    if (!reseller || !(await reseller.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const gate = statusGate(reseller);
    if (gate) return res.status(gate.httpStatus).json(gate.body);

    const token = generateToken(reseller.id, reseller.name); 
    res.status(200).json({
      success: true, token,
      reseller: { id: reseller.id, name: reseller.name, email: reseller.email,
                  phone: reseller.phone, company: reseller.company },
    });
  } catch (err) { next(err); }
};

// ── POST /api/resellers/otp/request ──────────────────────────────────────────
export const requestOtp = async (req, res, next) => {
  try {
    const { identifier, email } = req.body;
    const lookup = (identifier || email || '').trim();
    if (!lookup)
      return res.status(400).json({ success: false, message: 'Email is required' });

    const reseller = await Reseller.findOne({ where: identifierWhere(lookup) });
    if (!reseller)
      return res.status(404).json({ success: false, message: 'No account found' });

    const gate = statusGate(reseller);
    if (gate) return res.status(gate.httpStatus).json(gate.body);

    if (!reseller.email)
      return res.status(400).json({ success: false, message: 'This account has no email — please log in with your password.' });

    const otp = generateOtp();
    reseller.otpHash      = hashOtp(otp);
    reseller.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    reseller.otpAttempts  = 0;
    await reseller.save();

    await sendOtpEmail(reseller.email, otp);

    res.status(200).json({ success: true, message: 'OTP sent to your email' });
  } catch (err) { next(err); }
};

// ── POST /api/resellers/otp/verify ───────────────────────────────────────────
export const verifyOtp = async (req, res, next) => {
  try {
    const { identifier, email, otp } = req.body;
    const lookup = (identifier || email || '').trim();
    if (!lookup || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const reseller = await Reseller.findOne({ where: identifierWhere(lookup) });
    if (!reseller || !reseller.otpHash)
      return res.status(400).json({ success: false, message: 'No OTP requested. Please request a new one.' });

    if (new Date() > reseller.otpExpiresAt) {
      reseller.otpHash = null; reseller.otpExpiresAt = null;
      await reseller.save();
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    if (reseller.otpAttempts >= MAX_OTP_ATTEMPTS) {
      reseller.otpHash = null; reseller.otpExpiresAt = null;
      await reseller.save();
      return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new OTP.' });
    }

    if (hashOtp(otp) !== reseller.otpHash) {
      reseller.otpAttempts += 1;
      await reseller.save();
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    const gate = statusGate(reseller);
    if (gate) return res.status(gate.httpStatus).json(gate.body);

    reseller.otpHash = null; reseller.otpExpiresAt = null; reseller.otpAttempts = 0;
    await reseller.save();

    const token = generateToken(reseller.id, reseller.name);
    res.status(200).json({
      success: true, token,
      reseller: { id: reseller.id, name: reseller.name, email: reseller.email,
                  phone: reseller.phone, company: reseller.company },
    });
  } catch (err) { next(err); }
};

// ── GET /api/resellers/me ─────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const reseller = await Reseller.findByPk(req.reseller.id, {
      attributes: { exclude: ['password'] },
    });
    res.status(200).json({ success: true, data: reseller });
  } catch (err) { next(err); }
};

export const updateMe = async (req, res, next) => {
  try {
    const reseller = await Reseller.findByPk(req.reseller.id);
    if (!reseller)
      return res.status(404).json({ success: false, message: 'Reseller not found' });
 
    const { name, company, address, city, state, pincode, currentPassword, newPassword } = req.body;
 
    const updates = {};
    if (name    !== undefined) updates.name    = String(name).trim();
    if (company !== undefined) updates.company = String(company).trim();
    if (address !== undefined) updates.address = String(address).trim();
    if (city    !== undefined) updates.city    = String(city).trim();
    if (state   !== undefined) updates.state   = String(state).trim();
    if (pincode !== undefined) updates.pincode = String(pincode).trim();
 
    // Optional password change — requires current password to confirm identity
    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
 
      const matches = await reseller.matchPassword(currentPassword);
      if (!matches)
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
 
      updates.password = newPassword; // beforeUpdate hook hashes this automatically
    }
 
    await reseller.update(updates);
 
    const safeReseller = await Reseller.findByPk(reseller.id, {
      attributes: { exclude: ['password', 'otpHash'] },
    });
 
    res.status(200).json({ success: true, data: safeReseller });
  } catch (err) { next(err); }
};
 
// ── GET /api/resellers ────────────────────────────────────────────────────────
export const getAllResellers = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const resellers = await Reseller.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json({ success: true, resellers });
  } catch (err) { next(err); }
};

// ── PATCH /api/resellers/:id/verify ──────────────────────────────────────────
export const verifyReseller = async (req, res, next) => {
  try {
    const reseller = await Reseller.findByPk(req.params.id);
    if (!reseller)
      return res.status(404).json({ success: false, message: 'Reseller not found' });

    await reseller.update({ status: 'verified', verifiedAt: new Date() });
    await sendResellerVerifiedEmail(reseller.email, reseller.name);

    res.status(200).json({
      success: true,
      message: `${reseller.name} verified — notification email sent.`,
    });
  } catch (err) { next(err); }
};

// ── PATCH /api/resellers/:id/reject ──────────────────────────────────────────
export const rejectReseller = async (req, res, next) => {
  try {
    const reseller = await Reseller.findByPk(req.params.id);
    if (!reseller)
      return res.status(404).json({ success: false, message: 'Reseller not found' });

    await reseller.update({ status: 'rejected' });
    res.status(200).json({
      success: true,
      message: `${reseller.name} marked as rejected.`,
    });
  } catch (err) { next(err); }
};

export const deleteReseller = async (req, res, next) => {
  try {
    const reseller = await Reseller.findByPk(req.params.id);
    if (!reseller)
      return res.status(404).json({ success: false, message: 'Reseller not found' });
 
    const name = reseller.name;
    await reseller.destroy();
 
    res.status(200).json({ success: true, message: `${name} has been removed.` });
  } catch (err) { next(err); }
};
 