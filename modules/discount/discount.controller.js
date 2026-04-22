import * as service from './discount.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

// Get all discounts — used by AdminDiscounts page
export const getAllDiscounts = asyncHandler(async (req, res) => {
  const discounts = await service.getAllDiscountsService();
  res.json({ 
    success: true, 
    data: discounts,
    discounts, // Keep both for backward compatibility
  });
});

// Create a new discount — used by AdminDiscounts "+ Add Coupon"
export const createDiscount = asyncHandler(async (req, res) => {
  const discount = await service.createDiscountService(req.body);
  res.status(201).json({ 
    success: true, 
    data: discount,
    discount, // Keep both for backward compatibility
  });
});

// Update a discount — used by AdminDiscounts "Edit"
export const updateDiscount = asyncHandler(async (req, res) => {
  const discount = await service.updateDiscountService(req.params.id, req.body);
  res.json({ 
    success: true, 
    data: discount,
    discount, // Keep both for backward compatibility
  });
});

// Delete a discount — used by AdminDiscounts
export const deleteDiscount = asyncHandler(async (req, res) => {
  await service.deleteDiscountService(req.params.id);
  res.json({ 
    success: true, 
    message: 'Discount deleted successfully' 
  });
});

// Validate coupon code — used by checkout
export const validateCode = asyncHandler(async (req, res) => {
  const { code, orderTotal } = req.body;
  if (!code || !orderTotal) {
    return res.status(400).json({ 
      success: false, 
      message: 'Coupon code and order total are required' 
    });
  }
  
  const result = await service.validateDiscountCodeService(code, orderTotal);
  res.json({ 
    success: true, 
    ...result 
  });
});

// Apply coupon — increments usage count
export const applyDiscount = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ 
      success: false, 
      message: 'Coupon code is required' 
    });
  }
  
  const discount = await service.incrementDiscountUsageService(code);
  res.json({ 
    success: true, 
    data: discount 
  });
});
