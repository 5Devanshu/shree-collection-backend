// ── Product Normalization Utility ─────────────────────────────────────────────
// Converts product documents to API-friendly format
// Ensures consistent image field format across all endpoints

/**
 * Normalize a single product document for API response
 * Converts nested image object to flat string URL
 * Extracts categorySlug from populated category reference
 * 
 * Before: { title: "...", image: { url: "...", publicId: "xyz" }, category: { slug: "rings" } }
 * After:  { title: "...", image: "https://...", categorySlug: "rings" }
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
  
  // Extract categorySlug from populated category reference
  // Backend returns: category: { _id: "...", name: "Rings", slug: "rings" }
  // Frontend expects: categorySlug: "rings"
  if (normalized.category && typeof normalized.category === 'object' && normalized.category.slug) {
    normalized.categorySlug = normalized.category.slug;
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
