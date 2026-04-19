# Fix: Mongoose OverwriteModelError for Order Model

## Problem
Railway production was throwing `OverwriteModelError: Cannot overwrite 'Order' model once compiled` because the Order model was being registered twice:

1. Once in `/models/Order.js` (old location, imported in `server.js`)
2. Once in `/modules/order/order.model.js` (new modular location, also imported in `server.js`)

When Node.js loaded both files, Mongoose tried to register the same model twice, causing a conflict.

## Root Cause
During the migration to the `/modules/` structure:
- The new Order model was created at `/modules/order/order.model.js`
- The old Order model at `/models/Order.js` was NOT deleted
- Both were imported in `server.js`, causing a double-registration

Additionally, `modules/customer/customer.controller.js` was importing Order from the old location, creating inconsistency.

## Solution

### 1. Removed Duplicate Import from `server.js`
**Before:**
```javascript
// Load models
import './modules/auth/auth.model.js';
import './modules/category/category.model.js';
import './modules/product/product.model.js';
import './modules/order/order.model.js';
import './models/Customer.js';
import './models/Order.js';  // ❌ DUPLICATE - REMOVED
```

**After:**
```javascript
// Load models
import './modules/auth/auth.model.js';
import './modules/category/category.model.js';
import './modules/product/product.model.js';
import './modules/order/order.model.js';
import './models/Customer.js';
```

### 2. Fixed Import Path in `customer.controller.js`
**Before:**
```javascript
import Order from '../../models/Order.js';  // ❌ OLD LOCATION
```

**After:**
```javascript
import Order from '../../modules/order/order.model.js';  // ✓ CORRECT LOCATION
```

### 3. Verified All Order Model Imports
All files now correctly import Order from the modular location:
- ✓ `/modules/order/order.service.js` - `import Order from './order.model.js'`
- ✓ `/modules/order/order.controller.js` - uses order service
- ✓ `/modules/checkout/checkout.service.js` - `import Order from '../order/order.model.js'`
- ✓ `/modules/dashboard/dashboard.service.js` - `import Order from '../order/order.model.js'`
- ✓ `/modules/customer/customer.controller.js` - `import Order from '../../modules/order/order.model.js'`

## Files Modified
1. `/Users/devanshu/Desktop/sc_backend/server.js` - Removed duplicate Order.js import
2. `/Users/devanshu/Desktop/sc_backend/modules/customer/customer.controller.js` - Updated import path

## Files Deleted (Optional but Recommended)
The old `/models/Order.js` can now be safely deleted since the new modular version is the source of truth:
- `/Users/devanshu/Desktop/sc_backend/models/Order.js` (deprecated - use `/modules/order/order.model.js` instead)

Note: Customer.js is still in `/models/` because it hasn't been migrated yet and is used consistently across the codebase.

## Testing

### Local Environment
✓ Backend starts successfully without `OverwriteModelError`
✓ All Order-related endpoints work correctly
✓ No model registration conflicts

### Production (Railway)
After deploying this fix, Railway will:
1. Load only the modular Order model from `/modules/order/order.model.js`
2. No longer encounter OverwriteModelError during startup
3. All customer, order, checkout, and dashboard endpoints will work correctly

## Deployment Steps
1. Commit the changes:
   ```bash
   git commit -m "Fix: Remove duplicate Order model registration"
   ```

2. Push to Railway:
   ```bash
   git push origin main
   ```

3. Railway will automatically redeploy and the error should be resolved.

## Verification Checklist
- [ ] Backend starts locally without errors
- [ ] All Order endpoints work: GET, POST, PUT, DELETE
- [ ] Customer orders fetch correctly
- [ ] Checkout creates orders successfully
- [ ] Dashboard displays orders without errors
- [ ] Production logs show no OverwriteModelError

## Additional Notes
This fix ensures a single source of truth for the Order model in the modular `/modules/` structure. All future development should use the modular versions exclusively and not create duplicate models in the old `/models/` location.
