# 🧪 Test Logout - Debug Cookie Issue

## The Problem
Logout button doesn't clear the cookie, so you stay logged in.

## Quick Test in Browser Console

### 1️⃣ Check Current Cookie
```javascript
// See if cookie exists
document.cookie.split(';').filter(c => c.includes('triangle_session'))
```

**Expected:** Should show the `triangle_session` cookie

### 2️⃣ Test Logout API Directly
```javascript
// Call logout API directly
await fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('Logout response:', data);
});
```

**Expected:** `{ success: true, message: 'Logged out successfully' }`

### 3️⃣ Check Cookie After Logout
```javascript
// Cookie should be gone now
document.cookie.split(';').filter(c => c.includes('triangle_session'))
```

**Expected:** Empty array `[]` (cookie cleared)

### 4️⃣ Test Auth Status
```javascript
// Should fail now
await fetch('/api/auth/me', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('Auth status:', data));
```

**Expected:** `{ success: false, authenticated: false, error: 'No session found' }`

---

## If Logout API Works But Button Doesn't

The problem is that the UserDashboard component might not be wrapped in SimpleAuthProvider.

**Check:** Is `pages/_app.js` wrapping everything with `<SimpleAuthProvider>`?

---

## Manual Cookie Clear (Nuclear Option)

If logout still doesn't work, clear cookie manually in browser:
1. F12 → Application → Cookies
2. Find `triangle_session`
3. Right-click → Delete
4. Refresh page → Should redirect to login ✅
