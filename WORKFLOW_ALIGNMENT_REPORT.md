# USMCA Workflow Alignment Report

**Generated:** September 30, 2025
**Project:** Triangle Intelligence Platform
**Analysis:** Current workflow architecture vs CLAUDE.md documentation

---

## 📊 Executive Summary

The current workflow implementation has **evolved significantly** from the documentation. Here's the actual user journey:

### Current Reality (What's Built)
```
1. Homepage → /usmca-workflow (USMCAWorkflowOrchestrator)
2. Step 1: Company Information (CompanyInformationStep)
3. Step 2: Product Analysis + Component Origins (ComponentOriginsStepEnhanced)
4. Step 3: Path Selection → Choose Certificate OR Crisis Calculator

   IF CERTIFICATE PATH:
   - Step 3: Supply Chain Review (SupplyChainStep)
   - Step 4: Authorization (AuthorizationStep) - WITHIN WORKFLOW
   - Step 5: Results & Download (WorkflowResults)

   IF CRISIS CALCULATOR PATH:
   - Step 3: Crisis Analysis Results (CrisisCalculatorResults)
   - Redirect to /trade-risk-alternatives for alerts
```

### Documentation Says (OUTDATED)
```
1. Homepage → /usmca-workflow (2 steps)
2. Results → /usmca-results
3. Two separate paths:
   - Certificate → /usmca-certificate-completion (separate page)
   - Alerts → /trade-risk-alternatives
```

---

## 🔍 Key Differences

### 1. Certificate Generation Flow

**CLAUDE.md Documentation:**
> "Two paths: Certificate Generation OR Trade Alerts"
> - Certificate path goes to `/usmca-certificate-completion` (separate page)

**Current Implementation:**
- Certificate generation happens **WITHIN the main workflow**
- Steps 3-5 are part of the orchestrator component
- `/usmca-certificate-completion` is a **standalone page** that can work independently
- Authorization (Step 4) is embedded in the workflow, not a separate page

**Files Involved:**
- `pages/usmca-workflow.js` - Main orchestrator wrapper
- `components/workflow/USMCAWorkflowOrchestrator.js` - Full workflow logic (705 lines)
- `components/workflow/AuthorizationStep.js` - Step 4 (embedded)
- `pages/usmca-certificate-completion.js` - Alternative standalone entry point

### 2. Company Data Collection

**CLAUDE.md Documentation:**
> "Company Info + Product Analysis → Results"

**Current Implementation:**
```javascript
// Step 1: CompanyInformationStep collects:
- company_name
- business_type
- company_address
- tax_id
- contact_phone
- contact_email
- trade_volume
- supplier_country
- manufacturing_location
- destination_country

// Step 2: ComponentOriginsStepEnhanced collects:
- product_description
- classified_hs_code
- component_origins (array with country/percentage/type)

// Step 3 (Certificate Path): SupplyChainStep
- Reviews component breakdown
- Validates supply chain data

// Step 4 (Certificate Path): AuthorizationStep collects NEW DATA:
- signatory_name
- signatory_title
- signatory_email
- signatory_phone
- importer details (if different from exporter)
- accuracy_certification checkbox
- authority_certification checkbox
```

**Data Flow Pattern:**
1. Step 1-2: Stored in `formData` state (useWorkflowState hook)
2. Step 3: Path selection determines next steps
3. Step 4: Authorization data merged into formData
4. Step 5: Complete certificate generated with ALL data
5. localStorage: Multiple keys for different purposes
   - `usmca_workflow_data` - Full workflow results
   - `usmca_company_data` - Company info only
   - `usmca_workflow_results` - Results summary

### 3. Workflow Orchestration Architecture

**Current Architecture (USMCAWorkflowOrchestrator.js:23-47):**
```javascript
const {
  currentStep,        // 1-5 depending on path
  workflowPath,       // 'certificate' | 'crisis-calculator' | 'path-selection'
  isLoading,
  results,            // Step 3+ results
  error,
  dropdownOptions,    // Database-driven dropdowns
  formData,           // All collected data
  // ... methods for navigation, validation, processing
} = useWorkflowState();
```

**Step Navigation:**
- Step 1 → Step 2 → Path Selection
- Certificate Path: Step 3 (Supply) → Step 4 (Auth) → Step 5 (Results)
- Crisis Path: Step 3 (Results) → Redirect to /trade-risk-alternatives

### 4. Certificate Generation Integration

**CLAUDE.md says:**
> "Certificate Generation (/usmca-certificate-completion)"

**Current Implementation:**

**Two Entry Points:**

1. **Main Workflow Path** (pages/usmca-workflow.js)
   - Integrated 5-step process
   - Step 4: Authorization within workflow
   - Step 5: Download certificate from results

2. **Direct Certificate Completion** (pages/usmca-certificate-completion.js)
   - Standalone page for users with existing workflow data
   - Loads data from localStorage or URL params
   - Same AuthorizationStep component
   - Separate certificate preview and PDF generation logic

**API Integration:**
- `/api/trust/complete-certificate` - Professional certificate generation
- `/api/add-certificate-data` - Save certificate to database
- `/api/regenerate-usmca-certificate` - Update existing certificates

---

## 🎯 Workflow State Management

### useWorkflowState Hook (Primary State Manager)

**Location:** `hooks/useWorkflowState.js`

**Manages:**
```javascript
{
  currentStep: 1-5,
  workflowPath: 'certificate' | 'crisis-calculator' | 'path-selection',
  formData: {
    // Step 1 data
    company_name, business_type, company_address, tax_id, contact_phone,
    contact_email, trade_volume, supplier_country, manufacturing_location,

    // Step 2 data
    product_description, classified_hs_code, component_origins,

    // Step 4 data (certificate path only)
    signatory_name, signatory_title, signatory_email, signatory_phone,
    importer_name, importer_address, importer_country, importer_tax_id,
    accuracy_certification, authority_certification
  },
  results: {
    // Step 3+ analysis results
    classification, usmca, savings, certificate
  }
}
```

### Data Persistence Strategy

**localStorage Keys:**
1. `usmca_workflow_data` - Complete workflow results for alerts system
2. `usmca_company_data` - Company info for pre-filling forms
3. `usmca_workflow_results` - Certificate completion data
4. `workflow_session_id` - Session tracking for database

**Database Integration:**
- Step-by-step capture via WorkflowDataConnector
- Service request creation for professional services
- Certificate storage for admin dashboards

---

## 🔄 Professional Services Integration

**CLAUDE.md Documentation:**
> "Professional Services: /services/mexico-trade-services"

**Current Reality:**

The workflow **DOES NOT** directly link to professional services selection at the pricing tier. Instead:

1. **User completes workflow** (free or paid path)
2. **Gets results** with USMCA qualification
3. **Professional services** are accessed through:
   - Admin dashboards (Cristina/Jorge)
   - Service request forms (separate flow)
   - NOT integrated into main workflow completion

**Missing Integration:**
- No "Upgrade to Professional Services" CTA in workflow results
- No service selection during certificate completion
- Professional services pricing ($200-650) not presented to users
- Subscription tiers ($99-599/month) not connected to workflow

---

## 📁 File Structure Alignment

### Main Workflow Files (What Exists)
```
pages/
├── usmca-workflow.js                    ✅ Main entry point
├── usmca-certificate-completion.js      ✅ Standalone certificate page
└── trade-risk-alternatives.js           ✅ Alerts dashboard

components/workflow/
├── USMCAWorkflowOrchestrator.js         ✅ Main orchestrator (705 lines)
├── CompanyInformationStep.js            ✅ Step 1
├── ComponentOriginsStepEnhanced.js      ✅ Step 2
├── SupplyChainStep.js                   ✅ Step 3 (certificate path)
├── AuthorizationStep.js                 ✅ Step 4 (certificate path)
├── WorkflowResults.js                   ✅ Step 5 (results display)
├── WorkflowPathSelection.js             ✅ Path selection UI
├── CrisisCalculatorResults.js           ✅ Crisis analysis results
├── WorkflowProgress.js                  ✅ Progress indicator
├── WorkflowLoading.js                   ✅ Loading overlay
└── WorkflowError.js                     ✅ Error handling

pages/api/trust/
├── complete-certificate.js              ✅ Certificate generation API
├── verify-hs-code.js                    ✅ HS code validation
├── calculate-qualification.js           ✅ USMCA qualification
└── trust-metrics.js                     ✅ Trust scoring
```

### CLAUDE.md References (Documentation Gaps)
```
components/workflow/
├── USMCAWorkflowOrchestrator.js         ✅ EXISTS (but different implementation)
├── CompanyInformationStep.js            ✅ EXISTS
├── ComponentOriginsStepEnhanced.js      ✅ EXISTS
├── WorkflowResults.js                   ✅ EXISTS
└── AuthorizationStep.js                 ✅ EXISTS (but embedded, not standalone page)

pages/
└── usmca-results.js                     ❌ DOES NOT EXIST (results shown in orchestrator)
```

---

## 🎨 User Experience Flow Diagram

### Actual Implementation Flow
```
┌─────────────────────────────────────────────────────────────┐
│                      Homepage (/)                            │
│              "USMCA Compliance Analysis"                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              /usmca-workflow (Step 1)                        │
│          CompanyInformationStep.js                           │
│  • Company name, business type, address                      │
│  • Contact info, trade volume                                │
│  • Supplier country, manufacturing location                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              /usmca-workflow (Step 2)                        │
│       ComponentOriginsStepEnhanced.js                        │
│  • Product description                                       │
│  • AI-powered HS code classification                         │
│  • Component origins breakdown (country/%)                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         /usmca-workflow (Path Selection)                     │
│          WorkflowPathSelection.js                            │
│  ┌──────────────┐        ┌──────────────┐                  │
│  │ Certificate  │        │    Crisis    │                   │
│  │    Path      │        │  Calculator  │                   │
│  └──────────────┘        └──────────────┘                   │
└─────────────────────────────────────────────────────────────┘
          │                            │
          ▼                            ▼
┌─────────────────────┐    ┌─────────────────────────────────┐
│ Step 3: Supply      │    │ Step 3: Crisis Results          │
│ SupplyChainStep     │    │ CrisisCalculatorResults         │
└─────────────────────┘    └─────────────────────────────────┘
          │                            │
          ▼                            ▼
┌─────────────────────┐    ┌─────────────────────────────────┐
│ Step 4: Auth        │    │ Redirect to                     │
│ AuthorizationStep   │    │ /trade-risk-alternatives        │
│ • Signatory info    │    │ (Alerts Dashboard)              │
│ • Importer details  │    └─────────────────────────────────┘
│ • Certifications    │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ Step 5: Results     │
│ WorkflowResults     │
│ • Certificate       │
│ • Download PDF      │
│ • Professional      │
│   recommendations   │
└─────────────────────┘
```

---

## ✅ Recommendations for CLAUDE.md Updates

### 1. Update Main User Journey Section
```markdown
### Main User Journey (UPDATED)
1. Homepage → /usmca-workflow
2. Step 1: Company Information (CompanyInformationStep)
3. Step 2: Product Analysis + Component Origins (ComponentOriginsStepEnhanced)
4. Path Selection: Certificate OR Crisis Calculator

   **Certificate Path:**
   - Step 3: Supply Chain Review (SupplyChainStep)
   - Step 4: Authorization - NEW DATA COLLECTION (AuthorizationStep)
   - Step 5: Results & Certificate Download (WorkflowResults)

   **Crisis Calculator Path:**
   - Step 3: Crisis Analysis Results
   - Redirect to /trade-risk-alternatives for ongoing alerts
```

### 2. Add Authorization Step Documentation
```markdown
### Authorization Step (NEW COMPONENT)
**Component:** `components/workflow/AuthorizationStep.js`
**Step:** 4 (Certificate Path Only)

**NEW Data Collection:**
- Authorized signatory information (name, title, email, phone)
- Importer details (if different from exporter)
- Legal certifications (accuracy, authority)

**Integration:**
- Embedded within USMCAWorkflowOrchestrator
- Uses same formData state management
- Professional certificate generation via `/api/trust/complete-certificate`
```

### 3. Clarify Certificate Generation Paths
```markdown
### Certificate Generation (TWO PATHS)

**1. Integrated Workflow Path**
- Main flow: Steps 1-5 in `/usmca-workflow`
- Step 4: Authorization within workflow
- Step 5: Download from results

**2. Standalone Certificate Completion**
- Direct access: `/usmca-certificate-completion`
- For users with existing workflow data
- Same AuthorizationStep component
- Independent PDF generation logic
```

### 4. Update Data Flow Architecture
```markdown
### Workflow Data Management

**State Management:**
- Hook: `useWorkflowState()` (hooks/useWorkflowState.js)
- Steps 1-2: Form data collection
- Step 3: Path selection and analysis
- Step 4 (Certificate): Authorization data collection
- Step 5: Results with complete certificate

**Data Persistence:**
```javascript
// localStorage Keys
'usmca_workflow_data'      // Complete results for alerts
'usmca_company_data'        // Company info for pre-fill
'usmca_workflow_results'    // Certificate completion data
'workflow_session_id'       // Session tracking

// Database Integration
- WorkflowDataConnector for step-by-step capture
- Service requests for professional services
- Certificate storage for admin access
```
```

### 5. Document Current vs Future State
```markdown
### Professional Services Integration Status

**Current State (September 2025):**
- Professional services ($200-650) accessed via admin dashboards
- NOT integrated into main workflow
- No upgrade CTAs in workflow results
- Subscription tiers ($99-599/month) separate from workflow

**Future Enhancement Opportunity:**
- Add "Upgrade to Professional Services" in Step 5 results
- Present service options with pricing during certificate completion
- Connect subscription tiers to workflow completion
- Direct link from results to `/services/mexico-trade-services`
```

---

## 📌 Summary

### What CLAUDE.md Got Right ✅
- Tech stack (Next.js, Supabase, OpenRouter)
- Core principles (USMCA focus, AI + Human hybrid)
- Component names (mostly accurate)
- Database-driven approach

### What Needs Updating ⚠️
- **Workflow steps**: 2 steps → Actually 5 steps (certificate path)
- **Certificate flow**: Separate page → Integrated in main workflow
- **Authorization step**: Not documented → Critical Step 4 component
- **Path selection**: Not documented → Key branching point
- **Data collection**: Underspecified → Authorization collects new data
- **Professional services**: Mentioned but not integrated → Missing CTAs
- **File locations**: Some references outdated → Current structure differs

### Critical Findings 🔍
1. **USMCAWorkflowOrchestrator** is the central hub (705 lines)
2. **AuthorizationStep** is a new component collecting additional data
3. **Two certificate entry points** (workflow + standalone page)
4. **Path selection** creates two distinct user journeys
5. **Professional services** NOT integrated into workflow completion

---

**Report Author:** Claude Code Analysis Agent
**Next Action:** Update CLAUDE.md sections based on this report
