import { Op } from 'sequelize';
import Product  from './product.model.js';
import Category from '../category/category.model.js';

// Get all products — AdminProducts table + homepage
export const getAllProductsService = async ({ page = 1, limit = 20, category, stockStatus } = {}) => {
  const where = {};
  if (category)    where.categoryId   = category;
  if (stockStatus) where.stockStatus  = stockStatus;

  const skip = (Number(page) - 1) * Number(limit);

  const { rows: products, count: total } = await Product.findAndCountAll({
    where,
    include: [{ model: Category, as: 'category', attributes: ['name', 'slug'] }],
    order:   [['createdAt', 'DESC']],
    offset:  skip,
    limit:   Number(limit),
  });

  return { products, total, page: Number(page), limit: Number(limit) };
};

// Get featured products — FeaturedGrid on homepage
export const getFeaturedProductsService = async () => {
  return Product.findAll({
    where: {
      isFeatured:  true,
      stockStatus: { [Op.ne]: 'out_of_stock' },
    },
    include: [{ model: Category, as: 'category', attributes: ['name', 'slug'] }],
    limit: 6,
  });
};

// Get products by category slug — CategoryPage /collections/:category
export const getProductsByCategoryService = async (slug) => {
  const category = await Category.findOne({ where: { slug } });
  if (!category) return [];

  return Product.findAll({
    where: { categoryId: category.id },
    include: [{ model: Category, as: 'category', attributes: ['name', 'slug'] }],
    order: [['createdAt', 'DESC']],
  });
};

// Get single product by ID — ProductDescription /product/:id
export const getProductByIdService = async (id) => {
  const product = await Product.findByPk(id, {
    include: [{ model: Category, as: 'category', attributes: ['name', 'slug'] }],
  });
  if (!product) throw new Error('Product not found');
  return product;
};

// Create a new product — AdminProducts "+ Add Product"
export const createProductService = async (data) => {
  return Product.create(data);
};

// Update a product — AdminProducts "Edit"
export const updateProductService = async (id, data) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Product not found');
  await product.update(data);
  return product;
};

// Delete a product — AdminProducts "Delete"
export const deleteProductService = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Product not found');
  await product.destroy();
  return { message: 'Product deleted successfully' };
};

// Total in-stock products — AdminDashboard stat card
export const getProductsInStockCountService = async () => {
  return Product.count({
    where: { stockStatus: { [Op.ne]: 'out_of_stock' } },
  });
};