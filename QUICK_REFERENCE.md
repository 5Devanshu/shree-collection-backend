# Quick Reference Guide

## 🚀 Common Commands

### Setup
```bash
npm install
node scripts/createAdmin.js  # Create first admin
```

### Development
```bash
npm run dev  # Start with nodemon
```

### Testing
```bash
npm test
```

## 📁 File Locations

| What | Where |
|------|-------|
| Models | `modules/[feature]/[feature].model.js` |
| Controllers | `modules/[feature]/[feature].controller.js` |
| Services | `modules/[feature]/[feature].service.js` |
| Routes | `modules/[feature]/[feature].routes.js` |
| Middleware | `modules/[feature]/[feature].middleware.js` or `middlewares/` |
| Utilities | `utils/` |
| Config | `config/` |

## 🔑 Key Functions

### Generate Token
```javascript
const generateToken = require('../../utils/generateToken');
const token = generateToken(userId);
```

### Handle Errors
```javascript
const asyncHandler = require('../../utils/asyncHandler');

const controller = asyncHandler(async (req, res) => {
  // Errors automatically caught and passed to error handler
});
```

### Send Response
```javascript
const ApiResponse = require('../../utils/apiResponse');

res.status(200).json(
  new ApiResponse(200, data, 'Success message')
);
```

## 🔐 Protected Routes

```javascript
const { protect } = require('../auth/auth.middleware');

router.post('/admin-only', protect, controller);
```

## 📤 File Uploads

```javascript
const upload = require('../../middlewares/uploadMiddleware');

router.post('/upload', protect, upload.single('image'), controller);
router.post('/upload-multiple', protect, upload.array('images', 5), controller);
```

## 🗄️ Database Queries

### Find All
```javascript
const items = await Model.find();
```

### Find One
```javascript
const item = await Model.findOne({ slug: 'value' });
```

### Find by ID
```javascript
const item = await Model.findById(id);
```

### Create
```javascript
const item = await Model.create({ field: 'value' });
```

### Update
```javascript
const item = await Model.findByIdAndUpdate(id, updateData, { new: true });
```

### Delete
```javascript
await Model.deleteOne({ _id: id });
```

## 🌐 API Response Format

```javascript
// Success
{
  "statusCode": 200,
  "data": { /* data */ },
  "message": "Success message",
  "success": true
}

// Error
{
  "success": false,
  "message": "Error message"
}
```

## 🧪 Testing Endpoints

### With cURL

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

**Get Products**
```bash
curl http://localhost:5000/api/products
```

**Create Product (Protected)**
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Product","price":1000,"categorySlug":"jewelry"}'
```

### With Postman

1. Set `Authorization` header: `Bearer {token}`
2. Set `Content-Type`: `application/json`
3. Import and test endpoints

## 🛣️ Route Patterns

### Public Routes
```javascript
router.get('/', getAll);
router.get('/:id', getOne);
```

### Protected Routes
```javascript
router.post('/', protect, create);
router.put('/:id', protect, update);
router.delete('/:id', protect, delete);
```

## 🔍 Debugging Tips

### Check Logs
```bash
# Error logs are printed to console during development
# Check terminal output for error details
```

### Database Connection
```javascript
// Check if MongoDB is connected
console.log(mongoose.connection.readyState);
// 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
```

### Middleware Order Matters
```javascript
// Correct: Error handler last
app.use(routes);
app.use(notFound);
app.use(errorHandler);

// Wrong: Error handler in middle
app.use(errorHandler); // ❌
app.use(routes);
```

## 📦 Environment Variables

Copy `.env.example` to `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/shree
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
CLOUDINARY_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

## 🎯 Module Checklist

When creating a new module:

- [ ] Create directory in `modules/`
- [ ] Create `.model.js` with schema
- [ ] Create `.service.js` with business logic
- [ ] Create `.controller.js` with route handlers
- [ ] Create `.routes.js` with endpoints
- [ ] Add import in `server.js`
- [ ] Test all endpoints
- [ ] Update documentation

## 🚨 Common Errors

### "Cannot find module"
- Check import path spelling
- Verify file exists
- Use relative paths correctly

### "Token expired"
- Generate new token with `/api/auth/login`
- Include token in Authorization header

### "CORS error"
- Check CLIENT_URL in `.env`
- Ensure credentials: true in cors options

### "Database not connected"
- Check MONGO_URI
- Ensure MongoDB is running
- Check network connection

## 📚 Documentation Files

- `README.md` - Full architecture overview
- `MIGRATION_GUIDE.md` - How to migrate old code
- `DEPENDENCIES.md` - Optional packages
- This file - Quick reference

## 🔗 Useful Links

- [Express Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Documentation](https://jwt.io/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

## 💡 Best Practices

1. **Always use AsyncHandler** for controllers
2. **Never expose passwords** in responses
3. **Validate input** before processing
4. **Use services** for business logic
5. **Throw descriptive errors**
6. **Log important operations**
7. **Test endpoints** before deployment
8. **Keep .env secrets safe**

## 🎓 Learning Path

1. Read `README.md` to understand architecture
2. Study `modules/auth/` - simplest module
3. Study `modules/product/` - complex module with relations
4. Create a test module following the pattern
5. Refer to `MIGRATION_GUIDE.md` for any legacy code
6. Deploy with confidence!

---

**Questions?** Check the module documentation or trace through the code flow!
