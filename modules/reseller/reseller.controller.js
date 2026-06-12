import jwt      from 'jsonwebtoken';
import Reseller from './reseller.model.js';
import { sendResellerPendingEmail, sendResellerVerifiedEmail } from '../../services/brevo.service.js';
import { generateOtp, hashOtp } from '../../utils/otp.js';
import { sendOtpEmail } from '../../services/email.service.js';

const OTP_TTL_MS       = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const generateToken = (id) =>
  jwt.sign({ id, role: 'reseller' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Shared verification gate — used by password login AND OTP flow
const statusGate = (reseller) => {
  if (!reseller.isActive) {
    return { httpStatus: 403, body: { success: false, message: 'Account deactivated. Contact admin.' } };
  }
  if (reseller.status === 'pending') {
    return { httpStatus: 403, body: { success: false, code: 'NOT_VERIFIED',
      message: 'Your account is awaiting admin verification. You will receive an email once verified.' } };
  }
  if (reseller.status === 'rejected') {
    return { httpStatus: 403, body: { success: false, code: 'REJECTED',
      message: 'Your reseller application was not approved. Contact us for details.' } };
  }
  return null;
};

// ── POST /api/resellers/register — public self-registration ──────────────────
// Creates account with status 'pending'. No token returned — must be verified first.
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, company } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await Reseller.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({
        success: false,
        exists:  true,
        message: 'Account already exists. Login with your password or request an OTP.',
      });
    }

    const reseller = await Reseller.create({
      name, email: normalizedEmail, password, phone, company,
      status: 'pending',
    });

    await sendResellerPendingEmail(reseller.email, reseller.name);

    res.status(201).json({
      success: true,
      message: 'Application received. You will get an email once your account is verified by our team.',
    });
  } catch (err) { next(err); }
};

// ── POST /api/resellers/login — public (password) ────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const reseller = await Reseller.findOne({ where: { email: String(email).toLowerCase().trim() } });
    if (!reseller || !(await reseller.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const gate = statusGate(reseller);
    if (gate) return res.status(gate.httpStatus).json(gate.body);

    const token = generateToken(reseller.id);
    res.status(200).json({
      success: true,
      token,
      reseller: { id: reseller.id, name: reseller.name, email: reseller.email,
                  phone: reseller.phone, company: reseller.company },
    });
  } catch (err) { next(err); }
};

// ── POST /api/resellers/otp/request   { email } — public ─────────────────────
export const requestOtp = async (req, res, next) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const reseller = await Reseller.findOne({ where: { email } });
    if (!reseller)
      return res.status(404).json({ success: false, message: 'No account found with this email' });

    // Same gate as password login — pending/rejected/deactivated cannot get an OTP
    const gate = statusGate(reseller);
    if (gate) return res.status(gate.httpStatus).json(gate.body);

    const otp = generateOtp();
    reseller.otpHash      = hashOtp(otp);
    reseller.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    reseller.otpAttempts  = 0;
    await reseller.save();

    await sendOtpEmail(reseller.email, reseller.name, otp);

    res.status(200).json({ success: true, message: 'OTP sent to your email' });
  } catch (err) { next(err); }
};

// ── POST /api/resellers/otp/verify   { email, otp } — public ─────────────────
export const verifyOtp = async (req, res, next) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const { otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const reseller = await Reseller.findOne({ where: { email } });
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

    // Re-check gate at token issuance — status may have changed since OTP was requested
    const gate = statusGate(reseller);
    if (gate) return res.status(gate.httpStatus).json(gate.body);

    // Success — clear OTP, issue same JWT as password login
    reseller.otpHash = null; reseller.otpExpiresAt = null; reseller.otpAttempts = 0;
    await reseller.save();

    const token = generateToken(reseller.id);
    res.status(200).json({
      success: true,
      token,
      reseller: { id: reseller.id, name: reseller.name, email: reseller.email,
                  phone: reseller.phone, company: reseller.company },
    });
  } catch (err) { next(err); }
};

// ── GET /api/resellers/me — reseller protected ────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const reseller = await Reseller.findByPk(req.reseller.id, { attributes: { exclude: ['password'] } });
    res.status(200).json({ success: true, data: reseller });
  } catch (err) { next(err); }
};

// ── GET /api/resellers?status=pending — admin protected ──────────────────────
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

// ── PATCH /api/resellers/:id/verify — admin protected ────────────────────────
export const verifyReseller = async (req, res, next) => {
  try {
    const reseller = await Reseller.findByPk(req.params.id);
    if (!reseller) return res.status(404).json({ success: false, message: 'Reseller not found' });

    await reseller.update({ status: 'verified', verifiedAt: new Date() });
    await sendResellerVerifiedEmail(reseller.email, reseller.name);

    res.status(200).json({ success: true, message: `${reseller.name} verified — notification email sent.` });
  } catch (err) { next(err); }
};

// ── PATCH /api/resellers/:id/reject — admin protected ────────────────────────
export const rejectReseller = async (req, res, next) => {
  try {
    const reseller = await Reseller.findByPk(req.params.id);
    if (!reseller) return res.status(404).json({ success: false, message: 'Reseller not found' });

    await reseller.update({ status: 'rejected' });
    res.status(200).json({ success: true, message: `${reseller.name} marked as rejected.` });
  } catch (err) { next(err); }
};