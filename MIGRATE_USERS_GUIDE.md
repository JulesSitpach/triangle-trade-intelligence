# User Migration Guide - Add Users to Supabase Auth

## 🎯 Goal
Add your existing `user_profiles` users to Supabase Auth so they can use the new authentication system.

---

## 📋 Step 1: Choose Temporary Passwords

You'll set temporary passwords for your users. They can change them later.

**Your Users:**
1. **macproductions010@gmail.com** (user) - Choose a password
2. **admin@test.com** (admin) - Choose a password

---

## 🚀 Step 2: Run Migration

### Option A: Browser Console (Easiest)

1. Open http://localhost:3000 in your browser
2. Press **F12** → **Console** tab
3. Paste this code (replace passwords):

```javascript
fetch('http://localhost:3000/api/migrate-users-to-auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    users: [
      {
        email: 'macproductions010@gmail.com',
        password: 'YourTempPassword123!', // ← Change this
        profile_id: '570206c8-b431-4936-81e8-8186ea4065f0'
      },
      {
        email: 'admin@test.com',
        password: 'AdminTempPassword123!', // ← Change this
        profile_id: 'e6411a4c-a542-4804-a3ea-8dec667bf18d'
      }
    ]
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Migration Result:', data);
  if (data.success) {
    console.log(`🎉 Successfully migrated ${data.summary.migrated} users!`);
  }
})
.catch(err => console.error('❌ Migration Error:', err));
```

### Option B: curl Command

```bash
curl -X POST http://localhost:3000/api/migrate-users-to-auth \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "email": "macproductions010@gmail.com",
        "password": "YourTempPassword123!",
        "profile_id": "570206c8-b431-4936-81e8-8186ea4065f0"
      },
      {
        "email": "admin@test.com",
        "password": "AdminTempPassword123!",
        "profile_id": "e6411a4c-a542-4804-a3ea-8dec667bf18d"
      }
    ]
  }'
```

---

## ✅ Step 3: Verify Migration

**Expected Response:**
```json
{
  "success": true,
  "summary": {
    "total": 2,
    "migrated": 2,
    "failed": 0
  },
  "results": [
    {
      "email": "macproductions010@gmail.com",
      "success": true,
      "auth_user_id": "...",
      "profile_id": "570206c8-b431-4936-81e8-8186ea4065f0"
    },
    {
      "email": "admin@test.com",
      "success": true,
      "auth_user_id": "...",
      "profile_id": "e6411a4c-a542-4804-a3ea-8dec667bf18d"
    }
  ]
}
```

**Check Migration:**
```javascript
// Verify users were created
fetch('http://localhost:3000/api/debug-users')
  .then(r => r.json())
  .then(data => {
    console.log('Auth Users:', data.auth_users.count);
    console.log('Emails:', data.auth_users.emails);
  });
```

---

## 🔐 Step 4: Test Login

**Now try logging in with the new system:**

```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'macproductions010@gmail.com',
    password: 'YourTempPassword123!' // The password you set
  })
})
.then(r => r.json())
.then(data => {
  console.log('Login Result:', data);
  if (data.success) {
    console.log('🎉 Login successful!');
  }
});
```

---

## 🎯 Step 5: Test Protected Route

```javascript
fetch('http://localhost:3000/api/test-protected', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('Protected Route:', data));
```

**Expected:**
```json
{
  "success": true,
  "message": "Authentication successful! 🎉",
  "user": {
    "id": "...",
    "email": "macproductions010@gmail.com"
  }
}
```

---

## 📝 What This Migration Does

1. ✅ Creates users in Supabase Auth (`auth.users` table)
2. ✅ Auto-confirms their email (no verification needed)
3. ✅ Links `user_profiles.id` with `auth.users.id`
4. ✅ Adds migration metadata to track the migration
5. ✅ Sets temporary passwords (users can change later)

---

## 🔧 Troubleshooting

### Error: "User already exists"
**Solution:** User was already migrated. Try logging in.

### Error: "Invalid email or password"
**Solution:** Double-check the password you set during migration.

### Error: "Database error"
**Solution:** Check Supabase connection and service role key.

---

## ⚠️ Important Notes

### Password Requirements
Passwords must have:
- At least 8 characters
- Mix of letters and numbers
- At least one special character (!, @, #, etc.)

### Security
- These are **temporary passwords**
- Tell users to change them after first login
- Don't commit passwords to git

### Migration is One-Time
- You only need to run this once per user
- After migration, users log in normally
- Old `user_profiles` data is preserved

---

## 🚀 Quick Start (TL;DR)

1. **Choose passwords** for your 2 users
2. **Paste script** in browser console (replace passwords)
3. **Run** and verify success
4. **Test login** with new credentials
5. **Enjoy** cookie-based auth! 🎉

---

**Ready?** Run the migration script above and let me know the result!
