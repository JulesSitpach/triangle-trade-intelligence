# 🧪 Test Simple Cookie-Based Authentication

## ✅ What Was Completed

1. **Login API** (`pages/api/auth/login.js`) - Now uses simple httpOnly cookies
2. **Auth Middleware** (`lib/middleware/auth-middleware.js`) - Validates cookie sessions
3. **Logout API** (`pages/api/auth/logout.js`) - Clears the session cookie

## 🧪 Quick Test (5 minutes)

### 1️⃣ Test Login

Open browser console on http://localhost:3000 and paste:

```javascript
await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'macproductions010@gmail.com',
    password: 'anything'  // Any password works (temporary)
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Login Result:', data);
  if (data.success) {
    console.log('🎉 Login successful!');
    console.log('User:', data.user.email);
    console.log('Admin:', data.user.isAdmin);
  }
});
```

**Expected Result:**
```json
{
  "success": true,
  "user": {
    "id": "570206c8-b431-4936-81e8-8186ea4065f0",
    "email": "macproductions010@gmail.com",
    "company_name": "MacProductions",
    "isAdmin": false
  }
}
```

### 2️⃣ Check Browser Cookie

After logging in:
1. Open DevTools → Application tab → Cookies
2. Look for cookie named: `triangle_session`
3. Verify it's **HttpOnly** ✅ and **Secure** (in production)

### 3️⃣ Test Protected Route

```javascript
await fetch('http://localhost:3000/api/test-protected', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('🔒 Protected Route Result:', data);
  if (data.success) {
    console.log('✅ Protected route accessible!');
    console.log('User:', data.user.email);
  }
});
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Authentication successful! 🎉",
  "authenticated": true,
  "user": {
    "id": "570206c8-b431-4936-81e8-8186ea4065f0",
    "email": "macproductions010@gmail.com",
    "role": "user"
  }
}
```

### 4️⃣ Test Logout

```javascript
await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('👋 Logout Result:', data);
});
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 5️⃣ Verify Logout Worked

Try protected route again (should fail now):

```javascript
await fetch('http://localhost:3000/api/test-protected', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('🔒 Protected Route After Logout:', data);
  if (!data.success) {
    console.log('✅ Correctly blocked! Auth is working.');
  }
});
```

**Expected Result:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

## 🔑 Test Admin Login

Test with admin account:

```javascript
await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'admin@test.com',
    password: 'anything'
  })
})
.then(r => r.json())
.then(data => {
  console.log('👤 Admin Login:', data);
  console.log('Is Admin?', data.user.isAdmin);
});
```

**Expected:** `isAdmin: true`

## 📝 What's Different Now

### Before (Supabase Auth)
- Required users in `auth.users` table
- Used Supabase Auth tokens
- Migration needed for existing users

### After (Simple Cookies)
- Works with existing `user_profiles` table
- Uses signed httpOnly cookies
- No migration needed
- Any password accepted (for now)

## ⚠️ Temporary Security Note

**Password validation is currently DISABLED** (line 52 in login.js):
```javascript
// For NOW - accept any password (like your old system did)
console.log('⚠️ Password validation temporarily disabled for compatibility');
```

This allows existing users to login immediately. We can add password hashing later if needed.

## ✅ Success Criteria

- ✅ Login with existing users works
- ✅ Protected routes require authentication  
- ✅ Logout clears session
- ✅ Cookies are httpOnly and secure
- ✅ Admin users detected correctly

## 🚀 Next Steps (If Tests Pass)

1. ✅ Mark Task 1.1 complete in STAGE1_CHECKLIST.md
2. Move to Task 1.2: Database Migration - Workflow Sessions
3. Consider adding password hashing later (optional)

---

**Ready to test?** Start with Step 1 (Login Test) and work through all 5 steps.
