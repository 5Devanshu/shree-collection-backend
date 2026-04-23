// ── Product Normalization Utility ─────────────────────────────────────────────
// Converts product documents to API-friendly format
// Ensures consistent image field format across all endpoints

/**
 * Normalize a single product document for API response
 * Converts nested image object to flat string URL
 * 
 * Before: { title: "...", image: { url: "https://...", publicId: "xyz" } }
 * After:  { title: "...", image: "https://..." }
 */
export const normalizeProduct = (product) => {
  if (!product) return product;
  
  // Convert Mongoose document to plain object
  const normalized = product.toObject 
    ? product.toObject() 
    : JSON.parse(JSON.stringify(product));
  
  // Flatten image structure: { url, publicId } → string URL
  if (normalized.image) {
    if (typeof normalized.image === 'object' && normalized.image.url) {
      // Extract URL from nested object
      normalized.image = normalized.image.url;
    } else if (typeof normalized.image !== 'string') {
      // If image is still an object but doesn't have url, clear it
      normalized.image = '';
    }
  }
  
  return normalized;
};

/**
 * Normalize multiple products
 * Handles both arrays and single items
 */
export const normalizeProducts = (products) => {
  if (Array.isArray(products)) {
    return products.map(normalizeProduct);
  }
  return normalizeProduct(products);
};

export default { normalizeProduct, normalizeProducts };
