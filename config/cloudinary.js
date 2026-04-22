import { v2 as cloudinary } from 'cloudinary';

// Cloudinary configuration — used for all image uploads across the store
// Product images: ProductCard, ProductDescription, FeaturedGrid, AdminProducts
// Hero image: Hero.jsx full-bleed background
// Admin Media Library: AdminPanel.jsx sidebar link
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;