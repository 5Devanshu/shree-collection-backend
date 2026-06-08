import jwt      from 'jsonwebtoken';
import Reseller from './reseller.model.js';

export const protectReseller = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorised' });
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role !== 'reseller') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const reseller = await Reseller.findByPk(decoded.id);
    if (!reseller || !reseller.isActive) {
      return res.status(401).json({ success: false, message: 'Account not found or deactivated' });
    }
    req.reseller = reseller;
    next();
  } catch (err) { next(err); }
};

// Attach reseller if logged in — does NOT block guests
export const attachReseller = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      if (decoded.role === 'reseller') {
        const reseller = await Reseller.findByPk(decoded.id);
        if (reseller?.isActive) req.reseller = reseller;
      }
    }
  } catch {}
  next();
};