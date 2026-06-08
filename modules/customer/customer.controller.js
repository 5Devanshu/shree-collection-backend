import jwt      from 'jsonwebtoken';
import Customer from '../../models/Customer.js';
import Order    from '../../modules/order/order.model.js';
import { sendWelcomeEmail } from '../../services/email.service.js';

const generateCustomerToken = (id) =>
  jwt.sign({ id, role: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/customers/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const existing = await Customer.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const customer = await Customer.create({ name, email, password, phone });
    const token    = generateCustomerToken(customer.id);

    sendWelcomeEmail(customer.email, customer.name).catch((err) =>
      console.error('Failed to send welcome email:', err)
    );

    res.status(201).json({
      success:  true,
      message:  'Account created successfully',
      token,
      customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
    });
  } catch (err) { next(err); }
};

// POST /api/customers/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Sequelize: use where object — no .select() needed, password is always fetched
    const customer = await Customer.findOne({ where: { email } });

    if (!customer) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!customer.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
    }

    const isMatch = await customer.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateCustomerToken(customer.id);

    res.status(200).json({
      success:  true,
      token,
      customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
    });
  } catch (err) { next(err); }
};

// GET /api/customers/me
export const getMe = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.customer.id);
    res.status(200).json({
      success: true,
      data: {
        id:             customer.id,
        name:           customer.name,
        email:          customer.email,
        phone:          customer.phone,
        savedAddresses: customer.savedAddresses,
        createdAt:      customer.createdAt,
      },
    });
  } catch (err) { next(err); }
};

// PUT /api/customers/me
export const updateMe = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const customer        = await Customer.findByPk(req.customer.id);

    if (name)  customer.name  = name;
    if (phone) customer.phone = phone;
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
    });
  } catch (err) { next(err); }
};

// PUT /api/customers/me/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const customer = await Customer.findByPk(req.customer.id);

    const isMatch = await customer.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    customer.password = newPassword; // beforeSave hook hashes it
    await customer.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
};

// POST /api/customers/me/addresses
export const addAddress = async (req, res, next) => {
  try {
    const customer  = await Customer.findByPk(req.customer.id);
    const addresses = [...(customer.savedAddresses || [])];
    addresses.push({ ...req.body, _id: Date.now().toString() });
    customer.savedAddresses = addresses;
    await customer.save();

    res.status(200).json({ success: true, message: 'Address added', data: customer.savedAddresses });
  } catch (err) { next(err); }
};

// DELETE /api/customers/me/addresses/:addressId
export const deleteAddress = async (req, res, next) => {
  try {
    const customer  = await Customer.findByPk(req.customer.id);
    customer.savedAddresses = (customer.savedAddresses || []).filter(
      (a) => a._id !== req.params.addressId
    );
    await customer.save();

    res.status(200).json({ success: true, message: 'Address removed', data: customer.savedAddresses });
  } catch (err) { next(err); }
};

// GET /api/customers/orders
export const getMyOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = { customerId: req.customer.id };
    if (status) where.status = status;

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(20, parseInt(limit, 10));

    const { rows: orders, count: total } = await Order.findAndCountAll({
      where,
      order:  [['createdAt', 'DESC']],
      offset: (pageNum - 1) * limitNum,
      limit:  limitNum,
    });

    res.status(200).json({
      success: true,
      count:      orders.length,
      total,
      page:       pageNum,
      totalPages: Math.ceil(total / limitNum),
      data:       orders,
    });
  } catch (err) { next(err); }
};

// GET /api/customers/orders/:id
export const getMyOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, customerId: req.customer.id },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) { next(err); }
};