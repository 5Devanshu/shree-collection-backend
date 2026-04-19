const Order = require('../models/Order');

// ── @desc    Get all orders for logged-in customer
// ── @route   GET /api/customers/orders
// ── @access  Customer only
// ── @query   ?status=pending|confirmed|shipped|delivered|cancelled
//             ?page=1 &limit=10
const getMyOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { customerId: req.customer._id };
    if (status) filter.status = status;

    const pageNum  = Math.max(1, parseInt(page,  10));
    const limitNum = Math.min(20, parseInt(limit, 10));
    const skip     = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count:      orders.length,
      total,
      page:       pageNum,
      totalPages: Math.ceil(total / limitNum),
      data:       orders,
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Get single order detail for logged-in customer
// ── @route   GET /api/customers/orders/:id
// ── @access  Customer only
const getMyOrderById = async (req, res, next) => {
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

module.exports = { getMyOrders, getMyOrderById };