import jwt      from 'jsonwebtoken';
import Reseller from './reseller.model.js';

const generateToken = (id) =>
  jwt.sign({ id, role: 'reseller' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/resellers/login  — public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const reseller = await Reseller.findOne({ where: { email } });
    if (!reseller || !(await reseller.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!reseller.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    const token = generateToken(reseller.id);
    res.status(200).json({
      success: true,
      token,
      reseller: { id: reseller.id, name: reseller.name, email: reseller.email, company: reseller.company },
    });
  } catch (err) { next(err); }
};

// GET /api/resellers/me  — reseller protected
export const getMe = async (req, res, next) => {
  try {
    const reseller = await Reseller.findByPk(req.reseller.id);
    res.status(200).json({ success: true, data: reseller });
  } catch (err) { next(err); }
};