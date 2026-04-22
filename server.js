import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import categoryRoutes from './modules/category/category.routes.js';
import productRoutes from './modules/product/product.routes.js';
import orderRoutes from './modules/order/order.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import checkoutRoutes from './modules/checkout/checkout.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import customerRoutes from './modules/customer/customer.routes.js';
import policiesRoutes from './modules/policies/routes.js';
import discountRoutes from './modules/discount/discount.routes.js';

// Load models
import './modules/auth/auth.model.js';
import './modules/category/category.model.js';
import './modules/product/product.model.js';
import './modules/order/order.model.js';
import './modules/discount/discount.model.js';
import './models/Customer.js';

dotenv.config();

connectDB();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(morgan('dev'));

// CORS configuration to support multiple origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://shreecollection.co.in',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Shree Collection API is running' });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/policies', policiesRoutes);
app.use('/api/discounts', discountRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use(notFound);

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});