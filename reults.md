> triangle-intelligence-platform@1.0.0 dev
> next dev -p 3000 -H 0.0.0.0

  ▲ Next.js 14.2.33
  - Local:        http://localhost:3000
  - Network:      http://0.0.0.0:3000
  - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 1705ms
 ○ Compiling /dashboard ...
 ✓ Compiled /dashboard in 1070ms (598 modules)
 GET /_next/static/webpack/a97ff7cc6ffa8282.webpack.hot-update.json 404 in 1288ms
 GET /dashboard 200 in 984ms
 GET / 200 in 1390ms
 ✓ Compiled /api/auth/me in 227ms (159 modules)
 ✓ Compiled (164 modules)
(node:15772) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
🔐 [AUTH-ME] Session data: {
  user_id_from_session: '570206c8-b431-4936-81e8-8186ea4065f0',
  user_id_type: 'string',
  email_from_session: 'macproductions010@gmail.com'
}
[DROPDOWN-OPTIONS] Loaded 8 product categories from usmca_qualification_rules table
 GET /api/database-driven-dropdown-options?category=all 200 in 1065ms
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
 GET /api/auth/me?t=1762030552631 200 in 1119ms
 ✓ Compiled /login in 198ms (624 modules)
 ✓ Compiled /api/auth/login in 80ms (171 modules)
🔐 Login attempt: macproductions010@gmail.com
✅ Password verified for: macproductions010@gmail.com
✅ Login successful: macproductions010@gmail.com Admin: false
 POST /api/auth/login 200 in 958ms
 ✓ Compiled /api/dashboard-data in 61ms (177 modules)
📊 Dashboard Usage Check: {
  userId: '570206c8-b431-4936-81e8-8186ea4065f0',
  email: 'macproductions010@gmail.com',
  tier: 'Premium',
  tierLimit: null,
  source: 'monthly_usage_tracking',
  billingPeriod: '2025-11',
  permanentCount: 12
}
❌ Data Contract Violation in dashboard-data: session 013440a9-9ed0-4efd-ab4c-da702a1bf8ff:
   - Trade volume is missing in workflow_session[013440a9-9ed0-4efd-ab4c-da702a1bf8ff].trade_volume
❌ Data Contract Violation in dashboard-data: session aa8e4baa-c923-4404-ab0f-914319d721b7:
   - Trade volume is missing in workflow_session[aa8e4baa-c923-4404-ab0f-914319d721b7].trade_volume
 GET /api/dashboard-data 200 in 1427ms
 ○ Compiling /usmca-workflow ...
 ✓ Compiled /usmca-workflow in 632ms (785 modules)
 ✓ Compiled /api/workflow-session in 84ms (222 modules)
[DROPDOWN-OPTIONS] Loaded 8 product categories from usmca_qualification_rules table
 GET /api/database-driven-dropdown-options?category=all 200 in 144ms
{"timestamp":"2025-11-01T20:55:59.942Z","level":"INFO","message":"Workflow session retrieved","sessionId":"session_1761232580412_esldzctv1","duration_ms":202}
 GET /api/workflow-session?sessionId=session_1761232580412_esldzctv1 200 in 320ms
{"timestamp":"2025-11-01T20:56:09.755Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1761232580412_esldzctv1","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":430}
 POST /api/workflow-session 200 in 439ms
 ✓ Compiled /api/agents/classification in 144ms (211 modules)
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Microprocessor (ARM-based)" (User: 570206c8-b431-4936-81e8-8186ea4065f0)
🔍 Checking cache for: "microprocessor (arm-based)"
💰 Database Cache HIT for "Microprocessor (ARM-based)..." (saved ~13 seconds)
📊 [USAGE-TRACKING] Would increment classification for user 570206c8-b431-4936-81e8-8186ea4065f0 (not implemented yet)
 POST /api/agents/classification 200 in 565ms
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Electrical Connectors & Cables" (User: 570206c8-b431-4936-81e8-8186ea4065f0)
🔍 Checking cache for: "electrical connectors & cables"
⚠️ [LOW-CONFIDENCE-CACHE] Cached HS 8544.42.90 has 75% confidence < 90% - Re-triggering AI classification for better result
⏳ Database Cache MISS - Making AI call for "Electrical Connectors & Cables..."
🔍 Classification AI received additionalContext: {
  overallProduct: 'Smartphone assembly with components including microprocessor, power supply, housing, and PCB',
  industryContext: 'electronics',
  hasContext: true
}
[Classification] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 4000, attempt: 1 }
[Classification] ✅ SUCCESS - Metrics: {
  openRouterCalls: 1,
  anthropicCalls: 0,
  parseErrors: 0,
  duration: '13884ms',
  provider: 'openrouter'
}
[Classification] Interaction: {
  "agent": "Classification",
  "timestamp": "2025-11-01T20:57:57.797Z",
  "prompt": "You are an HS code classification expert specializing in COMPONENT-LEVEL classification.\n\n=== CRITICAL INSTRUCTION ===\nYou are classifying THIS SPECIFIC COMPONENT by what it IS, not by what product it...",
  "success": true,
  "confidence": 78,
  "model": "anthropic/claude-haiku-4.5"
}
[AI AGENT] Classification result: 8544.30.00 (78% confidence)
📊 [USAGE-TRACKING] Would increment classification for user 570206c8-b431-4936-81e8-8186ea4065f0 (not implemented yet)
💾 Saved/updated classification to database for "Electrical Connectors & Cables..." (8544.30.00 @ 78%) - next request will be instant!
 POST /api/agents/classification 200 in 14670ms
{"timestamp":"2025-11-01T20:58:35.976Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1761232580412_esldzctv1","userId":"570206c8-b431-4936-81e8-8186ea4065f0","duration_ms":296}
 POST /api/workflow-session 200 in 313ms
 ○ Compiling /api/ai-usmca-complete-analysis ...
 ✓ Compiled /api/ai-usmca-complete-analysis in 1895ms (227 modules)
[USAGE-TRACKING] ✅ Slot reserved for user 570206c8-b431-4936-81e8-8186ea4065f0: 13/999999
[USMCA-ANALYSIS] ✅ Slot reserved (ID: 570206c8-b431-4936-81e8-8186ea4065f0-1762030718359): 13/999999
✅ [TARIFF-LOOKUP] Found rates for 8504.40.00: 1.5% MFN

═══════════════════════════════════════════════════════════════
🔍 [DATABASE ENRICHMENT] getMFNRate() - Raw database values:
   HS Code: 8504.40.00
   Origin: MX
   Is Chinese Origin: false
   mfn_text_rate: "1.5%"
   mfn_ad_val_rate: "0.015" (parsed: 0.015)
   column_2_ad_val_rate: "null" (parsed: NaN)

✅ [DATABASE ENRICHMENT] Enriched rates for Power Supply Unit (85W):
   mfn_rate: 0.015
   base_mfn_rate: 0.015
   section_301: 0
   section_232: 0
   usmca_rate: 0
   rate_source: tariff_intelligence_master
═══════════════════════════════════════════════════════════════

✅ [TARIFF-LOOKUP] Found rates for 8517.79.00: Free MFN

═══════════════════════════════════════════════════════════════
🔍 [DATABASE ENRICHMENT] getMFNRate() - Raw database values:
   HS Code: 8517.79.00
   Origin: MX
   Is Chinese Origin: false
   mfn_text_rate: "Free"
   mfn_ad_val_rate: "0" (parsed: 0)
   column_2_ad_val_rate: "35" (parsed: 35)

✅ [DATABASE ENRICHMENT] Enriched rates for Aluminum Housing Assembly:
   mfn_rate: 0
   base_mfn_rate: 0
   section_301: 0
   section_232: 0
   usmca_rate: 0
   rate_source: tariff_intelligence_master
═══════════════════════════════════════════════════════════════

✅ [TARIFF-LOOKUP] Found rates for 8534.31.00: Free MFN

═══════════════════════════════════════════════════════════════
🔍 [DATABASE ENRICHMENT] getMFNRate() - Raw database values:
   HS Code: 8534.31.00
   Origin: CA
   Is Chinese Origin: false
   mfn_text_rate: "Free"
   mfn_ad_val_rate: "0" (parsed: 0)
   column_2_ad_val_rate: "null" (parsed: NaN)

✅ [DATABASE ENRICHMENT] Enriched rates for Printed Circuit Board (PCB):
   mfn_rate: 0
   base_mfn_rate: 0
   section_301: 0
   section_232: 0
   usmca_rate: 0
   rate_source: tariff_intelligence_master
═══════════════════════════════════════════════════════════════

✅ [TARIFF-LOOKUP] Found rates for 8542.31.00: Free MFN

═══════════════════════════════════════════════════════════════
🔍 [DATABASE ENRICHMENT] getMFNRate() - Raw database values:
   HS Code: 8542.31.00
   Origin: CN
   Is Chinese Origin: true
   mfn_text_rate: "Free"
   mfn_ad_val_rate: "0" (parsed: 0)
   column_2_ad_val_rate: "0.35" (parsed: 0.35)
   → Using Column 2 rate for China: 0.35

✅ [DATABASE ENRICHMENT] Enriched rates for Microprocessor (ARM-based):
   mfn_rate: 0.35
   base_mfn_rate: 0.35
   section_301: 0.6
   section_232: 0
   usmca_rate: 0
   rate_source: tariff_intelligence_master
═══════════════════════════════════════════════════════════════

✅ [TARIFF-LOOKUP] Found rates for 8544.30.00: 5% MFN

═══════════════════════════════════════════════════════════════
🔍 [DATABASE ENRICHMENT] getMFNRate() - Raw database values:
   HS Code: 8544.30.00
   Origin: MX
   Is Chinese Origin: false
   mfn_text_rate: "5%"
   mfn_ad_val_rate: "0.05" (parsed: 0.05)
   column_2_ad_val_rate: "30" (parsed: 30)

✅ [DATABASE ENRICHMENT] Enriched rates for Electrical Connectors & Cables:
   mfn_rate: 0.05
   base_mfn_rate: 0.05
   section_301: 0
   section_232: 0
   usmca_rate: 0
   rate_source: tariff_intelligence_master
═══════════════════════════════════════════════════════════════

📦 [ENRICHMENT-DEBUG] After database lookup: [
  {
    description: 'Power Supply Unit (85W)',
    hs_code: '8504.40.00',
    mfn_rate: 0.015,
    section_301: 0,
    rate_source: 'tariff_intelligence_master',
    stale: false
  },
  {
    description: 'Aluminum Housing Assembly',
    hs_code: '8517.79.00',
    mfn_rate: 0,
    section_301: 0,
    rate_source: 'tariff_intelligence_master',
    stale: false
  },
  {
    description: 'Printed Circuit Board (PCB)',
    hs_code: '8534.31.00',
    mfn_rate: 0,
    section_301: 0,
    rate_source: 'tariff_intelligence_master',
    stale: false
  },
  {
    description: 'Microprocessor (ARM-based)',
    hs_code: '8542.31.00',
    mfn_rate: 0.35,
    section_301: 0.6,
    rate_source: 'tariff_intelligence_master',
    stale: false
  },
  {
    description: 'Electrical Connectors & Cables',
    hs_code: '8544.30.00',
    mfn_rate: 0.05,
    section_301: 0,
    rate_source: 'tariff_intelligence_master',
    stale: false
  }
]

🔍 [COMPONENT-0] Power Supply Unit (85W) (MX)
   Trade Volume: 8500000
   Value %: 30
   Component Value: 2550000
   MFN Rate: 0.015
   USMCA Rate: 0
   MFN Cost: 38250
   USMCA Cost: 0
   Is USMCA Member: true
   Condition (isUSMCAMember && usmca < mfn): true
   Savings Calculation (mfnCost - usmcaCost): 38250
   Final Annual Savings: 38250

🔍 [COMPONENT-1] Aluminum Housing Assembly (MX)
   Trade Volume: 8500000
   Value %: 20
   Component Value: 1700000
   MFN Rate: 0
   USMCA Rate: 0
   MFN Cost: 0
   USMCA Cost: 0
   Is USMCA Member: true
   Condition (isUSMCAMember && usmca < mfn): false
   Savings Calculation (mfnCost - usmcaCost): 0
   Final Annual Savings: 0

🔍 [COMPONENT-2] Printed Circuit Board (PCB) (CA)
   Trade Volume: 8500000
   Value %: 10
   Component Value: 850000
   MFN Rate: 0
   USMCA Rate: 0
   MFN Cost: 0
   USMCA Cost: 0
   Is USMCA Member: true
   Condition (isUSMCAMember && usmca < mfn): false
   Savings Calculation (mfnCost - usmcaCost): 0
   Final Annual Savings: 0

🔍 [COMPONENT-3] Microprocessor (ARM-based) (CN)
   Trade Volume: 8500000
   Value %: 35
   Component Value: 2975000
   MFN Rate: 0.35
   USMCA Rate: 0
   MFN Cost: 1041249.9999999999
   USMCA Cost: 0
   Is USMCA Member: false
   Condition (isUSMCAMember && usmca < mfn): false
   Savings Calculation (mfnCost - usmcaCost): 1041249.9999999999
   Final Annual Savings: 0

🔍 [COMPONENT-4] Electrical Connectors & Cables (MX)
   Trade Volume: 8500000
   Value %: 5
   Component Value: 425000
   MFN Rate: 0.05
   USMCA Rate: 0
   MFN Cost: 21250
   USMCA Cost: 0
   Is USMCA Member: true
   Condition (isUSMCAMember && usmca < mfn): true
   Savings Calculation (mfnCost - usmcaCost): 21250
   Final Annual Savings: 21250
🔍 [CACHE-CHECK] Qualification cache key: cb736b1b68106520
❌ [CACHE-MISS] No cached result found, calling AI (key: cb736b1b68106520)
✓ Threshold loaded for "electronics" (Electronics): { rvc: 65, labor: 0 }
[USMCAQualification] 📞 API call attempt 1/3
[USMCAQualification] ✅ API call succeeded on attempt 1
🔍 [CACHE-CREATE] Creating new cache session: cache-cb736b1b68106520
💾 [CACHE-SAVED] Created new cache session (key: cb736b1b68106520)


═══════════════════════════════════════════════════════════════
🔍 [API RESPONSE] First component:
   description: Power Supply Unit (85W)
   mfn_rate: 0.015 (type: number)
   section_301: 0 (type: number)
   total_rate: 0.015 (type: number)
   annual_savings: 38250 (type: number)
═══════════════════════════════════════════════════════════════

{"timestamp":"2025-11-01T20:58:42.241Z","level":"INFO","message":"AI-powered USMCA analysis completed","company":"TechFlow Electronics Corp","qualified":true,"processing_time":4315}
📊 [RESPONSE-DEBUG] Tariff rates in API response: [
  {
    description: 'Power Supply Unit (85W)',
    mfn_rate: 0.015,
    section_301: 0,
    usmca_rate: 0,
    total_rate: 0.015,
    annual_savings: 38250
  },
  {
    description: 'Aluminum Housing Assembly',
    mfn_rate: 0,
    section_301: 0,
    usmca_rate: 0,
    total_rate: 0,
    annual_savings: 0
  },
  {
    description: 'Printed Circuit Board (PCB)',
    mfn_rate: 0,
    section_301: 0,
    usmca_rate: 0,
    total_rate: 0,
    annual_savings: 0
  },
  {
    description: 'Microprocessor (ARM-based)',
    mfn_rate: 0.35,
    section_301: 0.6,
    usmca_rate: 0,
    total_rate: 0.95,
    annual_savings: 0
  },
  {
    description: 'Electrical Connectors & Cables',
    mfn_rate: 0.05,
    section_301: 0,
    usmca_rate: 0,
    total_rate: 0.05,
    annual_savings: 21250
  }
]
 POST /api/ai-usmca-complete-analysis 200 in 6264ms
 ✓ Compiled /api/auth/me in 49ms (229 modules)
🔐 [AUTH-ME] Session data: {
  user_id_from_session: '570206c8-b431-4936-81e8-8186ea4065f0',
  user_id_type: 'string',
  email_from_session: 'macproductions010@gmail.com'
}
[WORKFLOW-COMPLETION] Failed to mark workflow as completed: invalid input syntax for type uuid: "session_1761232580412_esldzctv1"
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
 GET /api/auth/me 200 in 233ms
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
 GET /api/auth/me 200 in 132ms
 ✓ Compiled /api/executive-trade-alert in 102ms (202 modules)
📋 [EXECUTIVE-ALERT] Tier Check: {
  received_tier: 'Premium',
  normalized_tier: 'Premium',
  fallback_applied: false,
  is_paid: true,
  blocked_tier: 'Trial',
  allowed_tiers: [ 'Starter', 'Professional', 'Premium', 'Enterprise' ]
}
📊 Section 301 Analysis: 1/1 components with rates, effective rate: 60.0%
✓ Threshold loaded for "electronics" (Electronics): { rvc: 65, labor: 0 }
🤖 Calling AI for executive advisory...
[ExecutiveAdvisor] 📞 OpenRouter API call #1: { model: 'anthropic/claude-3.5-sonnet', max_tokens: 3000, attempt: 1 }
[ExecutiveAdvisor] ✅ SUCCESS - Metrics: {
  openRouterCalls: 1,
  anthropicCalls: 0,
  parseErrors: 0,
  duration: '28014ms',
  provider: 'openrouter'
}
✅ AI-generated executive advisory: {
  "situation_brief": "TechFlow Electronics Corp's smartphone assembly operation faces critical USMCA qualification risk due to zero RVC buffer and $1,785,000 annual Section 301 exposure on Chinese microprocessor sourcing.",
  "problem": "With exactly 65% North American content matching the minimum threshold, any supplier cost variation or USMCA requirement change could instantly disqualify TechFlow Electronics Corp from $59,500 in annual duty savings.",
  "root_cause": "Strategic reliance on Chinese microprocessor sourcing (35% of product value) creates dual vulnerability through Section 301 tariffs and minimal USMCA qualification buffer, where alternative North American suppliers could mitigate both risks.",
  "annual_impact": "Total financial exposure of $1,844,500 ($1,785,000 in Section 301 tariffs plus $59,500 in USMCA benefits at risk)",
  "why_now": "USMCA's first sunset review in 2026 may increase RVC thresholds, while escalating US-China tensions signal potential Section 301 rate increases - creating urgency for proactive supply chain restructuring.",
  "current_burden": "Section 301 duties on Chinese microprocessors cost TechFlow Electronics Corp $148,750 monthly ($1,785,000 annually), directly impacting profit margins.",
  "potential_savings": "Nearshoring to Mexican suppliers could eliminate $1,785,000 in Section 301 exposure while creating 10-15% RVC buffer, protecting $59,500 in USMCA benefits despite 2-3% higher component costs.",
  "payback_period": "Based on $8,500,000 annual trade volume, 3-6 month ROI achievable through eliminated tariffs offsetting increased Mexican sourcing costs.",
  "confidence": 90,
  "strategic_roadmap": [
    {
      "phase": "Phase 1: Supplier Qualification (Weeks 1-2)",
      "why": "Establish viable Mexican microprocessor alternatives meeting TechFlow Electronics Corp's technical specifications while maintaining USMCA qualification",
      "actions": [
        "Evaluate Intel Guadalajara and NXP Mexico City facilities for ARM-compatible processor production",
        "Document technical specifications and annual volume requirements for RFQ process"
      ],
      "impact": "Qualified supplier shortlist capable of eliminating $1,785,000 Section 301 exposure"
    },
    {
      "phase": "Phase 2: Pilot Production (Weeks 3-4)",
      "why": "Validate Mexican supplier quality and logistics while maintaining current Chinese supply chain",
      "actions": [
        "Initialize 5,000-unit test order with selected Mexican supplier",
        "Establish quality control metrics and acceptance criteria"
      ],
      "impact": "Verified production capability with 98% quality acceptance target"
    },
    {
      "phase": "Phase 3: Supply Chain Migration (Weeks 5-8)",
      "why": "Systematic transition preserving production continuity and USMCA qualification",
      "actions": [
        "Phase out Chinese inventory while ramping Mexican sourcing",
        "Update USMCA certificates reflecting new supplier origin"
      ],
      "impact": "80% RVC achievement providing 15% compliance buffer"
    }
  ],
  "action_items": [
    "Schedule supplier capability assessment with Intel Guadalajara by end of Q1 2024",
    "Prepare technical specification package for Mexican supplier RFQ process within 2 weeks",
    "Engage customs broker to pre-validate USMCA qualification impact of proposed supplier changes"
  ],
  "broker_insights": "TechFlow Electronics Corp's current USMCA qualification maintains zero margin for error. Mexican microprocessor sourcing would create substantial compliance buffer while eliminating Section 301 exposure, though requiring meticulous origin documentation during transition.",
  "professional_disclaimer": "IMPORTANT: This analysis provides strategic intelligence based on current tariff data and trade regulations. TechFlow Electronics Corp should consult with a licensed customs broker, trade attorney, or USMCA compliance specialist to verify all calculations, timelines, and regulatory requirements before implementing any strategic changes. We recommend engaging professional advisors familiar with electronics sector for implementation planning."
}
 POST /api/executive-trade-alert 200 in 28492ms
 ○ Compiling /usmca-certificate-completion ...
 ✓ Compiled /usmca-certificate-completion in 529ms (745 modules)
 ✓ Compiled /api/dashboard-data in 156ms (205 modules)
📊 Dashboard Usage Check: {
  userId: '570206c8-b431-4936-81e8-8186ea4065f0',
  email: 'macproductions010@gmail.com',
  tier: 'Premium',
  tierLimit: null,
  source: 'monthly_usage_tracking',
  billingPeriod: '2025-11',
  permanentCount: 13
}
❌ Data Contract Violation in dashboard-data: session 013440a9-9ed0-4efd-ab4c-da702a1bf8ff:
   - Trade volume is missing in workflow_session[013440a9-9ed0-4efd-ab4c-da702a1bf8ff].trade_volume
❌ Data Contract Violation in dashboard-data: session aa8e4baa-c923-4404-ab0f-914319d721b7:
   - Trade volume is missing in workflow_session[aa8e4baa-c923-4404-ab0f-914319d721b7].trade_volume
❌ Data Contract Violation in dashboard-data: session bdaccb38-421e-4b87-9e0d-8cf123191c53:
   - Trade volume is missing in workflow_session[bdaccb38-421e-4b87-9e0d-8cf123191c53].trade_volume
 GET /api/dashboard-data 200 in 1661ms
 ✓ Compiled /api/generate-certificate in 44ms (205 modules)
 POST /api/generate-certificate 200 in 54ms
 ✓ Compiled /api/workflow-session/update-certificate in 63ms (207 modules)
💾 UPDATE-CERTIFICATE REQUEST: {
  userId: '570206c8-b431-4936-81e8-8186ea4065f0',
  product_description: 'Smartphone assembly with components including microprocessor, power supply, housing, and PCB',
  hs_code: '8517622090',
  has_certificate_data: true
}
⚠️ No exact match for product_description: "Smartphone assembly with components including microprocessor, power supply, housing, and PCB"
🔍 Trying fallback: match by HS code...
🔍 No match by HS code. Getting most recent workflow for user...
❌ No workflow_completions found for this user at all
 POST /api/workflow-session/update-certificate 404 in 938ms
 ✓ Compiled /trade-risk-alternatives in 410ms (784 modules)
 ✓ Compiled /api/auth/me in 61ms (217 modules)
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
 GET /api/auth/me 200 in 526ms
 ✓ Compiled /api/workflow-session in 96ms (220 modules)
{"timestamp":"2025-11-01T21:02:05.965Z","level":"INFO","message":"Workflow session not found in database - returning null","sessionId":"570206c8-b431-4936-81e8-8186ea4065f0","userId":"570206c8-b431-4936-81e8-8186ea4065f0"}
 GET /api/workflow-session?sessionId=570206c8-b431-4936-81e8-8186ea4065f0 304 in 493ms
 ✓ Compiled /api/dashboard-data in 51ms (223 modules)
📊 Dashboard Usage Check: {
  userId: '570206c8-b431-4936-81e8-8186ea4065f0',
  email: 'macproductions010@gmail.com',
  tier: 'Premium',
  tierLimit: null,
  source: 'monthly_usage_tracking',
  billingPeriod: '2025-11',
  permanentCount: 13
}
❌ Data Contract Violation in dashboard-data: session 013440a9-9ed0-4efd-ab4c-da702a1bf8ff:
   - Trade volume is missing in workflow_session[013440a9-9ed0-4efd-ab4c-da702a1bf8ff].trade_volume
❌ Data Contract Violation in dashboard-data: session aa8e4baa-c923-4404-ab0f-914319d721b7:
   - Trade volume is missing in workflow_session[aa8e4baa-c923-4404-ab0f-914319d721b7].trade_volume
❌ Data Contract Violation in dashboard-data: session bdaccb38-421e-4b87-9e0d-8cf123191c53:
   - Trade volume is missing in workflow_session[bdaccb38-421e-4b87-9e0d-8cf123191c53].trade_volume
 GET /api/dashboard-data 200 in 1757ms
 ✓ Compiled /api/rss-monitoring-stats in 49ms (225 modules)
📊 Dashboard Usage Check: {
  userId: '570206c8-b431-4936-81e8-8186ea4065f0',
  email: 'macproductions010@gmail.com',
  tier: 'Premium',
  tierLimit: null,
  source: 'monthly_usage_tracking',
  billingPeriod: '2025-11',
  permanentCount: 13
}
❌ Data Contract Violation in dashboard-data: session 013440a9-9ed0-4efd-ab4c-da702a1bf8ff:
   - Trade volume is missing in workflow_session[013440a9-9ed0-4efd-ab4c-da702a1bf8ff].trade_volume
❌ Data Contract Violation in dashboard-data: session aa8e4baa-c923-4404-ab0f-914319d721b7:
   - Trade volume is missing in workflow_session[aa8e4baa-c923-4404-ab0f-914319d721b7].trade_volume
❌ Data Contract Violation in dashboard-data: session bdaccb38-421e-4b87-9e0d-8cf123191c53:
   - Trade volume is missing in workflow_session[bdaccb38-421e-4b87-9e0d-8cf123191c53].trade_volume
 GET /api/rss-monitoring-stats 200 in 800ms
 GET /api/dashboard-data 200 in 1234ms
 ✓ Compiled in 555ms (656 modules)
