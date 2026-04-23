// ── Product Normalization Utility ─────────────────────────────────────────────
// Converts product documents to API-friendly format
// Ensures consistent image field format across all endpoints

/**
 * Normalize a single product document for API response
 * Converts nested image object to flat string URL
 * Extracts categorySlug from populated category reference
 * Normalizes isFeatured to featured for frontend compatibility
 * 
 * Before: { title: "...", image: { url: "...", publicId: "xyz" }, category: { slug: "rings" }, isFeatured: true }
 * After:  { title: "...", image: "https://...", categorySlug: "rings", featured: true }
 */
export const normalizeProduct = (product) => {
  if (!product) return null;
  
  try {
    // Convert Mongoose document to plain object
    let normalized = product.toObject 
      ? product.toObject() 
      : JSON.parse(JSON.stringify(product));
    
    // Flatten image structure: { url, publicId } → string URL
    if (normalized && normalized.image) {
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
    if (normalized && normalized.category && typeof normalized.category === 'object' && normalized.category.slug) {
      normalized.categorySlug = normalized.category.slug;
    }
    
    // Normalize isFeatured to featured for frontend compatibility
    if (normalized && normalized.isFeatured !== undefined) {
      normalized.featured = normalized.isFeatured;
    }
    
    return normalized;
  } catch (err) {
    console.error('Error normalizing product:', err, product);
    return product;
  }
};

/**
 * Normalize multiple products
 * Always returns an array, even for single items
 * Handles both arrays and single items
 */
export const normalizeProducts = (products) => {
  if (!products) return [];
  if (Array.isArray(products)) {
    return products.map(normalizeProduct);
  }
  // Single product — wrap in array
  return [normalizeProduct(products)];
};

export default { normalizeProduct, normalizeProducts };
