/**
 * Normalize product data for API responses
 * Ensures consistent structure and removes sensitive fields
 */

/**
 * Normalize a single product
 * @param {Object} product - Product document from database
 * @returns {Object} Normalized product object
 */
export const normalizeProduct = (product) => {
  if (!product) return null;

  // Convert mongoose document to plain object if needed
  const productObj = product.toObject ? product.toObject() : product;

  return {
    _id: productObj._id,
    name: productObj.name,
    description: productObj.description,
    category: productObj.category,
    categorySlug: productObj.categorySlug,
    price: productObj.price,
    discountEnabled: productObj.discountEnabled,
    discountedPrice: productObj.discountedPrice,
    discountPercentage: productObj.discountPercentage,
    stock: productObj.stock,
    images: productObj.images || [],
    mainImage: productObj.mainImage,
    tags: productObj.tags || [],
    featured: productObj.featured || false,
    createdAt: productObj.createdAt,
    updatedAt: productObj.updatedAt,
  };
};

/**
 * Normalize multiple products
 * @param {Array} products - Array of product documents
 * @returns {Array} Array of normalized products
 */
export const normalizeProducts = (products) => {
  if (!Array.isArray(products)) {
    return [];
  }
  return products.map(product => normalizeProduct(product));
};

/**
 * Normalize product for admin response (includes sensitive fields)
 * @param {Object} product - Product document
 * @returns {Object} Normalized product with admin fields
 */
export const normalizeProductAdmin = (product) => {
  if (!product) return null;

  const normalized = normalizeProduct(product);
  
  return {
    ...normalized,
    // Add admin-specific fields if needed
  };
};

/**
 * Normalize product for creation/update
 * @param {Object} productData - Raw product data
 * @returns {Object} Cleaned product data for database
 */
export const normalizeProductInput = (productData) => {
  return {
    name: productData.name?.trim(),
    description: productData.description?.trim(),
    category: productData.category?.trim(),
    categorySlug: productData.categorySlug?.trim().toLowerCase(),
    price: parseFloat(productData.price) || 0,
    discountEnabled: productData.discountEnabled === true,
    discountedPrice: productData.discountedPrice ? parseFloat(productData.discountedPrice) : null,
    discountPercentage: productData.discountPercentage ? parseFloat(productData.discountPercentage) : null,
    stock: parseInt(productData.stock) || 0,
    images: Array.isArray(productData.images) ? productData.images : [],
    mainImage: productData.mainImage?.trim() || null,
    tags: Array.isArray(productData.tags) ? productData.tags.map(t => t.trim()) : [],
    featured: productData.featured === true,
  };
};
