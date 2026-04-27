# 🧪 Payment Gateway Integration - Quick Testing Guide

## ✅ Before Testing

### 1. Verify Backend is Running
```bash
cd /Users/devanshu/Desktop/sc_backend
npm start

# You should see:
# Server running on port 5000
# Connected to MongoDB
```

### 2. Verify Frontend is Running
```bash
cd /Users/devanshu/Desktop/shree-collection/shree-collection
npm run dev

# You should see:
# VITE v5.x.x ready in 500ms
# ➜ Local: http://localhost:5173/
```

### 3. Verify Environment Variables
**Backend (.env):**
```bash
cd /Users/devanshu/Desktop/sc_backend
grep "PHONEPE_" .env
grep "FRONTEND_URL" .env
```

**Frontend (.env):**
```bash
cd /Users/devanshu/Desktop/shree-collection/shree-collection
grep "VITE_API_URL" .env
```

---

## 🧪 Test Case 1: Successful Payment Flow

### Step 1: Add Products to Cart
```
1. Go to http://localhost:5173/
2. Browse to Collections → Diamond/Pearl/Emerald
3. Click "Add to Cart" on any product
4. Do this for 2-3 products
5. Verify cart count in header (should show number)
```

### Step 2: Start Checkout
```
1. Click "Cart" or "Checkout" button
2. You should see checkout page with:
   - Order Summary (right side)
   - Checkout Form (left side)
3. Verify total amount and shipping cost displayed
```

### Step 3: Fill Checkout Form
```
Choose one:

Option A - Guest Checkout:
  1. Click "Checkout as Guest" button
  2. Email: devanshudandekar5@gmail.com
  3. Name: Devanshu Dandekar
  4. Phone: 9594193572
  5. Address Line 1: B/401, Brijwasi Apartments, Malad East
  6. City: Mumbai
  7. State: Maharashtra
  8. Pincode: 400097

Option B - Account Checkout (if logged in):
  1. Click "Switch to Account" button
  2. Form auto-fills from your profile
  3. Verify email, phone, address
```

### Step 4: Place Order
```
1. Review Order Summary (total, shipping, items)
2. Click "Place Order" button
3. Button should show "Processing..." state
4. Wait for backend to create order (3-5 seconds)
```

### Step 5: ⭐ Verify Payment Redirect (NEW!)
```
Expected behavior:
  ✅ After order creation, you should be REDIRECTED to PhonePe payment page
  ✅ URL should change to hold-payments-test.phonepe.com
  ✅ PhonePe payment form should appear

If NOT redirected:
  ❌ Check browser console (F12 → Console tab)
  ❌ Look for JavaScript errors
  ❌ Check Network tab for failed requests
  ❌ See troubleshooting section below
```

### Step 6: Complete Payment on PhonePe
```
1. On PhonePe payment page:
   - Amount should show total (₹480 in example)
   - Order ID should show (#ORD-003 in example)
   - Customer email/phone should match

2. Enter payment details:
   - Use PhonePe test account credentials
   - Or select any test payment method

3. Click "Pay Now"

4. Choose success or failure:
   - For success: Click checkmark ✓
   - For failure: Click X ✕
```

### Step 7: Verify Payment Success Page
```
After PhonePe processes:
  ✅ You should be redirected to /payment/success?orderId=...
  ✅ Page should show "Payment Successful!" with ✓ icon
  ✅ Order ID displayed: #ORD-003
  ✅ Amount paid: ₹480
  ✅ Status: confirmed (green)
  ✅ "Continue Shopping" button available
```

### Step 8: Verify Admin Dashboard
```
1. Go to http://localhost:5173/admin
2. Login with admin credentials
3. Go to Orders section
4. Look for order #ORD-003
5. Verify:
   ✅ Order visible in list
   ✅ Status: "confirmed" (green badge)
   ✅ Payment: "paid" (green indicator)
   ✅ Amount: ₹480
   ✅ Guest: "Yes" or "No" (based on checkout type)
```

### Step 9: Verify Confirmation Email
```
1. Check inbox for devanshudandekar5@gmail.com
2. Should have email with:
   ✅ Subject: "Order Confirmation - #ORD-003"
   ✅ Order details (items, total, delivery address)
   ✅ Order number
   ✅ Estimated delivery date
   ✅ Support contact
```

### Step 10: Verify Database
```
1. Connect to MongoDB
2. Find order:
   db.orders.findOne({ orderNumber: "#ORD-003" })

3. Verify fields:
{
  _id: ObjectId("..."),
  orderNumber: "#ORD-003",
  email: "devanshudandekar5@gmail.com",
  status: "confirmed",          ← Should be "confirmed" (not "pending")
  paymentStatus: "paid",        ← Should be "paid" (not "unpaid")
  paidAt: ISODate("2025-04-28T10:30:00Z"),  ← Should have timestamp
  paymentMethod: "phonepe",
  paymentReference: "PPHX...",  ← PhonePe transaction ID
  isGuestOrder: true/false,
  items: [...],
  total: 480,
  ...
}
```

---

## 🧪 Test Case 2: Payment Failure Scenario

### Step 1-5: Same as Above
```
Follow steps 1-5 from Test Case 1
```

### Step 6: Simulate Payment Failure
```
On PhonePe payment page:
1. Click X (Cancel/Failure button)
2. Payment fails intentionally
```

### Step 7: Verify Failure Page
```
After PhonePe redirects:
  ✅ Should show "Payment Failed" message with ✕ icon
  ✅ Order ID should still be displayed
  ✅ "Return to Checkout" button should be available
```

### Step 8: Verify Order Status Unchanged
```
In admin dashboard:
  ✅ Order still visible (#ORD-003)
  ✅ Status: "pending" (red/gray badge)
  ✅ Payment: "unpaid" (red/gray indicator)
  ✅ Order can still be retried for payment
```

### Step 9: Verify No Email Sent
```
Check email inbox:
  ✅ NO confirmation email should be sent for failed payment
  ✅ Order is not considered confirmed
```

---

## 🧪 Test Case 3: Payment Pending Scenario

### Step 1-5: Same as Above
```
Follow steps 1-5 from Test Case 1
```

### Step 6: Simulate Payment Pending
```
On PhonePe payment page:
1. Let payment processing take time (>10 seconds)
2. Or click "Pending" option if available
```

### Step 7: Verify Pending Page
```
After PhonePe redirects:
  ✅ Should show "Payment Pending" message with ⏳ icon
  ✅ Text: "Payment is being processed"
  ✅ "Check Status Again" button available
```

### Step 8: Auto-Refresh and Verify
```
1. Click "Check Status Again"
2. Page should refresh and verify payment
3. Eventually should show either:
   - Success (if payment confirmed)
   - Failure (if payment rejected)
   - Still Pending (if still processing)
```

---

## 🔍 Debugging Checklist

### Payment Not Redirecting?

**Check 1: Backend Endpoint**
```bash
curl -X POST http://localhost:5000/api/orders/test123/payment/initiate \
  -H "Content-Type: application/json"

# If 404: Endpoint not registered
# If 500: Error in payment initiation
# If 200: Endpoint works, check response
```

**Check 2: Browser Console (F12)**
```
Errors to look for:
❌ "Cannot read property 'paymentUrl' of undefined"
   → Response format issue
❌ "TypeError: fetch is not a function"
   → Browser compatibility issue
❌ "CORS error"
   → Backend CORS not configured
❌ "net::ERR_NAME_NOT_RESOLVED"
   → API URL not found (check VITE_API_URL)
```

**Check 3: Network Tab (F12)**
```
1. Open DevTools → Network tab
2. Place order
3. Look for request to: /api/orders/*/payment/initiate
4. Check response:
   - Status 200: Success (check response body)
   - Status 404: Endpoint not found
   - Status 500: Server error
```

**Check 4: Response Format**
```
Expected response:
{
  "success": true,
  "data": {
    "orderId": "#ORD-003",
    "paymentUrl": "https://hold-payments-test.phonepe.com/...",
    "transactionId": "PPHX123456"
  }
}

If different: Check order.controller.js initiatePayment function
```

### Emails Not Sending?

**Check 1: Email Configuration**
```bash
cd /Users/devanshu/Desktop/sc_backend
grep "EMAIL_USER\|EMAIL_PASS" .env
```

**Check 2: Email Service**
```bash
# In backend logs, look for:
[email] Sending confirmation to devanshudandekar5@gmail.com
[email] ✓ Email sent successfully
```

**Check 3: Spam Folder**
```
Check Gmail spam/promotions folder
Emails might be filtered there
```

### Admin Dashboard Issues?

**Check 1: Admin Login**
```
1. Go to /admin
2. If redirected to /login:
   - Login credentials might be wrong
   - Admin token not valid
   - Session expired
```

**Check 2: Orders Not Visible**
```
1. Check MongoDB:
   db.orders.countDocuments()
   # Should return number > 0

2. Check admin permission:
   db.admins.findOne({})
   # Verify admin account exists
```

---

## 📊 Testing Report Template

Use this to document your test results:

```markdown
## Payment Gateway Integration Test Report

**Date:** 2025-04-28
**Tester:** [Your Name]
**Environment:** Local / Staging / Production

### Test Case 1: Successful Payment
- [ ] Order created successfully
- [ ] Redirected to PhonePe payment page
- [ ] PhonePe payment processed
- [ ] Redirected to success page
- [ ] Order status: "confirmed"
- [ ] Payment status: "paid"
- [ ] Confirmation email received
- [ ] Admin dashboard shows order

**Status:** ✅ PASS / ❌ FAIL

### Test Case 2: Payment Failure
- [ ] Order created successfully
- [ ] Redirected to PhonePe payment page
- [ ] PhonePe payment failed
- [ ] Redirected to failure page
- [ ] Order status: "pending"
- [ ] Payment status: "unpaid"
- [ ] NO confirmation email sent
- [ ] Admin dashboard shows pending order

**Status:** ✅ PASS / ❌ FAIL

### Test Case 3: Payment Pending
- [ ] Payment status shows pending
- [ ] Can check status again
- [ ] Eventually resolves to success/failure

**Status:** ✅ PASS / ❌ FAIL

### Test Case 4: Registered User Payment
- [ ] Login as customer
- [ ] Order created with customer details
- [ ] isGuestOrder: false
- [ ] Payment process same as guest

**Status:** ✅ PASS / ❌ FAIL

### Test Case 5: Email Notifications
- [ ] Confirmation email sent after payment
- [ ] Contains order details
- [ ] Contains delivery address
- [ ] Contains order number

**Status:** ✅ PASS / ❌ FAIL

### Issues Encountered
[List any issues found during testing]

### Recommendations
[Any improvements or changes needed]

### Sign-Off
Testing completed by: _____________
Date: _____________
Ready for production: ✅ YES / ❌ NO
```

---

## 🎯 Success Criteria

Payment integration is working correctly when:

✅ User redirected to PhonePe after order creation  
✅ Payment page loads without errors  
✅ After payment, redirected to success/failure page  
✅ Order status updated correctly (confirmed/pending)  
✅ Payment status updated correctly (paid/unpaid)  
✅ Confirmation email sent after successful payment  
✅ Admin can see all orders with payment status  
✅ Database reflects all payment details  
✅ No JavaScript errors in console  
✅ Mobile payments work (UPI, cards, etc.)  

---

## 📞 Support & Next Steps

If all tests pass:
1. ✅ Ready for staging deployment
2. ✅ Ready for production deployment
3. ✅ Monitor payment success rates

If tests fail:
1. Check debugging section above
2. Review error messages in console
3. Check backend logs
4. Review code changes
5. Contact support if needed

---

**Last Updated:** 2025-04-28  
**Version:** 1.0 - Initial Release
