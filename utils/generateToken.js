const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 * @param {string} id - User/Admin ID
 * @param {number} expiresIn - Token expiration time (default: 7 days)
 * @returns {string} JWT token
 */
const generateToken = (id, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

module.exports = generateToken;
