 ✓ Starting...
 ✓ Ready in 1423ms
 ○ Compiling /404 ...
 ✓ Compiled /404 in 1194ms (735 modules)
 GET /_next/static/webpack/5b518ad12a028e07.webpack.hot-update.json 404 in 1311ms
 ⚠ Fast Refresh had to perform a full reload. Read more: https://nextjs.org/docs/messages/fast-refresh-reload
(node:5496) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
 GET /usmca-workflow 200 in 1508ms
 GET /usmca-workflow 200 in 14ms
 ✓ Compiled / in 230ms (745 modules)
 GET / 200 in 299ms
 ✓ Compiled /api/auth/me in 203ms (199 modules)
 ✓ Compiled (204 modules)
🔐 [AUTH-ME] Session data: {
  user_id_from_session: 'ef58beff-a6ef-4206-9d09-848cc004497b',
  user_id_type: 'string',
  email_from_session: 'nature098@icloud.com'
}
[DROPDOWN-OPTIONS] Loaded 8 product categories from usmca_qualification_rules table
 GET /api/database-driven-dropdown-options?category=all 200 in 1145ms
📊 [AUTH-ME] Profile lookup for user ef58beff-a6ef-4206-9d09-848cc004497b : {
  profile_found: true,
  profile_id: 'ef58beff-a6ef-4206-9d09-848cc004497b',
  profile_user_id: 'ef58beff-a6ef-4206-9d09-848cc004497b',
  profile_email: 'nature098@icloud.com',
  subscription_tier: 'Premium',
  trial_ends_at: null,
  profile_error: undefined,
  profile_error_code: undefined
}
 GET /api/auth/me?t=1762804084092 200 in 1159ms
 ✓ Compiled /login in 268ms (770 modules)
 ✓ Compiled /api/auth/login in 78ms (212 modules)
ℹ️ [2025-11-10T19:48:16.879Z] [INFO] [auth_api] Login attempt {
  component: 'auth_api',
  email: 'nature098@icloud.com',
  category: 'info'
}
ℹ️ [2025-11-10T19:48:17.922Z] [INFO] [auth_api] Password verified {
  component: 'auth_api',
  email: 'nature098@icloud.com',
  category: 'info'
}
🔒 [2025-11-10T19:48:17.924Z] [WARN] [security] Successful login {
  component: 'security',
  email: 'nature098@icloud.com',
  isAdmin: false,
  subscription_tier: 'Premium',
  category: 'security'
}
 POST /api/auth/login 200 in 1163ms
 ✓ Compiled /dashboard in 200ms (782 modules)
 ✓ Compiled /api/dashboard-data in 64ms (222 modules)
📊 Dashboard Usage Check: {
  userId: 'ef58beff-a6ef-4206-9d09-848cc004497b',
  email: 'nature098@icloud.com',
  tier: 'Premium',
  analysisLimit: 500,
  briefingLimit: 750,
  executiveSummaryLimit: 500,
  source: 'monthly_usage_tracking',
  billingPeriod: '2025-11',
  analysisCount: 11,
  briefingCount: 10,
  executiveSummaryCount: 0
}
📊 [DASHBOARD] Found 8 QUALIFIED certificates for user ef58beff-a6ef-4206-9d09-848cc004497b
🤖 Dashboard alert filtering: 7/11 strategic alerts (filtered 4 non-strategic)
 GET /api/dashboard-data?t=1762804098181 200 in 2122ms
[DROPDOWN-OPTIONS] Loaded 8 product categories from usmca_qualification_rules table
 GET /api/database-driven-dropdown-options?category=all 200 in 303ms
 ✓ Compiled /api/workflow-session in 111ms (226 modules)
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
{"timestamp":"2025-11-10T19:48:55.838Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":351}
 POST /api/workflow-session 200 in 481ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 0 missing required fields in workflow-session: {
  description: 'Multilayer printed circuit board with surface-mount components, FR-4 substrate, lead-free solder',
  hasHsCode: false,
  hasOriginCountry: false
}
{"timestamp":"2025-11-10T19:49:37.067Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":325}
 POST /api/workflow-session 200 in 331ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 0 missing required fields in workflow-session: {
  description: 'Multilayer printed circuit board with surface-mount components, FR-4 substrate, lead-free solder',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-10T19:49:41.481Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":388}
 POST /api/workflow-session 200 in 395ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 0 missing required fields in workflow-session: {
  description: 'Multilayer printed circuit board with surface-mount components, FR-4 substrate, lead-free solder',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-10T19:49:43.643Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":190}
 POST /api/workflow-session 200 in 194ms
 ✓ Compiled /api/agents/classification in 210ms (216 modules)
═══════════════════════════════════════════════════
[CLASSIFICATION-DEBUG] Received workflow_session_id: session_1762804106617_ce9tgxc
[CLASSIFICATION-DEBUG] Type of workflow_session_id: string
[CLASSIFICATION-DEBUG] Authenticated user_id: ef58beff-a6ef-4206-9d09-848cc004497b
[CLASSIFICATION-DEBUG] Querying workflow_sessions table...
[CLASSIFICATION-DEBUG] Query result: {
  data: {
    session_id: 'session_1762804106617_ce9tgxc',
    user_id: 'ef58beff-a6ef-4206-9d09-848cc004497b',
    completed_at: null
  },
  error: null,
  errorCode: undefined,
  errorDetails: undefined
}
═══════════════════════════════════════════════════
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Multilayer printed circuit board with surface-mount components, FR-4 substrate, lead-free solder" (User: ef58beff-a6ef-4206-9d09-848cc004497b, Workflow: session_1762804106617_ce9tgxc, Usage: 1/500)
⚠️ Classification cache READ disabled - making fresh AI call for "Multilayer printed circuit board with su..."
🔍 Classification AI received additionalContext: {
  overallProduct: 'IoT device for home automation with touchscreen interface, Wi-Fi 6 connectivity, voice control integration, and mobile app support',
  industryContext: 'electronics',
  hasContext: true
}
⚠️ Classification cache disabled - making fresh AI classification call...
[Classification] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 2000, attempt: 1 }
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 0 missing required fields in workflow-session: {
  description: 'Multilayer printed circuit board with surface-mount components, FR-4 substrate, lead-free solder',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-10T19:49:44.380Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":146}
 POST /api/workflow-session 200 in 154ms
[Classification] 🔧 AI requested 2 tool call(s)
[Classification] 🔧 Executing tool: search_database {
  keywords: 'printed circuit board multilayer surface mount',
  chapter: '85'
}
[Classification] 🔧 Executing tool: search_database { keywords: 'PCB FR-4 substrate lead-free solder', chapter: '85' }
[Classification] 📤 Sending 2 tool results back to AI
[Classification] 📤 Tool result sample: {"tool_call_id":"toolu_bdrk_01SWsMomGz7LSmJBMYz2F5iU","role":"tool","name":"search_database","content":"{\"found\":true,\"codes\":[{\"hts8\":\"8504.40.00\",\"brief_description\":\"Electrical transform
[Classification] 📄 AI response after tools: ```json
{
  "hs_code": "8534.31.00",
  "description": "Printed circuits, multilayer, with or without electronic components assembled",
  "confidence": 92,
  "primary_material": "FR-4 substrate with copper traces, lead-free solder, surface-mount components",
  "explanation": "This multilayer PCB with surface-mount components and lead-free solder falls under Chapter 85 (Electrical machinery and equipment). Code 8534.31.00 specifically covers multilayer printed circuits, which is the most precise c
[Classification] 📋 Parsed data: {"hs_code":"8534.31.00","description":"Printed circuits, multilayer, with or without electronic components assembled","confidence":92,"primary_material":"FR-4 substrate with copper traces, lead-free solder, surface-mount components","explanation":"This multilayer PCB with surface-mount components an
[Classification] ✅ SUCCESS (with 2 tool calls) - Duration: 7079ms
⚠️ [CLASSIFICATION] Code 8534.31.00 not in database - AI generated
✓ [CLASSIFICATION CACHED] Saved "Multilayer printed circuit board with surface-mount components, FR-4 substrate, lead-free solder" → 8534.31.00
[Classification] Interaction: {
  "agent": "Classification",
  "timestamp": "2025-11-10T19:49:51.623Z",
  "prompt": "Final Product: IoT device for home automation with touchscreen interface, Wi-Fi 6 connectivity, voice control integration, and mobile app support\nIndustry: electronics\nManufacturing: PCB assembly, fir...",
  "success": true,
  "model": "anthropic/claude-haiku-4.5"
}
⚠️ CLASSIFICATION PRIORITY FIX: Highest confidence code (8534.30.00 at 85%) was not primary. Swapping with original primary (8534.31.00 at 70%). This is a criticcal fix for compliance accuracy.
[AI AGENT] Classification result: 8534.30.00 (85% confidence) [CORRECTED from 8534.31.00]
📊 [USAGE-TRACKING] Would increment classification for user ef58beff-a6ef-4206-9d09-848cc004497b (not implemented yet)
⚠️ Classification cache save DISABLED - testing AI accuracy first
 POST /api/agents/classification 200 in 8128ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 0 missing required fields in workflow-session: {
  description: 'Multilayer printed circuit board with surface-mount components, FR-4 substrate, lead-free solder',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-10T19:49:53.974Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":157}
 POST /api/workflow-session 200 in 161ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 1 missing required fields in workflow-session: { description: '', hasHsCode: false, hasOriginCountry: false }
{"timestamp":"2025-11-10T19:49:58.747Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":261}
 POST /api/workflow-session 200 in 264ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 1 missing required fields in workflow-session: {
  description: 'Die-cast aluminum housing with anodized finish, powder-coated matte black, integrated mounting brackets',
  hasHsCode: false,
  hasOriginCountry: false
}
{"timestamp":"2025-11-10T19:50:00.772Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":137}
 POST /api/workflow-session 200 in 141ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 1 missing required fields in workflow-session: {
  description: 'Die-cast aluminum housing with anodized finish, powder-coated matte black, integrated mounting brackets',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-10T19:50:04.289Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":150}
 POST /api/workflow-session 200 in 155ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 1 missing required fields in workflow-session: {
  description: 'Die-cast aluminum housing with anodized finish, powder-coated matte black, integrated mounting brackets',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-10T19:50:07.922Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":138}
 POST /api/workflow-session 200 in 141ms
═══════════════════════════════════════════════════
[CLASSIFICATION-DEBUG] Received workflow_session_id: session_1762804106617_ce9tgxc
[CLASSIFICATION-DEBUG] Type of workflow_session_id: string
[CLASSIFICATION-DEBUG] Authenticated user_id: ef58beff-a6ef-4206-9d09-848cc004497b
[CLASSIFICATION-DEBUG] Querying workflow_sessions table...
[CLASSIFICATION-DEBUG] Query result: {
  data: {
    session_id: 'session_1762804106617_ce9tgxc',
    user_id: 'ef58beff-a6ef-4206-9d09-848cc004497b',
    completed_at: null
  },
  error: null,
  errorCode: undefined,
  errorDetails: undefined
}
═══════════════════════════════════════════════════
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Die-cast aluminum housing with anodized finish, powder-coated matte black, integrated mounting brackets" (User: ef58beff-a6ef-4206-9d09-848cc004497b, Workflow: session_1762804106617_ce9tgxc, Usage: 1/500)
⚠️ Classification cache READ disabled - making fresh AI call for "Die-cast aluminum housing with anodized ..."
🔍 Classification AI received additionalContext: {
  overallProduct: 'IoT device for home automation with touchscreen interface, Wi-Fi 6 connectivity, voice control integration, and mobile app support',
  industryContext: 'electronics',
  hasContext: true
}
⚠️ Classification cache disabled - making fresh AI classification call...
[Classification] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 2000, attempt: 1 }
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 1 missing required fields in workflow-session: {
  description: 'Die-cast aluminum housing with anodized finish, powder-coated matte black, integrated mounting brackets',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-10T19:50:08.776Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":155}
 POST /api/workflow-session 200 in 160ms
[Classification] 🔧 AI requested 2 tool call(s)
[Classification] 🔧 Executing tool: search_database { keywords: 'aluminum housing', chapter: '76' }
[Classification] 🔧 Executing tool: search_database { keywords: 'die-cast aluminum enclosure', chapter: '76' }
[Classification] 📤 Sending 2 tool results back to AI
[Classification] 📤 Tool result sample: {"tool_call_id":"toolu_vrtx_01NZX3xSSM6GL87TFbToszDs","role":"tool","name":"search_database","content":"{\"found\":true,\"codes\":[{\"hts8\":\"7616.99.50\",\"brief_description\":\"Aluminum articles, n
[Classification] 📄 AI response after tools: ```json
{
  "hs_code": "7616.99.50",
  "description": "Aluminum articles, nesoi (housings)",
  "confidence": 92,
  "primary_material": "Aluminum alloy (die-cast)",
  "explanation": "Die-cast aluminum housing with anodized finish and powder-coated matte black finish is a finished aluminum article. Code 7616.99.50 specifically covers aluminum articles not elsewhere specified, including housings. The anodizing and powder coating are surface treatments that do not change the classification. The inte
[Classification] 📋 Parsed data: {"hs_code":"7616.99.50","description":"Aluminum articles, nesoi (housings)","confidence":92,"primary_material":"Aluminum alloy (die-cast)","explanation":"Die-cast aluminum housing with anodized finish and powder-coated matte black finish is a finished aluminum article. Code 7616.99.50 specifically c
[Classification] ✅ SUCCESS (with 2 tool calls) - Duration: 5065ms
⚠️ [CLASSIFICATION] Code 7616.99.50 not in database - AI generated
✓ [CLASSIFICATION CACHED] Saved "Die-cast aluminum housing with anodized finish, powder-coated matte black, integrated mounting brackets" → 7616.99.50
[Classification] Interaction: {
  "agent": "Classification",
  "timestamp": "2025-11-10T19:50:13.545Z",
  "prompt": "Final Product: IoT device for home automation with touchscreen interface, Wi-Fi 6 connectivity, voice control integration, and mobile app support\nIndustry: electronics\nManufacturing: PCB assembly, fir...",
  "success": true,
  "model": "anthropic/claude-haiku-4.5"
}
⚠️ CLASSIFICATION PRIORITY FIX: Highest confidence code (7610.10.00 at 75%) was not primary. Swapping with original primary (7616.99.50 at 70%). This is a criticcal fix for compliance accuracy.
[AI AGENT] Classification result: 7610.10.00 (75% confidence) [CORRECTED from 7616.99.50]
📊 [USAGE-TRACKING] Would increment classification for user ef58beff-a6ef-4206-9d09-848cc004497b (not implemented yet)
⚠️ Classification cache save DISABLED - testing AI accuracy first
 POST /api/agents/classification 200 in 5801ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 1 missing required fields in workflow-session: {
  description: 'Die-cast aluminum housing with anodized finish, powder-coated matte black, integrated mounting brackets',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-10T19:50:15.908Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":141}
 POST /api/workflow-session 200 in 151ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 2 missing required fields in workflow-session: { description: '', hasHsCode: false, hasOriginCountry: false }
{"timestamp":"2025-11-10T19:50:19.301Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":158}
 POST /api/workflow-session 200 in 164ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 2 missing required fields in workflow-session: {
  description: 'Capacitive touchscreen LCD display module, 7-inch diagonal, 1024x600 resolution, tempered glass surface',
  hasHsCode: false,
  hasOriginCountry: false
}
{"timestamp":"2025-11-10T19:50:26.292Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":292}
 POST /api/workflow-session 200 in 306ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 2 missing required fields in workflow-session: {
  description: 'Capacitive touchscreen LCD display module, 7-inch diagonal, 1024x600 resolution, tempered glass surface',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-10T19:50:32.072Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":274}
 POST /api/workflow-session 200 in 278ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 2 missing required fields in workflow-session: {
  description: 'Capacitive touchscreen LCD display module, 7-inch diagonal, 1024x600 resolution, tempered glass surface',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-10T19:50:44.781Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":261}
 POST /api/workflow-session 200 in 264ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 2 missing required fields in workflow-session: {
  description: 'Capacitive touchscreen LCD display module, 7-inch diagonal, 1024x600 resolution, tempered glass surface',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-10T19:50:45.984Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":161}
 POST /api/workflow-session 200 in 164ms
═══════════════════════════════════════════════════
[CLASSIFICATION-DEBUG] Received workflow_session_id: session_1762804106617_ce9tgxc
[CLASSIFICATION-DEBUG] Type of workflow_session_id: string
[CLASSIFICATION-DEBUG] Authenticated user_id: ef58beff-a6ef-4206-9d09-848cc004497b
[CLASSIFICATION-DEBUG] Querying workflow_sessions table...
[CLASSIFICATION-DEBUG] Query result: {
  data: {
    session_id: 'session_1762804106617_ce9tgxc',
    user_id: 'ef58beff-a6ef-4206-9d09-848cc004497b',
    completed_at: null
  },
  error: null,
  errorCode: undefined,
  errorDetails: undefined
}
═══════════════════════════════════════════════════
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Capacitive touchscreen LCD display module, 7-inch diagonal, 1024x600 resolution, tempered glass surface" (User: ef58beff-a6ef-4206-9d09-848cc004497b, Workflow: session_1762804106617_ce9tgxc, Usage: 1/500)
⚠️ Classification cache READ disabled - making fresh AI call for "Capacitive touchscreen LCD display modul..."
🔍 Classification AI received additionalContext: {
  overallProduct: 'IoT device for home automation with touchscreen interface, Wi-Fi 6 connectivity, voice control integration, and mobile app support',
  industryContext: 'electronics',
  hasContext: true
}
⚠️ Classification cache disabled - making fresh AI classification call...
[Classification] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 2000, attempt: 1 }
[Classification] 🔧 AI requested 3 tool call(s)
[Classification] 🔧 Executing tool: search_database { keywords: 'touchscreen LCD display module', chapter: '85' }
[Classification] 🔧 Executing tool: search_database { keywords: 'capacitive touch display', chapter: '85' }
[Classification] 🔧 Executing tool: search_database { keywords: 'LCD display panel 7 inch', chapter: '85' }
[Classification] 📤 Sending 3 tool results back to AI
[Classification] 📤 Tool result sample: {"tool_call_id":"toolu_vrtx_01TRGHrShnSyp47c9CMfTiVE","role":"tool","name":"search_database","content":"{\"found\":true,\"codes\":[{\"hts8\":\"8504.40.00\",\"brief_description\":\"Electrical transform
[Classification] 📄 AI response after tools: ```json
{
  "hs_code": "8528.72.64",
  "description": "Color television reception apparatus with flat panel screen, video display diagonal over 34.29 cm, incorporating a VCR or player",
  "confidence": 65,
  "primary_material": "Glass, LCD crystal, aluminum/plastic frame",
  "explanation": "The capacitive touchscreen LCD display module is a display component. While the database result (8528.72.64) describes television apparatus with VCR/player, this is the closest match for flat panel display te
[Classification] 📋 Parsed data: {"hs_code":"8528.72.64","description":"Color television reception apparatus with flat panel screen, video display diagonal over 34.29 cm, incorporating a VCR or player","confidence":65,"primary_material":"Glass, LCD crystal, aluminum/plastic frame","explanation":"The capacitive touchscreen LCD displ
[Classification] ✅ SUCCESS (with 3 tool calls) - Duration: 6929ms
✓ [CLASSIFICATION CACHED] Saved "Capacitive touchscreen LCD display module, 7-inch diagonal, 1024x600 resolution, tempered glass surface" → 8528.72.64
[Classification] Interaction: {
  "agent": "Classification",
  "timestamp": "2025-11-10T19:50:53.612Z",
  "prompt": "Final Product: IoT device for home automation with touchscreen interface, Wi-Fi 6 connectivity, voice control integration, and mobile app support\nIndustry: electronics\nManufacturing: PCB assembly, fir...",
  "success": true,
  "model": "anthropic/claude-haiku-4.5"
}
⚠️ CLASSIFICATION PRIORITY FIX: Highest confidence code (8534.30.00 at 75%) was not primary. Swapping with original primary (8528.72.64 at 65%). This is a criticcal fix for compliance accuracy.
[AI AGENT] Classification result: 8534.30.00 (75% confidence) [CORRECTED from 8528.72.64]
📊 [USAGE-TRACKING] Would increment classification for user ef58beff-a6ef-4206-9d09-848cc004497b (not implemented yet)
⚠️ Classification cache save DISABLED - testing AI accuracy first
 POST /api/agents/classification 200 in 7754ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
⚠️ Component 2 missing required fields in workflow-session: {
  description: 'Capacitive touchscreen LCD display module, 7-inch diagonal, 1024x600 resolution, tempered glass surface',
  hasHsCode: false,
  hasOriginCountry: true
}
{"timestamp":"2025-11-10T19:50:55.899Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":140}
 POST /api/workflow-session 200 in 143ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
{"timestamp":"2025-11-10T19:50:58.628Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":149}
 POST /api/workflow-session 200 in 155ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
{"timestamp":"2025-11-10T19:51:00.502Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":155}
 POST /api/workflow-session 200 in 159ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
{"timestamp":"2025-11-10T19:51:00.664Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":151}
 POST /api/workflow-session 200 in 156ms
 ○ Compiling /api/ai-usmca-complete-analysis ...
 ✓ Compiled /api/ai-usmca-complete-analysis in 1846ms (233 modules)
[USMCA-ANALYSIS] ✅ Limit check passed: 11/500 (will increment on workflow completion)
🔍 [VOLATILITY-CHECK] Checking tariff volatility for: { hs_code: '8534.30.00', origin: 'CN', destination: 'US' }
⚠️ [VOLATILITY-RESULT] Tier determined: {
  hs_code: '8534.30.00',
  tier: 1,
  volatility: 'super_volatile',
  bypassDatabase: false,
  reason: 'China semiconductors/electronics to USA - Section 301 + CHIPS Act restrictions (rates change monthly)'
}
🔍 [USITC API] Fetching live tariff data for HS 85343000...
❌ [USITC API] Failed to fetch tariff data for 85343000: fetch failed
ℹ️ DEV ISSUE [ERROR]: undefined - USITC API exception for HS 85343000 {}
⚠️ [USITC API] No data for 8534.30.00, falling back to database...
 ✓ Compiled /api/admin/log-dev-issue in 56ms (235 modules)
⚠️ Log endpoint missing required fields {
  issue_type: undefined,
  severity: 'error',
  component: undefined,
  message: 'USITC API exception for HS 85343000'
}
 POST /api/admin/log-dev-issue 400 in 65ms
🔍 [PREFIX-LOOKUP] Searching for 6-digit prefix: 853430%
⚠️ [HYBRID] 8534.30.00 not in tariff_intelligence_master, checking tariff_rates_cache...
⏳ [DATABASE MISS] HS code 8534.30.00 not in tariff_intelligence_master
🔬 [AI RESEARCH] Triggering AI tariff research for CN origin...
🔍 [VOLATILITY-CHECK] Checking tariff volatility for: { hs_code: '7610.10.00', origin: 'MX', destination: 'US' }
⚠️ [VOLATILITY-RESULT] Tier determined: {
  hs_code: '7610.10.00',
  tier: 1,
  volatility: 'super_volatile',
  bypassDatabase: false,
  reason: 'Steel/aluminum to USA - Section 232 rates and exemptions change by country/product'
}
🔍 [USITC API] Fetching live tariff data for HS 76101000...
❌ [USITC API] Failed to fetch tariff data for 76101000: fetch failed
ℹ️ DEV ISSUE [ERROR]: undefined - USITC API exception for HS 76101000 {}
⚠️ [USITC API] No data for 7610.10.00, falling back to database...
⚠️ Log endpoint missing required fields {
  issue_type: undefined,
  severity: 'error',
  component: undefined,
  message: 'USITC API exception for HS 76101000'
}
 POST /api/admin/log-dev-issue 400 in 5ms
✅ [TARIFF-LOOKUP] Found rates for 7610.10.00: 5.7% MFN

═══════════════════════════════════════════════════════════════
🔍 [DATABASE ENRICHMENT] getMFNRate() - Using WTO base rates:
   HS Code: 7610.10.00
   Origin: MX
   mfn_text_rate: "5.7%"
   mfn_ad_val_rate: "0.057" (parsed: 0.057)
   NOTE: Policy tariffs (Section 301, etc.) added separately

✅ [DATABASE ENRICHMENT] Enriched rates for Die-cast aluminum housing with anodized finish, powder-coated matte black, integrated mounting brackets:
   mfn_rate: 0.057
   base_mfn_rate: 0.057
   section_301: 0
   section_232: 0
   usmca_rate: 0
   rate_source: tariff_intelligence_master
═══════════════════════════════════════════════════════════════

🔍 [VOLATILITY-CHECK] Checking tariff volatility for: { hs_code: '8534.30.00', origin: 'CA', destination: 'US' }
⚠️ [VOLATILITY-RESULT] Tier determined: {
  hs_code: '8534.30.00',
  tier: 3,
  volatility: 'stable',
  bypassDatabase: false,
  reason: 'Standard tariff rates (stable)'
}
🔍 [USITC API] Fetching live tariff data for HS 85343000...
❌ [USITC API] Failed to fetch tariff data for 85343000: fetch failed
ℹ️ DEV ISSUE [ERROR]: undefined - USITC API exception for HS 85343000 {}
⚠️ [USITC API] No data for 8534.30.00, falling back to database...
⚠️ Log endpoint missing required fields {
  issue_type: undefined,
  severity: 'error',
  component: undefined,
  message: 'USITC API exception for HS 85343000'
}
 POST /api/admin/log-dev-issue 400 in 66ms
🔍 [PREFIX-LOOKUP] Searching for 6-digit prefix: 853430%
⚠️ [HYBRID] 8534.30.00 not in tariff_intelligence_master, checking tariff_rates_cache...
⏳ [DATABASE MISS] HS code 8534.30.00 not in tariff_intelligence_master
🔬 [AI RESEARCH] Triggering AI tariff research for CA origin...
📦 [ENRICHMENT-DEBUG] After database lookup: [
  {
    description: 'Multilayer printed circuit board with surface-mount components, FR-4 substrate, lead-free solder',
    hs_code: '8534.30.00',
    mfn_rate: 0,
    section_301: 0,
    rate_source: 'database_miss_needs_ai',
    stale: true
  },
  {
    description: 'Die-cast aluminum housing with anodized finish, powder-coated matte black, integrated mounting brackets',
    hs_code: '7610.10.00',
    mfn_rate: 0.057,
    section_301: 0,
    rate_source: 'tariff_intelligence_master',
    stale: false
  },
  {
    description: 'Capacitive touchscreen LCD display module, 7-inch diagonal, 1024x600 resolution, tempered glass surface',
    hs_code: '8534.30.00',
    mfn_rate: 0,
    section_301: 0,
    rate_source: 'database_miss_needs_ai',
    stale: true
  }
]
⏳ [HYBRID] 2 components missing from database, calling AI for 2025 rates...
🔍 [HYBRID] Calling AI for 2 missing components...
[TariffResearch] 📞 API call attempt 1/3
[TariffResearch] ✅ API call succeeded on attempt 1
✅ [HYBRID] AI found rates for 8534.30.00: MFN=0, Section 301=0.25
✅ [HYBRID] AI found rates for 8534.30.00: MFN=0, Section 301=0.25
💾 [HYBRID-SAVE] Saving 2 AI-discovered rates (split stable/volatile)...
⚠️ [HYBRID-SAVE] Database save DISABLED - testing AI accuracy first

🔍 [COMPONENT-0] Multilayer printed circuit board with surface-mount components, FR-4 substrate, lead-free solder (CN)
   Trade Volume: 15000000
   Value %: 45
   Component Value: 6750000
   MFN Rate: 0
   USMCA Rate: 0
   MFN Cost: 0
   USMCA Cost: 0
   Is USMCA Member: false
   Condition (isUSMCAMember && usmca < mfn): false
   Savings Calculation: 1687500

🔍 [COMPONENT-1] Die-cast aluminum housing with anodized finish, powder-coated matte black, integrated mounting brackets (MX)
   Trade Volume: 15000000
   Value %: 30
   Component Value: 4500000
   MFN Rate: 0.057
   USMCA Rate: 0
   MFN Cost: 256500
   USMCA Cost: 0
   Is USMCA Member: true
   Condition (isUSMCAMember && usmca < mfn): true
   Savings Calculation: 256500

🔍 [COMPONENT-2] Capacitive touchscreen LCD display module, 7-inch diagonal, 1024x600 resolution, tempered glass surface (CA)
   Trade Volume: 15000000
   Value %: 25
   Component Value: 3750000
   MFN Rate: 0
   USMCA Rate: 0
   MFN Cost: 0
   USMCA Cost: 0
   Is USMCA Member: true
   Condition (isUSMCAMember && usmca < mfn): false
   Savings Calculation: 937500
🔍 [CACHE-CHECK] Qualification cache key: 2bfcbc09eef4bacd
❌ [CACHE-MISS] No cached result found, calling AI (key: 2bfcbc09eef4bacd)
[THRESHOLD] AI-first lookup for HS 8534.30.00 (electronics)
[USMCA-THRESHOLD] Fetching threshold for HS 85343000 (electronics)
[USMCA-THRESHOLD] Calling AI for HS 85343000...
[USMCAThreshold] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 1500, attempt: 1 }
[USMCAThreshold] ✅ SUCCESS - Metrics: {
  openRouterCalls: 1,
  anthropicCalls: 0,
  parseErrors: 0,
  duration: '6412ms',
  provider: 'openrouter'
}
[USMCA-THRESHOLD] ✓ AI fetch successful - cached for 30 days
✓ AI threshold for HS 8534.30.00: {
  rvc: 75,
  source: 'USMCA Annex 4-B Product-Specific Rules, Chapter 85; USTR Trade Compliance Center',
  confidence: 'high'
}
[USMCAQualification] 📞 API call attempt 1/3
[USMCAQualification] ✅ API call succeeded on attempt 1
🔍 [CACHE-CREATE] Creating new cache session: cache-2bfcbc09eef4bacd
💾 [CACHE-SAVED] Created new cache session (key: 2bfcbc09eef4bacd)


═══════════════════════════════════════════════════════════════
🔍 [API RESPONSE] First component:
   description: Multilayer printed circuit board with surface-mount components, FR-4 substrate, lead-free solder
   mfn_rate: 0 (type: number)
   section_301: 0.25 (type: number)
   total_rate: 0.25 (type: number)
   annual_savings: 1687500 (type: number)
═══════════════════════════════════════════════════════════════

{"timestamp":"2025-11-10T19:51:21.504Z","level":"INFO","message":"AI-powered USMCA analysis completed","company":"TechCorp Manufacturing Inc","qualified":true,"processing_time":18919}
📊 [RESPONSE-DEBUG] Tariff rates in API response: [
  {
    description: 'Multilayer printed circuit board with surface-mount components, FR-4 substrate, lead-free solder',
    mfn_rate: 0,
    section_301: 0.25,
    usmca_rate: 0,
    total_rate: 0.25,
    annual_savings: 1687500
  },
  {
    description: 'Die-cast aluminum housing with anodized finish, powder-coated matte black, integrated mounting brackets',
    mfn_rate: 0.057,
    section_301: 0,
    usmca_rate: 0,
    total_rate: 0.057,
    annual_savings: 256500
  },
  {
    description: 'Capacitive touchscreen LCD display module, 7-inch diagonal, 1024x600 resolution, tempered glass surface',
    mfn_rate: 0,
    section_301: 0.25,
    usmca_rate: 0,
    total_rate: 0.25,
    annual_savings: 937500
  }
]
 POST /api/ai-usmca-complete-analysis 200 in 20834ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804281514_4gp5y22de
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: complete
[WORKFLOW-SESSION-DEBUG] steps_completed: 5
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: number
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? true
  - steps_completed >= 4? true
  - isCompleteWorkflow? true
✅ [WORKFLOW-SESSION-DEBUG] Saving to workflow_completions + incrementing usage counter
[USAGE-TRACKING] ✅ Analysis counted: 12/500 (Tier: Premium)
[WORKFLOW-COMPLETION] ✅ Workflow session_1762804106617_ce9tgxc marked as completed
[USAGE-TRACKING] ✅ Incremented for user ef58beff-a6ef-4206-9d09-848cc004497b: 13/500
[WORKFLOW-SESSION] ✅ Usage counter incremented for user ef58beff-a6ef-4206-9d09-848cc004497b (Premium) after workflow completion
{"timestamp":"2025-11-10T19:51:22.371Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804281514_4gp5y22de","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":841}
 POST /api/workflow-session 200 in 853ms
 ✓ Compiled /api/auth/me in 64ms (237 modules)
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
  subscription_tier: 'Premium',
  trial_ends_at: null,
  profile_error: undefined,
  profile_error_code: undefined
}
 GET /api/auth/me 200 in 204ms
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
  subscription_tier: 'Premium',
  trial_ends_at: null,
  profile_error: undefined,
  profile_error_code: undefined
}
 GET /api/auth/me 200 in 125ms
═══════════════════════════════════════════════════
[WORKFLOW-SESSION-DEBUG] POST request received
[WORKFLOW-SESSION-DEBUG] sessionId: session_1762804106617_ce9tgxc
[WORKFLOW-SESSION-DEBUG] Type of sessionId: string
[WORKFLOW-SESSION-DEBUG] userId: ef58beff-a6ef-4206-9d09-848cc004497b
[WORKFLOW-SESSION-DEBUG] action: save
[WORKFLOW-SESSION-DEBUG] steps_completed: undefined
[WORKFLOW-SESSION-DEBUG] Type of steps_completed: undefined
═══════════════════════════════════════════════════
🔍 [WORKFLOW-SESSION-DEBUG] Completion check:
  - action === "complete"? false
  - steps_completed >= 4? false
  - isCompleteWorkflow? false
⚠️ [WORKFLOW-SESSION-DEBUG] Saving to workflow_sessions with state="in_progress" (NOT incrementing counter)
{"timestamp":"2025-11-10T19:51:32.788Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1762804106617_ce9tgxc","userId":"ef58beff-a6ef-4206-9d09-848cc004497b","duration_ms":488}
 POST /api/workflow-session 200 in 511ms
