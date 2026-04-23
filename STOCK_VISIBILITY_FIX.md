# Stock Management & Product Visibility Fix - April 23, 2026

## Problem
Products with stock quantity (e.g., 100 units) were still showing as "OUT OF STOCK" and were not visible on the home page or collection pages.

## Root Cause Analysis

### Issue 1: Missing `stock` field in Product Model
The product model only had `stockStatus` (enum: 'in_stock', 'low_stock', 'out_of_stock'), but NOT a numeric `stock` field to track actual inventory quantity.

**What happened:**
1. Admin adds product with stock: 100
2. Frontend sends: `{ title: "...", stock: 100, ... }`
3. Backend model doesn't have `stock` field → value is ignored
4. Product gets saved with default `stockStatus: 'in_stock'` but no quantity tracking
5. Product may later show as out of stock due to filtering logic issues

### Issue 2: Public API Including Out-of-Stock Products
The `getAllProductsService` wasn't explicitly filtering out out-of-stock products for the public API, so filtering logic was inconsistent.

### Issue 3: Category Page Not Filtering Stock
The `getProductsByCategoryService` wasn't excluding out-of-stock products from collection pages.

## Solution

### 1. Added `stock` Field to Product Model
```javascript
stock: {
  type: Number,
  required: [true, 'Stock quantity is required'],
  default: 0,
  min: 0,
}
```

### 2. Added Auto-Calculate Pre-Save Hook
The `stockStatus` is now automatically calculated based on `stock` value:
```javascript
productSchema.pre('save', function (next) {
  if (this.stock === 0) {
    this.stockStatus = 'out_of_stock';
  } else if (this.stock > 0 && this.stock <= 5) {
    this.stockStatus = 'low_stock';
  } else {
    this.stockStatus = 'in_stock';
  }
  next();
});
```

**Stock Rules:**
- `stock === 0` → `stockStatus = 'out_of_stock'` ❌ Not shown on frontend
- `0 < stock <= 5` → `stockStatus = 'low_stock'` ⚠️ Shown with warning badge
- `stock > 5` → `stockStatus = 'in_stock'` ✅ Shown normally

### 3. Updated Public API Filters
**getAllProductsService:**
```javascript
// Exclude out-of-stock by default (unless specifically requesting them)
filter.stockStatus = { $ne: 'out_of_stock' };
```

**getProductsByCategoryService:**
```javascript
// Exclude out-of-stock from collection pages
Product.find({ stockStatus: { $ne: 'out_of_stock' } })
```

## Files Modified
1. `/Users/devanshu/Desktop/sc_backend/modules/product/product.model.js`
   - Added `stock` field with validation
   - Added pre-save hook to auto-calculate `stockStatus`

2. `/Users/devanshu/Desktop/sc_backend/modules/product/product.service.js`
   - Updated `getAllProductsService` to exclude out-of-stock by default
   - Updated `getProductsByCategoryService` to exclude out-of-stock

## Expected Behavior After Fix

### Admin Adds Product with Stock: 100
```
Input:  { title: "Gold Ring", stock: 100, ... }
Stored: { title: "Gold Ring", stock: 100, stockStatus: "in_stock" }
Result: ✅ Shows on home page & collections with "In Stock" badge
```

### Admin Updates Product Stock to 3
```
Input:  { stock: 3 }
Stored: { stock: 3, stockStatus: "low_stock" }
Result: ⚠️ Shows with "Low Stock" badge
```

### Admin Updates Product Stock to 0
```
Input:  { stock: 0 }
Stored: { stock: 0, stockStatus: "out_of_stock" }
Result: ❌ Hidden from public API (home page & collections)
```

## Frontend Display Behavior

### Home Page (FeaturedGrid)
- Queries: `GET /api/products/featured`
- Shows: Products with `isFeatured: true` AND `stockStatus !== 'out_of_stock'`
- Result: ✅ Stock: 100 product now appears

### Collection Page (CategoryPage)
- Queries: `GET /api/products/category/:slug`
- Shows: Products in category with `stockStatus !== 'out_of_stock'`
- Result: ✅ Stock: 100 product now appears in correct collection

### Admin Products Table
- Queries: `GET /api/products?limit=100`
- Shows: All products except out-of-stock (admins need to manage stock)
- Result: ✅ Admin can see all in-stock products

## Testing Checklist
1. ✅ Create new product with `stock: 100`
   - Should appear on home page
   - Should appear in collection page
   - Admin table should show it

2. ✅ Update product stock to `3`
   - Should still appear on home page
   - Should show "Low Stock" badge in admin
   - Frontend shows stock indicator

3. ✅ Update product stock to `0`
   - Should NOT appear on home page
   - Should NOT appear in collections
   - Admin table should show "Out of Stock" status

4. ✅ Server logs show correct endpoints being queried

## Deploy Instructions
1. Commit backend changes
2. Restart backend server or redeploy to Railway
3. **Important:** Existing products may need stock values updated if they were created before this fix
4. Clear frontend cache and test

## Database Migration Note
If you have existing products without `stock` values:
- They'll default to `stock: 0` and `stockStatus: 'out_of_stock'`
- You'll need to edit each product and set the stock quantity
- Or run a migration script to set default stock (e.g., 50 units for existing products)

Example MongoDB update command (if needed):
```javascript
db.products.updateMany(
  { stock: { $exists: false } },
  { $set: { stock: 50, stockStatus: 'in_stock' } }
)
```
