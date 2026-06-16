import jwt from 'jsonwebtoken';

// Optional auth — attaches req.reseller or req.customer if token is valid,
// but never blocks the request (guests pass through freely)
const optionalAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next();

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log('OPTIONAL AUTH DECODED:', decoded); // ← add this
if (decoded.role === 'reseller') req.reseller = decoded;
if (decoded.role === 'customer') req.customer = decoded;
  } catch {
    // Invalid/expired token — treat as guest, don't block
  }
  next();
};

export default optionalAuth;