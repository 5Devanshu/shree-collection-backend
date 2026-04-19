const Product = require('../models/Product');

const getProducts = async (req, res, next) => {
  try {
    const { category, featured, search, sort, page = 1, limit = 12 } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.categorySlug = category.toLowerCase();
    if (featured === 'true') filter.featured = true;
    if (search?.trim()) filter.$text = { $search: search.trim() };

    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc')  sortOption = { price:  1 };
    if (sort === 'price-desc') sortOption = { price: -1 };
    if (sort === 'name')       sortOption = { title:  1 };

    const pageNum  = Math.max(1, parseInt(page,  10));
    const limitNum = Math.min(50, parseInt(limit, 10));
    const skip     = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true, count: products.length, total,
      page: pageNum, totalPages: Math.ceil(total / limitNum),
      data: products,
    });
  } catch (err) { next(err); }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (err) { next(err); }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      title, material, price, image, gallery,
      categorySlug, description, details, stock, featured,
    } = req.body;

    if (!title || price === undefined || !categorySlug) {
      return res.status(400).json({ success: false, message: 'Title, price and category are required' });
    }

    const product = await Product.create({
      title, material,
      price,
      image:        image        || '',
      gallery:      Array.isArray(gallery) ? gallery : [],
      categorySlug: categorySlug.toLowerCase(),
      description:  description  || '',
      details:      Array.isArray(details) ? details : [],
      stock:        stock        ?? 0,
      featured:     featured     ?? false,
    });

    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (err) { next(err); }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const { title, material, price, image, gallery, categorySlug, description, details, stock, featured } = req.body;

    // ── DEBUG — remove after confirming ──────────────────────────────────────
    console.log('Gallery received from frontend:', gallery);
    console.log('Gallery length:', gallery?.length);

    if (title        !== undefined) product.title        = title;
    if (material     !== undefined) product.material     = material;
    if (price        !== undefined) product.price        = price;
    if (image        !== undefined) product.image        = image;
    if (gallery      !== undefined) product.gallery      = Array.isArray(gallery) ? gallery : [];
    if (categorySlug !== undefined) product.categorySlug = categorySlug.toLowerCase();
    if (description  !== undefined) product.description  = description;
    if (details      !== undefined) product.details      = details;
    if (stock        !== undefined) product.stock        = stock;
    if (featured     !== undefined) product.featured     = featured;

    const updated = await product.save();

    console.log('Saved gallery:', updated.gallery);

    res.status(200).json({ success: true, message: 'Product updated successfully', data: updated });
  } catch (err) { next(err); }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await product.deleteOne();
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (err) { next(err); }
};

const toggleFeatured = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.featured = !product.featured;
    const updated = await product.save();
    res.status(200).json({ success: true, message: `Product ${updated.featured ? 'marked as featured' : 'removed from featured'}`, data: updated });
  } catch (err) { next(err); }
};

const updateStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || stock < 0) {
      return res.status(400).json({ success: false, message: 'Provide a valid stock quantity' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.stock = stock;
    const updated = await product.save();
    res.status(200).json({ success: true, message: 'Stock updated', data: { id: updated._id, title: updated.title, stock: updated.stock } });
  } catch (err) { next(err); }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, toggleFeatured, updateStock };