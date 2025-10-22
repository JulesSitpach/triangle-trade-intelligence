# PRE-LAUNCH MANUAL TEST SCRIPTS
**Triangle Intelligence Platform - Production Readiness Testing**

**Testing Date**: __________ (Fill in today's date)
**Tester Name**: __________
**Environment**: Production (https://triangle-trade-intelligence.vercel.app)

---

## 🎯 TESTING OVERVIEW

You will execute **4 comprehensive test suites** today to verify the platform is production-ready:

1. **Certificate Generation** (3 destination flows × 3 certifier types)
2. **Stripe Payment Flow** (Discounts, webhooks, idempotency)
3. **Email Notifications** (Crisis alerts with retry logic)
4. **Admin Dashboards** (Service workflows with enriched data)

**Estimated Time**: 4-6 hours
**Required**:
- Test user accounts (Trial, Professional, Premium tiers)
- Admin account (triangleintel@gmail.com)
- Stripe test cards
- Access to Supabase dashboard

---

## 📋 CRITICAL API REQUIREMENTS

Before testing, understand what the backend APIs **actually require**:

### `/api/ai-usmca-complete-analysis` (Main Workflow)

**REQUIRED Fields** (400 error if missing):
```javascript
{
  "company_name": string,           // ✅ REQUIRED
  "business_type": string,          // ✅ REQUIRED (Exporter/Manufacturer/Importer)
  "industry_sector": string,        // ✅ REQUIRED (Automotive/Electronics/etc)
  "component_origins": array        // ✅ REQUIRED (length > 0)
}
```

**OPTIONAL Fields** (logged as warning if missing, won't block workflow):
```javascript
{
  "destination_country": string,    // ⚠️ CRITICAL for tariff routing (USA/Canada/Mexico)
  "trade_volume": string,           // ⚠️ Used for savings calculation
  "manufacturing_location": string,
  "supplier_country": string
}
```

**UI-Only Fields** (not validated by analysis API, used later):
```javascript
{
  "certifier_type": string,         // Used in PDF generation
  "company_address": string,        // Used in certificates
  "company_country": string,        // Used for trade flow calculation
  "contact_person": string,         // Used in service requests
  "contact_phone": string,          // Used in service requests
  "contact_email": string           // Used in service requests
}
```

### Component Data Structure

**Each component needs**:
```javascript
{
  "country": string,                // Origin country (China, Mexico, USA, etc)
  "percentage": number,             // Value percentage (0-100)
  "component_type": string,         // Short name (e.g., "Steel housing")
  "description": string,            // Detailed description (AI uses this)
  "hs_code": string                 // Optional - AI suggests if missing
}
```

---

## TEST SUITE 1: CERTIFICATE GENERATION (2 hours)

### Test 1.1: USA Destination → EXPORTER Certificate ✅

**Objective**: Verify Section 301 tariffs appear for USA destination, EXPORTER certificate generated

**Prerequisites**:
- Logged in as test user
- Clear browser cache and localStorage

**Step 1: Company Information**

Navigate to `/usmca-workflow`

Fill out ALL 13 required fields (UI + API validation):
- **Company Name**: "Test USA Exporter Inc"
- **Business Type**: **Exporter** ← Maps to EXPORTER certificate
- **Certifier Type**: **EXPORTER** ← Auto-selected based on business type
- **Industry Sector**: **Automotive**
- **Company Address**: "123 Main St, Toronto, ON, Canada M1M 1M1"
- **Company Country**: **Canada** ← Where YOU are
- **Tax ID / EIN**: "123456789" ← REQUIRED for certificates
- **Contact Person**: "John Smith"
- **Contact Phone**: "+1-416-555-1234"
- **Contact Email**: "john@testexporter.com"
- **Annual Trade Volume**: "4800000" ← FREE TEXT INPUT (numbers only, with commas allowed)
- **Primary Supplier Country**: **China** ← REQUIRED for AI analysis
- **Destination Country**: **USA** ← Where you're EXPORTING TO (critical for tariff routing!)

Click **"Next Step"**

**Expected**:
- All fields save to localStorage
- Auto-calculated fields:
  - `trade_flow_type`: "CA→US"
  - `tariff_cache_strategy`: "ai_24hr" (USA = volatile policy)

**Actual Result**: ☐ PASS  ☐ FAIL
**Notes**: ________________________________________

---

**Step 2: Component Origins & Product Details**

**Fill Product Details** (top of page):
- **Product Description**: "Automotive engine mount assemblies with steel housing and rubber vibration dampeners"
- **Manufacturing/Assembly Location**: **Canada** ← Where final product is manufactured

**Add Component #1**:
- **Description**: "Cold-rolled steel automotive housing for engine mounts"
- **Origin Country**: **China**
- **Value Percentage**: **40**
- Click **"🤖 Get AI HS Code Suggestion"**
---
- **Description**: "Extruded aluminum mounting bracket for automotive assembly
**Add Component #2**"
- **Origin Country**: **Mexico**
- **Value Percentage**: **35**
- Click **"🤖 Get AI HS Code Suggestion"**

**Add Component #3**:
- **Description**: "Synthetic rubber gasket seal for fluid containment"
- **Origin Country**: **USA**
- **Value Percentage**: **25**
- Click **"🤖 Get AI HS Code Suggestion"**


**Verify**:
- ✅ HS code suggested (e.g., "7616.99.50")
- ✅ Enrichment shows USMCA rate benefit

Click **"Analyze USMCA Qualification"**

---full output


**Step 3: View Results**


**CRITICAL CHECKS**:
- ✅ China component shows Section 301 tariff (>0%)
- ✅ Mexico/USA components show NO Section 301 (0% or null)
- ✅ `data_source` = "ai_cached_24hr" for all (USA destination)
- ✅ Qualification status displayed (QUALIFIED/NOT_QUALIFIED/PARTIAL)
- ✅ Total savings amount calculated



**Verify Certificate Completion Page**:
- ✅ Certificate type shown: **EXPORTER**
- ✅ EXPORTER-specific fields visible:
  - Authorized Name
  - Title
  - Date
  - Certification checkbox

Fill in authorization fields:
- **Authorized Name**: "John Smith"
- **Title**: "Export Manager"
- **Date**: (Today's date)
- Check: "I certify that the information..."

Click **"Download PDF Certificate"**

---

**Step 5: Verify PDF**

Open downloaded PDF and verify:

**Header**:
- ✅ "UNITED STATES MEXICO CANADA AGREEMENT (USMCA)"
- ✅ "CERTIFICATION OF ORIGIN"
- ✅ Certificate number: Format `USMCA-YYYYMMDD-XXXXX`

**Field 1: Certifier Type**:
- ✅ **EXPORTER** box has "X" (not IMPORTER or PRODUCER)

**Field 2-8: Certificate Data**:
- ✅ All 3 components listed with HS codes
- ✅ Company information displayed
- ✅ Destination: United States

**Section 301 Tariffs** (CRITICAL for USA):
- ✅ China component shows Section 301 rate
- ✅ Total tariff rate includes Section 301
- ✅ Savings calculation accurate

**Signature Block**:
- ✅ Authorized name: "John Smith"
- ✅ Title: "Export Manager"
- ✅ Date displayed
- ✅ No layout issues, professional formatting

**Expected Result**: ✅ PASS
- EXPORTER certificate generated successfully
- Section 301 tariffs visible for China component
- Professional PDF quality

**Actual Result**: ☐ PASS  ☐ FAIL
**PDF Issues Found**: ________________________________________

---

### Test 1.2: Canada Destination → PRODUCER Certificate ✅

**Objective**: Verify NO Section 301 tariffs for Canada, PRODUCER certificate generated

**Clear localStorage** or use incognito window

**Step 1: Company Information**

Fill out ALL 13 required fields:
- **Company Name**: "Test Canadian Manufacturer Ltd"
- **Business Type**: **Manufacturer** ← Maps to PRODUCER certificate
- **Certifier Type**: **PRODUCER** ← Auto-selected
- **Industry Sector**: **Automotive**
- **Company Address**: "456 Industrial Blvd, Detroit, MI, USA 48201"
- **Company Country**: **USA** ← Where YOU manufacture
- **Tax ID / EIN**: "987654321" ← REQUIRED for certificates
- **Contact Person**: "Jane Doe"
- **Contact Phone**: "+1-313-555-5678"
- **Contact Email**: "jane@testmanufacturer.com"
- **Annual Trade Volume**: "12500000" ← FREE TEXT INPUT (numbers only)
- **Primary Supplier Country**: **USA** ← REQUIRED for AI analysis
- **Destination Country**: **Canada** ← Where you're SHIPPING TO

**Expected Auto-Calculations**:
- `trade_flow_type`: "US→CA"
- `tariff_cache_strategy`: "ai_90day" (Canada = stable policy)

---

**Step 2: Component Origins & Product Details**

**Fill Product Details** (top of page):
- **Product Description**: "Automotive brake system assemblies with cast iron rotors and ceramic pads"
- **Manufacturing/Assembly Location**: **USA** ← Where final product is manufactured (PRODUCER)

Click outside field to save.

---

**Add Component #1**:
- **Description**: "Cast iron brake rotor for automotive braking systems"
- **Origin Country**: **USA**
- **Value Percentage**: **60**
- Click **"🤖 Get AI HS Code Suggestion"**

**Expected**: HS code suggested (e.g., "8708.31.50")

**Add Component #2**:
- **Description**: "Ceramic composite brake pad with friction coating"
- **Origin Country**: **Mexico**
- **Value Percentage**: **30**
- Click **"🤖 Get AI HS Code Suggestion"**

**Add Component #3**:
- **Description**: "Precision-machined hydraulic piston for brake caliper"
- **Origin Country**: **Japan**
- **Value Percentage**: **10**
- Click **"🤖 Get AI HS Code Suggestion"**

Click **"Analyze USMCA Qualification"**

---

**Step 3: View Results**

**CRITICAL VERIFICATION - Canada Routing**:

Check component enrichment in API response:

```javascript
{
  "data_source": "ai_cached_90day",     // ← 90-day cache (Canada = stable)
  "tariff_policy": "Canadian CBSA rates",
  "mfn_rate": 6.5,                      // CBSA MFN duty
  "cusma_rate": 0,                      // Canada calls USMCA "CUSMA"
  "section_301": null,                  // ← NO US tariffs for Canada!
  "port_fees": null                     // ← NO US port fees for Canada!
}
```

**VERIFY**:
- ✅ `data_source` = "ai_cached_90day" (NOT ai_24hr)
- ✅ NO Section 301 tariffs shown (null or 0)
- ✅ NO port fees shown (null or 0)
- ✅ Rates labeled as CBSA/CUSMA (Canadian terminology)

**Data Source**: __________
**Section 301 Present?**: ☐ YES (FAIL)  ☐ NO (PASS)
**Port Fees Present?**: ☐ YES (FAIL)  ☐ NO (PASS)

---

**Step 4: Generate Certificate**

Click **"Generate USMCA Certificate"**

**Verify Certificate Type**: **PRODUCER**

**PRODUCER-Specific Fields**:
- ✅ Manufacturing facility details
- ✅ Production process description
- ✅ Quality certifications

Fill in authorization and download PDF.

---

**Step 5: Verify PDF**

**Field 1: Certifier Type**:
- ✅ **PRODUCER** box has "X" (not EXPORTER or IMPORTER)

**PRODUCER-Specific Content**:
- ✅ Manufacturing facility address
- ✅ Production details section
- ✅ More detailed than EXPORTER certificate

**Tariff Verification**:
- ✅ NO Section 301 tariffs listed
- ✅ CBSA/CUSMA rates shown (Canadian terminology)
- ✅ Destination: Canada

**Actual Result**: ☐ PASS  ☐ FAIL

---

### Test 1.3: Mexico Destination → IMPORTER Certificate ✅

**Objective**: Verify FREE database lookups for Mexico, data staleness warnings

**Clear localStorage** or use incognito window

**Step 1: Company Information**

Fill out ALL 13 required fields:
- **Company Name**: "Test Mexico Importer SA de CV"
- **Business Type**: **Importer** ← Maps to IMPORTER certificate
- **Certifier Type**: **IMPORTER** ← Auto-selected
- **Industry Sector**: **Industrial Machinery**
- **Company Address**: "789 Commercial Ave, Houston, TX, USA 77001"
- **Company Country**: **USA** ← Where goods originate
- **Tax ID / EIN**: "555123456" ← REQUIRED for certificates
- **Contact Person**: "Carlos Rodriguez"
- **Contact Phone**: "+1-713-555-9012"
- **Contact Email**: "carlos@testimporter.com"
- **Annual Trade Volume**: "750000" ← FREE TEXT INPUT (numbers only)
- **Primary Supplier Country**: **USA** ← REQUIRED for AI analysis
- **Destination Country**: **Mexico** ← Where you're IMPORTING TO (critical for FREE database routing!)

**Expected Auto-Calculations**:
- `trade_flow_type`: "US→MX"
- `tariff_cache_strategy`: "database" (Mexico = stable, FREE lookups)

---

**Step 2: Component Origins & Product Details**

**Fill Product Details** (top of page):
- **Product Description**: "Industrial machinery for manufacturing plants (imported, not manufactured)"
- **Manufacturing/Assembly Location**: **Does Not Apply (Imported/Distributed Only)** ← IMPORTER doesn't manufacture

Click outside field to save.

---

**Add Component #1**:
- **Description**: "Structural steel machinery frame for industrial equipment"
- **Origin Country**: **USA**
- **Value Percentage**: **70**
- Click **"🤖 Get AI HS Code Suggestion"**

**Add Component #2**:
- **Description**: "Three-phase electric motor for industrial machinery"
- **Origin Country**: **Germany**
- **Value Percentage**: **20**
- Click **"🤖 Get AI HS Code Suggestion"**

**Add Component #3**:
- **Description**: "Digital control panel assembly with touchscreen"
- **Origin Country**: **China**
- **Value Percentage**: **10**
- Click **"🤖 Get AI HS Code Suggestion"**

Click **"Analyze USMCA Qualification"**

---

**Step 3: View Results**

**CRITICAL VERIFICATION - Mexico Database Routing**:

Check component enrichment:

```javascript
{
  "data_source": "database",            // ← FREE lookup (no AI cost!)
  "tariff_policy": "Mexican T-MEC rates (stable)",
  "mfn_rate": 10,                       // Mexican IGI duty
  "usmca_rate": 0,                      // T-MEC preferential rate
  "cache_age_days": 95,                 // ← Shows data age
  "staleness_warning": "⚠️ WARNING: Tariff data is 95 days old (last updated: 2025-01-15). Consider AI verification for current rates.",
  "ai_confidence": 75,                  // ← Reduced from 100 due to staleness
  "last_updated": "2025-01-15"
}
```

**VERIFY**:
- ✅ `data_source` = "database" (NOT ai_cached)
- ✅ `cache_age_days` shown (data freshness indicator)
- ✅ If `cache_age_days` > 90: `staleness_warning` appears
- ✅ If `cache_age_days` > 180: CRITICAL staleness warning
- ✅ `ai_confidence` reduced for stale data (75 instead of 100)

**Data Source**: __________
**Cache Age**: __________ days
**Staleness Warning Shown**: ☐ YES  ☐ NO

---

**Check Vercel Logs / OpenRouter Dashboard**:
- ✅ Confirm NO AI API calls made during component enrichment
- ✅ Cost = $0.00 (100% database lookups)

**AI API Calls Made**: ☐ YES (FAIL)  ☐ NO (PASS)
**Estimated Cost**: $__________

---

**Step 4: Generate Certificate**

Click **"Generate USMCA Certificate"**

**Verify Certificate Type**: **IMPORTER**

**IMPORTER-Specific Fields**:
- ✅ Import license number
- ✅ Customs broker details
- ✅ Port of entry

Fill in authorization and download PDF.

---

**Step 5: Verify PDF**

**Field 1: Certifier Type**:
- ✅ **IMPORTER** box has "X" (not EXPORTER or PRODUCER)

**IMPORTER-Specific Content**:
- ✅ Import documentation section
- ✅ Simpler than PRODUCER/EXPORTER certificates
- ✅ Destination: Mexico (T-MEC terminology)

**Tariff Verification**:
- ✅ Mexican rates (IGI duty)
- ✅ T-MEC preferential rates
- ✅ Staleness warnings visible (if applicable)

**Actual Result**: ☐ PASS  ☐ FAIL

---

## TEST SUITE 2: STRIPE PAYMENT FLOW (1.5 hours)

### Test 2.1: Professional Tier 15% Discount ✅

**Objective**: Verify subscriber discount calculation in `/api/stripe/create-service-checkout`

**Setup**:
1. Login to Supabase dashboard
2. Update test user tier:
   ```sql
   UPDATE user_profiles
   SET subscription_tier = 'Professional'
   WHERE user_id = '<your-test-user-id>';
   ```
3. Logout and login again to refresh session

---

**Navigate to `/services`**

Click **"Purchase Service"** on **USMCA Advantage Sprint** ($175 base price)

**Expected Discount Calculation** (from API code):
```javascript
// File: pages/api/stripe/create-service-checkout.js
const TIER_DISCOUNTS = {
  'Starter': 0,          // No discount
  'Professional': 0.15,  // 15% off
  'Premium': 0.25        // 25% off
};

// Calculation for Professional tier
basePrice = 17500 cents  // $175
discount = 0.15
servicePrice = Math.round(17500 * (1 - 0.15))
             = Math.round(17500 * 0.85)
             = Math.round(14875)
             = 14875 cents
             = $148.75
```

**VERIFY**:
- ✅ Service page shows: **$149** (with 15% discount badge)
- ✅ NOT $175 (base price)

**Actual Price Shown**: $__________

---

**Click "Proceed to Payment"**

**Stripe Checkout Verification**:
- ✅ Checkout session opens
- ✅ Line item: "USMCA Advantage Sprint"
- ✅ Amount: **$149.00**

Use Stripe test card:
- **Card Number**: 4242 4242 4242 4242
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

Click **"Pay"**

---

**Verify Payment Success**:

1. **Redirected to success page**:
   - ✅ Success message displayed
   - ✅ Service request confirmation

2. **Check Supabase `service_requests` table**:
   ```sql
   SELECT id, service_type, price, status, created_at
   FROM service_requests
   WHERE user_id = '<your-user-id>'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   **Expected**:
   ```javascript
   {
     "service_type": "usmca-advantage",
     "price": 149.00,           // ← Discounted price
     "status": "pending_fulfillment",  // ← Updated by webhook
     "stripe_session_id": "cs_test_...",
     "paid_at": "2025-10-19T..."
   }
   ```

3. **Check Stripe Dashboard**:
   - Go to: Developers → Webhooks → Recent Events
   - Find: `checkout.session.completed`
   - ✅ Event status: 200 OK
   - ✅ Amount: $149.00

**Actual Result**: ☐ PASS  ☐ FAIL
**Database Price**: $__________
**Database Status**: __________

---

### Test 2.2: Premium Tier 25% Discount ✅

**Objective**: Verify higher tier discount

**Setup**:
```sql
UPDATE user_profiles
SET subscription_tier = 'Premium'
WHERE user_id = '<your-test-user-id>';
```

**Navigate to `/services`**

Click **"Purchase Service"** on **Supply Chain Optimization** ($275 base)

**Expected Calculation**:
```javascript
basePrice = 27500 cents  // $275
discount = 0.25
servicePrice = Math.round(27500 * 0.75)
             = Math.round(20625)
             = 20625 cents
             = $206.25 → rounds to $206
```

**VERIFY**:
- ✅ Price shown: **$206** (with 25% discount badge)
- ✅ NOT $275

**Complete payment with test card**

**Verify**:
- ✅ Database shows price: $206.00
- ✅ Stripe charged: $206.00

**Actual Result**: ☐ PASS  ☐ FAIL

---

### Test 2.3: NO Discount for Excluded Services ✅

**Objective**: Verify Trade Health Check excluded from discounts

**Still logged in as Premium user** (25% discount normally)

**Navigate to `/services`**

Click **"Purchase Service"** on **Trade Health Check** ($99 base)

**API Logic**:
```javascript
const NO_DISCOUNT_SERVICES = ['trade-health-check', 'crisis-navigator'];

// Check if service excluded
if (NO_DISCOUNT_SERVICES.includes('trade-health-check')) {
  discount = 0;  // Override tier discount
  servicePrice = 9900;  // Full price
}
```

**VERIFY**:
- ✅ Price shown: **$99** (NO discount badge)
- ✅ Message: "Emergency service - no subscriber discounts"
- ✅ NOT $74 (which would be 25% off)

**Actual Price Shown**: $__________
**Discount Applied**: ☐ YES (FAIL)  ☐ NO (PASS)

---

### Test 2.4: Webhook Idempotency ✅

**Objective**: Verify duplicate webhooks don't create duplicate charges

**Prerequisites**:
- Stripe CLI installed
- Terminal access

**Step 1: Install Stripe CLI** (if not installed):
```bash
# Windows (using Scoop)
scoop install stripe

# Mac
brew install stripe/stripe-cli/stripe
```

**Step 2: Login**:
```bash
stripe login
```

**Step 3: Forward Webhooks**:
```bash
stripe listen --forward-to https://triangle-trade-intelligence.vercel.app/api/stripe/webhook
```

**Step 4: Complete a Test Payment**:
- Purchase any service
- Note the Stripe event ID from terminal output (e.g., `evt_1234567890abcdef`)

**Step 5: Check Database (First Event)**:
```sql
-- Check service_requests
SELECT COUNT(*) as service_count
FROM service_requests
WHERE stripe_session_id = 'cs_test_...';  -- Use actual session ID

-- Check webhook_events
SELECT event_id, processed_at
FROM webhook_events
WHERE event_id = 'evt_1234567890abcdef';
```

**Expected**:
- `service_count` = 1
- `webhook_events` has 1 row

---

**Step 6: Resend Same Event** (simulate duplicate):
```bash
stripe events resend evt_1234567890abcdef
```

**Step 7: Check Terminal Output**:

Expected response:
```json
{
  "received": true,
  "message": "Event already processed (idempotent)",
  "event_id": "evt_1234567890abcdef",
  "processed_at": "2025-10-19T12:00:00Z"
}
```

**Step 8: Verify Database (After Duplicate)**:
```sql
-- Should still be 1 service request
SELECT COUNT(*) as service_count
FROM service_requests
WHERE stripe_session_id = 'cs_test_...';

-- Should still be 1 webhook event
SELECT COUNT(*) as event_count
FROM webhook_events
WHERE event_id = 'evt_1234567890abcdef';
```

**VERIFY**:
- ✅ `service_count` = 1 (NO duplicate)
- ✅ `event_count` = 1 (event recorded once)
- ✅ Webhook response indicates "already processed"

**Actual Result**: ☐ PASS  ☐ FAIL

---

## TEST SUITE 3: EMAIL NOTIFICATIONS (1 hour)

### Test 3.1: Professional Tier Crisis Alert Email ✅

**Objective**: Verify high/critical alerts trigger emails for Professional+ tiers

**Setup**:
```sql
-- Set test user to Professional tier
UPDATE user_profiles
SET subscription_tier = 'Professional'
WHERE user_id = '<your-user-id>';
```

**Create Test Crisis Alert**:

Login to Supabase → SQL Editor → Run:

```sql
INSERT INTO crisis_alerts (
  alert_type,
  severity_level,
  title,
  description,
  affected_hs_codes,
  affected_destinations,
  is_active
) VALUES (
  'tariff_increase',
  'critical',
  'TEST: Section 301 Tariff Increase - China Steel Products',
  'Testing email notification system. U.S. announces 25% tariff increase on Chinese steel products effective immediately.',
  ARRAY['7326.90.85', '7308.90.30'],
  ARRAY['US'],
  true
);
```

**Create Workflow with Affected HS Code**:
1. Complete USMCA workflow
2. Add component with HS code: **7326.90.85**
3. Set destination_country: **USA**
4. Complete workflow

**Check Email Inbox** (wait 2-3 minutes):

**Expected Email**:
- **From**: Triangle Intelligence <no-reply@triangleintel.com>
- **Subject**: "CRITICAL: Section 301 Tariff Increase - China Steel Products"
- **Body Contains**:
  - Alert title and description
  - Affected HS codes: 7326.90.85
  - Link to dashboard
  - Subscriber tier mentioned: "Professional subscriber"

**VERIFY**:
- ✅ Email received
- ✅ Subject line correct
- ✅ HS codes listed
- ✅ Dashboard link works

**Email Received**: ☐ YES  ☐ NO
**Delivery Time**: __________ minutes

---

**Check Resend Dashboard**:
1. Login to Resend (https://resend.com/emails)
2. Find most recent email
3. **VERIFY**:
   - ✅ Status: "Delivered"
   - ✅ No errors or bounces
   - ✅ Recipient: your test email

**Resend Status**: __________

---

### Test 3.2: Starter Tier NO Email (Dashboard Only) ✅

**Objective**: Verify Starter tier does NOT receive emails

**Setup**:
```sql
-- Change test user to Starter tier
UPDATE user_profiles
SET subscription_tier = 'Starter'
WHERE user_id = '<your-user-id>';
```

**Using same crisis alert from Test 3.1**:

**Navigate to `/dashboard`**

**VERIFY**:
- ✅ Alert visible in dashboard (browser notification)
- ✅ Message shown: "Upgrade to Professional for email alerts"

**Check Email Inbox** (wait 5 minutes):
- ✅ NO email received for Starter tier

**Email Received**: ☐ YES (FAIL)  ☐ NO (PASS)

---

### Test 3.3: Email Queue Retry Logic ✅

**Objective**: Verify failed emails retry automatically

**Prerequisites**:
- Access to `.env` file
- Ability to restart server

**Step 1: Simulate Resend API Failure**:
1. Stop development server
2. Edit `.env.local` → Change `RESEND_API_KEY` to invalid value: `re_INVALID_KEY_TEST`
3. Restart server: `npm run dev:3001`

**Step 2: Trigger Email**:
- Create new critical alert (different title)
- Complete workflow with affected HS code

**Step 3: Check Email Queue**:
```sql
SELECT id, email_type, recipient_email, status, retry_count, error_message
FROM email_queue
WHERE recipient_email = '<your-email>'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**:
- `status` = 'failed'
- `retry_count` = 0
- `error_message` = "Invalid API key" or similar
- `next_retry_at` = NOW() + 5 minutes

---

**Step 4: Restore API Key**:
1. Stop server
2. Fix `.env.local` → Restore correct `RESEND_API_KEY`
3. Restart server

**Step 5: Wait for Cron** (5 minutes):

Email queue cron runs every 5 minutes:
- Fetches failed emails where `next_retry_at` <= NOW()
- Attempts to resend
- Updates status to 'sent' on success

**Step 6: Check Email Queue Again**:
```sql
SELECT status, sent_at, retry_count, resend_message_id
FROM email_queue
WHERE id = '<queue-id-from-step-3>';
```

**Expected**:
- `status` = 'sent'
- `sent_at` = timestamp
- `retry_count` = 1
- `resend_message_id` = Resend message ID

**Check Email Inbox**:
- ✅ Email received (after retry)

**Actual Result**: ☐ PASS  ☐ FAIL
**Retry Count**: __________

---

## TEST SUITE 4: ADMIN DASHBOARD (1.5 hours)

### Test 4.1: Service Workflow Modal with Enriched Data ✅

**Objective**: Verify admin can view enriched component data in 8-column table

**Prerequisites**:
- At least 1 service request in database (from Test Suite 2)
- Admin login

**Step 1: Login as Admin**:
- Email: triangleintel@gmail.com
- Password: Admin2025!

**Step 2: Navigate to Cristina's Dashboard**:
- Go to: `/admin/broker-dashboard`

**VERIFY Dashboard Tabs**:
- ✅ All 6 service tabs visible:
  1. Trade Health Check
  2. USMCA Advantage Sprint
  3. Supply Chain Optimization
  4. Pathfinder Market Entry
  5. Supply Chain Resilience
  6. Crisis Navigator

---

**Step 3: Open USMCA Advantage Tab**:

**VERIFY**:
- ✅ Service requests loaded
- ✅ Dropdown selector shows client companies
- ✅ Service cards show preview data

**Step 4: Select Service Request**:
- Click dropdown → Select test service request
- Service card expands with preview

**VERIFY Preview Card**:
- ✅ Company name displayed
- ✅ Service type shown
- ✅ Price shown (with discount applied)
- ✅ Component count visible

---

**Step 5: Open Service Workflow Modal**:
- Click **"Start Analysis"** button

**VERIFY Modal Opens**:
- ✅ 3-stage workflow visible:
  - Stage 1: Review Client Profile
  - Stage 2: AI Research
  - Stage 3: Delivery

**Step 6: Stage 1 - Review Client Profile**:

**VERIFY Business Context**:
- ✅ Company name: (from workflow)
- ✅ Industry sector: (from workflow)
- ✅ Trade volume: (from workflow)
- ✅ Destination country: (from workflow)

**VERIFY 8-Column Component Table**:

Table columns should show:
1. **Component** - Type/name
2. **Country** - Origin
3. **%** - Value percentage
4. **HS Code** - Classification
5. **Description** - Product details
6. **MFN Rate** - Current duty
7. **USMCA Rate** - Preferential rate
8. **Savings %** - Tariff savings

**CRITICAL CHECKS**:
- ✅ All 8 columns visible
- ✅ All components enriched (no "Pending" states)
- ✅ HS codes populated
- ✅ MFN rates shown
- ✅ USMCA rates shown
- ✅ Savings percentages calculated

**If USA destination**:
- ✅ Section 301 tariffs shown for China components
- ✅ Total rate includes policy adjustments

**Visual Alerts**:
- ✅ Low confidence (<80%) components flagged with ⚠️
- ✅ Mexico sourcing opportunities highlighted
- ✅ Staleness warnings shown (if applicable for Mexico routing)

**Actual Result**: ☐ PASS  ☐ FAIL
**Missing Columns**: __________

---

**Step 7: Navigate Stages**:

Click **"Next Stage"** → Stage 2

**VERIFY**:
- ✅ AI Research form visible
- ✅ Previous data preserved
- ✅ Can navigate back to Stage 1

Click **"Next Stage"** → Stage 3

**VERIFY**:
- ✅ Delivery form visible
- ✅ Completion button available

---

**Step 8: Complete Service**:

Fill delivery notes:
- Notes: "Test completion - enriched data verified"

Click **"Mark as Completed"**

**VERIFY**:
- ✅ Modal closes
- ✅ Toast notification: "Service completed successfully"

**Check Database**:
```sql
SELECT status, updated_at
FROM service_requests
WHERE id = '<service-request-id>';
```

**Expected**:
- `status` = 'completed'
- `updated_at` = recent timestamp

**Actual Result**: ☐ PASS  ☐ FAIL

---

### Test 4.2: Cross-Dashboard Consistency ✅

**Objective**: Verify Cristina and Jorge see same service requests

**Step 1: Open Cristina Dashboard**:
- Navigate to: `/admin/broker-dashboard`
- Go to: **Supply Chain Resilience** tab
- Note:
  - Number of service requests: __________
  - Client company names: __________

**Step 2: Open Jorge Dashboard** (new tab):
- Navigate to: `/admin/jorge-dashboard`
- Go to: **Supply Chain Resilience** tab

**VERIFY**:
- ✅ Same number of requests shown
- ✅ Same client companies listed
- ✅ Same service request data

---

**Step 3: Update Service in Cristina Dashboard**:
- Select a service request
- Open workflow modal
- Complete service (mark as completed)

**Step 4: Refresh Jorge Dashboard**:
- Reload page

**VERIFY**:
- ✅ Service status updated to "completed"
- ✅ Changes reflected immediately
- ✅ No data inconsistencies

**Actual Result**: ☐ PASS  ☐ FAIL

---

### Test 4.3: Dev Issues Dashboard ✅

**Objective**: Verify development issues are logged and displayed

**Navigate to**: `/admin/dev-issues`

**VERIFY Dashboard**:
- ✅ Filter tabs visible:
  - Unresolved
  - Critical
  - All
- ✅ Issue list loads
- ✅ Issues grouped by severity

**Check for Test Issues**:

During previous tests, the following should have been logged:

1. **Missing Optional Fields** (from Test 1.1 if any fields omitted):
   - Type: `missing_data`
   - Severity: `warning`
   - Component: `usmca_analysis`

2. **Staleness Warnings** (from Test 1.3 Mexico routing):
   - Type: `missing_data`
   - Severity: `critical` (if >180 days old)
   - Component: `enrichment_router`

**VERIFY Issue Details**:
- ✅ Issue type shown
- ✅ Severity badge (critical/warning/info)
- ✅ Component identified
- ✅ Created timestamp
- ✅ Context data expandable (JSON)

**Mark Issue as Resolved**:
- Click on an issue
- Click **"Mark Resolved"**
- Add resolution notes: "Test resolution"

**VERIFY**:
- ✅ Issue moves to "Resolved" section
- ✅ Resolution timestamp recorded

**Actual Result**: ☐ PASS  ☐ FAIL

---

## FINAL PRODUCTION READINESS CHECKLIST

### Core Functionality
- [ ] **All 3 certificate types generated** (PRODUCER/EXPORTER/IMPORTER)
- [ ] **Destination routing working** (USA/Canada/Mexico use different strategies)
- [ ] **Section 301 tariffs shown** (USA destination, China components)
- [ ] **NO Section 301 for Canada** (different tariff policy)
- [ ] **Mexico uses database** (FREE lookups, staleness warnings)

### Payment Processing
- [ ] **Professional 15% discount applied**
- [ ] **Premium 25% discount applied**
- [ ] **Excluded services NO discount** (Trade Health Check, Crisis Navigator)
- [ ] **Webhook idempotency working** (no duplicate charges)
- [ ] **Service requests created correctly** (with enriched data)

### Email Notifications
- [ ] **Professional tier receives emails**
- [ ] **Starter tier NO emails** (dashboard only)
- [ ] **Email queue retry working** (failed emails reprocessed)

### Admin Dashboards
- [ ] **8-column component tables** (complete tariff intelligence)
- [ ] **Service workflow modals functional**
- [ ] **Cross-dashboard consistency** (Cristina and Jorge see same data)
- [ ] **Dev issues logged and displayed**

### Monitoring & Health
- [ ] **`/api/health` returns healthy status**
- [ ] **Email queue processing** (cron job working)
- [ ] **Webhook events logged** (idempotency table populated)
- [ ] **Staleness warnings shown** (for old tariff data)

---

## DISCOVERED ISSUES LOG

**Critical Issues** (must fix before production):

1. ________________________________________________

2. ________________________________________________

3. ________________________________________________

**Non-Critical Issues** (can fix post-launch):

1. ________________________________________________

2. ________________________________________________

3. ________________________________________________

---

## GO/NO-GO DECISION

**Total Tests**: 20
**Tests Passed**: ______ / 20
**Tests Failed**: ______

**Critical Blockers**: ______ (must be 0 for GO)

**Production Deployment**: ☐ GO  ☐ NO-GO

**Reason (if NO-GO)**: ________________________________________

**Estimated Fix Time**: ________________________________________

**Next Steps**: ________________________________________

---

**Testing Completed By**: ________________________________________
**Date**: ________________________________________
**Signature**: ________________________________________
