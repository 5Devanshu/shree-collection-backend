# 🗺️ Architecture Diagrams

## 1. Project Structure Tree

```
shree-backend/
│
├── 📁 modules/                           (9 Feature Modules)
│   ├── 📁 auth/
│   │   ├── auth.model.js
│   │   ├── auth.service.js
│   │   ├── auth.controller.js
│   │   ├── auth.middleware.js
│   │   └── auth.routes.js
│   │
│   ├── 📁 product/
│   │   ├── product.model.js
│   │   ├── product.service.js
│   │   ├── product.controller.js
│   │   └── product.routes.js
│   │
│   ├── 📁 category/
│   │   ├── category.model.js
│   │   ├── category.service.js
│   │   ├── category.controller.js
│   │   └── category.routes.js
│   │
│   ├── 📁 order/
│   │   ├── order.model.js
│   │   ├── order.service.js
│   │   ├── order.controller.js
│   │   └── order.routes.js
│   │
│   ├── 📁 cart/
│   ├── 📁 checkout/
│   ├── 📁 media/
│   ├── 📁 dashboard/
│   └── 📁 search/
│
├── 📁 config/
│   ├── db.js
│   ├── env.js
│   └── cloudinary.js
│
├── 📁 middlewares/
│   ├── errorHandler.js
│   ├── notFound.js
│   ├── rateLimiter.js
│   └── uploadMiddleware.js
│
├── 📁 utils/
│   ├── apiResponse.js
│   ├── asyncHandler.js
│   └── generateToken.js
│
├── 📁 scripts/
├── 📁 services/
│
├── server.js
├── package.json
├── .env
└── .env.example
```

---

## 2. Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP REQUEST                              │
│                   (from client)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  ROUTE MATCHING                              │
│        (server.js - app.use routes)                          │
│                                                              │
│  /api/auth        → auth.routes.js                          │
│  /api/products    → product.routes.js                       │
│  /api/categories  → category.routes.js                      │
│  /api/orders      → order.routes.js                         │
│  ... etc                                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              MIDDLEWARE CHAIN                                │
│  • CORS & JSON parsing (in server.js)                       │
│  • Morgan logging (dev logging)                             │
│  • Rate limiting (if configured)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           ROUTE-SPECIFIC MIDDLEWARE                         │
│  • Authentication (protect middleware)                      │
│  • File upload (upload middleware)                          │
│  • Custom middleware                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CONTROLLER LAYER                               │
│  • Parse request data                                       │
│  • Call service function                                    │
│  • Handle response                                          │
│                                                              │
│  Example: productController.getProducts()                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              SERVICE LAYER                                  │
│  • Business logic                                           │
│  • Data validation                                          │
│  • Call model/database                                      │
│  • Return processed data                                    │
│                                                              │
│  Example: productService.getAllProducts()                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              MODEL LAYER                                    │
│  • Database queries                                         │
│  • Data validation                                          │
│  • Schema definition                                        │
│                                                              │
│  Example: Product.find(), Product.create()                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (MongoDB)                              │
│  • Store/retrieve data                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                    Response data
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         SERVICE LAYER (Return to Controller)                │
│  • Format response data                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         CONTROLLER (Format Response)                        │
│  • Use ApiResponse utility                                  │
│  • Set HTTP status code                                     │
│  • Send response to client                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          ERROR HANDLING (if error occurs)                   │
│  • Global error middleware catches error                    │
│  • Formats error response                                   │
│  • Sends error to client                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  HTTP RESPONSE                              │
│              (back to client)                               │
│                                                              │
│  JSON Format:                                              │
│  {                                                          │
│    "statusCode": 200,                                      │
│    "data": { ... },                                        │
│    "message": "Success message",                           │
│    "success": true                                         │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Module Internal Structure

```
modules/product/
│
├── product.routes.js
│   │
│   └──> GET    /             ──> product.controller.getProducts()
│       GET    /:id           ──> product.controller.getProductById()
│       POST   /              ──> product.controller.createProduct()
│       PUT    /:id           ──> product.controller.updateProduct()
│       DELETE /:id           ──> product.controller.deleteProduct()
│       PATCH  /:id/featured  ──> product.controller.toggleFeatured()
│       PATCH  /:id/stock     ──> product.controller.updateStock()
│
├── product.controller.js
│   │
│   ├──> getProducts()        ──> calls ──> product.service.getAllProducts()
│   ├──> getProductById()     ──> calls ──> product.service.getProductById()
│   ├──> createProduct()      ──> calls ──> product.service.createProduct()
│   ├──> updateProduct()      ──> calls ──> product.service.updateProductById()
│   ├──> deleteProduct()      ──> calls ──> product.service.deleteProductById()
│   ├──> toggleFeatured()     ──> calls ──> product.service.toggleFeaturedProduct()
│   └──> updateStock()        ──> calls ──> product.service.updateProductStock()
│
├── product.service.js
│   │
│   ├──> getAllProducts()             ──> queries ──> product.model
│   ├──> getProductById()             ──> queries ──> product.model
│   ├──> createProduct()              ──> creates ──> product.model
│   ├──> updateProductById()          ──> updates ──> product.model
│   ├──> deleteProductById()          ──> deletes ──> product.model
│   ├──> toggleFeaturedProduct()      ──> updates ──> product.model
│   └──> updateProductStock()         ──> updates ──> product.model
│
└── product.model.js
    │
    └──> Mongoose Schema
         ├── title
         ├── price
         ├── image
         ├── gallery
         ├── stock
         ├── featured
         ├── discountPercent
         └── ... etc
```

---

## 4. Module Dependencies

```
┌─────────────────────┐
│   Auth Module       │
│  (authentication)   │
└────────────┬────────┘
             │
             └─→ Used by all protected routes
                ├── Product
                ├── Category
                ├── Order
                ├── Media
                ├── Dashboard
                └── etc.

┌─────────────────────┐
│   Product Module    │
│  (products CRUD)    │
└────────────┬────────┘
             │
             └─→ Used by:
                ├── Order (when creating orders)
                ├── Cart (when adding items)
                ├── Search (search products)
                └── Dashboard (analytics)

┌─────────────────────┐
│   Category Module   │
│  (categories CRUD)  │
└────────────┬────────┘
             │
             └─→ Used by:
                ├── Product (filter by category)
                └── Search (filter by category)

┌─────────────────────┐
│   Order Module      │
│  (orders CRUD)      │
└────────────┬────────┘
             │
             └─→ Uses:
                ├── Product (for items)
                └── Checkout (for validation)

┌─────────────────────┐
│   Cart Module       │
│  (shopping cart)    │
└────────────┬────────┘
             │
             └─→ Uses:
                └── Product (get product details)

┌─────────────────────┐
│   Checkout Module   │
│  (checkout logic)   │
└────────────┬────────┘
             │
             └─→ Uses:
                └── Order (create order)

┌─────────────────────┐
│   Media Module      │
│  (image uploads)    │
└────────────┬────────┘
             │
             └─→ Used by:
                ├── Product (product images)
                ├── Category (category images)
                └── Dashboard (analytics images)

┌─────────────────────┐
│   Dashboard Module  │
│  (admin analytics)  │
└────────────┬────────┘
             │
             └─→ Reads from:
                ├── Product
                ├── Order
                ├── Category
                └── (all models)

┌─────────────────────┐
│   Search Module     │
│  (product search)   │
└────────────┬────────┘
             │
             └─→ Uses:
                ├── Product (search in products)
                └── Category (filter by category)
```

---

## 5. Middleware Flow

```
Request comes in
       │
       ▼
┌──────────────────────────────────────┐
│  Global Middleware (in server.js)    │
│  • morgan('dev')                     │
│  • cors({...})                       │
│  • express.json()                    │
│  • express.urlencoded()              │
└──────────────────────┬───────────────┘
                       │
                       ▼
┌──────────────────────────────────────┐
│      Route Matching                  │
│  Routes are tried in order           │
└──────────────────────┬───────────────┘
                       │
                       ▼
┌──────────────────────────────────────┐
│  Route-specific Middleware           │
│  (if defined in routes.js)           │
│                                      │
│  Example:                            │
│  router.post('/',                    │
│    protect,           ← middleware   │
│    upload.single(),   ← middleware   │
│    controller         ← handler      │
│  )                                   │
└──────────────────────┬───────────────┘
                       │
                       ▼
┌──────────────────────────────────────┐
│      Controller Handler              │
└──────────────────────┬───────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
    ▼                  ▼                  ▼
Success           Error/Exception    Async Error
    │                  │                  │
    └──────────────────┼──────────────────┘
                       │
                       ▼
┌──────────────────────────────────────┐
│    Error Handler Middleware          │
│    (catches all errors)              │
│                                      │
│    Handles:                          │
│    • Sync errors                     │
│    • Async errors (from asyncHandler)│
│    • Validation errors               │
│    • Database errors                 │
│    • JWT errors                      │
└──────────────────────┬───────────────┘
                       │
                       ▼
┌──────────────────────────────────────┐
│       Response to Client             │
│                                      │
│  Success:                            │
│  { statusCode, data, message, ... }  │
│                                      │
│  Error:                              │
│  { success: false, message: "..." }  │
└──────────────────────────────────────┘
```

---

## 6. Authentication Flow

```
┌────────────────────────────────────┐
│   Client (Frontend)                │
└────────────────┬───────────────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │  POST /api/auth/login│
      │  {email, password}   │
      └──────────┬───────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │  auth.controller.login()        │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │  auth.service.authenticateAdmin()
    │  • Find admin by email          │
    │  • Compare password (bcrypt)    │
    │  • Generate JWT token           │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │  Return token to client         │
    │  {                              │
    │    token: "jwt_token_here",     │
    │    admin: { id, email }         │
    │  }                              │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │  Client stores token in memory  │
    │  or localStorage                │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │  For protected routes, send:    │
    │  Authorization: Bearer <token>  │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │  auth.middleware.protect()      │
    │  • Extract token from header    │
    │  • Verify JWT signature         │
    │  • Find admin by ID             │
    │  • Attach admin to req          │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │  Controller can access          │
    │  req.admin (authenticated user) │
    └─────────────────────────────────┘
```

---

## 7. Data Flow for Product Creation

```
┌──────────────────────────────────────────────────────────────┐
│                  CLIENT REQUEST                              │
│  POST /api/products                                          │
│  Authorization: Bearer <token>                               │
│  {                                                           │
│    title: "Gold Ring",                                      │
│    price: 5000,                                             │
│    categorySlug: "rings",                                   │
│    stock: 10,                                               │
│    image: "url",                                            │
│    gallery: ["url1", "url2"]                               │
│  }                                                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              ROUTE HANDLER                                   │
│  product.routes.js                                           │
│  router.post('/', protect, createProduct)                    │
│                                                              │
│  • protect middleware validates token ✓                     │
│  • passes to createProduct controller                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              CONTROLLER                                      │
│  product.controller.createProduct(req, res)                  │
│  • Receives data in req.body                                │
│  • Calls service layer                                      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              SERVICE                                         │
│  product.service.createProduct(productData)                  │
│  • Validates all required fields ✓                          │
│  • Processes gallery array ✓                                │
│  • Converts categorySlug to lowercase ✓                      │
│  • Calls model to save                                      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              MODEL                                           │
│  Product.create({...})                                       │
│  • Validates against schema ✓                               │
│  • Pre-save hook computes discountedPrice ✓                 │
│  • Saves to MongoDB ✓                                       │
│  • Returns created document                                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              DATABASE                                        │
│  MongoDB - shree_collection.products                         │
│  Inserts: {                                                 │
│    _id: ObjectId(),                                         │
│    title: "Gold Ring",                                      │
│    price: 5000,                                             │
│    discountedPrice: 5000,                                   │
│    categorySlug: "rings",                                   │
│    stock: 10,                                               │
│    featured: false,                                         │
│    createdAt: Date,                                         │
│    updatedAt: Date,                                         │
│    ...                                                      │
│  }                                                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
              ← Returns created product
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              SERVICE                                         │
│  Returns product document                                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              CONTROLLER                                      │
│  Receives product from service                              │
│  Formats response using ApiResponse utility                 │
│  res.status(201).json(                                      │
│    new ApiResponse(201, product, "Product created...")     │
│  )                                                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              RESPONSE TO CLIENT                              │
│  HTTP 201 Created                                            │
│  {                                                           │
│    "statusCode": 201,                                       │
│    "data": {                                                │
│      "_id": "...",                                          │
│      "title": "Gold Ring",                                  │
│      "price": 5000,                                         │
│      "categorySlug": "rings",                               │
│      "stock": 10,                                           │
│      "createdAt": "2026-04-19T...",                        │
│      ...                                                    │
│    },                                                        │
│    "message": "Product created successfully",              │
│    "success": true                                          │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Error Handling Flow

```
Request comes in
       │
       ▼
Controller/Service/Model
       │
    ┌──┴──────────────────────────────────┐
    │                                     │
    ▼                                     ▼
 Success                              Error/Exception
    │                                     │
    │                              ┌──────▼──────────┐
    │                              │ asyncHandler()  │
    │                              │ catches error   │
    │                              └──────┬──────────┘
    │                                     │
    │                              ┌──────▼──────────────┐
    │                              │ Passes to next()    │
    │                              │ (error handler)     │
    │                              └──────┬──────────────┘
    │                                     │
    └──────────────────┬──────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Global Error Middleware     │
        │  errorHandler(err, req, res) │
        └────────┬─────────────────────┘
                 │
        ┌────────┴─────────────────┬──────────────┬──────────────┐
        │                          │              │              │
        ▼                          ▼              ▼              ▼
    Validation            Database Error    JWT Error      Generic Error
    Error                                                        │
        │                     │                  │              │
        ├─ CastError          ├─ Duplicate    ├─ Invalid    ├─ 500
        │  (invalid ID)       │  Key (11000)  │  Token      │  Internal
        │  → 400              │  → 400        │  → 401      │  Server
        │                     │               │             │  Error
        ├─ ValidationError    ├─ Connection  ├─ Token      │
        │  (missing field)    │  Error       │  Expired    │
        │  → 400              │  → 500       │  → 401      │
        │                     │               │             │
        └─────────┬───────────┴───────────────┴──────┬──────┘
                  │                                   │
                  └───────────────┬───────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │  Format Error Response      │
                    │  {                          │
                    │    success: false,          │
                    │    message: "Error msg"     │
                    │  }                          │
                    └──────────┬──────────────────┘
                               │
                               ▼
                    ┌─────────────────────────────┐
                    │  Send to Client             │
                    │  HTTP {statusCode}          │
                    └─────────────────────────────┘
```

---

These diagrams provide a visual reference for understanding:
- Project structure
- Request/response flow
- Module organization
- Authentication process
- Error handling
- Data flow for complex operations

**Refer to these diagrams when understanding how the system works!**
