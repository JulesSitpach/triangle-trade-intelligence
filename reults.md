PS D:\bacjup\triangle-simple> npm run dev

> triangle-intelligence-platform@1.0.0 dev
> next dev -p 3000 -H 0.0.0.0

  ▲ Next.js 14.2.33
  - Local:        http://localhost:3000
  - Network:      http://0.0.0.0:3000
  - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 1742ms
 ○ Compiling / ...
 ✓ Compiled / in 790ms (375 modules)
 GET / 200 in 995ms
 ✓ Compiled /api/auth/me in 163ms (148 modules)
 ✓ Compiled (153 modules)
(node:26544) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
🔐 [AUTH-ME] Session data: {
  user_id_from_session: '570206c8-b431-4936-81e8-8186ea4065f0',
  user_id_type: 'string',
  email_from_session: 'macproductions010@gmail.com'
}
📊 [AUTH-ME] Profile lookup for user 570206c8-b431-4936-81e8-8186ea4065f0 : {
  profile_found: true,
  profile_id: '570206c8-b431-4936-81e8-8186ea4065f0',
  profile_user_id: '570206c8-b431-4936-81e8-8186ea4065f0',
  profile_email: 'macproductions010@gmail.com',
  subscription_tier: 'Premium',
  trial_ends_at: null,
  profile_error: undefined,
  profile_error_code: undefined
}
 GET /api/auth/me?t=1762267585292 200 in 1051ms
[DROPDOWN-OPTIONS] Loaded 8 product categories from usmca_qualification_rules table
 GET /api/database-driven-dropdown-options?category=all 200 in 1093ms
 ✓ Compiled /login in 189ms (401 modules)
 ✓ Compiled /api/auth/login in 71ms (160 modules)
🔐 Login attempt: macproductions010@gmail.com
  trial_ends_at: null,
  profile_error: undefined,
  profile_error_code: undefined
}
 GET /api/auth/me?t=1762267585292 200 in 1051ms
[DROPDOWN-OPTIONS] Loaded 8 product categories from usmca_qualification_rules table
 GET /api/database-driven-dropdown-options?category=all 200 in 1093ms
 ✓ Compiled /login in 189ms (401 modules)
 ✓ Compiled /api/auth/login in 71ms (160 modules)
🔐 Login attempt: macproductions010@gmail.com
  profile_error_code: undefined
}
 GET /api/auth/me?t=1762267585292 200 in 1051ms
[DROPDOWN-OPTIONS] Loaded 8 product categories from usmca_qualification_rules table
 GET /api/database-driven-dropdown-options?category=all 200 in 1093ms
 ✓ Compiled /login in 189ms (401 modules)
 ✓ Compiled /api/auth/login in 71ms (160 modules)
🔐 Login attempt: macproductions010@gmail.com
 GET /api/auth/me?t=1762267585292 200 in 1051ms
[DROPDOWN-OPTIONS] Loaded 8 product categories from usmca_qualification_rules table
 GET /api/database-driven-dropdown-options?category=all 200 in 1093ms
 ✓ Compiled /login in 189ms (401 modules)
 ✓ Compiled /api/auth/login in 71ms (160 modules)
🔐 Login attempt: macproductions010@gmail.com
 GET /api/database-driven-dropdown-options?category=all 200 in 1093ms
 ✓ Compiled /login in 189ms (401 modules)
 ✓ Compiled /api/auth/login in 71ms (160 modules)
🔐 Login attempt: macproductions010@gmail.com
✅ Password verified for: macproductions010@gmail.com
 ✓ Compiled /login in 189ms (401 modules)
 ✓ Compiled /api/auth/login in 71ms (160 modules)
🔐 Login attempt: macproductions010@gmail.com
✅ Password verified for: macproductions010@gmail.com
✅ Login successful: macproductions010@gmail.com Admin: false
 POST /api/auth/login 200 in 924ms
🔐 Login attempt: macproductions010@gmail.com
✅ Password verified for: macproductions010@gmail.com
✅ Login successful: macproductions010@gmail.com Admin: false
 POST /api/auth/login 200 in 924ms
✅ Password verified for: macproductions010@gmail.com
✅ Login successful: macproductions010@gmail.com Admin: false
 POST /api/auth/login 200 in 924ms
 ○ Compiling /dashboard ...
 ✓ Compiled /dashboard in 592ms (625 modules)
✅ Login successful: macproductions010@gmail.com Admin: false
 POST /api/auth/login 200 in 924ms
 ○ Compiling /dashboard ...
 ✓ Compiled /dashboard in 592ms (625 modules)
 ✓ Compiled /api/dashboard-data in 132ms (175 modules)
 ○ Compiling /dashboard ...
 ✓ Compiled /dashboard in 592ms (625 modules)
 ✓ Compiled /api/dashboard-data in 132ms (175 modules)
 ✓ Compiled /api/dashboard-data in 132ms (175 modules)
📊 Dashboard Usage Check: {
  userId: '570206c8-b431-4936-81e8-8186ea4065f0',
  userId: '570206c8-b431-4936-81e8-8186ea4065f0',
  email: 'macproductions010@gmail.com',
  email: 'macproductions010@gmail.com',
  tier: 'Premium',
  analysisLimit: 500,
  briefingLimit: 1000,
  source: 'monthly_usage_tracking',
  billingPeriod: '2025-11',
  analysisCount: 35,
  briefingCount: 0
}
 GET /api/dashboard-data 200 in 2281ms
 ○ Compiling /usmca-workflow ...
 ✓ Compiled /usmca-workflow in 575ms (783 modules)
[DROPDOWN-OPTIONS] Loaded 8 product categories from usmca_qualification_rules table
 GET /api/database-driven-dropdown-options?category=all 200 in 169ms
 ✓ Compiled /api/workflow-session in 80ms (221 modules)
{"timestamp":"2025-11-04T14:46:54.264Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762267613931_fvc6x15pc","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":245}
 POST /api/workflow-session 200 in 343ms
⚠️ Component 0 missing required fields in workflow-session: {
  description: 'Microprocessor (ARM-based)',
  hasHsCode: false,
  hasOriginCountry: false
}
{"timestamp":"2025-11-04T14:47:36.440Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"\"session_1762267613931_fvc6x15pc\"","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":248}
 POST /api/workflow-session 200 in 254ms
⚠️ Component 0 missing required fields in workflow-session: {
  description: 'Microprocessor (ARM-based)',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-04T14:47:38.203Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"\"session_1762267613931_fvc6x15pc\"","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":161}
 POST /api/workflow-session 200 in 173ms
⚠️ Component 0 missing required fields in workflow-session: {
  description: 'Microprocessor (ARM-based)',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-04T14:47:42.895Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"\"session_1762267613931_fvc6x15pc\"","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":217}
 POST /api/workflow-session 200 in 222ms
 ✓ Compiled /api/agents/classification in 144ms (212 modules)
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Microprocessor (ARM-based)" (User: 570206c8-b431-4936-81e8-8186ea4065f0)
🔍 Checking cache for: "microprocessor (arm-based)"
💰 Database Cache HIT for "Microprocessor (ARM-based)..." (HS: 8542.31.00, Confidence: 95%, saved ~13 seconds)
📊 [USAGE-TRACKING] Would increment classification for user 570206c8-b431-4936-81e8-8186ea4065f0 (not implemented yet)
 POST /api/agents/classification 200 in 468ms
{"timestamp":"2025-11-04T14:47:47.204Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"\"session_1762267613931_fvc6x15pc\"","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":169}
 POST /api/workflow-session 200 in 184ms
⚠️ Component 1 missing required fields in workflow-session: { description: '', hasHsCode: false, hasOriginCountry: false }
{"timestamp":"2025-11-04T14:47:49.871Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"\"session_1762267613931_fvc6x15pc\"","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":134}
 POST /api/workflow-session 200 in 138ms
⚠️ Component 1 missing required fields in workflow-session: {
  description: 'Power Supply Unit (85W)',
  hasHsCode: false,
  hasOriginCountry: false
}
{"timestamp":"2025-11-04T14:47:55.695Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"\"session_1762267613931_fvc6x15pc\"","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":200}
 POST /api/workflow-session 200 in 207ms
⚠️ Component 1 missing required fields in workflow-session: {
  description: 'Power Supply Unit (85W)',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-04T14:47:57.841Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"\"session_1762267613931_fvc6x15pc\"","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":165}
 POST /api/workflow-session 200 in 170ms
⚠️ Component 1 missing required fields in workflow-session: {
  description: 'Power Supply Unit (85W)',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-04T14:48:00.891Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"\"session_1762267613931_fvc6x15pc\"","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":155}
 POST /api/workflow-session 200 in 158ms
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Power Supply Unit (85W)" (User: 570206c8-b431-4936-81e8-8186ea4065f0)
🔍 Checking cache for: "power supply unit (85w)"
💰 Database Cache HIT for "Power Supply Unit (85W)..." (HS: 8504.40.00, Confidence: 78%, saved ~13 seconds)
📊 [USAGE-TRACKING] Would increment classification for user 570206c8-b431-4936-81e8-8186ea4065f0 (not implemented yet)
 POST /api/agents/classification 200 in 287ms
{"timestamp":"2025-11-04T14:48:05.436Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"\"session_1762267613931_fvc6x15pc\"","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":159}
 POST /api/workflow-session 200 in 165ms
{"timestamp":"2025-11-04T14:48:05.573Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"\"session_1762267613931_fvc6x15pc\"","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":129}
 POST /api/workflow-session 200 in 133ms
 ✓ Compiled /api/ai-usmca-complete-analysis in 360ms (228 modules)
[USAGE-TRACKING] ✅ Slot reserved for user 570206c8-b431-4936-81e8-8186ea4065f0: 36/500
[USMCA-ANALYSIS] ✅ Slot reserved (ID: 570206c8-b431-4936-81e8-8186ea4065f0-1762267686460): 36/500
🔍 [VOLATILITY-CHECK] Checking tariff volatility for: { hs_code: '8542.31.00', origin: 'CN', destination: 'US' }
⚠️ [VOLATILITY-RESULT] Tier determined: {
  hs_code: '8542.31.00',
  tier: 1,
  volatility: 'super_volatile',
  bypassDatabase: true,
  reason: 'China semiconductors/electronics to USA - Section 301 + CHIPS Act restrictions (rates change monthly)'
}
🚨 [SUPER-VOLATILE] Skipping database, marking component for AI research: {
  component: 'Microprocessor (ARM-based)',
  reason: 'China semiconductors/electronics to USA - Section 301 + CHIPS Act restrictions (rates change monthly)',
  policies: [
    'Section 301 (volatile)',
    'CHIPS Act',
    'Reciprocal Tariffs',
    'IEEPA'
  ]
}
🔍 [VOLATILITY-CHECK] Checking tariff volatility for: { hs_code: '8504.40.00', origin: 'MX', destination: 'US' }
⚠️ [VOLATILITY-RESULT] Tier determined: {
  hs_code: '8504.40.00',
  tier: 3,
  volatility: 'stable',
  bypassDatabase: false,
  reason: 'Standard tariff rates (stable)'
}
✅ [TARIFF-LOOKUP] Found rates for 8504.40.00: 1.5% MFN
{"timestamp":"2025-11-04T14:48:06.620Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"\"session_1762267613931_fvc6x15pc\"","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":248}
 POST /api/workflow-session 200 in 256ms

═══════════════════════════════════════════════════════════════
🔍 [DATABASE ENRICHMENT] getMFNRate() - Using WTO base rates:
   HS Code: 8504.40.00
   Origin: MX
   mfn_text_rate: "1.5%"
   mfn_ad_val_rate: "0.015" (parsed: 0.015)
   NOTE: Policy tariffs (Section 301, etc.) added separately

✅ [DATABASE ENRICHMENT] Enriched rates for Power Supply Unit (85W):
   mfn_rate: 0.015
   base_mfn_rate: 0.015
   section_301: 0
   section_232: 0
   usmca_rate: 0
   rate_source: tariff_intelligence_master
═══════════════════════════════════════════════════════════════

📦 [ENRICHMENT-DEBUG] After database lookup: [
  {
    description: 'Microprocessor (ARM-based)',
    hs_code: '8542.31.00',
    mfn_rate: 0,
    section_301: 0,
    rate_source: 'volatile_requires_ai',
    stale: true
  },
  {
    description: 'Power Supply Unit (85W)',
    hs_code: '8504.40.00',
    mfn_rate: 0.015,
    section_301: 0,
    rate_source: 'tariff_intelligence_master',
    stale: false
  }
]
⏳ [HYBRID] 1 components missing from database, calling AI for 2025 rates...
🔍 [HYBRID] Calling AI for 1 missing components...
[TariffResearch] 📞 API call attempt 1/3
[TariffResearch] ✅ API call succeeded on attempt 1
✅ [HYBRID] AI found rates for 8542.31.00: MFN=0, Section 301=0.25
💾 [HYBRID-SAVE] Saving 1 AI-discovered rates (split stable/volatile)...
✅ [HYBRID-SAVE] Saved stable rates 85423100 to master (permanent)
✅ [HYBRID-SAVE] Cached policy rates 85423100 (expires in 7 days)
💾 [HYBRID-SAVE] Database expanded: stable rates permanent, policy rates cached

🔍 [COMPONENT-0] Microprocessor (ARM-based) (CN)
   Trade Volume: 8500000
   Value %: 35
   Component Value: 2975000
   MFN Rate: 0
   USMCA Rate: 0
   MFN Cost: 0
   USMCA Cost: 0
   Is USMCA Member: false
   Condition (isUSMCAMember && usmca < mfn): false
   Savings Calculation (mfnCost - usmcaCost): 0
   Final Annual Savings: 0

🔍 [COMPONENT-1] Power Supply Unit (85W) (MX)
   Trade Volume: 8500000
   Value %: 65
   Component Value: 5525000
   MFN Rate: 0.015
   USMCA Rate: 0
   MFN Cost: 82875
   USMCA Cost: 0
   Is USMCA Member: true
   Condition (isUSMCAMember && usmca < mfn): true
   Savings Calculation (mfnCost - usmcaCost): 82875
   Final Annual Savings: 82875
🔍 [CACHE-CHECK] Qualification cache key: 12ece02a87a0cc92
❌ [CACHE-MISS] No cached result found, calling AI (key: 12ece02a87a0cc92)
✓ Threshold loaded for "electronics" (Electronics): { rvc: 65, labor: 0 }
[USMCAQualification] 📞 API call attempt 1/3
[USMCAQualification] ✅ API call succeeded on attempt 1
🔍 [CACHE-UPDATE] Updating existing cache session: cache-12ece02a87a0cc92
💾 [CACHE-SAVED] Updated existing cache session (key: 12ece02a87a0cc92)


═══════════════════════════════════════════════════════════════
🔍 [API RESPONSE] First component:
   description: Microprocessor (ARM-based)
   mfn_rate: 0 (type: number)
   section_301: 0.25 (type: number)
   total_rate: 0.25 (type: number)
   annual_savings: 0 (type: number)
═══════════════════════════════════════════════════════════════

{"timestamp":"2025-11-04T14:48:13.465Z","level":"INFO","message":"AI-powered USMCA analysis completed","company":"TechFlow Electronics Corp","qualified":true,"processing_time":7448}
📊 [RESPONSE-DEBUG] Tariff rates in API response: [
  {
    description: 'Microprocessor (ARM-based)',
    mfn_rate: 0,
    section_301: 0.25,
    usmca_rate: 0,
    total_rate: 0.25,
    annual_savings: 0
  },
  {
    description: 'Power Supply Unit (85W)',
    mfn_rate: 0.015,
    section_301: 0,
    usmca_rate: 0,
    total_rate: 0.015,
    annual_savings: 82875
  }
]
 POST /api/ai-usmca-complete-analysis 200 in 7873ms
{"timestamp":"2025-11-04T14:48:13.649Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"\"session_1762267613931_fvc6x15pc\"","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":156}
 POST /api/workflow-session 200 in 162ms
[WORKFLOW-COMPLETION] Failed to mark workflow as completed: invalid input syntax for type uuid: "session_1762208198360_obxo634zw"
 ✓ Compiled /api/auth/me in 64ms (230 modules)
🔐 [AUTH-ME] Session data: {
  user_id_from_session: '570206c8-b431-4936-81e8-8186ea4065f0',
  user_id_type: 'string',
  email_from_session: 'macproductions010@gmail.com'
}
📊 [AUTH-ME] Profile lookup for user 570206c8-b431-4936-81e8-8186ea4065f0 : {
  profile_found: true,
  profile_id: '570206c8-b431-4936-81e8-8186ea4065f0',
  profile_user_id: '570206c8-b431-4936-81e8-8186ea4065f0',
  profile_email: 'macproductions010@gmail.com',
  subscription_tier: 'Premium',
  trial_ends_at: null,
  profile_error: undefined,
  profile_error_code: undefined
}
 GET /api/auth/me 200 in 188ms
🔐 [AUTH-ME] Session data: {
  user_id_from_session: '570206c8-b431-4936-81e8-8186ea4065f0',
  user_id_type: 'string',
  email_from_session: 'macproductions010@gmail.com'
}
📊 [AUTH-ME] Profile lookup for user 570206c8-b431-4936-81e8-8186ea4065f0 : {
  profile_found: true,
  profile_id: '570206c8-b431-4936-81e8-8186ea4065f0',
  profile_user_id: '570206c8-b431-4936-81e8-8186ea4065f0',
  profile_email: 'macproductions010@gmail.com',
  subscription_tier: 'Premium',
  trial_ends_at: null,
  profile_error: undefined,
  profile_error_code: undefined
}
 GET /api/auth/me 200 in 130ms
