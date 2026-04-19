import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title:     { type: String, required: true },
    material:  { type: String, default: '' },
    image:     { type: String, default: '' },
    price:     { type: Number, required: true },  // price actually paid (after discount)
    originalPrice: { type: Number, default: 0 },  // original price before discount
    qty:       { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, lowercase: true, trim: true },
    phone:   { type: String, required: true, trim: true },
    address: {
      line1:   { type: String, required: true },
      line2:   { type: String, default: '' },
      city:    { type: String, required: true },
      state:   { type: String, required: true },
      pincode: { type: String, required: true },
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Link to customer account if they were logged in — optional
    // Guest orders will have no customerId
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Customer',
      default: null,
    },

    items:    { type: [orderItemSchema], required: true,
                validate: { validator: arr => arr.length > 0, message: 'Order must have at least one item' } },
    customer: { type: customerSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    total:    { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },

    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
    },
    cashfreeOrderId:          { type: String, default: '' },
    cashfreePaymentId:        { type: String, default: '' },
    cashfreePaymentSessionId: { type: String, default: '' },
    trackingNumber:           { type: String, default: '' },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ customerId: 1 });

export default mongoose.model('Order', orderSchema);