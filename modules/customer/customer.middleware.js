import jwt      from 'jsonwebtoken';
import Customer from './customer.model.js';

export const protectCustomer = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'Not authorised' });

    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.type !== 'customer')
      return res.status(403).json({ success: false, message: 'Access denied' });

    const customer = await Customer.findByPk(decoded.id);
    if (!customer || !customer.isActive)
      return res.status(401).json({ success: false, message: 'Account not found or deactivated' });

    req.customer = customer;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};