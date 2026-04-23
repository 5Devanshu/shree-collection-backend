# Category Filtering Fix - April 23, 2026

## Problem
Product appears in "All Collections" but NOT in its specific category collection (e.g., "Necklace").

**Visual Evidence:**
- "All Collections" → Shows "1 PIECE" (Lotus necklace visible) ✅
- "Necklace" Collection → Shows "0 PIECES" (Same product missing) ❌

## Root Cause Analysis

### The Issue
CategoryPage uses client-side filtering:
```javascript
productList.filter(p => p.categorySlug === category)
```

But the API returns:
```json
{
  "title": "Lotus chain necklace with earrings",
  "category": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Necklace",
    "slug": "necklace"
  },
  "categorySlug": undefined  // ❌ MISSING!
}
```

**Result:** `p.categorySlug` is undefined → filter fails → 0 products shown

### Why This Happens
1. API stores: `category: ObjectId` (database reference)
2. API populates: `category: { _id, name, slug }` (object with metadata)
3. Frontend expects: `categorySlug: "necklace"` (flat string)
4. **Mismatch:** No `categorySlug` field in response

### The Fix
Add `categorySlug` extraction to the normalization function:

**Before:**
```javascript
{ 
  category: { _id: "...", name: "Necklace", slug: "necklace" },
  categorySlug: undefined
}
```

**After:**
```javascript
{
  category: { _id: "...", name: "Necklace", slug: "necklace" },
  categorySlug: "necklace"  // ✅ Extracted!
}
```

## Solution Implemented

### File: `utils/normalizeProduct.js`

Added category slug extraction to normalization:

```javascript
// Extract categorySlug from populated category reference
// Backend returns: category: { _id: "...", name: "Rings", slug: "rings" }
// Frontend expects: categorySlug: "rings"
if (normalized.category && typeof normalized.category === 'object' && normalized.category.slug) {
  normalized.categorySlug = normalized.category.slug;
}
```

### What This Does

For each product in the API response:
1. ✅ Check if category is an object
2. ✅ Check if it has a slug property
3. ✅ Extract the slug value
4. ✅ Add it as `categorySlug` field

### Data Flow

```
MongoDB:
  product.category = ObjectId("507f1f77bcf86cd799439011")
       ↓
Query with populate:
  product.category = { _id: "507f1f77bcf86cd799439011", name: "Necklace", slug: "necklace" }
       ↓
Normalization:
  Extract: normalized.categorySlug = product.category.slug
       ↓
API Response:
  {
    "title": "Lotus chain necklace",
    "category": { "name": "Necklace", "slug": "necklace" },
    "categorySlug": "necklace"  ✅
  }
       ↓
Frontend Filter:
  productList.filter(p => p.categorySlug === "necklace")  ✅ WORKS!
       ↓
Result:
  Product appears in Necklace collection ✅
```

## Expected Behavior After Fix

### Before (❌ Broken)
```
URL: /collections/necklace
Filter: p.categorySlug === "necklace"
Product has: categorySlug = undefined
Result: 0 matches → "0 PIECES"
```

### After (✅ Fixed)
```
URL: /collections/necklace
Filter: p.categorySlug === "necklace"
Product has: categorySlug = "necklace"
Result: 1 match → Shows product ✅
```

## Testing After Deploy

### Test 1: All Collections Page
```
1. Go to: https://shreecollection.co.in/collections/all
2. Should show: "1 PIECE" (Lotus necklace)
3. Product visible with image
```

### Test 2: Necklace Collection
```
1. Go to: https://shreecollection.co.in/collections/necklace
2. Should show: "1 PIECE" (Same product)
3. Product visible with image
4. Previously showed "0 PIECES" - NOW FIXED ✅
```

### Test 3: Verify Filtering Works
```
1. On necklace collection page
2. Filter by price (e.g., "Under ₹5,000")
3. Filter by "In Stock Only" checkbox
4. Product count should update correctly
5. Products should appear/disappear based on filters
```

### Test 4: Other Categories
```
1. If you have other categories, verify each shows correct products
2. Products should appear in their correct category only
3. No duplicate or missing products
```

## Files Modified

| File | Change | Impact |
|------|--------|--------|
| `utils/normalizeProduct.js` | Add categorySlug extraction | Fixes category filtering |

## API Response Changes

### GET /api/products

**Before:**
```json
{
  "success": true,
  "products": [
    {
      "title": "Lotus chain necklace with earrings",
      "price": 400,
      "category": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Necklace",
        "slug": "necklace"
      },
      "categorySlug": undefined
    }
  ]
}
```

**After:**
```json
{
  "success": true,
  "products": [
    {
      "title": "Lotus chain necklace with earrings",
      "price": 400,
      "category": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Necklace",
        "slug": "necklace"
      },
      "categorySlug": "necklace"
    }
  ]
}
```

## All Affected Endpoints

All endpoints returning products now include `categorySlug`:

**Product Endpoints:**
- ✅ `GET /api/products`
- ✅ `GET /api/products/featured`
- ✅ `GET /api/products/category/:slug`
- ✅ `GET /api/products/:id`
- ✅ `POST /api/products`
- ✅ `PATCH /api/products/:id`

**Search Endpoints:**
- ✅ `GET /api/search`
- ✅ `GET /api/search/suggestions`
- ✅ `GET /api/search/products`
- ✅ `GET /api/search/related/:id`

## Why This Matters

The frontend code already assumes `categorySlug` exists:
```javascript
// CategoryPage.jsx line 91
productList.filter(p => p.categorySlug === category)
```

Without this field, the filter always fails, making collections always show "0 PIECES" even when products exist.

## Verification Commands

### Check API Response
```bash
curl https://shreecollection.co.in/api/products?limit=1 | jq '.products[0] | {title, categorySlug}'
```

Expected output:
```json
{
  "title": "Lotus chain necklace with earrings",
  "categorySlug": "necklace"
}
```

### Check Frontend Console
```
Press F12 → Console tab
Go to: /collections/necklace
Should see: "1 PIECE" (not "0 PIECES")
No errors in console
```

## Deployment Steps

1. Deploy updated `utils/normalizeProduct.js`
2. Restart backend on Railway
3. Clear browser cache (Ctrl+Shift+Delete)
4. Hard refresh (Ctrl+F5)
5. Run all 4 tests above

## Expected Results

✅ "All Collections" shows products
✅ "Necklace" collection shows same products
✅ Other categories show correct products
✅ Filtering works on category pages
✅ No "0 PIECES" message when products exist
✅ Frontend receives `categorySlug` field

## Summary

**One-line fix:** Extract `categorySlug` from populated category reference in normalization.

This ensures frontend filtering logic works correctly by providing the expected field in the API response.

**Before:** `categorySlug` missing → 0 products
**After:** `categorySlug` present → Products appear correctly ✅
