# Migration Guide: From Old to New Architecture

This document explains the migration from the old flat structure to the new modular structure.

## 🔄 What Changed

### Old Structure
```
controllers/
  - auth.controller.js
  - product.controller.js
  - category.controller.js
  - order.controller.js
  - upload.controller.js

middleware/
  - auth.middleware.js
  - error.middleware.js

models/
  - Admin.js
  - Product.js
  - Category.js
  - Order.js

routes/
  - auth.routes.js
  - product.routes.js
  - category.routes.js
  - order.routes.js
```

### New Structure (Modular)
```
modules/
  - auth/
  - product/
  - category/
  - order/
  - media/
  - cart/
  - checkout/
  - dashboard/
  - search/

middlewares/
  - errorHandler.js
  - notFound.js
  - rateLimiter.js
  - uploadMiddleware.js

utils/
  - apiResponse.js
  - asyncHandler.js
  - generateToken.js
```

## 🔧 Import Changes

### Old Way
```javascript
const { protect } = require('../middleware/auth.middleware');
const { login } = require('../controllers/auth.controller');
const Admin = require('../models/Admin');
```

### New Way
```javascript
const { protect } = require('../auth/auth.middleware');
const { login } = require('../auth/auth.controller');
const Admin = require('../auth/auth.model');
```

## 📦 Creating a New Module

### Step 1: Create Directory
```bash
mkdir modules/your-feature
```

### Step 2: Create Files

**your-feature.model.js**
```javascript
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  // Define your schema
}, { timestamps: true });

module.exports = mongoose.model('YourFeature', schema);
```

**your-feature.service.js**
```javascript
const YourFeature = require('./your-feature.model');

const getAll = async () => {
  return await YourFeature.find();
};

module.exports = { getAll };
```

**your-feature.controller.js**
```javascript
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const service = require('./your-feature.service');

const getAll = asyncHandler(async (req, res) => {
  const data = await service.getAll();
  res.status(200).json(new ApiResponse(200, data, 'Fetched'));
});

module.exports = { getAll };
```

**your-feature.routes.js**
```javascript
const express = require('express');
const router = express.Router();
const { getAll } = require('./your-feature.controller');
const { protect } = require('../auth/auth.middleware');

router.get('/', getAll);
router.post('/', protect, create);

module.exports = router;
```

### Step 3: Add to server.js
```javascript
app.use('/api/your-feature', require('./modules/your-feature/your-feature.routes'));
```

## ✅ Migration Checklist

- [ ] All models moved to `modules/[feature]/[feature].model.js`
- [ ] All controllers moved to `modules/[feature]/[feature].controller.js`
- [ ] Created service files for business logic
- [ ] Routes updated to use new paths
- [ ] Middleware paths updated in routes
- [ ] server.js imports updated
- [ ] Middleware moved to `middlewares/`
- [ ] Utility functions in `utils/`
- [ ] `.env` updated with all variables
- [ ] Tested all endpoints

## 🧬 Code Patterns

### Controller Pattern
```javascript
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const service = require('./your-feature.service');

const controller = asyncHandler(async (req, res) => {
  const data = await service.someFunction();
  res.status(200).json(
    new ApiResponse(200, data, 'Success message')
  );
});

module.exports = { controller };
```

### Service Pattern
```javascript
const Model = require('./your-feature.model');

const getById = async (id) => {
  const item = await Model.findById(id);
  if (!item) throw new Error('Not found');
  return item;
};

module.exports = { getById };
```

### Route Pattern
```javascript
const express = require('express');
const router = express.Router();

const { controller } = require('./your-feature.controller');
const { protect } = require('../auth/auth.middleware');

router.get('/', controller);
router.post('/', protect, controller);

module.exports = router;
```

## 🐛 Common Issues

### Issue: Cannot find module
**Solution:** Check the relative path from the new location

### Issue: Model not loading
**Solution:** Add model require in `server.js`

### Issue: Authentication not working
**Solution:** Ensure correct import path for auth middleware

### Issue: API response format inconsistent
**Solution:** Use `ApiResponse` utility in all controllers

## 🔗 Updating Existing Code

### Before
```javascript
const { protect } = require('../middleware/auth.middleware');
const Admin = require('../models/Admin');

const login = async (req, res, next) => {
  try {
    const admin = await Admin.findOne({ email });
    res.json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
};
```

### After
```javascript
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const { protect } = require('../auth/auth.middleware');
const Admin = require('../auth/auth.model');

const login = asyncHandler(async (req, res) => {
  const admin = await Admin.findOne({ email });
  res.json(new ApiResponse(200, admin, 'Login successful'));
});
```

## 📝 Notes

- Old files (`controllers/`, `middleware/`, `routes/`) can be deleted once migration is complete
- Keep `models/` only if you have models not yet migrated to modules
- Ensure all environment variables are set in `.env`
- Test thoroughly after migration
- Consider adding tests for each module

## 🚀 Deployment After Migration

1. Run all tests
2. Check all environment variables
3. Build/compile if using TypeScript
4. Deploy to staging first
5. Test all API endpoints
6. Deploy to production

---

**Happy Migrating! 🎉**
