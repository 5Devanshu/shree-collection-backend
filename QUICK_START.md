# 🎯 Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Setup Environment (2 minutes)
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/shree_collection
JWT_SECRET=your_secret_key_here
CLOUDINARY_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### Step 2: Install Dependencies (2 minutes)
```bash
npm install
```

### Step 3: Start Server (1 minute)
```bash
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB Connected: localhost
```

### Step 4: Test It Works (1 minute)
```bash
curl http://localhost:5000/
```

Expected response:
```json
{"message":"Shree Collection API is running"}
```

**Done! 🎉 Your backend is running!**

---

## 📚 Documentation Quick Links

| Need | Document |
|------|----------|
| Setup help | SETUP_GUIDE.md |
| Quick answers | QUICK_REFERENCE.md |
| Architecture | README.md |
| Project layout | PROJECT_STRUCTURE.md |
| API overview | README.md (Module Descriptions) |
| Code migration | MIGRATION_GUIDE.md |
| All docs | DOCUMENTATION_INDEX.md |

---

## 🧪 Test Your API

### Login (Get Token)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### Get Products
```bash
curl http://localhost:5000/api/products
```

### Get Current Admin (Protected)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📊 API Endpoints Overview

```
Authentication    → /api/auth
Products         → /api/products
Categories       → /api/categories
Orders           → /api/orders
Shopping Cart    → /api/cart
Checkout         → /api/checkout
Media/Upload     → /api/media
Dashboard        → /api/dashboard
Search           → /api/search
```

**Total: 45+ Endpoints** - See README.md for full list

---

## 🎯 Key Commands

```bash
# Development
npm run dev

# Production
npm start

# Create admin user
node scripts/createAdmin.js

# Test Cloudinary
node scripts/testCloudinary.js
```

---

## 🛠️ Project Structure

```
modules/           ← Feature modules (9 total)
├── auth/          ← Authentication
├── product/       ← Products
├── category/      ← Categories
├── order/         ← Orders
└── ...

config/            ← Configuration
middlewares/       ← Global middleware
utils/             ← Utility functions
server.js          ← Entry point
```

Each module has:
- `.model.js` - Database schema
- `.service.js` - Business logic
- `.controller.js` - Request handlers
- `.routes.js` - API endpoints

---

## 💡 Key Features

✅ **Modular Architecture** - Clean, organized, scalable  
✅ **45+ API Endpoints** - Full CRUD operations  
✅ **Authentication** - JWT-based admin auth  
✅ **Error Handling** - Global error middleware  
✅ **Security** - Password hashing, protected routes  
✅ **Documentation** - Comprehensive guides  
✅ **Production Ready** - Deploy immediately  

---

## 🔐 Security

- ✅ JWT authentication
- ✅ Password hashing (bcryptjs)
- ✅ Protected routes
- ✅ CORS enabled
- ✅ Rate limiting ready
- ✅ Input validation

---

## 📞 Need Help?

1. **Quick questions?** → Read QUICK_REFERENCE.md
2. **Setup issues?** → Read SETUP_GUIDE.md
3. **Understanding code?** → Read README.md
4. **All documentation?** → Read DOCUMENTATION_INDEX.md
5. **Visual guide?** → Read ARCHITECTURE_DIAGRAMS.md

---

## ✨ What's Included

| Item | Count |
|------|-------|
| Feature Modules | 9 |
| API Endpoints | 45+ |
| Files | 55+ |
| Documentation | 10 pages |
| Middleware | 4 global |
| Utilities | 3 |

---

## 🚀 Ready?

```bash
npm run dev
```

Your backend is ready! Start building! 🎉

---

**For detailed documentation, see:**
- SETUP_GUIDE.md - Complete setup instructions
- README.md - Architecture and features
- QUICK_REFERENCE.md - Quick lookup
- DOCUMENTATION_INDEX.md - All documents

**Have fun coding! 🚀**
