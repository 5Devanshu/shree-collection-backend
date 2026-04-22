# 🔧 API 404 & IMAGE UPLOAD FAILURE - DIAGNOSIS & SOLUTION

**Date:** April 23, 2026
**Issue:** 
- `GET /api/products` returns 404
- Image upload is not working
**Root Cause:** Likely authentication issue or backend connectivity problem

---

## 📋 Problem Analysis

### Symptoms
1. **404 Error on Products Endpoint**
   ```
   Failed to load resource: the server responded with a status of 404
   ```
   
2. **Image Upload Not Working**
   - File selected but not uploading
   - No upload error shown

### What We Know
✅ Frontend form validation is working (fields marked as required)
✅ API client is configured correctly
✅ Backend routes are defined
❓ Connection between frontend and backend is failing

---

## 🔍 Diagnostic Steps

### Step 1: Check if Backend is Running
```bash
# In terminal:
curl https://shree-collection-backend-production.up.railway.app/api/products
```

**Expected Response:** Should return JSON with products or error
**Actual Response:** Likely 404 or timeout

### Step 2: Check Railway Logs
1. Go to https://railway.app
2. Select "shree-collection-backend" project
3. Click "Logs" tab
4. Look for error messages or "connection refused"

### Step 3: Verify Admin Token
Open browser console (F12) and run:
```javascript
// Check if admin token exists
console.log('Admin Token:', localStorage.getItem('shree_admin_token'));
console.log('Customer Token:', localStorage.getItem('shree_customer_token'));
```

**If both are empty:** User is not authenticated

---

## 🎯 Most Likely Issues

### Issue 1: Backend is Down or Unreachable
**Symptoms:**
- 404 errors on ALL endpoints
- Can't upload images
- Products won't load

**Solutions:**
1. Check Railway dashboard for backend status
2. Look for deployment errors in logs
3. Verify environment variables are set correctly
4. Restart the backend service

**Action:**
```bash
# Go to Railway dashboard:
# https://railway.app → shree-collection-backend → Redeploy
```

### Issue 2: Admin Not Authenticated
**Symptoms:**
- 404 on protected routes (products, upload, etc.)
- 401 on admin-specific endpoints

**Solution:**
1. Log out completely
2. Log in again as admin
3. Verify token is saved in localStorage
4. Try again

**Action:**
```javascript
// In browser console:
// Force logout and clear all storage
localStorage.clear();
// Then navigate to login page and log in again
```

### Issue 3: JWT_SECRET Mismatch
**Symptoms:**
- Token verification fails
- "Token is invalid" errors

**Solution:**
1. Verify JWT_SECRET in Railway environment
2. If changed recently, tokens from before the change are invalid
3. Clear localStorage and log in again

**Action:**
```bash
# Go to Railway dashboard:
# shree-collection-backend → Variables
# Verify JWT_SECRET is set to a strong value
```

### Issue 4: CORS Issue
**Symptoms:**
- Request seems to go through but fails silently
- 0 status code in network tab

**Solution:**
1. Check that frontend domain is in CORS allowlist
2. Verify CORS headers are being sent

**Check in server.js:**
```javascript
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://shreecollection.co.in',  // ← Should be here
  'http://localhost:5173',
  'http://localhost:3000',
];
```

---

## ✅ Quick Fix Checklist

Complete these steps in order:

- [ ] **Step 1:** Hard refresh browser (Cmd+Shift+R on Mac)
- [ ] **Step 2:** Clear localStorage:
  ```javascript
  localStorage.clear();
  ```
- [ ] **Step 3:** Log out and log in again
- [ ] **Step 4:** Try uploading image again
- [ ] **Step 5:** If still failing, check Railway logs

---

## 🚨 If Still Not Working

### Check Backend Deployment Status
1. Go to https://railway.app
2. Select "shree-collection-backend"
3. Check status:
   - ✅ Green = Running
   - 🟡 Yellow = Deploying
   - 🔴 Red = Failed

### Check API Connectivity
Open browser console and run:
```javascript
// Test API endpoint
fetch('https://shree-collection-backend-production.up.railway.app/api/products')
  .then(r => {
    console.log('Status:', r.status);
    return r.json();
  })
  .then(d => console.log('Data:', d))
  .catch(e => console.error('Error:', e));
```

**Expected:** 200 status with product data (or 401 if not authenticated)
**Actual:** If 404 or error, backend has issue

### Check Authentication
```javascript
// Verify token is valid
const token = localStorage.getItem('shree_admin_token');
console.log('Token exists:', !!token);
console.log('Token:', token); // Should be a long string starting with 'eyJ'
```

---

## 📋 Debug Information to Gather

If the issue persists, collect this information:

1. **Browser Console Errors**
   - Open F12 → Console
   - Take screenshot of any red errors
   - Copy exact error messages

2. **Network Tab Details**
   - F12 → Network
   - Try to upload an image
   - Click on the failed request
   - Check:
     - Status code
     - Response body
     - Request headers (Authorization present?)

3. **Railway Logs**
   - Go to railway.app
   - Select backend project
   - Copy last 20 lines of logs

4. **Environment Variables**
   - Go to railway.app
   - Check Variables tab
   - Verify all required vars are set:
     - MONGODB_URI ✓
     - JWT_SECRET ✓
     - CLOUDINARY_* ✓
     - CLIENT_URL ✓

---

## 🔧 Backend Restart (Nuclear Option)

If all else fails:

1. Go to https://railway.app
2. Select "shree-collection-backend"
3. Go to "Deployments" tab
4. Find the current deployment
5. Click "Redeploy"
6. Wait 2-3 minutes for restart
7. Try again

---

## 📞 Reference Commands

### Check Backend Health
```bash
curl -v https://shree-collection-backend-production.up.railway.app/api/products
```

### Check Token Validity (in console)
```javascript
const token = localStorage.getItem('shree_admin_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires:', new Date(payload.exp * 1000));
console.log('Token valid:', Date.now() < payload.exp * 1000);
```

### Clear All Storage (in console)
```javascript
localStorage.clear();
sessionStorage.clear();
// Then reload page
location.reload();
```

---

## ✨ Summary

| Issue | Solution |
|-------|----------|
| 404 on products | Check backend is running on Railway |
| Image upload fails | Verify admin is authenticated (token in localStorage) |
| Token invalid | Log out, clear storage, log in again |
| Backend down | Redeploy from Railway dashboard |
| CORS error | Verify frontend domain in CORS allowlist |

---

## 🎯 Next Actions

1. **Immediate:** Hard refresh and log in again
2. **If still failing:** Check Railway dashboard for backend status
3. **If backend is down:** Redeploy
4. **If still issues:** Gather debug info from steps above

---

**Status: Diagnosis Complete - Ready for Resolution**
