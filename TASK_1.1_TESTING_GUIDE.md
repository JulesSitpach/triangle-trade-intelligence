# Task 1.1: JWT Authentication Testing Guide

**Status:** Ready to Test
**Server:** Running on http://localhost:3000

---

## ✅ Pre-Test Checklist

- [x] Dependencies installed (@supabase/ssr, cookie)
- [x] Files created (server.js, client.js, middleware.js, logout.js)
- [x] Files updated (login.js, auth-middleware.js)
- [x] Dev server running on port 3000

---

## 🧪 Test 1: Login API Endpoint

### Test with Existing User

**Before running:** Make sure you have a test user in Supabase Auth.

**Method 1: Using Browser DevTools**
1. Open http://localhost:3000 in browser
2. Open DevTools (F12) → Console
3. Run this code:

```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important for cookies!
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'your-password-here'
  })
})
.then(r => r.json())
.then(data => console.log('Login Response:', data))
.catch(err => console.error('Login Error:', err));
```

**Method 2: Using curl (Command Line)**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{\"email\":\"test@example.com\",\"password\":\"your-password-here\"}"
```

### Expected Response:
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "company_name": "Test Company",
    "subscription_tier": "trial",
    "status": "active",
    "full_name": "Test User",
    "isAdmin": false
  },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

### ✅ Success Criteria:
- [ ] Status code: 200
- [ ] `success: true` in response
- [ ] User object contains all expected fields
- [ ] Session object present

---

## 🍪 Test 2: Verify httpOnly Cookies

**In Browser DevTools:**
1. After successful login, go to **Application** tab (Chrome) or **Storage** tab (Firefox)
2. Navigate to **Cookies** → http://localhost:3000
3. Look for cookies starting with `sb-`

### Expected Cookies:
```
Name: sb-<project-ref>-auth-token
Value: <encoded-token>
HttpOnly: ✅ Yes
Secure: ❌ No (dev) / ✅ Yes (production)
SameSite: Lax
Path: /
```

### ✅ Success Criteria:
- [ ] Cookie exists with name `sb-*-auth-token`
- [ ] HttpOnly flag is set
- [ ] Cookie has session data

**⚠️ Security Note:** HttpOnly cookies cannot be accessed via JavaScript - this is correct behavior!

---

## 🔄 Test 3: Middleware Token Refresh

The middleware should automatically refresh tokens on every request.

**Test Steps:**
1. After login, wait 1 second
2. Navigate to any page on the site (e.g., http://localhost:3000)
3. Check browser DevTools → Network tab
4. Look for the response headers of the HTML request

### Expected Headers:
```
Set-Cookie: sb-<project-ref>-auth-token=...; Path=/; HttpOnly; SameSite=Lax
```

### ✅ Success Criteria:
- [ ] Cookie is refreshed on page navigation
- [ ] No 401 errors appear
- [ ] Session remains valid

---

## 🔒 Test 4: Protected API Route

Let's test that authentication middleware works correctly.

**Create a test protected route:**

Create file: `pages/api/test-protected.js`

```javascript
import { withAuth } from '../../lib/middleware/auth-middleware';

async function handler(req, res) {
  return res.status(200).json({
    success: true,
    message: 'You are authenticated!',
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
}

export default withAuth(handler);
```

**Test in Browser Console (after login):**
```javascript
fetch('http://localhost:3000/api/test-protected', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('Protected Route:', data));
```

### Expected Response (Authenticated):
```json
{
  "success": true,
  "message": "You are authenticated!",
  "user": {
    "id": "uuid",
    "email": "test@example.com"
  }
}
```

### Test Unauthenticated Access:
```javascript
// Open in incognito/private window (no cookies)
fetch('http://localhost:3000/api/test-protected')
.then(r => r.json())
.then(data => console.log('Should fail:', data));
```

### Expected Response (Unauthenticated):
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### ✅ Success Criteria:
- [ ] Authenticated request returns 200 with user data
- [ ] Unauthenticated request returns 401
- [ ] Error message is clear

---

## 🚪 Test 5: Logout API

**In Browser Console (while logged in):**
```javascript
fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('Logout Response:', data));
```

### Expected Response:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### ✅ Success Criteria:
- [ ] Status code: 200
- [ ] `success: true` in response
- [ ] Logout message present

---

## 🧹 Test 6: Verify Cookies Cleared

**After logout, check cookies again:**
1. DevTools → Application → Cookies
2. The `sb-*-auth-token` cookie should be:
   - Either deleted completely
   - Or have empty value with Max-Age=0

**Test Protected Route After Logout:**
```javascript
fetch('http://localhost:3000/api/test-protected', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('Should be 401:', data));
```

### Expected Response:
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### ✅ Success Criteria:
- [ ] Cookie is cleared/expired
- [ ] Protected routes return 401
- [ ] User cannot access authenticated resources

---

## 🎯 Full Flow Test

**Complete authentication flow:**

1. **Start:** User not logged in
   - Protected routes return 401 ✅

2. **Login:** POST to /api/auth/login
   - Returns user data ✅
   - Sets httpOnly cookie ✅

3. **Navigate:** Visit any page
   - Middleware refreshes token ✅
   - Cookie updated ✅

4. **Access Protected Route:** GET /api/test-protected
   - Returns user data ✅
   - No 401 error ✅

5. **Logout:** POST to /api/auth/logout
   - Cookie cleared ✅
   - Success message ✅

6. **Verify Logout:** GET /api/test-protected
   - Returns 401 ✅

---

## 🐛 Common Issues & Solutions

### Issue 1: "Authentication required" after login
**Cause:** Cookies not being sent with requests
**Solution:** Add `credentials: 'include'` to fetch calls

### Issue 2: CORS errors
**Cause:** Middleware blocking requests
**Solution:** Check middleware.js matcher pattern

### Issue 3: Cookies not visible in DevTools
**Cause:** HttpOnly cookies are hidden from JavaScript
**Solution:** This is correct! Check in Application/Storage tab instead

### Issue 4: Middleware not running
**Cause:** Matcher pattern excluding your route
**Solution:** Update matcher in middleware.js

---

## ✅ Task 1.1 Sign-Off Checklist

Before moving to Task 1.2, verify:

- [ ] Login works and returns user data
- [ ] httpOnly cookies are set correctly
- [ ] Cookies have correct flags (HttpOnly, SameSite)
- [ ] Middleware refreshes tokens automatically
- [ ] Protected routes require authentication
- [ ] Unauthenticated requests return 401
- [ ] Logout clears cookies
- [ ] After logout, protected routes return 401
- [ ] No console errors during auth flow
- [ ] Server logs show authentication events

---

## 🚀 Next Steps

Once all tests pass:

1. Update `PROGRESS_TRACKER.md`:
   - Mark Task 1.1 as ✅ Complete
   - Record actual time spent

2. Update `docs/STAGE1_CHECKLIST.md`:
   - Check off Task 1.1 items

3. Proceed to **Task 1.2: Database Migration - Workflow Sessions**

---

**Last Updated:** 2025-10-01
**Tested By:** _[Your Name]_
**Test Date:** _[Fill in]_
**Result:** _[Pass/Fail]_
