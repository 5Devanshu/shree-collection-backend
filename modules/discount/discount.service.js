import Discount from './discount.model.js';

// Get all discounts — used by AdminDiscounts page
export const getAllDiscountsService = async () => {
  return Discount.find().sort({ createdAt: -1 });
};

// Create a new discount/coupon — used by AdminDiscounts "+ Add Coupon"
export const createDiscountService = async (data) => {
  if (!data.code || !data.code.trim()) {
    throw new Error('Coupon code is required');
  }
  
  // Ensure code is uppercase before saving
  data.code = data.code.trim().toUpperCase();
  
  const existing = await Discount.findOne({ code: data.code });
  if (existing) throw new Error(`Coupon code "${data.code}" already exists`);
  
  return Discount.create(data);
};

// Update a discount — used by AdminDiscounts "Edit"
export const updateDiscountService = async (id, data) => {
  if (data.code) {
    data.code = data.code.trim().toUpperCase();
  }
  
  const discount = await Discount.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!discount) throw new Error('Discount not found');
  return discount;
};

// Delete a discount — used by AdminDiscounts
export const deleteDiscountService = async (id) => {
  const discount = await Discount.findByIdAndDelete(id);
  if (!discount) throw new Error('Discount not found');
  return { message: 'Discount deleted successfully' };
};

// Used by checkout — validate and apply a coupon code
export const validateDiscountCodeService = async (code, orderTotal) => {
  const discount = await Discount.findOne({
    code: code.trim().toUpperCase(),
    isActive: true,
  });

  if (!discount) throw new Error('Invalid or expired coupon code');
  
  if (discount.expiresAt && discount.expiresAt < new Date()) {
    throw new Error('This coupon has expired');
  }
  
  if (discount.maxUses && discount.usedCount >= discount.maxUses) {
    throw new Error('This coupon has reached its usage limit');
  }
  
  if (orderTotal < discount.minOrderValue) {
    throw new Error(`Minimum order value ₹${discount.minOrderValue} required for this coupon`);
  }

  // Calculate discount saving amount
  const saving = discount.type === 'percentage'
    ? (orderTotal * discount.value) / 100
    : discount.value;

  return { 
    discount, 
    saving: Math.min(saving, orderTotal),
    finalPrice: Math.max(0, orderTotal - Math.min(saving, orderTotal)),
  };
};

// Increment usage count when coupon is used
export const incrementDiscountUsageService = async (code) => {
  const discount = await Discount.findOneAndUpdate(
    { code: code.trim().toUpperCase() },
    { $inc: { usedCount: 1 } },
    { new: true }
  );
  if (!discount) throw new Error('Discount not found');
  return discount;
};
