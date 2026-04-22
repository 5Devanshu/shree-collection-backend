import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      trim: true,
      uppercase: true,          // store as UPPERCASE always
    },
    description: { 
      type: String, 
      trim: true, 
      default: '' 
    },
    type: {
      type: String,
      enum: ['percentage', 'flat'],
      required: [true, 'Discount type is required'],
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: 0,
    },
    minOrderValue: { 
      type: Number, 
      default: 0 
    },
    maxUses: { 
      type: Number, 
      default: null 
    },   // null = unlimited
    usedCount: { 
      type: Number, 
      default: 0 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    expiresAt: { 
      type: Date, 
      default: null 
    },     // null = never expires
  },
  { timestamps: true }
);

// Indexes for common queries
discountSchema.index({ code: 1 });
discountSchema.index({ isActive: 1 });
discountSchema.index({ expiresAt: 1 });

const Discount = mongoose.model('Discount', discountSchema);
export default Discount;
