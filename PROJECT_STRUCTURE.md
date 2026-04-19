# Project Structure Overview

## Complete Directory Tree

```
shree-backend/
│
├── 📁 config/
│   ├── db.js                    # MongoDB connection
│   ├── env.js                   # Environment variables loader
│   ├── cloudinary.js            # Cloudinary configuration
│   └── mailer.js                # Email configuration (if exists)
│
├── 📁 modules/
│   │
│   ├── 📁 auth/
│   │   ├── auth.model.js        # Admin schema (User/Auth schema)
│   │   ├── auth.service.js      # Authentication business logic
│   │   ├── auth.controller.js   # Auth request handlers
│   │   ├── auth.middleware.js   # JWT verification middleware
│   │   └── auth.routes.js       # Auth endpoints
│   │
│   ├── 📁 product/
│   │   ├── product.model.js     # Product schema with gallery, discounts
│   │   ├── product.service.js   # Product business logic
│   │   ├── product.controller.js # Product request handlers
│   │   └── product.routes.js    # Product endpoints
│   │
│   ├── 📁 category/
│   │   ├── category.model.js    # Category schema
│   │   ├── category.service.js  # Category business logic
│   │   ├── category.controller.js # Category request handlers
│   │   └── category.routes.js   # Category endpoints
│   │
│   ├── 📁 order/
│   │   ├── order.model.js       # Order schema with items & customer
│   │   ├── order.service.js     # Order business logic
│   │   ├── order.controller.js  # Order request handlers
│   │   └── order.routes.js      # Order endpoints
│   │
│   ├── 📁 cart/
│   │   ├── cart.service.js      # Cart operations
│   │   ├── cart.controller.js   # Cart request handlers
│   │   └── cart.routes.js       # Cart endpoints
│   │
│   ├── 📁 checkout/
│   │   ├── checkout.service.js  # Checkout logic & validation
│   │   ├── checkout.controller.js # Checkout handlers
│   │   └── checkout.routes.js   # Checkout endpoints
│   │
│   ├── 📁 media/
│   │   ├── media.service.js     # Cloudinary upload/delete logic
│   │   ├── media.controller.js  # Media request handlers
│   │   └── media.routes.js      # Media upload endpoints
│   │
│   ├── 📁 dashboard/
│   │   ├── dashboard.service.js # Analytics & statistics logic
│   │   ├── dashboard.controller.js # Dashboard handlers
│   │   └── dashboard.routes.js  # Dashboard endpoints
│   │
│   └── 📁 search/
│       ├── search.service.js    # Search & filtering logic
│       ├── search.controller.js # Search handlers
│       └── search.routes.js     # Search endpoints
│
├── 📁 middlewares/
│   ├── errorHandler.js          # Global error handling
│   ├── notFound.js              # 404 handler
│   ├── rateLimiter.js           # API rate limiting
│   └── uploadMiddleware.js      # Multer file upload configuration
│
├── 📁 utils/
│   ├── apiResponse.js           # Standardized response format
│   ├── asyncHandler.js          # Async/await error wrapper
│   └── generateToken.js         # JWT token generation utility
│
├── 📁 scripts/
│   ├── createAdmin.js           # Create initial admin user
│   └── testCloudinary.js        # Test Cloudinary connection
│
├── 📁 services/
│   └── email.service.js         # Email sending service
│
├── 📄 server.js                 # Main application entry point
├── 📄 package.json              # Dependencies and scripts
├── 📄 .env                      # Environment variables (DO NOT COMMIT)
├── 📄 .env.example              # Environment variables template
├── 📄 .gitignore                # Git ignore rules
│
├── 📖 README.md                 # Complete architecture documentation
├── 📖 MIGRATION_GUIDE.md        # Migration instructions
├── 📖 REFACTORING_SUMMARY.md    # Refactoring details
├── 📖 QUICK_REFERENCE.md        # Developer quick reference
├── 📖 DEPENDENCIES.md           # Optional dependencies
│
└── 📁 node_modules/            # Installed packages (auto-generated)
```

## 📊 Module Statistics

| Module | Files | Purpose |
|--------|-------|---------|
| **auth** | 5 | Admin authentication and authorization |
| **product** | 4 | Product catalog and inventory management |
| **category** | 4 | Product categorization and organization |
| **order** | 4 | Order processing and tracking |
| **cart** | 3 | Shopping cart operations |
| **checkout** | 3 | Checkout and order validation |
| **media** | 3 | Image uploads and management |
| **dashboard** | 3 | Admin analytics and statistics |
| **search** | 3 | Product search and filtering |
| **middlewares** | 4 | Global middleware |
| **utils** | 3 | Utility functions |
| **config** | 3 | Configuration files |
| **scripts** | 2 | Utility scripts |
| **Total** | **47** | Complete modular backend |

## 🔄 Request Flow Diagram

```
┌─────────────────┐
│    REQUEST      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   ROUTE LAYER   │
│  (routes.js)    │ ← Defines endpoints and links to controller
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ MIDDLEWARE LAYER│
│ (auth check,    │ ← Validates request (authentication, rate limit, etc.)
│  rate limit)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ CONTROLLER LAYER│
│(controller.js)  │ ← Handles HTTP request/response
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SERVICE LAYER   │
│ (service.js)    │ ← Contains business logic
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ MODEL LAYER     │
│ (model.js)      │ ← Interacts with database
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    DATABASE     │
│   (MongoDB)     │
└─────────────────┘
         │
         ▼
    ┌────────────┐
    │ ApiResponse│ ← Standardized response format
    └────────────┘
         │
         ▼
┌─────────────────┐
│   RESPONSE      │
└─────────────────┘
         │
    ┌────▼────┐
    │          │
    ▼          ▼
 SUCCESS    ERROR
   │          │
   └──────┬───┘
          ▼
  ┌──────────────────┐
  │  ERROR HANDLER   │
  │ (global handler) │
  └──────────────────┘
```

## 🎯 Key Features by Module

### 🔐 Auth Module
- Admin login/logout
- JWT token generation
- Password hashing (bcryptjs)
- Protected route middleware
- Current admin retrieval

### 📦 Product Module
- CRUD operations (Create, Read, Update, Delete)
- Full-text search
- Category filtering
- Price range filtering
- Stock management
- Discount handling (percentage-based)
- Featured products
- Image gallery support

### 🏷️ Category Module
- Category management
- Slug-based URL structure
- Cascade updates for products
- Cloudinary image management
- Category-wise product filtering

### 📋 Order Module
- Order creation and tracking
- Order status management (pending → delivered)
- Payment status tracking (unpaid → refunded)
- Customer information storage
- Order item details with pricing

### 🛒 Cart Module
- Add items to cart
- Remove items from cart
- Update quantities
- Clear entire cart
- Cart persistence (foundation for future)

### 💳 Checkout Module
- Checkout data validation
- Automatic total calculation
- Shipping cost management
- Order summary generation

### 📸 Media Module
- Single image upload
- Multiple image upload (up to 5 files)
- Cloudinary integration
- Automatic image optimization
- Image deletion by public_id
- File type validation (JPG, PNG, WEBP)

### 📊 Dashboard Module
- Dashboard statistics
- Revenue analytics
- Product performance
- Customer analytics
- (Detailed implementation to be added)

### 🔍 Search Module
- Product search by keywords
- Multi-filter support (category, price range)
- Text search suggestions
- Pagination support
- Sort by price/name/date

## 📝 API Endpoint Structure

```
├── /api/auth
│   ├── POST   /login              # Admin login
│   ├── GET    /me                 # Get current admin
│   └── POST   /logout             # Logout
│
├── /api/products
│   ├── GET    /                   # Get all products (with filters)
│   ├── GET    /:id                # Get single product
│   ├── POST   /                   # Create product (admin)
│   ├── PUT    /:id                # Update product (admin)
│   ├── DELETE /:id                # Delete product (admin)
│   ├── PATCH  /:id/featured       # Toggle featured status (admin)
│   └── PATCH  /:id/stock          # Update stock (admin)
│
├── /api/categories
│   ├── GET    /                   # Get all categories
│   ├── GET    /:slug              # Get category by slug
│   ├── POST   /                   # Create category (admin)
│   ├── PUT    /:id                # Update category (admin)
│   └── DELETE /:id                # Delete category (admin)
│
├── /api/orders
│   ├── GET    /                   # Get all orders (admin)
│   ├── GET    /:id                # Get order details (admin)
│   ├── POST   /                   # Create new order
│   ├── PATCH  /:id/status         # Update order status (admin)
│   └── PATCH  /:id/payment-status # Update payment status (admin)
│
├── /api/cart
│   ├── POST   /                   # Add to cart
│   ├── GET    /                   # Get cart
│   ├── PATCH  /:itemId            # Update item quantity
│   ├── DELETE /:itemId            # Remove item
│   └── DELETE /                   # Clear cart
│
├── /api/checkout
│   ├── POST   /                   # Process checkout
│   └── POST   /calculate          # Calculate totals
│
├── /api/media
│   ├── POST   /                   # Upload single image (admin)
│   ├── POST   /multiple           # Upload multiple images (admin)
│   └── DELETE /:publicId          # Delete image (admin)
│
├── /api/dashboard
│   ├── GET    /stats              # Dashboard stats (admin)
│   ├── GET    /revenue            # Revenue data (admin)
│   ├── GET    /products           # Product performance (admin)
│   └── GET    /customers          # Customer analytics (admin)
│
└── /api/search
    ├── GET    /                   # Search products
    └── GET    /suggestions        # Get suggestions
```

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Cloud Storage**: Cloudinary
- **Email**: Nodemailer
- **HTTP Logging**: Morgan
- **CORS**: cors
- **Environment**: dotenv

## 📈 Scalability Path

### Current (Single Server)
- All modules in one server
- Single MongoDB instance
- File uploads to Cloudinary

### Phase 1 (Load Balancing)
- Multiple server instances
- Load balancer (Nginx/HAProxy)
- Shared MongoDB replica set
- Session management

### Phase 2 (Microservices)
- Separate services per module
- API Gateway
- Message Queue (RabbitMQ/Kafka)
- Service discovery (Consul/Eureka)

### Phase 3 (Enterprise)
- Kubernetes orchestration
- Docker containerization
- Service mesh (Istio)
- Advanced monitoring (Prometheus/Grafana)

---

This structure ensures your backend is:
- ✅ **Maintainable** - Clear organization
- ✅ **Scalable** - Easy to add features
- ✅ **Testable** - Isolated modules
- ✅ **Collaborative** - Multiple developers can work simultaneously
- ✅ **Professional** - Industry-standard patterns

