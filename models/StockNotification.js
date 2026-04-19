const mongoose = require('mongoose');

const stockNotificationSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Product',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    // Optional — if the customer was logged in when they subscribed
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Customer',
      default: null,
    },
    notified: {
      type: Boolean,
      default: false,
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One email per product — prevent duplicate subscriptions
stockNotificationSchema.index({ productId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('StockNotification', stockNotificationSchema);