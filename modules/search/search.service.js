import Product  from '../product/product.model.js';
import Category from '../category/category.model.js';

// ─── Full-Text Product Search ─────────────────────────────────────────────────
// Core search — triggered by Navbar.jsx "Search" link.
// Searches across: title, material, description
// (all three fields are text-indexed in product.model.js)
// Supports:
//   - Full-text query          (?q=diamond)
//   - Category filter          (?category=rings)
//   - Price range filter       (?minPrice=1000&maxPrice=5000)
//   - Stock status filter      (?stockStatus=in_stock)
//   - Pagination               (?page=1&limit=12)
//   - Sorting                  (?sort=price_asc | price_desc | newest | relevance)
export const searchProductsService = async ({
  q           = '',
  category    = '',
  minPrice,
  maxPrice,
  stockStatus = '',
  page        = 1,
  limit       = 12,
  sort        = 'relevance',
} = {}) => {

  // Guard: require at least a query term or a category filter
  if (!q.trim() && !category.trim()) {
    throw new Error('A search query or category filter is required');
  }

  const filter = {};

  // ── Text search across title, material, description ──
  // Matches: "diamond", "pearl", "platinum", "18K gold" etc.
  // All of these map directly to fields shown on ProductCard and ProductDescription
  if (q.trim()) {
    filter.$text = { $search: q.trim() };
  }

  // ── Category filter ──
  // Resolves category slug to ObjectId — mirrors CategoryPage useParams() slug
  // e.g. ?category=rings → finds Category { slug: 'rings' } → filters by _id
  if (category.trim()) {
    const cat = await Category.findOne({ slug: category.toLowerCase().trim() });
    if (cat) {
      filter.category = cat._id;
    } else {
      // Unknown category slug — return empty results gracefully
      return { products: [], total: 0, page: Number(page), limit: Number(limit), query: q };
    }
  }

  // ── Price range filter ──
  // Maps to ProductCard price label and ProductDescription price display
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }

  // ── Stock status filter ──
  // Maps to AdminProducts status badges: in_stock / low_stock / out_of_stock
  // Public search always excludes out_of_stock by default
  if (stockStatus) {
    filter.stockStatus = stockStatus;
  } else {
    filter.stockStatus = { $ne: 'out_of_stock' };
  }

  // ── Sort options ──
  const sortOptions = {
    relevance:  q.trim() ? { score: { $meta: 'textScore' } } : { createdAt: -1 },
    price_asc:  { price:  1 },
    price_desc: { price: -1 },
    newest:     { createdAt: -1 },
  };
  const sortQuery = sortOptions[sort] ?? sortOptions.relevance;

  const skip = (Number(page) - 1) * Number(limit);

  // ── Execute search + count in parallel ──
  const projection = q.trim()
    ? { score: { $meta: 'textScore' } }   // include relevance score when text searching
    : {};

  const [products, total] = await Promise.all([
    Product.find(filter, projection)
      .populate('category', 'name slug')
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit))
      .select('title material price image stockStatus isFeatured category'),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    total,
    page:     Number(page),
    limit:    Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
    query:    q,
  };
};

// ─── Search Suggestions (Autocomplete) ───────────────────────────────────────
// Returns lightweight suggestions as the user types in the Navbar search input.
// Matches on title prefix — fast, minimal response.
// e.g. typing "sol" → ["Solstice Emerald Cuff", "Solstice Emerald Necklace"]
export const getSearchSuggestionsService = async (q, limit = 6) => {
  if (!q || q.trim().length < 2) return [];

  // Regex prefix match — case insensitive, anchored to start of each word
  const regex = new RegExp(q.trim(), 'i');

  const products = await Product.find({
    title:       { $regex: regex },
    stockStatus: { $ne: 'out_of_stock' },
  })
    .select('title material price image _id')
    .limit(Number(limit))
    .lean();

  // Return minimal suggestion shape — enough to render a dropdown item
  return products.map((p) => ({
    id:       p._id,
    title:    p.title,
    material: p.material,
    price:    p.price,
    image:    p.image?.url || '',
    url:      `/product/${p._id}`,    // maps to App.jsx route: /product/:id
  }));
};

// ─── Search by Category Name ──────────────────────────────────────────────────
// Finds categories whose name matches the query term.
// Used for showing category results alongside product results in the search UI.
// e.g. searching "rings" → returns Category { name: 'Rings', slug: 'rings' }
//      frontend can use slug to navigate to /collections/rings (CategoryPage)
export const searchCategoriesService = async (q, limit = 4) => {
  if (!q || q.trim().length < 2) return [];

  const regex = new RegExp(q.trim(), 'i');

  return Category.find({
    name:     { $regex: regex },
    isActive: true,
  })
    .select('name slug')
    .limit(Number(limit))
    .lean();
};

// ─── Combined Search ──────────────────────────────────────────────────────────
// Returns both products and matching categories in a single response.
// Drives the full search results page opened from Navbar "Search" link.
export const combinedSearchService = async (params) => {
  const [productResults, categoryResults] = await Promise.all([
    searchProductsService(params),
    searchCategoriesService(params.q, 4),
  ]);

  return {
    products:   productResults.products,
    total:      productResults.total,
    totalPages: productResults.totalPages,
    page:       productResults.page,
    limit:      productResults.limit,
    query:      productResults.query,
    categories: categoryResults,
  };
};

// ─── Related Products ─────────────────────────────────────────────────────────
// Returns products related to a given product — same category, excluding itself.
// Used on ProductDescription.jsx to show "You may also like" section.
// Keeps user engaged on the storefront after viewing a product.
export const getRelatedProductsService = async (productId, limit = 4) => {
  const product = await Product.findById(productId).select('category');
  if (!product) throw new Error('Product not found');

  return Product.find({
    category:    product.category,
    _id:         { $ne: productId },
    stockStatus: { $ne: 'out_of_stock' },
  })
    .select('title material price image stockStatus _id')
    .limit(Number(limit));
};