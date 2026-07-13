import { Op } from 'sequelize';
import Product  from './product.model.js';
import Category from '../category/category.model.js';

// ─── Normalize a size's colour variants ────────────────────────────────────────
// Each size can now have MULTIPLE colours, each with its own stock and photo —
// e.g. size 2.4 might come in Rose Gold (6 left, its own photo) and Yellow
// Gold (2 left, a different photo). A colour name is required for a variant
// to count (an untitled variant is meaningless — the customer needs a label
// to pick between). Dedupes by colour name (case-insensitive, last one wins).
const normalizeColorVariants = (rawColors) => {
  if (!Array.isArray(rawColors)) return [];

  const byColor = new Map();
  for (const c of rawColors) {
    const color = typeof c?.color === 'string' ? c.color.trim() : '';
    if (!color) continue;

    const stock    = Number(c?.stock) || 0;
    const image    = typeof c?.image === 'string' ? c.image : '';
    const imageKey = typeof c?.imageKey === 'string' ? c.imageKey : '';

    byColor.set(color.toLowerCase(), { color, stock, image, imageKey });
  }
  return Array.from(byColor.values());
};

// ─── Normalize incoming sizeStock entries from the admin form ─────────────────
// Admin adds sizes one at a time (chips), each with its own price/resellerPrice
// (price/resellerPrice fallback logic unchanged) and, optionally, one or more
// colour variants. When a size HAS colour variants, that size's stock is the
// SUM of its variants' stock (colour is where availability is actually tracked
// once colours are in play) — mirroring how the product's total stock is the
// sum of every size's stock. A size with no colour variants keeps working
// exactly as before (a single stock number for that size).
const normalizeSizeStock = (rawSizeStock) => {
  if (!Array.isArray(rawSizeStock)) return [];

  const bySize = new Map();
  for (const entry of rawSizeStock) {
    const size = Number(entry?.size);
    if (!Number.isFinite(size)) continue;

    const price         = Number(entry?.price);
    const resellerPrice = Number(entry?.resellerPrice);
    const colors         = normalizeColorVariants(entry?.colors);

    const stock = colors.length > 0
      ? colors.reduce((sum, c) => sum + c.stock, 0)
      : Number(entry?.stock) || 0;

    // ── Per-size discount override ──────────────────────────────────────
    // discountEnabled: true/false explicitly overrides the product's own
    // discountEnabled for this size; null/undefined means "inherit the
    // product's setting". discountPercent: >0 overrides the product's
    // discountPercent for this size; 0 means "inherit the product's %".
    // Never applies to resellers regardless — see resolveSizePrice.
    const discountEnabled = typeof entry?.discountEnabled === 'boolean' ? entry.discountEnabled : null;
    const discountPercent = Number(entry?.discountPercent);

    bySize.set(size, {
      size,
      stock,
      price:           Number.isFinite(price) && price > 0 ? price : 0,
      resellerPrice:   Number.isFinite(resellerPrice) && resellerPrice > 0 ? resellerPrice : 0,
      discountEnabled,
      discountPercent: Number.isFinite(discountPercent) && discountPercent > 0 ? discountPercent : 0,
      colors,
    });
  }

  return Array.from(bySize.values()).sort((a, b) => a.size - b.size);
};

// ─── Resolve the effective price for one size entry ───────────────────────────
// price/resellerPrice still live at the SIZE level. discount now also has an
// optional per-size override (discountEnabled/discountPercent on the size
// entry) — falls back to the product's own discount settings when not set.
// Resellers NEVER receive a discount, full stop — they either get an
// explicit resellerPrice (size-level, then product-level) or plain retail.
export const resolveSizePrice = (product, sizeEntry, isReseller = false) => {
  const basePrice = Number(product.price) || 0;
  const hasSizePrice = sizeEntry && Number(sizeEntry.price) > 0;
  const retailForSize = hasSizePrice ? Number(sizeEntry.price) : basePrice;

  if (isReseller) {
    const hasSizeResellerPrice = sizeEntry && Number(sizeEntry.resellerPrice) > 0;
    if (hasSizeResellerPrice) return Number(sizeEntry.resellerPrice);
    if (Number(product.resellerPrice) > 0) return Number(product.resellerPrice);
    // No resellerPrice configured — reseller pays plain retail, no discount.
    return retailForSize;
  }

  // ── Discount resolution (customers only) ────────────────────────────────
  // Size-level discountEnabled, when explicitly set (true/false), overrides
  // the product's discountEnabled for this size. null/undefined inherits it.
  const sizeDiscountEnabled = sizeEntry?.discountEnabled;
  const effectiveDiscountEnabled =
    sizeDiscountEnabled === null || sizeDiscountEnabled === undefined
      ? Boolean(product.discountEnabled)
      : sizeDiscountEnabled;

  const sizeDiscountPercent = Number(sizeEntry?.discountPercent) || 0;
  const effectiveDiscountPercent = sizeDiscountPercent > 0
    ? sizeDiscountPercent
    : Number(product.discountPercent) || 0;

  if (effectiveDiscountEnabled && effectiveDiscountPercent > 0) {
    return parseFloat((retailForSize - (retailForSize * effectiveDiscountPercent) / 100).toFixed(2));
  }

  return retailForSize;
};

// ─── Find the matching sizeStock entry for a given size value ─────────────────
export const findSizeEntry = (product, size) => {
  if (!product?.sizeEnabled || size === undefined || size === null || size === '') return null;
  const list = product.sizeStock || [];
  return list.find((s) => Number(s.size) === Number(size)) || null;
};

// ─── Find the matching colour variant within a size entry ─────────────────────
// Returns null if the size has no colour variants at all, OR if `color` is
// blank/unmatched. Callers decide whether a null result means "colour isn't
// required for this size" vs "the requested colour doesn't exist" — that
// distinction depends on whether sizeEntry.colors is empty or non-empty.
export const findColorVariant = (sizeEntry, color) => {
  if (!sizeEntry || !Array.isArray(sizeEntry.colors) || sizeEntry.colors.length === 0) return null;
  if (color === undefined || color === null || color === '') return null;
  const key = String(color).trim().toLowerCase();
  return sizeEntry.colors.find((c) => c.color.toLowerCase() === key) || null;
};

// ─── Resolve the effective image for a chosen size + colour ───────────────────
// Colour variant's own photo wins; falls back to the product's main image
// whenever the variant has none, or no colour was chosen (unsized/no-colour case).
export const resolveVariantImage = (product, colorVariant) => {
  if (colorVariant?.image) return colorVariant.image;
  return product.imageUrl || '';
};

// ─── Resolve the effective stock for a chosen size + colour ───────────────────
// Colour variant's own stock wins when present; otherwise falls back to the
// size's aggregate stock (sizes with no colour variants at all).
export const resolveVariantStock = (sizeEntry, colorVariant) => {
  if (colorVariant) return Number(colorVariant.stock) || 0;
  return Number(sizeEntry?.stock) || 0;
};

// ─── Normalize incoming data from frontend ────────────────────────────────────
const normalizeProductData = (data) => {
  const d = { ...data };

  if (d.image !== undefined) {
    if (typeof d.image === 'object' && d.image?.url) {
      d.imageUrl = d.image.url;
      d.imageKey = d.image.key || '';
    } else if (typeof d.image === 'string' && d.image) {
      d.imageUrl = d.image;
    }
    delete d.image;
  }

  if (d.category && !d.categoryId) {
    d.categoryId = d.category;
    delete d.category;
  }

  if (d.stock !== undefined && d.stockStatus === undefined) {
    const s = Number(d.stock);
    d.stockStatus = s === 0 ? 'out_of_stock' : s <= 5 ? 'low_stock' : 'in_stock';
  }

  // ── Sizing ──────────────────────────────────────────────────────────────
  if (d.sizeEnabled) {
    const normalizedStock = normalizeSizeStock(d.sizeStock);
    d.sizeStock = normalizedStock;
    d.sizes     = normalizedStock.map(s => s.size);

    const totalStock = normalizedStock.reduce((sum, s) => sum + (s.stock || 0), 0);
    d.stock = totalStock;
    d.stockStatus =
      totalStock === 0 ? 'out_of_stock' :
      totalStock <= 5  ? 'low_stock'    : 'in_stock';
  }

  if (d.sizeEnabled === false) {
    d.sizes     = [];
    d.sizeStock = [];
  }

  // ── Product-level colours — INDEPENDENT of sizing ─────────────────────────
  // Reuses the same normalizeColorVariants() used for per-size colours, since
  // the shape ({ color, stock, image, imageKey }) is identical. This block
  // runs regardless of sizeEnabled — a product can have top-level colours
  // with no sizes at all.
  if (d.colorEnabled) {
    const normalizedColors = normalizeColorVariants(d.colors);
    d.colors = normalizedColors;

    // NOTE: if BOTH sizeEnabled and colorEnabled are true on the same
    // product, this runs after the sizeEnabled block above and will
    // overwrite d.stock/d.stockStatus with the colour-level total instead.
    // In practice a product should use one variant scheme or the other —
    // per-size colours (sizeStock[].colors) OR top-level colours (colors) —
    // not both. If you do need both simultaneously, decide precedence here.
    const totalStock = normalizedColors.reduce((sum, c) => sum + (c.stock || 0), 0);
    d.stock = totalStock;
    d.stockStatus =
      totalStock === 0 ? 'out_of_stock' :
      totalStock <= 5  ? 'low_stock'    : 'in_stock';
  }

  if (d.colorEnabled === false) {
    d.colors = [];
  }

  return d;
};

// ─── Helper: apply reseller or retail display price ───────────────────────────
const applyDisplayPrice = (productJson, isReseller) => {
  if (isReseller) {
    // Resellers never receive a discount — either their explicit
    // resellerPrice, or plain retail if none is configured.
    productJson.displayPrice    = productJson.resellerPrice > 0
      ? parseFloat(productJson.resellerPrice)
      : parseFloat(productJson.price);
    productJson.isResellerPrice = productJson.resellerPrice > 0;
  } else {
    productJson.displayPrice    = productJson.discountEnabled
      ? parseFloat(productJson.discountedPrice)
      : parseFloat(productJson.price);
    productJson.isResellerPrice = false;
  }

  if (Array.isArray(productJson.sizeStock) && productJson.sizeStock.length) {
    productJson.sizeStock = productJson.sizeStock.map((entry) => {
      const hasColors = Array.isArray(entry.colors) && entry.colors.length > 0;
      return {
        ...entry,
        displayPrice: resolveSizePrice(productJson, entry, isReseller),
        // Only meaningful when this size has NO colour variants of its own —
        // the frontend shows a colour picker instead when hasColors is true.
        displayImage: hasColors ? null : (productJson.imageUrl || ''),
        displayColor: hasColors ? null : (productJson.colour   || ''),
      };
    });
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

  if (normalized.categoryId) {
    const cat = await Category.findByPk(normalized.categoryId);
    if (cat) normalized.categorySlug = cat.slug;
  }

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

  const newCategoryId = normalized.categoryId || product.categoryId;
  if (newCategoryId && (normalized.categoryId || !product.categorySlug)) {
    const cat = await Category.findByPk(newCategoryId);
    if (cat) normalized.categorySlug = cat.slug;
  }

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