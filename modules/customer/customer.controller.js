import jwt from 'jsonwebtoken';
import Customer from '../../models/Customer.js';
import Order from '../../modules/order/order.model.js';
import { sendWelcomeEmail } from '../../services/email.service.js';

const generateCustomerToken = (id) =>
  jwt.sign({ id, role: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── @desc    Register customer
// ── @route   POST /api/customers/register
// ── @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const existing = await Customer.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const customer = await Customer.create({ name, email, password, phone });
    const token    = generateCustomerToken(customer._id);

    // Send welcome email (async, non-blocking)
    sendWelcomeEmail(customer.email, customer.name).catch(err => 
      console.error('Failed to send welcome email:', err)
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      customer: {
        id:    customer._id,
        name:  customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Login customer
// ── @route   POST /api/customers/login
// ── @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const customer = await Customer.findOne({ email }).select('+password');

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const isMatch = await customer.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateCustomerToken(customer._id);

    res.status(200).json({
      success: true,
      token,
      customer: {
        id:    customer._id,
        name:  customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Get current customer profile
// ── @route   GET /api/customers/me
// ── @access  Customer only
export const getMe = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.customer._id);

    res.status(200).json({
      success: true,
      data: {
        id:             customer._id,
        name:           customer.name,
        email:          customer.email,
        phone:          customer.phone,
        savedAddresses: customer.savedAddresses,
        createdAt:      customer.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Update customer profile
// ── @route   PUT /api/customers/me
// ── @access  Customer only
export const updateMe = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const customer        = await Customer.findById(req.customer._id);

    if (name)  customer.name  = name;
    if (phone) customer.phone = phone;

    const updated = await customer.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id:    updated._id,
        name:  updated.name,
        email: updated.email,
        phone: updated.phone,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Change password
// ── @route   PUT /api/customers/me/change-password
// ── @access  Customer only
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    const customer = await Customer.findById(req.customer._id).select('+password');
    const isMatch  = await customer.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    customer.password = newPassword;
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Save a delivery address
// ── @route   POST /api/customers/me/addresses
// ── @access  Customer only
export const addAddress = async (req, res, next) => {
  try {
    const { label, line1, line2, city, state, pincode } = req.body;

    if (!line1 || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Line1, city, state and pincode are required',
      });
    }

    const customer = await Customer.findById(req.customer._id);
    customer.savedAddresses.push({ label: label || 'Home', line1, line2, city, state, pincode });
    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Address saved successfully',
      data:    customer.savedAddresses,
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Delete a saved address
// ── @route   DELETE /api/customers/me/addresses/:addressId
// ── @access  Customer only
export const deleteAddress = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    customer.savedAddresses = customer.savedAddresses.filter(
      a => a._id.toString() !== req.params.addressId
    );
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Address removed',
      data:    customer.savedAddresses,
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Get all orders for logged-in customer
// ── @route   GET /api/customers/orders
// ── @access  Customer only
// GET /api/customers/orders
export const getMyOrders = async (req, res, next) => {
  try {
    const customer = req.customer;

    // ✅ Find orders by customer ID OR by matching email
    // This covers both: linked orders (future) and guest orders (current)
    const orders = await Order.find({
      $or: [
        { customerId: customer._id },
        { email:      customer.email },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('items.product', 'title image material');

    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Get single order detail for logged-in customer
// ── @route   GET /api/customers/orders/:id
// ── @access  Customer only
export const getMyOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id:        req.params.id,
      customerId: req.customer._id,  // ensure customer can only see their own orders
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};
