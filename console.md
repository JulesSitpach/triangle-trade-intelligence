PS D:\bacjup\triangle-simple> npm run dev

> triangle-intelligence-platform@1.0.0 dev
> next dev -p 3000 -H 0.0.0.0

  ▲ Next.js 14.2.33
  - Local:        http://localhost:3000
  - Network:      http://0.0.0.0:3000
  - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 1533ms
 ○ Compiling / ...
 ✓ Compiled / in 526ms (375 modules)
 GET / 200 in 738ms
 ✓ Compiled /api/auth/me in 176ms (148 modules)
 ✓ Compiled (153 modules)
(node:16996) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
🔐 [AUTH-ME] Session data: {
  user_id_from_session: 'ef58beff-a6ef-4206-9d09-848cc004497b',
  user_id_type: 'string',
  email_from_session: 'nature098@icloud.com'
}
[DROPDOWN-OPTIONS] Loaded 8 product categories from usmca_qualification_rules table
📊 [AUTH-ME] Profile lookup for user ef58beff-a6ef-4206-9d09-848cc004497b : {
  profile_found: true,
  profile_id: 'ef58beff-a6ef-4206-9d09-848cc004497b',
  profile_user_id: 'ef58beff-a6ef-4206-9d09-848cc004497b',
  profile_email: 'nature098@icloud.com',
  subscription_tier: 'Starter',
  trial_ends_at: null,
  profile_error: undefined,
  profile_error_code: undefined
}
 GET /api/auth/me?t=1762623644335 200 in 1020ms
 GET /api/database-driven-dropdown-options?category=all 200 in 1024ms
 ✓ Compiled /login in 234ms (401 modules)
 ✓ Compiled /api/auth/login in 64ms (161 modules)
ℹ️ [2025-11-08T17:40:47.876Z] [INFO] [auth_api] Login attempt {
  component: 'auth_api',
  email: 'nature098@icloud.com',
  category: 'info'
}
ℹ️ [2025-11-08T17:40:48.595Z] [INFO] [auth_api] Password verified {
  component: 'auth_api',
  email: 'nature098@icloud.com',
  category: 'info'
}
🔒 [2025-11-08T17:40:48.596Z] [WARN] [security] Successful login {
  component: 'security',
  email: 'nature098@icloud.com',
  isAdmin: false,
  subscription_tier: 'Starter',
  category: 'security'
}
 POST /api/auth/login 200 in 836ms
 ✓ Compiled /dashboard in 405ms (626 modules)
 ✓ Compiled /api/dashboard-data in 76ms (177 modules)
📊 Dashboard Usage Check: {
  userId: 'ef58beff-a6ef-4206-9d09-848cc004497b',
  email: 'nature098@icloud.com',
  tier: 'Starter',
  analysisLimit: 15,
  briefingLimit: 30,
  executiveSummaryLimit: 15,
  source: 'monthly_usage_tracking',
  billingPeriod: '2025-11',
  analysisCount: 8,
  briefingCount: 5,
  executiveSummaryCount: 0
}
📊 [DASHBOARD] Found 2 QUALIFIED certificates for user ef58beff-a6ef-4206-9d09-848cc004497b
🤖 Dashboard alert filtering: 6/10 strategic alerts (filtered 4 non-strategic)
 GET /api/dashboard-data?t=1762623649057 200 in 1805ms
 ✓ Compiled /usmca-workflow in 493ms (785 modules)
[DROPDOWN-OPTIONS] Loaded 8 product categories from usmca_qualification_rules table
 GET /api/database-driven-dropdown-options?category=all 200 in 139ms
 ✓ Compiled /api/workflow-session in 134ms (203 modules)
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
{"timestamp":"2025-11-08T17:42:36.677Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":848}
 POST /api/workflow-session 200 in 1006ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 0 missing required fields in workflow-session: {
  description: 'Piezoelectric ultrasound transducer array (64-element phased array, FDA-approved ceramic crystal, titanium housing)',
  hasHsCode: false,
  hasOriginCountry: false
}
{"timestamp":"2025-11-08T17:43:19.036Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":340}
 POST /api/workflow-session 200 in 347ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 0 missing required fields in workflow-session: {
  description: 'Piezoelectric ultrasound transducer array (64-element phased array, FDA-approved ceramic crystal, titanium housing)',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-08T17:43:22.940Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":271}
 POST /api/workflow-session 200 in 284ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 0 missing required fields in workflow-session: {
  description: 'Piezoelectric ultrasound transducer array (64-element phased array, FDA-approved ceramic crystal, titanium housing)',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-08T17:43:25.147Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":190}
 POST /api/workflow-session 200 in 195ms
 ✓ Compiled /api/agents/classification in 181ms (215 modules)
═══════════════════════════════════════════════════
[CLASSIFICATION-DEBUG] Received workflow_session_id: session_1762623653153_xhpsc3s
[CLASSIFICATION-DEBUG] Type of workflow_session_id: string
[CLASSIFICATION-DEBUG] Authenticated user_id: ef58beff-a6ef-4206-9d09-848cc004497b
[CLASSIFICATION-DEBUG] Querying workflow_sessions table...
[CLASSIFICATION-DEBUG] Query result: {
  data: {
    session_id: 'session_1762623653153_xhpsc3s',
    user_id: 'ef58beff-a6ef-4206-9d09-848cc004497b',
    completed_at: null
  },
  error: null,
  errorCode: undefined,
  errorDetails: undefined
}
═══════════════════════════════════════════════════
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 0 missing required fields in workflow-session: {
  description: 'Piezoelectric ultrasound transducer array (64-element phased array, FDA-approved ceramic crystal, titanium housing)',
  hasHsCode: false,
  hasOriginCountry: true
}
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Piezoelectric ultrasound transducer array (64-element phased array, FDA-approved ceramic crystal, titanium housing)" (User: ef58beff-a6ef-4206-9d09-848cc004497b, Workflow: session_1762623653153_xhpsc3s, Usage: 1/15)
⚠️ Classification cache READ disabled - making fresh AI call for "Piezoelectric ultrasound transducer arra..."
🔍 Classification AI received additionalContext: {
  overallProduct: 'Handheld diagnostic ultrasound with wireless connectivity, real-time imaging display, cloud data storage, and FDA-cleared medical device certification',
  industryContext: 'other',
  hasContext: true
}
⚠️ Classification cache disabled - making fresh AI classification call...
[Classification] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 2000, attempt: 1 }
{"timestamp":"2025-11-08T17:43:25.990Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":322}
 POST /api/workflow-session 200 in 329ms
[Classification] ✅ SUCCESS - Metrics: {
  openRouterCalls: 1,
  anthropicCalls: 0,
  parseErrors: 0,
  duration: '21858ms',
  provider: 'openrouter'
}
✓ [CLASSIFICATION CACHED] Saved "Piezoelectric ultrasound transducer array (64-element phased array, FDA-approved ceramic crystal, titanium housing)" → 90181500
[Classification] Interaction: {
  "agent": "Classification",
  "timestamp": "2025-11-08T17:43:48.064Z",
  "prompt": "Classify this component for US customs (HS code).\n\nCOMPONENT TO CLASSIFY:\n\"Piezoelectric ultrasound transducer array (64-element phased array, FDA-approved ceramic crystal, titanium housing)\"\nOrigin: ...",
  "success": true,
  "confidence": 82,
  "model": "anthropic/claude-haiku-4.5"
}
[AI AGENT] Classification result: 90181500 (82% confidence)
📊 [USAGE-TRACKING] Would increment classification for user ef58beff-a6ef-4206-9d09-848cc004497b (not implemented yet)
⚠️ Classification cache save DISABLED - testing AI accuracy first
 POST /api/agents/classification 200 in 23061ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 0 missing required fields in workflow-session: {
  description: 'Piezoelectric ultrasound transducer array (64-element phased array, FDA-approved ceramic crystal, titanium housing)',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-08T17:43:50.432Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":177}
 POST /api/workflow-session 200 in 187ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 1 missing required fields in workflow-session: { description: '', hasHsCode: false, hasOriginCountry: false }
{"timestamp":"2025-11-08T17:43:54.400Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":173}
 POST /api/workflow-session 200 in 177ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 1 missing required fields in workflow-session: {
  description: '7-inch medical-grade OLED touchscreen display with anti-glare coating, IP65 waterproof rating, 1920x1200 resolution',
  hasHsCode: false,
  hasOriginCountry: false
}
{"timestamp":"2025-11-08T17:44:02.379Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":373}
 POST /api/workflow-session 200 in 378ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 1 missing required fields in workflow-session: {
  description: '7-inch medical-grade OLED touchscreen display with anti-glare coating, IP65 waterproof rating, 1920x1200 resolution',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-08T17:44:04.838Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":169}
 POST /api/workflow-session 200 in 178ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 1 missing required fields in workflow-session: {
  description: '7-inch medical-grade OLED touchscreen display with anti-glare coating, IP65 waterproof rating, 1920x1200 resolution',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-08T17:44:08.368Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":164}
 POST /api/workflow-session 200 in 167ms
═══════════════════════════════════════════════════
[CLASSIFICATION-DEBUG] Received workflow_session_id: session_1762623653153_xhpsc3s
[CLASSIFICATION-DEBUG] Type of workflow_session_id: string
[CLASSIFICATION-DEBUG] Authenticated user_id: ef58beff-a6ef-4206-9d09-848cc004497b
[CLASSIFICATION-DEBUG] Querying workflow_sessions table...
[CLASSIFICATION-DEBUG] Query result: {
  data: {
    session_id: 'session_1762623653153_xhpsc3s',
    user_id: 'ef58beff-a6ef-4206-9d09-848cc004497b',
    completed_at: null
  },
  error: null,
  errorCode: undefined,
  errorDetails: undefined
}
═══════════════════════════════════════════════════
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "7-inch medical-grade OLED touchscreen display with anti-glare coating, IP65 waterproof rating, 1920x1200 resolution" (User: ef58beff-a6ef-4206-9d09-848cc004497b, Workflow: session_1762623653153_xhpsc3s, Usage: 1/15)
⚠️ Classification cache READ disabled - making fresh AI call for "7-inch medical-grade OLED touchscreen di..."
🔍 Classification AI received additionalContext: {
  overallProduct: 'Handheld diagnostic ultrasound with wireless connectivity, real-time imaging display, cloud data storage, and FDA-cleared medical device certification',
  industryContext: 'other',
  hasContext: true
}
⚠️ Classification cache disabled - making fresh AI classification call...
[Classification] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 2000, attempt: 1 }
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 1 missing required fields in workflow-session: {
  description: '7-inch medical-grade OLED touchscreen display with anti-glare coating, IP65 waterproof rating, 1920x1200 resolution',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-08T17:44:09.058Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":129}
 POST /api/workflow-session 200 in 135ms
[Classification] ✅ SUCCESS - Metrics: {
  openRouterCalls: 1,
  anthropicCalls: 0,
  parseErrors: 0,
  duration: '18448ms',
  provider: 'openrouter'
}
✓ [CLASSIFICATION CACHED] Saved "7-inch medical-grade OLED touchscreen display with anti-glare coating, IP65 waterproof rating, 1920x1200 resolution" → 85437090
[Classification] Interaction: {
  "agent": "Classification",
  "timestamp": "2025-11-08T17:44:27.589Z",
  "prompt": "Classify this component for US customs (HS code).\n\nCOMPONENT TO CLASSIFY:\n\"7-inch medical-grade OLED touchscreen display with anti-glare coating, IP65 waterproof rating, 1920x1200 resolution\"\nOrigin: ...",
  "success": true,
  "confidence": 62,
  "model": "anthropic/claude-haiku-4.5"
}
[AI AGENT] Classification result: 85437090 (62% confidence)
📊 [USAGE-TRACKING] Would increment classification for user ef58beff-a6ef-4206-9d09-848cc004497b (not implemented yet)
⚠️ Classification cache save DISABLED - testing AI accuracy first
 POST /api/agents/classification 200 in 19336ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 1 missing required fields in workflow-session: {
  description: '7-inch medical-grade OLED touchscreen display with anti-glare coating, IP65 waterproof rating, 1920x1200 resolution',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-08T17:44:29.878Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":128}
 POST /api/workflow-session 200 in 131ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 2 missing required fields in workflow-session: { description: '', hasHsCode: false, hasOriginCountry: false }
{"timestamp":"2025-11-08T17:45:32.078Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":295}
 POST /api/workflow-session 200 in 305ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 2 missing required fields in workflow-session: {
  description: 'Custom medical PCB assembly with ARM Cortex processor, 4GB RAM, DICOM-compliant imaging chipset, EMI shielding',
  hasHsCode: false,
  hasOriginCountry: false
}
{"timestamp":"2025-11-08T17:45:41.908Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":305}
 POST /api/workflow-session 200 in 310ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 2 missing required fields in workflow-session: {
  description: 'Custom medical PCB assembly with ARM Cortex processor, 4GB RAM, DICOM-compliant imaging chipset, EMI shielding',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-08T17:45:46.033Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":173}
 POST /api/workflow-session 200 in 182ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 2 missing required fields in workflow-session: {
  description: 'Custom medical PCB assembly with ARM Cortex processor, 4GB RAM, DICOM-compliant imaging chipset, EMI shielding',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-08T17:45:49.479Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":163}
 POST /api/workflow-session 200 in 167ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 2 missing required fields in workflow-session: {
  description: 'Custom medical PCB assembly with ARM Cortex processor, 4GB RAM, DICOM-compliant imaging chipset, EMI shielding',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-08T17:45:49.641Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":156}
 POST /api/workflow-session 200 in 161ms
═══════════════════════════════════════════════════
[CLASSIFICATION-DEBUG] Received workflow_session_id: session_1762623653153_xhpsc3s
[CLASSIFICATION-DEBUG] Type of workflow_session_id: string
[CLASSIFICATION-DEBUG] Authenticated user_id: ef58beff-a6ef-4206-9d09-848cc004497b
[CLASSIFICATION-DEBUG] Querying workflow_sessions table...
[CLASSIFICATION-DEBUG] Query result: {
  data: {
    session_id: 'session_1762623653153_xhpsc3s',
    user_id: 'ef58beff-a6ef-4206-9d09-848cc004497b',
    completed_at: null
  },
  error: null,
  errorCode: undefined,
  errorDetails: undefined
}
═══════════════════════════════════════════════════
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Custom medical PCB assembly with ARM Cortex processor, 4GB RAM, DICOM-compliant imaging chipset, EMI shielding" (User: ef58beff-a6ef-4206-9d09-848cc004497b, Workflow: session_1762623653153_xhpsc3s, Usage: 1/15)
⚠️ Classification cache READ disabled - making fresh AI call for "Custom medical PCB assembly with ARM Cor..."
🔍 Classification AI received additionalContext: {
  overallProduct: 'Handheld diagnostic ultrasound with wireless connectivity, real-time imaging display, cloud data storage, and FDA-cleared medical device certification',
  industryContext: 'other',
  hasContext: true
}
⚠️ Classification cache disabled - making fresh AI classification call...
[Classification] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 2000, attempt: 1 }
[Classification] ✅ SUCCESS - Metrics: {
  openRouterCalls: 1,
  anthropicCalls: 0,
  parseErrors: 0,
  duration: '12924ms',
  provider: 'openrouter'
}
✓ [CLASSIFICATION CACHED] Saved "Custom medical PCB assembly with ARM Cortex processor, 4GB RAM, DICOM-compliant imaging chipset, EMI shielding" → 85471300
[Classification] Interaction: {
  "agent": "Classification",
  "timestamp": "2025-11-08T17:46:03.236Z",
  "prompt": "Classify this component for US customs (HS code).\n\nCOMPONENT TO CLASSIFY:\n\"Custom medical PCB assembly with ARM Cortex processor, 4GB RAM, DICOM-compliant imaging chipset, EMI shielding\"\nOrigin: MX\nVa...",
  "success": true,
  "confidence": 72,
  "model": "anthropic/claude-haiku-4.5"
}
[AI AGENT] Classification result: 85471300 (72% confidence)
📊 [USAGE-TRACKING] Would increment classification for user ef58beff-a6ef-4206-9d09-848cc004497b (not implemented yet)
⚠️ Classification cache save DISABLED - testing AI accuracy first
 POST /api/agents/classification 200 in 13720ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 2 missing required fields in workflow-session: {
  description: 'Custom medical PCB assembly with ARM Cortex processor, 4GB RAM, DICOM-compliant imaging chipset, EMI shielding',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-08T17:46:05.518Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":123}
 POST /api/workflow-session 200 in 128ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
{"timestamp":"2025-11-08T17:46:37.311Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":402}
 POST /api/workflow-session 200 in 407ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 3 missing required fields in workflow-session: { description: '', hasHsCode: false, hasOriginCountry: false }
{"timestamp":"2025-11-08T17:46:39.298Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":152}
 POST /api/workflow-session 200 in 159ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 3 missing required fields in workflow-session: {
  description: 'Medical-grade lithium-ion battery pack (7.4V 5200mAh, UN38.3 certified, integrated BMS protection circuit)',
  hasHsCode: false,
  hasOriginCountry: false
}
{"timestamp":"2025-11-08T17:46:48.095Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":286}
 POST /api/workflow-session 200 in 292ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 3 missing required fields in workflow-session: {
  description: 'Medical-grade lithium-ion battery pack (7.4V 5200mAh, UN38.3 certified, integrated BMS protection circuit)',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-08T17:46:52.399Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":297}
 POST /api/workflow-session 200 in 301ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 3 missing required fields in workflow-session: {
  description: 'Medical-grade lithium-ion battery pack (7.4V 5200mAh, UN38.3 certified, integrated BMS protection circuit)',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-08T17:46:55.376Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":171}
 POST /api/workflow-session 200 in 174ms
═══════════════════════════════════════════════════
[CLASSIFICATION-DEBUG] Received workflow_session_id: session_1762623653153_xhpsc3s
[CLASSIFICATION-DEBUG] Type of workflow_session_id: string
[CLASSIFICATION-DEBUG] Authenticated user_id: ef58beff-a6ef-4206-9d09-848cc004497b
[CLASSIFICATION-DEBUG] Querying workflow_sessions table...
[CLASSIFICATION-DEBUG] Query result: {
  data: {
    session_id: 'session_1762623653153_xhpsc3s',
    user_id: 'ef58beff-a6ef-4206-9d09-848cc004497b',
    completed_at: null
  },
  error: null,
  errorCode: undefined,
  errorDetails: undefined
}
═══════════════════════════════════════════════════
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Medical-grade lithium-ion battery pack (7.4V 5200mAh, UN38.3 certified, integrated BMS protection circuit)" (User: ef58beff-a6ef-4206-9d09-848cc004497b, Workflow: session_1762623653153_xhpsc3s, Usage: 1/15)
⚠️ Classification cache READ disabled - making fresh AI call for "Medical-grade lithium-ion battery pack (..."
🔍 Classification AI received additionalContext: {
  overallProduct: 'Handheld diagnostic ultrasound with wireless connectivity, real-time imaging display, cloud data storage, and FDA-cleared medical device certification',
  industryContext: 'other',
  hasContext: true
}
⚠️ Classification cache disabled - making fresh AI classification call...
[Classification] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 2000, attempt: 1 }
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 3 missing required fields in workflow-session: {
  description: 'Medical-grade lithium-ion battery pack (7.4V 5200mAh, UN38.3 certified, integrated BMS protection circuit)',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-08T17:46:55.918Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":144}
 POST /api/workflow-session 200 in 150ms
[Classification] ✅ SUCCESS - Metrics: {
  openRouterCalls: 1,
  anthropicCalls: 0,
  parseErrors: 0,
  duration: '9794ms',
  provider: 'openrouter'
}
✓ [CLASSIFICATION CACHED] Saved "Medical-grade lithium-ion battery pack (7.4V 5200mAh, UN38.3 certified, integrated BMS protection circuit)" → 85076000
[Classification] Interaction: {
  "agent": "Classification",
  "timestamp": "2025-11-08T17:47:05.768Z",
  "prompt": "Classify this component for US customs (HS code).\n\nCOMPONENT TO CLASSIFY:\n\"Medical-grade lithium-ion battery pack (7.4V 5200mAh, UN38.3 certified, integrated BMS protection circuit)\"\nOrigin: CN\nValue:...",
  "success": true,
  "confidence": 92,
  "model": "anthropic/claude-haiku-4.5"
}
[AI AGENT] Classification result: 85076000 (92% confidence)
📊 [USAGE-TRACKING] Would increment classification for user ef58beff-a6ef-4206-9d09-848cc004497b (not implemented yet)
⚠️ Classification cache save DISABLED - testing AI accuracy first
 POST /api/agents/classification 200 in 10551ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
⚠️ Component 3 missing required fields in workflow-session: {
  description: 'Medical-grade lithium-ion battery pack (7.4V 5200mAh, UN38.3 certified, integrated BMS protection circuit)',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-08T17:47:08.108Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":151}
 POST /api/workflow-session 200 in 157ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
{"timestamp":"2025-11-08T17:47:10.991Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":142}
 POST /api/workflow-session 200 in 150ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
{"timestamp":"2025-11-08T17:47:11.135Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":139}
 POST /api/workflow-session 200 in 143ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762623653153_xhpsc3s
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
═══════════════════════════════════════════════════
{"timestamp":"2025-11-08T17:47:11.298Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762623653153_xhpsc3s","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":152}
 POST /api/workflow-session 200 in 159ms
 ○ Compiling /api/ai-usmca-complete-analysis ...
 ✓ Compiled /api/ai-usmca-complete-analysis in 2.3s (232 modules)
[USMCA-ANALYSIS] ✅ Limit check passed: 8/10 (will increment on workflow completion)
🔍 [VOLATILITY-CHECK] Checking tariff volatility for: { hs_code: '90181500', origin: 'GB', destination: 'US' }
⚠️ [VOLATILITY-RESULT] Tier determined: {
  hs_code: '90181500',
  tier: 3,
  volatility: 'stable',
  bypassDatabase: false,
  reason: 'Standard tariff rates (stable)'
}
🔍 [PREFIX-LOOKUP] Searching for 6-digit prefix: 901815%
⚠️ [HYBRID] 90181500 not in tariff_intelligence_master, checking tariff_rates_cache...
⏳ Database Cache MISS for "Piezoelectric ultrasound transducer array (64-element phased array, FDA-approved ceramic crystal, titanium housing)" from GB...
🚨 [NON-USMCA] GB is NOT USMCA - rate unknown, needs AI research
🔍 [VOLATILITY-CHECK] Checking tariff volatility for: { hs_code: '85437090', origin: 'CA', destination: 'US' }
⚠️ [VOLATILITY-RESULT] Tier determined: {
  hs_code: '85437090',
  tier: 3,
  volatility: 'stable',
  bypassDatabase: false,
  reason: 'Standard tariff rates (stable)'
}
🔍 [PREFIX-LOOKUP] Searching for 6-digit prefix: 854370%
✅ [PREFIX-FALLBACK] Exact match not found, using 6-digit prefix match: 85437020

═══════════════════════════════════════════════════════════════
🔍 [DATABASE ENRICHMENT] getMFNRate() - Using WTO base rates:
   HS Code: 85437090
   Origin: CA
   mfn_text_rate: "2.5%"
   mfn_ad_val_rate: "0.025" (parsed: 0.025)
   NOTE: Policy tariffs (Section 301, etc.) added separately

✅ [DATABASE ENRICHMENT] Enriched rates for 7-inch medical-grade OLED touchscreen display with anti-glare coating, IP65 waterproof rating, 1920x1200 resolution:
   mfn_rate: 0.025
   base_mfn_rate: 0.025
   section_301: 0
   section_232: 0
   usmca_rate: 0
   rate_source: tariff_intelligence_master
═══════════════════════════════════════════════════════════════

🔍 [VOLATILITY-CHECK] Checking tariff volatility for: { hs_code: '85471300', origin: 'MX', destination: 'US' }
⚠️ [VOLATILITY-RESULT] Tier determined: {
  hs_code: '85471300',
  tier: 3,
  volatility: 'stable',
  bypassDatabase: false,
  reason: 'Standard tariff rates (stable)'
}
🔍 [PREFIX-LOOKUP] Searching for 6-digit prefix: 854713%
⚠️ [HYBRID] 85471300 not in tariff_intelligence_master, checking tariff_rates_cache...
⏳ Database Cache MISS for "Custom medical PCB assembly with ARM Cortex processor, 4GB RAM, DICOM-compliant imaging chipset, EMI shielding" from MX...
✅ [USMCA-DEFAULT] MX is USMCA member - assuming duty-free
🔍 [VOLATILITY-CHECK] Checking tariff volatility for: { hs_code: '85076000', origin: 'CN', destination: 'US' }
⚠️ [VOLATILITY-RESULT] Tier determined: {
  hs_code: '85076000',
  tier: 1,
  volatility: 'super_volatile',
  bypassDatabase: false,
  reason: 'China semiconductors/electronics to USA - Section 301 + CHIPS Act restrictions (rates change monthly)'
}
✅ [TARIFF-LOOKUP] Found rates for 85076000: 3.4% MFN

═══════════════════════════════════════════════════════════════
🔍 [DATABASE ENRICHMENT] getMFNRate() - Using WTO base rates:
   HS Code: 85076000
   Origin: CN
   mfn_text_rate: "3.4%"
   mfn_ad_val_rate: "0.034" (parsed: 0.034)
   NOTE: Policy tariffs (Section 301, etc.) added separately

✅ [DATABASE ENRICHMENT] Enriched rates for Medical-grade lithium-ion battery pack (7.4V 5200mAh, UN38.3 certified, integrated BMS protection circuit):
   mfn_rate: 0.034
   base_mfn_rate: 0.034
   section_301: 0
   section_232: 0
   usmca_rate: 0
   rate_source: tariff_intelligence_master
═══════════════════════════════════════════════════════════════

📦 [ENRICHMENT-DEBUG] After database lookup: [
  {
    description: 'Piezoelectric ultrasound transducer array (64-element phased array, FDA-approved ceramic crystal, titanium housing)',
    hs_code: '90181500',
    mfn_rate: null,
    section_301: null,
    rate_source: 'unknown_non_usmca',
    stale: true
  },
  {
    description: '7-inch medical-grade OLED touchscreen display with anti-glare coating, IP65 waterproof rating, 1920x1200 resolution',
    hs_code: '85437090',
    mfn_rate: 0.025,
    section_301: 0,
    rate_source: 'tariff_intelligence_master',
    stale: false
  },
  {
    description: 'Custom medical PCB assembly with ARM Cortex processor, 4GB RAM, DICOM-compliant imaging chipset, EMI shielding',
    hs_code: '85471300',
    mfn_rate: 0,
    section_301: 0,
    rate_source: 'default_usmca_member',
    stale: false
  },
  {
    description: 'Medical-grade lithium-ion battery pack (7.4V 5200mAh, UN38.3 certified, integrated BMS protection circuit)',
    hs_code: '85076000',
    mfn_rate: 0.034,
    section_301: 0,
    rate_source: 'tariff_intelligence_master',
    stale: false
  }
]
⏳ [HYBRID] 2 components missing from database, calling AI for 2025 rates...
🔍 [HYBRID] Calling AI for 2 missing components...
[TariffResearch] 📞 API call attempt 1/3
[TariffResearch] ✅ API call succeeded on attempt 1
✅ [HYBRID] AI found rates for 90181500: MFN=0, Section 301=0
💾 [HYBRID-SAVE] Saving 2 AI-discovered rates (split stable/volatile)...
⚠️ [HYBRID-SAVE] Database save DISABLED - testing AI accuracy first

🔍 [COMPONENT-0] Piezoelectric ultrasound transducer array (64-element phased array, FDA-approved ceramic crystal, titanium housing) (GB)
   Trade Volume: 65000000
   Value %: 45
   Component Value: 29250000
   MFN Rate: 0
   USMCA Rate: 0
   MFN Cost: 0
   USMCA Cost: 0
   Is USMCA Member: false
   Condition (isUSMCAMember && usmca < mfn): false
   Savings Calculation: 0

🔍 [COMPONENT-1] 7-inch medical-grade OLED touchscreen display with anti-glare coating, IP65 waterproof rating, 1920x1200 resolution (CA)
   Trade Volume: 65000000
   Value %: 25
   Component Value: 16250000
   MFN Rate: 0.025
   USMCA Rate: 0
   MFN Cost: 406250
   USMCA Cost: 0
   Is USMCA Member: true
   Condition (isUSMCAMember && usmca < mfn): true
   Savings Calculation: 406250

🔍 [COMPONENT-2] Custom medical PCB assembly with ARM Cortex processor, 4GB RAM, DICOM-compliant imaging chipset, EMI shielding (MX)
   Trade Volume: 65000000
   Value %: 20
   Component Value: 13000000
   MFN Rate: 0
   USMCA Rate: 0
   MFN Cost: 0
   USMCA Cost: 0
   Is USMCA Member: true
   Condition (isUSMCAMember && usmca < mfn): false
   Savings Calculation: 0

🔍 [COMPONENT-3] Medical-grade lithium-ion battery pack (7.4V 5200mAh, UN38.3 certified, integrated BMS protection circuit) (CN)
   Trade Volume: 65000000
   Value %: 10
   Component Value: 6500000
   MFN Rate: 0.034
   USMCA Rate: 0
   MFN Cost: 221000.00000000003
   USMCA Cost: 0
   Is USMCA Member: false
   Condition (isUSMCAMember && usmca < mfn): false
   Savings Calculation: 221000
🔍 [CACHE-CHECK] Qualification cache key: a9ff2faa30a7126f
❌ [CACHE-MISS] No cached result found, calling AI (key: a9ff2faa30a7126f)
[THRESHOLD] AI-first lookup for HS 90181500 (other)
[USMCA-THRESHOLD] Fetching threshold for HS 90181500 (other)
[USMCA-THRESHOLD] Cache query error: relation "public.usmca_threshold_cache" does not exist
[USMCA-THRESHOLD] Calling AI for HS 90181500...
[USMCAThreshold] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 1500, attempt: 1 }
[USMCAThreshold] ✅ SUCCESS - Metrics: {
  openRouterCalls: 1,
  anthropicCalls: 0,
  parseErrors: 0,
  duration: '6753ms',
  provider: 'openrouter'
}
[USMCA-THRESHOLD] Failed to cache threshold: undefined
[USMCA-THRESHOLD] ✓ AI fetch successful - cached for 30 days
✓ AI threshold for HS 90181500: { rvc: 60, source: 'USMCA Annex 4-B', confidence: 'medium' }
[USMCAQualification] 📞 API call attempt 1/3
[USMCAQualification] ✅ API call succeeded on attempt 1
🔍 [CACHE-CREATE] Creating new cache session: cache-a9ff2faa30a7126f
💾 [CACHE-SAVED] Created new cache session (key: a9ff2faa30a7126f)


═══════════════════════════════════════════════════════════════
🔍 [API RESPONSE] First component:
   description: Piezoelectric ultrasound transducer array (64-element phased array, FDA-approved ceramic crystal, titanium housing)
   mfn_rate: 0 (type: number)
   section_301: 0 (type: number)
   total_rate: 0 (type: number)
   annual_savings: 0 (type: number)
═══════════════════════════════════════════════════════════════

{"timestamp":"2025-11-08T17:47:30.888Z","level":"INFO","message":"AI-powered USMCA analysis completed","company":"MedTech Innovations Inc","qualified":false,"processing_time":17226}
📊 [RESPONSE-DEBUG] Tariff rates in API response: [
  {
    description: 'Piezoelectric ultrasound transducer array (64-element phased array, FDA-approved ceramic crystal, titanium housing)',
    mfn_rate: 0,
    section_301: 0,
    usmca_rate: 0,
    total_rate: 0,
    annual_savings: 0
  },
  {
    description: '7-inch medical-grade OLED touchscreen display with anti-glare coating, IP65 waterproof rating, 1920x1200 resolution',
    mfn_rate: 0.025,
    section_301: 0,
    usmca_rate: 0,
    total_rate: 0.025,
    annual_savings: 406250
  },
  {
    description: 'Custom medical PCB assembly with ARM Cortex processor, 4GB RAM, DICOM-compliant imaging chipset, EMI shielding',
    mfn_rate: 0,
    section_301: 0,
    usmca_rate: 0,
    total_rate: 0,
    annual_savings: 0
  },
  {
    description: 'Medical-grade lithium-ion battery pack (7.4V 5200mAh, UN38.3 certified, integrated BMS protection circuit)',
    mfn_rate: 0.034,
    section_301: 0,
    usmca_rate: 0,
    total_rate: 0.034,
    annual_savings: 221000
  }
]
 POST /api/ai-usmca-complete-analysis 200 in 19589ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762624050897_vk07l6w8y
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: complete
═══════════════════════════════════════════════════
[WORKFLOW-COMPLETION] ✅ Workflow session_1762623653153_xhpsc3s marked as completed
[USAGE-TRACKING] ✅ Incremented for user ef58beff-a6ef-4206-9d09-848cc004497b: 9/1
[WORKFLOW-SESSION] ✅ Usage counter incremented for user ef58beff-a6ef-4206-9d09-848cc004497b after workflow completion
{"timestamp":"2025-11-08T17:47:31.657Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762624050897_vk07l6w8y","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":748}
 POST /api/workflow-session 200 in 760ms
 ✓ Compiled /api/auth/me in 74ms (234 modules)
🔐 [AUTH-ME] Session data: {
  user_id_from_session: 'ef58beff-a6ef-4206-9d09-848cc004497b',
  user_id_type: 'string',
  email_from_session: 'nature098@icloud.com'
}
📊 [AUTH-ME] Profile lookup for user ef58beff-a6ef-4206-9d09-848cc004497b : {
  profile_found: true,
  profile_id: 'ef58beff-a6ef-4206-9d09-848cc004497b',
  profile_user_id: 'ef58beff-a6ef-4206-9d09-848cc004497b',
  profile_email: 'nature098@icloud.com',
  subscription_tier: 'Starter',
  trial_ends_at: null,
  profile_error: undefined,
  profile_error_code: undefined
}
 GET /api/auth/me 200 in 217ms
🔐 [AUTH-ME] Session data: {
  user_id_from_session: 'ef58beff-a6ef-4206-9d09-848cc004497b',
  user_id_type: 'string',
  email_from_session: 'nature098@icloud.com'
}
📊 [AUTH-ME] Profile lookup for user ef58beff-a6ef-4206-9d09-848cc004497b : {
  profile_found: true,
  profile_id: 'ef58beff-a6ef-4206-9d09-848cc004497b',
  profile_user_id: 'ef58beff-a6ef-4206-9d09-848cc004497b',
  profile_email: 'nature098@icloud.com',
  subscription_tier: 'Starter',
  trial_ends_at: null,
  profile_error: undefined,
  profile_error_code: undefined
}
 GET /api/auth/me 200 in 150ms
