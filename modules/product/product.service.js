import { Op } from 'sequelize';
import Product  from './product.model.js';
import Category from '../category/category.model.js';

// ─── Normalize incoming sizeStock entries from the admin form ─────────────────
// Admin adds sizes one at a time (chips), each with its own stock. We trust
// whatever list of {size, stock} pairs the frontend sends — no more range
// generation. Dedupes by size (last one wins) and sorts ascending.
const normalizeSizeStock = (rawSizeStock) => {
  if (!Array.isArray(rawSizeStock)) return [];

  const bySize = new Map();
  for (const entry of rawSizeStock) {
    const size  = Number(entry?.size);
    const stock = Number(entry?.stock) || 0;
    if (!Number.isFinite(size)) continue;
    bySize.set(size, { size, stock });
  }

  return Array.from(bySize.values()).sort((a, b) => a.size - b.size);
};

// ─── Normalize incoming data from frontend ────────────────────────────────────
const normalizeProductData = (data) => {
  const d = { ...data };

  // Frontend sends image as { url, key } object or flat string → map to imageUrl
  if (d.image !== undefined) {
    if (typeof d.image === 'object' && d.image?.url) {
      d.imageUrl = d.image.url;
      d.imageKey = d.image.key || '';
    } else if (typeof d.image === 'string' && d.image) {
      d.imageUrl = d.image;
    }
    delete d.image;
  }

  // Frontend sends category UUID as `category` → map to categoryId
  if (d.category && !d.categoryId) {
    d.categoryId = d.category;
    delete d.category;
  }

  // Auto-derive stockStatus from stock count if not explicitly provided
  if (d.stock !== undefined && d.stockStatus === undefined) {
    const s = Number(d.stock);
    d.stockStatus = s === 0 ? 'out_of_stock' : s <= 5 ? 'low_stock' : 'in_stock';
  }

  // ── Sizing ──────────────────────────────────────────────────────────────
  // sizeEnabled is the single source of truth for whether a size selector
  // shows on the storefront (desktop or mobile). Sizes are no longer
  // generated from a min/max/step range — the admin adds each size
  // individually (e.g. 2.4, 2.6, 2.8), and `sizes` is just the list of
  // those values, sorted, with `sizeStock` holding the per-size stock.
  if (d.sizeEnabled) {
    const normalizedStock = normalizeSizeStock(d.sizeStock);
    d.sizeStock = normalizedStock;
    d.sizes     = normalizedStock.map(s => s.size);
  }

  // Sizing explicitly disabled — clear all size data so stale values can
  // never leak onto the storefront. This is what fixes the bug where a
  // size selector appeared on mobile even when the admin didn't add sizes:
  // previously the frontend inferred sizing from category name or leftover
  // array contents instead of checking one explicit flag.
  if (d.sizeEnabled === false) {
    d.sizes     = [];
    d.sizeStock = [];
  }

  return d;
};

// ─── Helper: apply reseller or retail display price ───────────────────────────
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

const CATEGORY_INCLUDE = [{
  model:      Category,
  as:         'category',
  attributes: ['id', 'name', 'slug'],
}];

// ─── Get All Products ─────────────────────────────────────────────────────────
export const getAllProductsService = async (
  { page = 1, limit = 20, category, stockStatus, search } = {},
  isReseller = false
) => {
  const where = {};
  if (category)    where.categoryId  = category;
  if (stockStatus) where.stockStatus = stockStatus;
  if (search)      where.title       = { [Op.iLike]: `%${search}%` };

  const skip = (Number(page) - 1) * Number(limit);

  const { rows, count: total } = await Product.findAndCountAll({
    where,
    include: CATEGORY_INCLUDE,
    order:   [['createdAt', 'DESC']],
    offset:  skip,
    limit:   Number(limit),
  });

  const products = rows.map((p) => applyDisplayPrice(p.toJSON(), isReseller));
  return { products, total, page: Number(page), limit: Number(limit) };
};

// ─── Get Featured Products ────────────────────────────────────────────────────
export const getFeaturedProductsService = async (isReseller = false) => {
  const rows = await Product.findAll({
    where:   { isFeatured: true, stockStatus: { [Op.ne]: 'out_of_stock' } },
    include: CATEGORY_INCLUDE,
    order:   [['createdAt', 'DESC']],
    limit:   8,
  });
  return rows.map((p) => applyDisplayPrice(p.toJSON(), isReseller));
};

// ─── Get Products by Category Slug ───────────────────────────────────────────
export const getProductsByCategoryService = async (slug, isReseller = false) => {
  const category = await Category.findOne({ where: { slug } });
  if (!category) return [];

  const rows = await Product.findAll({
    where:   { categoryId: category.id, stockStatus: { [Op.ne]: 'out_of_stock' } },
    include: CATEGORY_INCLUDE,
    order:   [['createdAt', 'DESC']],
  });
  return rows.map((p) => applyDisplayPrice(p.toJSON(), isReseller));
};

// ─── Get Single Product by ID ─────────────────────────────────────────────────
export const getProductByIdService = async (id, isReseller = false) => {
  const product = await Product.findByPk(id, { include: CATEGORY_INCLUDE });
  if (!product) throw new Error('Product not found');
  return applyDisplayPrice(product.toJSON(), isReseller);
};

// ─── Create Product ───────────────────────────────────────────────────────────
export const createProductService = async (data) => {
  const normalized = normalizeProductData(data);

  const percent = normalized.discountPercent || 0;
  const enabled = normalized.discountEnabled || false;
  const price   = normalized.price || 0;

  if (enabled && percent > 0) {
    normalized.discountedPrice = parseFloat(
      (Number(price) - (Number(price) * Number(percent)) / 100).toFixed(2)
    );
  }

  const product = await Product.create(normalized);
  return product.reload({ include: CATEGORY_INCLUDE });
};

// ─── Update Product ───────────────────────────────────────────────────────────
export const updateProductService = async (id, data) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Product not found');

  const normalized = normalizeProductData(data);

  // Auto-calculate discountedPrice when discountPercent changes
  const percent = normalized.discountPercent ?? product.discountPercent;
  const enabled = normalized.discountEnabled ?? product.discountEnabled;
  const price   = normalized.price ?? product.price;

  if (enabled && percent > 0) {
    normalized.discountedPrice = parseFloat(
      (Number(price) - (Number(price) * Number(percent)) / 100).toFixed(2)
    );
  } else {
    normalized.discountedPrice = Number(price);
  }

  await product.update(normalized);
  return product.reload({ include: CATEGORY_INCLUDE });
};

// ─── Delete Product ───────────────────────────────────────────────────────────
export const deleteProductService = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Product not found');
  await product.destroy();
  return { message: 'Product deleted successfully' };
};

// ─── Toggle Featured ──────────────────────────────────────────────────────────
export const toggleFeaturedService = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Product not found');
  await product.update({ isFeatured: !product.isFeatured });
  return product;
};

// ─── Update Stock ─────────────────────────────────────────────────────────────
export const updateStockService = async (id, { stock, stockStatus }) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Product not found');

  const updates = {};
  if (stock       !== undefined) updates.stock       = stock;
  if (stockStatus !== undefined) updates.stockStatus = stockStatus;

  if (stock !== undefined && stockStatus === undefined) {
    const s = Number(stock);
    updates.stockStatus = s === 0 ? 'out_of_stock' : s <= 5 ? 'low_stock' : 'in_stock';
  }

  await product.update(updates);
  return product;
};

// ─── Get Products In Stock Count ──────────────────────────────────────────────
export const getProductsInStockCountService = async () => {
  return Product.count({ where: { stockStatus: { [Op.ne]: 'out_of_stock' } } });
};

// ─── Get Related Products ─────────────────────────────────────────────────────
export const getRelatedProductsService = async (productId, isReseller = false) => {
  const product = await Product.findByPk(productId);
  if (!product) throw new Error('Product not found');

  const rows = await Product.findAll({
    where: {
      categoryId:  product.categoryId,
      id:          { [Op.ne]: productId },
      stockStatus: { [Op.ne]: 'out_of_stock' },
    },
    include: CATEGORY_INCLUDE,
    limit:   4,
  });
  return rows.map((p) => applyDisplayPrice(p.toJSON(), isReseller));
};