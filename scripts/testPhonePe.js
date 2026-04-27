/**
 * PhonePe Payment Integration - Test Cases & Examples
 * 
 * This file provides testing examples and use cases for the PhonePe integration.
 * Run with: node scripts/testPhonePe.js
 */

import axios from 'axios';

const API_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

// Test data
const testGuestCheckout = {
  items: [
    {
      productId: 'prod_123',
      quantity: 1,
      price: 5000,
    },
  ],
  guestEmail: 'test@example.com',
  guestPhone: '9876543210',
  guestName: 'Test User',
  guestAddress: {
    line1: '123 Test Street',
    line2: 'Apt 4B',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India',
  },
};

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('  PhonePe Payment Gateway - Test Suite');
console.log('═══════════════════════════════════════════════════════════════════════');
console.log('');

// Test 1: Initiate Payment
console.log('TEST 1: Initiate PhonePe Payment');
console.log('─────────────────────────────────────────────────────────────────────');
console.log('Endpoint: POST /payment/phonepe/initiate');
console.log('');
console.log('Request Body:');
console.log(JSON.stringify(testGuestCheckout, null, 2));
console.log('');
console.log('Expected Response:');
console.log(`{
  "success": true,
  "data": {
    "merchantTransactionId": "ORD-1713012234567-abc123def",
    "redirectUrl": "https://api-test.phonepe.com/pg/pay/...",
    "validatedItems": [
      {
        "product": "prod_123",
        "title": "Diamond Ring",
        "material": "18K Gold",
        "price": 5000,
        "quantity": 1,
        "image": "https://..."
      }
    ],
    "subtotal": 5000,
    "shippingCost": 0,
    "total": 5000
  }
}`);
console.log('');
console.log('cURL Command:');
console.log(`curl -X POST ${API_URL}/payment/phonepe/initiate \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(testGuestCheckout)}'`);
console.log('');

// Test 2: Confirm Payment
console.log('TEST 2: Confirm PhonePe Payment');
console.log('─────────────────────────────────────────────────────────────────────');
console.log('Endpoint: POST /payment/phonepe/confirm');
console.log('');

const confirmPayment = {
  merchantTransactionId: 'ORD-1713012234567-abc123def',
  transactionId: 'TXN-123456789',
  ...testGuestCheckout,
  subtotal: 5000,
  shippingCost: 0,
  total: 5000,
};

console.log('Request Body:');
console.log(JSON.stringify(confirmPayment, null, 2));
console.log('');
console.log('Expected Response:');
console.log(`{
  "success": true,
  "message": "Order placed successfully",
  "order": {
    "_id": "order_id_123",
    "orderNumber": "#ORD-001",
    "email": "test@example.com",
    "phone": "9876543210",
    "firstName": "Test",
    "lastName": "User",
    "isGuestOrder": true,
    "shippingAddress": {
      "firstName": "Test",
      "lastName": "User",
      "addressLine1": "123 Test Street",
      "addressLine2": "Apt 4B",
      "city": "Mumbai",
      "postalCode": "400001",
      "country": "India"
    },
    "items": [...],
    "subtotal": 5000,
    "shippingCost": 0,
    "total": 5000,
    "paymentStatus": "paid",
    "paymentMethod": "phonepe",
    "paymentReference": "TXN-123456789",
    "merchantTransactionId": "ORD-1713012234567-abc123def",
    "status": "pending",
    "createdAt": "2026-04-27T10:30:00.000Z"
  }
}`);
console.log('');
console.log('cURL Command:');
console.log(`curl -X POST ${API_URL}/payment/phonepe/confirm \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(confirmPayment)}'`);
console.log('');

// Test 3: Check Payment Status
console.log('TEST 3: Check Payment Status');
console.log('─────────────────────────────────────────────────────────────────────');
console.log('Endpoint: GET /payment/phonepe/status/:merchantTransactionId');
console.log('');
console.log('URL: ' + API_URL + '/payment/phonepe/status/ORD-1713012234567-abc123def');
console.log('');
console.log('Expected Response:');
console.log(`{
  "success": true,
  "status": {
    "success": true,
    "code": "PAYMENT_SUCCESS",
    "message": "Payment successful",
    "data": {
      "transactionId": "TXN-123456789",
      "merchantTransactionId": "ORD-1713012234567-abc123def",
      "amount": 500000,
      "paymentState": "COMPLETED",
      "responseCode": "SUCCESS"
    }
  }
}`);
console.log('');
console.log('cURL Command:');
console.log(`curl -X GET "${API_URL}/payment/phonepe/status/ORD-1713012234567-abc123def"`);
console.log('');

// Test 4: PhonePe Callback Webhook
console.log('TEST 4: PhonePe Callback Webhook');
console.log('─────────────────────────────────────────────────────────────────────');
console.log('Endpoint: POST /payment/phonepe/callback');
console.log('Headers: X-Verify (HMAC SHA-256 signature)');
console.log('');
console.log('Request Body:');
const webhookPayload = {
  transactionId: 'TXN-123456789',
  merchantTransactionId: 'ORD-1713012234567-abc123def',
  status: 'SUCCESS',
};
console.log(JSON.stringify(webhookPayload, null, 2));
console.log('');
console.log('Expected Response:');
console.log(`{
  "success": true,
  "message": "Callback processed"
}`);
console.log('');

// Test 5: Guest Order Admin View
console.log('TEST 5: Admin Viewing Guest Order');
console.log('─────────────────────────────────────────────────────────────────────');
console.log('Endpoint: GET /orders/:orderId (Admin Auth Required)');
console.log('');
console.log('Guest Order Data Fields:');
console.log(`
  isGuestOrder: true                 // Flag identifying guest order
  phone: "9876543210"                // Guest phone number
  firstName: "Test"                  // Guest first name
  lastName: "User"                   // Guest last name
  email: "test@example.com"          // Guest email (unique per order)
  paymentMethod: "phonepe"           // Payment gateway used
  paymentReference: "TXN-123456789"  // Transaction ID
  merchantTransactionId: "..."       // PhonePe order ID
  paymentStatus: "paid"              // Payment status
  status: "pending"                  // Order status (pending→shipped→delivered)
`);
console.log('');

// Test 6: Search Guest Orders
console.log('TEST 6: Admin Searching Guest Orders');
console.log('─────────────────────────────────────────────────────────────────────');
console.log('Search by Email:');
console.log(`GET /orders?email=test@example.com`);
console.log('');
console.log('Search by Phone:');
console.log(`GET /orders?phone=9876543210`);
console.log('');
console.log('Search by Payment Method:');
console.log(`GET /orders?paymentMethod=phonepe`);
console.log('');

// Test 7: Email Confirmation
console.log('TEST 7: Order Confirmation Email');
console.log('─────────────────────────────────────────────────────────────────────');
console.log('Email is automatically sent to: test@example.com');
console.log('');
console.log('Email includes:');
console.log(`
  ✓ Order number (#ORD-001)
  ✓ Item details (title, quantity, price)
  ✓ Total amount paid
  ✓ Shipping information
  ✓ Return policy (30 days)
  ✓ Customer support contact
`);
console.log('');

// Error Cases
console.log('TEST 8: Error Cases');
console.log('─────────────────────────────────────────────────────────────────────');
console.log('');
console.log('Error 1: Empty Cart');
console.log('Request: { items: [], guestEmail: "...", ... }');
console.log('Response: { success: false, message: "Cart is empty" }');
console.log('');

console.log('Error 2: Missing Guest Details');
console.log('Request: { items: [...] } (missing email, phone, name)');
console.log('Response: { success: false, message: "Guest email, phone, and name are required" }');
console.log('');

console.log('Error 3: Invalid Email');
console.log('Request: { guestEmail: "invalid-email" }');
console.log('Response: { success: false, message: "Please enter a valid email address" }');
console.log('');

console.log('Error 4: Product Out of Stock');
console.log('Request: { items: [{ productId: "out-of-stock-id" }] }');
console.log('Response: { success: false, message: "\\"Product Title\\" is currently out of stock" }');
console.log('');

console.log('Error 5: Price Tampering');
console.log('Request: { items: [{ productId: "prod_123", price: 100 }] }');
console.log('Request: (actual price in DB is 5000)');
console.log('Response: { success: false, message: "Price mismatch for \\"Product\\". Please refresh and try again." }');
console.log('');

// Frontend Integration Example
console.log('TEST 9: Frontend Integration Example');
console.log('─────────────────────────────────────────────────────────────────────');
console.log('');
console.log(`import { initiatePhonePePayment } from '../api/client';

// Step 1: Start Payment
const paymentData = {
  items: cart.map(item => ({
    productId: item._id,
    quantity: item.qty,
    price: item.price,
  })),
  guestEmail: 'customer@example.com',
  guestPhone: '9876543210',
  guestName: 'John Doe',
  guestAddress: {
    line1: '123 Main St',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  },
};

try {
  const response = await initiatePhonePePayment(paymentData);
  if (response.data.success) {
    // Redirect to PhonePe payment page
    window.location.href = response.data.data.redirectUrl;
  }
} catch (error) {
  console.error('Payment initiation failed:', error);
}

// Step 2: Handle payment success callback
// PhonePe redirects back to /checkout/guest?status=success&merchantTransactionId=...
// Frontend verifies and confirms payment
`);
console.log('');

// Security Notes
console.log('TEST 10: Security Features');
console.log('─────────────────────────────────────────────────────────────────────');
console.log('');
console.log('✓ Server-side price validation (prevents tampering)');
console.log('✓ HMAC SHA-256 signature verification');
console.log('✓ Cart item existence and stock verification');
console.log('✓ Guest details captured without storing payment details');
console.log('✓ Email confirmation sent for audit trail');
console.log('✓ All transactions logged in database');
console.log('');

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('  To run actual API tests, use curl or Postman');
console.log('  Documentation: PHONEPE_INTEGRATION_GUIDE.md');
console.log('═══════════════════════════════════════════════════════════════════════');
