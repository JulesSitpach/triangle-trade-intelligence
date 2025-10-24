# Triangle Intelligence Platform - Workflow Audit Context (CURRENT)

## MISSION: Make 4-Step User Workflow 100% Bulletproof

### CRITICAL SUCCESS PATH (Cannot Break)
```
Step 1: Company Information → Data saved to DB (CompanyInformationStep.js)
Step 2: Components → Each component captured with all fields (ComponentOriginsStepEnhanced.js)
Step 3: USMCA Analysis → AI qualification + tariff calculation (ai-usmca-complete-analysis.js)
Step 4: Certificate Download → PDF in user's hands (AuthorizationStep.js + generate-usmca-certificate-report.js)
Step 5: Ongoing Alerts → Real-time tariff policy updates (email-crisis-check.js + consolidate-alerts.js)
```

**The Complete Value Loop:**
- Immediate: Get USMCA certificate (proof for customs)
- Ongoing: Get tariff alerts when policies change affecting your products
- Strategic: Route products through Mexico to save money year-over-year

## PLATFORM ARCHITECTURE

**Tech Stack:**
- Frontend: Next.js 14 with custom CSS
- Database: Supabase PostgreSQL
- AI: OpenRouter API (Tier 1) + Anthropic Direct (Tier 2) fallback
- Payments: Stripe with webhooks
- File Generation: PDF certificates via nodemailer

**Subscription Tiers (ACTUAL):**
- Starter ($199): 50 analyses/month
- Professional ($499): Unlimited analyses
- Enterprise: Custom

## ACTUAL WORKFLOW FILE STRUCTURE

### Frontend Components (User Journey)
```
1. CompanyInformationStep.js
   - Captures: company_name, company_country, company_address, tax_id
   - Captures: business_type, industry_sector, contact_person, contact_phone, contact_email
   - Captures: supplier_country, destination_country, trade_volume, manufacturing_location
   - Stores: formData in React state → passed to next step

2. ComponentOriginsStepEnhanced.js
   - Captures: Component array with description, origin_country, percentage, hs_code
   - AI Classification: Calls ai-usmca-complete-analysis.js to classify each component
   - Validation: Percentages should total to 100%
   - Stores: components array in formData

3. WorkflowResults.js
   - Displays: USMCA qualification status, regional content %, tariff rates
   - Shows: Component breakdown with HS codes and tariffs
   - Shows: Annual savings calculation
   - Input: Data from ai-usmca-complete-analysis.js response

4. AuthorizationStep.js
   - Captures: certifier_type, signatory_name, signatory_title, signatory_email, signatory_phone
   - Action: Calls generate-usmca-certificate-report.js to create PDF
   - Output: PDF download to user

5. Trade Risk Dashboard (trade-risk-alternatives.js)
   - Displays: User's "at-risk" products matching new tariff policies
   - Shows: Impact assessment ($X savings/cost per product)
   - Action: User can view real-time alerts about policy changes
   - Input: Product data from completed workflows + alert matching
```

### Backend APIs (Actual)
```
POST /api/ai-usmca-complete-analysis
- Input: formData with company, components, destination
- Process:
  1. AI classifies components (HS codes)
  2. AI analyzes USMCA qualification
  3. Tariff enrichment via enrichment-router.js
  4. Returns: qualification_status, regional_content, tariff_savings, components enriched
- Output: Complete USMCA analysis result
- Stores: workflow_sessions table via workflow-session.js POST

POST /api/workflow-session (or GET)
- Saves/retrieves in-progress workflow data
- Fields: company_name, trade_volume, hs_code, component_origins, destination_country, etc.
- Stores to: workflow_sessions table in Supabase

POST /api/generate-usmca-certificate-report
- Input: serviceRequestId, stage1Data, workflow_data
- Process:
  1. AI generates professional report text
  2. Formats HTML email template
  3. Sends PDF email via nodemailer
- Output: PDF report sent to user
- Stores to: service_requests table completion_data

GET /api/certificates
- Retrieves certificate data for user

ONGOING ALERTS SYSTEM:
POST /api/cron/email-crisis-check (Vercel Cron - every 4 hours)
- Trigger: RSS polling for tariff policy announcements
- Input: User's products from completed workflows
- Process:
  1. Fetch RSS feeds (USTR, Commerce Dept, trade news)
  2. Parse for tariff changes (Section 301, 232, MFN updates)
  3. Match against user's HS codes
  4. AI analyzes impact for each user's products
  5. Send personalized email alerts via Resend
- Output: Email alerts sent to users about affecting policies

POST /api/consolidate-alerts
- Input: Raw tariff policy alerts + user's component data
- Process:
  1. Group related alerts by country/HS code
  2. AI generates consolidated analysis (broker tone)
  3. Calculate financial impact per component
  4. Rank by urgency (URGENT/HIGH/MEDIUM/LOW)
- Output: Consolidated alert summary for user dashboard

GET /pages/trade-risk-alternatives.js
- Display: User's at-risk products (matching new tariffs)
- Show: Impact calculations and mitigation strategies
- Input: Alerts from consolidate-alerts.js + workflow data
```

## WORKFLOW DATA CONTRACT

### Step 1: Company Information (Required Fields)
```javascript
{
  company_name: string (required),
  company_country: string (required),
  company_address: string (required),
  tax_id: string (optional),
  business_type: string (required),
  industry_sector: string (required),
  contact_person: string (required),
  contact_phone: string (required),
  contact_email: string (required),
  supplier_country: string (required),
  destination_country: string (required) // MUST be US, CA, or MX
  trade_volume: number (required),
  manufacturing_location: string (required),
  substantial_transformation: boolean (optional)
}
```

**Database Table:** `user_profiles` + `workflow_sessions`
**Storage Method:** React state → SessionStorage → workflow_sessions on API call
**Failure Points:**
- Required fields missing validation before Step 2
- trade_volume not parsed to number (was causing .replace() errors)
- Destination country must be validated as USMCA territory

### Step 2: Components (Required Fields)
```javascript
// For EACH component in the product
[
  {
    description: string (required),
    component_type: string (optional),
    origin_country: string (required),
    country: string (alias for origin_country),
    hs_code: string (required, AI-generated),
    percentage: number (required, must sum to 100),
    value_percentage: number (alias for percentage),
    supplier_info: object (optional)
  }
]
```

**Database Table:** Stored as component_origins array in `workflow_sessions.data` JSONB
**Critical Logic:**
- Total percentages should equal 100%
- Each component must have origin_country
- HS codes generated by AI classification
**Failure Points:**
- Components not linked to company/workflow
- HS code classification failures
- Percentage math incorrect
- Component data lost on Step 3 transition

### Step 3: USMCA Analysis (AI Processing)
```javascript
// AI must return structured data from ai-usmca-complete-analysis.js
{
  usmca: {
    qualified: boolean (required),
    north_american_content: number (required),
    threshold_applied: number (required),
    qualification_rule: string
  },
  product: {
    hs_code: string (required),
    description: string (required)
  },
  savings: {
    annual_savings: number (calculated),
    savings_percentage: number
  },
  components: [
    {
      // Enriched with tariff data
      hs_code: string,
      mfn_rate: number,
      usmca_rate: number,
      section_301: number,
      total_rate: number,
      // ... other fields
    }
  ],
  tariff_rates_cache: [
    // Populated from database lookup
  ]
}
```

**API Endpoint:** `POST /api/ai-usmca-complete-analysis`
**AI Service:** OpenRouter Claude (Tier 1) → Anthropic Direct (Tier 2 fallback)
**Critical Dependencies:**
- OpenRouter/Anthropic API availability
- Database tariff_rates_cache has current data
- enrichment-router.js correctly looks up rates
- parseTradeVolume() utility correctly parses trade_volume

**Failure Points:**
- AI timeout (>5s) without fallback
- Malformed AI response (not valid JSON)
- Tariff data missing/stale (cache expires by destination)
- Trade volume parsing fails (e.g., "5,500,000" with commas)
- Component data not properly enriched with tariffs

### Step 4: Certificate Download (PDF Generation)
```javascript
// PDF must contain all required fields
POST /api/generate-usmca-certificate-report
{
  serviceRequestId: string,
  stage1Data: object,
  stage2Data: object,
  stage3Data: object
}

Response:
{
  success: boolean,
  report_content: string (HTML/text),
  email_subject: string,
  source: string (openrouter_api|anthropic_api|database_cache)
}
```

**API Endpoint:** `/api/generate-usmca-certificate-report`
**File Storage:** Email sent via nodemailer, HTML template rendered
**Legal Requirements:** Must meet customs documentation standards

**Failure Points:**
- PDF generation library crashes
- Email service (nodemailer) unavailable
- Missing data in certificate (company_country required)
- AI service failure with no fallback
- File not accessible for download

### Step 5: Ongoing Tariff Alerts (Retention/Engagement)
```javascript
// Alert system must match user's products to policy changes
{
  alert_id: string (unique),
  user_id: string (required),
  triggered_by: string (policy announcement, e.g., "Section 301 Expansion"),
  affected_products: array (user's HS codes matching alert),
  financial_impact: {
    annual_cost_increase: number,
    affected_components: array,
    confidence: number (0.0-1.0)
  },
  alert_status: string (not_sent, sent, opened, ignored),
  sent_at: datetime,
  email_delivered: boolean,
  alert_channel: string (email|dashboard|both)
}
```

**APIs:**
- `/api/cron/email-crisis-check` - Vercel cron (every 4 hours)
- `/api/consolidate-alerts` - Group alerts
- `/pages/trade-risk-alternatives.js` - Display dashboard

**Critical Dependencies:**
- User's products saved from workflow (HS codes)
- RSS feeds accessible and parsed correctly
- AI can match tariff changes to user's components
- Email delivery (Resend) working
- Alert matching logic accurate (don't send false positives)

**Failure Points:**
- No products from user workflow → no alerts to send
- RSS feeds down/unavailable
- AI matching fails (alerts don't match user's products)
- Email service failure (Resend outage)
- Alert sent for wrong product (wrong HS code match)
- User marked as unsubscribed accidentally
- Duplicate alerts sent (alert system race condition)

## AUDIT PRIORITIES (In Order)

### 1. Data Persistence Between Steps
**Check:** Can user navigate Step 1 → Step 2 → Step 3 without data loss?
**Files to audit:**
- CompanyInformationStep.js (saves to formData)
- ComponentOriginsStepEnhanced.js (reads from formData, adds components)
- workflow-session.js (persists to DB)
- How is formData passed between components?

### 2. Component Data Validation & Enrichment
**Check:** Do components get properly classified and enriched?
**Files to audit:**
- ComponentOriginsStepEnhanced.js (component capture)
- ai-usmca-complete-analysis.js (HS code classification)
- enrichment-router.js (tariff lookup)
- Does each component get ALL required fields?

### 3. Trade Volume Parsing (KNOWN ISSUE)
**Check:** Is parseTradeVolume() utility used everywhere?
**Files to audit:**
- Form inputs (how is trade_volume captured as number vs string?)
- API endpoints (parseTradeVolume calls)
- Database storage (numeric column type)
- **Already fixed in:** consolidate-alerts.js, executive-trade-alert.js, etc.
- **Status:** All 8 API files updated to use parseTradeVolume() utility

### 4. AI Response Validation & Fallback
**Check:** Does AI integration handle failures gracefully?
**Files to audit:**
- ai-usmca-complete-analysis.js (response parsing)
- lib/agents/base-agent.js (fallback chain)
- enrichment-router.js (cache fallback)
- What happens if OpenRouter times out?

### 5. Certificate Generation & Download
**Check:** Can user always get a PDF they can download?
**Files to audit:**
- generate-usmca-certificate-report.js (PDF generation)
- AuthorizationStep.js (download UI)
- Certificates table schema
- Email delivery reliability (nodemailer)

### 6. Alerts System End-to-End
**Check:** Do users get relevant tariff alerts about their products?
**Files to audit:**
- pages/api/cron/email-crisis-check.js (RSS polling + product matching)
- pages/api/consolidate-alerts.js (alert grouping + AI analysis)
- pages/trade-risk-alternatives.js (dashboard display)
- Do products from completed workflows link to alerts?
- Is alert matching accurate (no false positives)?
- Can emails be sent/received?
- Are duplicate alerts prevented?

## KNOWN ISSUES ALREADY FIXED

✅ **trade_volume parsing** - Standardized via parseTradeVolume() utility (Commit 46792ab)
- Was: 9 different custom parsing approaches
- Now: Single utility function handles all edge cases
- Status: All 8 API files updated

✅ **Component data loss** - Fixed via workflow_sessions persistence (Commit 7c0c762)
- Field extraction to dedicated columns
- Dashboard validator now passes

✅ **Type coercion errors** - Fixed by enforcing numeric types at form input (Commit cd2288e)
- trade_volume now captured as number
- API receives clean numeric value

✅ **Field name mismatches** - Documented in FIELD_ALIASES mapping
- form-data-schema.js tracks all variants
- normalizeFormData() resolves aliases

## REMAINING RISK AREAS

**High Priority (Blocking Issues):**
- [ ] Component data survival across page refresh (sessionStorage vs DB)
- [ ] USMCA qualification logic accuracy (affects legal compliance)
- [ ] Tariff cache freshness (Section 301 tariffs change frequently)
- [ ] HS code classification AI response parsing
- [ ] Alert matching logic: Do alerts correctly match user's products?
- [ ] Alert deduplication: Are duplicate alerts being sent?
- [ ] Product linking: Do completed workflows link to alert system?

**Medium Priority (Degradation):**
- [ ] PDF generation under high load (50+ users simultaneously)
- [ ] Email delivery fallback if nodemailer fails
- [ ] Email delivery fallback if Resend service fails (alerts)
- [ ] Large component lists (100+ components per product)
- [ ] RSS feed availability/parsing reliability
- [ ] Cron job timing consistency (every 4 hours)

**Low Priority (Polish):**
- [ ] Multi-language support for alerts
- [ ] Alert unsubscribe mechanism
- [ ] Alert preference settings

## VALIDATION TESTING CHECKLIST

### Happy Path (Must Work)
1. **Step 1:** Enter company info → data saved
2. **Step 2:** Add 3 components → each gets HS code from AI
3. **Step 3:** See USMCA analysis → qualification status shows
4. **Step 4:** Download certificate → PDF in browser
5. **Step 5:** New tariff policy announced → user gets relevant alert → opens email and sees personalized impact

### Edge Cases
- Min values: trade_volume=$1, 1 component with 100%
- Max values: trade_volume=$100,000,000, 50 components
- Special characters: Company name with "&", "$", non-ASCII
- Percentages: 33.33%, 33.33%, 33.34% (totals 100%)

### Error Scenarios
- API timeout during Step 3 analysis
- AI returns malformed JSON
- User refreshes page during Step 2
- Destination country = UK (should fail, not USMCA)
- RSS feed unavailable → alerts don't send
- User's products don't match any alerts (should not send false alerts)
- Email service down → alert not delivered
- Duplicate alerts triggered by race condition

### Data Integrity
- trade_volume with commas "5,500,000" parses to 5500000
- Components array maintains order
- Company data doesn't corrupt between steps
- Database saves match what user entered

## SUCCESS CRITERIA

**Zero Tolerance (Workflow Blocking):**
- ❌ User loses entered data (components disappear)
- ❌ Certificate contains wrong company name
- ❌ USMCA qualification is inverted (qualified shown as not)
- ❌ Tariff rates missing from PDF
- ❌ Type errors (e.g., trade_volume.replace() crash)
- ❌ False positive alerts sent (user's product doesn't match alert policy)
- ❌ Duplicate alerts sent to same user
- ❌ User's completed workflow doesn't link to alert system

**Acceptable Degradation (Temporary):**
- ✅ Slower AI response (>5s) but with loading indicator + fallback to cached rates
- ✅ Email delivery fails but can retry
- ✅ RSS feed unavailable → cron job waits for next cycle
- ✅ Optional fields missing (supplier_info, tax_id)
- ✅ Alert matching is conservative (misses some matches is better than false positives)

## DEBUGGING TOOLS

1. **workflow_sessions table:** Check `data` JSONB for complete workflow state
2. **Browser DevTools:** FormData in React state vs localStorage
3. **API logs:** OpenRouter response structure
4. **Database:** tariff_rates_cache for cache freshness
5. **Error logging:** dev_issues table for unexpected failures

---

**AGENT INSTRUCTIONS:**
Focus ONLY on the 4-step user workflow. Ignore admin dashboards, marketing pages, alerts system.
Every finding must relate to: Can user complete the workflow and get their certificate?
Prioritize: Data loss > Qualification error > Performance > UI polish

Last Updated: October 24, 2025 - Based on actual codebase structure
