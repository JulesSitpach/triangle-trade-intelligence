# Authentication Implementation Plan

## Phase 1: Supabase Auth Setup (2-3 hours)

### Step 1: Enable Supabase Auth
```bash
# Install Supabase auth helpers
npm install @supabase/auth-helpers-nextjs @supabase/auth-helpers-react
```

### Step 2: Create Auth Pages
- `/pages/login.js` - Login form
- `/pages/signup.js` - Registration form
- `/pages/dashboard.js` - Protected user dashboard

### Step 3: Add Auth Context
- `lib/contexts/AuthContext.js` - User session management
- Wrap app in auth provider

### Step 4: Protect Routes
- Add authentication checks to API endpoints
- Redirect unauthenticated users to login

## Phase 2: Trial/Subscription Enforcement (1-2 hours)

### Step 1: Connect User to Subscriptions
- Update `user_subscriptions` table with auth user ID
- Check subscription status in APIs

### Step 2: Usage Limiting
- Enforce classification limits in `/api/ai-classification`
- Track usage per authenticated user
- Show usage dashboard

### Step 3: Trial Management
- Auto-create trial subscriptions on signup
- Expire trials after 7 days
- Upgrade prompts

## Phase 3: User Dashboard (2-3 hours)

### Features to Build:
- Usage tracking display
- Subscription management
- Classification history
- Certificate downloads
- Billing information

## Database Changes Needed:

```sql
-- Link auth users to profiles
ALTER TABLE user_profiles
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

-- Add trial tracking
ALTER TABLE user_subscriptions
ADD COLUMN trial_started_at TIMESTAMP,
ADD COLUMN trial_expires_at TIMESTAMP,
ADD COLUMN is_trial BOOLEAN DEFAULT true;
```

## Implementation Priority:

1. **Basic Auth** (login/signup) - Get users in
2. **Usage Tracking** - Enforce limits
3. **Trial Management** - Convert to paid
4. **Dashboard** - User experience
5. **Billing Integration** - Revenue collection

## Expected Timeline: 1 week to fully functional SaaS

This gets you from demo to real business quickly!