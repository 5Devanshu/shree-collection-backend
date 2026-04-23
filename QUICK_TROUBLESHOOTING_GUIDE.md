# 🔧 QUICK TROUBLESHOOTING REFERENCE

**Last Updated:** April 20, 2026
**Use This:** When things aren't working as expected

---

## 🆘 COMMON ISSUES & SOLUTIONS

### Issue 1: "CORS error" in Browser Console

**What You See:**
```
Access to XMLHttpRequest at 'https://shree-collection-backend-production.up.railway.app/api/...'
from origin 'https://shreecollection.co.in' has been blocked by CORS policy
```

**Why It's Happening:**
- Backend doesn't recognize your domain
- CORS headers aren't being sent

**Fix:**
1. Go to Railway dashboard → shree-collection-backend
2. Check "Variables" tab
3. Verify `CLIENT_URL` is set to `https://shreecollection.co.in`
4. If not, add it and save
5. Railway will redeploy automatically
6. Wait 2-3 minutes
7. Hard refresh frontend (Cmd+Shift+R on Mac)

---

### Issue 2: "Cannot find module" Error in Railway Logs

**What You See:**
```
Error: Cannot find module 'xyz.js'
```

**Why It's Happening:**
- Import path is incorrect
- ESM migration wasn't complete
- File uses CommonJS syntax

**Fix:**
1. Check the import statement in error message
2. Verify file uses `import`/`export`, not `require`/`module.exports`
3. Verify the file path is correct
4. Make sure `package.json` has `"type": "module"`
5. Push to GitHub
6. Railway will auto-redeploy

---

### Issue 3: "OverwriteModelError: Cannot overwrite Order model" in Logs

**What You See:**
```
OverwriteModelError: Cannot overwrite `Order` model once compiled
```

**Why It's Happening:**
- Order model is imported twice
- Mongoose tries to register it twice

**Fix (Already Done):**
- Check `server.js` has only ONE order model import:
  ```javascript
  import './modules/order/order.model.js';  // ✓ Only this one
  ```
- No other Order imports should exist
- File is already fixed, just verify

---

### Issue 4: Login Not Working / JWT Errors

**What You See:**
```
Unauthorized
Token invalid or expired
JWT verification failed
```

**Why It's Happening:**
- JWT_SECRET changed or not set correctly
- Session expired

**Fix:**
1. Verify JWT_SECRET in Railway Variables
2. If unsure, update to new strong value:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Update in Railway → Variables → JWT_SECRET
4. Clear browser cookies/localStorage
5. Log in again

---

### Issue 5: Database Connection Errors

**What You See:**
```
MongoServerError: connection failed
Cannot connect to MongoDB
```

**Why It's Happening:**
- MONGODB_URI not set in Railway
- Connection string is wrong
- Database service is down

**Fix:**
1. Go to Railway → shree-collection-backend → Variables
2. Check `MONGODB_URI` is set
3. Should look like: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
4. Verify the credentials are correct
5. If changed, update and Railway will redeploy

---

### Issue 6: Product Creation Returns 400 Error

**What You See:**
```
{"error": "Category is required"}
Status: 400 Bad Request
```

**Why It's Happening:**
- You didn't fill all required product fields
- This is CORRECT behavior - validation is working

**Fix:**
1. Fill ALL required fields:
   - Name ✓
   - Description ✓
   - Price ✓
   - Category ✓
   - Image ✓
2. Try again
3. Should succeed with 201 Created

---

### Issue 7: Cloudinary Image Upload Not Working

**What You See:**
```
{"error": "Cloudinary error"}
Upload failed
```

**Why It's Happening:**
- Cloudinary credentials not configured
- Cloud name, API key, or API secret is wrong

**Fix:**
1. Go to Railway → shree-collection-backend → Variables
2. Verify these are set:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. If not set, get from Cloudinary dashboard and add
4. Railway will redeploy automatically

---

### Issue 8: Payment Gateway Not Loading

**What You See:**
```
Payment page won't load
Cashfree not responding
```

**Why It's Happening:**
- Cashfree credentials not set in Railway
- Network connectivity issue

**Fix:**
1. Go to Railway → shree-collection-backend → Variables
2. Verify these are set:
   - `CASHFREE_APP_ID`
   - `CASHFREE_SECRET_KEY`
3. If not set, get from Cashfree dashboard and add
4. Update Railway variables
5. Test payment flow again

---

### Issue 9: Email Notifications Not Sending

**What You See:**
```
No email received after order
Nodemailer error in logs
```

**Why It's Happening:**
- SMTP credentials not configured
- Email service disabled

**Fix:**
1. Go to Railway → shree-collection-backend → Variables
2. Verify these are set:
   - `SMTP_EMAIL` (sender email)
   - `SMTP_PASSWORD` (app password, not Gmail password)
3. If using Gmail, enable "App Password" in security settings
4. Update variables in Railway
5. Test again

---

### Issue 10: Frontend Keeps Redirecting to Wrong API

**What You See:**
```
API calls going to localhost:3000 or wrong domain
```

**Why It's Happening:**
- Frontend `.env` file not loaded correctly
- `VITE_API_URL` not set

**Fix:**
1. Check `/Users/devanshu/Desktop/shree-collection/shree-collection/.env`
2. Should contain:
   ```
   VITE_API_URL=https://shree-collection-backend-production.up.railway.app/api
   ```
3. If wrong, update it
4. Restart dev server: `npm run dev`
5. Or rebuild: `npm run build`

---

## 🔍 HOW TO DEBUG

### Check Railway Logs
1. Go to https://railway.app
2. Select project
3. Click "Logs" tab
4. Search for error messages
5. Most recent logs at bottom

### Check Browser Console
1. Open frontend in browser
2. Press F12 (or right-click → Inspect)
3. Go to "Console" tab
4. Look for red error messages
5. Check Network tab for API response status

### Check Network Tab (Browser DevTools)
1. F12 → Network tab
2. Make an API call
3. Look for the request
4. Check:
   - **Status:** Should be 200, 201, 400, etc. (not 0)
   - **Response:** Should have data
   - **Headers:** Check for CORS headers

---

## ✅ VERIFICATION COMMANDS

### Test Backend Health
```bash
# In terminal:
curl https://shree-collection-backend-production.up.railway.app/api/products

# Should return JSON array of products
```

### Test CORS
```bash
# In browser console:
fetch('https://shree-collection-backend-production.up.railway.app/api/products')
  .then(r => r.json())
  .then(d => console.log('✅ Success:', d))
  .catch(e => console.error('❌ Error:', e))
```

### Test Login
```javascript
// In browser console:
const response = await fetch('https://shree-collection-backend-production.up.railway.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password123'
  }),
  credentials: 'include'
});

const data = await response.json();
console.log(data);
// Should show token and user data
```

---

## 📞 GETTING HELP

### Information to Gather
When troubleshooting, have:
1. **Error message** - Exact text from console or logs
2. **Where it occurred** - Frontend, backend, API endpoint
3. **What you were doing** - Steps to reproduce
4. **Recent changes** - What changed before issue appeared

### Places to Check
1. **Railway Logs** - Real-time error messages
2. **Browser Console** - Frontend errors
3. **Network Tab** - API response details
4. **Files in `/sc_backend/`** - Code configuration
5. **Environment Variables** - Railway settings

### Reference Documents
- `QUICK_REFERENCE.md` - Quick lookup
- `ADVANCED_TROUBLESHOOTING_GUIDE.md` - Detailed debugging
- `CRITICAL_FIXES_SERVER_CRASH_SECURITY.md` - Security issues
- `PRODUCT_API_ERRORS_FIX_GUIDE.md` - Product validation

---

## 🟢 EVERYTHING IS WORKING

### Signs of Health
✅ No errors in Railway logs
✅ API responds quickly (<500ms)
✅ Products load on frontend
✅ Login works
✅ Product creation works
✅ CORS no errors
✅ Payment page loads
✅ Emails send

### Monitoring Checklist
- [ ] Check logs daily first week
- [ ] Monitor error rate
- [ ] Check response times
- [ ] Verify backups are running
- [ ] Monitor database size

---

**Need more help? Check ADVANCED_TROUBLESHOOTING_GUIDE.md for detailed investigation steps.**
