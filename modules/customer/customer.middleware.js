import jwt from 'jsonwebtoken';
import Customer from '../../models/Customer.js';

// ── Protect customer routes — must be logged in ───────────────────────────────
export const protectCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorised — please log in',
      });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure token is a customer token not an admin token
    if (decoded.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const customer = await Customer.findById(decoded.id);

    if (!customer || !customer.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or deactivated',
      });
    }

    req.customer = customer;
    next();
  } catch (err) {
    next(err);
  }
};

// ── Attach customer if logged in — does not block if not logged in ────────────
// Used on routes that work for both guests and logged-in customers
export const attachCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role === 'customer') {
        const customer = await Customer.findById(decoded.id);
        if (customer && customer.isActive) req.customer = customer;
      }
    }

    next();
  } catch {
    // Token invalid or expired — treat as guest, do not block
    next();
  }
};
