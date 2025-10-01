# TRIANGLE INTELLIGENCE PLATFORM - COMPREHENSIVE IMPLEMENTATION GUIDE

## Document Purpose

This guide provides step-by-step instructions for implementing all missing features in the Triangle Intelligence Platform. Each section includes exact code examples, architecture decisions, best practices, and testing strategies. A mid-level developer can follow this guide from start to finish without external assistance.

---

## Table of Contents

1. [Deployment Platform Overview](#deployment-platform-overview)
2. [Current State Analysis](#current-state-analysis)
3. [Staged Implementation Plan](#staged-implementation-plan)
4. [Stage 1: Foundation (Week 1-2)](#stage-1-foundation)
5. [Stage 2: Payment & Billing (Week 3-4)](#stage-2-payment--billing)
6. [Stage 3: User Experience (Week 5-6)](#stage-3-user-experience)
7. [Stage 4: Business Operations (Week 7-8)](#stage-4-business-operations)
8. [Stage 5: Compliance & Polish (Week 9-10)](#stage-5-compliance--polish)
9. [Technology Stack Decisions](#technology-stack-decisions)
10. [Database Schema Reference](#database-schema-reference)
11. [API Endpoint Specifications](#api-endpoint-specifications)
12. [Testing Strategy](#testing-strategy)
13. [Deployment & Rollback Plan](#deployment--rollback-plan)

---

## Deployment Platform Overview

### 🚀 Target Platform: Vercel + Supabase + Stripe

This platform will be deployed on **Vercel** with integrations to **Supabase** (database) and **Stripe** (payments). This combination provides:

**Benefits:**
- **Vercel**: Automatic deployments, edge network, serverless functions, zero-config Next.js optimization
- **Supabase**: Managed PostgreSQL with built-in connection pooling for serverless environments
- **Stripe**: Industry-standard payment processing with comprehensive webhook support

**Key Considerations:**
- Vercel functions are **stateless** - use httpOnly cookies for session management
- Connection pooling required for database queries (Supabase handles this automatically)
- Webhook endpoints must be publicly accessible
- Environment variables managed through Vercel Dashboard

### Prerequisites Setup

#### 1. Vercel Account & CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project to Vercel (run in project root)
vercel link
```

#### 2. Environment Variables Configuration

**Vercel Dashboard → Project → Settings → Environment Variables**

Add these for all environments (Development, Preview, Production):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_... (test) or sk_live_... (production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
JWT_SECRET=your_secure_random_string

# Email (if using Resend)
RESEND_API_KEY=re_...
```

#### 3. Vercel Project Configuration

Create file: **vercel.json**

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
      ]
    }
  ]
}
```

### Vercel Deployment Strategy

**Development → Preview → Production Pipeline:**

```bash
# 1. Development (Local)
npm run dev
# Test on localhost:3000

# 2. Preview Deployment (Every PR)
git push origin feature-branch
# Vercel automatically creates preview deployment
# Test at: https://triangle-simple-git-feature-branch.vercel.app

# 3. Production Deployment
git push origin main
# Vercel automatically deploys to production
# Live at: https://your-domain.com
```

**Manual Deployment:**

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## Current State Analysis

### ✅ What's Built and Working

**Core Business Logic:**
- USMCA compliance workflow (2-step process) ✅
- 6 professional services with AI + human hybrid model ✅
- Admin dashboards for Cristina (broker) and Jorge (B2B sales) ✅
- OpenRouter API integration for AI analysis ✅
- Supabase PostgreSQL with 34,476+ HS codes ✅

**Technical Infrastructure:**
- Next.js 14 Pages Router ✅
- Database schema with service_requests table ✅
- Authentication via localStorage (temporary) ✅
- Existing CSS framework (no Tailwind) ✅

### ❌ What's Missing (Critical Gaps)

**Foundation Issues:**
1. **Authentication**: localStorage-only (not production-ready)
2. **Session Management**: No JWT or secure session handling
3. **Database Persistence**: User data not saved to database
4. **API Standardization**: Inconsistent error handling

**Payment & Billing:**
5. **Stripe Integration**: Environment variables exist but no implementation
6. **Subscription Management**: No active subscription tracking
7. **Invoice Generation**: No invoice/receipt system
8. **Payment Webhooks**: No Stripe webhook handlers

**User Experience:**
9. **User Profile Page**: Missing `/profile` page
10. **Account Settings**: Missing `/account-settings` page
11. **Certificate Library**: Missing `/certificates` page to view past certificates
12. **Data Persistence**: Workflow data lost on page refresh
13. **Email Notifications**: No transactional emails

**Business Operations:**
14. **Service Purchase Flow**: No way for users to buy services
15. **Trial Management**: No trial expiration logic
16. **Admin Analytics**: Limited business intelligence

**Compliance & Polish:**
17. **Legal Pages**: Missing Terms of Service, Privacy Policy
18. **Error Handling**: Inconsistent user-facing error messages
19. **Performance Optimization**: No caching strategy
20. **Security Hardening**: No rate limiting, input validation gaps

---

## Staged Implementation Plan

### Dependency Overview

```
Stage 1 (Foundation - MUST DO FIRST)
├── Authentication & Sessions
├── Database Migrations
└── API Standardization
    ↓
Stage 2 (Payment - DEPENDS ON STAGE 1)
├── Stripe Integration
├── Subscription Management
└── Invoice Generation
    ↓
Stage 3 (UX - CAN PARALLELIZE WITH STAGE 2)
├── User Profile Pages
├── Data Persistence
└── Email Notifications
    ↓
Stage 4 (Business Operations - DEPENDS ON STAGES 1-3)
├── Service Purchase Flow
├── Trial Management
└── Admin Analytics
    ↓
Stage 5 (Polish - FINAL STAGE)
├── Legal Pages
├── Security Hardening
└── Performance Optimization
```

**Parallel Work Opportunities:**
- Stage 2 (Payment) and Stage 3 (UX) can be developed simultaneously by different developers
- Stage 5 tasks can be distributed across team members

---

## Stage 1: Foundation (Week 1-2)

### Overview

**Goal:** Build secure, production-ready authentication and database infrastructure that all other features depend on.

**Why This Stage Comes First:**
- Payment processing requires secure user sessions
- User profiles need database persistence
- Service purchases need authenticated API calls

**Estimated Time:** 60-80 hours

---

### Task 1.1: Implement JWT-Based Authentication

**Priority:** P0 (Blocking)
**Estimated Hours:** 12 hours
**Dependencies:** None

#### Vercel-Specific Considerations

**Key Consideration:** Vercel functions are stateless - use httpOnly cookies for session management.

**Serverless Authentication Pattern:**
- JWT tokens must be validated on **every request** (no server-side session storage)
- Cookies are the most secure option for Vercel serverless functions
- Token refresh mechanism ensures users stay logged in across function cold starts
- All auth logic server-side only (never expose JWT_SECRET to client)

#### Acceptance Criteria
- [ ] User can sign up with email/password
- [ ] User receives JWT token on login
- [ ] JWT token stored in httpOnly cookie (not localStorage)
- [ ] Token expires after 7 days
- [ ] Refresh token mechanism implemented
- [ ] Middleware validates JWT on protected routes

#### Implementation Steps

**Step 1: Install Dependencies**

```bash
npm install jsonwebtoken bcryptjs cookie
```

**Step 2: Create JWT Utility Library**

Create file: `lib/auth/jwt.js`

```javascript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

/**
 * Generate access token (7 days)
 */
export function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role || 'user'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Generate refresh token (30 days)
 */
export function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

/**
 * Verify access token
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}
```

**Step 3: Create Authentication Middleware**

Create file: `lib/middleware/authMiddleware.js`

```javascript
import { verifyAccessToken } from '../auth/jwt';

/**
 * Middleware to protect API routes
 * Usage: export default withAuth(handler);
 */
export function withAuth(handler) {
  return async (req, res) => {
    try {
      // Get token from cookies or Authorization header
      const token = req.cookies?.access_token ||
                   req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Verify token
      const decoded = verifyAccessToken(token);

      // Attach user to request
      req.user = decoded;

      // Call the actual handler
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  };
}

/**
 * Middleware to check for admin role
 */
export function withAdminAuth(handler) {
  return withAuth(async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    return handler(req, res);
  });
}
```

**Step 4: Update Login API**

Update file: `pages/api/auth/login.js`

```javascript
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { generateAccessToken, generateRefreshToken } from '../../../lib/auth/jwt';
import { serialize } from 'cookie';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user in database
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (dbError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set httpOnly cookies
    res.setHeader('Set-Cookie', [
      serialize('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      }),
      serialize('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/'
      })
    ]);

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Return user data (without password)
    const { password_hash, ...userData } = user;

    return res.status(200).json({
      success: true,
      user: userData,
      token: accessToken // For client-side storage if needed
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
```

**Step 5: Update Register API**

Update file: `pages/api/auth/register.js`

```javascript
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { generateAccessToken, generateRefreshToken } from '../../../lib/auth/jwt';
import { serialize } from 'cookie';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, company_name, full_name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        company_name: company_name || null,
        full_name: full_name || null,
        role: 'user',
        subscription_tier: 'trial',
        subscription_status: 'active',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days
      })
      .select()
      .single();

    if (createError) {
      console.error('Database error:', createError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create account'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Set httpOnly cookies
    res.setHeader('Set-Cookie', [
      serialize('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/'
      }),
      serialize('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/'
      })
    ]);

    // Return user data
    const { password_hash: _, ...userData } = newUser;

    return res.status(201).json({
      success: true,
      user: userData,
      token: accessToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
```

**Step 6: Create Token Refresh Endpoint**

Create file: `pages/api/auth/refresh.js`

```javascript
import { verifyRefreshToken, generateAccessToken } from '../../../lib/auth/jwt';
import { createClient } from '@supabase/supabase-js';
import { serialize } from 'cookie';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'No refresh token provided'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    // Set new access token cookie
    res.setHeader('Set-Cookie', serialize('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    }));

    return res.status(200).json({
      success: true,
      token: newAccessToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
}
```

**Step 7: Create Logout Endpoint**

Create file: `pages/api/auth/logout.js`

```javascript
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Clear cookies
  res.setHeader('Set-Cookie', [
    serialize('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    }),
    serialize('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })
  ]);

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
}
```

#### Testing Checklist

**Unit Tests:**
```bash
# Test JWT generation and verification
npm test lib/auth/jwt.test.js
```

**Integration Tests:**
1. Register new user → receives cookies → can access protected route
2. Login with valid credentials → receives JWT → dashboard accessible
3. Login with invalid credentials → receives 401 error
4. Access protected route without token → receives 401 error
5. Token expires → refresh token generates new access token
6. Logout → cookies cleared → cannot access protected routes

**Manual Testing:**
```bash
# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","company_name":"Test Co"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# Test protected route (replace TOKEN with actual JWT)
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer TOKEN"
```

#### Common Pitfalls

❌ **Pitfall 1:** Storing JWT in localStorage
✅ **Solution:** Use httpOnly cookies to prevent XSS attacks

❌ **Pitfall 2:** Not validating token on every request
✅ **Solution:** Use `withAuth` middleware consistently

❌ **Pitfall 3:** Exposing JWT_SECRET in client code
✅ **Solution:** Keep JWT operations server-side only

---

### Task 1.2: Database Migration - Users Table

**Priority:** P0 (Blocking)
**Estimated Hours:** 6 hours
**Dependencies:** None

#### Vercel + Supabase Connection Pattern

**Problem:** Vercel serverless functions create new database connections on every request.

**Solution:** Use Supabase's built-in connection pooling (automatically handled by Supabase client).

Create file: `lib/supabase-server.js`

```javascript
import { createClient } from '@supabase/supabase-js';

// Connection pooling enabled by default with Supabase client
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    // Use connection pooling endpoint
    db: {
      schema: 'public'
    }
  }
);

// For API routes that need user auth
export const supabaseServerWithAuth = (token) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
};
```

#### Acceptance Criteria
- [ ] Users table created in Supabase
- [ ] Email uniqueness constraint enforced
- [ ] Password hashing column added
- [ ] Subscription fields added
- [ ] Trial expiration tracking added

#### Implementation Steps

**Step 1: Create Users Table Migration**

Create file: `migrations/001_create_users_table.sql`

```sql
-- Create users table with complete structure
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Authentication
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,

    -- Profile
    full_name TEXT,
    company_name TEXT,
    phone TEXT,
    avatar_url TEXT,

    -- Role & Permissions
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'broker')),

    -- Subscription
    subscription_tier TEXT DEFAULT 'trial' CHECK (
        subscription_tier IN ('trial', 'professional', 'business', 'enterprise')
    ),
    subscription_status TEXT DEFAULT 'active' CHECK (
        subscription_status IN ('active', 'cancelled', 'expired', 'past_due')
    ),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,

    -- Usage Tracking
    workflow_completions INTEGER DEFAULT 0,
    certificates_generated INTEGER DEFAULT 0,
    service_purchases INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_trial_ends_at ON users(trial_ends_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE users IS 'User accounts with authentication and subscription management';
COMMENT ON COLUMN users.subscription_tier IS 'Current subscription plan level';
COMMENT ON COLUMN users.trial_ends_at IS 'When trial period expires (14 days from signup)';
```

**Step 2: Run Migration in Supabase**

```bash
# Option 1: Via Supabase Dashboard
# 1. Go to SQL Editor in Supabase Dashboard
# 2. Copy the migration SQL
# 3. Click "Run"

# Option 2: Via CLI
npx supabase db push
```

**Step 3: Create Row Level Security (RLS) Policies**

Create file: `migrations/002_users_rls_policies.sql`

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid()::text = id::text);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid()::text = id::text);

-- Policy: Admins can read all users
CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Policy: Only system can insert users (via service role)
-- No INSERT policy needed - handled by service role key
```

**Step 4: Verify Migration**

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users';
```

#### Testing Checklist

1. Create test user via register API
2. Verify user exists in database
3. Check email uniqueness constraint (try duplicate email)
4. Verify updated_at trigger fires on user update
5. Test RLS policies (user can only see own data)

---

### Task 1.3: Migrate LocalStorage Data to Database

**Priority:** P1 (High)
**Estimated Hours:** 10 hours
**Dependencies:** Task 1.1, Task 1.2

#### Acceptance Criteria
- [ ] USMCA workflow data saved to database
- [ ] Component origins persisted
- [ ] Results calculations saved
- [ ] Data survives page refresh
- [ ] Migration from localStorage handled gracefully

#### Implementation Steps

**Step 1: Create Workflow Data Table**

Create file: `migrations/003_workflow_data_table.sql`

```sql
CREATE TABLE IF NOT EXISTS workflow_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Session metadata
    session_key TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'in_progress' CHECK (
        status IN ('in_progress', 'completed', 'abandoned')
    ),

    -- Company information (Step 1)
    company_name TEXT,
    business_type TEXT,
    manufacturing_location TEXT,
    trade_volume DECIMAL,

    -- Product analysis (Step 2)
    product_description TEXT,
    hs_code TEXT,
    component_origins JSONB, -- Array of {country, percentage, component_type}

    -- Results data
    qualification_status TEXT, -- QUALIFIED, NOT_QUALIFIED, PARTIAL
    usmca_eligibility_score DECIMAL,
    regional_value_content DECIMAL,
    annual_tariff_cost DECIMAL,
    potential_usmca_savings DECIMAL,
    compliance_gaps TEXT[],
    vulnerability_factors TEXT[],

    -- Certificate data (if generated)
    certificate_id UUID,
    certificate_generated_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflow_sessions_user_id ON workflow_sessions(user_id);
CREATE INDEX idx_workflow_sessions_session_key ON workflow_sessions(session_key);
CREATE INDEX idx_workflow_sessions_status ON workflow_sessions(status);

-- Trigger for updated_at
CREATE TRIGGER update_workflow_sessions_updated_at
    BEFORE UPDATE ON workflow_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Step 2: Create API to Save Workflow Data**

Create file: `pages/api/workflow/save-session.js`

```javascript
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionData } = req.body;
    const userId = req.user.userId;

    // Generate session key (or use existing)
    const sessionKey = sessionData.sessionKey || `session_${Date.now()}_${userId}`;

    // Prepare data for database
    const workflowData = {
      user_id: userId,
      session_key: sessionKey,
      status: sessionData.status || 'in_progress',

      // Company info
      company_name: sessionData.company?.name,
      business_type: sessionData.company?.businessType,
      manufacturing_location: sessionData.company?.manufacturingLocation,
      trade_volume: sessionData.company?.tradeVolume,

      // Product analysis
      product_description: sessionData.product?.description,
      hs_code: sessionData.product?.hsCode,
      component_origins: sessionData.product?.componentOrigins || [],

      // Results (if available)
      qualification_status: sessionData.results?.qualificationStatus,
      usmca_eligibility_score: sessionData.results?.eligibilityScore,
      regional_value_content: sessionData.results?.regionalValueContent,
      annual_tariff_cost: sessionData.results?.annualTariffCost,
      potential_usmca_savings: sessionData.results?.potentialSavings,
      compliance_gaps: sessionData.results?.complianceGaps || [],
      vulnerability_factors: sessionData.results?.vulnerabilityFactors || [],

      last_accessed: new Date().toISOString()
    };

    // Upsert (insert or update)
    const { data, error } = await supabase
      .from('workflow_sessions')
      .upsert(workflowData, {
        onConflict: 'session_key',
        returning: 'minimal'
      });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save workflow data'
      });
    }

    return res.status(200).json({
      success: true,
      sessionKey
    });

  } catch (error) {
    console.error('Save workflow error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export default withAuth(handler);
```

**Step 3: Create API to Load Workflow Data**

Create file: `pages/api/workflow/load-session.js`

```javascript
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.user.userId;
    const { sessionKey } = req.query;

    let query = supabase
      .from('workflow_sessions')
      .select('*')
      .eq('user_id', userId);

    if (sessionKey) {
      // Load specific session
      query = query.eq('session_key', sessionKey).single();
    } else {
      // Load most recent session
      query = query
        .order('last_accessed', { ascending: false })
        .limit(1)
        .single();
    }

    const { data, error } = await query;

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to load workflow data'
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'No workflow session found'
      });
    }

    // Transform database format to application format
    const sessionData = {
      sessionKey: data.session_key,
      status: data.status,
      company: {
        name: data.company_name,
        businessType: data.business_type,
        manufacturingLocation: data.manufacturing_location,
        tradeVolume: data.trade_volume
      },
      product: {
        description: data.product_description,
        hsCode: data.hs_code,
        componentOrigins: data.component_origins
      },
      results: data.qualification_status ? {
        qualificationStatus: data.qualification_status,
        eligibilityScore: data.usmca_eligibility_score,
        regionalValueContent: data.regional_value_content,
        annualTariffCost: data.annual_tariff_cost,
        potentialSavings: data.potential_usmca_savings,
        complianceGaps: data.compliance_gaps,
        vulnerabilityFactors: data.vulnerability_factors
      } : null
    };

    return res.status(200).json({
      success: true,
      data: sessionData
    });

  } catch (error) {
    console.error('Load workflow error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export default withAuth(handler);
```

**Step 4: Update Workflow Components to Use Database**

Update file: `components/workflow/USMCAWorkflowOrchestrator.js`

Add this hook at the top of the component:

```javascript
import { useState, useEffect } from 'react';

// Add this inside your component
const [sessionKey, setSessionKey] = useState(null);

// Auto-save workflow data
useEffect(() => {
  const saveWorkflowData = async () => {
    if (!user) return; // Only save for authenticated users

    try {
      const response = await fetch('/api/workflow/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionData: {
            sessionKey,
            company: companyData,
            product: productData,
            results: resultsData,
            status: currentStep === 'results' ? 'completed' : 'in_progress'
          }
        })
      });

      const result = await response.json();
      if (result.success && !sessionKey) {
        setSessionKey(result.sessionKey);
      }
    } catch (error) {
      console.error('Failed to save workflow data:', error);
    }
  };

  // Debounce auto-save (save 2 seconds after changes stop)
  const timeoutId = setTimeout(saveWorkflowData, 2000);
  return () => clearTimeout(timeoutId);
}, [companyData, productData, resultsData, currentStep]);

// Load workflow data on mount
useEffect(() => {
  const loadWorkflowData = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/workflow/load-session');
      const result = await response.json();

      if (result.success && result.data) {
        setSessionKey(result.data.sessionKey);
        setCompanyData(result.data.company);
        setProductData(result.data.product);
        if (result.data.results) {
          setResultsData(result.data.results);
          setCurrentStep('results');
        }
      }
    } catch (error) {
      console.error('Failed to load workflow data:', error);
    }
  };

  loadWorkflowData();
}, [user]);
```

#### Testing Checklist

1. Complete Step 1 of workflow → verify data saved to database
2. Complete Step 2 → verify component origins saved
3. Refresh page → verify data restored from database
4. Complete workflow → verify status changes to 'completed'
5. Start new workflow → verify new session created

---

### Task 1.4: API Error Handling Standardization

**Priority:** P1 (High)
**Estimated Hours:** 8 hours
**Dependencies:** None

#### Acceptance Criteria
- [ ] All API routes return consistent error format
- [ ] HTTP status codes used correctly
- [ ] Error messages are user-friendly
- [ ] Errors logged for debugging
- [ ] Input validation applied consistently

#### Implementation Steps

**Step 1: Create Error Handler Utility**

Create file: `lib/api/errorHandler.js`

```javascript
/**
 * Standard API error response structure
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Error handler middleware for API routes
 */
export function handleApiError(error, req, res) {
  // Log error for debugging
  console.error(`API Error [${req.method} ${req.url}]:`, {
    message: error.message,
    stack: error.stack,
    details: error.details
  });

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Determine user-friendly message
  const userMessage = getUserFriendlyMessage(statusCode, error.message);

  // Return standardized error response
  return res.status(statusCode).json({
    success: false,
    error: userMessage,
    details: process.env.NODE_ENV === 'development' ? error.details : undefined,
    timestamp: new Date().toISOString()
  });
}

/**
 * Convert technical errors to user-friendly messages
 */
function getUserFriendlyMessage(statusCode, originalMessage) {
  const friendlyMessages = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'Authentication required. Please sign in to continue.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This resource already exists.',
    422: 'The provided data could not be processed.',
    429: 'Too many requests. Please try again later.',
    500: 'An unexpected error occurred. Our team has been notified.',
    503: 'Service temporarily unavailable. Please try again in a few minutes.'
  };

  // Return friendly message if available, otherwise return original
  return friendlyMessages[statusCode] || originalMessage || 'An error occurred';
}

/**
 * Validate required fields
 */
export function validateRequiredFields(data, requiredFields) {
  const missingFields = [];

  for (const field of requiredFields) {
    if (!data[field]) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new ApiError(
      `Missing required fields: ${missingFields.join(', ')}`,
      400,
      { missingFields }
    );
  }
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError('Invalid email format', 400);
  }
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/<script>/gi, '')
    .replace(/<\/script>/gi, '')
    .replace(/javascript:/gi, '');
}
```

**Step 2: Create API Route Wrapper**

Create file: `lib/api/apiHandler.js`

```javascript
import { handleApiError, ApiError } from './errorHandler';

/**
 * Wrapper for API routes with error handling
 *
 * Usage:
 * export default apiHandler({
 *   POST: async (req, res) => { ... }
 * });
 */
export function apiHandler(handlers) {
  return async (req, res) => {
    try {
      const handler = handlers[req.method];

      if (!handler) {
        throw new ApiError(`Method ${req.method} not allowed`, 405);
      }

      await handler(req, res);
    } catch (error) {
      handleApiError(error, req, res);
    }
  };
}

/**
 * Example protected API handler
 */
import { withAuth } from '../middleware/authMiddleware';

export function protectedApiHandler(handlers) {
  const wrappedHandlers = {};

  for (const [method, handler] of Object.entries(handlers)) {
    wrappedHandlers[method] = withAuth(handler);
  }

  return apiHandler(wrappedHandlers);
}
```

**Step 3: Example: Refactor Existing API Route**

Before (inconsistent error handling):

```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email required' });
  }

  try {
    // ... business logic
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
```

After (standardized error handling):

```javascript
import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields, validateEmail } from '../../../lib/api/errorHandler';

export default protectedApiHandler({
  POST: async (req, res) => {
    const { email, company_name } = req.body;

    // Validate required fields
    validateRequiredFields(req.body, ['email']);
    validateEmail(email);

    // Business logic
    const result = await processRequest(email, company_name);

    // Success response
    return res.status(200).json({
      success: true,
      data: result
    });
  }
});
```

#### Testing Checklist

1. Test API with missing required field → returns 400 with clear message
2. Test API with invalid email → returns 400 with validation error
3. Test unauthenticated request to protected route → returns 401
4. Test database error → returns 500 with generic message (no technical details exposed)
5. Verify error logs contain full technical details

---

### Stage 1 Success Criteria

**Before Moving to Stage 2, Verify:**

- [ ] User can register and login with JWT authentication
- [ ] JWT tokens stored in httpOnly cookies
- [ ] Protected API routes reject unauthenticated requests
- [ ] Workflow data persists to database
- [ ] Page refresh restores workflow data
- [ ] All API routes use standardized error handling
- [ ] Error messages are user-friendly
- [ ] No sensitive data exposed in error responses

**Performance Benchmarks:**
- Login API response: < 500ms
- Workflow save API: < 300ms
- Workflow load API: < 200ms

**Deployment Checklist:**
- [ ] Environment variables configured on production server
- [ ] Database migrations run on production database
- [ ] JWT_SECRET is a strong random string (not default)
- [ ] HTTPS enabled for production (httpOnly cookies require it)

---

## Stage 2: Payment & Billing (Week 3-4)

### Overview

**Goal:** Implement Stripe payment processing, subscription management, and invoice generation.

**Why This Stage Comes Now:**
- Requires secure authentication (Stage 1)
- Enables service purchase flow (needed for Stage 4)
- Independent from UX improvements (can parallelize with Stage 3)

**Estimated Time:** 60-70 hours

---

### Task 2.1: Stripe Checkout Integration

**Priority:** P0 (Blocking)
**Estimated Hours:** 16 hours
**Dependencies:** Stage 1 complete

#### Acceptance Criteria
- [ ] User can initiate Stripe checkout for subscriptions
- [ ] User redirected to Stripe hosted page
- [ ] Successful payment creates/updates subscription in database
- [ ] User redirected back to success page with confirmation
- [ ] Failed payment shows error message

#### Implementation Steps

**Step 1: Install Stripe SDK**

```bash
npm install stripe @stripe/stripe-js
```

**Step 2: Create Stripe Client Utility**

Create file: `lib/stripe/client.js`

```javascript
import { loadStripe } from '@stripe/stripe-js';

let stripePromise;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};
```

**Step 3: Create Stripe Server Utility**

Create file: `lib/stripe/server.js`

```javascript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: false
});

/**
 * Stripe price IDs for each subscription tier
 * Create these in Stripe Dashboard → Products
 */
export const STRIPE_PRICES = {
  professional: {
    monthly: 'price_professional_monthly', // Replace with actual Stripe price ID
    annual: 'price_professional_annual'
  },
  business: {
    monthly: 'price_business_monthly',
    annual: 'price_business_annual'
  },
  enterprise: {
    monthly: 'price_enterprise_monthly',
    annual: 'price_enterprise_annual'
  }
};

/**
 * Get or create Stripe customer for user
 */
export async function getOrCreateStripeCustomer(user) {
  // If user already has Stripe customer ID, return it
  if (user.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.full_name || user.company_name,
    metadata: {
      user_id: user.id
    }
  });

  return customer.id;
}
```

**Step 4: Create Checkout Session API**

Create file: `pages/api/stripe/create-checkout-session.js`

```javascript
import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields } from '../../../lib/api/errorHandler';
import { stripe, STRIPE_PRICES, getOrCreateStripeCustomer } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  POST: async (req, res) => {
    const { tier, billing_period } = req.body;
    const userId = req.user.userId;

    // Validate input
    validateRequiredFields(req.body, ['tier', 'billing_period']);

    if (!['professional', 'business', 'enterprise'].includes(tier)) {
      throw new ApiError('Invalid subscription tier', 400);
    }

    if (!['monthly', 'annual'].includes(billing_period)) {
      throw new ApiError('Invalid billing period', 400);
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new ApiError('User not found', 404);
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user);

    // Save Stripe customer ID if new
    if (!user.stripe_customer_id) {
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Get price ID
    const priceId = STRIPE_PRICES[tier][billing_period];

    if (!priceId) {
      throw new ApiError('Subscription plan not available', 400);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
      metadata: {
        user_id: userId,
        tier: tier,
        billing_period: billing_period
      }
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  }
});
```

**Step 5: Create Pricing Page with Checkout Buttons**

Create file: `pages/pricing.js` (or update existing)

```javascript
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getStripe } from '../lib/stripe/client';

const PLANS = [
  {
    tier: 'professional',
    name: 'Professional',
    price: { monthly: 99, annual: 990 },
    features: [
      'Unlimited USMCA analyses',
      '10 certificates/month',
      'Email support',
      'Basic reporting'
    ]
  },
  {
    tier: 'business',
    name: 'Business',
    price: { monthly: 299, annual: 2990 },
    features: [
      'Everything in Professional',
      'Unlimited certificates',
      'Priority support',
      'Advanced analytics',
      'API access'
    ],
    popular: true
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: { monthly: 599, annual: 5990 },
    features: [
      'Everything in Business',
      'Dedicated account manager',
      'Custom integrations',
      'White-label options',
      'SLA guarantee'
    ]
  }
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [loading, setLoading] = useState(null);
  const router = useRouter();

  const handleCheckout = async (tier) => {
    setLoading(tier);

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, billing_period: billingPeriod })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // Redirect to Stripe checkout
      const stripe = await getStripe();
      await stripe.redirectToCheckout({ sessionId: data.sessionId });

    } catch (error) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to start checkout process');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Head>
        <title>Pricing - Triangle Intelligence</title>
      </Head>

      <div className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">Choose Your Plan</h1>
            <p className="section-header-subtitle">
              14-day free trial on all plans. No credit card required.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="billing-toggle">
            <button
              className={billingPeriod === 'monthly' ? 'active' : ''}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </button>
            <button
              className={billingPeriod === 'annual' ? 'active' : ''}
              onClick={() => setBillingPeriod('annual')}
            >
              Annual (Save 17%)
            </button>
          </div>

          {/* Plans grid */}
          <div className="pricing-grid">
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                className={`pricing-card ${plan.popular ? 'popular' : ''}`}
              >
                {plan.popular && <div className="popular-badge">Most Popular</div>}

                <h3 className="plan-name">{plan.name}</h3>

                <div className="plan-price">
                  <span className="currency">$</span>
                  <span className="amount">{plan.price[billingPeriod]}</span>
                  <span className="period">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                </div>

                <ul className="feature-list">
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>

                <button
                  className="btn-primary"
                  onClick={() => handleCheckout(plan.tier)}
                  disabled={loading === plan.tier}
                >
                  {loading === plan.tier ? 'Processing...' : 'Start Free Trial'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
```

**Step 6: Create Success Page**

Create file: `pages/subscription/success.js`

```javascript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'head';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session_id) return;

    // Verify session was successful
    const verifySession = async () => {
      try {
        const response = await fetch(`/api/stripe/verify-session?session_id=${session_id}`);
        const data = await response.json();

        if (!data.success) {
          setError('Payment verification failed');
        }
      } catch (err) {
        setError('Failed to verify payment');
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [session_id]);

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="hero-badge">Verifying payment...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">Payment Error</h1>
            <p className="section-header-subtitle">{error}</p>
            <Link href="/pricing" className="btn-primary">
              Return to Pricing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Subscription Activated - Triangle Intelligence</title>
      </Head>

      <div className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">Welcome Aboard! 🎉</h1>
            <p className="section-header-subtitle">
              Your subscription has been activated successfully.
            </p>

            <div className="success-actions">
              <Link href="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
              <Link href="/usmca-workflow" className="btn-secondary">
                Start USMCA Analysis
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
```

#### Testing Checklist

1. Click "Start Free Trial" button → redirects to Stripe checkout
2. Complete payment with test card (4242 4242 4242 4242) → success page shown
3. Check database → user subscription updated
4. Test card decline (4000 0000 0000 0002) → error handled gracefully
5. Test cancelled checkout → returns to pricing page

**Stripe Test Cards:**
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Requires 3D Secure: 4000 0025 0000 3155

---

### Task 2.2: Stripe Webhook Handler

**Priority:** P0 (Blocking)
**Estimated Hours:** 12 hours
**Dependencies:** Task 2.1

#### Vercel + Stripe Webhook Configuration

**Critical:** Vercel webhook endpoints must be publicly accessible and properly configured.

**Production Webhook URL:**
```
https://your-domain.vercel.app/api/stripe/webhook
```

**Stripe Dashboard Setup:**
1. Go to Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to Vercel environment variables

**Testing Webhooks Locally:**
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test webhook
stripe trigger checkout.session.completed
```

#### Acceptance Criteria
- [ ] Webhook endpoint receives Stripe events
- [ ] Subscription created event updates database
- [ ] Subscription cancelled event updates database
- [ ] Payment failed event sends notification
- [ ] Webhook signature verified for security

#### Implementation Steps

**Step 1: Create Webhook Endpoint**

Create file: `pages/api/stripe/webhook.js`

```javascript
import { buffer } from 'micro';
import { stripe } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Disable body parsing for webhooks
export const config = {
  api: {
    bodyParser: false
  }
};

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw body
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(buf, sig, WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle event
    console.log(`Received Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session) {
  const userId = session.metadata.user_id;
  const tier = session.metadata.tier;

  await supabase
    .from('users')
    .update({
      subscription_tier: tier,
      subscription_status: 'active',
      stripe_subscription_id: session.subscription,
      trial_ends_at: null, // Clear trial
      subscription_ends_at: null
    })
    .eq('id', userId);

  console.log(`Subscription activated for user ${userId}`);
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdate(subscription) {
  const customerId = subscription.customer;

  // Find user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  // Update subscription status
  const status = subscription.status; // active, past_due, cancelled, etc.
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await supabase
    .from('users')
    .update({
      subscription_status: status,
      subscription_ends_at: currentPeriodEnd.toISOString(),
      stripe_subscription_id: subscription.id
    })
    .eq('id', user.id);

  console.log(`Subscription updated for user ${user.id}: ${status}`);
}

/**
 * Handle subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) return;

  await supabase
    .from('users')
    .update({
      subscription_status: 'cancelled',
      subscription_ends_at: new Date(subscription.ended_at * 1000).toISOString()
    })
    .eq('id', user.id);

  // TODO: Send cancellation email
  console.log(`Subscription cancelled for user ${user.id}`);
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice) {
  console.log(`Payment succeeded: ${invoice.id}`);
  // TODO: Send receipt email
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;

  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) return;

  // Update subscription to past_due
  await supabase
    .from('users')
    .update({ subscription_status: 'past_due' })
    .eq('id', user.id);

  // TODO: Send payment failed email
  console.log(`Payment failed for user ${user.id}`);
}
```

**Step 2: Configure Webhook in Stripe Dashboard**

```bash
# Development: Use Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Production: Configure in Stripe Dashboard
# 1. Go to Developers → Webhooks
# 2. Add endpoint: https://yourdomain.com/api/stripe/webhook
# 3. Select events:
#    - checkout.session.completed
#    - customer.subscription.created
#    - customer.subscription.updated
#    - customer.subscription.deleted
#    - invoice.payment_succeeded
#    - invoice.payment_failed
# 4. Copy webhook signing secret to .env as STRIPE_WEBHOOK_SECRET
```

**Step 3: Add Webhook Secret to Environment**

Add to `.env.local`:

```bash
# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
```

#### Testing Checklist

1. Use Stripe CLI to test webhook locally:
   ```bash
   stripe trigger checkout.session.completed
   ```
2. Verify user subscription updated in database
3. Test subscription cancellation → status changes to 'cancelled'
4. Test payment failed → status changes to 'past_due'
5. Verify webhook signature validation (try invalid signature)

---

### Task 2.3: Subscription Management Dashboard

**Priority:** P1 (High)
**Estimated Hours:** 10 hours
**Dependencies:** Task 2.1, Task 2.2

#### Acceptance Criteria
- [ ] User can view current subscription details
- [ ] User can see billing history
- [ ] User can cancel subscription
- [ ] User can update payment method
- [ ] User can download invoices

#### Implementation Steps

**Step 1: Create Subscription API Routes**

Create file: `pages/api/user/subscription.js`

```javascript
import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { stripe } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.userId;

    // Get user subscription data
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_tier, subscription_status, subscription_ends_at, stripe_customer_id, stripe_subscription_id, trial_ends_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new ApiError('User not found', 404);
    }

    // If user has Stripe subscription, get details
    let stripeSubscription = null;
    if (user.stripe_subscription_id) {
      stripeSubscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
    }

    return res.status(200).json({
      success: true,
      subscription: {
        tier: user.subscription_tier,
        status: user.subscription_status,
        endsAt: user.subscription_ends_at,
        trialEndsAt: user.trial_ends_at,
        cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end,
        currentPeriodEnd: stripeSubscription?.current_period_end
          ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
          : null
      }
    });
  }
});
```

Create file: `pages/api/user/cancel-subscription.js`

```javascript
import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { stripe } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.userId;

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (!user || !user.stripe_subscription_id) {
      throw new ApiError('No active subscription found', 404);
    }

    // Cancel subscription at period end (don't cancel immediately)
    const subscription = await stripe.subscriptions.update(
      user.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
      cancelAt: new Date(subscription.current_period_end * 1000).toISOString()
    });
  }
});
```

**Step 2: Create Account Settings Page**

Create file: `pages/account-settings.js`

```javascript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function AccountSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      const data = await response.json();

      if (data.success) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      const response = await fetch('/api/user/cancel-subscription', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        alert('Subscription will be cancelled at the end of the billing period');
        loadSubscriptionData();
      } else {
        alert(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="hero-badge">Loading account settings...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Account Settings - Triangle Intelligence</title>
      </Head>

      <div className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">Account Settings</h1>
          </div>

          {/* Subscription Section */}
          <div className="settings-section">
            <h2 className="section-title">Subscription</h2>

            {subscription && (
              <div className="subscription-card">
                <div className="subscription-info">
                  <div className="info-row">
                    <span className="label">Plan:</span>
                    <span className="value">{subscription.tier}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Status:</span>
                    <span className={`value status-${subscription.status}`}>
                      {subscription.status}
                    </span>
                  </div>
                  {subscription.currentPeriodEnd && (
                    <div className="info-row">
                      <span className="label">Renews:</span>
                      <span className="value">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="subscription-actions">
                  <Link href="/pricing" className="btn-secondary">
                    Change Plan
                  </Link>

                  {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                    <button
                      onClick={handleCancelSubscription}
                      className="btn-danger"
                    >
                      Cancel Subscription
                    </button>
                  )}

                  {subscription.cancelAtPeriodEnd && (
                    <div className="cancellation-notice">
                      Your subscription will be cancelled on{' '}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
```

#### Testing Checklist

1. View subscription details → displays correctly
2. Click "Cancel Subscription" → cancellation scheduled
3. Verify cancellation shows in UI
4. Wait for webhook → subscription status updates in database

---

## Stage 2 Success Criteria

**Before Moving to Stage 3, Verify:**

- [ ] User can complete checkout process
- [ ] Stripe webhooks update database correctly
- [ ] User can view subscription details
- [ ] User can cancel subscription
- [ ] Payment failures handled gracefully
- [ ] All Stripe operations logged

**Performance Benchmarks:**
- Checkout session creation: < 1000ms
- Webhook processing: < 500ms

---

## Stage 3: User Experience (Week 5-6)

### Overview

**Goal:** Build user profile pages, improve data persistence, and implement email notifications.

**Why This Stage Now:**
- Can be developed in parallel with Stage 2
- Improves user retention
- Foundation for Stage 4 business operations

**Estimated Time:** 50-60 hours

---

### Task 3.1: User Profile Page

**Priority:** P1 (High)
**Estimated Hours:** 12 hours
**Dependencies:** Stage 1 complete

#### Acceptance Criteria
- [ ] User can view profile at `/profile`
- [ ] User can edit name, company, phone
- [ ] User can upload avatar image
- [ ] User can change password
- [ ] Changes saved to database

#### Implementation Steps

**Step 1: Create Profile API**

Create file: `pages/api/user/profile.js`

```javascript
import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields, sanitizeInput } from '../../../lib/api/errorHandler';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.userId;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, company_name, phone, avatar_url, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new ApiError('User not found', 404);
    }

    return res.status(200).json({
      success: true,
      user
    });
  },

  PATCH: async (req, res) => {
    const userId = req.user.userId;
    const { full_name, company_name, phone, current_password, new_password } = req.body;

    // Sanitize inputs
    const updates = {};
    if (full_name) updates.full_name = sanitizeInput(full_name);
    if (company_name) updates.company_name = sanitizeInput(company_name);
    if (phone) updates.phone = sanitizeInput(phone);

    // Handle password change
    if (new_password) {
      if (!current_password) {
        throw new ApiError('Current password required to change password', 400);
      }

      // Verify current password
      const { data: user } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
      if (!isValidPassword) {
        throw new ApiError('Current password is incorrect', 401);
      }

      // Hash new password
      updates.password_hash = await bcrypt.hash(new_password, 10);
    }

    // Update database
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, email, full_name, company_name, phone, avatar_url')
      .single();

    if (error) {
      throw new ApiError('Failed to update profile', 500);
    }

    return res.status(200).json({
      success: true,
      user: data
    });
  }
});
```

**Step 2: Create Avatar Upload API**

Create file: `pages/api/user/upload-avatar.js`

```javascript
import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false
  }
};

export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.userId;

    // Parse multipart form data
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowEmptyFiles: false
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: 'Failed to upload file'
        });
      }

      const file = files.avatar;
      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided'
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, and GIF allowed.'
        });
      }

      try {
        // Read file
        const fileBuffer = fs.readFileSync(file.filepath);
        const fileName = `avatars/${userId}_${Date.now()}.${file.mimetype.split('/')[1]}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('user-avatars')
          .upload(fileName, fileBuffer, {
            contentType: file.mimetype,
            upsert: true
          });

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('user-avatars')
          .getPublicUrl(fileName);

        // Update user avatar_url
        await supabase
          .from('users')
          .update({ avatar_url: urlData.publicUrl })
          .eq('id', userId);

        return res.status(200).json({
          success: true,
          avatarUrl: urlData.publicUrl
        });

      } catch (error) {
        console.error('Avatar upload error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload avatar'
        });
      }
    });
  }
});
```

**Step 3: Create Profile Page Component**

Create file: `pages/profile.js`

```javascript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setFormData({
          full_name: data.user.full_name || '',
          company_name: data.user.company_name || '',
          phone: data.user.phone || '',
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        setAvatarPreview(data.user.avatar_url);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload avatar if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const uploadResponse = await fetch('/api/user/upload-avatar', {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadResponse.json();
        if (!uploadData.success) {
          throw new Error('Failed to upload avatar');
        }
      }

      // Update profile
      const updateData = {
        full_name: formData.full_name,
        company_name: formData.company_name,
        phone: formData.phone
      };

      // Include password change if provided
      if (formData.new_password) {
        if (formData.new_password !== formData.confirm_password) {
          alert('New passwords do not match');
          setSaving(false);
          return;
        }
        updateData.current_password = formData.current_password;
        updateData.new_password = formData.new_password;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Profile updated successfully');
        setFormData(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: ''
        }));
        loadProfile();
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="hero-badge">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Profile - Triangle Intelligence</title>
      </Head>

      <div className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">My Profile</h1>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            {/* Avatar Section */}
            <div className="form-section">
              <h2 className="section-title">Profile Picture</h2>
              <div className="avatar-upload">
                <div className="avatar-preview">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="avatar-image" />
                  ) : (
                    <div className="avatar-placeholder">
                      {user?.full_name?.[0] || user?.email?.[0] || '?'}
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="file-input"
                />
              </div>
            </div>

            {/* Personal Information */}
            <div className="form-section">
              <h2 className="section-title">Personal Information</h2>

              <div className="form-group">
                <label htmlFor="full_name" className="form-label">Full Name</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="company_name" className="form-label">Company Name</label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="form-input disabled"
                />
                <p className="form-hint">Email cannot be changed</p>
              </div>
            </div>

            {/* Change Password */}
            <div className="form-section">
              <h2 className="section-title">Change Password</h2>

              <div className="form-group">
                <label htmlFor="current_password" className="form-label">Current Password</label>
                <input
                  type="password"
                  id="current_password"
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="new_password" className="form-label">New Password</label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm_password" className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
```

#### Testing Checklist

1. Navigate to `/profile` → loads user data
2. Edit name and save → changes persisted
3. Upload avatar image → image displayed
4. Change password → can login with new password
5. Try wrong current password → error shown

---

## Stage 4: Business Operations (Week 7-8)

### Overview

**Goal:** Implement service purchase flow, trial management, admin analytics, and revenue reporting to complete the business operations layer.

**Why This Stage Now:**
- Payment infrastructure from Stage 2 is ready
- User profiles from Stage 3 provide customer data
- Professional services can now be monetized
- Admin team needs operational dashboards

**Estimated Time:** 55-65 hours

---

### Task 4.1: Service Purchase Flow

**Priority:** P0 (Blocking)
**Estimated Hours:** 15 hours
**Dependencies:** Stage 2 complete (Stripe integration)

#### Acceptance Criteria
- [ ] User can select professional service from `/services/logistics-support`
- [ ] User proceeds to Stripe checkout for service purchase
- [ ] Service request saved to `service_requests` table
- [ ] Admin receives notification of new service request
- [ ] User sees confirmation page with service details

#### Implementation Steps

**Step 1: Create Service Selection API**

Create file: `pages/api/services/create-request.js`

```javascript
import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields } from '../../../lib/api/errorHandler';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Service pricing configuration
const SERVICE_PRICING = {
  'usmca-certificates': { price: 250, name: 'USMCA Certificate Generation' },
  'hs-classification': { price: 200, name: 'HS Code Classification' },
  'crisis-response': { price: 500, name: 'Crisis Response Service' },
  'supplier-sourcing': { price: 450, name: 'Mexico Supplier Sourcing' },
  'manufacturing-feasibility': { price: 650, name: 'Manufacturing Feasibility Analysis' },
  'market-entry': { price: 550, name: 'Mexico Market Entry Strategy' }
};

export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.userId;
    const { service_type, subscriber_data } = req.body;

    // Validation
    validateRequiredFields({ service_type, subscriber_data }, ['service_type', 'subscriber_data']);

    if (!SERVICE_PRICING[service_type]) {
      throw new ApiError('Invalid service type', 400);
    }

    const servicePricing = SERVICE_PRICING[service_type];

    try {
      // Create service request in database (PENDING until payment confirmed)
      const { data: serviceRequest, error: dbError } = await supabase
        .from('service_requests')
        .insert({
          user_id: userId,
          client_company: subscriber_data.company_name || 'Unknown',
          service_type: service_type,
          status: 'pending_payment',
          price: servicePricing.price,
          subscriber_data: subscriber_data
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new ApiError('Failed to create service request', 500);
      }

      // Create Stripe Checkout session for service purchase
      const session = await stripe.checkout.sessions.create({
        customer_email: req.user.email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: servicePricing.name,
                description: `Professional ${servicePricing.name} service`,
              },
              unit_amount: servicePricing.price * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/services/confirmation?session_id={CHECKOUT_SESSION_ID}&service_request_id=${serviceRequest.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/services/logistics-support`,
        metadata: {
          user_id: userId,
          service_request_id: serviceRequest.id,
          service_type: service_type,
          type: 'service_purchase'
        }
      });

      return res.status(200).json({
        success: true,
        checkout_url: session.url,
        service_request_id: serviceRequest.id
      });

    } catch (error) {
      console.error('Service purchase error:', error);
      throw new ApiError(error.message || 'Failed to create service purchase', 500);
    }
  }
});
```

**Step 2: Update Stripe Webhook to Handle Service Payments**

Update file: `pages/api/stripe/webhook.js`

Add this handler after subscription handlers:

```javascript
// Add to the webhook handler switch statement
case 'checkout.session.completed': {
  const session = event.data.object;

  // Check if this is a service purchase (not subscription)
  if (session.metadata.type === 'service_purchase') {
    const { user_id, service_request_id, service_type } = session.metadata;

    // Update service request status to 'pending' (awaiting admin action)
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({
        status: 'pending',
        stripe_payment_intent: session.payment_intent,
        paid_at: new Date().toISOString()
      })
      .eq('id', service_request_id);

    if (updateError) {
      console.error('Failed to update service request:', updateError);
    }

    // Send notification to admin (implement notification system)
    await sendAdminNotification({
      type: 'new_service_request',
      service_type,
      service_request_id,
      user_id
    });

    console.log(`Service purchase completed: ${service_request_id}`);
  }

  break;
}
```

**Step 3: Create Service Confirmation Page**

Create file: `pages/services/confirmation.js`

```javascript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function ServiceConfirmation() {
  const router = useRouter();
  const { session_id, service_request_id } = router.query;
  const [loading, setLoading] = useState(true);
  const [serviceData, setServiceData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session_id && service_request_id) {
      verifyPayment();
    }
  }, [session_id, service_request_id]);

  const verifyPayment = async () => {
    try {
      const response = await fetch('/api/services/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ session_id, service_request_id })
      });

      const data = await response.json();

      if (data.success) {
        setServiceData(data.service);
      } else {
        setError(data.error || 'Payment verification failed');
      }
    } catch (err) {
      setError('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ marginTop: '4rem', textAlign: 'center' }}>
          <h2>Verifying your payment...</h2>
          <p className="text-body">Please wait while we confirm your service purchase.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card" style={{ marginTop: '4rem' }}>
          <h2 style={{ color: '#dc2626' }}>Payment Verification Failed</h2>
          <p className="text-body">{error}</p>
          <Link href="/services/logistics-support">
            <a className="btn-primary">Return to Services</a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Service Purchase Confirmed - Triangle Intelligence</title>
      </Head>

      <div className="container">
        <div className="card" style={{ marginTop: '4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', color: '#16a34a' }}>✓</div>
            <h1>Service Purchase Confirmed!</h1>
          </div>

          <div className="card" style={{ background: '#f9fafb', padding: '1.5rem' }}>
            <h3 className="card-title">Order Details</h3>
            <div style={{ marginTop: '1rem' }}>
              <p className="text-body">
                <strong>Service:</strong> {serviceData?.service_type}
              </p>
              <p className="text-body">
                <strong>Price:</strong> ${serviceData?.price}
              </p>
              <p className="text-body">
                <strong>Status:</strong> Pending Expert Review
              </p>
              <p className="text-body">
                <strong>Order ID:</strong> {serviceData?.id}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3 className="card-title">What Happens Next?</h3>
            <ol style={{ paddingLeft: '1.5rem' }}>
              <li className="text-body" style={{ marginBottom: '0.5rem' }}>
                Our expert team has been notified of your service request
              </li>
              <li className="text-body" style={{ marginBottom: '0.5rem' }}>
                You'll receive an email within 24 hours with next steps
              </li>
              <li className="text-body" style={{ marginBottom: '0.5rem' }}>
                Track your service progress in your dashboard
              </li>
              <li className="text-body" style={{ marginBottom: '0.5rem' }}>
                Receive your completed deliverable within 5-7 business days
              </li>
            </ol>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link href="/profile">
              <a className="btn-primary">View My Dashboard</a>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
```

**Step 4: Create Payment Verification API**

Create file: `pages/api/services/verify-payment.js`

```javascript
import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.userId;
    const { session_id, service_request_id } = req.body;

    try {
      // Verify Stripe session
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status !== 'paid') {
        throw new ApiError('Payment not completed', 400);
      }

      // Fetch service request
      const { data: service, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', service_request_id)
        .eq('user_id', userId)
        .single();

      if (error || !service) {
        throw new ApiError('Service request not found', 404);
      }

      return res.status(200).json({
        success: true,
        service
      });

    } catch (error) {
      console.error('Payment verification error:', error);
      throw new ApiError(error.message || 'Failed to verify payment', 500);
    }
  }
});
```

#### Testing Checklist

1. Select service from services page → Stripe checkout opens
2. Complete payment with test card (4242 4242 4242 4242) → Success
3. Redirected to confirmation page → Order details shown
4. Check database → service_request has status 'pending'
5. Admin dashboard shows new service request → Notification received

#### Common Pitfalls

1. **Webhook not updating status:** Ensure webhook is deployed and registered with Stripe
2. **Metadata missing:** Always include service_request_id and type='service_purchase' in checkout session
3. **Payment verification fails:** Check that Stripe session_id matches database record

---

### Task 4.2: Trial Management System

**Priority:** P1 (High)
**Estimated Hours:** 12 hours
**Dependencies:** Stage 1 complete

#### Acceptance Criteria
- [ ] New users automatically get 14-day trial
- [ ] Trial expiration checked on every protected API call
- [ ] User sees trial status on dashboard
- [ ] Trial expired users redirected to upgrade page
- [ ] Cron job or scheduled function checks expired trials daily

#### Implementation Steps

**Step 1: Add Trial Tracking to Users Table**

Run this SQL migration in Supabase:

```sql
-- Add trial tracking columns to users table
ALTER TABLE users
ADD COLUMN trial_start_date TIMESTAMPTZ,
ADD COLUMN trial_end_date TIMESTAMPTZ,
ADD COLUMN trial_used BOOLEAN DEFAULT false;

-- Set trial dates for existing users (backfill)
UPDATE users
SET
  trial_start_date = created_at,
  trial_end_date = created_at + INTERVAL '14 days',
  trial_used = (subscription_status IS NOT NULL)
WHERE trial_start_date IS NULL;

-- Create index for trial queries
CREATE INDEX idx_users_trial_end ON users(trial_end_date)
WHERE trial_used = true AND subscription_status IS NULL;
```

**Step 2: Update Registration to Set Trial**

Update file: `pages/api/auth/register.js`

Add trial dates to user creation:

```javascript
// In the INSERT statement, add:
const { data: user, error: insertError } = await supabase
  .from('users')
  .insert({
    email: sanitizedEmail,
    password_hash: hashedPassword,
    full_name: sanitizeInput(full_name),
    role: 'user',
    trial_start_date: new Date().toISOString(),
    trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    trial_used: false
  })
  .select('id, email, full_name, role, trial_end_date')
  .single();
```

**Step 3: Create Trial Status Check Middleware**

Create file: `lib/auth/trialMiddleware.js`

```javascript
import { ApiError } from '../api/errorHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Check if user has active subscription or valid trial
 */
export async function checkTrialStatus(userId) {
  const { data: user, error } = await supabase
    .from('users')
    .select('subscription_status, trial_end_date, trial_used')
    .eq('id', userId)
    .single();

  if (error) {
    throw new ApiError('Failed to check user status', 500);
  }

  // If user has active subscription, they're good
  if (user.subscription_status === 'active') {
    return { hasAccess: true, type: 'subscription' };
  }

  // Check trial status
  const now = new Date();
  const trialEnd = new Date(user.trial_end_date);

  if (!user.trial_used && now <= trialEnd) {
    const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    return {
      hasAccess: true,
      type: 'trial',
      daysRemaining,
      trialEndDate: user.trial_end_date
    };
  }

  // Trial expired and no subscription
  return { hasAccess: false, type: 'expired' };
}

/**
 * Middleware to protect routes that require subscription or trial
 */
export function requireActiveAccess(handler) {
  return async (req, res) => {
    const userId = req.user.userId;

    const accessStatus = await checkTrialStatus(userId);

    if (!accessStatus.hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Trial expired. Please subscribe to continue.',
        requiresUpgrade: true
      });
    }

    // Attach trial info to request for handler to use
    req.accessStatus = accessStatus;

    return handler(req, res);
  };
}
```

**Step 4: Create Trial Status API**

Create file: `pages/api/user/trial-status.js`

```javascript
import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { checkTrialStatus } from '../../../lib/auth/trialMiddleware';

export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.userId;
    const accessStatus = await checkTrialStatus(userId);

    return res.status(200).json({
      success: true,
      ...accessStatus
    });
  }
});
```

**Step 5: Add Trial Banner to Dashboard**

Update file: `pages/profile.js`

Add this component at the top:

```javascript
function TrialBanner({ trialStatus }) {
  if (trialStatus.type !== 'trial') return null;

  return (
    <div className="card" style={{
      background: trialStatus.daysRemaining <= 3 ? '#fef2f2' : '#eff6ff',
      border: `1px solid ${trialStatus.daysRemaining <= 3 ? '#fca5a5' : '#93c5fd'}`,
      marginBottom: '1.5rem'
    }}>
      <h3 className="card-title">
        {trialStatus.daysRemaining <= 3 ? '⚠️ Trial Ending Soon' : '🎉 Free Trial Active'}
      </h3>
      <p className="text-body">
        You have <strong>{trialStatus.daysRemaining} days</strong> remaining in your free trial.
      </p>
      <Link href="/pricing">
        <a className="btn-primary" style={{ marginTop: '1rem' }}>
          Upgrade to Pro
        </a>
      </Link>
    </div>
  );
}

// In the Profile component, add:
const [trialStatus, setTrialStatus] = useState(null);

useEffect(() => {
  async function fetchTrialStatus() {
    const res = await fetch('/api/user/trial-status', { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setTrialStatus(data);
    }
  }
  fetchTrialStatus();
}, []);

// Render the banner:
return (
  <>
    <Head>
      <title>Profile - Triangle Intelligence</title>
    </Head>
    <div className="container">
      {trialStatus && <TrialBanner trialStatus={trialStatus} />}
      {/* Rest of profile content */}
    </div>
  </>
);
```

**Step 6: Create Daily Trial Expiration Cron (Vercel Cron)**

Create file: `pages/api/cron/check-expired-trials.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Vercel Cron Job - runs daily at midnight UTC
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-expired-trials",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized calls
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date().toISOString();

    // Find users with expired trials and no subscription
    const { data: expiredUsers, error } = await supabase
      .from('users')
      .select('id, email, full_name, trial_end_date')
      .lt('trial_end_date', now)
      .eq('trial_used', false)
      .is('subscription_status', null);

    if (error) {
      console.error('Query error:', error);
      return res.status(500).json({ error: 'Database query failed' });
    }

    console.log(`Found ${expiredUsers.length} expired trials`);

    // Mark trials as used
    if (expiredUsers.length > 0) {
      const userIds = expiredUsers.map(u => u.id);

      const { error: updateError } = await supabase
        .from('users')
        .update({ trial_used: true })
        .in('id', userIds);

      if (updateError) {
        console.error('Update error:', updateError);
      }

      // Send expiration emails (implement email service)
      for (const user of expiredUsers) {
        await sendTrialExpirationEmail(user);
      }
    }

    return res.status(200).json({
      success: true,
      processedCount: expiredUsers.length
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({ error: 'Cron execution failed' });
  }
}

async function sendTrialExpirationEmail(user) {
  // Implement with Resend, SendGrid, or other email service
  console.log(`Would send trial expiration email to ${user.email}`);
  // TODO: Integrate with email service
}
```

**Step 7: Configure Vercel Cron**

Update file: `vercel.json`

Add cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-expired-trials",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Add to `.env.local`:

```env
CRON_SECRET=your_secure_random_string_here
```

#### Testing Checklist

1. Register new user → trial_end_date set to 14 days from now
2. Check `/api/user/trial-status` → Returns trial info with days remaining
3. View profile → Trial banner shows correct days remaining
4. Manually set trial_end_date to past → API calls return 403 with requiresUpgrade
5. Test cron job locally: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/check-expired-trials`

#### Common Pitfalls

1. **Cron not running on Vercel:** Ensure vercel.json is committed and deployed
2. **Timezone confusion:** All dates should be in UTC (ISO 8601 format)
3. **Trial check performance:** Use database indexes for trial_end_date queries

---

### Task 4.3: Admin Analytics Dashboard

**Priority:** P1 (High)
**Estimated Hours:** 18 hours
**Dependencies:** Stage 2 complete, service requests table exists

#### Acceptance Criteria
- [ ] Admin can view total revenue (subscriptions + services)
- [ ] Admin can see active subscribers count
- [ ] Admin can view pending service requests
- [ ] Admin can see trial conversion rate
- [ ] Charts display revenue trends over time
- [ ] Dashboard accessible only to admin users

#### Implementation Steps

**Step 1: Create Admin Analytics API**

Create file: `pages/api/admin/analytics.js`

```javascript
import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function requireAdmin(handler) {
  return async (req, res) => {
    if (req.user.role !== 'admin') {
      throw new ApiError('Admin access required', 403);
    }
    return handler(req, res);
  };
}

export default protectedApiHandler({
  GET: requireAdmin(async (req, res) => {
    try {
      // 1. Active Subscribers
      const { data: activeSubscribers, error: subError } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('subscription_status', 'active');

      if (subError) throw subError;

      // 2. Trial Users
      const { data: trialUsers, error: trialError } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('trial_used', false)
        .is('subscription_status', null);

      if (trialError) throw trialError;

      // 3. Total Subscription Revenue (Monthly Recurring Revenue)
      const { data: subscriptions } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('subscription_status', 'active');

      const tierPricing = { starter: 99, professional: 299, enterprise: 599 };
      const mrr = subscriptions.reduce((total, sub) => {
        return total + (tierPricing[sub.subscription_tier] || 0);
      }, 0);

      // 4. Service Revenue (All time)
      const { data: serviceRevenue } = await supabase
        .from('service_requests')
        .select('price')
        .in('status', ['completed', 'pending', 'in_progress'])
        .not('paid_at', 'is', null);

      const totalServiceRevenue = serviceRevenue.reduce((total, service) => {
        return total + (parseFloat(service.price) || 0);
      }, 0);

      // 5. Pending Service Requests
      const { data: pendingServices, error: pendingError } = await supabase
        .from('service_requests')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // 6. Trial Conversion Rate (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: recentTrialUsers } = await supabase
        .from('users')
        .select('id, subscription_status')
        .gte('trial_start_date', thirtyDaysAgo);

      const convertedTrials = recentTrialUsers.filter(u => u.subscription_status === 'active').length;
      const conversionRate = recentTrialUsers.length > 0
        ? (convertedTrials / recentTrialUsers.length * 100).toFixed(1)
        : 0;

      // 7. Revenue by Month (last 6 months)
      const { data: monthlyRevenue } = await supabase
        .rpc('get_monthly_revenue'); // Custom SQL function

      return res.status(200).json({
        success: true,
        analytics: {
          activeSubscribers: activeSubscribers?.length || 0,
          trialUsers: trialUsers?.length || 0,
          monthlyRecurringRevenue: mrr,
          totalServiceRevenue: totalServiceRevenue,
          pendingServiceRequests: pendingServices?.length || 0,
          trialConversionRate: parseFloat(conversionRate),
          monthlyRevenue: monthlyRevenue || []
        }
      });

    } catch (error) {
      console.error('Analytics error:', error);
      throw new ApiError('Failed to fetch analytics', 500);
    }
  })
});
```

**Step 2: Create SQL Function for Monthly Revenue**

Run this SQL in Supabase:

```sql
-- Create function to calculate monthly revenue
CREATE OR REPLACE FUNCTION get_monthly_revenue()
RETURNS TABLE (
  month TEXT,
  subscription_revenue NUMERIC,
  service_revenue NUMERIC,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT
      TO_CHAR(generate_series(
        NOW() - INTERVAL '6 months',
        NOW(),
        '1 month'::INTERVAL
      ), 'YYYY-MM') AS month
  ),
  sub_revenue AS (
    SELECT
      TO_CHAR(u.subscription_start_date, 'YYYY-MM') AS month,
      SUM(
        CASE u.subscription_tier
          WHEN 'starter' THEN 99
          WHEN 'professional' THEN 299
          WHEN 'enterprise' THEN 599
          ELSE 0
        END
      ) AS revenue
    FROM users u
    WHERE u.subscription_status = 'active'
      AND u.subscription_start_date >= NOW() - INTERVAL '6 months'
    GROUP BY TO_CHAR(u.subscription_start_date, 'YYYY-MM')
  ),
  serv_revenue AS (
    SELECT
      TO_CHAR(sr.paid_at, 'YYYY-MM') AS month,
      SUM(sr.price) AS revenue
    FROM service_requests sr
    WHERE sr.paid_at IS NOT NULL
      AND sr.paid_at >= NOW() - INTERVAL '6 months'
    GROUP BY TO_CHAR(sr.paid_at, 'YYYY-MM')
  )
  SELECT
    m.month,
    COALESCE(sr.revenue, 0) AS subscription_revenue,
    COALESCE(sv.revenue, 0) AS service_revenue,
    COALESCE(sr.revenue, 0) + COALESCE(sv.revenue, 0) AS total_revenue
  FROM months m
  LEFT JOIN sub_revenue sr ON m.month = sr.month
  LEFT JOIN serv_revenue sv ON m.month = sv.month
  ORDER BY m.month DESC;
END;
$$ LANGUAGE plpgsql;
```

**Step 3: Create Admin Analytics Dashboard Page**

Create file: `pages/admin/analytics.js`

```javascript
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminAnalytics() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
        credentials: 'include'
      });

      const data = await response.json();

      if (response.status === 403) {
        router.push('/');
        return;
      }

      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ marginTop: '2rem' }}>
          <p className="text-body">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 style={{ color: '#dc2626' }}>Error</h2>
          <p className="text-body">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Analytics - Triangle Intelligence</title>
      </Head>

      <div className="container">
        <div className="dashboard-header">
          <h1>Admin Analytics Dashboard</h1>
          <div className="header-nav">
            <Link href="/admin/broker-dashboard">
              <a className="nav-link">Cristina's Dashboard</a>
            </Link>
            <Link href="/admin/jorge-dashboard">
              <a className="nav-link">Jorge's Dashboard</a>
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          <MetricCard
            title="Active Subscribers"
            value={analytics.activeSubscribers}
            icon="👥"
            color="#16a34a"
          />
          <MetricCard
            title="Trial Users"
            value={analytics.trialUsers}
            icon="🎯"
            color="#2563eb"
          />
          <MetricCard
            title="Monthly Recurring Revenue"
            value={`$${analytics.monthlyRecurringRevenue.toLocaleString()}`}
            icon="💰"
            color="#16a34a"
          />
          <MetricCard
            title="Service Revenue (All Time)"
            value={`$${analytics.totalServiceRevenue.toLocaleString()}`}
            icon="📊"
            color="#7c3aed"
          />
          <MetricCard
            title="Pending Services"
            value={analytics.pendingServiceRequests}
            icon="⏳"
            color="#eab308"
          />
          <MetricCard
            title="Trial Conversion Rate"
            value={`${analytics.trialConversionRate}%`}
            icon="📈"
            color="#2563eb"
          />
        </div>

        {/* Revenue Chart */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 className="card-title">Revenue Trend (Last 6 Months)</h2>
          <div style={{ marginTop: '1.5rem' }}>
            {analytics.monthlyRevenue.length > 0 ? (
              <SimpleBarChart data={analytics.monthlyRevenue} />
            ) : (
              <p className="text-body">No revenue data available yet.</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 className="card-title">Quick Actions</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <Link href="/admin/broker-dashboard">
              <a className="btn-primary">View Service Requests</a>
            </Link>
            <Link href="/admin/users">
              <a className="btn-secondary">Manage Users</a>
            </Link>
            <button className="btn-secondary" onClick={fetchAnalytics}>
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function MetricCard({ title, value, icon, color }) {
  return (
    <div className="card" style={{
      textAlign: 'center',
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <h3 className="card-title" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
        {title}
      </h3>
      <div style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: color
      }}>
        {value}
      </div>
    </div>
  );
}

function SimpleBarChart({ data }) {
  const maxRevenue = Math.max(...data.map(d => d.total_revenue));

  return (
    <div style={{ marginTop: '1rem' }}>
      {data.slice().reverse().map((item, index) => (
        <div key={index} style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.25rem'
          }}>
            <span className="text-body" style={{ fontSize: '0.875rem' }}>
              {item.month}
            </span>
            <span className="text-body" style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
              ${parseFloat(item.total_revenue).toLocaleString()}
            </span>
          </div>
          <div style={{
            background: '#e5e7eb',
            height: '24px',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#2563eb',
              height: '100%',
              width: `${(item.total_revenue / maxRevenue) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### Testing Checklist

1. Access `/admin/analytics` as admin user → Dashboard loads
2. Try accessing as non-admin → Redirected with 403 error
3. Verify all metrics display correct numbers
4. Check revenue chart shows last 6 months
5. Test quick action buttons → Navigate correctly

#### Common Pitfalls

1. **SQL function not created:** Ensure `get_monthly_revenue()` function exists in Supabase
2. **Admin role check:** Verify user has role='admin' in database
3. **Performance with large datasets:** Add database indexes on frequently queried columns

---

### Task 4.4: Service Request Tracking

**Priority:** P1 (High)
**Estimated Hours:** 10 hours
**Dependencies:** Service purchase flow complete

#### Acceptance Criteria
- [ ] User can view all their service requests at `/my-services`
- [ ] User sees service status (pending, in_progress, completed)
- [ ] User can download completed service deliverables
- [ ] User receives email notifications on status changes
- [ ] Service completion adds entry to `service_completions` table

#### Implementation Steps

**Step 1: Create Service Completions Table**

Run this SQL migration in Supabase:

```sql
-- Create service_completions table
CREATE TABLE service_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  completion_data JSONB NOT NULL,
  report_url TEXT,
  completed_by UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_service_completions_request ON service_completions(service_request_id);

-- Add RLS policies
ALTER TABLE service_completions ENABLE ROW LEVEL SECURITY;

-- Users can view their own completions
CREATE POLICY "Users can view their own service completions"
  ON service_completions
  FOR SELECT
  USING (
    service_request_id IN (
      SELECT id FROM service_requests WHERE user_id = auth.uid()
    )
  );

-- Admins can insert completions
CREATE POLICY "Admins can insert service completions"
  ON service_completions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**Step 2: Create My Services API**

Create file: `pages/api/user/my-services.js`

```javascript
import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.userId;

    try {
      // Fetch user's service requests with completion data
      const { data: services, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          service_completions (
            id,
            completion_data,
            report_url,
            completed_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw new ApiError('Failed to fetch services', 500);
      }

      return res.status(200).json({
        success: true,
        services: services || []
      });

    } catch (error) {
      console.error('My services error:', error);
      throw new ApiError(error.message || 'Failed to fetch services', 500);
    }
  }
});
```

**Step 3: Create My Services Page**

Create file: `pages/my-services.js`

```javascript
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function MyServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/user/my-services', {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setServices(data.services);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending_payment': { color: '#eab308', text: 'Pending Payment' },
      'pending': { color: '#f59e0b', text: 'Pending Review' },
      'in_progress': { color: '#2563eb', text: 'In Progress' },
      'completed': { color: '#16a34a', text: 'Completed' },
      'cancelled': { color: '#6b7280', text: 'Cancelled' }
    };

    const config = statusConfig[status] || { color: '#6b7280', text: status };

    return (
      <span style={{
        background: config.color,
        color: 'white',
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.875rem',
        fontWeight: 'bold'
      }}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ marginTop: '2rem' }}>
          <p className="text-body">Loading your services...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Services - Triangle Intelligence</title>
      </Head>

      <div className="container">
        <div className="dashboard-header">
          <h1>My Services</h1>
          <Link href="/services/logistics-support">
            <a className="btn-primary">Purchase New Service</a>
          </Link>
        </div>

        {error && (
          <div className="card" style={{ marginTop: '1rem', background: '#fef2f2', border: '1px solid #fca5a5' }}>
            <p className="text-body" style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}

        {services.length === 0 ? (
          <div className="card" style={{ marginTop: '2rem', textAlign: 'center' }}>
            <h2 className="card-title">No Services Yet</h2>
            <p className="text-body" style={{ marginBottom: '1.5rem' }}>
              You haven't purchased any professional services yet.
            </p>
            <Link href="/services/logistics-support">
              <a className="btn-primary">Browse Services</a>
            </Link>
          </div>
        ) : (
          <div style={{ marginTop: '2rem' }}>
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ServiceCard({ service }) {
  const completion = service.service_completions?.[0];
  const isCompleted = service.status === 'completed';

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem'
      }}>
        <div>
          <h3 className="card-title">{formatServiceType(service.service_type)}</h3>
          <p className="text-body" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Order #{service.id.substring(0, 8).toUpperCase()}
          </p>
        </div>
        {getStatusBadge(service.status)}
      </div>

      <div className="card" style={{ background: '#f9fafb', padding: '1rem', marginBottom: '1rem' }}>
        <p className="text-body" style={{ marginBottom: '0.5rem' }}>
          <strong>Company:</strong> {service.client_company}
        </p>
        <p className="text-body" style={{ marginBottom: '0.5rem' }}>
          <strong>Price:</strong> ${service.price}
        </p>
        <p className="text-body" style={{ marginBottom: '0.5rem' }}>
          <strong>Purchased:</strong> {new Date(service.created_at).toLocaleDateString()}
        </p>
        {service.paid_at && (
          <p className="text-body">
            <strong>Paid:</strong> {new Date(service.paid_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {isCompleted && completion && (
        <div style={{ marginTop: '1rem' }}>
          <h4 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
            ✅ Service Completed
          </h4>
          <p className="text-body" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
            Completed on {new Date(completion.completed_at).toLocaleDateString()}
          </p>
          {completion.report_url && (
            <a
              href={completion.report_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ display: 'inline-block' }}
            >
              Download Report
            </a>
          )}
        </div>
      )}

      {service.status === 'in_progress' && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #93c5fd',
          padding: '1rem',
          borderRadius: '8px',
          marginTop: '1rem'
        }}>
          <p className="text-body" style={{ fontSize: '0.875rem' }}>
            🚀 Our expert team is working on your service. You'll receive an email when it's completed.
          </p>
        </div>
      )}
    </div>
  );
}

function formatServiceType(type) {
  const names = {
    'usmca-certificates': 'USMCA Certificate Generation',
    'hs-classification': 'HS Code Classification',
    'crisis-response': 'Crisis Response Service',
    'supplier-sourcing': 'Mexico Supplier Sourcing',
    'manufacturing-feasibility': 'Manufacturing Feasibility Analysis',
    'market-entry': 'Mexico Market Entry Strategy'
  };
  return names[type] || type;
}

function getStatusBadge(status) {
  const statusConfig = {
    'pending_payment': { color: '#eab308', text: 'Pending Payment' },
    'pending': { color: '#f59e0b', text: 'Pending Review' },
    'in_progress': { color: '#2563eb', text: 'In Progress' },
    'completed': { color: '#16a34a', text: 'Completed' },
    'cancelled': { color: '#6b7280', text: 'Cancelled' }
  };

  const config = statusConfig[status] || { color: '#6b7280', text: status };

  return (
    <span style={{
      background: config.color,
      color: 'white',
      padding: '0.25rem 0.75rem',
      borderRadius: '12px',
      fontSize: '0.875rem',
      fontWeight: 'bold'
    }}>
      {config.text}
    </span>
  );
}
```

#### Testing Checklist

1. Purchase a service → Appears in my-services page
2. Admin marks service as in_progress → User sees updated status
3. Admin completes service with report URL → Download button appears
4. Check database → service_completions record created
5. Verify only user's own services shown (not other users')

---

## Stage 4 Success Criteria

**Before Moving to Stage 5, Verify:**

- [ ] User can purchase professional services via Stripe
- [ ] Service requests saved to database correctly
- [ ] Trial expiration system working (check with test user)
- [ ] Admin analytics dashboard shows accurate metrics
- [ ] Users can view their service requests and status
- [ ] Service completion flow works end-to-end
- [ ] Vercel cron job runs daily (check logs)

**Performance Benchmarks:**
- Analytics dashboard load: < 1500ms
- Service purchase flow: < 2000ms
- Trial status check: < 200ms

---

## Stage 5: Compliance & Polish (Week 9-10)

### Overview

**Goal:** Add legal compliance pages, improve error handling, optimize performance, harden security, and prepare for production launch.

**Why This Stage Last:**
- Core functionality is complete
- Legal pages required before public launch
- Performance optimization based on real usage patterns
- Security hardening protects production data

**Estimated Time:** 45-55 hours

---

### Task 5.1: Terms of Service & Privacy Policy

**Priority:** P0 (Blocking for launch)
**Estimated Hours:** 8 hours
**Dependencies:** None

#### Acceptance Criteria
- [ ] Terms of Service page at `/terms-of-service`
- [ ] Privacy Policy page at `/privacy-policy`
- [ ] Links in footer of all pages
- [ ] Checkbox on registration requiring acceptance
- [ ] Database tracks acceptance timestamp

#### Implementation Steps

**Step 1: Add Terms Acceptance to Users Table**

Run this SQL migration in Supabase:

```sql
-- Add terms acceptance tracking
ALTER TABLE users
ADD COLUMN terms_accepted_at TIMESTAMPTZ,
ADD COLUMN privacy_accepted_at TIMESTAMPTZ;

-- Create index for compliance queries
CREATE INDEX idx_users_terms_accepted ON users(terms_accepted_at)
WHERE terms_accepted_at IS NOT NULL;
```

**Step 2: Update Registration API**

Update file: `pages/api/auth/register.js`

Add terms acceptance:

```javascript
// In the request validation section
const { email, password, full_name, accept_terms } = req.body;

if (!accept_terms) {
  throw new ApiError('You must accept the Terms of Service and Privacy Policy', 400);
}

// In the INSERT statement
const { data: user, error: insertError } = await supabase
  .from('users')
  .insert({
    email: sanitizedEmail,
    password_hash: hashedPassword,
    full_name: sanitizeInput(full_name),
    role: 'user',
    trial_start_date: new Date().toISOString(),
    trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    trial_used: false,
    terms_accepted_at: new Date().toISOString(),
    privacy_accepted_at: new Date().toISOString()
  })
  .select('id, email, full_name, role, trial_end_date')
  .single();
```

**Step 3: Create Terms of Service Page**

Create file: `pages/terms-of-service.js`

```javascript
import Head from 'next/head';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service - Triangle Intelligence</title>
        <meta name="description" content="Triangle Intelligence Platform Terms of Service" />
      </Head>

      <div className="container">
        <div className="card" style={{ marginTop: '2rem', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
          <h1 style={{ marginBottom: '1rem' }}>Terms of Service</h1>
          <p className="text-body" style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '2rem' }}>
            Last Updated: October 1, 2025
          </p>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">1. Acceptance of Terms</h2>
            <p className="text-body">
              By accessing or using the Triangle Intelligence Platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">2. Description of Service</h2>
            <p className="text-body">
              Triangle Intelligence provides USMCA compliance analysis, certificate generation, and professional trade services to North American importers and exporters. Our services include but are not limited to:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">USMCA qualification analysis</li>
              <li className="text-body">Certificate of Origin generation</li>
              <li className="text-body">HS code classification</li>
              <li className="text-body">Mexico supplier sourcing</li>
              <li className="text-body">Trade compliance consulting</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">3. User Accounts</h2>
            <p className="text-body">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">4. Subscription and Payment Terms</h2>
            <p className="text-body">
              Subscription fees are billed in advance on a monthly or annual basis. You authorize us to charge your payment method for all fees incurred. Subscriptions automatically renew unless cancelled before the renewal date.
            </p>
            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '1rem' }}>Free Trial</h3>
            <p className="text-body">
              New users receive a 14-day free trial. Your payment method will be charged at the end of the trial period unless you cancel before the trial ends.
            </p>
            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '1rem' }}>Cancellation</h3>
            <p className="text-body">
              You may cancel your subscription at any time. Cancellations take effect at the end of the current billing period. No refunds are provided for partial months.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">5. Professional Services</h2>
            <p className="text-body">
              Professional services (e.g., supplier sourcing, feasibility studies) are billed separately from subscriptions. All professional service fees are non-refundable once work has commenced.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">6. Intellectual Property</h2>
            <p className="text-body">
              All content, features, and functionality of the Service are owned by Triangle Intelligence and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or reverse engineer any part of the Service.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">7. Disclaimer of Warranties</h2>
            <p className="text-body">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. Triangle Intelligence does not guarantee that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.
            </p>
            <p className="text-body" style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
              Legal Compliance Disclaimer: While our services assist with USMCA compliance, they do not constitute legal advice. Users should consult with qualified legal professionals for specific compliance questions.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">8. Limitation of Liability</h2>
            <p className="text-body">
              To the maximum extent permitted by law, Triangle Intelligence shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">9. Indemnification</h2>
            <p className="text-body">
              You agree to indemnify and hold harmless Triangle Intelligence from any claims, damages, losses, liabilities, and expenses arising out of your use of the Service or violation of these Terms.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">10. Governing Law</h2>
            <p className="text-body">
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">11. Changes to Terms</h2>
            <p className="text-body">
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">12. Contact Information</h2>
            <p className="text-body">
              For questions about these Terms, please contact us at:
            </p>
            <p className="text-body" style={{ marginTop: '0.5rem' }}>
              Email: legal@triangleintelligence.com<br />
              Address: [Your Business Address]
            </p>
          </section>

          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <Link href="/">
              <a className="btn-primary">Return to Home</a>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
```

**Step 4: Create Privacy Policy Page**

Create file: `pages/privacy-policy.js`

```javascript
import Head from 'next/head';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Triangle Intelligence</title>
        <meta name="description" content="Triangle Intelligence Platform Privacy Policy" />
      </Head>

      <div className="container">
        <div className="card" style={{ marginTop: '2rem', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
          <h1 style={{ marginBottom: '1rem' }}>Privacy Policy</h1>
          <p className="text-body" style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '2rem' }}>
            Last Updated: October 1, 2025
          </p>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">1. Information We Collect</h2>
            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '1rem' }}>Information You Provide</h3>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">Account information (name, email, company name)</li>
              <li className="text-body">Business information (product descriptions, component origins, trade volumes)</li>
              <li className="text-body">Payment information (processed securely by Stripe)</li>
              <li className="text-body">Communications with our team</li>
            </ul>

            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '1rem' }}>Automatically Collected Information</h3>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">Usage data (pages visited, features used)</li>
              <li className="text-body">Device information (browser type, operating system)</li>
              <li className="text-body">IP address and location data</li>
              <li className="text-body">Cookies and similar technologies</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">2. How We Use Your Information</h2>
            <p className="text-body">We use your information to:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">Provide and improve our services</li>
              <li className="text-body">Process payments and subscriptions</li>
              <li className="text-body">Send service-related communications</li>
              <li className="text-body">Analyze usage patterns and optimize features</li>
              <li className="text-body">Comply with legal obligations</li>
              <li className="text-body">Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">3. How We Share Your Information</h2>
            <p className="text-body">We do not sell your personal information. We may share your information with:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">Service providers (Stripe for payments, Supabase for data storage)</li>
              <li className="text-body">Professional consultants working on your service requests</li>
              <li className="text-body">Law enforcement when required by law</li>
              <li className="text-body">Business successors in case of merger or acquisition</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">4. Data Security</h2>
            <p className="text-body">
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">Encryption in transit (HTTPS/TLS)</li>
              <li className="text-body">Encryption at rest for sensitive data</li>
              <li className="text-body">Regular security audits and updates</li>
              <li className="text-body">Access controls and authentication</li>
            </ul>
            <p className="text-body" style={{ marginTop: '0.5rem' }}>
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">5. Data Retention</h2>
            <p className="text-body">
              We retain your information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain information for legal compliance, dispute resolution, and legitimate business purposes.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">6. Your Rights</h2>
            <p className="text-body">You have the right to:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">Access your personal information</li>
              <li className="text-body">Correct inaccurate information</li>
              <li className="text-body">Delete your account and data</li>
              <li className="text-body">Object to certain data processing</li>
              <li className="text-body">Export your data (data portability)</li>
              <li className="text-body">Withdraw consent for marketing communications</li>
            </ul>
            <p className="text-body" style={{ marginTop: '0.5rem' }}>
              To exercise these rights, contact us at privacy@triangleintelligence.com
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">7. Cookies and Tracking</h2>
            <p className="text-body">
              We use cookies and similar technologies for authentication, preferences, and analytics. You can control cookies through your browser settings, but disabling cookies may limit functionality.
            </p>
            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '1rem' }}>Types of Cookies We Use:</h3>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body"><strong>Essential:</strong> Authentication and security</li>
              <li className="text-body"><strong>Functional:</strong> Remember preferences and settings</li>
              <li className="text-body"><strong>Analytics:</strong> Understand how users interact with the Service</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">8. Third-Party Services</h2>
            <p className="text-body">
              Our Service integrates with third-party services that have their own privacy policies:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">Stripe (payment processing): <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a></li>
              <li className="text-body">Supabase (data storage): <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a></li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">9. International Data Transfers</h2>
            <p className="text-body">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable laws.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">10. Children's Privacy</h2>
            <p className="text-body">
              Our Service is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will delete it immediately.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">11. Changes to This Policy</h2>
            <p className="text-body">
              We may update this Privacy Policy from time to time. We will notify you of material changes via email or through the Service. Your continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">12. Contact Us</h2>
            <p className="text-body">
              For questions about this Privacy Policy or our data practices, please contact:
            </p>
            <p className="text-body" style={{ marginTop: '0.5rem' }}>
              Email: privacy@triangleintelligence.com<br />
              Address: [Your Business Address]
            </p>
          </section>

          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <Link href="/">
              <a className="btn-primary">Return to Home</a>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
```

**Step 5: Update Registration Page with Terms Checkbox**

Update file: `pages/register.js`

Add checkbox before submit button:

```javascript
// Add state
const [acceptTerms, setAcceptTerms] = useState(false);

// Add to form validation
if (!acceptTerms) {
  setError('You must accept the Terms of Service and Privacy Policy');
  return;
}

// Include in API call
body: JSON.stringify({
  email,
  password,
  full_name,
  accept_terms: acceptTerms
})

// Add checkbox to JSX
<div className="form-group" style={{ marginTop: '1rem' }}>
  <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
    <input
      type="checkbox"
      checked={acceptTerms}
      onChange={(e) => setAcceptTerms(e.target.checked)}
      style={{ marginTop: '0.25rem', marginRight: '0.5rem' }}
    />
    <span className="text-body" style={{ fontSize: '0.875rem' }}>
      I accept the{' '}
      <Link href="/terms-of-service">
        <a style={{ color: '#2563eb', textDecoration: 'underline' }} target="_blank">
          Terms of Service
        </a>
      </Link>
      {' '}and{' '}
      <Link href="/privacy-policy">
        <a style={{ color: '#2563eb', textDecoration: 'underline' }} target="_blank">
          Privacy Policy
        </a>
      </Link>
    </span>
  </label>
</div>
```

#### Testing Checklist

1. Visit `/terms-of-service` → Page loads correctly
2. Visit `/privacy-policy` → Page loads correctly
3. Try registering without checking terms → Error shown
4. Register with terms checked → Account created with timestamps
5. Check database → `terms_accepted_at` and `privacy_accepted_at` populated

---

### Task 5.2: Error Handling Improvements

**Priority:** P1 (High)
**Estimated Hours:** 10 hours
**Dependencies:** All API routes built

#### Acceptance Criteria
- [ ] All API routes return consistent error format
- [ ] User-friendly error messages (no stack traces to client)
- [ ] 404 page for invalid routes
- [ ] 500 page for server errors
- [ ] Error logging to monitoring service (optional: Sentry)

#### Implementation Steps

**Step 1: Create Custom Error Pages**

Create file: `pages/404.js`

```javascript
import Head from 'next/head';
import Link from 'next/link';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found</title>
      </Head>

      <div className="container">
        <div className="card" style={{
          marginTop: '4rem',
          textAlign: 'center',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</div>
          <h1 style={{ marginBottom: '1rem' }}>Page Not Found</h1>
          <p className="text-body" style={{ marginBottom: '2rem' }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/">
              <a className="btn-primary">Go Home</a>
            </Link>
            <Link href="/profile">
              <a className="btn-secondary">My Dashboard</a>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
```

Create file: `pages/500.js`

```javascript
import Head from 'next/head';
import Link from 'next/link';

export default function Custom500() {
  return (
    <>
      <Head>
        <title>500 - Server Error</title>
      </Head>

      <div className="container">
        <div className="card" style={{
          marginTop: '4rem',
          textAlign: 'center',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>500</div>
          <h1 style={{ marginBottom: '1rem' }}>Something Went Wrong</h1>
          <p className="text-body" style={{ marginBottom: '2rem' }}>
            We're experiencing technical difficulties. Our team has been notified and is working on a fix.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/">
              <a className="btn-primary">Go Home</a>
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
```

**Step 2: Create Global Error Boundary (Optional: React Error Boundary)**

Create file: `components/ErrorBoundary.js`

```javascript
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    // TODO: Log to error monitoring service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container">
          <div className="card" style={{
            marginTop: '4rem',
            textAlign: 'center',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            <h1 style={{ marginBottom: '1rem', color: '#dc2626' }}>
              Oops! Something went wrong
            </h1>
            <p className="text-body" style={{ marginBottom: '2rem' }}>
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

Update `pages/_app.js` to use ErrorBoundary:

```javascript
import ErrorBoundary from '../components/ErrorBoundary';

function MyApp({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}

export default MyApp;
```

**Step 3: Enhance Error Logging**

Update file: `lib/api/errorHandler.js`

Add production error logging:

```javascript
export function logError(error, context = {}) {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Log:', errorLog);
  }

  // TODO: Send to error monitoring service in production
  // Example with Sentry:
  // if (process.env.NODE_ENV === 'production' && typeof Sentry !== 'undefined') {
  //   Sentry.captureException(error, { extra: context });
  // }

  return errorLog;
}

// Update errorHandler middleware
export function errorHandler(err, req, res) {
  // Log error with context
  logError(err, {
    url: req.url,
    method: req.method,
    userId: req.user?.userId,
    body: req.body
  });

  // Return user-friendly error
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Generic server error (don't expose internal errors)
  return res.status(500).json({
    success: false,
    error: 'An unexpected error occurred. Please try again later.'
  });
}
```

#### Testing Checklist

1. Visit non-existent route → 404 page shown
2. Trigger server error → 500 page shown (generic message, no stack trace)
3. Test API error → Returns consistent JSON format
4. Check error logs → Context included (user, route, etc.)
5. Test error boundary → React errors caught gracefully

---

### Task 5.3: Performance Optimization

**Priority:** P2 (Medium)
**Estimated Hours:** 12 hours
**Dependencies:** All features built

#### Acceptance Criteria
- [ ] Image optimization with Next.js Image component
- [ ] API response caching where appropriate
- [ ] Database query optimization (indexes)
- [ ] Lazy loading for heavy components
- [ ] Code splitting for reduced bundle size

#### Implementation Steps

**Step 1: Optimize Images**

Replace `<img>` tags with Next.js Image:

```javascript
import Image from 'next/image';

// Before
<img src="/logo.png" alt="Triangle Intelligence" />

// After
<Image
  src="/logo.png"
  alt="Triangle Intelligence"
  width={200}
  height={50}
  priority // For above-the-fold images
/>
```

Configure image optimization in `next.config.js`:

```javascript
module.exports = {
  images: {
    domains: ['your-supabase-project.supabase.co'], // For user avatars
    formats: ['image/avif', 'image/webp'],
  },
};
```

**Step 2: Implement API Caching**

Add caching headers to appropriate API routes:

```javascript
// For data that doesn't change often (e.g., pricing)
export default async function handler(req, res) {
  // Cache for 1 hour, revalidate in background
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const data = await fetchData();
  res.json(data);
}

// For user-specific data (no cache)
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // ...
}
```

**Step 3: Optimize Database Queries**

Run these SQL commands in Supabase to add indexes:

```sql
-- Index for user lookups by email (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for active subscriptions
CREATE INDEX IF NOT EXISTS idx_users_subscription_status
ON users(subscription_status)
WHERE subscription_status = 'active';

-- Index for service requests by user
CREATE INDEX IF NOT EXISTS idx_service_requests_user
ON service_requests(user_id, created_at DESC);

-- Index for service requests by status
CREATE INDEX IF NOT EXISTS idx_service_requests_status
ON service_requests(status, created_at DESC);

-- Composite index for trial queries
CREATE INDEX IF NOT EXISTS idx_users_trial_composite
ON users(trial_used, trial_end_date, subscription_status)
WHERE trial_used = false;
```

**Step 4: Implement Code Splitting**

Use dynamic imports for heavy components:

```javascript
import dynamic from 'next/dynamic';

// Lazy load admin dashboard (only loads when needed)
const AdminDashboard = dynamic(() => import('../components/admin/AdminDashboard'), {
  loading: () => <p>Loading dashboard...</p>,
  ssr: false // Don't render on server
});

// Lazy load charts
const RevenueChart = dynamic(() => import('../components/charts/RevenueChart'), {
  loading: () => <div className="card"><p>Loading chart...</p></div>
});
```

**Step 5: Optimize Workflow Data**

Instead of loading all workflow data at once, paginate or lazy-load:

```javascript
// Before: Load all service requests
const { data: services } = await supabase
  .from('service_requests')
  .select('*')
  .eq('user_id', userId);

// After: Paginate
const { data: services } = await supabase
  .from('service_requests')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .range(0, 19); // First 20 records
```

**Step 6: Reduce Bundle Size**

Analyze bundle and tree-shake unused dependencies:

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // your next config
});

# Run analysis
ANALYZE=true npm run build
```

Remove unused dependencies:

```bash
npm uninstall unused-package-1 unused-package-2
```

Use tree-shakeable imports:

```javascript
// Before (imports entire lodash)
import _ from 'lodash';

// After (imports only what you need)
import debounce from 'lodash/debounce';
```

#### Testing Checklist

1. Run Lighthouse audit → Score > 90 for performance
2. Check Network tab → Images served in WebP/AVIF format
3. Test API caching → Repeated requests hit cache
4. Query performance → Database queries < 200ms
5. Bundle size → Reduced by at least 20% from initial

---

### Task 5.4: Security Hardening

**Priority:** P0 (Blocking)
**Estimated Hours:** 10 hours
**Dependencies:** All authentication complete

#### Acceptance Criteria
- [ ] Rate limiting on authentication endpoints
- [ ] Input validation and sanitization on all APIs
- [ ] SQL injection protection (parameterized queries)
- [ ] CSRF protection
- [ ] Security headers configured

#### Implementation Steps

**Step 1: Implement Rate Limiting**

Install rate limiting library:

```bash
npm install express-rate-limit
```

Create file: `lib/security/rateLimiter.js`

```javascript
import rateLimit from 'express-rate-limit';

// Create rate limiters for different endpoint types
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute (for expensive operations)
  message: 'Rate limit exceeded. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper to apply rate limiter to Next.js API routes
export function applyRateLimit(limiter) {
  return (req, res) => {
    return new Promise((resolve, reject) => {
      limiter(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
  };
}
```

Apply to authentication routes:

```javascript
// pages/api/auth/login.js
import { applyRateLimit, authLimiter } from '../../../lib/security/rateLimiter';

export default async function handler(req, res) {
  // Apply rate limiting
  try {
    await applyRateLimit(authLimiter)(req, res);
  } catch (error) {
    return res.status(429).json({
      success: false,
      error: 'Too many login attempts. Please try again later.'
    });
  }

  // Rest of login logic...
}
```

**Step 2: Enhanced Input Validation**

Update file: `lib/api/errorHandler.js`

Add comprehensive sanitization:

```javascript
import validator from 'validator';

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Escape special characters
  sanitized = validator.escape(sanitized);

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return validator.isEmail(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  return { valid: true };
}

/**
 * Sanitize object (recursively sanitize all string values)
 */
export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
```

**Step 3: Configure Security Headers**

Update file: `vercel.json`

Add security headers:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
        }
      ]
    }
  ]
}
```

**Step 4: SQL Injection Protection**

Verify all Supabase queries use parameterized queries (already using `.eq()`, `.select()` methods):

```javascript
// SAFE (parameterized)
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userEmail); // Safe - Supabase handles escaping

// UNSAFE (never do this)
const { data } = await supabase
  .rpc('raw_query', { query: `SELECT * FROM users WHERE email = '${userEmail}'` }); // VULNERABLE
```

**Step 5: Implement CSRF Protection**

For state-changing operations, verify origin:

```javascript
// lib/security/csrf.js
export function verifyCsrfToken(req) {
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000', // Development
  ];

  if (!origin) {
    return false;
  }

  return allowedOrigins.some(allowed => origin.startsWith(allowed));
}

// Apply to state-changing routes
export default async function handler(req, res) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    if (!verifyCsrfToken(req)) {
      return res.status(403).json({
        success: false,
        error: 'Invalid request origin'
      });
    }
  }

  // Rest of handler...
}
```

#### Testing Checklist

1. Try login 6 times rapidly → Rate limit triggered after 5 attempts
2. Submit form with `<script>` tags → Sanitized before database
3. Check HTTP headers → Security headers present
4. Test CSRF → Cross-origin POST requests blocked
5. Run security audit: `npm audit` → No high/critical vulnerabilities

---

### Task 5.5: SEO Optimization

**Priority:** P2 (Medium)
**Estimated Hours:** 5 hours
**Dependencies:** All pages built

#### Acceptance Criteria
- [ ] All pages have proper meta tags (title, description)
- [ ] sitemap.xml generated
- [ ] robots.txt configured
- [ ] Open Graph tags for social sharing
- [ ] Structured data (JSON-LD) for rich snippets

#### Implementation Steps

**Step 1: Create Reusable SEO Component**

Create file: `components/SEO.js`

```javascript
import Head from 'next/head';

export default function SEO({
  title = 'Triangle Intelligence - USMCA Compliance Platform',
  description = 'AI-powered USMCA compliance analysis and certificate generation platform for North American importers and exporters.',
  image = '/og-image.png',
  url = 'https://triangleintelligence.com'
}) {
  const fullTitle = title.includes('Triangle Intelligence') ? title : `${title} | Triangle Intelligence`;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Head>
  );
}
```

Use in pages:

```javascript
import SEO from '../components/SEO';

export default function Homepage() {
  return (
    <>
      <SEO
        title="USMCA Compliance Made Simple"
        description="AI-powered platform for USMCA qualification analysis, certificate generation, and Mexico trade services."
        url="https://triangleintelligence.com"
      />
      {/* Page content */}
    </>
  );
}
```

**Step 2: Generate sitemap.xml**

Create file: `pages/sitemap.xml.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://triangleintelligence.com';

function generateSiteMap() {
  const staticPages = [
    '',
    '/pricing',
    '/services/logistics-support',
    '/terms-of-service',
    '/privacy-policy',
    '/register',
    '/login',
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticPages
        .map((page) => {
          return `
        <url>
          <loc>${BASE_URL}${page}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>${page === '' ? '1.0' : '0.8'}</priority>
        </url>
      `;
        })
        .join('')}
    </urlset>
  `;
}

export async function getServerSideProps({ res }) {
  const sitemap = generateSiteMap();

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default function Sitemap() {
  // getServerSideProps will handle the response
  return null;
}
```

**Step 3: Create robots.txt**

Create file: `public/robots.txt`

```txt
# Allow all crawlers
User-agent: *
Allow: /

# Disallow admin pages
Disallow: /admin/
Disallow: /api/

# Sitemap
Sitemap: https://triangleintelligence.com/sitemap.xml
```

**Step 4: Add Structured Data**

Add JSON-LD to homepage:

```javascript
// pages/index.js
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Triangle Intelligence Platform",
      "applicationCategory": "BusinessApplication",
      "offers": {
        "@type": "Offer",
        "price": "99",
        "priceCurrency": "USD",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "billingDuration": "P1M"
        }
      },
      "description": "AI-powered USMCA compliance analysis and certificate generation platform for North American importers and exporters.",
      "operatingSystem": "Web Browser",
      "provider": {
        "@type": "Organization",
        "name": "Triangle Intelligence"
      }
    })
  }}
/>
```

#### Testing Checklist

1. View page source → Meta tags present
2. Test with Facebook Debugger → OG tags work
3. Check `/sitemap.xml` → Sitemap generated
4. Verify `/robots.txt` → Properly configured
5. Run Google Rich Results Test → Structured data valid

---

## Stage 5 Success Criteria

**Before Launch, Verify:**

- [ ] Terms of Service and Privacy Policy pages live
- [ ] All error pages (404, 500) work correctly
- [ ] Performance Lighthouse score > 90
- [ ] All security headers configured
- [ ] Rate limiting active on auth endpoints
- [ ] SEO meta tags on all pages
- [ ] sitemap.xml and robots.txt accessible
- [ ] No console errors in production build

**Final Production Checklist:**
- [ ] All environment variables set in Vercel Production
- [ ] Custom domain configured and SSL working
- [ ] Stripe webhooks registered for production
- [ ] Database backups enabled in Supabase
- [ ] Error monitoring active (Sentry or similar)
- [ ] Analytics tracking configured (Google Analytics or similar)

---

## 📋 Pre-Launch Deployment Checklist

### Vercel Configuration
- [ ] Environment variables set for production environment
- [ ] Custom domain configured and DNS updated
- [ ] SSL certificates auto-provisioned (Vercel handles this automatically)
- [ ] Vercel Analytics enabled
- [ ] Speed Insights enabled
- [ ] Function timeout limits configured (10s default, 60s for Pro)
- [ ] Memory limits configured for API routes (1024MB recommended)

### Supabase Configuration
- [ ] Production database created
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Database indexes created for performance
- [ ] Automatic backups enabled (included in Supabase Pro)
- [ ] Connection pooling configured
- [ ] Service role key secured in environment variables only

### Stripe Configuration
- [ ] Production keys added to Vercel environment variables
- [ ] Webhook endpoint configured with production URL
- [ ] Webhook signing secret added to Vercel
- [ ] Products and prices created in Stripe Dashboard
- [ ] Customer Portal enabled
- [ ] Tax rates configured (if applicable)

### Testing & Validation
- [ ] Preview deployment tested end-to-end
- [ ] Stripe test mode transactions working
- [ ] Webhooks receiving events (check Stripe Dashboard logs)
- [ ] Email notifications sending
- [ ] Database queries performing under 200ms
- [ ] All protected routes require authentication
- [ ] JWT tokens stored in httpOnly cookies
- [ ] No sensitive data exposed in error responses

### Monitoring & Observability
- [ ] Sentry error tracking configured (optional but recommended)
- [ ] Vercel Analytics tracking page views
- [ ] Stripe Dashboard monitoring transactions
- [ ] Database performance monitoring enabled
- [ ] Webhook delivery monitoring active

### Security Hardening
- [ ] JWT_SECRET is strong random string (not default)
- [ ] All environment variables secured in Vercel
- [ ] RLS policies tested and verified
- [ ] Input validation on all API endpoints
- [ ] Rate limiting implemented (optional, can use Vercel Edge Config)
- [ ] CORS configured correctly in vercel.json

---

## Technology Stack Decisions

### Overview

This section explains **WHY** each technology was chosen for the Triangle Intelligence Platform. Understanding these decisions helps developers maintain architectural consistency and make informed choices when extending the platform.

---

### Next.js 14 (Pages Router) - NOT App Router

**Decision:** Use Next.js 14 with Pages Router instead of App Router

**Why:**
- **Maturity & Stability**: Pages Router is battle-tested with 5+ years of production use
- **Ecosystem Compatibility**: All authentication libraries, Stripe integrations, and API patterns have proven implementations with Pages Router
- **Simpler Mental Model**: File-system routing is straightforward (`pages/index.js` = `/`)
- **API Routes**: Built-in API routes (`pages/api/`) provide serverless functions without extra configuration

**App Router Considered But Rejected:**
- Still evolving (breaking changes between Next.js versions)
- Server Components add complexity for this use case
- Most third-party tutorials/documentation use Pages Router
- Client-side interactions (Stripe checkout, forms) work better with Pages Router patterns

**Tradeoffs:**
- ✅ **Pro**: Stable, predictable, well-documented
- ✅ **Pro**: Easy migration path if needed later
- ❌ **Con**: Missing newer features like React Server Components
- ❌ **Con**: Slightly less performant than App Router for static content

---

### Vercel - NOT AWS/Digital Ocean/Heroku

**Decision:** Deploy on Vercel instead of AWS, Digital Ocean, or Heroku

**Why Vercel:**
- **Zero-Config Next.js Deployment**: Built by the same team that makes Next.js
- **Automatic HTTPS**: SSL certificates provisioned automatically
- **Edge Network**: Global CDN for fast page loads worldwide
- **Preview Deployments**: Every Git push gets a unique URL for testing
- **Serverless Functions**: No server management required
- **Built-in Analytics**: Page performance tracking without third-party tools

**AWS Considered But Rejected:**
- Requires significant DevOps knowledge (EC2, Load Balancers, RDS, etc.)
- Complex setup for Next.js (needs custom configuration)
- Higher monthly costs for similar performance
- Overkill for MVP stage

**Digital Ocean Considered But Rejected:**
- Requires server management (updates, security patches)
- No built-in CDN
- Manual SSL certificate configuration
- No preview deployments

**Heroku Considered But Rejected:**
- Expensive for production workloads ($25/month minimum)
- Slower cold start times than Vercel
- Less optimized for Next.js

**Tradeoffs:**
- ✅ **Pro**: Fastest time to production
- ✅ **Pro**: Excellent developer experience
- ✅ **Pro**: Automatic scaling
- ❌ **Con**: Vendor lock-in (but easy to migrate if needed)
- ❌ **Con**: Limited customization compared to AWS

**Monthly Cost Estimate:**
- Hobby (free): Good for testing
- Pro ($20/month): Required for production (custom domains, team collaboration)

---

### Supabase - NOT Firebase/MongoDB/PostgreSQL (self-hosted)

**Decision:** Use Supabase for database and authentication

**Why Supabase:**
- **PostgreSQL**: Full SQL support with ACID guarantees (vs. Firebase's NoSQL)
- **Row Level Security (RLS)**: Built-in data access control at database level
- **Connection Pooling**: Optimized for serverless environments (Vercel functions)
- **Real-time Subscriptions**: WebSocket support for live updates (future feature)
- **Automatic API Generation**: REST and GraphQL APIs generated from schema
- **Self-Hostable**: Can migrate to self-hosted PostgreSQL if needed

**Firebase Considered But Rejected:**
- NoSQL doesn't fit relational data (users → subscriptions → service requests)
- Complex queries require denormalization
- Vendor lock-in (harder to migrate than SQL database)
- Less flexible pricing

**MongoDB Considered But Rejected:**
- NoSQL doesn't match use case (structured relational data)
- Missing built-in RLS equivalent
- Requires separate authentication service

**Self-Hosted PostgreSQL Considered But Rejected:**
- Requires infrastructure management
- No built-in connection pooling for serverless
- Manual backups and scaling
- Higher operational complexity

**Tradeoffs:**
- ✅ **Pro**: SQL for complex queries
- ✅ **Pro**: RLS eliminates need for API-level permission checks
- ✅ **Pro**: Easy migration path to self-hosted PostgreSQL
- ✅ **Pro**: Generous free tier, affordable production pricing
- ❌ **Con**: Relatively new service (founded 2020)
- ❌ **Con**: Smaller community than Firebase

**Monthly Cost Estimate:**
- Free tier: 500MB database, 2GB bandwidth (good for MVP)
- Pro ($25/month): 8GB database, 100GB bandwidth (production)

---

### Stripe - NOT PayPal/Braintree/Square

**Decision:** Use Stripe for payment processing

**Why Stripe:**
- **Developer-First**: Best-in-class API and documentation
- **Subscription Management**: Built-in recurring billing with automatic retries
- **Customer Portal**: Pre-built UI for users to manage subscriptions
- **Webhooks**: Real-time event notifications (subscription changes, payment failures)
- **Compliance**: PCI-DSS Level 1 certified (highest security level)
- **Global Support**: Accepts 135+ currencies and local payment methods

**PayPal Considered But Rejected:**
- Poor developer experience (complex API, outdated documentation)
- Users must have PayPal account (friction)
- Higher dispute rates
- Less reliable webhooks

**Braintree Considered But Rejected:**
- Owned by PayPal (same issues)
- Less feature-rich than Stripe
- Smaller developer community

**Square Considered But Rejected:**
- Focused on in-person payments (not ideal for SaaS)
- Limited international support
- Smaller ecosystem

**Tradeoffs:**
- ✅ **Pro**: Industry standard for SaaS billing
- ✅ **Pro**: Excellent fraud detection
- ✅ **Pro**: Comprehensive webhook system
- ✅ **Pro**: Easy testing with test mode
- ❌ **Con**: 2.9% + $0.30 per transaction (industry standard)
- ❌ **Con**: Payout hold period for new accounts (7-14 days)

**Cost Structure:**
- No monthly fees
- 2.9% + $0.30 per successful charge
- Subscriptions: Same rate, charged monthly
- Free test mode for development

---

### OpenRouter API - NOT Direct OpenAI

**Decision:** Use OpenRouter API instead of direct OpenAI API

**Why OpenRouter:**
- **Model Flexibility**: Access to Claude, GPT-4, Gemini, Llama from one API
- **Cost Optimization**: Compare pricing across models, choose best value
- **Fallback Options**: If one model is down, switch to another instantly
- **Unified Billing**: Single invoice for all AI providers
- **Rate Limit Management**: OpenRouter handles rate limits across providers

**Direct OpenAI API Considered But Rejected:**
- Vendor lock-in (can't easily switch to Claude/Gemini)
- Single point of failure (if OpenAI is down, app breaks)
- Less flexible pricing
- Need separate integrations for each provider

**Tradeoffs:**
- ✅ **Pro**: Multi-model support
- ✅ **Pro**: Better reliability (fallback models)
- ✅ **Pro**: Cost optimization
- ❌ **Con**: Additional abstraction layer
- ❌ **Con**: Slightly higher latency (routing layer)

**Cost Example:**
- Claude 3 Haiku: $0.25 per million tokens (input), $1.25/million (output)
- GPT-3.5 Turbo: $0.50/$1.50 per million tokens
- Can switch models based on task complexity and budget

---

### JWT + httpOnly Cookies - NOT Sessions/LocalStorage

**Decision:** Use JWT tokens stored in httpOnly cookies

**Why JWT + httpOnly Cookies:**
- **Stateless**: No server-side session storage needed (perfect for Vercel serverless)
- **Secure**: httpOnly cookies can't be accessed by JavaScript (prevents XSS attacks)
- **Automatic**: Browser sends cookie with every request (no manual headers)
- **Refresh Tokens**: Long-lived tokens for better UX (stay logged in)

**Session-Based Auth Considered But Rejected:**
- Requires session storage (Redis/database)
- Doesn't work well with serverless (cold starts)
- Higher infrastructure costs
- More complex deployment

**LocalStorage Considered But Rejected:**
- Vulnerable to XSS attacks (JavaScript can access tokens)
- No automatic expiration
- Not sent with HTTP requests (manual header management)
- Security best practices recommend against it for auth tokens

**Tradeoffs:**
- ✅ **Pro**: Secure against XSS
- ✅ **Pro**: Works perfectly with serverless
- ✅ **Pro**: Industry standard for modern apps
- ❌ **Con**: Requires CSRF protection for state-changing operations
- ❌ **Con**: Can't access token from JavaScript (by design - security feature)

**Implementation Pattern:**
```javascript
// Login sets cookie
res.setHeader('Set-Cookie', serialize('auth_token', jwt, {
  httpOnly: true,  // Can't be accessed by JavaScript
  secure: true,    // Only sent over HTTPS
  sameSite: 'strict',  // CSRF protection
  maxAge: 7 * 24 * 60 * 60  // 7 days
}));

// Every API call validates cookie
const token = req.cookies.auth_token;
const user = verifyAccessToken(token);
```

---

### Technology Stack Summary

| Category | Choice | Alternative Considered | Reason |
|----------|--------|----------------------|--------|
| **Framework** | Next.js 14 (Pages Router) | App Router, Remix | Stability, ecosystem |
| **Hosting** | Vercel | AWS, Digital Ocean | Zero-config, serverless |
| **Database** | Supabase (PostgreSQL) | Firebase, MongoDB | SQL, RLS, connection pooling |
| **Payments** | Stripe | PayPal, Braintree | Best API, subscription mgmt |
| **AI** | OpenRouter | Direct OpenAI | Multi-model, fallback |
| **Auth** | JWT + httpOnly cookies | Sessions, localStorage | Stateless, secure |

**Core Philosophy:** Choose managed services over self-hosted to minimize operational complexity and maximize development velocity.

---

## Database Schema Reference

### Complete Database Schema

This section provides the **complete** database schema for all tables in the Triangle Intelligence Platform. Each table includes CREATE statements, indexes, RLS policies, and example queries.

---

### Table: users

**Purpose:** Store user account information, authentication credentials, subscription status, and trial information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),

  -- Subscription fields
  subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'past_due', NULL)),
  subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'professional', 'enterprise', NULL)),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,

  -- Trial fields
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  trial_used BOOLEAN DEFAULT false,

  -- Terms acceptance
  terms_accepted_at TIMESTAMPTZ,
  privacy_accepted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_users_subscription_status ON users(subscription_status) WHERE subscription_status = 'active';
CREATE INDEX idx_users_trial_end ON users(trial_end_date) WHERE trial_used = false AND subscription_status IS NULL;

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**Example Queries:**

```sql
-- Get user by email (login)
SELECT id, email, password_hash, role FROM users WHERE email = $1;

-- Get active subscribers count
SELECT COUNT(*) FROM users WHERE subscription_status = 'active';

-- Get trial users expiring soon
SELECT * FROM users
WHERE trial_used = false
  AND trial_end_date < NOW() + INTERVAL '3 days'
  AND subscription_status IS NULL;
```

---

### Table: workflow_sessions

**Purpose:** Store user workflow data from USMCA compliance analysis (localStorage migration target).

```sql
CREATE TABLE workflow_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_data JSONB NOT NULL,
  workflow_type TEXT DEFAULT 'usmca_analysis',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflow_sessions_user ON workflow_sessions(user_id, created_at DESC);
CREATE INDEX idx_workflow_sessions_status ON workflow_sessions(status);

-- RLS Policies
ALTER TABLE workflow_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions"
  ON workflow_sessions
  FOR ALL
  USING (auth.uid() = user_id);
```

**Example session_data JSONB Structure:**

```json
{
  "company": {
    "name": "Acme Corp",
    "type": "manufacturer",
    "trade_volume": "1000000"
  },
  "product": {
    "description": "Electronic components",
    "hs_code": "8541.40",
    "component_origins": [
      {"country": "USA", "percentage": 60, "component_type": "Assembly"},
      {"country": "Mexico", "percentage": 40, "component_type": "Raw materials"}
    ]
  },
  "results": {
    "qualification_status": "QUALIFIED",
    "tariff_savings": 15000,
    "compliance_gaps": []
  }
}
```

---

### Table: service_requests

**Purpose:** Track professional service purchases (USMCA certificates, supplier sourcing, etc.).

```sql
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_company TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN (
    'usmca-certificates',
    'hs-classification',
    'crisis-response',
    'supplier-sourcing',
    'manufacturing-feasibility',
    'market-entry'
  )),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending_payment',
    'pending',
    'in_progress',
    'completed',
    'cancelled'
  )),
  price DECIMAL(10,2) NOT NULL,
  subscriber_data JSONB NOT NULL,
  stripe_payment_intent TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_service_requests_user ON service_requests(user_id, created_at DESC);
CREATE INDEX idx_service_requests_status ON service_requests(status, created_at DESC);
CREATE INDEX idx_service_requests_type ON service_requests(service_type);
CREATE INDEX idx_service_requests_paid ON service_requests(paid_at) WHERE paid_at IS NOT NULL;

-- RLS Policies
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
  ON service_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON service_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update requests"
  ON service_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

### Table: service_completions

**Purpose:** Store completed service deliverables (reports, certificates).

```sql
CREATE TABLE service_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  completion_data JSONB NOT NULL,
  report_url TEXT,
  completed_by UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_service_completions_request ON service_completions(service_request_id);
CREATE INDEX idx_service_completions_completed_by ON service_completions(completed_by);

-- RLS Policies
ALTER TABLE service_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own completions"
  ON service_completions FOR SELECT
  USING (
    service_request_id IN (
      SELECT id FROM service_requests WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert completions"
  ON service_completions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

### Table: certificates

**Purpose:** Store generated USMCA certificates.

```sql
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_request_id UUID REFERENCES service_requests(id),
  certificate_number TEXT UNIQUE NOT NULL,
  certificate_data JSONB NOT NULL,
  pdf_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'revoked')),
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);
CREATE INDEX idx_certificates_status ON certificates(status);

-- RLS Policies
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
  ON certificates FOR SELECT
  USING (auth.uid() = user_id);
```

---

### Table: notifications

**Purpose:** Store user notifications (service updates, trial expiration reminders).

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'trial_expiring',
    'trial_expired',
    'service_completed',
    'payment_failed',
    'subscription_renewed'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

---

### SQL Functions

#### get_monthly_revenue()

**Purpose:** Calculate monthly revenue from subscriptions and services.

```sql
CREATE OR REPLACE FUNCTION get_monthly_revenue()
RETURNS TABLE (
  month TEXT,
  subscription_revenue NUMERIC,
  service_revenue NUMERIC,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT
      TO_CHAR(generate_series(
        NOW() - INTERVAL '6 months',
        NOW(),
        '1 month'::INTERVAL
      ), 'YYYY-MM') AS month
  ),
  sub_revenue AS (
    SELECT
      TO_CHAR(u.subscription_start_date, 'YYYY-MM') AS month,
      SUM(
        CASE u.subscription_tier
          WHEN 'starter' THEN 99
          WHEN 'professional' THEN 299
          WHEN 'enterprise' THEN 599
          ELSE 0
        END
      ) AS revenue
    FROM users u
    WHERE u.subscription_status = 'active'
      AND u.subscription_start_date >= NOW() - INTERVAL '6 months'
    GROUP BY TO_CHAR(u.subscription_start_date, 'YYYY-MM')
  ),
  serv_revenue AS (
    SELECT
      TO_CHAR(sr.paid_at, 'YYYY-MM') AS month,
      SUM(sr.price) AS revenue
    FROM service_requests sr
    WHERE sr.paid_at IS NOT NULL
      AND sr.paid_at >= NOW() - INTERVAL '6 months'
    GROUP BY TO_CHAR(sr.paid_at, 'YYYY-MM')
  )
  SELECT
    m.month,
    COALESCE(sr.revenue, 0) AS subscription_revenue,
    COALESCE(sv.revenue, 0) AS service_revenue,
    COALESCE(sr.revenue, 0) + COALESCE(sv.revenue, 0) AS total_revenue
  FROM months m
  LEFT JOIN sub_revenue sr ON m.month = sr.month
  LEFT JOIN serv_revenue sv ON m.month = sv.month
  ORDER BY m.month DESC;
END;
$$ LANGUAGE plpgsql;
```

---

### Database Relationships Diagram

```
users (1) ──────── (many) workflow_sessions
  │
  ├─────── (many) service_requests (1) ──── (many) service_completions
  │
  ├─────── (many) certificates
  │
  └─────── (many) notifications
```

---

## API Endpoint Specifications

### Authentication Endpoints

#### POST /api/auth/register

**Description:** Create a new user account with 14-day trial.

**Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "accept_terms": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "trial_end_date": "2025-10-15T00:00:00Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Email already exists"
}
```

---

#### POST /api/auth/login

**Description:** Authenticate user and set httpOnly cookie with JWT.

**Authentication:** None required

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user"
  }
}
```

**Side Effect:** Sets `auth_token` httpOnly cookie with JWT (expires in 7 days)

---

#### POST /api/auth/logout

**Description:** Clear authentication cookie.

**Authentication:** Required (valid JWT cookie)

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Side Effect:** Clears `auth_token` cookie

---

#### POST /api/auth/refresh

**Description:** Refresh expired access token using refresh token.

**Authentication:** Required (valid refresh_token cookie)

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed"
}
```

**Side Effect:** Sets new `auth_token` cookie

---

### User Endpoints

#### GET /api/user/profile

**Description:** Get current user's profile information.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "company_name": "Acme Corp",
    "phone": "+1-555-0100",
    "avatar_url": "https://...",
    "created_at": "2025-10-01T00:00:00Z"
  }
}
```

---

#### PATCH /api/user/profile

**Description:** Update user profile information.

**Authentication:** Required

**Request Body:**
```json
{
  "full_name": "John Smith",
  "company_name": "New Corp",
  "phone": "+1-555-0200"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Smith",
    "company_name": "New Corp",
    "phone": "+1-555-0200"
  }
}
```

---

#### GET /api/user/trial-status

**Description:** Get user's trial or subscription status.

**Authentication:** Required

**Request Body:** None

**Response (200 OK - Trial Active):**
```json
{
  "success": true,
  "hasAccess": true,
  "type": "trial",
  "daysRemaining": 10,
  "trialEndDate": "2025-10-11T00:00:00Z"
}
```

**Response (200 OK - Subscription Active):**
```json
{
  "success": true,
  "hasAccess": true,
  "type": "subscription"
}
```

**Response (200 OK - Expired):**
```json
{
  "success": true,
  "hasAccess": false,
  "type": "expired"
}
```

---

#### GET /api/user/subscription

**Description:** Get user's subscription details.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "subscription": {
    "status": "active",
    "tier": "professional",
    "start_date": "2025-10-01T00:00:00Z",
    "end_date": "2025-11-01T00:00:00Z",
    "cancel_at_period_end": false
  }
}
```

---

#### POST /api/user/cancel-subscription

**Description:** Cancel user's subscription (effective at period end).

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription will be cancelled at period end",
  "end_date": "2025-11-01T00:00:00Z"
}
```

---

### Stripe Endpoints

#### POST /api/stripe/create-checkout-session

**Description:** Create Stripe Checkout session for subscription purchase.

**Authentication:** Required

**Request Body:**
```json
{
  "tier": "professional"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/..."
}
```

---

#### POST /api/stripe/webhook

**Description:** Handle Stripe webhook events (subscription created, payment failed, etc.).

**Authentication:** Stripe signature verification (webhook secret)

**Request Headers:**
- `stripe-signature`: Webhook signature for verification

**Request Body:** Stripe event object (varies by event type)

**Response (200 OK):**
```json
{
  "received": true
}
```

**Handled Events:**
- `checkout.session.completed` - Subscription or service purchase completed
- `customer.subscription.updated` - Subscription status changed
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.payment_failed` - Payment failed (retry or cancel)

---

#### POST /api/stripe/verify-session

**Description:** Verify Stripe Checkout session after redirect.

**Authentication:** Required

**Request Body:**
```json
{
  "session_id": "cs_test_..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "subscription": {
    "status": "active",
    "tier": "professional",
    "start_date": "2025-10-01T00:00:00Z"
  }
}
```

---

### Service Request Endpoints

#### POST /api/services/create-request

**Description:** Create service request and Stripe checkout for professional service.

**Authentication:** Required

**Request Body:**
```json
{
  "service_type": "supplier-sourcing",
  "subscriber_data": {
    "company_name": "Acme Corp",
    "product_description": "Industrial widgets",
    "qualification_status": "QUALIFIED"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "checkout_url": "https://checkout.stripe.com/pay/...",
  "service_request_id": "uuid"
}
```

---

#### POST /api/services/verify-payment

**Description:** Verify service payment after Stripe checkout.

**Authentication:** Required

**Request Body:**
```json
{
  "session_id": "cs_test_...",
  "service_request_id": "uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "service": {
    "id": "uuid",
    "service_type": "supplier-sourcing",
    "status": "pending",
    "price": 450
  }
}
```

---

#### GET /api/user/my-services

**Description:** Get all service requests for current user.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "services": [
    {
      "id": "uuid",
      "service_type": "supplier-sourcing",
      "client_company": "Acme Corp",
      "status": "completed",
      "price": 450,
      "created_at": "2025-10-01T00:00:00Z",
      "paid_at": "2025-10-01T00:05:00Z",
      "service_completions": [
        {
          "id": "uuid",
          "report_url": "https://...",
          "completed_at": "2025-10-05T00:00:00Z"
        }
      ]
    }
  ]
}
```

---

### Admin Endpoints

#### GET /api/admin/analytics

**Description:** Get admin analytics dashboard data.

**Authentication:** Required (admin role)

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "analytics": {
    "activeSubscribers": 150,
    "trialUsers": 45,
    "monthlyRecurringRevenue": 25000,
    "totalServiceRevenue": 18500,
    "pendingServiceRequests": 12,
    "trialConversionRate": 35.5,
    "monthlyRevenue": [
      {
        "month": "2025-10",
        "subscription_revenue": 25000,
        "service_revenue": 4500,
        "total_revenue": 29500
      }
    ]
  }
}
```

---

## Testing Strategy

### Testing Philosophy

**Goal:** Ensure production readiness with minimal testing overhead. Focus on critical paths and integration points.

**Approach:**
- **Manual Testing**: Critical user flows
- **Integration Tests**: API endpoints with real database
- **E2E Tests**: Payment flows, authentication
- **Performance Tests**: Database queries, API response times

---

### 1. Unit Testing (Optional for MVP)

**Tools:** Jest or Vitest

**What to Test:**
- Utility functions (JWT generation/verification)
- Input validation/sanitization
- Error handling logic

**Example:**
```javascript
// lib/auth/__tests__/jwt.test.js
import { generateAccessToken, verifyAccessToken } from '../jwt';

describe('JWT Utilities', () => {
  test('generates valid JWT token', () => {
    const user = { id: 'test-id', email: 'test@example.com', role: 'user' };
    const token = generateAccessToken(user);
    expect(token).toBeTruthy();
  });

  test('verifies valid token', () => {
    const user = { id: 'test-id', email: 'test@example.com', role: 'user' };
    const token = generateAccessToken(user);
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe('test-id');
  });

  test('rejects expired token', () => {
    // Mock expired token
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    expect(() => verifyAccessToken(expiredToken)).toThrow('Token expired');
  });
});
```

**Run Tests:**
```bash
npm test
```

---

### 2. Integration Testing (API Routes)

**Tools:** Jest + Supertest or built-in Next.js testing

**What to Test:**
- API endpoints with real database (test environment)
- Authentication middleware
- Database queries
- Error handling

**Example:**
```javascript
// __tests__/api/auth/login.test.js
import { createMocks } from 'node-mocks-http';
import handler from '../../../pages/api/auth/login';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('/api/auth/login', () => {
  test('returns 200 with valid credentials', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'SecurePass123!'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toMatchObject({
      success: true,
      user: expect.objectContaining({
        email: 'test@example.com'
      })
    });
  });

  test('returns 401 with invalid credentials', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'WrongPassword'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toMatchObject({
      success: false,
      error: 'Invalid credentials'
    });
  });
});
```

---

### 3. E2E Testing (Critical Flows)

**Tools:** Playwright

**What to Test:**
- User registration → Trial → Subscription purchase
- Service purchase flow
- Login/logout
- Profile updates

**Setup:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Example:**
```javascript
// e2e/subscription-flow.spec.js
import { test, expect } from '@playwright/test';

test('complete subscription purchase flow', async ({ page }) => {
  // 1. Navigate to homepage
  await page.goto('http://localhost:3000');

  // 2. Click register
  await page.click('text=Sign Up');

  // 3. Fill registration form
  await page.fill('input[name="email"]', 'newuser@example.com');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.fill('input[name="full_name"]', 'Test User');
  await page.check('input[name="accept_terms"]');
  await page.click('button[type="submit"]');

  // 4. Wait for redirect to profile
  await expect(page).toHaveURL('/profile');

  // 5. See trial banner
  await expect(page.locator('text=Free Trial Active')).toBeVisible();

  // 6. Click upgrade to Pro
  await page.click('text=Upgrade to Pro');

  // 7. Should redirect to pricing
  await expect(page).toHaveURL('/pricing');

  // 8. Select Professional tier
  await page.click('button:has-text("Choose Professional")');

  // 9. Stripe Checkout opens (can't test fully without Stripe test mode)
  await expect(page.url()).toContain('checkout.stripe.com');
});
```

**Run E2E Tests:**
```bash
npx playwright test
```

---

### 4. Performance Testing

**Tools:** Manual + Lighthouse + Database query logs

**What to Test:**
- API response times < 400ms
- Database queries < 200ms
- Page load times < 2s
- Lighthouse score > 90

**Database Query Performance:**
```sql
-- Enable query timing in Supabase
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'test@example.com';

-- Should show execution time < 5ms with index
```

**API Performance Test:**
```javascript
// Load test with autocannon
npm install --save-dev autocannon

// Run load test
npx autocannon -c 10 -d 30 http://localhost:3000/api/user/profile
```

---

### 5. Stripe Testing

**Use Stripe Test Mode:**

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Authentication Required: `4000 0025 0000 3155`

**Test Webhook Locally:**
```bash
# Install Stripe CLI
npm install -g stripe-cli

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test webhook
stripe trigger checkout.session.completed
```

**Verify Webhook Processing:**
1. Create subscription with test card
2. Check Stripe Dashboard → Developers → Webhooks → Logs
3. Verify database updated correctly

---

### 6. Manual Testing Checklist

**Authentication:**
- [ ] Register new user → Account created, JWT cookie set, trial dates populated
- [ ] Login with correct password → Cookie set, redirected to profile
- [ ] Login with wrong password → Error shown, no cookie
- [ ] Logout → Cookie cleared, redirected to homepage
- [ ] Access protected page without login → Redirected to login

**Trial Management:**
- [ ] New user sees trial banner with days remaining
- [ ] Trial expires (manually set trial_end_date to past) → Access blocked
- [ ] Trial expired user sees upgrade prompt
- [ ] Trial converts to subscription → Banner changes to subscription info

**Subscription Flow:**
- [ ] Select plan → Redirected to Stripe Checkout
- [ ] Complete payment (test card) → Webhook updates database
- [ ] Verify session → Subscription status shows "active"
- [ ] Cancel subscription → Status changes to "cancelled at period end"

**Service Purchase:**
- [ ] Select service → Stripe checkout opens
- [ ] Complete payment → Service request created with status "pending"
- [ ] Admin marks as completed → User sees "Download Report" button
- [ ] Download report → PDF opens

**Admin Analytics:**
- [ ] Access as admin → Dashboard loads with metrics
- [ ] Access as regular user → 403 error
- [ ] Revenue chart shows last 6 months
- [ ] Metrics update when new subscription created

**Error Handling:**
- [ ] Visit invalid URL → 404 page shown
- [ ] Trigger server error → 500 page shown (generic message, no stack trace)
- [ ] Submit form with XSS payload → Sanitized before database
- [ ] Rate limit login attempts → Blocked after 5 attempts

**Performance:**
- [ ] Run Lighthouse audit → Score > 90
- [ ] Check Network tab → API responses < 400ms
- [ ] Database queries < 200ms (check Supabase logs)
- [ ] Images served as WebP/AVIF

---

### Testing Environments

**Local Development:**
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=local_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_local_...
```

**Vercel Preview (Staging):**
- Automatic deployment on every PR
- Uses test Stripe keys
- Test Supabase project

**Vercel Production:**
- Manual promotion from Preview
- Live Stripe keys
- Production Supabase project

---

## Quick-Start Checklist

### 🚀 Get Started in 15 Minutes

This checklist gets you from zero to running locally in under 15 minutes.

---

### 1. Prerequisites (2 minutes)

**Install Required Software:**
- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] Git installed ([Download](https://git-scm.com/))
- [ ] Code editor (VS Code recommended)

**Verify Installation:**
```bash
node --version  # Should show v18 or higher
npm --version   # Should show 9 or higher
git --version
```

---

### 2. Clone & Install (3 minutes)

```bash
# Clone repository
git clone https://github.com/your-org/triangle-simple.git
cd triangle-simple

# Install dependencies
npm install

# Expected time: ~2 minutes depending on internet speed
```

---

### 3. Environment Setup (5 minutes)

**Copy environment template:**
```bash
cp .env.example .env.local
```

**Configure `.env.local`:**
```env
# Supabase (get from https://supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (get test keys from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (get after webhook setup)

# OpenRouter (get from https://openrouter.ai/)
OPENROUTER_API_KEY=your_openrouter_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your_secure_random_string_here_minimum_32_characters_long

# Cron Secret (for trial expiration checks)
CRON_SECRET=another_secure_random_string
```

**Generate Secure Secrets:**
```bash
# JWT_SECRET (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 4. Database Setup (3 minutes)

**Create Supabase Project:**
1. Go to [https://supabase.com](https://supabase.com)
2. Create new project (takes ~2 minutes to provision)
3. Copy URL and keys to `.env.local`

**Run Database Migrations:**
```bash
# Option A: Use Supabase SQL Editor
# Copy contents of migrations/*.sql files and run in Supabase Dashboard → SQL Editor

# Option B: Use Supabase CLI (if installed)
npx supabase db push
```

**Verify Database:**
- Go to Supabase Dashboard → Table Editor
- Should see tables: `users`, `service_requests`, `workflow_sessions`, etc.

---

### 5. Run Locally (2 minutes)

```bash
# Start development server
npm run dev

# Server starts at http://localhost:3000
```

**Verify It Works:**
- [ ] Open http://localhost:3000 → Homepage loads
- [ ] Click "Sign Up" → Registration page loads
- [ ] Register test user → Account created
- [ ] Check Supabase → User appears in users table

---

### 6. Stripe Webhook Setup (Optional, 5 minutes)

**For local development:**
```bash
# Install Stripe CLI
npm install -g stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy webhook secret to .env.local
# Example: whsec_1234567890abcdef
```

**Test Stripe Integration:**
1. Navigate to `/pricing`
2. Click "Choose Professional"
3. Use test card: `4242 4242 4242 4242`
4. Verify webhook received in console
5. Check database: `subscription_status` should be 'active'

---

### Common Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build           # Build for production
npm start               # Start production server

# Testing
npm test                # Run tests (if configured)
npm run lint            # Check code quality

# Database
# (Use Supabase Dashboard for SQL operations)

# Deployment
vercel                  # Deploy to Vercel (requires Vercel CLI)
```

---

### Troubleshooting Quick Fixes

**Port 3000 Already in Use:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or run on different port
PORT=3001 npm run dev
```

**Module Not Found Errors:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Database Connection Errors:**
- Verify Supabase URL and keys in `.env.local`
- Check Supabase project is active (not paused)
- Verify firewall not blocking Supabase

**Stripe Webhook Not Receiving Events:**
- Ensure Stripe CLI is running (`stripe listen`)
- Check webhook secret in `.env.local` matches CLI output
- Verify endpoint is accessible at `http://localhost:3000/api/stripe/webhook`

---

### Next Steps After Setup

1. **Explore the codebase:**
   - Read `CLAUDE.md` for project overview
   - Review `IMPLEMENTATION_GUIDE.md` for implementation details
   - Check `pages/` for routes and components

2. **Create admin user:**
   ```sql
   -- Run in Supabase SQL Editor
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

3. **Access admin dashboards:**
   - Cristina's Dashboard: http://localhost:3000/admin/broker-dashboard
   - Jorge's Dashboard: http://localhost:3000/admin/jorge-dashboard
   - Analytics: http://localhost:3000/admin/analytics

4. **Start development:**
   - Follow implementation guide stages
   - Test with Stripe test mode
   - Deploy previews with Vercel

---

## 🆘 Troubleshooting Common Vercel Issues

### Issue: Serverless Function Timeout

**Error:** `Function execution timed out after 10s`

**Solutions:**
1. Optimize database queries (add indexes)
2. Move long-running tasks to background jobs
3. Upgrade to Vercel Pro for 60s timeout limit
4. Check Supabase query performance in Dashboard

**Example Fix:**
```javascript
// Before: Slow query
const { data } = await supabase
  .from('service_requests')
  .select('*')
  .eq('user_id', userId); // No index!

// After: Fast query with index
// Add index: CREATE INDEX idx_service_requests_user_id ON service_requests(user_id);
const { data } = await supabase
  .from('service_requests')
  .select('*')
  .eq('user_id', userId); // Now uses index
```

### Issue: Cold Start Latency

**Problem:** First request is slow (1-2 seconds)

**Solutions:**
1. Use Vercel Edge Runtime for static pages
2. Implement caching strategy with `Cache-Control` headers
3. Consider Vercel Edge Middleware for auth checks
4. Keep serverless functions small and focused

**Example Edge Runtime:**
```javascript
// pages/profile.js
export const config = {
  runtime: 'edge', // Use Vercel Edge Runtime for faster response
};

export default function ProfilePage({ user }) {
  // ... component code
}
```

### Issue: Environment Variables Not Loading

**Problem:** `process.env.VAR_NAME` is undefined

**Solutions:**
1. Verify variable names match exactly (case-sensitive)
2. Check variable is set for correct environment (Preview vs Production)
3. Redeploy after adding/updating environment variables
4. Ensure `NEXT_PUBLIC_` prefix for client-side variables

**Debug Steps:**
```bash
# 1. Check Vercel Dashboard: Settings → Environment Variables
# 2. Verify deployment environment matches variable scope
# 3. Redeploy:
vercel --prod

# 4. Check build logs for environment variable issues
```

### Issue: Stripe Webhook Not Receiving Events

**Problem:** Webhooks timing out or not receiving

**Solutions:**
1. Verify webhook URL is publicly accessible
2. Check Stripe Dashboard → Webhooks for failed attempts
3. Ensure `bodyParser: false` in webhook API route
4. Verify webhook signing secret matches environment variable
5. Check Vercel function logs for errors

**Example Webhook Config:**
```javascript
// pages/api/stripe/webhook.js
export const config = {
  api: {
    bodyParser: false, // CRITICAL for webhooks
  },
};
```

**Test Webhook:**
```bash
# Local testing
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test event
stripe trigger checkout.session.completed

# Check Stripe Dashboard → Webhooks → [Your endpoint] → Event logs
```

### Issue: Database Connection Errors

**Problem:** `Connection pool exhausted` or connection timeouts

**Solutions:**
1. Use Supabase connection pooling (automatic with client)
2. Don't create new Supabase client on every request
3. Use singleton pattern for database client
4. Check Supabase project settings for connection limits

**Example Singleton Pattern:**
```javascript
// lib/supabase-server.js
import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

export function getSupabaseServer() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  return supabaseInstance;
}

// Usage in API routes
import { getSupabaseServer } from '../../../lib/supabase-server';

export default async function handler(req, res) {
  const supabase = getSupabaseServer(); // Reuses connection
  // ...
}
```

### Issue: CORS Errors

**Problem:** `Access-Control-Allow-Origin` errors on API calls

**Solution:** Already configured in `vercel.json`, but verify:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" }
      ]
    }
  ]
}
```

### Issue: Build Failures

**Problem:** Deployment fails during build

**Common Causes & Solutions:**
1. **TypeScript errors:** Run `npm run build` locally to catch errors
2. **Missing dependencies:** Ensure all packages in `package.json`
3. **Environment variables:** Some variables may be needed at build time
4. **Memory limits:** Large builds may need more memory (Vercel Pro)

**Debug Build Issues:**
```bash
# Test build locally
npm run build

# Check build logs in Vercel Dashboard → Deployments → [Failed deployment] → View Logs

# Increase build memory (vercel.json)
{
  "build": {
    "env": {
      "NODE_OPTIONS": "--max_old_space_size=4096"
    }
  }
}
```

---

## 💰 Cost Optimization on Vercel

### Estimated Monthly Costs

**Vercel Pro Plan:** $20/month per member
- Unlimited bandwidth
- 1000 GB-hours serverless function execution
- Advanced analytics
- Team collaboration

**Supabase Pro:** $25/month
- 8GB database
- 100GB bandwidth
- Automatic backups
- Connection pooling

**Stripe:** 2.9% + $0.30 per transaction
- No monthly fee
- Pay as you go

**Total Infrastructure:** ~$45/month base + transaction fees

### Optimization Tips

1. **Use Edge Runtime** for static pages (faster, cheaper)
2. **Cache API responses** with `Cache-Control` headers
3. **Optimize images** with Next.js Image component
4. **Minimize serverless function duration** (faster = cheaper)
5. **Use Vercel Edge Middleware** for simple auth checks instead of full API routes

**Example Caching:**
```javascript
export default async function handler(req, res) {
  // Cache response for 1 hour
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const data = await fetchData();
  res.json(data);
}
```

---

## 📚 Additional Resources

**Vercel Documentation:**
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Serverless Functions](https://vercel.com/docs/functions/serverless-functions)

**Supabase + Vercel:**
- [Supabase Vercel Integration](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)

**Stripe + Vercel:**
- [Stripe Webhooks Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)

---

This implementation guide provides:
- Exact code examples (copy-paste ready)
- Vercel-specific deployment guidance
- Step-by-step instructions
- Testing checklists
- Common pitfalls and solutions
- Architecture decisions with rationale
- Estimated hours for each task
- Clear dependencies between tasks
- Troubleshooting guide for Vercel + Supabase + Stripe stack

**Last Updated:** October 2025
**Version:** 1.1.0 (with Vercel deployment guidance)
**Maintainer:** Triangle Intelligence Development Team
