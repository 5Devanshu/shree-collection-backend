import * as searchService from './search.service.js';
import { normalizeProducts } from '../../utils/normalizeProduct.js';

// GET /api/search
// Main search endpoint — triggered by Navbar.jsx "Search" link.
// Accepts: ?q=diamond&category=rings&minPrice=1000&maxPrice=5000
//          &stockStatus=in_stock&page=1&limit=12&sort=price_asc
// Returns: products + matching categories + pagination meta
export const search = async (req, res) => {
  try {
    const result = await searchService.combinedSearchService(req.query);
    res.status(200).json({ 
      success: true, 
      ...result,
      products: normalizeProducts(result.products || [])
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/search/suggestions
// Lightweight autocomplete — fires as user types in Navbar search input.
// Query param: ?q=sol
// Returns: array of { id, title, material, price, image, url }
export const getSuggestions = async (req, res) => {
  try {
    const { q, limit } = req.query;
    const suggestions = await searchService.getSearchSuggestionsService(q, limit);
    res.status(200).json({ success: true, suggestions: normalizeProducts(suggestions || []) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/search/products
// Products-only search — for when the frontend only needs product results
// without category suggestions (e.g. category filter page)
export const searchProducts = async (req, res) => {
  try {
    const result = await searchService.searchProductsService(req.query);
    res.status(200).json({ 
      success: true, 
      ...result,
      products: normalizeProducts(result.products || [])
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/search/categories
// Category name search — finds categories matching the query.
// Used alongside product results or as standalone category lookup.
// e.g. ?q=rings → { name: 'Rings', slug: 'rings' } → /collections/rings
export const searchCategories = async (req, res) => {
  try {
    const { q, limit } = req.query;
    const categories = await searchService.searchCategoriesService(q, limit);
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/search/related/:productId
// Related products by category — powers "You may also like" on ProductDescription
// Excludes the current product, excludes out-of-stock items
export const getRelatedProducts = async (req, res) => {
  try {
    const { limit } = req.query;
    const products = await searchService.getRelatedProductsService(
      req.params.productId,
      limit
    );
    res.status(200).json({ success: true, products: normalizeProducts(products || []) });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};