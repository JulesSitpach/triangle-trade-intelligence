# 🔧 Admin Dashboard Troubleshooting Guide

**Last Updated:** September 30, 2025
**Platform:** Triangle Intelligence - Professional Services Dashboards
**Audience:** AI Agents, Developers, Support Team

---

## 🎯 Quick Reference

### Admin Dashboards Overview
```
Cristina's Dashboard (/admin/broker-dashboard)
├── USMCA Certificates ($250)
├── HS Classification ($200)
└── Crisis Response ($500)

Jorge's Dashboard (/admin/jorge-dashboard)
├── Supplier Sourcing ($450)
├── Manufacturing Feasibility ($650)
└── Market Entry ($550)
```

### Critical Files
```
components/cristina/
├── USMCACertificateTab.js       (Line 35-59: loadServiceRequests)
├── HSClassificationTab.js
└── CrisisResponseTab.js

components/jorge/
├── SupplierSourcingTab.js
├── ManufacturingFeasibilityTab.js
└── MarketEntryTab.js

components/shared/
└── ServiceWorkflowModal.js      (Line 11-80: Core workflow logic)

pages/api/admin/
├── service-requests.js          (GET/PATCH service requests)
└── professional-services.js     (Service management API)
```

---

## 🚨 Common Issues & Quick Fixes

### Issue #1: "No Service Requests Showing"

**Symptom:**
```
Admin dashboard loads but shows "No pending service requests" or loading spinner forever
```

**Root Causes & Fixes:**

#### A. Database Connection Failed
**Check:**
```javascript
// File: components/cristina/USMCACertificateTab.js:41
const response = await fetch('/api/admin/service-requests?assigned_to=Cristina&service_type=USMCA Certificates');
```

**Verify:**
1. Open browser DevTools → Network tab
2. Check if API call returns 200 or error
3. Look at response body

**Quick Fix:**
```bash
# Check Supabase connection in .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Test connection
curl https://your-project.supabase.co/rest/v1/
```

**Expected Response:** Should return Supabase API info

#### B. service_requests Table Missing or Wrong Schema
**Check:**
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'service_requests';
```

**Expected Columns:**
```sql
id                  UUID PRIMARY KEY
company_name        TEXT
service_type        TEXT
assigned_to         TEXT (either 'Cristina' or 'Jorge')
status              TEXT ('pending' | 'in_progress' | 'completed')
subscriber_data     JSONB
service_details     JSONB
created_at          TIMESTAMPTZ
completed_at        TIMESTAMPTZ
```

**Quick Fix - Create Table:**
```sql
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  subscriber_data JSONB NOT NULL,
  service_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add index for performance
CREATE INDEX idx_service_requests_assigned ON service_requests(assigned_to, status);
```

#### C. No Test Data Available
**Quick Fix - Create Test Service Request:**
```bash
# Visit this API endpoint in browser or curl:
curl -X POST http://localhost:3000/api/create-test-cristina-requests
```

Or manually insert via Supabase dashboard:
```sql
INSERT INTO service_requests (
  company_name,
  service_type,
  assigned_to,
  status,
  subscriber_data,
  service_details
) VALUES (
  'Test Company Inc',
  'USMCA Certificates',
  'Cristina',
  'pending',
  '{"company_name": "Test Company Inc", "product_description": "Electronic components", "trade_volume": "500k_1m"}'::jsonb,
  '{"hs_code": "8541.10", "component_origins": [{"country": "CN", "percentage": 40}, {"country": "MX", "percentage": 60}]}'::jsonb
);
```

---

### Issue #2: "Service Modal Won't Open"

**Symptom:**
```
Click "Start Service" button but modal doesn't appear
```

**Root Causes & Fixes:**

#### A. Modal State Not Updating
**Check File:** `components/cristina/USMCACertificateTab.js:61-64`
```javascript
const startWorkflow = (request) => {
  setSelectedRequest(request);
  setShowModal(true);
};
```

**Debug:**
```javascript
// Add console.log to startWorkflow
const startWorkflow = (request) => {
  console.log('🔍 Starting workflow for request:', request);
  console.log('🔍 Request data:', JSON.stringify(request, null, 2));
  setSelectedRequest(request);
  setShowModal(true);
};
```

**Check Browser Console:**
- Should see request data logged
- Check if `request` object has required fields

#### B. ServiceWorkflowModal Not Rendering
**Check File:** `components/shared/ServiceWorkflowModal.js:11`
```javascript
const ServiceWorkflowModal = ({ isOpen, service, request, onClose, onComplete }) => {
```

**Debug:**
```javascript
// Add at top of ServiceWorkflowModal component
useEffect(() => {
  console.log('🔍 Modal render:', { isOpen, hasRequest: !!request, hasService: !!service });
}, [isOpen, request, service]);
```

**Required Props:**
- `isOpen` = true
- `request` = service request object
- `service` = service configuration object

---

### Issue #3: "Stage 2 Not Opening - AI Analysis Fails"

**Symptom:**
```
Stage 1 completes but Stage 2 never loads or shows error
```

**Root Causes & Fixes:**

#### A. OpenRouter API Key Missing/Invalid
**Check:**
```bash
# In .env.local
OPENROUTER_API_KEY=sk-or-v1-...
```

**Test API Key:**
```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer sk-or-v1-YOUR-KEY-HERE"
```

**Expected Response:** List of available models

**Quick Fix:**
```bash
# Get new key from https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-new-key-here
```

#### B. API Endpoint Not Called
**Check Files:**
- `pages/api/supplier-sourcing-discovery.js` (Jorge)
- `pages/api/crisis-response-analysis.js` (Cristina)
- `pages/api/validate-hs-classification.js` (Cristina)

**Verify API Call:**
```javascript
// In ServiceWorkflowModal stage handler
console.log('🔍 Calling API:', service.apiEndpoint);
console.log('🔍 With data:', JSON.stringify(formData, null, 2));
```

**Check Network Tab:**
- Look for API call to service-specific endpoint
- Check request payload includes subscriber_data
- Check response for errors

#### C. subscriber_data Missing Required Fields
**Check:** `ServiceWorkflowModal.js:28`
```javascript
const subscriberContext = request?.subscriber_data || {};
```

**Required Fields (varies by service):**

**USMCA Certificates:**
```javascript
{
  company_name: string,
  product_description: string,
  hs_code: string,
  component_origins: [
    { country: string, percentage: number }
  ],
  trade_volume: string,
  manufacturing_location: string
}
```

**Supplier Sourcing:**
```javascript
{
  company_name: string,
  product_description: string,
  supplier_country: string (default: 'CN'),
  trade_volume: string
}
```

**Debug:**
```javascript
// Add to stage handler before API call
console.log('🔍 Subscriber context:', subscriberContext);
const missingFields = [];
if (!subscriberContext.company_name) missingFields.push('company_name');
if (!subscriberContext.product_description) missingFields.push('product_description');
if (missingFields.length > 0) {
  console.error('❌ Missing required fields:', missingFields);
}
```

---

### Issue #4: "TypeError: volume.includes is not a function"

**Symptom:**
```javascript
TypeError: volume.includes is not a function
at USMCACertificateTab.js:392
```

**Root Cause:**
`trade_volume` field is a number but code expects string

**File Location:** `components/cristina/USMCACertificateTab.js:392`

**Quick Fix:**
```javascript
// WRONG:
const volume = request.service_details?.trade_volume;
if (volume.includes('500k')) { ... }

// CORRECT:
const volume = String(request.service_details?.trade_volume || '');
if (volume.includes('500k')) { ... }
```

**Permanent Fix:**
Add type safety to all subscriber_data field access:
```javascript
const safeString = (value) => String(value || '');
const volume = safeString(request.service_details?.trade_volume);
```

---

### Issue #5: "Certificate/Report Not Generating in Stage 3"

**Symptom:**
```
Stage 3 completes but no PDF/report generated
```

**Root Causes & Fixes:**

#### A. Report Generation API Failing
**Check Files:**
```
pages/api/generate-usmca-certificate-report.js
pages/api/generate-hs-classification-report.js
pages/api/generate-crisis-response-report.js
pages/api/generate-supplier-sourcing-report.js
pages/api/generate-manufacturing-feasibility-report.js
pages/api/generate-market-entry-report.js
```

**Verify API Called:**
```javascript
// Should be called from ServiceWorkflowModal on Stage 3 completion
const reportResponse = await fetch('/api/generate-xxx-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service_request_id: request.id,
    completion_data: allStageData
  })
});
```

**Debug:**
```bash
# Check API logs
# In dev: Should see console.log in terminal
# In production: Check Vercel/platform logs
```

#### B. PDF Library Missing
**Check:**
```bash
npm list jspdf
# Should show jspdf@2.x.x or similar
```

**Quick Fix:**
```bash
npm install jspdf
```

---

## 🔍 Data Flow Architecture

### Complete Request Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│         User Completes USMCA Workflow                   │
│    /usmca-workflow (Steps 1-5)                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│         Workflow Data Captured                          │
│  formData: {                                            │
│    company_name, product_description,                   │
│    component_origins, trade_volume,                     │
│    classified_hs_code, etc.                             │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│      User Selects Professional Service                  │
│  /services/mexico-trade-services                        │
│  Clicks "$450 - Supplier Sourcing"                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│      Service Request Created in Database                │
│  Table: service_requests                                │
│  INSERT: {                                              │
│    service_type: 'Supplier Sourcing',                   │
│    assigned_to: 'Jorge',                                │
│    status: 'pending',                                   │
│    subscriber_data: formData (JSONB)                    │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│      Admin Dashboard Loads Requests                     │
│  /admin/jorge-dashboard                                 │
│  API: /api/admin/service-requests                       │
│       ?assigned_to=Jorge&service_type=Supplier Sourcing │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│      Jorge Clicks "Start Service"                       │
│  Component: SupplierSourcingTab.js:61                   │
│  Opens: ServiceWorkflowModal                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│      Stage 1: Professional Assessment                   │
│  Modal: ServiceWorkflowModal.js (Stage 1)               │
│  Jorge asks strategic questions                         │
│  Stores: stageData.stage_1 = { answers }               │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│      Stage 2: AI Analysis                               │
│  API: /api/supplier-sourcing-discovery                  │
│  OpenRouter: Claude model analysis                      │
│  Input: subscriberContext + stage_1 data               │
│  Output: Supplier recommendations                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│      Stage 3: Expert Delivery                           │
│  Jorge validates AI recommendations                     │
│  Adds professional insights                             │
│  Generates final report                                 │
│  API: /api/generate-supplier-sourcing-report            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│      Service Completion                                 │
│  UPDATE service_requests SET:                           │
│    status = 'completed',                                │
│    completion_data = { stage_1, stage_2, stage_3 },     │
│    completed_at = NOW()                                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│      Dashboard Refreshes                                │
│  Request moves from "Pending" to "Completed"            │
│  Report available for download                          │
│  Revenue tracked ($450 for Supplier Sourcing)           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 subscriber_data Structure Reference

### Complete JSONB Schema Expected by Admin Dashboards

```javascript
// From workflow completion - stored in service_requests.subscriber_data
{
  // Step 1: Company Information
  company_name: "Acme Manufacturing Inc",
  business_type: "manufacturing",
  company_address: "123 Main St, Detroit, MI 48201",
  tax_id: "12-3456789",
  contact_phone: "+1-313-555-0100",
  contact_email: "procurement@acme.com",
  trade_volume: "500k_1m", // or numeric: 750000
  supplier_country: "CN",
  manufacturing_location: "MX",
  destination_country: "US",

  // Step 2: Product Analysis
  product_description: "Automotive wire harnesses with copper connectors",
  classified_hs_code: "8544.42",
  hs_description: "Electric conductors, for voltage not exceeding 1,000V",
  classification_confidence: 0.95,

  // Step 2: Component Origins (CRITICAL for USMCA services)
  component_origins: [
    {
      origin_country: "CN",
      value_percentage: 40,
      description: "Copper electrical wire",
      component_type: "Raw materials"
    },
    {
      origin_country: "MX",
      value_percentage: 60,
      description: "Automotive connectors and assembly",
      component_type: "Assembly and manufacturing"
    }
  ],

  // Step 3: USMCA Analysis Results
  qualification_status: "QUALIFIED",
  regional_content: 60.0,
  north_american_content: 60.0,
  calculated_savings: 45000,
  annual_tariff_cost: 120000,
  potential_usmca_savings: 45000,

  // Additional metadata
  workflow_completion_date: "2025-09-30T12:00:00Z",
  certificate_generated: true,
  trust_score: 95
}
```

### Accessing subscriber_data in Components

```javascript
// CORRECT: Safe access with fallbacks
const subscriberData = request?.subscriber_data || {};
const companyName = subscriberData.company_name || 'Unknown Company';
const componentOrigins = subscriberData.component_origins || [];

// Type safety for fields that might be numbers
const tradeVolume = String(subscriberData.trade_volume || '');
const regionalContent = Number(subscriberData.regional_content || 0);

// Safe array operations
if (Array.isArray(componentOrigins) && componentOrigins.length > 0) {
  componentOrigins.map(comp => {
    // Process each component
  });
}
```

### Common subscriber_data Access Patterns

```javascript
// Pattern 1: Display company info
const {
  company_name = 'N/A',
  product_description = 'N/A',
  trade_volume = 'unknown'
} = request?.subscriber_data || {};

// Pattern 2: Component origins summary
const components = request?.subscriber_data?.component_origins || [];
const componentCount = components.length;
const usmcaContent = components
  .filter(c => ['US', 'CA', 'MX'].includes(c.origin_country))
  .reduce((sum, c) => sum + (c.value_percentage || 0), 0);

// Pattern 3: Service-specific data extraction
const extractServiceContext = (subscriberData, serviceType) => {
  const baseContext = {
    company: subscriberData.company_name,
    product: subscriberData.product_description,
    hsCode: subscriberData.classified_hs_code
  };

  switch(serviceType) {
    case 'USMCA Certificates':
      return {
        ...baseContext,
        components: subscriberData.component_origins,
        regionalContent: subscriberData.regional_content
      };

    case 'Supplier Sourcing':
      return {
        ...baseContext,
        currentSupplier: subscriberData.supplier_country,
        tradeVolume: subscriberData.trade_volume
      };

    // ... other services
  }
};
```

---

## 🛠️ Quick Diagnostic Commands

### Check Database Connection
```bash
# Test Supabase from Node.js
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
supabase.from('service_requests').select('count').then(console.log);
"
```

### Check API Endpoints
```bash
# Test service requests API
curl http://localhost:3000/api/admin/service-requests?assigned_to=Cristina

# Expected response:
# {"success":true,"requests":[...]}
```

### Check OpenRouter API
```bash
# Test AI functionality
curl -X POST http://localhost:3000/api/ai-classification \
  -H "Content-Type: application/json" \
  -d '{"product_description":"Electronic components"}'
```

### Verify Tables Exist
```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('service_requests', 'workflow_completions');
```

---

## 📊 Monitoring & Debugging

### Enable Verbose Logging

**In Admin Components:**
```javascript
// Add at component mount
useEffect(() => {
  console.log('🔍 [ADMIN DEBUG] Component mounted');
  console.log('🔍 [ADMIN DEBUG] Service requests:', serviceRequests);
}, [serviceRequests]);
```

**In ServiceWorkflowModal:**
```javascript
// Add to stage completion handler
console.log('🔍 [WORKFLOW DEBUG] Stage', currentStage, 'data:', formData);
console.log('🔍 [WORKFLOW DEBUG] Subscriber context:', subscriberContext);
```

**In API Endpoints:**
```javascript
// Add to API handlers
export default async function handler(req, res) {
  console.log('🔍 [API DEBUG]', req.url, req.method);
  console.log('🔍 [API DEBUG] Body:', JSON.stringify(req.body, null, 2));
  // ... rest of handler
}
```

### Common Error Codes

```javascript
// Database errors
PGRST116 - Table not found
PGRST204 - No rows returned (might be expected)
PGRST301 - Foreign key violation

// API errors
500 - Server error (check logs)
401 - Unauthorized (check API keys)
404 - Endpoint not found
400 - Bad request (check payload)

// OpenRouter errors
401 - Invalid API key
429 - Rate limit exceeded
500 - OpenRouter service error
```

---

## 🚀 Performance Optimization

### Lazy Load Service Components
```javascript
// Instead of:
import SupplierSourcingTab from '../jorge/SupplierSourcingTab';

// Use:
const SupplierSourcingTab = dynamic(
  () => import('../jorge/SupplierSourcingTab'),
  { loading: () => <div>Loading...</div> }
);
```

### Cache Service Requests
```javascript
// Add caching to reduce database calls
const [cachedRequests, setCachedRequests] = useState(null);
const [cacheTime, setCacheTime] = useState(null);

const loadServiceRequests = async () => {
  const now = Date.now();
  const CACHE_DURATION = 30000; // 30 seconds

  if (cachedRequests && cacheTime && (now - cacheTime < CACHE_DURATION)) {
    setServiceRequests(cachedRequests);
    return;
  }

  // Fetch from API...
  setCachedRequests(data.requests);
  setCacheTime(now);
};
```

---

## 🔐 Security Checklist

### Admin Dashboard Security
- ✅ Check authentication before loading admin pages
- ✅ Verify user has admin role
- ✅ Use service role key only in API routes (server-side)
- ✅ Never expose SUPABASE_SERVICE_ROLE_KEY to browser
- ✅ Validate all user inputs before database writes
- ✅ Sanitize subscriber_data before displaying

### API Security
```javascript
// Example: Verify admin access
export default async function handler(req, res) {
  // Check authentication
  const session = await getSession(req);
  if (!session || session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Proceed with admin operations...
}
```

---

## 📞 Escalation Path

### When to Escalate to Human

1. **Database schema changes needed** - Don't modify production schema without approval
2. **Payment integration issues** - Stripe configuration requires careful handling
3. **Security vulnerabilities found** - Report immediately, don't fix blindly
4. **Data loss or corruption** - Stop and backup before attempting fixes
5. **Repeated failures after fixes** - May indicate deeper architectural issue

### Information to Collect Before Escalating
```
□ Error message (exact text)
□ Steps to reproduce
□ Browser console logs
□ Network tab screenshots
□ Database query results (if applicable)
□ Environment (dev/production)
□ Affected service (which of the 6)
□ User impact (how many requests affected)
```

---

## ✅ Health Check Checklist

### Before Launch
```
□ All 6 service tabs load without errors
□ "Start Service" button opens modal
□ Stage 1 form displays correctly
□ Stage 2 AI analysis completes
□ Stage 3 generates report/certificate
□ Service status updates to "completed"
□ Dashboard shows updated request count
□ No console errors during workflow
□ Database has correct schema
□ OpenRouter API key works
□ Supabase connection stable
```

### Weekly Monitoring
```
□ Check service request completion rate
□ Monitor API error rates
□ Review OpenRouter usage/costs
□ Verify database performance
□ Check for failed workflows
□ Review user feedback/support tickets
```

---

## 🎓 Learning Resources

### Key Concepts to Understand

1. **JSONB in PostgreSQL** - How subscriber_data is stored
2. **React State Management** - How admin components manage data
3. **3-Stage Workflow Pattern** - Standard service delivery model
4. **OpenRouter API** - AI integration for Stage 2
5. **Supabase RLS** - Row Level Security for multi-tenant data

### Recommended Reading
- [Supabase JSONB Guide](https://supabase.com/docs/guides/database/json)
- [React Hooks Documentation](https://react.dev/reference/react)
- [OpenRouter API Docs](https://openrouter.ai/docs)

---

**Last Updated:** September 30, 2025
**Maintainer:** Triangle Intelligence Development Team
**Version:** 1.0.0

