const StockNotification = require('../models/StockNotification');
const Product           = require('../models/Product');
const { sendStockBackEmail } = require('../config/mailer');

// ── @desc    Customer subscribes to stock notification for a product
// ── @route   POST /api/stock-notify/:productId/subscribe
// ── @access  Public
const subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.stock > 0) {
      return res.status(400).json({
        success: false,
        message: 'This product is currently in stock — no need to subscribe',
      });
    }

    // Attach customerId if logged in
    const customerId = req.customer?._id || null;

    // Upsert — do not create duplicates
    await StockNotification.findOneAndUpdate(
      { productId: req.params.productId, email },
      { productId: req.params.productId, email, customerId, notified: false, notifiedAt: null },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `We will notify you at ${email} when "${product.title}" is back in stock`,
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Admin updates stock — triggers notifications if back in stock
// ── @route   PATCH /api/stock-notify/:productId/update-stock
// ── @access  Admin only
const updateStock = async (req, res, next) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid stock quantity (0 or above)',
      });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const wasOutOfStock = product.stock === 0;
    product.stock       = stock;
    const updated       = await product.save();

    // ── If product just came back in stock — notify all subscribers ───────────
    if (wasOutOfStock && stock > 0) {
      const subscribers = await StockNotification.find({
        productId: req.params.productId,
        notified:  false,
      });

      if (subscribers.length > 0) {
        // Send emails concurrently
        const emailPromises = subscribers.map(sub =>
          sendStockBackEmail({
            to:           sub.email,
            productTitle: updated.title,
            productId:    updated._id,
          }).catch(err => {
            // Log but do not fail the request if one email fails
            console.error(`Failed to send stock email to ${sub.email}: ${err.message}`);
          })
        );

        await Promise.all(emailPromises);

        // Mark all as notified
        await StockNotification.updateMany(
          { productId: req.params.productId, notified: false },
          { notified: true, notifiedAt: new Date() }
        );

        console.log(`Stock notifications sent to ${subscribers.length} subscriber(s) for "${updated.title}"`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Stock updated to ${stock}${wasOutOfStock && stock > 0 ? ` — ${await StockNotification.countDocuments({ productId: req.params.productId, notified: true })} customer(s) notified` : ''}`,
      data: {
        id:    updated._id,
        title: updated.title,
        stock: updated.stock,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Get all subscribers for a product
// ── @route   GET /api/stock-notify/:productId/subscribers
// ── @access  Admin only
const getSubscribers = async (req, res, next) => {
  try {
    const subscribers = await StockNotification.find({
      productId: req.params.productId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subscribers.length,
      data:  subscribers,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { subscribe, updateStock, getSubscribers };