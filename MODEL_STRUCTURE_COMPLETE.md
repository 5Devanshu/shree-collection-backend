# Backend Model Structure - Complete Status

## Summary
The backend has been successfully migrated to a modular structure. All models are now centralized and registered only once to avoid Mongoose conflicts.

## Current Model Locations

### ✓ Modular Models (Primary Source of Truth)
These models are in the `/modules/` structure and are the only versions that should be used:

1. **`/modules/auth/auth.model.js`**
   - Admin authentication model
   - Imported and registered in `server.js`
   - Used by: auth controller, auth middleware

2. **`/modules/category/category.model.js`**
   - Product categories
   - Imported and registered in `server.js`
   - Used by: category controller, product service

3. **`/modules/product/product.model.js`**
   - Product catalog
   - Imported and registered in `server.js`
   - Used by: product controller, checkout service, dashboard service

4. **`/modules/order/order.model.js`** ⭐ FIXED
   - Order management
   - Imported and registered in `server.js`
   - Used by: order service, order controller, checkout service, dashboard service, customer controller

### ⚠️ Legacy Models (Kept for Backward Compatibility)
These models are still in `/models/` but are NOT registered in `server.js` to avoid duplication:

1. **`/models/Customer.js`**
   - Customer account data
   - Imported and registered in `server.js` (only place it's used)
   - Used by: customer controller, email service
   - Status: Can be migrated to `/modules/customer/customer.model.js` in future

2. **`/models/Order.js`** ⚠️ DEPRECATED
   - OLD ORDER MODEL - DO NOT USE
   - No longer imported or used anywhere
   - Can be deleted; keep for reference during transition period

3. **`/models/StockNotification.js`**
   - Stock notification tracking (not actively used)
   - Status: Can be migrated or removed based on requirements

## Model Import Audit

### All Verified Working Imports

```javascript
// ✓ order.service.js
import Order from './order.model.js';

// ✓ checkout.service.js
import Order from '../order/order.model.js';

// ✓ dashboard.service.js
import Order from '../order/order.model.js';

// ✓ customer.controller.js
import Order from '../../modules/order/order.model.js';
import Customer from '../../models/Customer.js';

// ✓ server.js - All registered
import './modules/auth/auth.model.js';
import './modules/category/category.model.js';
import './modules/product/product.model.js';
import './modules/order/order.model.js';
import './models/Customer.js';
```

## No Duplicate Imports ✓
The following files are **NOT** imported in `server.js` (avoiding duplication):
- `/models/Order.js` (conflicts with `/modules/order/order.model.js`)
- `/models/StockNotification.js` (not currently used)

## Next Steps for Complete Migration

### Option 1: Conservative (Recommended for Now)
Keep current structure:
- Keep `/models/Customer.js` as is (backward compatible)
- Keep `/models/Order.js` deleted from imports (already fixed)
- Migrate StockNotification if needed

### Option 2: Full Modularization (Future)
1. Migrate Customer model to `/modules/customer/customer.model.js`
2. Remove `/models/` directory entirely
3. Update all imports to use `/modules/` exclusively

## Deployment Status
✓ Fix deployed to main branch
✓ Railway will auto-deploy on git push
✓ No more OverwriteModelError
✓ All endpoints work correctly

## Testing Commands

```bash
# Check for model registration issues
npm start

# Verify no duplicate imports
grep -r "import.*Order.*from" .

# Test endpoints
curl -X GET http://localhost:3000/api/orders
curl -X GET http://localhost:3000/api/customers
```
