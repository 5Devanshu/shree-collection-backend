import jwt      from 'jsonwebtoken';
import Customer from '../../models/Customer.js';

export const protectCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorised — please log in' });
    }
    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'customer') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const customer = await Customer.findById(decoded.id);
    if (!customer || !customer.isActive) {
      return res.status(401).json({ success: false, message: 'Account not found or deactivated' });
    }
    req.customer = customer;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};
