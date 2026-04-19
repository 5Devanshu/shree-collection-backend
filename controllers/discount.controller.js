const Product = require('../models/Product');

// ── @desc    Set or update discount on a product
// ── @route   PUT /api/discounts/:productId
// ── @access  Admin only
const setDiscount = async (req, res, next) => {
  try {
    const { discountPercent } = req.body;

    if (discountPercent === undefined || discountPercent < 0 || discountPercent > 100) {
      return res.status(400).json({
        success: false,
        message: 'Discount percent must be between 0 and 100',
      });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.discountPercent = discountPercent;
    // discountedPrice is auto-computed in the pre-save hook
    const updated = await product.save();

    res.status(200).json({
      success: true,
      message: `Discount set to ${discountPercent}%`,
      data: {
        id:              updated._id,
        title:           updated.title,
        price:           updated.price,
        discountEnabled: updated.discountEnabled,
        discountPercent: updated.discountPercent,
        discountedPrice: updated.discountedPrice,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Enable discount on a product
// ── @route   PATCH /api/discounts/:productId/enable
// ── @access  Admin only
const enableDiscount = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.discountPercent <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Set a discount percentage before enabling. Use PUT /api/discounts/:productId first.',
      });
    }

    product.discountEnabled = true;
    const updated = await product.save();

    res.status(200).json({
      success: true,
      message: `Discount of ${updated.discountPercent}% is now active on "${updated.title}"`,
      data: {
        id:              updated._id,
        title:           updated.title,
        price:           updated.price,
        discountEnabled: updated.discountEnabled,
        discountPercent: updated.discountPercent,
        discountedPrice: updated.discountedPrice,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Disable discount on a product
// ── @route   PATCH /api/discounts/:productId/disable
// ── @access  Admin only
const disableDiscount = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.discountEnabled = false;
    const updated = await product.save();

    res.status(200).json({
      success: true,
      message: `Discount disabled on "${updated.title}"`,
      data: {
        id:              updated._id,
        title:           updated.title,
        price:           updated.price,
        discountEnabled: updated.discountEnabled,
        discountPercent: updated.discountPercent,
        discountedPrice: updated.discountedPrice,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Remove discount entirely from a product
// ── @route   DELETE /api/discounts/:productId
// ── @access  Admin only
const removeDiscount = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.discountEnabled = false;
    product.discountPercent = 0;
    product.discountedPrice = product.price;
    const updated = await product.save();

    res.status(200).json({
      success: true,
      message: `Discount removed from "${updated.title}"`,
      data: {
        id:              updated._id,
        title:           updated.title,
        price:           updated.price,
        discountEnabled: updated.discountEnabled,
        discountPercent: updated.discountPercent,
        discountedPrice: updated.discountedPrice,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @desc    Get all products that currently have discount enabled
// ── @route   GET /api/discounts
// ── @access  Public
const getDiscountedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ discountEnabled: true })
      .sort({ discountPercent: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data:  products,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  setDiscount,
  enableDiscount,
  disableDiscount,
  removeDiscount,
  getDiscountedProducts,
};