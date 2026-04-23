# Products Not Displaying - Complete Fix Guide

## Problem Summary
When you add new products through the admin panel, they are not being displayed on the frontend (Categories page, featured products, etc.).

## Root Causes Identified & Fixed

### 1. **Schema Field Mismatch** ✅ FIXED
**Problem**: The Product model had inconsistent field names:
- Model had: `title`, `image`, `gallery`, `discountPercent`, `featured`
- Frontend/Service expected: `name`, `mainImage`, `images`, `discountPercentage`, `isFeatured`

**Solution**: Updated `Product.js` model to:
- Support BOTH field names (for backward compatibility)
- Sync them automatically in pre-save hook
- Include all variations: `name` and `title`, `mainImage` and `image`, etc.

### 2. **Product Service Query Issues** ✅ FIXED
**Problem**: The service was querying for non-existent fields:
- `product.find({ stockStatus: ... })` - Field doesn't exist
- `.populate('category')` - Products don't have a category reference

**Solution**: Updated `product.service.js` to:
- Remove invalid `stockStatus` and `category` references
- Query directly by `categorySlug` instead
- Use correct field names like `featured` and `isFeatured`

### 3. **Normalization Issues** ✅ FIXED
**Problem**: The `normalizeProduct.js` utility wasn't handling field aliases properly

**Solution**: Updated to:
- Handle both old and new field names
- Provide both variants in response for compatibility
- Properly validate and convert data types

## Files Updated

1. `/Users/devanshu/Desktop/sc_backend/models/Product.js` - Added field aliases and sync logic
2. `/Users/devanshu/Desktop/sc_backend/modules/product/product.service.js` - Fixed queries
3. `/Users/devanshu/Desktop/sc_backend/utils/normalizeProduct.js` - Enhanced normalization

## How to Verify the Fix

### Option 1: Via Postman/cURL
```bash
# Test API endpoint
curl http://localhost:5000/api/products

# Should return:
{
  "success": true,
  "products": [
    {
      "_id": "...",
      "name": "Product Name",
      "title": "Product Name",
      "price": 100,
      "categorySlug": "rings",
      "mainImage": "image-url",
      "images": [...],
      "stock": 10,
      "featured": false,
      ...
    }
  ],
  "total": X,
  "page": 1,
  "limit": 20
}
```

### Option 2: Check Frontend
1. Navigate to any category page (e.g., Collections > Rings)
2. Should see all added products listed
3. Featured products should appear on homepage

### Option 3: Check Database Directly
```javascript
// In MongoDB shell or MongoDB Compass
db.products.find().pretty()

// Should show documents with fields like:
{
  _id: ObjectId(...),
  name: "Ruby Ring",
  title: "Ruby Ring",
  price: 15000,
  mainImage: "https://...",
  images: [...],
  categorySlug: "rings",
  stock: 5,
  featured: false,
  createdAt: ISODate(...),
  updatedAt: ISODate(...)
}
```

## If Products Still Don't Show Up

### Step 1: Verify Database Connection
```javascript
// Check in backend logs for MongoDB connection status
// Should see: "✅ Connected to MongoDB"
```

### Step 2: Check Backend Logs for Errors
```bash
cd /Users/devanshu/Desktop/sc_backend
npm run dev
# Look for any error messages related to products
```

### Step 3: Verify Admin Token
- Ensure you're logged in as admin when adding products
- Check browser DevTools → Application → localStorage
- Should have `shree_admin_token` present

### Step 4: Check Frontend API Calls
- Open browser DevTools → Network tab
- Go to a category page
- Look for request to `/api/products` or `/api/products/category/:slug`
- Verify response has products with correct field names

### Step 5: Clear Caches
```bash
# Clear browser cache
# Clear localStorage
# Restart backend server
npm run dev

# Restart frontend
cd /Users/devanshu/Desktop/shree-collection/shree-collection
npm run dev
```

## Field Reference

### What gets stored in database:
```javascript
{
  name: "Product Name",           // Required
  title: "Product Name",          // Auto-synced from name
  price: 5000,                    // Required
  mainImage: "url",              // Main product image
  image: "url",                  // Auto-synced from mainImage
  images: ["url1", "url2"],      // Gallery images
  gallery: ["url1", "url2"],     // Auto-synced from images
  categorySlug: "rings",         // Required
  stock: 10,
  featured: true,
  isFeatured: true,              // Auto-synced from featured
  discountEnabled: true,
  discountPercent: 10,
  discountPercentage: 10,        // Auto-synced
  discountedPrice: 4500,         // Auto-calculated
  description: "...",
  material: "Gold",
  details: [...],
  tags: ["popular"],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### What gets sent to frontend:
```javascript
{
  _id: "...",
  name: "Product Name",
  title: "Product Name",
  price: 5000,
  mainImage: "url",
  image: "url",
  images: [...],
  gallery: [...],
  categorySlug: "rings",
  stock: 10,
  featured: true,
  isFeatured: true,
  discountEnabled: true,
  discountPercentage: 10,
  discountedPrice: 4500,
  description: "...",
  material: "Gold",
  details: [...],
  tags: [...],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Next Steps

1. **Restart the backend**:
   ```bash
   cd /Users/devanshu/Desktop/sc_backend
   npm run dev
   ```

2. **Restart the frontend**:
   ```bash
   cd /Users/devanshu/Desktop/shree-collection/shree-collection
   npm run dev
   ```

3. **Add a new product** through admin panel

4. **Check if it appears** on the frontend

If issues persist, check the backend console for any error messages related to product operations.

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Products show in DB but not in API | Clear browser cache, restart backend |
| API returns empty array | Check `categorySlug` is set correctly |
| Wrong prices displayed | Check `discountEnabled` and `discountPercent` |
| Images not showing | Verify `mainImage` or `images` URLs are correct |
| Featured products not appearing | Check `featured` or `isFeatured` field is `true` |

---
**Last Updated**: April 23, 2026
