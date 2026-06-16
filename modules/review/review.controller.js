import Review  from './review.model.js';
import Product from '../product/product.model.js';
import jwt     from 'jsonwebtoken';

// Helper — decode token and return { id, role, name } or null
const decodeToken = (req) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded; // { id, role: 'customer'|'reseller', name? }
  } catch {
    return null;
  }
};

// ── GET /api/reviews/:productId ───────────────────────────────────────────────
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.findAll({
      where: { productId },
      order: [['createdAt', 'DESC']],
    });

    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.status(200).json({ success: true, reviews, average: avg, count: reviews.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/reviews/:productId ──────────────────────────────────────────────
// Requires customer or reseller JWT
export const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });

    const decoded = decodeToken(req);
    if (!decoded)
      return res.status(401).json({ success: false, message: 'Please log in to leave a review.' });

    const product = await Product.findByPk(productId);
    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found.' });

    // Prevent duplicate reviews from same user
    const existing = await Review.findOne({
      where: decoded.role === 'reseller'
        ? { productId, resellerId: decoded.id }
        : { productId, customerId: decoded.id },
    });
    if (existing)
      return res.status(409).json({ success: false, message: 'You have already reviewed this product.' });

    const review = await Review.create({
      productId,
      customerId:   decoded.role === 'customer' ? decoded.id : null,
      resellerId:   decoded.role === 'reseller' ? decoded.id : null,
      reviewerName: decoded.name || 'Anonymous',
      reviewerType: decoded.role === 'reseller' ? 'reseller' : 'customer',
      rating:       Number(rating),
      comment:      comment?.trim() || null,
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/reviews (admin — all reviews) ────────────────────────────────────
export const getAllReviews = async (req, res) => {
  try {
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      reviews,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE /api/reviews/:id (admin) ──────────────────────────────────────────
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review)
      return res.status(404).json({ success: false, message: 'Review not found.' });

    await review.destroy();
    res.status(200).json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};