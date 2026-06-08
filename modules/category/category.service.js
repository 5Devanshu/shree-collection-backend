import { Op } from 'sequelize';
import Category from './category.model.js';
import Product  from '../product/product.model.js';

// Auto-generate slug from name — e.g. "Bangles & Rings" → "bangles-rings"
const generateSlug = (name) =>
  name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

// Get all categories with live product count
// Used by: AdminCategory table (Name, Slug, Products Count columns)
const getAllCategoriesService = async () => {
  const categories = await Category.findAll({
    order: [['name', 'ASC']],
  });

  // Attach product count manually (Sequelize virtual equivalent)
  const withCounts = await Promise.all(
    categories.map(async (cat) => {
      const productCount = await Product.count({ where: { categoryId: cat.id } });
      return { ...cat.toJSON(), productCount };
    })
  );

  return withCounts;
};

// Get only active categories
// Used by: Navbar Collections dropdown, CategoryPage listing
const getActiveCategoriesService = async () => {
  const categories = await Category.findAll({
    where: { isActive: true },
    order: [['name', 'ASC']],
  });

  const withCounts = await Promise.all(
    categories.map(async (cat) => {
      const productCount = await Product.count({ where: { categoryId: cat.id } });
      return { ...cat.toJSON(), productCount };
    })
  );

  return withCounts;
};

// Get single category by slug — CategoryPage /collections/:category
const getCategoryBySlugService = async (slug) => {
  const category = await Category.findOne({ where: { slug } });
  if (!category) throw new Error(`Category "${slug}" not found`);
  const productCount = await Product.count({ where: { categoryId: category.id } });
  return { ...category.toJSON(), productCount };
};

// Get single category by ID — AdminCategory Edit action
const getCategoryByIdService = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) throw new Error('Category not found');
  const productCount = await Product.count({ where: { categoryId: category.id } });
  return { ...category.toJSON(), productCount };
};

// Create a new category — AdminCategory "+ Add Category"
const createCategoryService = async ({ name, description, image, imageKey }) => {
  const slug = generateSlug(name);

  const existing = await Category.findOne({ where: { slug } });
  if (existing) throw new Error(`A category with slug "${slug}" already exists`);

  return Category.create({ name, slug, description: description || '', image: image || '', imageKey: imageKey || '' });
};

// Update a category — AdminCategory "Edit"
const updateCategoryService = async (id, { name, description, isActive, image, imageKey }) => {
  const category = await Category.findByPk(id);
  if (!category) throw new Error('Category not found');

  const updates = {};
  if (description !== undefined) updates.description = description;
  if (isActive    !== undefined) updates.isActive    = isActive;
  if (image       !== undefined) updates.image       = image;
  if (imageKey    !== undefined) updates.imageKey    = imageKey;

  if (name) {
    updates.name = name;
    updates.slug = generateSlug(name);

    // Guard against slug collision with another category
    const conflict = await Category.findOne({
      where: { slug: updates.slug, id: { [Op.ne]: id } },
    });
    if (conflict) throw new Error(`Slug "${updates.slug}" is already in use`);
  }

  await category.update(updates);
  return category;
};

// Delete a category — AdminCategory delete action
const deleteCategoryService = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) throw new Error('Category not found');
  await category.destroy();
  return { message: 'Category deleted successfully' };
};

// Count active categories — AdminDashboard stat card
const getActiveCategoryCountService = async () => {
  return Category.count({ where: { isActive: true } });
};

export {
  getAllCategoriesService,
  getActiveCategoriesService,
  getCategoryBySlugService,
  getCategoryByIdService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  getActiveCategoryCountService,
};