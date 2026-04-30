import jwt from 'jsonwebtoken';
import CustomerAuth from './customer-auth.model.js';

// Generate signed JWT token
export const generateToken = (id) => {
  return jwt.sign({ id, type: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Generate session ID (x-session-id)
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

// Register customer
export const registerCustomerService = async ({ email, password, firstName, lastName, phone }) => {
  if (!email || !password || !firstName) {
    throw new Error('Email, password, and first name are required');
  }

  // Check if customer already exists
  const existingCustomer = await CustomerAuth.findOne({ email: email.toLowerCase().trim() });
  if (existingCustomer) {
    throw new Error('Email already registered');
  }

  // Create new customer
  const customer = await CustomerAuth.create({
    email: email.toLowerCase().trim(),
    password,
    firstName,
    lastName: lastName || '',
    phone: phone || '',
    role: 'customer',
  });

  const token = generateToken(customer._id);
  const sessionId = generateSessionId();

  return {
    token,
    sessionId,
    customer: {
      id: customer._id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      role: customer.role,
    },
  };
};

// Login customer
export const loginCustomerService = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  const customer = await CustomerAuth.findOne({ email: normalizedEmail }).select('+password');
  if (!customer || !(await customer.comparePassword(password))) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(customer._id);
  const sessionId = generateSessionId();

  return {
    token,
    sessionId,
    customer: {
      id: customer._id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      role: customer.role,
    },
  };
};

// Get customer by ID
export const getCustomerService = async (customerId) => {
  const customer = await CustomerAuth.findById(customerId);
  if (!customer) throw new Error('Customer not found');
  return customer;
};

// Update customer profile
export const updateCustomerService = async (customerId, { firstName, lastName, phone }) => {
  const customer = await CustomerAuth.findByIdAndUpdate(
    customerId,
    { firstName, lastName, phone },
    { new: true, runValidators: true }
  );

  if (!customer) throw new Error('Customer not found');
  return customer;
};

// Change password
export const changeCustomerPasswordService = async (customerId, { currentPassword, newPassword }) => {
  const customer = await CustomerAuth.findById(customerId).select('+password');
  if (!customer) throw new Error('Customer not found');

  const isMatch = await customer.comparePassword(currentPassword);
  if (!isMatch) throw new Error('Current password is incorrect');

  customer.password = newPassword;
  await customer.save();

  return { message: 'Password updated successfully' };
};

// Verify token
export const verifyTokenService = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'customer') {
      throw new Error('Invalid token type');
    }
    const customer = await CustomerAuth.findById(decoded.id);
    if (!customer) throw new Error('Customer not found');
    return customer;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
