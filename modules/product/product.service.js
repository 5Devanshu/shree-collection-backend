import Product from './product.model.js';

// Get all products — used by AdminProducts table
export const getAllProductsService = async ({ page = 1, limit = 20, category, stockStatus } = {}) => {
  const filter = {};
  if (category) filter.categorySlug = category;
  
  // If no specific filter, show all products (both in stock and out of stock)
  // The frontend/admin will handle additional filtering

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  return { products, total, page: Number(page), limit: Number(limit) };
};

// Get featured products — used by FeaturedGrid on homepage
export const getFeaturedProductsService = async () => {
  return Product.find({ 
    $or: [
      { featured: true },
      { isFeatured: true }
    ]
  })
    .limit(6)
    .sort({ createdAt: -1 });
};

// Get products by category slug — used by CategoryPage (/collections/:category)
export const getProductsByCategoryService = async (slug) => {
  return Product.find({ categorySlug: slug })
    .sort({ createdAt: -1 });
};

// Get single product by ID — used by ProductDescription (/product/:id)
export const getProductByIdService = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new Error('Product not found');
  return product;
};

// Create a new product — used by AdminProducts "+ Add Product"
export const createProductService = async (data) => {
  // Ensure name field is set
  if (!data.name && !data.title) {
    throw new Error('Product name or title is required');
  }
  
  if (!data.name && data.title) {
    data.name = data.title;
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
  return Product.countDocuments({ stock: { $gt: 0 } });
};