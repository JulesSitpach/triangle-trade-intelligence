# Triangle Intelligence Platform - Flow Verification Guide

## 🎯 Overview

Your platform has **6 major flow categories** with complex interdependencies across:
- Authentication & Authorization
- Subscription & Payment Processing
- USMCA Workflow & Certificate Generation
- Professional Services (6 services)
- Admin Workflows (2 dashboards)
- Component Enrichment & AI Integration

---

## 📊 Critical Flow Categories

### 1. **Authentication & Session Flow**

**Dependencies:**
- Supabase auth tables
- user_profiles table
- Cookie-based sessions (httpOnly)
- JWT_SECRET for signing
- Middleware protection

**Logical Flow to Verify:**
```
Sign Up → user_profiles created → Cookie set → Redirect to dashboard
Login → Session validated → Cookie set → Access granted
Protected Route Access → Middleware checks cookie → Allow/Deny
Session Expiry → Cookie expires → Redirect to login
Logout → Cookie cleared → Redirect to homepage
```

**Database Fields Required:**
```sql
user_profiles:
- id (PK)
- email (UNIQUE)
- password_hash
- subscription_tier (Trial/Starter/Professional/Premium)
- trial_ends_at (NEW - CHECK IF EXISTS)
- created_at
- updated_at
```

**API Endpoints to Test:**
- ✓ `/api/auth/signup` - Creates user + profile
- ✓ `/api/auth/login` - Validates + sets cookie
- ✓ `/api/auth/logout` - Clears cookie
- ✓ `/api/auth/me` - Returns user data with subscription_tier

**Manual Test Checklist:**
- [ ] Sign up new user → Check user_profiles table has entry
- [ ] Login → Check cookie is set in browser DevTools
- [ ] Access /dashboard without login → Redirected to /login
- [ ] Access /dashboard with login → Page loads
- [ ] Check session cookie is httpOnly and secure
- [ ] Logout → Cookie cleared, redirected to homepage

---

### 2. **Subscription & Trial Flow**

**Dependencies:**
- user_profiles.subscription_tier
- user_profiles.trial_ends_at (MISSING - CRITICAL)
- Stripe subscription webhook
- Automatic tier assignment
- Discount calculation logic

**Logical Flow to Verify:**
```
New User → trial_ends_at = now + 7 days → Trial tier
7 days pass → Check trial status → Show upgrade prompt
User subscribes → Stripe checkout → Webhook updates tier
Tier = Professional → 15% discount applied automatically
Tier = Premium → 25% discount applied automatically
User cancels → Webhook updates tier → Access restricted
```

**Database Fields Required:**
```sql
user_profiles:
- subscription_tier (Trial/Starter/Professional/Premium)
- trial_ends_at (TIMESTAMP) ⚠️ CHECK IF EXISTS
- trial_started_at (TIMESTAMP) ⚠️ CHECK IF EXISTS
- stripe_customer_id
- stripe_subscription_id
- subscription_status (active/canceled/past_due)
```

**API Endpoints to Test:**
- ✓ `/api/stripe/create-checkout-session` - Subscription signup
- ✓ `/api/stripe/webhook` - Updates subscription_tier on payment
- ✓ `/api/stripe/create-service-checkout` - Applies tier discount
- ✓ `/api/check-trial-status` (IF EXISTS)

**Manual Test Checklist:**
- [ ] New user → trial_ends_at field exists and is set
- [ ] User with trial_ends_at past → Shows upgrade prompt
- [ ] Subscribe to Professional → subscription_tier = 'Professional'
- [ ] Professional user buys USMCA Sprint ($175) → Charged $149 (15% off)
- [ ] Premium user buys Supply Chain Opt ($275) → Charged $206 (25% off)
- [ ] Starter user buys service → Charged full price (no discount)

---

### 3. **USMCA Workflow Flow**

**Dependencies:**
- Component enrichment system
- OpenRouter API (primary)
- Database tariff data (fallback)
- certificate_generations table
- workflow_history table
- Component validation

**Logical Flow to Verify:**
```
User starts workflow → Subscription check → Allow/Deny
User adds components → Enrichment triggered per component
Enrichment: OpenRouter API → Success/Fail → Database fallback
All components enriched → Analysis runs → Certificate OR Alerts
Certificate generation → PDF created → Saved to database
User views history → Fetches workflow_history → Displays cards
User opens workflow → Preview shown with components table
```

**Database Tables Required:**
```sql
workflow_history:
- id (PK)
- user_id (FK)
- components (JSONB with enrichment data)
- analysis_result (JSONB)
- certificate_data (JSONB)
- created_at

tariff_data:
- hs_code (PK)
- description
- tariff_rate
- effective_date
- source

certificate_generations:
- id (PK)
- user_id (FK)
- workflow_id (FK)
- certificate_url
- created_at
```

**API Endpoints to Test:**
- ✓ `/api/enrich-component` - Component enrichment (NEW)
- ✓ `/api/generate-certificate` - Creates USMCA certificate
- ✓ `/api/workflow/save` - Saves workflow to history
- ✓ `/api/workflow/history` - Fetches user's workflows
- ✓ `/api/ai-openrouter` - OpenRouter integration

**Manual Test Checklist:**
- [ ] Add component → Enrichment runs → Check JSONB has 8 fields
- [ ] OpenRouter fails → Database fallback works → Data still shown
- [ ] Complete workflow → workflow_history has entry
- [ ] Certificate generated → PDF downloadable
- [ ] View dashboard → History cards show workflows
- [ ] Click workflow card → Modal opens with component table
- [ ] Component table shows 8 columns of enriched data

---

### 4. **Professional Services Flow (6 Services)**

**Dependencies:**
- service_requests table
- Stripe one-time checkout
- Automatic subscriber discounts
- Admin dashboards (Cristina + Jorge)
- OpenRouter API for service delivery
- Team collaboration ratios

**Logical Flow to Verify:**
```
User views /services → 6 services displayed
User clicks service → Subscription tier checked → Discount calculated
User clicks "Request Service" → Stripe checkout with discounted price
Payment succeeds → service_request created with subscriber_data JSONB
Admin sees request → Opens modal → 3-stage workflow
Stage 1: Research → OpenRouter API call with subscriber context
Stage 2: Analysis → AI processes with business context
Stage 3: Delivery → Expert validates and completes
Service complete → Status updated → User notified
```

**Database Tables Required:**
```sql
service_requests:
- id (PK)
- user_id (FK)
- service_type (1-6)
- subscriber_data (JSONB with enriched components) ⚠️ CRITICAL
- status (pending/in_progress/completed)
- assigned_to (cristina/jorge)
- ai_analysis (JSONB)
- expert_notes (TEXT)
- created_at
- completed_at
```

**Service Configurations Required:**
```javascript
// config/service-configurations.js
SERVICE_PRICES = {
  'trade_health_check': 99,      // No discount
  'usmca_advantage': 175,         // 15%/25% off
  'supply_chain_opt': 275,        // 15%/25% off
  'pathfinder_market': 350,       // 15%/25% off
  'supply_resilience': 450,       // 15%/25% off
  'crisis_navigator': 200         // No discount
};

TIER_DISCOUNTS = {
  'Starter': 0,
  'Professional': 0.15,
  'Premium': 0.25
};
```

**API Endpoints to Test:**
- ✓ `/api/stripe/create-service-checkout` - Applies discount correctly
- ✓ `/api/admin/service-requests` - Fetches requests with subscriber_data
- ✓ `/api/services/[service]/research` - Stage 1 AI call
- ✓ `/api/services/[service]/analyze` - Stage 2 AI call
- ✓ `/api/services/[service]/deliver` - Stage 3 completion

**Manual Test Checklist:**
- [ ] Professional user sees $149 for USMCA Sprint (not $175)
- [ ] Premium user sees $206 for Supply Chain Opt (not $275)
- [ ] Non-subscriber sees $175 for USMCA Sprint (full price)
- [ ] Purchase service → service_request created with subscriber_data JSONB
- [ ] Admin dashboard shows request with enriched component table
- [ ] Open modal → 3 stages work → AI calls successful
- [ ] Complete service → Status = 'completed' in database
- [ ] Both dashboards (Cristina + Jorge) see all 6 services

---

### 5. **Admin Dashboard Flow**

**Dependencies:**
- Admin role verification
- service_requests table
- Component enrichment in subscriber_data
- OpenRouter API integration
- Team collaboration model
- Toast notifications

**Logical Flow to Verify:**
```
Admin login → Role = 'Admin' → Access granted
/admin/broker-dashboard → All 6 services visible
/admin/jorge-dashboard → All 6 services visible
Click service request → Modal opens with subscriber context
Modal shows 8-column component table with enrichment
Stage 1 → OpenRouter API call → Results displayed
Stage 2 → Analysis shown → Expert can edit
Stage 3 → Delivery → Status updated → Request completed
Toast notification on success/error
```

**Database Fields Required:**
```sql
user_profiles:
- role (user/admin) ⚠️ CHECK IF EXISTS

service_requests:
- subscriber_data (JSONB) ⚠️ MUST contain enriched components
  Structure: {
    components: [
      {
        description: "...",
        hs_code: "...",
        tariff_rate: "...",
        origin_country: "...",
        // ... 8 total fields
      }
    ]
  }
```

**Manual Test Checklist:**
- [ ] Login as admin → Access to /admin/* routes
- [ ] broker-dashboard → Shows all service requests
- [ ] jorge-dashboard → Shows all service requests  
- [ ] Open service modal → subscriber_data displays correctly
- [ ] Component table shows 8 columns (not empty)
- [ ] Stage 1 button → OpenRouter API call works
- [ ] Stage 2 → Analysis displayed
- [ ] Stage 3 → Complete button updates status
- [ ] Toast notifications appear on success/error
- [ ] Floating team chat widget visible

---

### 6. **Component Enrichment Flow (CRITICAL)**

**Dependencies:**
- OpenRouter API (primary source)
- tariff_data table (fallback)
- JSONB storage in multiple tables
- Real-time 2025 tariff policy context
- 8-field enrichment structure

**Logical Flow to Verify:**
```
User enters component → Enrichment triggered
Try OpenRouter API with 2025 policy context
  ↓ Success → Return enriched data (8 fields)
  ↓ Fail → Try database tariff_data lookup
    ↓ Success → Return database data (marked STALE)
    ↓ Fail → Return minimal data with error flag

Enriched data structure:
{
  description: "...",
  hs_code: "...",
  tariff_rate: "...",
  origin_country: "...",
  usmca_qualified: true/false,
  trade_risks: [...],
  savings_potential: "$...",
  confidence_score: 0.85
}

Save to JSONB in:
- workflow_history.components
- service_requests.subscriber_data
- Display in 8-column tables everywhere
```

**API Endpoints to Test:**
- ✓ `/api/enrich-component` - Main enrichment endpoint
- ✓ `/api/ai-openrouter` - Primary AI source
- ✓ `/api/tariff-lookup` (if exists) - Database fallback

**Manual Test Checklist:**
- [ ] Add component → OpenRouter enrichment succeeds
- [ ] Disable OpenRouter → Database fallback works
- [ ] Both fail → Minimal data returned with error
- [ ] Enriched data has all 8 fields populated
- [ ] USMCA workflow shows enriched components
- [ ] Admin dashboards show enriched components in tables
- [ ] Service requests include subscriber_data with enrichment
- [ ] confidence_score > 0.80 for AI enrichment
- [ ] Database data marked as "STALE - Jan 2025"

---

## 🔍 Automated Verification Script

### Database Schema Checker

```javascript
// scripts/verify-schema.js
const { createClient } = require('@supabase/supabase-js');

const REQUIRED_FIELDS = {
  user_profiles: [
    'id', 'email', 'password_hash', 'subscription_tier',
    'trial_ends_at',  // ⚠️ CHECK
    'trial_started_at', // ⚠️ CHECK
    'role',  // ⚠️ CHECK
    'stripe_customer_id',
    'stripe_subscription_id'
  ],
  service_requests: [
    'id', 'user_id', 'service_type', 'subscriber_data', // ⚠️ CRITICAL JSONB
    'status', 'assigned_to', 'ai_analysis', 'expert_notes'
  ],
  workflow_history: [
    'id', 'user_id', 'components', // ⚠️ CRITICAL JSONB
    'analysis_result', 'certificate_data'
  ],
  tariff_data: [
    'hs_code', 'description', 'tariff_rate', 'effective_date'
  ]
};

async function verifySchema() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const issues = [];

  for (const [table, fields] of Object.entries(REQUIRED_FIELDS)) {
    // Check table exists
    const { data, error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
      issues.push(`❌ Table '${table}' missing or inaccessible`);
      continue;
    }

    // Check each field exists
    for (const field of fields) {
      if (data.length > 0 && !(field in data[0])) {
        issues.push(`❌ Field '${table}.${field}' missing`);
      }
    }
  }

  return issues;
}

// Run verification
verifySchema().then(issues => {
  if (issues.length === 0) {
    console.log('✅ All database schemas valid');
  } else {
    console.log('❌ Schema issues found:');
    issues.forEach(issue => console.log(issue));
  }
});
```

### API Endpoint Flow Tester

```javascript
// scripts/test-flows.js
async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...');
  
  // Test signup
  const signupRes = await fetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'Test123!'
    })
  });
  console.log('✓ Signup:', signupRes.ok ? 'PASS' : 'FAIL');

  // Test login
  const loginRes = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'Test123!'
    })
  });
  console.log('✓ Login:', loginRes.ok ? 'PASS' : 'FAIL');

  // Test /api/auth/me
  const meRes = await fetch('/api/auth/me');
  const userData = await meRes.json();
  console.log('✓ /api/auth/me returns subscription_tier:', userData.subscription_tier ? 'PASS' : 'FAIL');
}

async function testSubscriptionFlow() {
  console.log('🧪 Testing Subscription Flow...');
  
  // Check trial_ends_at exists
  const { data } = await supabase.from('user_profiles').select('trial_ends_at').limit(1);
  console.log('✓ trial_ends_at field exists:', data[0]?.trial_ends_at !== undefined ? 'PASS' : 'FAIL');
  
  // Test discount calculation
  const serviceRes = await fetch('/api/stripe/create-service-checkout', {
    method: 'POST',
    body: JSON.stringify({
      service_id: 'usmca_advantage',
      user_tier: 'Professional'
    })
  });
  const { price } = await serviceRes.json();
  console.log('✓ Professional discount (15% off $175):', price === 149 ? 'PASS' : 'FAIL');
}

async function testEnrichmentFlow() {
  console.log('🧪 Testing Component Enrichment Flow...');
  
  // Test enrichment endpoint
  const enrichRes = await fetch('/api/enrich-component', {
    method: 'POST',
    body: JSON.stringify({
      description: 'Steel brackets',
      hs_code: '7326.90'
    })
  });
  const enriched = await enrichRes.json();
  
  const has8Fields = Object.keys(enriched).length >= 8;
  console.log('✓ Enrichment returns 8+ fields:', has8Fields ? 'PASS' : 'FAIL');
  console.log('✓ Has confidence_score:', enriched.confidence_score ? 'PASS' : 'FAIL');
}

// Run all tests
async function runAllTests() {
  await testAuthFlow();
  await testSubscriptionFlow();
  await testEnrichmentFlow();
}
```

---

## 📋 Manual Testing Checklist

### Complete End-to-End Test Suite

**Session 1: Authentication & Trial**
- [ ] Sign up new user → Check database for user_profiles entry
- [ ] Verify trial_ends_at is set (7 days from now)
- [ ] Login → Check cookie is httpOnly in DevTools
- [ ] Access /dashboard → Page loads (user authenticated)
- [ ] Logout → Redirected to homepage
- [ ] Try accessing /dashboard again → Redirected to /login

**Session 2: Subscription & Payments**
- [ ] Login as Trial user → See upgrade prompt
- [ ] Subscribe to Professional → Stripe checkout works
- [ ] After payment → subscription_tier = 'Professional' in database
- [ ] View /services page → See discounted prices (15% off)
- [ ] Purchase USMCA Sprint → Charged $149 (not $175)
- [ ] Check Stripe dashboard → Payment recorded

**Session 3: USMCA Workflow**
- [ ] Start workflow → Add 3 components
- [ ] Each component enriches → Check 8 fields present
- [ ] Complete analysis → Certificate generated
- [ ] View dashboard → Workflow appears in history
- [ ] Click workflow card → Modal shows component table
- [ ] Component table has 8 columns with data

**Session 4: Professional Services**
- [ ] Login as Professional user
- [ ] Request "Supply Chain Optimization" service
- [ ] Confirm discounted price shown ($234 instead of $275)
- [ ] Complete purchase → service_request created
- [ ] Check database → subscriber_data JSONB populated
- [ ] subscriber_data includes enriched components

**Session 5: Admin Dashboards**
- [ ] Login as admin (triangleintel@gmail.com)
- [ ] Access /admin/broker-dashboard → All services visible
- [ ] Access /admin/jorge-dashboard → All services visible
- [ ] Click service request → Modal opens
- [ ] Verify 8-column component table displays
- [ ] Stage 1 (Research) → OpenRouter API call works
- [ ] Stage 2 (Analysis) → Results display
- [ ] Stage 3 (Delivery) → Complete service
- [ ] Check database → status = 'completed'

**Session 6: Error Handling**
- [ ] Disable OpenRouter API → Component enrichment falls back to database
- [ ] Invalid login credentials → Error message shown
- [ ] Expired session → Redirected to login
- [ ] Failed payment → User notified, no service created
- [ ] API timeout → Loading state then error message

---

## 🚨 Critical Issues to Check

### High Priority (Launch Blockers)

**1. Missing Database Fields:**
```sql
-- Run this in Supabase SQL editor
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('trial_ends_at', 'trial_started_at', 'role');

-- If any missing, add them:
ALTER TABLE user_profiles 
ADD COLUMN trial_ends_at TIMESTAMP,
ADD COLUMN trial_started_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN role VARCHAR(50) DEFAULT 'user';
```

**2. JSONB Structure Verification:**
```sql
-- Check if subscriber_data exists and is JSONB
SELECT data_type 
FROM information_schema.columns 
WHERE table_name = 'service_requests' 
  AND column_name = 'subscriber_data';

-- Should return: jsonb
```

**3. Component Enrichment Validation:**
```javascript
// Test enrichment returns all 8 fields
const required = [
  'description', 'hs_code', 'tariff_rate', 'origin_country',
  'usmca_qualified', 'trade_risks', 'savings_potential', 'confidence_score'
];

// All fields should be present in enriched component
```

**4. Discount Calculation Logic:**
```javascript
// Verify in /api/stripe/create-service-checkout.js
const TIER_DISCOUNTS = {
  'Starter': 0,
  'Professional': 0.15,
  'Premium': 0.25
};

// Test calculations:
// $175 * (1 - 0.15) = $148.75 → rounds to $149 ✓
// $275 * (1 - 0.15) = $233.75 → rounds to $234 ✓
// $275 * (1 - 0.25) = $206.25 → rounds to $206 ✓
```

---

## 🎯 Priority Testing Order

### Phase 1: Foundation (Launch Blockers)
1. **Authentication** - Must work perfectly
2. **Database Schema** - All fields must exist
3. **Trial System** - trial_ends_at field critical
4. **Subscription Tiers** - Discount logic must be accurate

### Phase 2: Core Features
5. **Component Enrichment** - 8-field structure must work
6. **USMCA Workflow** - End-to-end must complete
7. **Service Purchases** - Payment + discount logic
8. **Admin Dashboards** - Service request visibility

### Phase 3: Polish
9. **Error Handling** - All edge cases covered
10. **Loading States** - UX during API calls
11. **Toast Notifications** - User feedback
12. **Responsive Design** - Mobile/tablet/desktop

---

## 📝 Documentation of Flows

### Create Flow Diagrams
For each major flow, document the actual implementation:

```markdown
# Authentication Flow (AS IMPLEMENTED)

1. User submits /api/auth/signup
   - bcrypt hashes password
   - Creates user_profiles entry
   - Sets trial_ends_at = NOW() + INTERVAL '7 days'
   - Sets trial_started_at = NOW()
   - Sets subscription_tier = 'Trial'

2. Response includes JWT token
   - Signed with JWT_SECRET
   - Set as httpOnly cookie
   - Cookie name: 'auth-token'
   - Expires: 7 days

3. Middleware checks cookie on protected routes
   - Reads 'auth-token' cookie
   - Verifies JWT signature
   - Allows access if valid
   - Redirects to /login if invalid
```

---

## ✅ Summary

**Your platform has 6 major interdependent flows:**
1. Auth & Sessions
2. Subscriptions & Trials
3. USMCA Workflow
4. Professional Services
5. Admin Dashboards
6. Component Enrichment

**Verification Strategy:**
1. Run database schema checker script
2. Run API endpoint flow tester
3. Execute manual testing checklist
4. Document all flows as actually implemented
5. Fix critical issues found
6. Re-test after fixes

**Critical Pre-Launch Checks:**
- ✅ trial_ends_at field exists in user_profiles
- ✅ subscriber_data JSONB contains enriched components
- ✅ Discount calculation works correctly
- ✅ Component enrichment returns 8 fields
- ✅ Admin dashboards show all 6 services
- ✅ OpenRouter → Database fallback chain works

**Use this guide to systematically verify each flow before launch!**