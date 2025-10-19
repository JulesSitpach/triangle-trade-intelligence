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

Click outside field to save.

---

**Add Component #1**:
- **Description**: "Cold-rolled steel automotive housing for engine mounts"
- **Origin Country**: **China**
- **Value Percentage**: **40**
- Click **"🤖 Get AI HS Code Suggestion"**
🤖
AI Suggestion
92% confidence
HS Code: 7326.90.85
Other articles of iron or steel
▲ Hide AI Analysis
🧠 Why We Classified This Way:
This component is classified as a steel article based on its material composition and construction, NOT based on its end-use application in engine mounts. Key Classification Rationale: 1. PRIMARY MATERIAL: Cold-rolled steel - the defining characteristic 2. COMPONENT TYPE: Structural housing/enclosure - a formed steel article 3. MANUFACTURING PROCESS: Cold-rolled indicates sheet metal or structural steel that has been processed 4. FUNCTION WITHIN COMPONENT: Provides structural support and containment for engine mount assembly Why NOT other codes: - NOT 8413.91.00 (pump parts): This is NOT a pump component; the fact it goes into an engine mount assembly doesn't reclassify the steel housing - NOT 7308.90.00 (structural steel): While possible for some steel structures, this code typically applies to larger structural elements, frameworks, and building components. A housing is better classified as a formed/finished steel article - NOT 7320.90.00 (springs): This is not a spring or elastic element CORRECT APPROACH APPLIED: Classifying by WHAT IT IS (cold-rolled steel housing article) rather than WHERE IT GOES (engine mount assembly) UESMA CONSIDERATION: Origin is CN (China) = 40% of total product value from non-USMCA country. This component does NOT qualify as originating from a USMCA country and would require substantial value addition or transformation to potentially qualify for USMCA treatment in the final assembly.

🔄 Other Options to Consider:
7308.90.00
45% match
Could apply if component qualifies as 'structural steel' rather than finished article. However, 'housing' suggests a formed/completed article rather than raw structural framework. Use 7308.90 only if component is confirmed as unfinished structural element for further assembly.
7326.91.00
15% match
Applies to 'articles of iron or steel, not elsewhere specified' with specific fastening applications. Only if component serves primarily as a fastener or fastening element, which conflicts with 'housing' description.
💡 Consider these if your product specs change or for different use cases


**Verify**:
- ✅ HS code appears: "7326.90.85"
- ✅ AI confidence >80%
- ✅ Component table shows: HS Code, Description, MFN Rate, USMCA Rate, Savings %

**Actual HS Code**: __________
**AI Confidence**: __________%

---

**Add Component #2**:
- **Description**: "Extruded aluminum mounting bracket for automotive assembly"
- **Origin Country**: **Mexico**
- **Value Percentage**: **35**
- Click **"🤖 Get AI HS Code Suggestion"**
🤖
AI Suggestion
92% confidence
HS Code: 7616.99.50
Other articles of aluminum
▲ Hide AI Analysis
🧠 Why We Classified This Way:
This component is classified based on WHAT IT IS (material composition and form), not on its end-use application. Classification Rationale: 1. PRIMARY MATERIAL: Aluminum (explicitly stated as 'extruded aluminum') 2. CONSTRUCTION: Extruded form - a manufacturing process that creates the finished aluminum article 3. FUNCTION: Structural mounting bracket - a mechanical support component 4. CORRECT APPROACH: This is an aluminum article → Chapter 76 (Aluminum and articles thereof) Why NOT other codes: - NOT 7326.90.85 (Steel articles): Component is aluminum, not steel. The already-classified steel housing (7326.90.85) is specifically steel; this bracket is fundamentally different material. - NOT 8537.10.90 (Control boards/panels): This bracket has no electronic function; it's purely structural - NOT 8413.91.00 (Pump parts): End-use application irrelevant; this bracket is not pump-specific Specific HTS Code Selection: - Chapter 76, Section II covers "Aluminum articles" - 7616.99.50 is the appropriate subheading for "Other articles of aluminum" when the article is a simple structural component like a bracket - The extrusion process and mounting bracket form fall under miscellaneous aluminum articles USMCA Consideration: - Component Origin: Mexico (USMCA country) ✓ - Material: Aluminum (typically high regional value potential) - This component qualifies positively toward USMCA regional content calculations

🔄 Other Options to Consider:
7616.10.30
45% match
Applies only if bracket is a 'tube or pipe' form - unlikely for a mounting bracket which is typically a plate/angle profile. Use only if component geometry confirms tubular construction.
7610.10.00
35% match
Applies to aluminum structures/frameworks - only if bracket qualifies as structural framework per HTS definition. Mounting brackets typically classified as 7616.99.50 instead.
💡 Consider these if your product specs change or for different use cases

**Add Component #3**:
- **Description**: "Synthetic rubber gasket seal for fluid containment"
- **Origin Country**: **USA**
- **Value Percentage**: **25**
- Click **"🤖 Get AI HS Code Suggestion"**

🤖
AI Suggestion
92% confidence
HS Code: 4016.93.10
Gaskets and similar seals, of vulcanized rubber other than hard rubber, in sets or assorted, for motor vehicles
▲ Hide AI Analysis
🧠 Why We Classified This Way:
This component is a SYNTHETIC RUBBER gasket seal - classified by its MATERIAL (rubber) and FUNCTION (sealing), not by its end-use application. Per HTS Chapter 40 classification rules, rubber articles are categorized based on material composition and form. HS 4016.93.10 specifically covers rubber gaskets and seals, which is the precise classification for this synthetic rubber component. The component is fundamentally a rubber article regardless of whether it's used in automotive engine mounts, fluid systems, or other applications. Origin: US (USMCA country) - qualifies for USMCA consideration if regional value content requirements are met.

🔄 Other Options to Consider:
4016.99.20
75% match
Alternative if the gasket does not fall under the motor vehicle-specific subcategory (4016.93.10). This is the catch-all for other rubber gaskets and seals not specifically enumerated. Use this if there is uncertainty about motor vehicle application specificity.
4016.93.50
60% match
Less likely alternative for gaskets/seals of vulcanized rubber if the specific motor vehicle classification (4016.93.10) is deemed inapplicable. Generally broader and less precise for this type of component.
💡 Consider these if your product specs change or for different use cases

**Verify**:
- ✅ HS code suggested (e.g., "7616.99.50")
- ✅ Enrichment shows USMCA rate benefit

Click **"Analyze USMCA Qualification"**

---full output
PS D:\bacjup\triangle-simple> npm run dev

> triangle-intelligence-platform@1.0.0 dev
> next dev -p 3000 -H 0.0.0.0

  ▲ Next.js 14.2.33
  - Local:        http://localhost:3000
  - Network:      http://0.0.0.0:3000
  - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 1579ms
 ○ Compiling /404 ...
 ✓ Compiled /404 in 745ms (380 modules)
 GET /_next/static/webpack/604437dca8a92ad5.webpack.hot-update.json 404 in 508ms
 ⚠ Fast Refresh had to perform a full reload. Read more: https://nextjs.org/docs/messages/fast-refresh-reload
 GET / 200 in 964ms
 GET / 200 in 22ms
 ✓ Compiled /api/auth/me in 209ms (152 modules)
 ✓ Compiled (157 modules)
(node:25780) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
{"timestamp":"2025-10-19T16:11:12.574Z","level":"INFO","message":"Dropdown options request","category":"all"}
 GET /api/auth/me 401 in 435ms
{"timestamp":"2025-10-19T16:11:12.933Z","level":"INFO","message":"Business types generated from USMCA rules","totalCategories":9,"businessTypesFound":7}
{"timestamp":"2025-10-19T16:11:13.112Z","level":"INFO","message":"Performance: Dropdown options served","duration_ms":538,"category":"all","items":8}
 GET /api/database-driven-dropdown-options?category=all 200 in 923ms
 ✓ Compiled /login in 226ms (408 modules)
 ✓ Compiled /api/auth/login in 54ms (164 modules)
🔐 Login attempt: macproductions010@gmail.com
✅ Password verified for: macproductions010@gmail.com
✅ Login successful: macproductions010@gmail.com Admin: false
 POST /api/auth/login 200 in 729ms
 ○ Compiling /dashboard ...
 ✓ Compiled /dashboard in 717ms (636 modules)
 ✓ Compiled /api/dashboard-data in 84ms (180 modules)
📊 Dashboard Usage Check: {
  userId: '570206c8-b431-4936-81e8-8186ea4065f0',
  email: 'macproductions010@gmail.com',
  tier: 'Professional',
  tierLimit: 100
}
📍 User Alert Filtering Context: {
  userId: '570206c8-b431-4936-81e8-8186ea4065f0',
  userHSCodes: 10,
  userDestination: 'US',
  workflowCount: 43
}
🚫 Alert filtered out: "Port Strike Expected to Affect Imports" {
  hsCodeMatch: false,
  destinationMatch: true,
  userDestination: 'US',
  alertDestinations: []
}
🚫 Alert filtered out: "New Steel Tariffs Announced" {
  hsCodeMatch: false,
  destinationMatch: true,
  userDestination: 'US',
  alertDestinations: []
}
🚫 Alert filtered out: "Aluminum Prices Surge 12%" {
  hsCodeMatch: false,
  destinationMatch: true,
  userDestination: 'US',
  alertDestinations: []
}
✅ Alert filtering complete: {
  totalAlerts: 4,
  relevantAlerts: 1,
  filtered: 3,
  userDestination: 'US'
}
 GET /api/dashboard-data 200 in 1073ms
 ○ Compiling / ...
 ✓ Compiled / in 853ms (748 modules)
 GET / 200 in 522ms
 ✓ Compiled /api/trust/trust-metrics in 57ms (203 modules)
 ✓ Compiled (213 modules)
{"timestamp":"2025-10-19T16:12:40.495Z","level":"INFO","message":"Dropdown options request","category":"all"}
 GET /api/trust/trust-metrics 200 in 227ms
{"timestamp":"2025-10-19T16:12:41.038Z","level":"INFO","message":"Business types generated from USMCA rules","totalCategories":9,"businessTypesFound":7}
{"timestamp":"2025-10-19T16:12:41.056Z","level":"INFO","message":"Workflow session retrieved","sessionId":"session_1760821723588_ip3nrnbft","duration_ms":563}
 GET /api/workflow-session?sessionId=session_1760821723588_ip3nrnbft 304 in 766ms
{"timestamp":"2025-10-19T16:12:41.110Z","level":"INFO","message":"Performance: Dropdown options served","duration_ms":615,"category":"all","items":8}
 GET /api/database-driven-dropdown-options?category=all 200 in 819ms
{"timestamp":"2025-10-19T16:13:23.257Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":423}
 POST /api/workflow-session 200 in 430ms
{"timestamp":"2025-10-19T16:13:30.767Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":304}
 POST /api/workflow-session 200 in 311ms
{"timestamp":"2025-10-19T16:13:32.520Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":184}
 POST /api/workflow-session 200 in 193ms
{"timestamp":"2025-10-19T16:13:34.903Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":188}
 POST /api/workflow-session 200 in 193ms
{"timestamp":"2025-10-19T16:13:53.881Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":278}
 POST /api/workflow-session 200 in 284ms
{"timestamp":"2025-10-19T16:14:21.177Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":248}
 POST /api/workflow-session 200 in 256ms
{"timestamp":"2025-10-19T16:14:37.741Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":295}
 POST /api/workflow-session 200 in 300ms
{"timestamp":"2025-10-19T16:14:43.843Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":257}
 POST /api/workflow-session 200 in 261ms
{"timestamp":"2025-10-19T16:14:49.176Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":256}
 POST /api/workflow-session 200 in 264ms
{"timestamp":"2025-10-19T16:15:14.758Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":268}
 POST /api/workflow-session 200 in 271ms
{"timestamp":"2025-10-19T16:15:32.599Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":250}
 POST /api/workflow-session 200 in 260ms
{"timestamp":"2025-10-19T16:15:36.470Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":168}
 POST /api/workflow-session 200 in 175ms
{"timestamp":"2025-10-19T16:15:56.224Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":253}
 POST /api/workflow-session 200 in 261ms
{"timestamp":"2025-10-19T16:16:02.531Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":247}
 POST /api/workflow-session 200 in 263ms
{"timestamp":"2025-10-19T16:16:07.780Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":259}
 POST /api/workflow-session 200 in 264ms
 ✓ Compiled /api/agents/classification in 130ms (209 modules)
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Cold-rolled steel automotive housing for engine mounts" (User: anonymous)
🔍 Classification AI received additionalContext: {
  overallProduct: '"Automotive engine mount assemblies with steel housing and rubber vibration dampeners',
  industryContext: 'Exporter',
  hasContext: true
}
[Classification] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 4000, attempt: 1 }
[Classification] OpenRouter response length: 5115
[Classification] OpenRouter usage: { prompt_tokens: 1768, completion_tokens: 1244, total_tokens: 3012 }
[Classification] OpenRouter finish_reason: stop
[Classification] Raw response (first 500 chars): ```json
{
  "hsCode": "7326.90.85",
  "description": "Other articles of iron or steel",
  "confidence": 92,
  "explanation": "This component is classified as a steel article based on its material composition and construction, NOT based on its end-use application in engine mounts.\n\nKey Classification Rationale:\n1. PRIMARY MATERIAL: Cold-rolled steel - the defining characteristic\n2. COMPONENT TYPE: Structural housing/enclosure - a formed steel article\n3. MANUFACTURING PROCESS: Cold-rolled ind
[Classification] Raw response (last 500 chars): ility** of the complete final product at the assembly level
2. **Calculate total regional value content** including this 40% Chinese-origin component 
3. **Determine if alternative:** Consider sourcing from USMCA countries (US, Canada, Mexico) if preferential treatment is required
4. **Documentation:** Prepare origin certificates and transformation records for all components

The component itself is correctly classified at **7326.90.85**, but USMCA compliance requires full product-level analysis.
[Classification] ✅ SUCCESS - Metrics: {
  openRouterCalls: 1,
  anthropicCalls: 0,
  parseErrors: 0,
  duration: '14634ms',
  provider: 'openrouter'
}
[Classification] Interaction: {
  "agent": "Classification",
  "timestamp": "2025-10-19T16:16:22.582Z",
  "prompt": "You are an HS code classification expert specializing in COMPONENT-LEVEL classification.\n\n=== CRITICAL INSTRUCTION ===\nYou are classifying THIS SPECIFIC COMPONENT by what it IS, not by what product it...",
  "success": true,
  "confidence": 92,
  "model": "anthropic/claude-haiku-4.5"
}
[AI AGENT] Classification result: 7326.90.85 (92% confidence)
 POST /api/agents/classification 200 in 14799ms
{"timestamp":"2025-10-19T16:16:44.201Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":258}
 POST /api/workflow-session 200 in 270ms
{"timestamp":"2025-10-19T16:16:48.292Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":207}
 POST /api/workflow-session 200 in 211ms
{"timestamp":"2025-10-19T16:18:08.489Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":359}
 POST /api/workflow-session 200 in 364ms
{"timestamp":"2025-10-19T16:18:13.806Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":259}
 POST /api/workflow-session 200 in 266ms
{"timestamp":"2025-10-19T16:18:18.662Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":286}
 POST /api/workflow-session 200 in 291ms
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Extruded aluminum mounting bracket for automotive assembly" (User: anonymous)
🔍 Classification AI received additionalContext: {
  overallProduct: '"Automotive engine mount assemblies with steel housing and rubber vibration dampeners',
  industryContext: 'Exporter',
  hasContext: true
}
[Classification] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 4000, attempt: 1 }
[Classification] OpenRouter response length: 4087
[Classification] OpenRouter usage: { prompt_tokens: 1857, completion_tokens: 1061, total_tokens: 2918 }
[Classification] OpenRouter finish_reason: stop
[Classification] Raw response (first 500 chars): ```json
{
  "hsCode": "7616.99.50",
  "description": "Other articles of aluminum",
  "confidence": 92,
  "explanation": "This component is classified based on WHAT IT IS (material composition and form), not on its end-use application.\n\nClassification Rationale:\n1. PRIMARY MATERIAL: Aluminum (explicitly stated as 'extruded aluminum')\n2. CONSTRUCTION: Extruded form - a manufacturing process that creates the finished aluminum article\n3. FUNCTION: Structural mounting bracket - a mechanical supp
[Classification] Raw response (last 500 chars): utomotive assembly | → CONTEXTUAL ONLY (does not determine HS code) |
| **Origin** | Mexico (USMCA) | → Qualifies for regional content |

---

## **Why This Is Different From The Steel Component (7326.90.85):**

The already-classified steel housing uses **HS 7326.90.85** because it is **steel** (Chapter 73). Your aluminum bracket uses **HS 7616.99.50** because it is **aluminum** (Chapter 76).

Both are structural automotive components, but **material governs classification**, not application. ✓
[Classification] ✅ SUCCESS - Metrics: {
  openRouterCalls: 1,
  anthropicCalls: 0,
  parseErrors: 0,
  duration: '12504ms',
  provider: 'openrouter'
}
[Classification] Interaction: {
  "agent": "Classification",
  "timestamp": "2025-10-19T16:18:31.491Z",
  "prompt": "You are an HS code classification expert specializing in COMPONENT-LEVEL classification.\n\n=== CRITICAL INSTRUCTION ===\nYou are classifying THIS SPECIFIC COMPONENT by what it IS, not by what product it...",
  "success": true,
  "confidence": 92,
  "model": "anthropic/claude-haiku-4.5"
}
[AI AGENT] Classification result: 7616.99.50 (92% confidence)
 POST /api/agents/classification 200 in 12516ms
{"timestamp":"2025-10-19T16:20:37.145Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":417}
 POST /api/workflow-session 200 in 422ms
{"timestamp":"2025-10-19T16:20:38.874Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":169}
 POST /api/workflow-session 200 in 177ms
{"timestamp":"2025-10-19T16:20:49.670Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":464}
 POST /api/workflow-session 200 in 481ms
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Synthetic rubber gasket seal for fluid containment" (User: anonymous)
🔍 Classification AI received additionalContext: {
  overallProduct: '"Automotive engine mount assemblies with steel housing and rubber vibration dampeners',
  industryContext: 'Exporter',
  hasContext: true
}
[Classification] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 4000, attempt: 1 }
{"timestamp":"2025-10-19T16:20:56.135Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":302}
 POST /api/workflow-session 200 in 306ms
[Classification] OpenRouter response length: 3527
[Classification] OpenRouter usage: { prompt_tokens: 1855, completion_tokens: 915, total_tokens: 2770 }
[Classification] OpenRouter finish_reason: stop
[Classification] Raw response (first 500 chars): ```json
{
  "hsCode": "4016.93.10",
  "description": "Gaskets and similar seals, of vulcanized rubber other than hard rubber, in sets or assorted, for motor vehicles",
  "confidence": 92,
  "explanation": "This component is a SYNTHETIC RUBBER gasket seal - classified by its MATERIAL (rubber) and FUNCTION (sealing), not by its end-use application. Per HTS Chapter 40 classification rules, rubber articles are categorized based on material composition and form. HS 4016.93.10 specifically covers rubb
[Classification] Raw response (last 500 chars): ket/seal), NOT by the fact that it's part of automotive engine mounts.

**USMCA Qualification: LIKELY**
- Component origin: US (USMCA country) ✓
- Material sourcing: Confirm synthetic rubber composition origin
- If assembled/finished in USMCA country: Qualifies for USMCA benefits

**High Confidence (92%)** because:
- Material clearly identified (synthetic rubber)
- Functional form clearly defined (gasket seal)
- Specific HTS provision directly applicable
- No ambiguity in material classification
[Classification] ✅ SUCCESS - Metrics: {
  openRouterCalls: 1,
  anthropicCalls: 0,
  parseErrors: 0,
  duration: '10729ms',
  provider: 'openrouter'
}
[Classification] Interaction: {
  "agent": "Classification",
  "timestamp": "2025-10-19T16:21:06.225Z",
  "prompt": "You are an HS code classification expert specializing in COMPONENT-LEVEL classification.\n\n=== CRITICAL INSTRUCTION ===\nYou are classifying THIS SPECIFIC COMPONENT by what it IS, not by what product it...",
  "success": true,
  "confidence": 92,
  "model": "anthropic/claude-haiku-4.5"
}
[AI AGENT] Classification result: 4016.93.10 (92% confidence)
 POST /api/agents/classification 200 in 10735ms
{"timestamp":"2025-10-19T16:21:20.949Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":295}
 POST /api/workflow-session 200 in 306ms
 ✓ Compiled /api/ai-usmca-complete-analysis in 317ms (215 modules)
🤖 ========== AI-POWERED USMCA ANALYSIS: START ==========
📥 Received request: {
  company: 'Test USA Exporter Inc 2',
  business_type: 'Exporter',
  product: '"Automotive engine mount assemblies with steel housing and rubber vibration dampeners',
  component_count: 3
}
✅ Usage check passed: 3/100 (97 remaining)
📊 Fetching actual tariff rates for all components...
💰 Cache: 0 hits (FREE), 2 misses (AI call needed)
🎯 TIER 1: Trying OpenRouter...
✅ OpenRouter SUCCESS
💾 Saving 2 AI tariff rates to database...
✅ AI returned rates for 2 components (cached + saved to DB)
✅ Got tariff rates for 2 components
🎯 ========== SENDING TO OPENROUTER ==========
Prompt length: 2602 characters
✅ Successfully saved 2 AI tariff rates to database
🔮 ========== RAW AI RESPONSE ==========
```json
{
  "product": {
    "hs_code": "8708.99.81",
    "description": "Automotive engine mount assemblies with steel housing and rubber vibration dampeners",
    "confidence": 90
  },
  "usmca": {
    "qualified": false,
    "threshold_applied": 75,
    "threshold_source": "USMCA Annex 4-B, Article 4.5 - Automotive Parts",
    "threshold_reasoning": "Engine mount assemblies are classified as automotive parts under Chapter 87, subject to the stringent 75% RVC Net Cost method for automotive goods. Additionally, steel must be melted and poured in North America per steel/aluminum requirements.",
    "north_american_content": 60.0,
    "gap": 15.0,
    "rule": "RVC 75% (Net Cost Method)",
    "reason": "DOES NOT QUALIFY - North American content of 60.0% falls short of the required 75% threshold by 15 percentage points. Critical failure: Chinese cold-rolled steel housing (40%) violates the steel melting/pouring requirement.",
    "component_breakdown": [
      {
        "component": "Cold-rolled steel automotive housing for engine mounts",
        "origin": "CN",
        "percentage": 40,
        "hs_code": "7326.90.85",
        "qualifies": false,
        "issue": "Non-originating - Chinese origin steel violates USMCA steel melting requirement AND represents largest cost component",
        "mfn_rate": "77.5%",
        "section_301": "Additional 25% Section 301 tariff applies (Total: 102.5%)"        
      },
      {
        "component": "Extruded aluminum mounting bracket for automotive assembly",        
        "origin": "MX",
        "percentage": 35,
        "hs_code": "7616.99",
        "qualifies": true,
        "issue": "CONDITIONAL - Must verify aluminum was smelted and cast in North America (Mexico, US, or Canada)",
        "mfn_rate": "0%"
      },
      {
        "component": "Synthetic rubber gasket seal for fluid containment",
        "origin": "US",
        "percentage": 25,
        "hs_code": "4016.93.10",
        "qualifies": true,
        "issue": "None - US origin, fully qualifying",
        "mfn_rate": "0%"
      }
    ],
    "labor_value_added": {
      "canadian_manufacturing": 22.5,
      "description": "Assembly and manufacturing operations in Canada"
    },
    "lvc_requirement": {
      "required": 45,
      "phase": "Phase 2 (2025-2027)",
      "status": "NOT ASSESSED - Product fails primary RVC threshold",
      "note": "Labor Value Content of 45% required for core parts; Canadian labor (22.5%) would not meet this standalone requirement"
    },
    "steel_aluminum_requirement": {
      "status": "FAILS",
      "issue": "Cold-rolled steel housing (40% of product) sourced from China does not meet the requirement that steel be melted and poured in North America",
      "aluminum_status": "CONDITIONAL - Mexican aluminum bracket must be verified as North American smelted/cast"
    },
    "documentation_required": [
      "Certificate of Origin (USMCA format) - CANNOT BE ISSUED until qualification achieved",
      "Steel mill certification proving North American melting/pouring (REQUIRED - currently missing)",
      "Aluminum smelter certification for Mexican bracket (North American origin required)",
      "Supplier declarations from all component manufacturers",
      "Net cost calculation worksheet with detailed breakdown",
      "Bill of materials with country of origin for all inputs",
      "Manufacturing process documentation for Canadian assembly",
      "Labor cost breakdown for Canadian operations",
      "Section 301 exclusion request documentation (if applicable for Chinese steel)"     
    ]
  },
  "savings": {
    "annual_savings": 0,
    "monthly_savings": 0,
    "savings_percentage": 0,
    "mfn_rate": 31.0,
    "usmca_rate": 0,
    "current_duty_exposure": {
      "annual": 1488000,
      "monthly": 124000,
      "breakdown": "Chinese steel component (40% × $4.8M × 77.5%) = $1,488,000 annual MFN duty",
      "section_301_exposure": {
        "annual": 480000,
        "monthly": 40000,
        "rate": "25%",
        "calculation": "Chinese steel component (40% × $4.8M × 25%) = $480,000 annual Section 301 tariff",
        "total_china_tariff": "102.5% effective rate on Chinese steel component"
      }
    },
    "potential_savings_if_qualified": {
      "annual": 1488000,
      "monthly": 124000,
      "note": "Potential savings if USMCA qualification achieved (MFN duties only; Section 301 may still apply to non-originating inputs)"
    }
  },
  "recommendations": [
    "🚨 CRITICAL: Replace Chinese steel housing with North American sourced steel (melted/poured in US/MX/CA) - This is NON-NEGOTIABLE for USMCA qualification",
    "Source cold-rolled steel housing from US suppliers (e.g., US Steel, Nucor) or Mexican steel producers with North American melting certification - estimated cost increase 15-25%",
    "Verify Mexican aluminum bracket meets smelting/casting requirements - obtain mill certificates from supplier immediately",
    "Consider dual-sourcing strategy: North American steel for US-bound shipments, Chinese steel for non-USMCA markets to optimize costs",
    "Explore Section 301 exclusion process for Chinese steel component (though exclusions are limited and temporary)",
    "Negotiate with Canadian manufacturer to increase value-added operations to boost labor content above 22.5%",
    "Target 80%+ North American content to create buffer above 75% threshold and ensure consistent qualification",
    "Implement supplier audit program to verify all origin claims and maintain USMCA compliance documentation",
    "Calculate break-even analysis: Cost increase from NA steel vs. $1.97M annual tariff savings (MFN + Section 301)",
    "File for USMCA certification only after steel sourcing changes implemented - premature filing risks CBP penalties",
    "Consider manufacturing steel housing in-house at Canadian facility if volume justifies capital investment",
    "Engage customs broker to model exact duty impact and verify all calculations before sourcing changes"
  ],
  "detailed_analysis": {
    "threshold_research": "Automotive engine mount assemblies fall under HS 8708.99.81 (Parts and accessories of motor vehicles). USMCA Annex 4-B Article 4.5 mandates 75% Regional Value Content using the Net Cost method for automotive goods, significantly higher than the standard 62.5% for non-automotive products. This reflects USMCA's strategic focus on reshoring automotive manufacturing to North America. Additionally, the steel and aluminum melting/pouring requirement (Annex 4-B Article 4) creates an absolute barrier for non-North American metals, regardless of RVC calculation.",

    "calculation_breakdown": "STEP 1 - Component Analysis:\n• Chinese steel housing: 40% (NON-QUALIFYING - fails steel requirement)\n• Mexican aluminum bracket: 35% (CONDITIONAL - pending verification)\n• US rubber gasket: 25% (QUALIFYING)\n\nSTEP 2 - North American Content Calculation:\n• Qualifying components: 0% (CN steel) + 35% (MX aluminum, assumed qualifying) + 25% (US rubber) = 60%\n• Canadian labor value-added: +22.5%\n• TOTAL NA CONTENT: 60% + 22.5% = 82.5%\n\nHOWEVER - CRITICAL DISQUALIFICATION:\nDespite mathematical RVC of 82.5% exceeding 75% threshold, the product FAILS because:\n1. Steel housing (40%) sourced from China violates mandatory steel melting/pouring requirement\n2. This is an absolute requirement - no de minimis exception applies\n3. Effective NA content = 35% (MX) + 25% (US) + 22.5% (labor) = 82.5% IF steel were compliant\n4. With non-qualifying steel: 0% (CN steel disqualified) + 35% (MX) + 25% (US) + 0% (labor cannot count if major component fails) = 60%\n\nConservative calculation treats entire assembly as non-qualifying when core structural component (steel housing) fails origin requirements.\n\nGAP ANALYSIS: 75% required - 60% actual = 15% shortfall",

    "qualification_reasoning": "The product FAILS USMCA qualification on two grounds:\n\n1. STEEL ORIGIN VIOLATION (Primary): The cold-rolled steel housing representing 40% of product value originates from China. USMCA Annex 4-B Article 4 explicitly requires that steel used in automotive parts be melted and poured in North America (US, Mexico, or Canada). This is a binary requirement with no exceptions or de minimis allowances. Chinese steel automatically disqualifies the entire assembly regardless of other calculations.\n\n2. RVC SHORTFALL (Secondary): Even if we generously calculated RVC including the Chinese component, the conservative interpretation yields only 60% North American content versus the required 75%. The 22.5% Canadian labor value cannot fully compensate for the 40% non-originating steel component.\n\nThe LVC (Labor Value Content) requirement of 45% for 2025-2027 adds additional complexity, though the product fails before this assessment becomes relevant. Canadian manufacturing at 22.5% would fall short of the 45% LVC requirement even if the steel issue were resolved.\n\nCRITICAL INSIGHT: This is not a marginal failure. The steel requirement creates a hard stop that cannot be overcome through calculation adjustments or de minimis claims.",

    "strategic_insights": "BUSINESS IMPACT ANALYSIS:\n\nCurrent State Costs:\n• Annual MFN duty exposure: $1,488,000 (on Chinese steel component)\n• Annual Section 301 tariff: $480,000 (25% on Chinese goods)\n• TOTAL ANNUAL TARIFF BURDEN: $1,968,000\n• Effective tariff rate on Chinese component: 102.5%\n\nPath to Qualification - Investment Required:\n• North American steel typically costs 15-25% premium over Chinese steel\n• On $1.92M steel component (40% of $4.8M): $288K-$480K annual cost increase\n• NET ANNUAL SAVINGS: $1,488K - $360K (avg premium) = $1,128,000\n• ROI: 314% return on steel sourcing change\n• Payback period: Immediate (monthly savings of $94K)\n\nStrategic Recommendations:\n1. IMMEDIATE ACTION: This is a clear financial imperative. The tariff burden ($1.97M) far exceeds the cost of switching to North American steel ($288K-$480K premium).\n\n2. SUPPLIER DIVERSIFICATION: Identify 2-3 qualified North American steel suppliers to ensure supply chain resilience. Key candidates: Nucor (US), Steel Dynamics (US), Ternium (MX).\n\n3. VERIFICATION PROTOCOL: Implement mill certificate verification for both steel (CN→NA switch) and aluminum (MX bracket) to ensure ongoing compliance.\n\n4. MARKET SEGMENTATION: Consider maintaining Chinese steel sourcing for non-USMCA export markets (if applicable) while using NA steel for US-bound shipments.\n\n5. COMPETITIVE ADVANTAGE: USMCA qualification provides 31% cost advantage over competitors using non-qualifying imports, enabling aggressive pricing or margin expansion.\n\n6. COMPLIANCE RISK: Current configuration exposes company to CBP audits, potential penalties for misclassification, and Section 301 enforcement actions.",

    "savings_analysis": "DETAILED TARIFF BREAKDOWN:\n\nCurrent Duty Structure (Non-Qualifying):\n• Product value: $4,800,000 annually\n• Chinese steel component: 40% = $1,920,000\n• MFN duty on steel (HS 7326.90.85): 77.5% = $1,488,000\n• Section 301 tariff (List 3): 25% = $480,000\n• Total annual tariff: $1,968,000\n• Effective duty rate: 41% of total product value\n\nPost-Qualification Scenario (USMCA Compliant):\n• USMCA duty rate: 0%\n• Annual tariff: $0\n• Section 301: Not applicable to North American steel\n• Total savings: $1,968,000 annually ($164,000/month)\n\nCost-Benefit Analysis:\n• North American steel premium: 15-25% = $288K-$480K annually\n• Net savings: $1,488K - $360K (midpoint) = $1,128,000\n• Additional Section 301 savings: $480,000\n• TOTAL NET BENEFIT: $1,608,000 annually\n\nBreak-Even Sensitivity:\n• Even if NA steel costs 50% premium ($960K increase), net savings = $1,008,000\n• Break-even point: 132% steel premium (unrealistic in current market)\n\nCASH FLOW IMPACT:\n• Monthly duty savings: $164,000\n• Monthly steel cost increase: $30,000 (estimated)\n• Net monthly cash flow improvement: $134,000\n• Working capital benefit: Immediate\n\nRECOMMENDATION: The financial case for USMCA qualification is overwhelming. Immediate action to source North American steel will generate 7-figure annual savings with minimal implementation risk."
  },
  "risk_assessment": {
    "compliance_risks": [
      "HIGH: Current imports subject to CBP scrutiny for Section 301 compliance and potential anti-dumping investigations on Chinese steel",
      "MEDIUM: Aluminum bracket origin verification required - unverified North American smelting could trigger post-entry audits",
      "HIGH: Manufacturing in Canada without USMCA qualification may trigger CBSA audits on export claims"
    ],
    "financial_risks": [
      "CRITICAL: $1.97M annual tariff exposure continues until qualification achieved",   
      "HIGH: Section 301 tariffs subject to change - could increase to 50% or higher under trade policy shifts",
      "MEDIUM: Steel price volatility - NA premium may fluctuate 10-30% based on market conditions"
    ],
    "operational_risks": [
      "MEDIUM: Supplier transition period 3-6 months - temporary dual sourcing may be required",
      "LOW: Quality verification for new NA steel suppliers - testing and certification needed",
      "MEDIUM: Supply chain disruption if Chinese supplier relationship terminated abruptly"
    ]
  },
  "action_plan": {
    "immediate_30_days": [
      "Issue RFQ to 5+ North American steel suppliers for cold-rolled automotive housing material",
      "Obtain mill certificates from Mexican aluminum bracket supplier proving NA smelting/casting",
      "Engage customs attorney to review Section 301 exposure and exclusion possibilities",
      "Conduct cost-benefit analysis with finance team on steel sourcing transition"      
    ],
    "short_term_90_days": [
      "Award contract to qualified NA steel supplier with verified melting/pouring certification",
      "Implement quality testing protocol for new steel source",
      "Begin parallel production runs with NA steel to validate performance",
      "Prepare USMCA Certificate of Origin documentation framework",
      "Train procurement and compliance teams on ongoing USMCA requirements"
    ],
    "long_term_180_days": [
      "Complete transition to 100% North American steel sourcing",
      "File USMCA Certificates of Origin for all US-bound shipments",
      "Implement automated compliance tracking system for origin verification",
      "Conduct supplier audits to verify ongoing USMCA compliance",
      "Realize full $1.97M annual tariff savings"
    ]
  },
  "confidence_score": 92,
  "confidence_factors": {
    "hs_classification": "90% - Engine mount assemblies clearly fall under 8708.99.81",   
    "threshold_application": "95% - Automotive 75% RVC requirement is explicit in Annex 4-B",
    "steel_requirement": "98% - Steel melting/pouring requirement is unambiguous",        
    "calculation_accuracy": "90% - Conservative approach to RVC calculation given steel disqualification",
    "savings_estimate": "85% - Based on stated MFN rates; Section 301 rate verified at 25% for List 3"
  }
}
```
========== END RAW RESPONSE ==========
✅ Results JSON parsed successfully (method: code_block, sanitized)
✅ Parsed analysis: {
  qualified: false,
  threshold: 75,
  content: 60,
  recommendation_count: 12
}
🔍 Enriching components with tariff intelligence...
📦 Destination-aware enrichment for 3 components → US
   Strategy: AI + 24-hour cache
   Component 1/3: Routing HS 7326.90.85 from CN → US
{"timestamp":"2025-10-19T16:23:05.122Z","level":"INFO","message":"Cache strategy determined","destination_country":"US","normalized_code":"US","strategy":"ai_24hr"}
{"timestamp":"2025-10-19T16:23:05.122Z","level":"INFO","message":"Enrichment router - routing request","component_origin":"CN","destination":"US","strategy":"ai_24hr","hs_code":"7326.90.85","section_301_applicable":true}
{"timestamp":"2025-10-19T16:23:05.123Z","level":"INFO","message":"AI 24-hour cache enrichment started","component_origin":"CN","destination":"US","hs_code":"7326.90.85","cache_ttl_hours":24,"section_301_applicable":true}
⚠️ Component "Extruded aluminum mounting bracket for automotive assembly" missing HS code 
⚠️ DEV ISSUE [HIGH]: component_enrichment - Missing required field: hs_code {
  component_description: 'Extruded aluminum mounting bracket for automotive assembly',    
  origin_country: 'MX',
  value_percentage: 35
}
   Component 3/3: Routing HS 4016.93.10 from US → US
{"timestamp":"2025-10-19T16:23:05.125Z","level":"INFO","message":"Cache strategy determined","destination_country":"US","normalized_code":"US","strategy":"ai_24hr"}
{"timestamp":"2025-10-19T16:23:05.125Z","level":"INFO","message":"Enrichment router - routing request","component_origin":"US","destination":"US","strategy":"ai_24hr","hs_code":"4016.93.10","section_301_applicable":false}
{"timestamp":"2025-10-19T16:23:05.126Z","level":"INFO","message":"AI 24-hour cache enrichment started","component_origin":"US","destination":"US","hs_code":"4016.93.10","cache_ttl_hours":24,"section_301_applicable":false}
 ✓ Compiled /api/admin/log-dev-issue in 104ms (194 modules)
{"timestamp":"2025-10-19T16:23:05.460Z","level":"INFO","message":"Cache HIT - USA 24-hour","hs_code":"4016.93.10","cache_age_hours":0}
   ✅ Component 3: Enriched (MFN 2.5%, Source: ai_cached_24hr)
{"timestamp":"2025-10-19T16:23:05.483Z","level":"INFO","message":"Cache HIT - USA 24-hour","hs_code":"7326.90.85","cache_age_hours":0}
   ✅ Component 1: Enriched (MFN 2.9%, Source: ai_cached_24hr)
✅ Destination-aware enrichment complete: 3 components processed for US
✅ Component enrichment complete: { total_components: 3, enriched_count: 2, destination_country: 'US' }

🔍 Component Validation - AI Enrichment Output
📊 Total Components: 3
❌ 1 components missing enrichment data:
   • "Extruded aluminum mounting bracket for automotive assembly": Missing hs_code        
⚠️ 1 components missing enrichment data - check logs above
{"timestamp":"2025-10-19T16:23:05.489Z","level":"INFO","message":"AI-powered USMCA analysis completed","company":"Test USA Exporter Inc 2","qualified":false,"processing_time":98964}
🚨 DEV ISSUE LOGGED: missing_data - Missing required field: hs_code {
  component_description: 'Extruded aluminum mounting bracket for automotive assembly',    
  origin_country: 'MX',
  value_percentage: 35
}
 POST /api/admin/log-dev-issue 200 in 370ms
✅ Workflow saved to database for user: 570206c8-b431-4936-81e8-8186ea4065f0
[USAGE-TRACKING] ✅ Incremented for user 570206c8-b431-4936-81e8-8186ea4065f0: 4/100
✅ Usage tracked: 4/100
 POST /api/ai-usmca-complete-analysis 200 in 99989ms

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
