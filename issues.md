 ✓ Compiled /api/auth/register in 172ms (173 modules)
🔐 Registration attempt: nature098@icloud.com
📝 Creating auth user with email confirmation...
✅ Auth user created with ID: 4ecbfb9d-6880-4701-9544-7738e949e1d7
✅ User profile created: 4ecbfb9d-6880-4701-9544-7738e949e1d7
📧 Email confirmation sent - user can login after verification
 POST /api/auth/register 201 in 15203ms
⚠️ DEV ISSUE [HIGH]: auth_api - Missing required field: triangle_session cookie {
  endpoint: '/api/auth/me',
  otherCookiesPresent: '__stripe_mid, __stripe_sid',
  suspectedIssue: 'Session cookie lost but other cookies present'
}
 GET /api/auth/me 401 in 15ms
 ✓ Compiled /api/admin/log-dev-issue in 116ms (163 modules)
🚨 DEV ISSUE LOGGED: missing_data - Missing required field: triangle_session cookie {
  endpoint: '/api/auth/me',
  otherCookiesPresent: '__stripe_mid, __stripe_sid',
  suspectedIssue: 'Session cookie lost but other cookies present'
}
 POST /api/admin/log-dev-issue 200 in 346ms
 ✓ Compiled /api/auth/login in 159ms (161 modules)
🔐 Login attempt: nature098@icloud.com
❌ Authentication failed: nature098@icloud.com Email not confirmed
⚠️ DEV ISSUE [HIGH]: auth_api - Failed login attempt - invalid credentials {
  endpoint: '/api/auth/login',
  email: 'nature098@icloud.com',
  errorMessage: 'Email not confirmed',
  attemptedAt: '2025-10-20T16:37:30.767Z'
}
 POST /api/auth/login 401 in 466ms
🚨 DEV ISSUE LOGGED: api_error - Failed login attempt - invalid credentials {
  endpoint: '/api/auth/login',
  email: 'nature098@icloud.com',
  errorMessage: 'Email not confirmed',
  attemptedAt: '2025-10-20T16:37:30.767Z'
}
 POST /api/admin/log-dev-issue 200 in 160ms
 GET /login?message=Account%20created%20successfully.%20Please%20sign%20in. 200 in 50ms
⚠️ DEV ISSUE [HIGH]: auth_api - Missing required field: triangle_session cookie {
  endpoint: '/api/auth/me',
  otherCookiesPresent: '__stripe_mid, __stripe_sid',
  suspectedIssue: 'Session cookie lost but other cookies present'
}
 GET /api/auth/me 401 in 9ms
🚨 DEV ISSUE LOGGED: missing_data - Missing required field: triangle_session cookie {
  endpoint: '/api/auth/me',
  otherCookiesPresent: '__stripe_mid, __stripe_sid',
  suspectedIssue: 'Session cookie lost but other cookies present'
}
 POST /api/admin/log-dev-issue 200 in 223ms
🔐 Login attempt: nature098@icloud.com
❌ Authentication failed: nature098@icloud.com Email not confirmed
⚠️ DEV ISSUE [HIGH]: auth_api - Failed login attempt - invalid credentials {
  endpoint: '/api/auth/login',
  email: 'nature098@icloud.com',
  errorMessage: 'Email not confirmed',
  attemptedAt: '2025-10-20T16:37:51.777Z'
}
 POST /api/auth/login 401 in 209ms
🚨 DEV ISSUE LOGGED: api_error - Failed login attempt - invalid credentials {
  endpoint: '/api/auth/login',
  email: 'nature098@icloud.com',
  errorMessage: 'Email not confirmed',
  attemptedAt: '2025-10-20T16:37:51.777Z'
}
 POST /api/admin/log-dev-issue 200 in 150ms
 GET /login?message=Account%20created%20successfully.%20Please%20sign%20in. 200 in 29ms
⚠️ DEV ISSUE [HIGH]: auth_api - Missing required field: triangle_session cookie {
  endpoint: '/api/auth/me',
  otherCookiesPresent: '__stripe_mid, __stripe_sid',
  suspectedIssue: 'Session cookie lost but other cookies present'
}
 GET /api/auth/me 401 in 6ms
🚨 DEV ISSUE LOGGED: missing_data - Missing required field: triangle_session cookie {
  endpoint: '/api/auth/me',
  otherCookiesPresent: '__stripe_mid, __stripe_sid',
  suspectedIssue: 'Session cookie lost but other cookies present'
}
 POST /api/admin/log-dev-issue 200 in 206ms
🔐 Login attempt: nature098@icloud.com
✅ Password verified for: nature098@icloud.com
✅ Login successful: nature098@icloud.com Admin: false
 POST /api/auth/login 200 in 497ms
 ○ Compiling /dashboard ...
 ✓ Compiled /dashboard in 620ms (630 modules)
 ✓ Compiled /api/dashboard-data in 72ms (178 modules)
📊 Dashboard Usage Check: {
  userId: '4ecbfb9d-6880-4701-9544-7738e949e1d7',
  email: 'nature098@icloud.com',
  tier: 'Trial',
  tierLimit: 1
}
📍 User Alert Filtering Context: {
  userId: '4ecbfb9d-6880-4701-9544-7738e949e1d7',
  userHSCodes: 0,
  userDestination: null,
  workflowCount: 0
}
 GET /api/dashboard-data 200 in 959ms
 ○ Compiling /usmca-workflow ...
 ✓ Compiled /usmca-workflow in 802ms (742 modules)
 ✓ Compiled /api/trust/trust-metrics in 90ms (201 modules)
 ✓ Compiled (211 modules)
{"timestamp":"2025-10-20T16:41:04.454Z","level":"INFO","message":"Dropdown options request","category":"all"}
 GET /api/trust/trust-metrics 200 in 203ms
{"timestamp":"2025-10-20T16:41:04.866Z","level":"INFO","message":"Business types generated from USMCA rules","totalCategories":9,"businessTypesFound":7}
{"timestamp":"2025-10-20T16:41:04.893Z","level":"INFO","message":"Performance: Dropdown options served","duration_ms":440,"category":"all","items":8}
 GET /api/database-driven-dropdown-options?category=all 200 in 636ms
{"timestamp":"2025-10-20T16:41:04.995Z","level":"INFO","message":"Workflow session not found in database - returning null","sessionId":"session_1760821723588_ip3nrnbft","userId":"4ecbfb9d-6880-4701-9544-7738e949e1d7"}
 GET /api/workflow-session?sessionId=session_1760821723588_ip3nrnbft 200 in 734ms
 ✓ Compiled in 56ms (209 modules)
 ✓ Compiled /api/admin/log-dev-issue in 187ms (195 modules)
🚨 DEV ISSUE LOGGED: api_error - Session verification failed { endpoint: '/api/auth/me' }
 POST /api/admin/log-dev-issue 200 in 876ms
🚨 DEV ISSUE LOGGED: api_error - Session verification error {
  endpoint: '/api/auth/me',
  error: 'The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received an instance of Object',
  stack: 'TypeError [ERR_INVALID_ARG_TYPE]: The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received an instance of Object\n' +
    '    at Hmac.update (node:internal/crypto/hash:115:11)\n' +
    '    at verifySession (webpack-internal:///(api)/./pages/api/auth/me.js:40:104)\n' +
    '    at handler (webpack-internal:///(api)/./pages/api/auth/me.js:111:25)\n' +
    '    at K (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\compiled\\next-server\\pages-api.runtime.dev.js:21:2877)\n' +
    '    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n' +
    '    at async U.render (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\compiled\\next-server\\pages-api.runtime.dev.js:21:3955)\n' +
    '    at async DevServer.runApi (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\next-server.js:603:9)\n' +
    '    at async NextNodeServer.handleCatchallRenderRequest (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\next-server.js:269:37)\n' +
    '    at async DevServer.handleRequestImpl (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\base-server.js:818:17)\n' +
    '    at async D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:339:20\n' +
    '    at async Span.traceAsyncFn (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\trace\\trace.js:154:20)\n' +
    '    at async DevServer.handleRequest (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:336:24)\n' +
    '    at async invokeRender (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\lib\\router-server.js:179:21)\n' +
    '    at async handleRequest (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\lib\\router-server.js:359:24)\n' +
    '    at async requestHandlerImpl (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\lib\\router-server.js:383:13)'
}
 POST /api/admin/log-dev-issue 200 in 881ms
 ✓ Compiled in 790ms (736 modules)
 ✓ Compiled /dashboard in 350ms (740 modules)
 ✓ Compiled /api/dashboard-data in 196ms (201 modules)
📊 Dashboard Usage Check: {
  userId: '4ecbfb9d-6880-4701-9544-7738e949e1d7',
  email: 'nature098@icloud.com',
  tier: 'Trial',
  tierLimit: 1
}
📍 User Alert Filtering Context: {
  userId: '4ecbfb9d-6880-4701-9544-7738e949e1d7',
  userHSCodes: 0,
  userDestination: null,
  workflowCount: 0
}
 GET /api/dashboard-data 200 in 1226ms
📊 Dashboard Usage Check: {
  userId: '4ecbfb9d-6880-4701-9544-7738e949e1d7',
  email: 'nature098@icloud.com',
  tier: 'Trial',
  tierLimit: 1
}
📍 User Alert Filtering Context: {
  userId: '4ecbfb9d-6880-4701-9544-7738e949e1d7',
  userHSCodes: 0,
  userDestination: null,
  workflowCount: 0
}
 GET /api/dashboard-data 200 in 714ms
 ✓ Compiled in 522ms (636 modules)
 ✓ Compiled /api/dashboard-data in 80ms (201 modules)
📊 Dashboard Usage Check: {
  userId: '4ecbfb9d-6880-4701-9544-7738e949e1d7',
  email: 'nature098@icloud.com',
  tier: 'Trial',
  tierLimit: 1
}
📍 User Alert Filtering Context: {
  userId: '4ecbfb9d-6880-4701-9544-7738e949e1d7',
  userHSCodes: 0,
  userDestination: null,
  workflowCount: 0
}
 GET /api/dashboard-data 200 in 1054ms
 ✓ Compiled in 513ms (656 modules)
📊 Dashboard Usage Check: {
  userId: '4ecbfb9d-6880-4701-9544-7738e949e1d7',
  email: 'nature098@icloud.com',
  tier: 'Trial',
  tierLimit: 1
}
📍 User Alert Filtering Context: {
  userId: '4ecbfb9d-6880-4701-9544-7738e949e1d7',
  userHSCodes: 0,
  userDestination: null,
  workflowCount: 0
}
 GET /api/dashboard-data 200 in 811ms
 ✓ Compiled in 279ms (656 modules)
📊 Dashboard Usage Check: {
  userId: '4ecbfb9d-6880-4701-9544-7738e949e1d7',
  email: 'nature098@icloud.com',
  tier: 'Trial',
  tierLimit: 1
}
📍 User Alert Filtering Context: {
  userId: '4ecbfb9d-6880-4701-9544-7738e949e1d7',
  userHSCodes: 0,
  userDestination: null,
  workflowCount: 0
}
 GET /api/dashboard-data 200 in 746ms
 ✓ Compiled /usmca-workflow in 165ms (740 modules)
 ✓ Compiled /api/trust/trust-metrics in 210ms (199 modules)
 ✓ Compiled (209 modules)
{"timestamp":"2025-10-20T16:54:26.678Z","level":"INFO","message":"Dropdown options request","category":"all"}
 GET /api/trust/trust-metrics 200 in 271ms
{"timestamp":"2025-10-20T16:54:27.081Z","level":"INFO","message":"Business types generated from USMCA rules","totalCategories":9,"businessTypesFound":7}
{"timestamp":"2025-10-20T16:54:27.196Z","level":"INFO","message":"Performance: Dropdown options served","duration_ms":518,"category":"all","items":8}
 GET /api/database-driven-dropdown-options?category=all 200 in 922ms
{"timestamp":"2025-10-20T16:54:27.203Z","level":"INFO","message":"Workflow session not found in database - returning null","sessionId":"session_1760821723588_ip3nrnbft","userId":"4ecbfb9d-6880-4701-9544-7738e949e1d7"}
 GET /api/workflow-session?sessionId=session_1760821723588_ip3nrnbft 304 in 918ms
{"timestamp":"2025-10-20T17:01:28.003Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"4ecbfb9d-6880-4701-9544-7738e949e1d7","duration_ms":647}
 POST /api/workflow-session 200 in 655ms
 ○ Compiling /api/agents/classification ...
 ✓ Compiled /api/agents/classification in 2.1s (202 modules)
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Steel housing" (User: anonymous)
⏳ Database Cache MISS - Making AI call for "Steel housing..."
🔍 Classification AI received additionalContext: {
  overallProduct: 'Automotive engine mount assemblies with steel housing and rubber vibration dampeners',
  industryContext: 'Exporter',
  hasContext: true
}
[Classification] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 4000, attempt: 1 }
[Classification] OpenRouter response length: 4941
[Classification] OpenRouter usage: { prompt_tokens: 1737, completion_tokens: 1246, total_tokens: 2983 }
[Classification] OpenRouter finish_reason: stop
[Classification] Raw response (first 500 chars): ```json
{
  "hsCode": "7326.90.85",
  "description": "Other articles of iron or steel",
  "confidence": 92,
  "explanation": "This component is classified as a steel article based on its material composition and construction, NOT by its end-use application in engine mount assemblies. The 'steel housing' is a structural component made of iron or steel that provides containment and protection. Per HS Chapter 73 rules, articles of iron or steel are classified by their material and form, regardless
[Classification] Raw response (last 500 chars):  in a USMCA country, OR
   - The final assembly achieves 75-85% regional value content through other USMCA-origin components

4. **Current Status:** At 60% non-USMCA origin, this component is a **drag on USMCA regional content calculations** for the final engine mount assembly.

### **Recommendation:**
Evaluate sourcing alternatives from USMCA countries (USA, Canada, Mexico) or confirm that sufficient value-adding processing will occur in USMCA territory to enable regional content qualification.
[Classification] ✅ SUCCESS - Metrics: {
  openRouterCalls: 1,
  anthropicCalls: 0,
  parseErrors: 0,
  duration: '12942ms',
  provider: 'openrouter'
}
[Classification] Interaction: {
  "agent": "Classification",
  "timestamp": "2025-10-20T17:05:13.883Z",
  "prompt": "You are an HS code classification expert specializing in COMPONENT-LEVEL classification.\n\n=== CRITICAL INSTRUCTION ===\nYou are classifying THIS SPECIFIC COMPONENT by what it IS, not by what product it...",
  "success": true,
  "confidence": 92,
  "model": "anthropic/claude-haiku-4.5"
}
[AI AGENT] Classification result: 7326.90.85 (92% confidence)
 ✓ Compiled /404 in 418ms (763 modules)
💾 Saved classification to database for "Steel housing..." - next request will be instant!
 GET /.well-known/appspecific/com.chrome.devtools.json 404 in 480ms
 POST /api/agents/classification 200 in 16312ms
 ✓ Compiled /login in 128ms (765 modules)
 GET /login?message=Please%20check%20your%20email%20to%20verify%20your%20account 200 in 190ms
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Rubber vibration dampeners" (User: anonymous)
⏳ Database Cache MISS - Making AI call for "Rubber vibration dampeners..."
🔍 Classification AI received additionalContext: {
  overallProduct: 'Automotive engine mount assemblies with steel housing and rubber vibration dampeners',
  industryContext: 'Exporter',
  hasContext: true
}
[Classification] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 4000, attempt: 1 }
[Classification] OpenRouter response length: 3802
[Classification] OpenRouter usage: { prompt_tokens: 1830, completion_tokens: 1016, total_tokens: 2846 }
[Classification] OpenRouter finish_reason: stop
[Classification] Raw response (first 500 chars): ```json
{
  "hsCode": "4016.93.10",
  "description": "Articles of unhardened vulcanized rubber other than hard rubber, not elsewhere specified or included; Gaskets, washers and other seals",
  "confidence": 92,
  "explanation": "Rubber vibration dampeners are classified by their MATERIAL COMPOSITION (rubber) and FUNCTIONAL DESIGN (elastomeric damping elements), not by their end-use application in automotive engine mounts. This component falls under Chapter 40 (Rubber and articles thereof). HS 40
[Classification] Raw response (last 500 chars): 0% of product value, contributes meaningfully to USMCA regional content threshold

---

## **CONFIDENCE ASSESSMENT:**

**92/100** - High confidence based on:
- ✅ Clear material identification (rubber/elastomer)
- ✅ Chapter 40 is the correct material-based classification
- ✅ HS 4016.93.10 is specifically designed for elastomeric damping/sealing articles
- ✅ Strong USMCA country origin
- ⚠️ Minor uncertainty only regarding exact sub-classification between 4016.93.10 vs 4016.99.90 (both defensible)
[Classification] ✅ SUCCESS - Metrics: {
  openRouterCalls: 1,
  anthropicCalls: 0,
  parseErrors: 0,
  duration: '13644ms',
  provider: 'openrouter'
}
[Classification] Interaction: {
  "agent": "Classification",
  "timestamp": "2025-10-20T17:06:19.511Z",
  "prompt": "You are an HS code classification expert specializing in COMPONENT-LEVEL classification.\n\n=== CRITICAL INSTRUCTION ===\nYou are classifying THIS SPECIFIC COMPONENT by what it IS, not by what product it...",
  "success": true,
  "confidence": 92,
  "model": "anthropic/claude-haiku-4.5"
}
[AI AGENT] Classification result: 4016.93.10 (92% confidence)
💾 Saved classification to database for "Rubber vibration dampeners..." - next request will be instant!
 POST /api/agents/classification 200 in 14205ms
[SUBSCRIPTION-AWARE AGENT] suggest_hs_code request for: "Mounting bolts and hardware" (User: anonymous)
⏳ Database Cache MISS - Making AI call for "Mounting bolts and hardware..."
🔍 Classification AI received additionalContext: {
  overallProduct: 'Automotive engine mount assemblies with steel housing and rubber vibration dampeners',
  industryContext: 'Exporter',
  hasContext: true
}
[Classification] 📞 OpenRouter API call #1: { model: 'anthropic/claude-haiku-4.5', max_tokens: 4000, attempt: 1 }
[Classification] OpenRouter response length: 3549
[Classification] OpenRouter usage: { prompt_tokens: 1859, completion_tokens: 966, total_tokens: 2825 }
[Classification] OpenRouter finish_reason: stop
[Classification] Raw response (first 500 chars): ```json
{
  "hsCode": "7308.90.60",
  "description": "Other structures and parts of structures, of iron or steel; plates, rods, angles, shapes and sections of iron or steel, further worked than as mentioned in note 1 to this chapter; rivets of iron or steel - Other",
  "confidence": 75,
  "explanation": "⚠️ The component description lacks clarity about the specific type and material composition of the 'mounting bolts and hardware'. To improve accuracy, specify: (1) whether boltts are steel, stain
[Classification] Raw response (last 500 chars): * (if primarily bolts) **OR HS 7308.90.60** (if mixed hardware)

**Why not 7326.90.85?** Already assigned to steel housing; fasteners merit their own specific HS code for proper tariff treatment.

**USMCA Status:** ✅ **US-origin component qualifies for regional value content** if final assembled product meets USMCA rules of origin thresholds.

**Next Step:** Request supplier documentation specifying bolt types, grades, and hardware composition to refine classification confidence from 75% → 90%+.
[Classification] ✅ SUCCESS - Metrics: {
  openRouterCalls: 1,
  anthropicCalls: 0,
  parseErrors: 0,
  duration: '9954ms',
  provider: 'openrouter'
}
[Classification] Interaction: {
  "agent": "Classification",
  "timestamp": "2025-10-20T17:07:12.032Z",
  "prompt": "You are an HS code classification expert specializing in COMPONENT-LEVEL classification.\n\n=== CRITICAL INSTRUCTION ===\nYou are classifying THIS SPECIFIC COMPONENT by what it IS, not by what product it...",
  "success": true,
  "confidence": 75,
  "model": "anthropic/claude-haiku-4.5"
}
[AI AGENT] Classification result: 7308.90.60 (75% confidence)
💾 Saved classification to database for "Mounting bolts and hardware..." - next request will be instant!
 POST /api/agents/classification 200 in 10459ms
 ✓ Compiled /api/workflow-session in 54ms (210 modules)
{"timestamp":"2025-10-20T17:07:25.673Z","level":"INFO","message":"Workflow session saved successfully","sessionId":"session_1760821723588_ip3nrnbft","userId":"4ecbfb9d-6880-4701-9544-7738e949e1d7","duration_ms":218}
 POST /api/workflow-session 200 in 293ms
 ○ Compiling /api/ai-usmca-complete-analysis ...
 ✓ Compiled /api/ai-usmca-complete-analysis in 1977ms (216 modules)
🤖 ========== AI-POWERED USMCA ANALYSIS: START ==========
📥 Received request: {
  company: 'AutoParts USA Inc',
  business_type: 'Exporter',
  product: 'Automotive engine mount assemblies with steel housing and rubber vibration dampeners',
  component_count: 3
}
✅ Usage check passed: 0/1 (1 remaining)
✅ Component percentage validation passed: 100%
📊 Fetching actual tariff rates for all components...
🗄️ Checking database cache (US: 1 days expiration)...
  ✅ DB Cache HIT: 7326.90.85 from CN → US (18h old)
💰 Cache Summary: 1 DB hits, 0 memory hits, 2 misses (AI call needed)
🎯 TIER 2 (OpenRouter): Making AI call...
✅ OpenRouter SUCCESS
💾 Saving 2 AI tariff rates to database (dest: US)...
✅ AI returned rates for 2 components → US (cached + saved to DB)
✅ Got tariff rates for 3 components (dest: US)
{"timestamp":"2025-10-20T17:07:38.234Z","level":"ERROR","message":"AI-powered USMCA analysis failed","error":"totalNAContent is not defined","stack":"ReferenceError: totalNAContent is not defined\n    at buildComprehensiveUSMCAPrompt (webpack-internal:///(api)/./pages/api/ai-usmca-complete-analysis.js:698:35)\n    at POST (webpack-internal:///(api)/./pages/api/ai-usmca-complete-analysis.js:225:34)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async eval (webpack-internal:///(api)/./lib/api/apiHandler.js:46:20)\n    at async K (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\compiled\\next-server\\pages-api.runtime.dev.js:21:2871)\n    at async U.render (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\compiled\\next-server\\pages-api.runtime.dev.js:21:3955)\n    at async DevServer.runApi (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\next-server.js:603:9)\n    at async NextNodeServer.handleCatchallRenderRequest (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\next-server.js:269:37)\n    at async DevServer.handleRequestImpl (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\base-server.js:818:17)\n    at async D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:339:20\n    at async Span.traceAsyncFn (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\trace\\trace.js:154:20)\n    at async DevServer.handleRequest (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:336:24)\n    at async invokeRender (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\lib\\router-server.js:179:21)\n    at async handleRequest (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\lib\\router-server.js:359:24)\n    at async requestHandlerImpl (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\lib\\router-server.js:383:13)","processing_time":10549}
🚨 DEV ISSUE [CRITICAL]: usmca_analysis - API call failed: /api/ai-usmca-complete-analysis - totalNAContent is not defined {
  userId: '4ecbfb9d-6880-4701-9544-7738e949e1d7',
  company: 'AutoParts USA Inc',
  processing_time: 10549,
  error: 'totalNAContent is not defined',
  stack: 'ReferenceError: totalNAContent is not defined\n' +
    '    at buildComprehensiveUSMCAPrompt (webpack-internal:///(api)/./pages/api/ai-usmca-complete-analysis.js:698:35)\n' +
    '    at POST (webpack-internal:///(api)/./pages/api/ai-usmca-complete-analysis.js:225:34)\n' +
    '    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n' +
    '    at async eval (webpack-internal:///(api)/./lib/api/apiHandler.js:46:20)\n' +
    '    at async K (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\compiled\\next-server\\pages-api.runtime.dev.js:21:2871)\n' +
    '    at async U.render (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\compiled\\next-server\\pages-api.runtime.dev.js:21:3955)\n' +
    '    at async DevServer.runApi (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\next-server.js:603:9)\n' +
    '    at async NextNodeServer.handleCatchallRenderRequest (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\next-server.js:269:37)\n' +
    '    at async DevServer.handleRequestImpl (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\base-server.js:818:17)\n' +
    '    at async D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:339:20\n' +
    '    at async Span.traceAsyncFn (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\trace\\trace.js:154:20)\n' +
    '    at async DevServer.handleRequest (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:336:24)\n' +
    '    at async invokeRender (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\lib\\router-server.js:179:21)\n' +
    '    at async handleRequest (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\lib\\router-server.js:359:24)\n' +
    '    at async requestHandlerImpl (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\lib\\router-server.js:383:13)'
}
 POST /api/ai-usmca-complete-analysis 500 in 12554ms
 ✓ Compiled /api/admin/log-dev-issue in 136ms (218 modules)
✅ Successfully saved 2 AI tariff rates to database → US
🚨 DEV ISSUE LOGGED: api_error - Complete workflow processing failed {
  error: 'Workflow processing failed: 500 Internal Server Error',
  stack: 'Error: Workflow processing failed: 500 Internal Server Error\n' +
    '    at WorkflowService.processCompleteWorkflow (webpack-internal:///./lib/services/workflow-service.js:243:23)\n' +
    '    at async eval (webpack-internal:///./hooks/useWorkflowState.js:306:36)\n' +
    '    at async handleProcessStep2 (webpack-internal:///./components/workflow/USMCAWorkflowOrchestrator.js:213:9)',
  processing_time: 12557,
  company_name: 'AutoParts USA Inc',
  business_type: 'Exporter',
  endpoint: '/api/ai-usmca-complete-analysis'
}
 POST /api/admin/log-dev-issue 200 in 338ms
🚨 DEV ISSUE LOGGED: api_error - API call failed: /api/ai-usmca-complete-analysis - totalNAContent is not defined {
  userId: '4ecbfb9d-6880-4701-9544-7738e949e1d7',
  company: 'AutoParts USA Inc',
  processing_time: 10549,
  error: 'totalNAContent is not defined',
  stack: 'ReferenceError: totalNAContent is not defined\n' +
    '    at buildComprehensiveUSMCAPrompt (webpack-internal:///(api)/./pages/api/ai-usmca-complete-analysis.js:698:35)\n' +
    '    at POST (webpack-internal:///(api)/./pages/api/ai-usmca-complete-analysis.js:225:34)\n' +
    '    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n' +
    '    at async eval (webpack-internal:///(api)/./lib/api/apiHandler.js:46:20)\n' +
    '    at async K (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\compiled\\next-server\\pages-api.runtime.dev.js:21:2871)\n' +
    '    at async U.render (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\compiled\\next-server\\pages-api.runtime.dev.js:21:3955)\n' +
    '    at async DevServer.runApi (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\next-server.js:603:9)\n' +
    '    at async NextNodeServer.handleCatchallRenderRequest (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\next-server.js:269:37)\n' +
    '    at async DevServer.handleRequestImpl (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\base-server.js:818:17)\n' +
    '    at async D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:339:20\n' +
    '    at async Span.traceAsyncFn (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\trace\\trace.js:154:20)\n' +
    '    at async DevServer.handleRequest (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:336:24)\n' +
    '    at async invokeRender (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\lib\\router-server.js:179:21)\n' +
    '    at async handleRequest (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\lib\\router-server.js:359:24)\n' +
    '    at async requestHandlerImpl (D:\\bacjup\\triangle-simple\\node_modules\\next\\dist\\server\\lib\\router-server.js:383:13)'
}
 POST /api/admin/log-dev-issue 200 in 360ms
 ✓ Compiled /404 in 160ms (779 modules)
 GET /.well-known/appspecific/com.chrome.devtools.json 404 in 238ms
 ✓ Compiled /login in 177ms (781 modules)
 GET /login?message=Please%20check%20your%20email%20to%20verify%20your%20account 200 in 226ms
