import express       from 'express';
import dotenv        from 'dotenv';
import cors          from 'cors';
import morgan        from 'morgan';
import { connectDB } from './config/db.js';
import errorHandler  from './middlewares/errorHandler.js';
import notFound      from './middlewares/notFound.js';

// ── Route Imports ─────────────────────────────────────────────────────────────
import authRoutes      from './modules/auth/auth.routes.js';
import categoryRoutes  from './modules/category/category.routes.js';
import productRoutes   from './modules/product/product.routes.js';
import orderRoutes     from './modules/order/order.routes.js';
import mediaRoutes     from './modules/media/media.routes.js';
import cartRoutes      from './modules/cart/cart.routes.js';
import checkoutRoutes  from './modules/checkout/checkout.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import searchRoutes    from './modules/search/search.routes.js';
import customerRoutes  from './modules/customer/customer.routes.js';

// ── Sequelize Model Associations ──────────────────────────────────────────────
// Must be imported before connectDB() so all associations are registered
// before sequelize.sync() runs and creates foreign key columns
import './models/associations.js';

// ── Bootstrap ─────────────────────────────────────────────────────────────────
dotenv.config();
connectDB();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://shreecollection.co.in',
  'https://www.shreecollection.co.in',
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`❌ CORS blocked origin: ${origin}`);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  optionsSuccessStatus: 204,
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// ── General Middleware ────────────────────────────────────────────────────────
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Shree Collection API is running ✅',
    env:     process.env.NODE_ENV,
    db:      'PostgreSQL (Railway)',
    storage: 'Railway Object Storage',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/media',      mediaRoutes);
app.use('/api/cart',       cartRoutes);
app.use('/api/checkout',   checkoutRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/search',     searchRoutes);
app.use('/api/customers',  customerRoutes);

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});