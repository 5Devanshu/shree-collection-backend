import * as categoryService from './category.service.js';

// GET /api/categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategoriesService();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/categories/active
const getActiveCategories = async (req, res) => {
  try {
    const categories = await categoryService.getActiveCategoriesService();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/categories/slug/:slug
const getCategoryBySlug = async (req, res) => {
  try {
    const category = await categoryService.getCategoryBySlugService(req.params.slug);
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// GET /api/categories/:id
const getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryByIdService(req.params.id);
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// POST /api/categories  [Admin]
const createCategory = async (req, res) => {
  try {
    const category = await categoryService.createCategoryService(req.body);
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/categories/:id  [Admin]
const updateCategory = async (req, res) => {
  try {
    const category = await categoryService.updateCategoryService(req.params.id, req.body);
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/categories/:id  [Admin]
const deleteCategory = async (req, res) => {
  try {
    const result = await categoryService.deleteCategoryService(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export {
  getAllCategories,
  getActiveCategories,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};