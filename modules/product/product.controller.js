import * as productService from './product.service.js';

// GET /api/products
export const getAllProducts = async (req, res) => {
  try {
    const result = await productService.getAllProductsService(req.query, !!req.reseller);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/featured
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await productService.getFeaturedProductsService(!!req.reseller);
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/category/:slug
export const getProductsByCategory = async (req, res) => {
  try {
    const products = await productService.getProductsByCategoryService(req.params.slug, !!req.reseller);
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductByIdService(req.params.id, !!req.reseller);
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// POST /api/products  [Admin]
export const createProduct = async (req, res) => {
  try {
    const product = await productService.createProductService(req.body);
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/products/:id  [Admin]
export const updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProductService(req.params.id, req.body);
    res.status(200).json({ success: true, product });
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

// PATCH /api/products/:id/featured  [Admin]
export const toggleFeatured = async (req, res) => {
  try {
    const product = await productService.toggleFeaturedService(req.params.id);
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/products/:id/stock  [Admin]
export const updateStock = async (req, res) => {
  try {
    const product = await productService.updateStockService(req.params.id, req.body);
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id/related
export const getRelatedProducts = async (req, res) => {
  try {
    const products = await productService.getRelatedProductsService(req.params.id, !!req.reseller);
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};