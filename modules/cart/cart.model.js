import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

// Cart table — session-based guest cart
// sessionId from x-session-id header links the cart to the browser session
const Cart = sequelize.define(
  'Cart',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Session ID — guest cart, no login required
    // Matches Navbar.jsx Cart (0) counter and Checkout.jsx Order Summary panel
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    // Cart items snapshot — [{ productId, title, material, price, image, quantity }]
    // Stored as JSONB — no separate join table needed
    items: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },

    // Computed totals — maps to Checkout.jsx summary-totals section
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    shippingCost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0, // always 0 — Complimentary Express Shipping
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    // TTL — cart expires after 7 days of inactivity
    expiresAt: {
      type: DataTypes.DATE,
      defaultValue: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  {
    tableName: 'carts',
    timestamps: true,
    indexes: [
      { fields: ['sessionId'] },
      { fields: ['expiresAt'] },
    ],
  }
);

// Helper: recalculate totals from items array
// Called in cart.service.js before every save
Cart.recalculate = (cart) => {
  const items = cart.items || [];
  const subtotal    = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  cart.subtotal     = Math.round(subtotal * 100) / 100;
  cart.shippingCost = 0;
  cart.total        = cart.subtotal;
  cart.expiresAt    = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
};

export default Cart;