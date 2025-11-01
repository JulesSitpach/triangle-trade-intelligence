# Workflow Save Architecture (Nov 1, 2025)

## Overview
The USMCA workflow now has **multiple save points** to ensure zero data loss. Data is saved at critical points throughout the user journey.

---

## 📍 Complete Save Timeline

### STEP 1: Company Information
**Component:** `CompanyInformationStep.js`
**Save Point:** When user clicks "Continue to Components"
**What Gets Saved:**
- Company name, country, address
- Business type, industry sector
- Destination country (US/CA/MX)
- Trade volume, contact info
- Manufacturing location

**Database:** `workflow_sessions` table
**Code:** Line 96 in CompanyInformationStep.js
```javascript
await saveWorkflowToDatabase(); // Save before proceeding
onNext(); // Then move to Step 2
```
**Status:** ✅ Implemented & Working

---

### STEP 2: Component Origins (Multiple Saves)
**Component:** `ComponentOriginsStepEnhanced.js`

#### Save Point #2A: Auto-Save (Debounced)
**When:** After each component field change (2-second debounce)
**What Gets Saved:** All component data (description, origin, %, HS code, tariff rates)
**Purpose:** Prevent data loss if browser crashes during component editing
**Code:** Lines 164-198 in ComponentOriginsStepEnhanced.js
```javascript
// 💾 AUTO-SAVE: Debounced auto-save to database when components change
useEffect(() => {
  // Auto-save triggers 2 seconds after last change
  autoSaveTimeoutRef.current = setTimeout(async () => {
    await saveWorkflowToDatabase();
  }, 2000);
}, [components, saveWorkflowToDatabase, formData.company_name]);
```
**Status:** ✅ New (Nov 1, 2025)

#### Save Point #2B: Explicit Save Before Analysis
**When:** User clicks "Continue to USMCA Analysis" button
**What Gets Saved:** Final component data before processing
**Purpose:** Ensure components are persisted before expensive AI tariff analysis
**Code:** Lines 561-567 in ComponentOriginsStepEnhanced.js
```javascript
// 💾 NEW: Save component data to database before processing workflow
if (saveWorkflowToDatabase) {
  console.log('💾 Saving component data to database before analysis...');
  await saveWorkflowToDatabase();
}
onProcessWorkflow();
```
**Status:** ✅ New (Nov 1, 2025)

---

### STEP 3: USMCA Analysis (Processing)
**Component:** `USMCAWorkflowOrchestrator.js`
**Save Point:** Before calling AI analysis
**What Gets Saved:** Company + component data
**Database:** `workflow_sessions` table
**Code:** Lines 219-228 in USMCAWorkflowOrchestrator.js
```javascript
// ✅ Save component data to database before processing (1 save instead of 150+)
await saveWorkflowToDatabase();

// Call the workflow processing and wait for results
await processWorkflow();
```
**Status:** ✅ Implemented & Working

---

### STEP 3.5: Results Display + Alerts
**Component:** `WorkflowResults.js`
**Save Point #1:** When user clicks "Set Up Alerts"
**What Gets Saved:**
- Complete workflow results with enriched component data
- USMCA qualification status
- Tariff rates and savings
- All enrichment metadata (HS codes, tariff sources, etc.)

**Destinations:**
- `localStorage` key: `usmca_workflow_results` (immediate access)
- Database: Fetched via `/api/dashboard-data` when loading alerts page

**Code:** Lines 233-243 in WorkflowResults.js
```javascript
// Save to localStorage for alerts page
localStorage.setItem('usmca_workflow_results', JSON.stringify(alertData));

// Navigate to trade-risk-alternatives page
window.location.href = '/trade-risk-alternatives';
```
**Status:** ✅ Implemented & Working

---

### STEP 4: Certificate Generation
**Component:** `CertificateSection.js`
**Save Point:** After PDF generation
**What Gets Saved:**
- Certificate metadata (number, dates, certification type)
- All certificate fields (exporter, importer, product, components)
- Authorization information

**Database:** `workflow_sessions.data` → `certificates` field
**API Endpoint:** `POST /api/workflow-session/update-certificate`
**Code:** Lines 109-128 in CertificateSection.js
```javascript
// Save certificate to database
const saveResponse = await fetch('/api/workflow-session/update-certificate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    product_description: results.product?.description || '',
    hs_code: results.product?.hs_code || '',
    certificate_data: certificateData,
    certificate_generated: true
  })
});
```
**Status:** ✅ Implemented & Working

---

### STEP 5: Complete Workflow Data Capture (Certificate Download)
**Component:** `USMCAWorkflowOrchestrator.js`
**Save Point:** When user downloads certificate
**What Gets Saved:** Complete 4-step workflow capture
**Service:** `WorkflowDataConnector` (lines 282-356)

**Step-by-step capture:**
```javascript
// Step 1: Company Data
await dataConnector.captureWorkflowStep({
  company_name: formData.company_name,
  business_type: formData.business_type,
  trade_volume: formData.trade_volume,
  manufacturing_location: formData.manufacturing_location
}, 1, sessionId);

// Step 2: Product Analysis
await dataConnector.captureWorkflowStep({
  product_description: formData.product_description,
  classified_hs_code: formData.classified_hs_code,
  component_origins: formData.component_origins
}, 2, sessionId);

// Step 3: USMCA Results
await dataConnector.captureWorkflowStep({
  qualification_status: formData.qualification_status,
  north_american_content: getTotalComponentPercentage(),
  component_origins: formData.component_origins
}, 3, sessionId);

// Step 4: Certificate Generation
await dataConnector.captureWorkflowStep({
  certificate_number: `USMCA-${Date.now()}`,
  signatory_name: authorizationData.signatory_name,
  pdf_generated: true
}, 4, sessionId);
```

**Purpose:**
- Business Intelligence for admin dashboards
- Revenue opportunity tracking for sales team
- Audit trail for compliance

**Status:** ✅ Implemented & Working

---

## 📊 Save Point Summary

| Step | Save Point | Trigger | Destination | Status |
|------|-----------|---------|-------------|--------|
| 1 | Company Info | Click "Continue" | Database | ✅ Working |
| 2 | Auto-Save | Every field change (2s debounce) | Database | ✅ NEW |
| 2 | Before Analysis | Click "Continue to USMCA Analysis" | Database | ✅ NEW |
| 3 | Before Processing | Process workflow starts | Database | ✅ Working |
| 3.5 | Alerts Setup | Click "Set Up Alerts" | localStorage + Database | ✅ Working |
| 4 | Certificate | After PDF generation | Database | ✅ Working |
| 5 | Workflow Completion | Certificate download | Database (via WorkflowDataConnector) | ✅ Working |

---

## 🛡️ Data Loss Prevention

### Mechanisms in Place

1. **Multi-Layer Persistence**
   - `localStorage` for immediate page access (fast)
   - `workflow_sessions` table for persistent storage (reliable)
   - `workflow_completions` table for audit trail (compliance)

2. **Auto-Save Debouncing**
   - Component changes trigger save after 2-second delay
   - Prevents excessive database writes
   - Only saves if data actually changed
   - Clears timeout if user navigates away

3. **Explicit Save Points**
   - Before expensive operations (AI analysis, certificate generation)
   - Before navigation (alerts dashboard)
   - Required field validation before proceeding

4. **Graceful Failure Handling**
   - Database save failures don't block user operations
   - Browser localStorage always available as fallback
   - Error logged to `dev_issues` table for monitoring

---

## 🔍 Verification Checklist

To verify all saves are working:

1. **Step 1 Save**
   - Fill company info
   - Open DevTools Console
   - Should see: `✅ Workflow saved to database (sync metadata stripped)`
   - Check Database: `workflow_sessions` has 1 new row

2. **Step 2 Auto-Save**
   - Add first component
   - Edit any field (description, origin, %)
   - Wait 2 seconds
   - Console should show: `💾 Auto-saving component data (Step 2)...`
   - Then: `✅ Component data auto-saved to database`

3. **Step 2 Explicit Save**
   - Click "Continue to USMCA Analysis"
   - Console should show: `💾 Saving component data to database before analysis...`

4. **Step 3 Processing Save**
   - Console shows workflow processing
   - Results display when processing complete

5. **Step 3.5 Alerts Save**
   - Click "Set Up Alerts"
   - localStorage key `usmca_workflow_results` created
   - Navigate to `/trade-risk-alternatives`
   - Alerts page loads with component data

6. **Step 4 Certificate Save**
   - Click certificate download button
   - Console shows PDF generation
   - Then: `✅ Certificate saved to database`

7. **Step 5 Workflow Capture**
   - Certificate download completes
   - Console shows WorkflowDataConnector capturing all steps

---

## 🚀 Benefits

### For Users
- **Zero data loss**: Multiple save points ensure work is never lost
- **Offline recovery**: Can refresh browser and resume where they left off
- **Better UX**: Auto-save happens silently without interruption
- **Progress visibility**: Console logs show save status

### For Business
- **Business Intelligence**: Complete audit trail of all workflows
- **Revenue tracking**: Sales team can see qualified vs. unqualified products
- **Compliance**: All certifications logged for regulatory requirements
- **Analytics**: Track conversion funnel from company info to certificate

---

## 🔧 Maintenance

### Adding New Save Points
When adding new workflow steps:

1. Call `saveWorkflowToDatabase()` before expensive operations
2. Use debouncing for frequent changes (≥2s delay)
3. Add explicit save before navigation
4. Log save operations to console
5. Test both success and failure cases

### Monitoring
Check these files for save-related errors:
- Browser DevTools Console (client-side)
- `dev_issues` table (server-side)
- Vercel logs (deployment)

---

## 📝 Code References

### Key Files
- `ComponentOriginsStepEnhanced.js` - Auto-save implementation (lines 164-198)
- `CompanyInformationStep.js` - Step 1 save (line 96)
- `USMCAWorkflowOrchestrator.js` - Step 3 & 5 saves (lines 219-228, 282-356)
- `WorkflowResults.js` - Step 3.5 save (lines 233-243)
- `CertificateSection.js` - Step 4 save (lines 109-128)
- `useWorkflowState.js` - Main save function definition (lines 796-838)

### API Endpoints
- `POST /api/workflow-session` - Main save endpoint
- `POST /api/workflow-session/update-certificate` - Certificate save
- `GET /api/dashboard-data` - Retrieve saved workflow data

---

## Testing Data Flow

### Complete User Journey
```
Fill Step 1
  ↓
[SAVE] 💾 Company data → workflow_sessions
  ↓
Fill Step 2
  ↓
[AUTO-SAVE] 💾 Components → workflow_sessions (every 2s)
  ↓
Click "Continue to USMCA Analysis"
  ↓
[SAVE] 💾 Final components → workflow_sessions
  ↓
[PROCESS] 🤖 AI analysis + tariff enrichment
  ↓
[DISPLAY] Step 3 Results showing enriched components
  ↓
Click "Set Up Alerts"
  ↓
[SAVE] 💾 Workflow results → localStorage + database
  ↓
[NAVIGATE] → /trade-risk-alternatives
  ↓
Click "Download Certificate"
  ↓
[SAVE] 💾 Certificate metadata → database
  ↓
[DOWNLOAD] 📄 PDF generated and sent to user
  ↓
[CAPTURE] 📊 Complete workflow logged for BI
```

---

**Updated:** November 1, 2025
**Author:** Claude Code - Triangle Intelligence Platform
