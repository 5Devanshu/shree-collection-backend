# Quick Reference: Product Display Troubleshooting

## ⚡ Quick Fixes (Try These First)

### Products showing on DB but not frontend?
```bash
# 1. Clear browser cache & local storage
# DevTools → Application → Local Storage → Clear All

# 2. Restart backend
cd /Users/devanshu/Desktop/sc_backend
npm run dev

# 3. Restart frontend  
cd /Users/devanshu/Desktop/shree-collection/shree-collection
npm run dev

# 4. Hard refresh browser
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R
```

### Products not in featured section?
```javascript
// Make sure product has featured: true
// Admin Panel → Edit Product → Check "Featured"
// OR via Postman: PATCH /api/products/:id
{
  "featured": true
}
```

### Wrong prices showing?
```javascript
// Check discount settings:
// 1. discountEnabled must be true
// 2. discountPercent must be > 0
// 3. discountedPrice gets auto-calculated

// Manual calculation:
discountedPrice = price - (price * discountPercent / 100)
```

### Images not loading?
```javascript
// Check these fields exist:
// - mainImage (primary image URL)
// - images (array of image URLs)

// Both must be valid URLs from Cloudinary:
// https://res.cloudinary.com/...
```

---

## 🔍 Debug Checklist

- [ ] **MongoDB is running** → `mongo --version`
- [ ] **Backend is running** → Check terminal for "Server running on port 5000"
- [ ] **Frontend is running** → Check terminal for "Local: http://localhost:5173"
- [ ] **Products exist in DB** → `db.products.count()`
- [ ] **API returns data** → `curl http://localhost:5000/api/products`
- [ ] **Admin is logged in** → Check localStorage for `shree_admin_token`
- [ ] **Network requests succeed** → DevTools → Network tab → `/api/products` → Status 200

---

## 📋 Common Issues & Fixes

| Issue | Check | Solution |
|-------|-------|----------|
| Empty products list | API response | Add products via admin panel |
| Wrong field names | API response | Check field aliases in normalizer |
| Products not filtering by category | categorySlug in DB | Ensure categorySlug matches URL slug |
| Images missing | mainImage & images fields | Upload images when creating product |
| Discounts not applying | discountEnabled, discountPercent | Enable discount & set percentage |
| Featured products empty | featured field | Mark products as featured |

---

## 🛠️ Field Name Reference

### Use either naming convention - they auto-sync:

| Backend → DB | Alternative | Frontend |
|--------------|-------------|----------|
| `name` | `title` | Uses `name` (or `title`) |
| `mainImage` | `image` | Uses `mainImage` (or `image`) |
| `images` | `gallery` | Uses `images` (or `gallery`) |
| `featured` | `isFeatured` | Uses `featured` or `isFeatured` |
| `discountPercent` | `discountPercentage` | Uses `discountPercentage` |

---

## 📞 Support Commands

```bash
# Check backend is ready
curl http://localhost:5000/api/products

# Check specific product
curl http://localhost:5000/api/products/:id

# Check by category
curl http://localhost:5000/api/products/category/rings

# Check featured products
curl http://localhost:5000/api/products/featured

# View backend logs
cd /Users/devanshu/Desktop/sc_backend && npm run dev

# View frontend logs
cd /Users/devanshu/Desktop/shree-collection/shree-collection && npm run dev
```

---

## ✅ Verification Steps

**Step 1:** Products in DB?
```
MongoDB Compass → shree-collection → products → Should see documents
```

**Step 2:** API responding?
```
Postman → GET http://localhost:5000/api/products → Status 200 ✅
```

**Step 3:** Frontend loading?
```
Browser → http://localhost:5173 → Network tab → /api/products → Status 200 ✅
```

**Step 4:** Display check?
```
Collections page → Should show product grid with images and prices
```

---

## 🔐 Admin Operations

### Create Product
```bash
POST /api/products
Authorization: Bearer {admin_token}
{
  "name": "Ring",
  "price": 5000,
  "categorySlug": "rings",
  "stock": 10
}
```

### Update Product
```bash
PATCH /api/products/:id
Authorization: Bearer {admin_token}
{
  "featured": true
}
```

### Delete Product
```bash
DELETE /api/products/:id
Authorization: Bearer {admin_token}
```

---

**Save this file for quick reference when troubleshooting!**
