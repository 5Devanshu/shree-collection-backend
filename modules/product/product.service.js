import { Op } from 'sequelize';
import Product  from './product.model.js';
import Category from '../category/category.model.js';

// ─── Helper: apply reseller or retail display price ───────────────────────────
// isReseller = true  → show resellerPrice (if set), else fall back to retail
// isReseller = false → show discountedPrice if discount active, else price
const applyDisplayPrice = (productJson, isReseller) => {
  if (isReseller && productJson.resellerPrice > 0) {
    productJson.displayPrice    = parseFloat(productJson.resellerPrice);
    productJson.isResellerPrice = true;
  } else {
    productJson.displayPrice    = productJson.discountEnabled
      ? parseFloat(productJson.discountedPrice)
      : parseFloat(productJson.price);
    productJson.isResellerPrice = false;
  }
  return productJson;
};

// ─── Get All Products ─────────────────────────────────────────────────────────
// Used by: AdminProducts table, homepage fallback, general product listing
// Supports: pagination, categoryId filter, stockStatus filter
export const getAllProductsService = async (
  { page = 1, limit = 20, category, stockStatus, search } = {},
  isReseller = false
) => {
  const where = {};
  if (category)    where.categoryId  = category;
  if (stockStatus) where.stockStatus = stockStatus;

  // Basic title search (used by AdminProducts search bar)
  if (search) {
    where.title = { [Op.iLike]: `%${search}%` };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const { rows, count: total } = await Product.findAndCountAll({
    where,
    include: [{
      model:      Category,
      as:         'category',
      attributes: ['id', 'name', 'slug'],
    }],
    order:  [['createdAt', 'DESC']],
    offset: skip,
    limit:  Number(limit),
  });

  const products = rows.map((p) => applyDisplayPrice(p.toJSON(), isReseller));

  return { products, total, page: Number(page), limit: Number(limit) };
};

// ─── Get Featured Products ────────────────────────────────────────────────────
// Used by: FeaturedGrid on homepage
export const getFeaturedProductsService = async (isReseller = false) => {
  const rows = await Product.findAll({
    where: {
      isFeatured:  true,
      stockStatus: { [Op.ne]: 'out_of_stock' },
    },
    include: [{
      model:      Category,
      as:         'category',
      attributes: ['id', 'name', 'slug'],
    }],
    order: [['createdAt', 'DESC']],
    limit: 8,
  });

  return rows.map((p) => applyDisplayPrice(p.toJSON(), isReseller));
};

// ─── Get Products by Category Slug ───────────────────────────────────────────
// Used by: CategoryPage — /collections/:slug
export const getProductsByCategoryService = async (slug, isReseller = false) => {
  const category = await Category.findOne({ where: { slug } });
  if (!category) return [];

  const rows = await Product.findAll({
    where: {
      categoryId:  category.id,
      stockStatus: { [Op.ne]: 'out_of_stock' },
    },
    include: [{
      model:      Category,
      as:         'category',
      attributes: ['id', 'name', 'slug'],
    }],
    order: [['createdAt', 'DESC']],
  });

  return rows.map((p) => applyDisplayPrice(p.toJSON(), isReseller));
};

// ─── Get Single Product by ID ─────────────────────────────────────────────────
// Used by: ProductDescription — /product/:id
export const getProductByIdService = async (id, isReseller = false) => {
  const product = await Product.findByPk(id, {
    include: [{
      model:      Category,
      as:         'category',
      attributes: ['id', 'name', 'slug'],
    }],
  });
  if (!product) throw new Error('Product not found');

  return applyDisplayPrice(product.toJSON(), isReseller);
};

// ─── Create Product ───────────────────────────────────────────────────────────
// Used by: AdminProducts "+ Add Product"
// Expects body to include: title, price, categoryId, stockStatus, imageUrl, imageKey, etc.
export const createProductService = async (data) => {
  const product = await Product.create(data);
  // Reload with category association
  return product.reload({
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
  });
};

// ─── Update Product ───────────────────────────────────────────────────────────
// Used by: AdminProducts "Edit"
export const updateProductService = async (id, data) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Product not found');

  await product.update(data);

  return product.reload({
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
  });
};

// ─── Delete Product ───────────────────────────────────────────────────────────
// Used by: AdminProducts "Delete"
export const deleteProductService = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Product not found');
  await product.destroy();
  return { message: 'Product deleted successfully' };
};

// ─── Toggle Featured ──────────────────────────────────────────────────────────
// Used by: AdminProducts featured toggle switch
export const toggleFeaturedService = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Product not found');
  await product.update({ isFeatured: !product.isFeatured });
  return product;
};

// ─── Update Stock ─────────────────────────────────────────────────────────────
// Used by: AdminProducts stock status dropdown
export const updateStockService = async (id, { stock, stockStatus }) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Product not found');

  const updates = {};
  if (stock       !== undefined) updates.stock       = stock;
  if (stockStatus !== undefined) updates.stockStatus = stockStatus;

  // Auto-derive stockStatus from stock count if not explicitly provided
  if (stock !== undefined && stockStatus === undefined) {
    if (stock === 0)     updates.stockStatus = 'out_of_stock';
    else if (stock <= 5) updates.stockStatus = 'low_stock';
    else                 updates.stockStatus = 'in_stock';
  }

  await product.update(updates);
  return product;
};

// ─── Get Products In Stock Count ──────────────────────────────────────────────
// Used by: AdminDashboard "Products In Stock" stat card
export const getProductsInStockCountService = async () => {
  return Product.count({
    where: { stockStatus: { [Op.ne]: 'out_of_stock' } },
  });
};

// ─── Get Related Products ─────────────────────────────────────────────────────
// Used by: ProductDescription "You may also like" section
export const getRelatedProductsService = async (productId, isReseller = false) => {
  const product = await Product.findByPk(productId);
  if (!product) throw new Error('Product not found');

  const rows = await Product.findAll({
    where: {
      categoryId:  product.categoryId,
      id:          { [Op.ne]: productId },
      stockStatus: { [Op.ne]: 'out_of_stock' },
    },
    include: [{
      model:      Category,
      as:         'category',
      attributes: ['id', 'name', 'slug'],
    }],
    limit: 4,
  });

  return rows.map((p) => applyDisplayPrice(p.toJSON(), isReseller));
};