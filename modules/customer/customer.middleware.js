import jwt      from 'jsonwebtoken';
import Customer from '../../models/Customer.js';

export const protectCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorised — please log in' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'customer') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const customer = await Customer.findByPk(decoded.id);   // ← was findById()
    if (!customer || !customer.isActive) {
      return res.status(401).json({ success: false, message: 'Account not found or deactivated' });
    }

    req.customer = customer;
    next();
  } catch (err) { next(err); }
};

export const attachCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'customer') {
        const customer = await Customer.findByPk(decoded.id);  // ← was findById()
        if (customer && customer.isActive) req.customer = customer;
      }
    }
    next();
  } catch {
    next();
  }
};