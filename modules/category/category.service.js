import Category from './category.model.js';

// Auto-generate slug from name — e.g. "Bangles & Rings" → "bangles-rings"
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
};

// Get all categories with live product count
// Used by: AdminCategory table (Name, Slug, Products Count columns)
const getAllCategoriesService = async () => {
  return Category.find()
    .populate('productCount')
    .sort({ name: 1 });
};

// Get only active categories
// Used by: Navbar Collections dropdown, CategoryPage listing
const getActiveCategoriesService = async () => {
  return Category.find({ isActive: true })
    .populate('productCount')
    .sort({ name: 1 });
};

// Get single category by slug
// Used by: CategoryPage — /collections/:category (useParams slug match)
const getCategoryBySlugService = async (slug) => {
  const category = await Category.findOne({ slug }).populate('productCount');
  if (!category) throw new Error(`Category "${slug}" not found`);
  return category;
};

// Get single category by ID
// Used by: AdminCategory Edit action
const getCategoryByIdService = async (id) => {
  const category = await Category.findById(id).populate('productCount');
  if (!category) throw new Error('Category not found');
  return category;
};

// Create a new category
// Used by: AdminCategory "+ Add Category" button
const createCategoryService = async ({ name, description }) => {
  const slug = generateSlug(name);

  const existing = await Category.findOne({ slug });
  if (existing) throw new Error(`A category with slug "${slug}" already exists`);

  return Category.create({ name, slug, description });
};

// Update a category
// Used by: AdminCategory "Edit" button
const updateCategoryService = async (id, { name, description, isActive }) => {
  const updates = { description, isActive };

  if (name) {
    updates.name = name;
    updates.slug = generateSlug(name);

    // Guard against slug collision with another category
    const conflict = await Category.findOne({ slug: updates.slug, _id: { $ne: id } });
    if (conflict) throw new Error(`Slug "${updates.slug}" is already in use`);
  }

  const category = await Category.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new Error('Category not found');
  return category;
};

// Delete a category
// Used by: AdminCategory admin action
const deleteCategoryService = async (id) => {
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new Error('Category not found');
  return { message: 'Category deleted successfully' };
};

// Count active categories
// Used by: AdminDashboard "Active Categories" stat card
const getActiveCategoryCountService = async () => {
  return Category.countDocuments({ isActive: true });
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