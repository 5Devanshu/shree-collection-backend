# 🆘 TROUBLESHOOTING GUIDE - API 404 & Image Upload Fix

**Last Updated:** April 23, 2026
**Purpose:** Quick step-by-step guide to resolve current issues

---

## 🎯 Issue Summary

**What's Happening:**
1. Products page shows 404 error (products not loading)
2. Image upload is not working

**What's NOT broken:**
- ✅ Form validation (this is working and showing errors correctly)
- ✅ Frontend code (properly configured)
- ✅ Backend code (routes exist)

**What IS broken:**
- ❌ Backend connectivity or API responding
- ❌ Authentication/Token flow
- ❌ Image upload service

---

## 🔧 FIX STEPS (In Order)

### Fix #1: Hard Reset (Try This First)

**Why:** Browser cache might be causing issues

**Steps:**
1. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear all storage:
   ```javascript
   // Open console (F12) and paste:
   localStorage.clear();
   sessionStorage.clear();
   // Press Enter
   ```
3. Reload page: `F5`
4. Try again

**Expected Result:** If this was a cache issue, it should work now ✅

---

### Fix #2: Log Out and Log Back In

**Why:** Token might be expired or corrupted

**Steps:**
1. Go to admin panel
2. Click "Logout" button
3. Confirm you're logged out
4. Go to login page
5. Log in again with credentials
6. Verify login was successful (redirected to dashboard)
7. Try uploading image again

**Expected Result:** Fresh token should allow upload ✅

**If still not working:** Proceed to Fix #3

---

### Fix #3: Check Backend Status on Railway

**Why:** Backend might be down or having issues

**Steps:**
1. Open https://railway.app in new tab
2. Log in to your Railway account
3. Find "shree-collection-backend" project in the list
4. Click on it
5. Look for deployment status:
   - ✅ **Green dot** = Running (OK)
   - 🟡 **Yellow dot** = Deploying (Wait 2-3 min)
   - 🔴 **Red dot** = Failed (Need to fix)

**If Green (Running):**
- Proceed to Fix #4

**If Yellow (Deploying):**
- Wait 2-3 minutes
- Reload the page
- Try uploading again

**If Red (Failed):**
- Click the failed deployment
- Look at "Logs" tab
- Take a screenshot of any error messages
- Contact support with screenshot

---

### Fix #4: Check Backend Logs

**Why:** Logs show exactly what's wrong

**Steps:**
1. Still on Railway → shree-collection-backend
2. Click "Logs" tab
3. Scroll to the bottom to see latest activity
4. Look for any error messages (usually in red)

**What to look for:**
- ❌ `MongoError` = Database connection failed
- ❌ `Cannot find module` = Code import error
- ❌ `ENOENT` = Missing file
- ❌ `CORS error` = Frontend/backend mismatch

**If you see errors:**
- Screenshot the errors
- Contact developer with screenshot
- Proceed to Fix #5 (Redeploy)

**If no errors:**
- Proceed to Fix #5 (Redeploy anyway)

---

### Fix #5: Redeploy Backend

**Why:** Sometimes restarting fixes transient issues

**Steps:**
1. Still on Railway
2. Go to "Deployments" tab (or find current deployment)
3. Find the most recent deployment (top of list)
4. Click the three-dot menu icon (⋯)
5. Click "Redeploy"
6. Wait for it to finish (2-3 minutes)
7. When it shows ✅ (green), it's done
8. Go back to frontend
9. Hard refresh: `Cmd+Shift+R`
10. Try uploading image again

**Expected Result:** Should work now ✅

**If still not working:** Proceed to Fix #6

---

### Fix #6: Verify Environment Variables

**Why:** Missing env vars cause backend to fail silently

**Steps:**
1. Still on Railway → shree-collection-backend
2. Click "Variables" tab
3. Check these are ALL set:
   - ✅ `MONGODB_URI` - Should look like: `mongodb+srv://...`
   - ✅ `JWT_SECRET` - Should be a long random string
   - ✅ `CLIENT_URL` - Should be: `https://shreecollection.co.in`
   - ✅ `CLOUDINARY_CLOUD_NAME` - Should be set
   - ✅ `CLOUDINARY_API_KEY` - Should be set
   - ✅ `CLOUDINARY_API_SECRET` - Should be set

**If any are missing:**
1. Ask admin/owner for the value
2. Add it in Variables
3. Redeploy (go back to Deployments, click Redeploy)
4. Try again

**If all are present:**
- Proceed to Fix #7

---

### Fix #7: Test API Manually

**Why:** Can help isolate the problem

**Steps:**
1. Open browser console (F12)
2. Paste this code:
   ```javascript
   fetch('https://shree-collection-backend-production.up.railway.app/api/products')
     .then(r => {
       console.log('Status:', r.status);
       return r.json();
     })
     .then(d => {
       console.log('Success! Data:', d);
     })
     .catch(e => {
       console.error('Error:', e);
     });
   ```
3. Press Enter
4. Look at console output

**Expected Results:**
- ✅ **Status 200 + data** = Backend is working
- ✅ **Status 401 + error message** = Auth issue (but backend responds!)
- ❌ **Error or no response** = Backend is down

**If Status 200 or 401:**
- Backend is working!
- Problem might be in auth flow
- Try Fix #8

**If Error/No Response:**
- Backend is truly down
- Contact support
- Ask them to check Railway deployment

---

### Fix #8: Verify Authentication Token

**Why:** Upload requires a valid token

**Steps:**
1. Open console (F12)
2. Paste:
   ```javascript
   const token = localStorage.getItem('shree_admin_token');
   console.log('Token exists:', !!token);
   console.log('Token (first 50 chars):', token?.substring(0, 50));
   ```
3. Press Enter

**Expected Result:**
- `Token exists: true`
- `Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**If true:**
- Token exists, authentication should work
- The issue might be elsewhere
- Proceed to Fix #9

**If false (says "null" or empty):**
- Token is missing!
- User is not authenticated
- Fix: Log out and log back in (go back to Fix #2)

---

### Fix #9: Try Upload with Token

**Why:** Final test to confirm everything is connected

**Steps:**
1. Get token from console (from Fix #8)
2. Create a simple test:
   ```javascript
   const token = localStorage.getItem('shree_admin_token');
   
   // Create FormData with a test image
   const fd = new FormData();
   // Can't actually add image from console, but we can test endpoint
   
   fetch('https://shree-collection-backend-production.up.railway.app/api/media/upload', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${token}`
     }
   })
   .then(r => {
     console.log('Status:', r.status);
     return r.json();
   })
   .then(d => console.log('Response:', d))
   .catch(e => console.error('Error:', e));
   ```
3. Press Enter
4. Check the status code

**Expected Results:**
- ✅ **400/422** = Upload endpoint exists but no file provided (that's OK!)
- ✅ **401** = Auth failed but endpoint exists (check token from Fix #8)
- ❌ **404** = Endpoint doesn't exist (backend problem)
- ❌ **Error** = Network issue

**If 400 or 401:**
- Endpoint exists! Try uploading in UI again
- It might work now

**If 404 or Error:**
- Backend has serious issues
- Contact support with this info

---

## 📋 Checklist - Follow This Order

- [ ] **Fix #1:** Hard reset browser
- [ ] **Fix #2:** Log out and log in
- [ ] **Fix #3:** Check backend status (green/yellow/red)
- [ ] **Fix #4:** Check backend logs for errors
- [ ] **Fix #5:** Redeploy if needed
- [ ] **Fix #6:** Verify environment variables
- [ ] **Fix #7:** Test API manually
- [ ] **Fix #8:** Verify authentication token
- [ ] **Fix #9:** Try upload with token

**If you get to Fix #9 and it's working:** ✅ You're done!
**If issues persist:** Gather info from console and contact support

---

## 💾 Information to Gather for Support

If none of these fixes work, collect this info:

1. **Error Messages**
   - Open console (F12)
   - Try to upload
   - Screenshot any red error messages

2. **Network Details**
   - F12 → Network tab
   - Try to upload
   - Click the failed request
   - Screenshot the Response tab

3. **Backend Logs**
   - Go to Railway
   - Backend project → Logs
   - Screenshot last 20 lines

4. **Browser Info**
   - What browser? (Chrome, Safari, Firefox, etc.)
   - What OS? (Mac, Windows, Linux)
   - Fresh install or existing?

5. **Timing Info**
   - When did this start happening?
   - Was it working before?
   - What did you last change?

---

## 🎯 Most Common Solutions

| Problem | Solution |
|---------|----------|
| 404 on products | Hard refresh (Fix #1) |
| Upload fails silently | Log in again (Fix #2) |
| Backend unreachable | Redeploy (Fix #5) |
| Auth fails | Clear storage, log in again (Fix #2) |
| Env vars missing | Add them in Railway (Fix #6) |

---

## 📞 Quick Reference

**Railway Dashboard:** https://railway.app
**Frontend URL:** https://shreecollection.co.in
**Backend URL:** https://shree-collection-backend-production.up.railway.app

---

**Start with Fix #1 and work your way down. One of these should resolve the issue! ✅**
