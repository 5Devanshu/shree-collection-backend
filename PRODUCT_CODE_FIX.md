# 🔧 Product Code Duplicate Key Error - FIX

## Problem
```
E11000 duplicate key error collection: jewelry_db.products 
index: productCode_1 dup key: { productCode: null }
```

## Root Cause
MongoDB has a **unique index on `productCode`** that shouldn't exist. The current schema doesn't have this field, so when creating products:
1. Form submits without `productCode`
2. MongoDB receives `productCode: null` (or undefined)
3. Unique index violation → E11000 error

## Solution (Choose One)

### Option 1: Remove the Bad Index (Recommended for Development)

```javascript
// In Node.js/MongoDB shell or via admin panel:
db.products.dropIndex("productCode_1")
```

Or in your backend server code, add this cleanup:

```javascript
// server.js or during initialization
import Product from './modules/product/product.model.js';

// Remove bad index
await Product.collection.dropIndex('productCode_1').catch(() => {
  console.log('productCode_1 index does not exist or already removed');
});
```

### Option 2: Add productCode Field to Schema (If Needed)

If you actually need product codes, add to `modules/product/product.model.js`:

```javascript
productSchema = {
  // ... existing fields ...
  productCode: {
    type: String,
    unique: true,
    sparse: true,  // Allow null/missing values
    trim: true,
  },
  // ... rest of fields ...
}
```

### Option 3: Drop and Rebuild Database (Nuclear Option)

```bash
# Delete collection and rebuild
# In MongoDB:
db.products.drop()

# This will:
# 1. Delete ALL products (⚠️ WARNING!)
# 2. Remove all bad indexes
# 3. Start fresh
```

---

## Recommended Action

**Do this now:**

1. **Check MongoDB indexes**:
   ```javascript
   db.products.getIndexes()
   // Look for "productCode_1" - if it exists, drop it
   ```

2. **Remove the bad index**:
   ```javascript
   db.products.dropIndex("productCode_1")
   ```

3. **Try adding product again** in admin panel

4. **Should work now!** ✅

---

## Temporary Workaround (If You Can't Access MongoDB)

Add this to your backend `/modules/product/product.routes.js` before the post route:

```javascript
// Auto-cleanup bad index on startup
import Product from './product.model.js';

// Middleware to remove bad index
const removeOldIndexes = async (req, res, next) => {
  try {
    await Product.collection.dropIndex('productCode_1');
    console.log('✓ Removed productCode_1 index');
  } catch (err) {
    // Index doesn't exist, that's fine
  }
  next();
};

// Use middleware on product creation
router.post('/', removeOldIndexes, protect, createProduct);
```

---

## Prevention

Make sure your schema ONLY has these fields:
- title ✅
- description ✅
- material ✅
- price ✅
- stock ✅
- image ✅
- category ✅
- stockStatus ✅
- isFeatured ✅
- delivery ✅
- returns ✅

NO productCode, NO productId, NO sku (unless intentionally added)

---

## Testing After Fix

1. Go to Admin Panel
2. Click "+ Add Product"
3. Fill in form:
   - Product Name: "Test Product"
   - Material: "Gold"
   - Price: 100
   - Stock: 5
   - Category: Select one
   - Image: Upload
4. Click "Add"
5. Should see: ✅ Success (201 Created)

If still getting 400, the index might need manual removal via MongoDB client.

