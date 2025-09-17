# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Triangle Intelligence is a database-driven USMCA compliance platform for trade classification, tariff calculation, and certificate generation. Built with Next.js 14 (Pages Router), React 18, and Supabase PostgreSQL with 34,476+ HS code records.

## Essential Commands

```bash
# Development
npm run dev                    # Start dev server on port 3000
npm run build                  # Production build (skips lint)
npm run start                  # Start production server

# Testing
npm test                       # Run all Jest tests
npm run test:watch            # TDD watch mode
npm run test:coverage         # Coverage report (75% threshold)
npm run test:playwright       # E2E tests

# Validation & Quality
npm run lint                  # ESLint check
npm run type-check           # TypeScript validation
npm run check-hardcoding     # Verify no hardcoded values
npm run validate-enterprise  # Full enterprise validation
npm run css:check           # Check CSS violations (blocks commits)
npm run protection:full     # Full protection check

# Database
npm run ingest:all          # Populate HS codes database

# Windows Process Management
npm run clean               # Kill node processes
npm run clean:port         # Free port 3000
npm run dev:fresh          # Clean restart
```

## High-Level Architecture

### API Structure (54 endpoints)
```
pages/api/
├── simple-*.js              # Core workflow APIs (<400ms response)
│   ├── simple-classification.js    # AI-enhanced HS classification
│   ├── simple-usmca-compliance.js  # Compliance checking (complex routing)
│   └── simple-savings.js           # Tariff savings calculator
├── admin/                   # Admin management (11 endpoints)
│   ├── users.js            # Falls back to sample data if empty
│   ├── suppliers.js        # Supplier management
│   ├── rss-feeds.js        # Crisis monitoring feeds
│   ├── business-opportunity-analytics.js
│   ├── performance-analytics.js
│   └── workflow-analytics.js
├── trust/                   # Trust microservices (12 endpoints)
│   ├── complete-workflow.js
│   ├── complete-certificate.js
│   ├── trust-metrics.js
│   └── verify-hs-code.js
└── database-driven-*.js    # Enterprise APIs
```

### Key Architectural Patterns

#### 1. Database Connection & Fallback Pattern
All admin APIs intelligently fall back to sample data when tables are empty:
```javascript
const { data, error } = await supabase.from('table').select('*');
if (error || !data || data.length === 0) {
  console.log('Using sample data for demo');
  return sampleData;
}
```

#### 2. API Response Structure
Admin APIs return standardized responses:
```javascript
{
  [main_data]: [...],        // Primary data (e.g., users, feeds)
  summary: { ... },          // Aggregate metrics
  data_status: { ... },      // Metadata
  timeframe: "30days"        // Query parameters
}
```

#### 3. HS Code Normalization
Critical for classification - handles multiple formats:
```javascript
// User input: "8544.42.90" → Database: "85444290"
const normalized = input.replace(/[\.\s\-]/g, '');
// Progressive fallback matching with 8, 6, 4 digit patterns
```

#### 4. AI Classification Integration
Two-phase approach:
- Phase 1: AI provides context once per company
- Phase 2: Database handles all runtime queries

### Critical Configuration Files

- `config/system-config.js` - Central system configuration
- `config/table-constants.js` - Database table names (never hardcode)
- `config/trust-config.js` - Trust system settings
- `config/usmca-thresholds.js` - Industry-specific USMCA thresholds
- `.env.local` - Environment variables (Supabase, Anthropic, etc.)

### Critical USMCA Threshold Configuration

**IMPORTANT**: Electronics industry uses 65% threshold, NOT 75%:
- Electronics/Electronics & Technology: **65.0%** (not 75%)
- Automotive: **75.0%** ✓
- Textiles/Textiles & Apparel: **62.5%** ✓
- General Manufacturing: **62.5%** ✓

**Fixed Issue**: `config/usmca-thresholds.js` previously had Electronics set to 75% instead of the correct 65% threshold. This caused incorrect USMCA qualification results for electronics companies.

### CSS Architecture Rules (STRICTLY ENFORCED)

**NEVER modify `styles/globals.css` or `styles/dashboard.css`**
- NO inline styles (`style={{}}` or `style=""`)
- NO Tailwind CSS classes
- Use existing CSS classes only
- Run `npm run css:check` before commits

### Database Schema

Primary tables (Supabase PostgreSQL):
- `hs_master_rebuild` - 34,476 HS codes (critical - MAIN tariff data source)
- `tariff_rates` - 14,486 records (WARNING: Many 0% rates - use as fallback only)
- `usmca_tariff_rates` - 48 records (Limited coverage)
- `user_profiles` - User accounts (empty = sample data)
- `workflow_completions` - Completed workflows
- `rss_feeds` - Crisis monitoring feeds
- `usmca_qualification_rules` - Qualification logic

**CRITICAL TARIFF TABLE PRIORITY:**
1. **hs_master_rebuild** (PRIMARY): 34,476 codes with real tariff rates
2. **usmca_tariff_rates** (SECONDARY): Limited but high-quality data  
3. **tariff_rates** (FALLBACK): Many records have 0% rates - use only as last resort

**KNOWN ISSUE RESOLVED:** Previous versions incorrectly prioritized `tariff_rates` table first, causing electrical components to return 0% rates. Fixed 2025-09-10 to use `hs_master_rebuild` as primary source.

### Testing Strategy

Tests located in `__tests__/` directory:
- Unit tests: 75% coverage required
- Integration tests: API endpoint testing
- E2E tests: Playwright for visual validation

Run specific test:
```bash
npm test -- __tests__/api/simple-classification.test.js
```

### Common Issues & Solutions

#### "Database connected but using sample data"
- `user_profiles` table is empty (0 records)
- APIs correctly fall back to demo data
- Add real users to switch from sample data

#### "405 Method Not Allowed"
- Check HTTP method in API handler
- Admin APIs expect GET, not POST

#### "HS Code not found"
- Format mismatch between input and database
- Use normalization utilities in `lib/utils/hs-code-normalizer.js`

#### "CSS violation detected"
- Remove inline styles
- Use existing classes from `styles/globals.css`
- Never add new styles without approval

### Performance Targets
- API Response: <400ms
- Database Queries: <200ms
- Page Load: <3s
- Classification Accuracy: 85%+

### Workflow Components

Main orchestrator: `components/workflow/USMCAWorkflowOrchestrator.js`

**✅ CURRENT USER WORKFLOW (UPDATED 2025-09-14):**
1. **Step 1**: USMCA Compliance Analysis (`CompanyInformationStep.js`)
   - Fields: company_name, business_type, trade_volume, manufacturing_location
2. **Step 2**: Product & Component Analysis (`ComponentOriginsStepEnhanced.js`)
   - Fields: product_description, component_origins
3. **Step 3**: USMCA Qualification Results (standalone `/usmca-results`)
   - Shows qualification status and analysis results
   - **TWO USER PATHS AVAILABLE:**
     - **Path A**: "📋 Continue to Certificate →" → Certificate completion
     - **Path B**: "🚨 Get Crisis Alerts" → Direct to alerts (saves data to database)
4. **Step 4A**: Certificate Generation (`/usmca-certificate-completion`) - OPTIONAL
   - Uses `AuthorizationStep` component for certificate completion
   - Includes "🚨 Go to Crisis Alerts" button after certificate generation
4. **Step 4B**: Crisis Alerts (`/trump-tariff-alerts`) - ALTERNATIVE
   - Personalized trade monitoring based on workflow data
   - Data sourced from database via `/api/workflow-based-alerts`

**API Endpoints Used:**
- Primary workflow: `/api/usmca-complete`
- Classification: `/api/ai-classification`
- Certificate completion: `/api/trust/complete-certificate`
- **Workflow persistence**: `/api/workflow-complete` (saves to database for alerts)
- **Alerts data**: `/api/workflow-based-alerts` (reads from database)

**Key Navigation Flows:**
- **Standard**: Homepage → USMCA Workflow → Results → **Choose Path**
- **Certificate Path**: Results → Certificate Completion → PDF Generation → Alerts (optional)
- **Alerts Path**: Results → Crisis Alerts (immediate)
- **Data Flow**: localStorage (immediate) + Database (persistent alerts)

### Environment Requirements

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

### Monitoring & Status

- System Status API: `/api/system-status`
- Visual Dashboard: `/system-status`
- Health check shows database connectivity, table records, API status

### Development Workflow

1. Check database connection: `node test-database-connection.js`
2. Start dev server: `npm run dev`
3. Monitor status: http://localhost:3000/system-status
4. Test APIs: Use curl or browser dev tools
5. Before commit: `npm run protection:full`

## USMCA Workflow & Alerts Integration - Latest Updates (2025-09-14)

### Enhanced User Experience & Data Flow

#### 1. **Dual Path Architecture**
**Added**: Two user paths from USMCA Results page
- **Certificate Path**: For users needing official documentation
- **Alerts Path**: For users wanting immediate trade monitoring
- **Choice Point**: USMCA Results page now offers both options

#### 2. **Crisis Alerts Integration**
**Enhanced**: `components/workflow/AuthorizationStep.js`
- Added "🚨 Go to Crisis Alerts" button after certificate generation
- Button appears alongside Download/Email actions
- Direct navigation to `/trump-tariff-alerts`

#### 3. **Database Persistence for Alerts**
**Fixed**: Data flow from workflow to alerts system
- **Issue**: Alerts showed `$NaNM` and `$0` due to missing database integration
- **Solution**: Added `/api/workflow-complete` calls to persist workflow data
- **Files Modified**:
  - `pages/usmca-certificate-completion.js` - Saves certificate data to database
  - `pages/usmca-results.js` - Saves analysis data when going to alerts
- **Result**: Alerts now display real trade volumes, savings, and metrics

#### 4. **Flexible Workflow Navigation**
**Enhanced**: `pages/usmca-results.js`
- Added choice buttons: "📋 Continue to Certificate →" and "🚨 Get Crisis Alerts"
- Smart data saving based on user path selection
- Improved conversion funnel for alerts subscription

### Technical Implementation Details

#### Data Flow Architecture:
```
Step 1-2: Workflow → localStorage (immediate)
Step 3: Results Page → User chooses path
Path A: Certificate → Database via certificate_generation step
Path B: Alerts → Database via qualification_results step
Both paths → Alerts system reads from workflow_completions table
```

#### API Integration:
- `POST /api/workflow-complete` - Persists workflow data to database
- `GET /api/workflow-based-alerts` - Retrieves personalized alerts from database
- Dual storage: localStorage (session) + PostgreSQL (persistent)

#### Authentication Context:
- **Issue Identified**: Admin users can't access regular workflow (authentication conflict)
- **Solution**: Use regular user account for workflow testing
- **Workflow Access**: Requires non-admin authentication for proper data flow

### Business Value Delivered:
- ✅ **Increased conversion**: Easier path to alerts without forcing certificate
- ✅ **Better UX**: Users choose their preferred outcome
- ✅ **Data accuracy**: Real metrics instead of placeholder values
- ✅ **Retention**: Personalized alerts based on actual workflow data

## USMCA Certificate Workflow - Previous Fixes & Improvements (2025-09-11)

### Critical Issues Resolved

#### 1. Server Killing Bug Fixed
**Problem**: The `clean` script was killing ALL node processes including the dev server
**Solution**: Fixed `package.json` clean script to target only port 3000
```json
// Before (BROKEN)
"clean": "taskkill /F /IM node.exe"

// After (FIXED)  
"clean": "for /f \"tokens=5\" %a in ('netstat -aon ^| findstr :3000') do taskkill /F /PID %a 2>nul || echo No process on port 3000"
```

#### 2. Input Fields Non-Functional Bug Fixed
**Problem**: Certificate completion form input fields couldn't accept any text
**Root Cause**: onChange parameter mismatch between components
**Solution**: Standardized all onChange handlers to use `(field, value)` pattern

**Files Fixed**:
- `components/workflow/CompanyInfoStep.js:130` - Fixed onChange to `handleFieldChange(field, e.target.value)`
- `components/workflow/ProductDetailsStep.js` - Fixed multiple onChange calls
- `pages/usmca-certificate-completion.js:457` - Fixed onChange parameter handling

#### 3. Navigation Buttons Not Working Fixed
**Problem**: "Continue to Product Details" button crashed workflow  
**Root Cause**: `nextStep` function didn't handle 'default' parameter properly
**Solution**: Fixed navigation logic in `hooks/useWorkflowState.js:608`

```javascript
// Fixed nextStep function logic
} else {
  if (currentStep === 1) {
    setWorkflowPath(null); // Clear workflow path for normal progression
  }
}
```

#### 4. Hydration Mismatch Error Fixed
**Problem**: Button disabled states caused SSR/client mismatch
**Solution**: Added client-side state tracking in `CompanyInformationStep.js`
```javascript
const [isClient, setIsClient] = useState(false);
const isNextDisabled = !isClient || !formData.company_name || ...
```

### Streamlined Certificate Workflow Implementation

#### New 4-Step Process
**Old**: Confusing 5-step certificate completion with redundant steps
**New**: Streamlined 4-step flow with integrated trust verification

1. **Company Information** (Step 1) - Auto-populated from main workflow
2. **Product & Component Analysis** (Step 2) - Pre-filled classifications  
3. **USMCA Results + Trust Verification** (Step 3) - Combined display
4. **Authorization + Certificate Generation** (Step 4) - PDF generation

#### Trust Verification Integration
**Enhanced WorkflowResults.js** with:
- Trust score display with percentage indicators
- Expert validation status badges
- "Continue to Authorization" button integration
- Automatic trust verification API calls

#### Comprehensive Data Auto-Population System
**Enhanced** `pages/usmca-certificate-completion.js` with intelligent data loading:

```javascript
// Priority order for data loading:
1. localStorage 'usmca_workflow_results' (primary)
2. localStorage 'triangleUserData' (secondary with full mapping)  
3. URL parameters (backward compatibility fallback)

// Smart data mapping from workflow to certificate format
exporter_name: initialData.certificate?.exporter_name || initialData.company?.name
exporter_address: initialData.company?.company_address
exporter_tax_id: initialData.company?.tax_id
// ... comprehensive mapping for all fields
```

#### PDF Certificate Generation with Trust Verification
**Enhanced** `components/workflow/USMCAWorkflowOrchestrator.js:167` with:
- Trust verification service integration
- PDF generation with trust scores and validation status
- Professional certificate formatting with trust indicators

```javascript
const handleGenerateCertificate = async (results, authorizationData) => {
  const certificateResult = await trustVerifiedCertificateService.generateTrustVerifiedCertificate(
    results, authorizationData, trustIndicators
  );
  // PDF generation with trust metrics included
}
```

### Key Files Modified

#### Core Workflow Components
- **`hooks/useWorkflowState.js`** - Fixed navigation logic and workflow progression
- **`components/workflow/USMCAWorkflowOrchestrator.js`** - Added Authorization step and trust integration
- **`components/workflow/WorkflowResults.js`** - Added trust verification display and "Continue to Authorization"
- **`components/workflow/CompanyInfoStep.js`** - Fixed onChange patterns and added USMCA countries
- **`components/workflow/ProductDetailsStep.js`** - Fixed input field onChange handlers

#### Certificate Completion System
- **`pages/usmca-certificate-completion.js`** - Complete overhaul with data auto-population
- **`components/workflow/CompanyInformationStep.js`** - Fixed hydration and onChange issues

#### Configuration & Utils
- **`package.json`** - Fixed clean script to prevent server killing
- **Trust verification service integration** - Throughout workflow components

### Testing Results - All Issues Resolved ✅

**Current Workflow Testing Status:**
1. **✅ Complete 2-step USMCA workflow end-to-end** - Navigation working properly
2. **✅ Input field functionality** - All forms accept text input correctly
3. **✅ Data auto-population** - localStorage system transfers data to certificate completion
4. **✅ Certificate generation** - Standalone page with trust verification integration

**Test Alignment Updates (2025-01-13):**
- Tests updated to match current Company Info → Product Analysis → Certificate flow
- API endpoint tests now use `/api/usmca-complete` instead of outdated trust endpoints
- Form validation tests include all current fields: company_name, business_type, trade_volume, manufacturing_location, product_description, component_origins
- Workflow service tests aligned with actual implementation

### Business Value Delivered

- **Eliminated user frustration**: No more re-entering data multiple times
- **Streamlined UX**: Reduced from confusing 5-step to clean 4-step process  
- **Professional output**: PDF certificates with trust verification scores
- **Production ready**: All critical bugs resolved, workflow stable

### Key Implementation Notes

- Platform uses Pages Router, not App Router
- All data configuration-driven (no hardcoding)
- Admin dashboards gracefully handle empty tables
- AI classification caches context per company
- PDF certificates generated with jsPDF and trust verification
- Crisis monitoring via RSS feed integration
- Sample data ensures platform demos well
- Certificate workflow now fully functional with auto-population

## Testing Infrastructure

### E2E Testing with Playwright
- Configuration: `playwright.config.js`
- Main test suites in `tests/e2e/`
- Visual regression testing enabled
- Mobile and desktop viewport testing

Run E2E tests:
```bash
npm run test:e2e          # Run focused certificate test
npm run test:e2e:full     # Run full workflow test
npm run test:visual       # Visual regression testing
npm run test:mobile       # Mobile viewport testing
```

### Current Project State (as of 2025-09-12)

#### Active Development Branch
- **Current branch**: `enterprise-restoration-phase1`
- **Main branch**: `main` (use for PRs)

#### Modified Files in Working Directory
- Workflow components actively being enhanced
- Certificate completion wizard improvements
- Test infrastructure and E2E test development
- Configuration and validation updates

#### New Workflow Components Added
- `components/workflow/AuthorizationStep.js` - Authorization and signature capture
- `components/workflow/ReviewStep.js` - Final review before certificate generation
- `components/workflow/USMCATrustResultsStep.js` - Trust metrics integration

#### Test Files and Screenshots
- Multiple test files for workflow validation
- Screenshot captures for visual documentation
- Comprehensive test data fixtures

### Validation Commands

```bash
# Comprehensive validation suite
npm run validate:all      # Run all validation checks
npm run validate:smart    # Smart validation framework
npm run validate:discover # Auto-discovery validator
```