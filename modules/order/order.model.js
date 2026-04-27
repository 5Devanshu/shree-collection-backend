import mongoose from 'mongoose';

// Sub-schema: each item in the order
// Maps to Checkout.jsx Order Summary — product image, name, material, price
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    title: { type: String, required: true },   // snapshot at time of purchase
    material: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    image: { type: String },
  },
  { _id: false }
);

// Sub-schema: shipping address
// Maps to Checkout.jsx Shipping Address section fields
const shippingAddressSchema = new mongoose.Schema(
  {
    firstName:  { type: String, required: true },
    lastName:   { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: '' },
    city:       { type: String, required: true },
    postalCode: { type: String, required: true },
    country:    { type: String, default: 'India' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Human-readable Order ID — e.g. #ORD-001
    // Shown in AdminOrders and AdminDashboard tables
    orderNumber: {
      type: String,
      unique: true,
    },

    // Contact Information — Checkout.jsx form field or guest checkout
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true,
    },

    // Guest checkout fields — captures important details without login
    phone: {
      type: String,
      default: null,
    },
    firstName: {
      type: String,
      default: null,
    },
    lastName: {
      type: String,
      default: null,
    },
    isGuestOrder: {
      type: Boolean,
      default: false,
    },

    // Shipping Address — Checkout.jsx Shipping section
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    // Order Summary — Checkout.jsx right panel items
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(v) => v.length > 0, 'Order must contain at least one item'],
    },

    // Pricing — Checkout.jsx summary totals (Subtotal, Shipping, Total)
    subtotal:      { type: Number, required: true },
    shippingCost:  { type: Number, default: 0 },   // Complimentary for Shree
    total:         { type: Number, required: true },

    // Status — drives AdminOrders status badges: Pending / Confirmed / Shipped / Delivered / Cancelled
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },

    // Payment — Checkout.jsx Payment section
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'failed'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'phonepe', 'razorpay', 'cashfree', 'demo'],
      default: 'phonepe',
    },
    paymentReference: {
      type: String,   // payment gateway transaction ID
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },

    // PhonePe specific fields
    merchantTransactionId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-generate human-readable Order Number before first save
// e.g. #ORD-001, #ORD-002 — as shown in AdminOrders table
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `#ORD-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;