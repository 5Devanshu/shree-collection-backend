import mongoose from 'mongoose';

// Sub-schema: a single item inside the cart
// Maps to Checkout.jsx Order Summary panel —
// summary-item-image, summary-item-details (title, material, price)
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    // Snapshot fields — stored so cart remains intact even if product changes
    title:    { type: String, required: true },
    material: { type: String, default: '' },
    price:    { type: Number, required: true },
    image:    { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    // Session ID — used for guest carts (no login required on Shree storefront)
    // Maps to Navbar.jsx Cart (0) — cart is session-linked, not user-linked
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Cart items — maps to Checkout.jsx summary-items list
    items: {
      type: [cartItemSchema],
      default: [],
    },

    // Computed totals — maps to Checkout.jsx summary-totals section
    subtotal:     { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },  // always 0 — Complimentary
    total:        { type: Number, default: 0 },

    // TTL — cart auto-expires after 7 days of inactivity
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// MongoDB TTL index — auto-deletes expired carts
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Recalculate subtotal and total before every save
cartSchema.pre('save', function (next) {
  this.subtotal     = this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  this.shippingCost = 0;                         // Complimentary Express Shipping
  this.total        = this.subtotal + this.shippingCost;

  // Refresh expiry on each cart activity
  this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  next();
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;