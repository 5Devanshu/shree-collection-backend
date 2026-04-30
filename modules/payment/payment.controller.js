import * as paymentService from './payment.service.js';

/**
 * POST /api/payment/phonepe/initiate
 * Initiates PhonePe payment order
 * Accepts guest customer details without requiring login
 */
export const initiatePhonePeCheckout = async (req, res) => {
  try {
    const {
      items,
      guestEmail,
      guestPhone,
      guestName,
      guestAddress,
    } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    if (!guestEmail || !guestPhone || !guestName) {
      return res.status(400).json({
        success: false,
        message: 'Guest email, phone, and name are required',
      });
    }

    if (!guestAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required',
      });
    }

    // Validate and prepare order
    const result = await paymentService.initiatePhonePePaymentService({
      items,
      guestEmail,
      guestPhone,
      guestName,
      guestAddress,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('PhonePe Checkout Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to initiate payment',
    });
  }
};

/**
 * POST /api/payment/phonepe/confirm
 * Confirms PhonePe payment and creates order
 * Called after successful payment
 */
export const confirmPhonePeCheckout = async (req, res) => {
  try {
    const {
      merchantTransactionId,
      transactionId,
      guestEmail,
      guestPhone,
      guestName,
      guestAddress,
      items,
      subtotal,
      shippingCost,
      total,
    } = req.body;

    // Verify payment status with PhonePe
    const verified = await paymentService.verifyPhonePePaymentService(
      merchantTransactionId
    );

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    // Create order in database
    const order = await paymentService.createGuestOrderService({
      merchantTransactionId,
      transactionId,
      guestEmail,
      guestPhone,
      guestName,
      guestAddress,
      items,
      subtotal,
      shippingCost,
      total,
      paymentMethod: 'phonepe',
    });

    // Send confirmation email
  await paymentService.sendOrderConfirmationEmailService({
  guestEmail,
  guestName,
  orderNumber: order.orderNumber,
  total,
  subtotal,     // ← add
  shippingCost, // ← add
  items,
});

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    console.error('PhonePe Confirmation Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to confirm payment',
    });
  }
};

/**
 * POST /api/payment/phonepe/callback
 * Webhook endpoint for PhonePe payment callbacks
 * Handles success/failure notifications from PhonePe
 */
export const handlePhonePeCallback = async (req, res) => {
  try {
    const { transactionId, merchantTransactionId, status } = req.body;

    console.log('PhonePe Callback Received:', {
      transactionId,
      merchantTransactionId,
      status,
    });

    // Process callback based on status
    if (status === 'SUCCESS') {
      // Payment successful - order should already be created in confirm endpoint
      console.log('Payment confirmed:', merchantTransactionId);
    } else if (status === 'FAILED') {
      // Payment failed - mark as failed
      await paymentService.markPaymentAsFailedService(merchantTransactionId);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Callback processed',
    });
  } catch (error) {
    console.error('PhonePe Callback Error:', error);
    res.status(200).json({
      success: true,
      message: 'Callback received',
    });
  }
};

/**
 * GET /api/payment/phonepe/status/:merchantTransactionId
 * Check payment status for an order
 */
export const checkPhonePeStatus = async (req, res) => {
  try {
    const { merchantTransactionId } = req.params;

    const status = await paymentService.checkPhonePeStatusService(
      merchantTransactionId
    );

    res.status(200).json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('PhonePe Status Check Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to check payment status',
    });
  }
};
