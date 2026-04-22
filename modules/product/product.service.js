import Product from './product.model.js';

// Get all products — used by AdminProducts table
export const getAllProductsService = async ({ page = 1, limit = 20, category, stockStatus } = {}) => {
  const filter = {};
  if (category)    filter.category = category;
  if (stockStatus) filter.stockStatus = stockStatus;

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  return { products, total, page: Number(page), limit: Number(limit) };
};

// Get featured products — used by FeaturedGrid on homepage
export const getFeaturedProductsService = async () => {
  return Product.find({ isFeatured: true, stockStatus: { $ne: 'out_of_stock' } })
    .populate('category', 'name slug')
    .limit(6);
};

// Get products by category slug — used by CategoryPage (/collections/:category)
export const getProductsByCategoryService = async (slug) => {
  return Product.find()
    .populate({
      path: 'category',
      match: { slug },
      select: 'name slug',
    })
    .then((products) => products.filter((p) => p.category !== null));
};

// Get single product by ID — used by ProductDescription (/product/:id)
export const getProductByIdService = async (id) => {
  const product = await Product.findById(id).populate('category', 'name slug');
  if (!product) throw new Error('Product not found');
  return product;
};

// Create a new product — used by AdminProducts "+ Add Product"
export const createProductService = async (data) => {
  if (!data.title || !data.title.trim()) {
    throw new Error('Product title is required');
  }
  const product = await Product.create(data);
  return product;
};

// Update a product — used by AdminProducts "Edit"
export const updateProductService = async (id, data) => {
  const product = await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new Error('Product not found');
  return product;
};

// Delete a product — used by AdminProducts
export const deleteProductService = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new Error('Product not found');
  return { message: 'Product deleted successfully' };
};

// Get total products in stock — used by AdminDashboard stat card
export const getProductsInStockCountService = async () => {
  return Product.countDocuments({ stockStatus: { $ne: 'out_of_stock' } });
};