import { Op } from 'sequelize';
import Product  from '../product/product.model.js';
import Category from '../category/category.model.js';

const CATEGORY_INCLUDE = {
  model:      Category,
  as:         'category',
  attributes: ['id', 'name', 'slug'],
  required:   false,
};

// ─── Main product search ──────────────────────────────────────────────────────
// Searches title, material, description via ILIKE (case-insensitive).
// Supports: ?q=necklace&category=necklace&minPrice=100&maxPrice=500&page=1&limit=12
export const searchProductsService = async ({
  q           = '',
  category    = '',
  minPrice,
  maxPrice,
  page        = 1,
  limit       = 12,
  sort        = 'relevance',
} = {}) => {
  const where = {
    stockStatus: { [Op.ne]: 'out_of_stock' },
  };

  // Text match across title, material, description
  if (q.trim()) {
    where[Op.or] = [
      { title:       { [Op.iLike]: `%${q.trim()}%` } },
      { material:    { [Op.iLike]: `%${q.trim()}%` } },
      { description: { [Op.iLike]: `%${q.trim()}%` } },
    ];
  }

  // Category slug filter
  if (category.trim()) {
    where.categorySlug = category.toLowerCase().trim();
  }

  // Price range
  if (minPrice !== undefined) where.price = { ...(where.price || {}), [Op.gte]: Number(minPrice) };
  if (maxPrice !== undefined) where.price = { ...(where.price || {}), [Op.lte]: Number(maxPrice) };

  const orderMap = {
    price_asc:  [['price', 'ASC']],
    price_desc: [['price', 'DESC']],
    newest:     [['createdAt', 'DESC']],
    relevance:  [['createdAt', 'DESC']],
  };
  const order = orderMap[sort] || orderMap.relevance;

  const skip  = (Number(page) - 1) * Number(limit);

  const { count, rows } = await Product.findAndCountAll({
    where,
    include: [CATEGORY_INCLUDE],
    order,
    offset:  skip,
    limit:   Number(limit),
  });

  return {
    products:   rows.map(p => p.toJSON()),
    total:      count,
    totalPages: Math.ceil(count / Number(limit)),
    page:       Number(page),
    limit:      Number(limit),
    query:      q,
  };
};

// ─── Autocomplete suggestions ─────────────────────────────────────────────────
// Returns up to 6 lightweight product matches as user types (min 2 chars).
export const getSearchSuggestionsService = async (q, limit = 6) => {
  if (!q || q.trim().length < 2) return [];

  const products = await Product.findAll({
    where: {
      stockStatus: { [Op.ne]: 'out_of_stock' },
      [Op.or]: [
        { title:    { [Op.iLike]: `%${q.trim()}%` } },
        { material: { [Op.iLike]: `%${q.trim()}%` } },
      ],
    },
    attributes: ['id', 'title', 'material', 'price', 'imageUrl', 'resellerPrice', 'discountEnabled', 'discountedPrice'],
    limit: Number(limit),
    order: [['createdAt', 'DESC']],
  });

  return products.map(p => ({
    id:       p.id,
    title:    p.title,
    material: p.material,
    price:    Number(p.price),
    image:    p.imageUrl || '',
    url:      `/product/${p.id}`,
  }));
};

// ─── Category name search ─────────────────────────────────────────────────────
export const searchCategoriesService = async (q, limit = 4) => {
  if (!q || q.trim().length < 2) return [];

  return Category.findAll({
    where: {
      name:     { [Op.iLike]: `%${q.trim()}%` },
      isActive: true,
    },
    attributes: ['id', 'name', 'slug'],
    limit: Number(limit),
  }).then(cats => cats.map(c => c.toJSON()));
};

// ─── Combined search (products + matching categories) ────────────────────────
export const combinedSearchService = async (params) => {
  const [productResults, categoryResults] = await Promise.all([
    searchProductsService(params),
    searchCategoriesService(params.q, 4),
  ]);

  return {
    ...productResults,
    categories: categoryResults,
  };
};

// ─── Related products ─────────────────────────────────────────────────────────
export const getRelatedProductsService = async (productId, limit = 4) => {
  const product = await Product.findByPk(productId);
  if (!product) throw new Error('Product not found');

  return Product.findAll({
    where: {
      categorySlug: product.categorySlug,
      id:           { [Op.ne]: productId },
      stockStatus:  { [Op.ne]: 'out_of_stock' },
    },
    include: [CATEGORY_INCLUDE],
    limit: Number(limit),
    order: [['createdAt', 'DESC']],
  }).then(rows => rows.map(p => p.toJSON()));
};