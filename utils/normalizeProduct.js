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

  // Handle field aliases for backward compatibility
  const name = productObj.name || productObj.title || '';
  
  // ✅ CRITICAL: Extract image URL as STRING, not object
  // Image can come in multiple formats:
  // 1. mainImage: "https://..." (string)
  // 2. mainImage: { url: "https://...", publicId: "..." } (object)
  // 3. image: "https://..." (string)
  // 4. image: { url: "https://...", publicId: "..." } (object)
  
  let imageUrl = '';
  
  // Try mainImage first
  if (typeof productObj.mainImage === 'string' && productObj.mainImage) {
    imageUrl = productObj.mainImage;
  } else if (productObj.mainImage && typeof productObj.mainImage === 'object' && productObj.mainImage.url) {
    imageUrl = productObj.mainImage.url;
  }
  // Fallback to image field
  else if (typeof productObj.image === 'string' && productObj.image) {
    imageUrl = productObj.image;
  } else if (productObj.image && typeof productObj.image === 'object' && productObj.image.url) {
    imageUrl = productObj.image.url;
  }
  
  // Ensure imageUrl is always a string, never an object
  if (typeof imageUrl !== 'string') {
    imageUrl = '';
  }
  
  const images = (productObj.images && productObj.images.length > 0) 
    ? productObj.images 
    : (productObj.gallery || []);

  return {
    _id: productObj._id,
    name,
    title: name, // Include both for compatibility
    description: productObj.description,
    categorySlug: productObj.categorySlug,
    category: productObj.category,
    price: productObj.price,
    discountEnabled: productObj.discountEnabled,
    discountedPrice: productObj.discountedPrice,
    discountPercentage: productObj.discountPercent || productObj.discountPercentage || 0,
    stock: productObj.stock,
    images: images,
    gallery: images, // Include both for compatibility
    mainImage: imageUrl,  // ✅ Always a string
    image: imageUrl,      // ✅ Always a string (frontend uses this)
    tags: productObj.tags || [],
    featured: productObj.featured || productObj.isFeatured || false,
    isFeatured: productObj.featured || productObj.isFeatured || false,
    material: productObj.material,
    details: productObj.details || [],
    stockStatus: productObj.stockStatus,
    delivery: productObj.delivery,
    returns: productObj.returns,
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
  // Handle both 'name' and 'title' field names
  const name = (productData.name || productData.title || '').trim();
  
  return {
    name,
    title: name, // Keep both for compatibility
    description: (productData.description || '').trim(),
    categorySlug: (productData.categorySlug || '').trim().toLowerCase(),
    price: parseFloat(productData.price) || 0,
    discountEnabled: productData.discountEnabled === true,
    discountedPrice: productData.discountedPrice ? parseFloat(productData.discountedPrice) : null,
    discountPercent: productData.discountPercent ? parseFloat(productData.discountPercent) : null,
    discountPercentage: productData.discountPercentage ? parseFloat(productData.discountPercentage) : null,
    stock: parseInt(productData.stock) || 0,
    images: Array.isArray(productData.images) ? productData.images : [],
    gallery: Array.isArray(productData.gallery) ? productData.gallery : (Array.isArray(productData.images) ? productData.images : []),
    mainImage: (productData.mainImage || productData.image || '').trim() || null,
    image: (productData.mainImage || productData.image || '').trim() || null,
    tags: Array.isArray(productData.tags) ? productData.tags.map(t => (t || '').trim()).filter(t => t) : [],
    featured: productData.featured === true || productData.isFeatured === true,
    isFeatured: productData.featured === true || productData.isFeatured === true,
    material: (productData.material || '').trim() || '',
    details: Array.isArray(productData.details) ? productData.details : [],
  };
};
