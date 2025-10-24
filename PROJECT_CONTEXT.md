# Triangle Intelligence Platform - Project Context

**Last Updated**: October 24, 2025
**Status**: Production (Phase 1 deployed)
**What This Is**: Quick reference for understanding and working on the USMCA certificate workflow

---

## The Business (What We're Building)

**TurboTax for USMCA Compliance** - Users generate their own USMCA origin certificates instead of hiring expensive brokers.

**Money Path**:
- Users pay $99-$599/month for subscription (Starter/Professional/Premium)
- They get: certificate generation + tariff alerts + support
- We get: 80%+ margins (pure SaaS, no services)
- User owns responsibility for data accuracy

**Tier Details**:
- Starter ($99): 10 analyses/month, basic alerts
- Professional ($299): 100 analyses/month, real-time crisis alerts, priority support
- Premium ($599): Unlimited analyses, premium alerts, strategy calls, custom reports

**User Success Looks Like**:
1. Upload company info + product components
2. AI calculates USMCA qualification + tariff savings
3. Download PDF certificate (proof for customs)
4. Get alerts when tariff policies change
5. Keep paying us for alerts (retention hook)

---

## What Actually Works (No Guessing)

### The 5-Step Workflow
```
Step 1: CompanyInformationStep.js
  → Captures: company name, country, contact, trade volume, destination
  → Saves: formData in React state
  → DB: workflow_sessions table
  ✅ WORKING

Step 2: ComponentOriginsStepEnhanced.js
  → Captures: Product components with HS codes, origins, percentages
  → AI Classification: Calls /api/agents/classification for each component
  → Validation: Percentages must total exactly 100%
  → DB: workflow_sessions.component_origins (JSONB array)
  ✅ WORKING (fixed infinite useEffect loop in commit 523405c)

Step 3: USMCAWorkflowOrchestrator → WorkflowResults.js
  → Calls: /api/ai-usmca-complete-analysis
  → AI Analysis: Qualification status, regional content %, tariff rates
  → Enrichment: All components get mfn_rate, usmca_rate, section_301, savings %
  → DB: workflow_completions table + workflow_sessions.data
  ✅ WORKING (trade_volume parsing fixed in commit 46792ab)

Step 4: CertificateSection.js
  → Calls: /api/generate-usmca-certificate-report
  → Output: PDF download via nodemailer
  → Validation: Requires company_country (was missing, fixed in commit 26df49a)
  ✅ WORKING

Step 5: Trade Risk Alerts
  → Cron: /api/cron/rss-polling.js (RSS polling)
  → Queue: /api/cron/process-email-queue.js (Email delivery)
  → Matching: User's HS codes vs new tariff policies (RSS feeds)
  → Delivery: /api/consolidate-alerts → email via Resend
  ⚠️ ASSUMED WORKING (last verified Oct 22)
```

---

## Critical Files You'll Touch

### Pages (User-Facing)
```
pages/usmca-workflow.js
  - Entry point for workflow
  - Wraps USMCAWorkflowOrchestrator
  - Auth check: redirects to login if not authenticated

pages/trade-risk-alternatives.js
  - Shows user's "at-risk" products matching new tariffs
  - Crisis detection dashboard
```

### Components (React)
```
components/workflow/USMCAWorkflowOrchestrator.js (800 lines)
  - Main orchestration component
  - Manages: currentStep, formData, results, navigation
  - Key functions: nextStep(), previousStep(), goToStep()
  - Calls: useWorkflowState hook for all state management

components/workflow/CompanyInformationStep.js
  - Step 1 form
  - Auto-calculates: cache_strategy (MX vs US/CA), trade_flow_type
  - Captures: trade_volume as NUMBER (not string with commas)

components/workflow/ComponentOriginsStepEnhanced.js (967 lines)
  - Step 2 form
  - CRITICAL: Restores components from formData on navigation (line 45)
  - Normalizes all component fields (line 28-41)
  - Validates percentages sum to 100% (line 419)
  - Calls: /api/agents/classification for HS codes

components/workflow/results/
  ├─ WorkflowResults.js - Results display
  ├─ CertificateSection.js - Download button (qualified only)
  ├─ USMCAQualification.js - Status display
  └─ TariffComparison.js - MFN vs USMCA rates
```

### APIs (Backend)
```
pages/api/ai-usmca-complete-analysis.js (762 lines)
  - Main analysis API
  - Input: formData with company + components
  - Processing:
    1. AI classifies each component (HS codes)
    2. Batch tariff lookup via enrichment-router.js
    3. USMCA qualification calculation
    4. Returns: complete analysis with all fields
  - Fallback: OpenRouter → Anthropic Direct → Database cache
  - CRITICAL: Uses parseTradeVolume() (lib/utils/parseTradeVolume.js)

pages/api/generate-usmca-certificate-report.js
  - Generates PDF via AI
  - Input: serviceRequestId, company_country required
  - Output: PDF sent via nodemailer

pages/api/agents/classification.js
  - HS code classification for individual components
  - Input: productDescription, businessContext, componentOrigins
  - Uses: ClassificationAgent (lib/agents/classification-agent.js)

pages/api/workflow-session.js
  - Save/retrieve in-progress workflows
  - Field extraction to dedicated columns (commit 7c0c762)
  - Stores: trade_volume, hs_code, component_origins, etc.

pages/api/cron/rss-polling.js
  - Runs via Vercel cron
  - Polls RSS feeds for tariff policy changes
  - Matches against user's products
  - Sends alerts via Resend

pages/api/cron/process-email-queue.js
  - Processes queued email notifications
  - Delivery via Resend service

pages/api/consolidate-alerts.js
  - Groups related alerts
  - AI generates consolidated analysis
  - Calculates financial impact per component
```

### Hooks (State Management)
```
hooks/useWorkflowState.js (659 lines) - THE CRITICAL HOOK
  - Manages: currentStep, formData, results, loading, errors
  - Persistence: localStorage (immediate) + database (backup)
  - Navigation: goToStep(), nextStep(), previousStep()
  - Saves: saveWorkflowToDatabase() on explicit "Next" click

  Key details:
  - Line 45: Component restoration from formData
  - Line 73-80: Sync check (prevents infinite loops via JSON.stringify)
  - Line 225: Auto-save formData to localStorage
  - Line 185-214: Database restore fallback on mount
```

### Libraries (Business Logic)
```
lib/agents/base-agent.js
  - 2-tier fallback: OpenRouter → Anthropic
  - Use this for any AI calls

lib/agents/classification-agent.js
  - HS code classification with detailed reasoning

lib/tariff/enrichment-router.js
  - Smart caching: MX=free DB, CA/US=OpenRouter with fallback
  - Batch enrichment (adds all tariff fields to components)
  - CRITICAL: Extracts all fields from API response (see commit f3aa520)

lib/utils/parseTradeVolume.js
  - Parse "5,500,000" → 5500000 (numeric)
  - Use everywhere trade_volume is converted
  - Prevents: trade_volume.replace() crashes

lib/schemas/form-data-schema.js
  - WORKFLOW_FORM_SCHEMA: all required fields
  - FIELD_ALIASES: maps alternate field names (trade_volume vs annual_trade_volume)
  - validateFormSchema(): checks required fields before API calls
  - normalizeFormData(): resolves aliases

lib/services/workflow-service.js
  - Validation logic
  - API calls to /api/ai-usmca-complete-analysis
  - Results processing
```

### Database (Supabase)
```
workflow_sessions (65 columns)
  - Stores in-progress workflows
  - JSONB data + extracted dedicated columns
  - Key columns: company_name, trade_volume, hs_code, component_origins, destination_country
  - Expires after configured time (24h default)
  - ✅ Field extraction implemented (commit 7c0c762)

workflow_completions (33 columns)
  - Completed workflows with financials
  - Stores: savings_amount, qualification_result, certification_confidence
  - Links to: user_profiles, certificates

workflow_step_data (8 columns)
  - Per-step data capture (optional tracking)
  - step_name, step_order, step_data (JSONB)

invoices (Stripe webhook table)
  - Created Oct 22, 2025
  - Stores: stripe_invoice_id, user_id, amount, status, paid_at
  - RLS: Users see only their invoices
```

---

## What Can Break (Watch These)

### 🔴 CRITICAL - Will Break Certificate Generation
- [ ] `company_country` missing from API response (was broken, commit 26df49a fixed it)
- [ ] Components not enriched with tariff data (was broken, commit f3aa520 fixed it)
- [ ] Certificate PDF generation fails silently (no error logging)
- [ ] USMCA qualification inverted (qualified shown as not qualified)

### 🟡 HIGH - Will Break Workflow Completion
- [ ] trade_volume as string with commas (fixed in commit 46792ab)
- [ ] Component data lost on navigation (fixed in commit 523405c - infinite loop)
- [ ] Percentages don't validate to 100% exactly
- [ ] HS codes missing on components before Step 3
- [ ] formData incomplete before API call

### 🟠 MEDIUM - Will Degrade Experience
- [ ] AI timeout (>5s) without fallback to Anthropic
- [ ] Tariff cache stale (Section 301 tariffs change daily for US)
- [ ] Email alerts not sent (Resend down or misconfigured)
- [ ] Duplicate alerts sent (race condition in cron job)
- [ ] Alert matching too strict (users get no alerts for matching products)

### 🟢 LOW - Polish Issues
- [ ] Slow page loads (cache optimization)
- [ ] Confusing error messages (UX)
- [ ] Form validation messaging unclear
- [ ] Mobile layout broken

---

## How to Work on This

### When Adding a Feature
1. **Where does data go?**
   - React state (useWorkflowState) → localStorage → database?
   - Or is it transient (just for UI)?

2. **Does it affect certificate?**
   - If yes: add to form-data-schema.js WORKFLOW_FORM_SCHEMA
   - If yes: add to validation before API call

3. **Does it need AI?**
   - Use BaseAgent for automatic 2-tier fallback
   - Never hardcode data (no mock tariff rates, no fake HS codes)

4. **Does it query database?**
   - Use Supabase MCP tool (verify actual data exists)
   - Don't assume fields exist (fail loudly, no `|| 'Unknown'`)

### When Fixing a Bug
1. **Can I reproduce it?** Start dev server: `npm run dev:3001`
2. **Where's the data?** Check useWorkflowState → localStorage → database
3. **Is it a type error?** Check parseTradeVolume() usage
4. **Is it data loss?** Check useEffect dependencies in ComponentOriginsStepEnhanced
5. **Is it silent failure?** Check error logging in dev_issues table

### Commits to Reference
```
46792ab - trade_volume parsing standardized
7c0c762 - component data field extraction
cd2288e - trade_volume parsed as number at form input
26df49a - company_country added to API response
900a133 - certificate country validation
f3aa520 - tariff field extraction from AI response
523405c - infinite useEffect loop fixed
88cf66d - React duplicate key errors fixed
```

---

## Environment Variables (Must Exist)

```
OPENROUTER_API_KEY=sk-or-v1-...        # Primary AI
ANTHROPIC_API_KEY=sk-ant-...           # Backup AI
NEXT_PUBLIC_SUPABASE_URL=https://...   # Database
SUPABASE_SERVICE_ROLE_KEY=eyJh...      # DB admin
JWT_SECRET=your-secret-here            # Session signing
STRIPE_SECRET_KEY=sk_test_...          # Payments
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook validation
RESEND_API_KEY=re_...                  # Email service
CRON_SECRET=your-cron-secret           # Vercel cron auth
```

---

## Testing the Workflow (Manual)

**Happy Path** (5 minutes):
```
1. Login to http://localhost:3001
2. Click "Start USMCA Analysis"
3. Step 1: Enter company info (any country, any business type)
4. Step 2: Add 3 components totaling 100%
   - Get AI suggestions for HS codes
   - Enter percentages: 50%, 30%, 20%
5. Step 3: See USMCA qualification result
6. Step 4: Download certificate (if qualified)
7. Check: Did PDF contain company name and country? ✅
```

**Navigation Test** (3 minutes):
```
1. Step 2: Add 3 components
2. Click "← Previous" to Step 1
3. Check: Company data still there? ✅
4. Click "Continue to Step 2"
5. Check: All 3 components still there? ✅
6. Edit one component description
7. Click "Continue to USMCA Analysis"
8. Check: Does edited description show in results? ✅
```

**Edge Case** (2 minutes):
```
1. Step 2: Add 3 components with percentages 33.33%, 33.33%, 33.34%
2. Check: Does "Continue" button work? ✅
3. Refresh page F5
4. Check: All components restored? ✅
5. Edit percentages to 33%, 33%, 33% (total 99%)
6. Check: Does "Continue" button disable? ✅
```

---

## Success Criteria (What "Done" Looks Like)

User can complete full workflow:
- [ ] Step 1: Enter company info without errors
- [ ] Step 2: Add components, get HS codes from AI
- [ ] Step 3: See USMCA analysis (qualified or not)
- [ ] Step 4: Download PDF certificate
- [ ] Navigation: Go back/forth without losing data
- [ ] Alerts: Get email about tariff policy changes

No blocking errors:
- [ ] No "undefined is not a function" crashes
- [ ] No infinite loops or page hangs
- [ ] No data loss on refresh or navigation
- [ ] No false USMCA qualification results
- [ ] Certificate PDF contains all required fields

---

## Quick Answers to Common Questions

**Q: Why does trade_volume need special parsing?**
A: Users might enter "5,500,000" with commas, but database column is NUMERIC. parseTradeVolume() strips commas before saving.

**Q: Why do components need to total exactly 100%?**
A: USMCA rules require accounting for the entire product value. Percentages not totaling 100% = incomplete analysis = wrong tariff calculation.

**Q: What if AI is slow (>5s)?**
A: BaseAgent falls back to Anthropic automatically. If both fail, uses database cache (marked with warning).

**Q: Why does component_origins go in both React state AND database?**
A: React state for immediate UI updates. Database for persistence across refreshes and audit trail.

**Q: Can users edit data after certificate download?**
A: Not without starting a new analysis. Certificate is based on specific data at specific time.

---

## One Command to Remember

```bash
npm run dev:3001
```

Starts development server on port 3001 (required for all testing).

---

---

## My Working Notes (For Debugging & Investigation)

### 🚨 RULE #1: Use Supabase MCP Tool - NEVER ASSUME DATABASE STATE

Every time you need to check:
- Is data in workflow_sessions?
- Are components enriched with tariff fields?
- Is tariff cache populated?
- What's the latest workflow?
- Are invoices being saved?

**USE THE TOOL. Don't guess.**

```
mcp__supabase__execute_sql(
  project_id: "mrwitpgbcaxgnirqtavt",
  query: "SELECT ... FROM ..."
)
```

Copy a query from the "Database Debugging Queries" section below and run it. Get real data, not assumptions.

---

### How to Check Data Flow (Step by Step)

**Scenario: User says components disappeared on navigation**

1. Check React state:
   - Open ComponentOriginsStepEnhanced.js line 43-56
   - Verify: `if (formData.component_origins && formData.component_origins.length > 0)`
   - If formData has components, they WILL restore

2. Check localStorage:
   - Browser DevTools → Application → Local Storage
   - Look for: `triangleUserData` (formData JSON)
   - Look for: `workflow_current_step` (current step number)
   - Presence = data survived page refresh

3. Check database:
   ```sql
   SELECT id, company_name, component_origins, created_at
   FROM workflow_sessions
   ORDER BY created_at DESC LIMIT 1;
   ```
   - If component_origins JSONB has data = database saved it

4. Check useEffect sync:
   - useWorkflowState.js line 73-80
   - This prevents infinite loops by checking: `JSON.stringify(formData.component_origins) !== JSON.stringify(components)`
   - If sync not working = JSON.stringify comparison failing

### Common Issues I've Fixed Before

**Issue: "TypeError: formData.trade_volume.replace is not a function"**
- Location: ai-usmca-complete-analysis.js (old code)
- Fix: Always use parseTradeVolume() from lib/utils/parseTradeVolume.js
- Check: Is trade_volume a number? (it should be)
  ```javascript
  const parseTradeVolume = require('../lib/utils/parseTradeVolume.js');
  const numeric = parseTradeVolume(formData.trade_volume);
  // numeric is now safe to use
  ```

**Issue: Components not showing HS codes**
- Check: Did /api/agents/classification actually return hs_code?
- Location: ComponentOriginsStepEnhanced.js line 156-178
- Debug: Log result.data structure
- Fix: Ensure AI returned hsCode (not hs_code - case matters)

**Issue: Percentages validation not working**
- Location: ComponentOriginsStepEnhanced.js line 408-420
- Debug: Check getTotalPercentage() returns correct sum
- Check: Are all components have value_percentage as number?
- Fix: Parse as float: `parseFloat(c.value_percentage || 0)`

**Issue: Component data lost on back/forth navigation**
- Root cause: useEffect infinite loop (FIXED in commit 523405c)
- Check: Does ComponentOriginsStepEnhanced have the JSON.stringify check on line 76?
- If missing: Add it back

**Issue: Certificate PDF missing company_country**
- Location: generate-usmca-certificate-report.js
- Fix: Ensure useWorkflowState line 308 passes company_country
- Check: Is company_country present in formData?
- Debug: Log results before PDF generation

### Database Debugging Queries

**🔴 IMPORTANT: Use mcp__supabase__execute_sql tool for ALL database checks**
- Don't guess about data - query it
- Project ID: mrwitpgbcaxgnirqtavt
- Copy/paste any query below into the tool

**Check workflow state:**
```sql
SELECT
  id,
  user_id,
  company_name,
  trade_volume,
  component_origins,
  destination_country,
  created_at
FROM workflow_sessions
ORDER BY created_at DESC
LIMIT 3;
```

**Check completed workflows:**
```sql
SELECT
  id,
  company_name,
  hs_code,
  trade_volume,
  savings_amount,
  qualification_result,
  completed_at
FROM workflow_completions
ORDER BY completed_at DESC
LIMIT 5;
```

**Check component enrichment (do components have tariff fields?):**
```sql
SELECT
  id,
  component_origins
FROM workflow_sessions
WHERE component_origins IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;
```

**Check tariff cache (is it populated?):**
```sql
SELECT
  hs_code,
  destination_country,
  mfn_rate,
  usmca_rate,
  section_301,
  total_rate,
  expires_at,
  cache_source
FROM tariff_rates_cache
WHERE destination_country IN ('US', 'CA', 'MX')
ORDER BY created_at DESC
LIMIT 5;
```

**Check invoices (payment data):**
```sql
SELECT
  id,
  user_id,
  stripe_invoice_id,
  amount,
  status,
  paid_at
FROM invoices
ORDER BY created_at DESC
LIMIT 5;
```

**Check all tables exist:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### File Locations I Check First (By Problem Type)

**Problem: Data not saving**
→ Check: hooks/useWorkflowState.js line 577 (saveWorkflowToDatabase)
→ Check: pages/api/workflow-session.js (POST handler)
→ Check: Database workflow_sessions table exists

**Problem: AI not working**
→ Check: lib/agents/base-agent.js (fallback logic)
→ Check: OPENROUTER_API_KEY and ANTHROPIC_API_KEY in .env
→ Check: pages/api/ai-usmca-complete-analysis.js (API call)

**Problem: Component validation failing**
→ Check: ComponentOriginsStepEnhanced.js line 408-420 (isValid function)
→ Check: Form fields are normalized (line 28-41)
→ Check: Percentages are numbers, not strings

**Problem: Navigation broken**
→ Check: hooks/useWorkflowState.js (goToStep, nextStep, previousStep)
→ Check: USMCAWorkflowOrchestrator.js (how functions are called)
→ Check: localStorage has workflow_current_step

**Problem: Certificate not downloading**
→ Check: pages/api/generate-usmca-certificate-report.js
→ Check: Is company_country in results? (line 308 useWorkflowState)
→ Check: Is USMCA qualified? (CertificateSection.js only shows if qualified)

### Commands I Use Often

```bash
# Start dev server
npm run dev:3001

# Check recent commits
git log --oneline -20

# Find where trade_volume is used
grep -rn "trade_volume" pages/api/ components/ lib/ --include="*.js"

# Check for hardcoded values (BAD)
grep -rn "0.068\|6.8%\|hardcoded" pages/ components/ lib/ --include="*.js"

# Find all files that reference component enrichment
grep -rn "mfn_rate\|usmca_rate\|enrichment" pages/api/ lib/tariff/ --include="*.js"

# Count lines in key files
wc -l hooks/useWorkflowState.js components/workflow/ComponentOriginsStepEnhanced.js
```

### Data Flow Tracing (For Complex Issues)

**Trace complete workflow:**
```
User enters Step 1
  ↓ formData.company_name → updateFormData('company_name', value)
  ↓ useEffect line 225 → localStorage.setItem('triangleUserData', JSON.stringify(formData))
  ↓ Click "Next" → saveWorkflowToDatabase() called
  ↓ POST /api/workflow-session → workflow_sessions table INSERT

User enters Step 2
  ↓ formData.component_origins → components state
  ↓ updateFormData('component_origins', components) line 66
  ↓ useEffect line 225 → localStorage updated
  ↓ Click "Next" → saveWorkflowToDatabase() called (only if called, not automatic)

User navigates back to Step 2
  ↓ goToStep(2) called → setCurrentStep(2)
  ↓ ComponentOriginsStepEnhanced re-renders
  ↓ useState initializer line 43-56 checks formData.component_origins
  ↓ Components restored from formData
  ✅ Data visible in UI
```

### Red Flags (Stop and Check These)

- [ ] Any `|| 'Unknown'` in API responses (should fail loudly instead)
- [ ] Any hardcoded tariff rates (should come from AI)
- [ ] Any `trade_volume.replace()` (should use parseTradeVolume())
- [ ] Missing company_country in API response (breaks certificate)
- [ ] Percentages not totaling 100% (bad validation)
- [ ] Components without HS codes before Step 3 (AI needed)
- [ ] localhost:3001 not running (needed for all testing)
- [ ] No JSON.stringify check in ComponentOriginsStepEnhanced effects (infinite loop risk)

### When You're Stuck

1. **"Data disappeared"**
   - Check localStorage first (DevTools → Application)
   - Then: `SELECT component_origins FROM workflow_sessions ORDER BY created_at DESC LIMIT 1;` (use Supabase tool)

2. **"AI not working"**
   - Check .env has OPENROUTER_API_KEY
   - Check: `SELECT * FROM workflow_sessions WHERE component_origins IS NULL ORDER BY created_at DESC LIMIT 1;` (are components coming back from API?)

3. **"Percentages won't work"**
   - Check they're numbers, not strings
   - Debug: What does value_percentage contain? `SELECT component_origins FROM workflow_sessions LIMIT 1;` and examine the JSON

4. **"Navigation hangs"**
   - Check useEffect dependencies (infinite loop?)
   - Check ComponentOriginsStepEnhanced.js line 76 has JSON.stringify comparison

5. **"Certificate missing fields"**
   - Check company_country passed through (line 308)
   - Query: `SELECT company_name, qualification_result FROM workflow_completions ORDER BY completed_at DESC LIMIT 1;`

6. **"Type errors"**
   - Check parseTradeVolume() is being used
   - Check what was actually saved: `SELECT trade_volume FROM workflow_sessions ORDER BY created_at DESC LIMIT 1;` (is it a number or string?)

### Example: Investigating "Components Lost"

```
User says: "My components disappeared when I navigated back"

Step 1: Check React state
  Open DevTools → Application → Local Storage
  Search: "triangleUserData"
  ✅ Found it? Move to step 2
  ❌ Not found? Data never got to localStorage - check saveWorkflowToDatabase()

Step 2: Check database has the data
  Query (via mcp__supabase__execute_sql):
  SELECT id, company_name, component_origins
  FROM workflow_sessions
  ORDER BY created_at DESC LIMIT 1;

  ✅ component_origins has data? Then React should restore it
  ❌ component_origins is NULL? Then API didn't save it - check workflow-session.js POST

Step 3: Check useState initializer
  Open ComponentOriginsStepEnhanced.js line 43-56
  ✅ Check: if (formData.component_origins && formData.component_origins.length > 0)
  If this condition is true and formData has components, they WILL restore

Step 4: Check useEffect sync isn't stuck
  ComponentOriginsStepEnhanced.js line 73-80
  ✅ Check: JSON.stringify comparison exists
  If it doesn't, infinite loop is possible
```

### Example: Investigating "Tariff Data Missing"

```
User says: "Components show no MFN rates or USMCA rates"

Step 1: Check enrichment happened
  Query (via mcp__supabase__execute_sql):
  SELECT component_origins
  FROM workflow_sessions
  WHERE component_origins @> '[{"mfn_rate":true}]'
  LIMIT 1;

  ✅ Query returns data? Enrichment works somewhere
  ❌ No results? Enrichment never happened - check enrichment-router.js

Step 2: Check API response
  ai-usmca-complete-analysis.js returns components with mfn_rate, usmca_rate, etc.
  Query latest workflow:
  SELECT qualification_result
  FROM workflow_completions
  ORDER BY completed_at DESC LIMIT 1;

  Does the JSON have tariff fields? If not, API didn't enrich

Step 3: Check tariff cache populated
  Query (via mcp__supabase__execute_sql):
  SELECT COUNT(*)
  FROM tariff_rates_cache
  WHERE mfn_rate IS NOT NULL;

  ✅ Count > 0? Cache is populated
  ❌ Count = 0? Cache is empty - AI never populated it
```

### Example: Investigating "Payment Not Saved"

```
User says: "I paid but subscription didn't activate"

Step 1: Check Stripe webhook received event
  Query (via mcp__supabase__execute_sql):
  SELECT id, stripe_invoice_id, amount, status, paid_at
  FROM invoices
  ORDER BY created_at DESC LIMIT 1;

  ✅ Found recent paid invoice? Webhook worked
  ❌ No data? Webhook never fired or insert failed - check stripe/webhook.js

Step 2: Check user subscription updated
  Query:
  SELECT user_id, subscription_tier, subscription_start_date
  FROM user_profiles
  ORDER BY updated_at DESC LIMIT 1;

  ✅ subscription_tier = 'starter'/'professional'? Update worked
  ❌ subscription_tier = 'trial'? User object never got updated - check webhook handler line that updates user
```

---

**This is your working document. Update it as you find new patterns. Use the Supabase tool constantly.**
