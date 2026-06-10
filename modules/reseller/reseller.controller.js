import jwt      from 'jsonwebtoken';
import Reseller from './reseller.model.js';
import { sendResellerPendingEmail, sendResellerVerifiedEmail } from '../../services/brevo.service.js';

const generateToken = (id) =>
  jwt.sign({ id, role: 'reseller' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

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
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
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

// ── POST /api/resellers/login — public ────────────────────────────────────────
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
    if (!reseller.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    // ── Verification gate ──
    if (reseller.status === 'pending') {
      return res.status(403).json({ success: false, code: 'NOT_VERIFIED',
        message: 'Your account is awaiting admin verification. You will receive an email once verified.' });
    }
    if (reseller.status === 'rejected') {
      return res.status(403).json({ success: false, code: 'REJECTED',
        message: 'Your reseller application was not approved. Contact us for details.' });
    }

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