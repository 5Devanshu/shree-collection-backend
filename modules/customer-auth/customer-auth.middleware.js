import jwt from 'jsonwebtoken';
import CustomerAuth from './customer-auth.model.js';

// Middleware to protect customer routes
export const protectCustomer = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'customer') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    const customer = await CustomerAuth.findById(decoded.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    req.customer = {
      id: customer._id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

// Optional: Middleware to check session ID
export const validateSessionId = (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) {
    return res.status(401).json({ success: false, message: 'Session ID required' });
  }
  req.sessionId = sessionId;
  next();
};
