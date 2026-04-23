import * as productService from './product.service.js';

// ── Helper: Normalize product data for API responses ──────────────────────────
// Converts image.url into a flat image string for frontend compatibility
const normalizeProduct = (product) => {
  if (!product) return product;
  
  const normalized = product.toObject ? product.toObject() : { ...product };
  
  // Flatten image structure: { url, publicId } → string URL
  if (typeof normalized.image === 'object' && normalized.image?.url) {
    normalized.image = normalized.image.url;
  }
  
  return normalized;
};

const normalizeProducts = (products) => {
  if (Array.isArray(products)) {
    return products.map(normalizeProduct);
  }
  return normalizeProduct(products);
};

// GET /api/products
export const getAllProducts = async (req, res) => {
  try {
    const result = await productService.getAllProductsService(req.query);
    res.status(200).json({ 
      success: true, 
      products: normalizeProducts(result.products),
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/featured
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await productService.getFeaturedProductsService();
    res.status(200).json({ success: true, products: normalizeProducts(products) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/category/:slug
export const getProductsByCategory = async (req, res) => {
  try {
    const products = await productService.getProductsByCategoryService(req.params.slug);
    res.status(200).json({ success: true, products: normalizeProducts(products) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductByIdService(req.params.id);
    res.status(200).json({ success: true, product: normalizeProduct(product) });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// POST /api/products  [Admin]
export const createProduct = async (req, res) => {
  try {
    const product = await productService.createProductService(req.body);
    res.status(201).json({ success: true, product: normalizeProduct(product) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/products/:id  [Admin]
export const updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProductService(req.params.id, req.body);
    res.status(200).json({ success: true, product: normalizeProduct(product) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/products/:id  [Admin]
export const deleteProduct = async (req, res) => {
  try {
    const result = await productService.deleteProductService(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};