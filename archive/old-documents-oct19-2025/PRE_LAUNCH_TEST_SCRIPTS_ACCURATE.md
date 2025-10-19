# ACCURATE PRE-LAUNCH TEST SCRIPTS
**Based on Actual API Requirements - Not UI Assumptions**

**Testing Date**: __________ (Fill in today's date)
**Environment**: https://triangle-trade-intelligence.vercel.app

---

## 🎯 PURPOSE

This document tests what the **BACKEND APIs ACTUALLY REQUIRE**, not what the UI suggests. Use this to discover UI/API misalignments.

---

## API REQUIREMENTS SUMMARY

### `/api/ai-usmca-complete-analysis` (USMCA Workflow API)

**REQUIRED Fields** (validation error if missing):
```javascript
{
  "company_name": "string",           // REQUIRED
  "business_type": "string",          // REQUIRED
  "industry_sector": "string",        // REQUIRED
  "component_origins": [              // REQUIRED (array, length > 0)
    {
      "country": "string",            // Component origin
      "percentage": number,           // Value percentage
      "component_type": "string",     // Short name
      "description": "string",        // Detailed description
      "hs_code": "string"             // Optional - AI suggests if missing
    }
  ]
}
```

**OPTIONAL Fields** (logged as warning if missing, but won't block):
```javascript
{
  "manufacturing_location": "string",
  "supplier_country": "string",
  "destination_country": "string",    // Used for tariff routing!
  "trade_volume": "string"            // Used for savings calculation
}
```

**Fields UI Requires But API Doesn't Validate**:
```javascript
{
  "certifier_type": "string",         // Used in PDF generation only
  "company_address": "string",        // Not checked by USMCA API
  "company_country": "string",        // Used for trade flow calculation
  "contact_person": "string",         // Used in service requests
  "contact_phone": "string",          // Used in service requests
  "contact_email": "string"           // Used in service requests
}
```

---

## TEST SUITE 1: MINIMAL WORKFLOW (API Requirements Only)

### Test 1.1: Absolute Minimum Required Fields ✅

**Objective**: Test with ONLY the fields the API actually validates

**Payload** (via browser console):
```javascript
// STEP 1: Populate minimal Step 1 data
const minimalFormData = {
  company_name: "Minimal Test Inc",
  business_type: "Exporter",
  industry_sector: "Electronics",
  // Missing: certifier_type, company_address, company_country, destination_country, contact fields, trade_volume
};

// STEP 2: Add single component
const minimalComponent = {
  country: "China",
  percentage: 100,
  component_type: "Steel housing",
  description: "Cold-rolled steel housing for electronics"
  // Missing: hs_code (AI should suggest)
};

// Send to API directly
fetch('/api/ai-usmca-complete-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...minimalFormData,
    component_origins: [minimalComponent]
  })
}).then(r => r.json()).then(console.log);
```

**Expected API Behavior**:
- ✅ **PASS**: API accepts request (has all required fields)
- ⚠️ **WARNING**: Logged to dev_issues about missing optional fields:
  - manufacturing_location
  - supplier_country
  - destination_country
  - trade_volume

**Expected UI Behavior**:
- ❌ **BLOCKS**: UI won't let you proceed without certifier_type, company_address, company_country, destination_country, contact fields, trade_volume

**Test Result**: ________ (PASS/FAIL)
**Observations**: ________________________________________

**This reveals**: UI is MORE STRICT than API (good for data quality, but creates confusion)

---

### Test 1.2: Missing destination_country Impact ✅

**Objective**: Verify tariff routing defaults when destination_country is missing

**Payload**:
```javascript
const formData = {
  company_name: "No Destination Test",
  business_type: "Manufacturer",
  industry_sector: "Automotive",
  // NO destination_country
  component_origins: [{
    country: "Mexico",
    percentage: 100,
    component_type: "Brake rotor",
    description: "Cast iron brake rotor",
    hs_code: "8708.31.50"
  }]
};

fetch('/api/ai-usmca-complete-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
}).then(r => r.json()).then(console.log);
```

**Expected Behavior**:
- API accepts request (destination_country is optional)
- **Tariff routing defaults**: Likely uses 'ai_24hr' strategy (USA assumed)
- **Component enrichment**: Uses AI instead of database lookup

**Verify**:
1. Check response → tariff_cache_strategy field
2. Check component enrichment → data_source field
3. Expected: `data_source: 'ai_cached_24hr'` or `'ai_24hr'` (NOT 'database')

**Test Result**: ________
**Actual tariff_cache_strategy**: ________
**Actual data_source**: ________

**This reveals**: Missing destination_country = expensive AI tariff lookups (vs free Mexico database)

---

## TEST SUITE 2: FULL WORKFLOW (UI + API Alignment)

### Test 2.1: Complete USA Exporter Workflow ✅

**Objective**: Test with ALL fields UI requires + verify API uses them correctly

**Step 1: Company Information** (via UI)
- Company Name: "Test USA Exporter Inc"
- Business Type: **Exporter**
- Certifier Type: **EXPORTER** ← UI requires, API ignores until PDF
- Industry Sector: **Automotive**
- Company Address: "123 Main St, Toronto, ON M1M 1M1"
- Company Country: **Canada**
- Destination Country: **USA** ← CRITICAL for tariff routing
- Contact Person: "John Smith"
- Contact Phone: "+1-416-555-1234"
- Contact Email: "john@example.com"
- Annual Trade Volume: **$1M - $5M**

**Expected**:
- All fields saved to localStorage
- ` trade_flow_type` auto-calculated: "CA→US"
- `tariff_cache_strategy` auto-calculated: "ai_24hr" (USA = volatile)

**Step 2: Component Origins** (via UI)
Add Component #1:
- Description: "Cold-rolled steel automotive housing for engine mounts"
- Origin Country: **China**
- Value Percentage: **40**
- Click "🤖 Get AI HS Code Suggestion"

**Expected API Call**:
```javascript
POST /api/ai-classification
{
  "description": "Cold-rolled steel automotive housing for engine mounts",
  "productContext": "Test USA Exporter Inc automotive parts",
  "additionalContext": {
    "businessType": "Exporter",
    "industryContext": "Automotive"
  }
}
```

**Verify**:
1. ✅ API returns HS code (e.g., "7326.90.85")
2. ✅ AI confidence >80%
3. ✅ Component table shows enrichment: HS code, MFN rate, USMCA rate, savings

Add Component #2:
- Description: "Extruded aluminum mounting bracket"
- Origin Country: **Mexico**
- Value Percentage: **35**
- Click "🤖 Get AI HS Code Suggestion"

Add Component #3:
- Description: "Synthetic rubber gasket seal"
- Origin Country: **USA**
- Value Percentage: **25**
- Click "🤖 Get AI HS Code Suggestion"

**Click "Analyze USMCA Qualification"**

**Expected API Call**:
```javascript
POST /api/ai-usmca-complete-analysis
{
  "company_name": "Test USA Exporter Inc",
  "business_type": "Exporter",
  "certifier_type": "EXPORTER",
  "industry_sector": "Automotive",
  "company_address": "123 Main St, Toronto, ON M1M 1M1",
  "company_country": "Canada",
  "destination_country": "USA",          // ← CRITICAL
  "contact_person": "John Smith",
  "contact_phone": "+1-416-555-1234",
  "contact_email": "john@example.com",
  "trade_volume": "$1M - $5M",
  "trade_flow_type": "CA→US",
  "tariff_cache_strategy": "ai_24hr",
  "component_origins": [
    {
      "country": "China",
      "percentage": 40,
      "component_type": "Steel housing",
      "description": "Cold-rolled steel automotive housing for engine mounts",
      "hs_code": "7326.90.85"
    },
    {
      "country": "Mexico",
      "percentage": 35,
      "component_type": "Aluminum bracket",
      "description": "Extruded aluminum mounting bracket",
      "hs_code": "7616.99.50"
    },
    {
      "country": "USA",
      "percentage": 25,
      "component_type": "Rubber gasket",
      "description": "Synthetic rubber gasket seal",
      "hs_code": "4016.93.10"
    }
  ]
}
```

**Step 3: Verify Results**

**Check Dev Issues Dashboard** (`/admin/dev-issues`):
- ✅ NO missing_data warnings (all optional fields provided)
- ✅ NO validation_error entries

**Check Component Enrichment**:
1. Open browser DevTools → Network tab
2. Find POST `/api/ai-usmca-complete-analysis` response
3. Verify each component has:
   ```javascript
   {
     "hs_code": "string",
     "mfn_rate": number,         // Should show Section 301 for China
     "usmca_rate": number,
     "section_301": number,      // ← USA specific (China component)
     "port_fees": number,        // ← USA specific
     "total_rate": number,       // MFN + Section 301 + port fees
     "savings_percentage": number,
     "data_source": "ai_cached_24hr",  // ← Confirms USA routing
     "tariff_policy": "string"
   }
   ```

**Verify Section 301 Tariffs** (USA destination only):
- China component should show: `section_301: 25` (or higher)
- Mexico/USA components should show: `section_301: 0` or `null`

**Test Result**: ________ (PASS/FAIL)
**Section 301 shown for China?**: ________ (YES/NO)
**Data source**: ________ (ai_cached_24hr expected)

---

### Test 2.2: Canada Destination (Different Tariff Routing) ✅

**Objective**: Verify destination_country changes tariff routing strategy

**Modify Step 1**:
- Destination Country: **Canada** (change from USA)

**Expected Changes**:
- `trade_flow_type`: "US→CA" (if company_country=USA)
- `tariff_cache_strategy`: "ai_90day" (Canada = stable, 90-day cache)

**Expected Component Enrichment**:
```javascript
{
  "data_source": "ai_cached_90day",   // ← Confirms Canada routing
  "tariff_policy": "Canadian CBSA rates",
  "mfn_rate": number,                 // CBSA MFN duty
  "cusma_rate": number,               // Canada calls USMCA "CUSMA"
  "section_301": null                 // ← NO US tariffs for Canada
}
```

**Verify**:
1. ✅ NO Section 301 tariffs shown (Canada doesn't use US policy)
2. ✅ Data source = "ai_cached_90day" (90-day cache)
3. ✅ Rates labeled as CBSA/CUSMA (not MFN/USMCA)

**Test Result**: ________ (PASS/FAIL)

---

### Test 2.3: Mexico Destination (Database Lookup) ✅

**Objective**: Verify Mexico routing uses FREE database lookups

**Modify Step 1**:
- Destination Country: **Mexico**

**Expected Changes**:
- `tariff_cache_strategy`: "database" (Mexico = stable, database only)

**Expected Component Enrichment**:
```javascript
{
  "data_source": "database",          // ← FREE lookup (no AI cost)
  "tariff_policy": "Mexican T-MEC rates (stable)",
  "mfn_rate": number,                 // Mexican IGI duty
  "usmca_rate": number,               // Mexican T-MEC rate
  "cache_age_days": number,           // Shows data freshness
  "staleness_warning": "string"       // ← NEW: Warns if >90 days old
}
```

**Verify Staleness Warnings** (NEW feature):
1. Check if `cache_age_days` > 90
2. If yes, verify `staleness_warning` appears:
   ```
   "⚠️ WARNING: Tariff data is 120 days old (last updated: 2025-01-15). Consider AI verification for current rates."
   ```
3. If `cache_age_days` > 180, should show:
   ```
   "⚠️ CRITICAL: Tariff data is 200 days old..."
   ```

**Verify NO AI Costs**:
- Check Vercel logs or OpenRouter dashboard
- Confirm NO API calls made during Mexico enrichment
- **Expected**: $0.00 cost (100% database lookups)

**Test Result**: ________ (PASS/FAIL)
**Staleness warnings shown?**: ________ (YES/NO if applicable)
**AI API calls made?**: ________ (Should be NO)

---

## TEST SUITE 3: CERTIFICATE GENERATION

### Test 3.1: Certificate Type Mapping ✅

**Objective**: Verify business_type → certifier_type → PDF template mapping

**Mapping Table** (from `config/business-types.js`):
| business_type | certifier_type | PDF Template |
|--------------|----------------|--------------|
| Manufacturer | PRODUCER | Most detailed |
| Producer | PRODUCER | Most detailed |
| Exporter | EXPORTER | Medium |
| Importer | IMPORTER | Simplest |
| Distributor | EXPORTER | Medium |
| Retailer | IMPORTER | Simplest |

**Test Data**:
1. business_type = "Manufacturer" → certifier_type = "PRODUCER"
2. business_type = "Exporter" → certifier_type = "EXPORTER"
3. business_type = "Importer" → certifier_type = "IMPORTER"

**Verification**:
1. Complete workflow with business_type = "Manufacturer"
2. Generate certificate
3. Open PDF → Check header: "USMCA Certificate of Origin - PRODUCER"
4. Verify PRODUCER-specific fields visible:
   - Manufacturing facility details
   - Production process description
   - Quality certifications

**Repeat for EXPORTER and IMPORTER**

**Test Result**: ________ (PASS/FAIL)

---

## TEST SUITE 4: SERVICE PURCHASE FLOW

### Test 4.1: Subscriber Discount Calculation ✅

**Objective**: Verify `/api/stripe/create-service-checkout` applies correct discount

**API Discount Logic** (from `pages/api/stripe/create-service-checkout.js`):
```javascript
const TIER_DISCOUNTS = {
  'Starter': 0,          // No discount
  'Professional': 0.15,  // 15% off
  'Premium': 0.25        // 25% off
};

const NO_DISCOUNT_SERVICES = ['trade-health-check', 'crisis-navigator'];
```

**Test Cases**:

**Case 1: Professional Tier + USMCA Advantage ($175 base)**
```javascript
// Expected calculation:
basePrice = 17500 cents
discount = 0.15
servicePrice = Math.round(17500 * (1 - 0.15)) = 14875 cents = $148.75 → $149
```

**Case 2: Premium Tier + Supply Chain Optimization ($275 base)**
```javascript
basePrice = 27500 cents
discount = 0.25
servicePrice = Math.round(27500 * (1 - 0.25)) = 20625 cents = $206.25 → $206
```

**Case 3: Premium Tier + Trade Health Check ($99 base - NO DISCOUNT)**
```javascript
basePrice = 9900 cents
// Service in NO_DISCOUNT_SERVICES array
discount = 0  // Ignored even for Premium
servicePrice = 9900 cents = $99.00
```

**Verification Steps**:
1. Set test user tier in Supabase:
   ```sql
   UPDATE user_profiles SET subscription_tier = 'Professional'
   WHERE user_id = '<test-user-id>';
   ```
2. Navigate to `/services`
3. Click "Purchase Service" on USMCA Advantage Sprint
4. **Verify Stripe checkout shows**: $149 (NOT $175)

**Test Result**: ________ (PASS/FAIL)
**Actual price shown**: $________

---

## TEST SUITE 5: WEBHOOK IDEMPOTENCY

### Test 5.1: Duplicate Event Prevention ✅

**Objective**: Verify `webhook_events` table prevents duplicate processing

**Setup**:
1. Complete a service purchase (triggers `checkout.session.completed` event)
2. Copy Stripe event ID from webhook logs
3. Use Stripe CLI to resend same event:
   ```bash
   stripe events resend evt_1234567890abcdef
   ```

**Expected Behavior**:
1. First event:
   - Inserts into `webhook_events` table
   - Updates `service_requests` status → 'pending_fulfillment'
   - Returns: `{ "received": true }`

2. Duplicate event:
   - Checks `webhook_events` table → finds existing event_id
   - Skips processing
   - Returns:
   ```json
   {
     "received": true,
     "message": "Event already processed (idempotent)",
     "event_id": "evt_1234567890abcdef",
     "processed_at": "2025-10-19T12:00:00Z"
   }
   ```

**Verification**:
1. Check `service_requests` table:
   ```sql
   SELECT COUNT(*) FROM service_requests WHERE stripe_session_id = 'cs_test_...';
   ```
   **Expected**: 1 row (no duplicates)

2. Check `webhook_events` table:
   ```sql
   SELECT COUNT(*) FROM webhook_events WHERE event_id = 'evt_...';
   ```
   **Expected**: 1 row (event recorded once)

**Test Result**: ________ (PASS/FAIL)

---

## TEST SUITE 6: EMAIL QUEUE & RETRY

### Test 6.1: Email Queue Processing ✅

**Objective**: Verify cron job processes queued emails

**Setup**:
1. Temporarily break Resend API (invalid key in `.env`)
2. Trigger email notification (create crisis alert)
3. Email should queue (not sent immediately)

**Verification**:
```sql
-- Check email queue
SELECT id, email_type, status, retry_count, created_at
FROM email_queue
WHERE recipient_email = '<test-email>'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**:
- status = 'pending' (not sent yet)
- retry_count = 0

**Restore Resend API key, wait 5 minutes (cron interval)**

**After Cron Run**:
```sql
-- Check email status
SELECT status, sent_at, resend_message_id
FROM email_queue
WHERE id = '<queue-id>';
```

**Expected**:
- status = 'sent'
- sent_at = timestamp
- resend_message_id = Resend message ID

**Test Result**: ________ (PASS/FAIL)

---

## FINAL VALIDATION CHECKLIST

### API Requirements Met
- [ ] All REQUIRED fields validated correctly
- [ ] Optional fields logged as warnings (not errors)
- [ ] destination_country affects tariff routing strategy
- [ ] Component enrichment uses correct data source (database/AI)

### UI/API Alignment
- [ ] UI blocks when API-required fields missing
- [ ] UI allows submission with all required fields
- [ ] Extra UI fields (certifier_type, contact) preserved for later use

### Tariff Intelligence
- [ ] USA → ai_24hr cache + Section 301 tariffs
- [ ] Canada → ai_90day cache + CBSA/CUSMA terminology
- [ ] Mexico → database lookup + staleness warnings

### Payment & Webhooks
- [ ] Subscriber discounts calculated correctly
- [ ] NO_DISCOUNT_SERVICES excluded from discounts
- [ ] Webhook idempotency prevents duplicate charges

### Monitoring & Recovery
- [ ] `/api/health` returns correct status
- [ ] Email queue processes with retry logic
- [ ] Dev issues dashboard logs missing optional fields

---

**Testing Completed By**: __________
**Date**: __________
**Overall Status**: ☐ READY FOR PRODUCTION  ☐ ISSUES FOUND

**Critical Issues** (must fix before launch):
________________________________________

**Non-Critical Issues** (can fix post-launch):
________________________________________
