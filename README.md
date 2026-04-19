# Shree Collection Backend - Modular Architecture

This backend API follows a **modular, scalable architecture** designed to maintain clean code separation and easy feature additions.

## 📁 Project Structure

```
shree-backend/
│
├── config/
│   ├── db.js                  # Database connection setup
│   ├── env.js                 # Environment variable loader
│   └── cloudinary.js          # Media/image storage config
│
├── modules/
│   │
│   ├── auth/
│   │   ├── auth.routes.js     # Route definitions
│   │   ├── auth.controller.js # Request handlers
│   │   ├── auth.service.js    # Business logic
│   │   ├── auth.middleware.js # Auth middleware
│   │   └── auth.model.js      # Mongoose schema
│   │
│   ├── product/
│   │   ├── product.routes.js
│   │   ├── product.controller.js
│   │   ├── product.service.js
│   │   └── product.model.js
│   │
│   ├── category/
│   │   ├── category.routes.js
│   │   ├── category.controller.js
│   │   ├── category.service.js
│   │   └── category.model.js
│   │
│   ├── order/
│   │   ├── order.routes.js
│   │   ├── order.controller.js
│   │   ├── order.service.js
│   │   └── order.model.js
│   │
│   ├── cart/
│   │   ├── cart.routes.js
│   │   ├── cart.controller.js
│   │   └── cart.service.js
│   │
│   ├── checkout/
│   │   ├── checkout.routes.js
│   │   ├── checkout.controller.js
│   │   └── checkout.service.js
│   │
│   ├── media/
│   │   ├── media.routes.js
│   │   ├── media.controller.js
│   │   └── media.service.js
│   │
│   ├── dashboard/
│   │   ├── dashboard.routes.js
│   │   ├── dashboard.controller.js
│   │   └── dashboard.service.js
│   │
│   └── search/
│       ├── search.routes.js
│       ├── search.controller.js
│       └── search.service.js
│
├── middlewares/
│   ├── errorHandler.js        # Global error handling
│   ├── notFound.js            # 404 handler
│   ├── rateLimiter.js         # API rate limiting
│   └── uploadMiddleware.js    # File upload handling
│
├── utils/
│   ├── apiResponse.js         # Standardized API response helper
│   ├── asyncHandler.js        # Async error wrapper
│   └── generateToken.js       # JWT token generator
│
├── .env                       # Environment variables
├── package.json
└── server.js                  # App entry point
```

## 🏗️ Architecture Principles

### Module Structure

Each module follows this pattern:

- **Routes** - Define HTTP endpoints and link to controllers
- **Controller** - Handle HTTP requests/responses and call services
- **Service** - Contain all business logic
- **Model** - Mongoose schemas and database interaction
- **Middleware** (if applicable) - Request preprocessing

### Example: Adding a New Feature

To add a new feature (e.g., `payment`), follow this structure:

```
modules/payment/
├── payment.routes.js
├── payment.controller.js
├── payment.service.js
└── payment.model.js (if needed)
```

## 📋 Module Descriptions

### Auth Module (`modules/auth/`)
Handles admin authentication and session management.

**Key Endpoints:**
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current admin
- `POST /api/auth/logout` - Logout

**Features:**
- JWT token generation
- Password hashing with bcrypt
- Protected route middleware

---

### Product Module (`modules/product/`)
Manages product catalog, inventory, and product details.

**Key Endpoints:**
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)
- `PATCH /api/products/:id/featured` - Toggle featured status
- `PATCH /api/products/:id/stock` - Update stock

**Features:**
- Full-text search
- Category filtering
- Discount management
- Stock tracking

---

### Category Module (`modules/category/`)
Manages product categories and classification.

**Key Endpoints:**
- `GET /api/categories` - Get all categories
- `GET /api/categories/:slug` - Get category by slug
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

**Features:**
- Slug-based routing
- Cascade updates for products
- Cloudinary image management

---

### Order Module (`modules/order/`)
Handles order creation, tracking, and status updates.

**Key Endpoints:**
- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status (admin)
- `PATCH /api/orders/:id/payment-status` - Update payment status (admin)

**Features:**
- Order tracking
- Payment status management
- Customer information storage

---

### Cart Module (`modules/cart/`)
Manages shopping cart functionality.

**Key Endpoints:**
- `POST /api/cart` - Add item to cart
- `GET /api/cart` - Get cart contents
- `PATCH /api/cart/:itemId` - Update cart item quantity
- `DELETE /api/cart/:itemId` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

---

### Checkout Module (`modules/checkout/`)
Handles checkout process and order total calculation.

**Key Endpoints:**
- `POST /api/checkout` - Validate and process checkout
- `POST /api/checkout/calculate` - Calculate order totals

**Features:**
- Order validation
- Automatic total calculation
- Shipping cost management

---

### Media Module (`modules/media/`)
Handles image uploads to Cloudinary.

**Key Endpoints:**
- `POST /api/media/upload` - Single image upload (admin)
- `POST /api/media/upload-multiple` - Multiple image upload (admin)
- `DELETE /api/media/:publicId` - Delete image (admin)

**Features:**
- Automatic image optimization
- Max file size validation
- Public ID tracking for deletion

---

### Dashboard Module (`modules/dashboard/`)
Provides analytics and statistics for the admin panel.

**Key Endpoints:**
- `GET /api/dashboard/stats` - Dashboard statistics (admin)
- `GET /api/dashboard/revenue` - Revenue chart data (admin)
- `GET /api/dashboard/products` - Product performance (admin)
- `GET /api/dashboard/customers` - Customer analytics (admin)

---

### Search Module (`modules/search/`)
Handles product search and filtering.

**Key Endpoints:**
- `GET /api/search` - Search products with filters
- `GET /api/search/suggestions` - Get search suggestions

**Features:**
- Full-text search
- Price range filtering
- Category filtering
- Auto-suggestions

---

## 🛠️ Utility Functions

### API Response (`utils/apiResponse.js`)
Standardized response format for all endpoints:

```javascript
{
  statusCode: 200,
  data: { /* response data */ },
  message: "Success message",
  success: true
}
```

### Async Handler (`utils/asyncHandler.js`)
Wraps async controllers to catch errors automatically:

```javascript
const myController = asyncHandler(async (req, res) => {
  // No try-catch needed - errors automatically passed to error handler
});
```

### Generate Token (`utils/generateToken.js`)
JWT token generation utility:

```javascript
const token = generateToken(userId, '7d');
```

---

## 🔐 Middleware

### Error Handler (`middlewares/errorHandler.js`)
Global error handling with support for:
- Mongoose validation errors
- JWT errors
- Duplicate key errors
- CastErrors for invalid IDs

### 404 Handler (`middlewares/notFound.js`)
Handles requests to undefined routes.

### Rate Limiter (`middlewares/rateLimiter.js`)
Protects API from abuse (15 requests per 15 minutes per IP).

### Upload Middleware (`middlewares/uploadMiddleware.js`)
Handles file uploads with validation:
- Max 5MB file size
- Allowed formats: JPG, PNG, WEBP

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/shree_collection

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Client
CLIENT_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password

# Payment Gateway
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
```

---

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

---

## 📝 API Response Format

### Success Response
```json
{
  "statusCode": 200,
  "data": { /* response data */ },
  "message": "Success message",
  "success": true
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

---

## 🔄 Data Flow

1. **Request** comes to a route
2. **Route** passes to appropriate **controller**
3. **Controller** calls **service** for business logic
4. **Service** interacts with **database** via **model**
5. **Response** is formatted using **ApiResponse**
6. **Errors** are caught by **error handler**

---

## 🧪 Testing Routes

### Create Admin (one-time)
```bash
node scripts/createAdmin.js
```

### Test Cloudinary Upload
```bash
node scripts/testCloudinary.js
```

---

## 📚 Best Practices

1. **Always use AsyncHandler** for controllers
2. **Return consistent ApiResponse** from all endpoints
3. **Keep business logic in services**, not controllers
4. **Use middleware for authentication** on protected routes
5. **Validate input data** before processing
6. **Throw descriptive errors** for debugging
7. **Use TypeScript** for larger projects (future upgrade)

---

## 🔗 Dependencies

- **Express.js** - Web framework
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **Cloudinary** - Image storage
- **Multer** - File upload
- **Nodemailer** - Email service
- **Cors** - Cross-origin requests
- **Morgan** - HTTP logging

---

## 📞 Support

For issues or questions about the architecture, refer to the module documentation or check the service files for implementation details.

---

**Last Updated:** April 2026  
**Version:** 1.0.0  
**Architecture:** Modular MVC Pattern
