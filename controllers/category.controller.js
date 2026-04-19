const Category  = require('../models/Category');
const Product   = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// ── @desc    Get all categories
// ── @route   GET /api/categories
// ── @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (err) { next(err); }
};

// ── @desc    Get single category by slug
// ── @route   GET /api/categories/:slug
// ── @access  Public
const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (err) { next(err); }
};

// ── @desc    Create category
// ── @route   POST /api/categories
// ── @access  Admin only
const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, image, imagePublicId } = req.body;

    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A category with this slug already exists',
      });
    }

    const category = await Category.create({
      name,
      slug,
      description:   description   || '',
      image:         image         || '',
      imagePublicId: imagePublicId || '',
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (err) { next(err); }
};

// ── @desc    Update category
// ── @route   PUT /api/categories/:id
// ── @access  Admin only
const updateCategory = async (req, res, next) => {
  try {
    const { name, slug, description, image, imagePublicId } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check slug uniqueness if changed
    if (slug && slug !== category.slug) {
      const slugTaken = await Category.findOne({ slug, _id: { $ne: req.params.id } });
      if (slugTaken) {
        return res.status(400).json({
          success: false,
          message: 'A category with this slug already exists',
        });
      }
      // Cascade slug change to all products
      await Product.updateMany({ categorySlug: category.slug }, { categorySlug: slug });
    }

    // If image is being replaced — delete old one from Cloudinary
    if (image && image !== category.image && category.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(category.imagePublicId);
      } catch (e) {
        console.error('Could not delete old category image from Cloudinary:', e.message);
      }
    }

    category.name          = name          ?? category.name;
    category.slug          = slug          ?? category.slug;
    category.description   = description   ?? category.description;
    category.image         = image         ?? category.image;
    category.imagePublicId = imagePublicId ?? category.imagePublicId;

    const updated = await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updated,
    });
  } catch (err) { next(err); }
};

// ── @desc    Delete category
// ── @route   DELETE /api/categories/:id
// ── @access  Admin only
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const productCount = await Product.countDocuments({ categorySlug: category.slug });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete — ${productCount} product${productCount > 1 ? 's' : ''} belong to this category. Reassign or delete them first.`,
      });
    }

    // Delete image from Cloudinary if it exists
    if (category.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(category.imagePublicId);
      } catch (e) {
        console.error('Could not delete category image from Cloudinary:', e.message);
      }
    }

    await category.deleteOne();

    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (err) { next(err); }
};

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};