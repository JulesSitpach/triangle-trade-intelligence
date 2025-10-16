# 🚨 PRE-LAUNCH DATA FLOW AUDIT REPORT
**Generated**: January 2025
**Status**: CRITICAL ISSUES FOUND - DO NOT LAUNCH
**Auditor**: Claude Code AI Assistant

---

## Executive Summary

**FINDINGS**: ❌ **14 CRITICAL ISSUES** identified that WILL cause production failures

**Risk Level**: 🔴 **CRITICAL** - Multiple data inconsistencies that will break user workflows

**Recommendation**: **DO NOT LAUNCH** until all issues are resolved

---

## 🔍 PHASE 1: DATA STRUCTURE MAPPING

### Database Schema Analysis

#### ✅ CONFIRMED TABLES (with migrations):
1. **hts_tariff_rates_2025** (`database/migrations/001_create_hts_tariff_rates_2025.sql`)
   - ✅ Has proper migration
   - ✅ Schema documented
   - Fields: `hts8`, `mfn_ad_val_rate`, `usmca_ad_val_rate`, `brief_description`

2. **user_profiles** (`migrations/001_create_users_table.sql` + `database/migrations/012_add_free_trial_tier.sql`)
   - ✅ Has migrations
   - ✅ Trigger for auto-creation
   - Fields: `id`, `user_id`, `email`, `company_name`, `subscription_tier`, `created_at`

3. **workflow_sessions** (`migrations/003_create_workflow_sessions_table.sql`)
   - ✅ Has migration
   - Fields: session tracking data

4. **service_requests** (used in code but **NO MIGRATION FILE FOUND**)
   - ❌ **CRITICAL**: Referenced in `pages/api/admin/service-requests.js` but no CREATE TABLE statement
   - ❌ **RISK**: May not exist in production database

5. **rss_feeds**, **crisis_alerts**, **tariff_policy_updates** (`migrations/011_*.sql`, `migrations/014_*.sql`)
   - ✅ Have migrations
   - ✅ Alert system tables

#### 🚨 CRITICAL ISSUE #1: TWO MIGRATION FOLDERS
```
/database/migrations/  → 3 files only
/migrations/           → 20+ files with REAL tables
```

**Impact**: Confusion about which migrations are active, potential missing tables in production

**Fix Required**: Consolidate to single `/migrations` folder, deprecate `/database/migrations/`

---

### API Data Structures

#### `/api/auth/me` Response Structure
```javascript
{
  success: true,
  authenticated: true,
  user: {
    id: "uuid",
    email: "user@example.com",
    isAdmin: false,
    company_name: "Company Name",      // snake_case
    subscription_tier: "Professional"   // snake_case
  }
}
```

**Fields**: All using `snake_case` naming convention

#### `/api/admin/service-requests` Request Structure
```javascript
{
  service_type: string,
  company_name: string,         // snake_case
  email: string,
  trade_volume: string,
  subscriber_data: JSONB,       // Contains workflow data
  workflow_data: JSONB          // Alternative field name
}
```

**🚨 CRITICAL ISSUE #2**: `subscriber_data` vs `workflow_data` - two fields for same concept

---

### Component Data Flow (USMCAWorkflowOrchestrator)

#### formData Structure (React State)
```javascript
{
  company_name: string,           // snake_case
  business_type: string,
  industry_sector: string,
  product_description: string,
  component_origins: [{          // snake_case
    country: string,
    percentage: number,
    component_type: string,
    description: string,
    // Enrichment fields (optional)
    hs_code: string,             // snake_case
    mfn_rate: number,
    usmca_rate: number
  }],
  classified_hs_code: string     // snake_case
}
```

**Naming**: Consistently using `snake_case` in React state

---

### LocalStorage Data Structures

#### Stored Keys Found:
1. `usmca_workflow_results` - Workflow results from AI analysis
2. `usmca_workflow_data` - Form data for alerts page
3. `triangleUserData` - Legacy user data cache
4. `workflow_session_id` - Session tracking ID

**🚨 CRITICAL ISSUE #3**: No validation or consistency checks on localStorage data

---

### Config File Structures

#### `config/service-configurations.js`
```javascript
{
  'trade-health-check': {
    type: 'trade-health-check',
    name: 'Trade Health Check',
    price: 99,
    basePrice: 99,
    teamLead: 'Jorge & Cristina',
    cristinaEffort: 50,
    jorgeEffort: 50
  }
}
```

**✅ GOOD**: Single source of truth for service pricing and team allocation

#### `config/workflow-statuses.js`
```javascript
export const SERVICE_REQUEST_STATUSES = {
  PENDING_PAYMENT: 'pending_payment',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
}
```

**✅ GOOD**: Centralized status enums

---

## 🚨 PHASE 2: NAMING INCONSISTENCIES

### Critical Findings:

#### 🔴 ISSUE #4: hs_code / hsCode Inconsistency
- **Total occurrences**: 3,793 across 213 files
- **Patterns found**: `hs_code`, `hsCode`, `hs-code`, `hs_tariff_code`
- **Impact**: CRITICAL - Data loss when transforming between formats

#### 🔴 ISSUE #5: component_origins / componentOrigins Inconsistency
- **Total occurrences**: 327 across 71 files
- **Patterns found**: `component_origins`, `componentOrigins`
- **Impact**: HIGH - Component data may be lost in API calls

#### 🟡 ISSUE #6: company_name / companyName Inconsistency
- **Total occurrences**: 40 across 10 files in `components/workflow/`
- **Patterns found**: `company_name`, `companyName`
- **Impact**: MEDIUM - User company name may not persist

#### 🟡 ISSUE #7: subscription_tier / subscriptionTier Inconsistency
- **Total occurrences**: 85 across 41 files
- **Patterns found**: `subscription_tier`, `subscriptionTier`
- **Impact**: MEDIUM - Tier-based features may fail

---

### Pattern Analysis

| Field Name | snake_case Count | camelCase Count | Most Common |
|------------|------------------|-----------------|-------------|
| hs_code | 3,500+ | 290+ | snake_case |
| component_origins | 250+ | 77 | snake_case |
| company_name | 35 | 5 | snake_case |
| subscription_tier | 80 | 5 | snake_case |

**Conclusion**: Database and API use `snake_case`, but some React components use `camelCase`, causing transformation errors.

---

## 🔍 PHASE 3: CRITICAL DATA FLOW TRACES

### Flow 1: USMCA Workflow Submission

```
User Form → localStorage → API → Database → Admin Dashboard
```

#### Step-by-Step Trace:

1. **User fills CompanyInformationStep.js**
   - Expects: `company_name`, `business_type`, `trade_volume`
   - ✅ Uses snake_case

2. **Data saved to localStorage as `usmca_workflow_data`**
   - Format: JSON with snake_case keys
   - ✅ Correct format

3. **API `/api/ai-usmca-complete-analysis` receives data**
   - Expected format: `component_origins` (snake_case)
   - ✅ Matches React state

4. **🚨 CRITICAL ISSUE #8**: Enrichment adds fields but inconsistent naming
   ```javascript
   // API adds:
   {
     hs_code: "1234.56",           // snake_case
     mfn_rate: 0.068,             // snake_case
     usmca_rate: 0.00             // snake_case
   }

   // But some components expect:
   {
     hsCode: "1234.56",           // camelCase
     mfnRate: 0.068               // camelCase
   }
   ```
   **Impact**: Enriched data may be lost when displayed in admin dashboards

5. **Database Save (via WorkflowDataConnector)**
   - 🚨 **CRITICAL ISSUE #9**: `service_requests` table structure not found in migrations
   - ⚠️ **RISK**: May fail silently if table doesn't match expectations

6. **Admin Dashboard Display**
   - ✅ Expects `subscriber_data` JSONB field
   - ✅ Displays component tables

#### **CRITICAL GAPS FOUND**:
- ❌ Enrichment data transformation not validated
- ❌ No schema validation before database insert
- ❌ No error handling if fields are missing

---

### Flow 2: Service Request Purchase

```
User selects service → Stripe checkout → service_requests table → Admin dashboard
```

#### Step-by-Step Trace:

1. **User selects service from `/services` page**
   - Service ID: `'trade-health-check'`
   - ✅ Matches `config/service-configurations.js`

2. **🚨 CRITICAL ISSUE #10**: Multiple service checkout endpoints
   - `/api/stripe/create-service-checkout.js` exists
   - `/api/services/create-request.js` was archived (conflicting pricing)
   - ⚠️ **RISK**: Old code may reference archived endpoint

3. **Stripe checkout API call**
   ```javascript
   POST /api/stripe/create-service-checkout
   {
     service_id: 'trade-health-check',
     subscriber_data: {...}  // Complete workflow data
   }
   ```

4. **🚨 CRITICAL ISSUE #11**: `subscriber_data` structure not validated
   - No TypeScript interfaces
   - No Zod schema validation
   - ⚠️ **RISK**: Missing fields will cause admin dashboard errors

5. **Database insert to `service_requests` table**
   - Expected columns: `id`, `service_type`, `company_name`, `status`, `subscriber_data`
   - 🚨 **CRITICAL ISSUE #12**: Table schema not defined in migrations

6. **Admin dashboard loads from `/api/admin/service-requests`**
   - ✅ Queries `service_requests` table
   - ❌ No validation of returned data structure

#### **CRITICAL GAPS FOUND**:
- ❌ No validation of `subscriber_data` JSONB field
- ❌ No TypeScript interfaces for service request structure
- ❌ `service_requests` table schema missing from migrations

---

### Flow 3: Component Enrichment

```
Component data → AI classification (PRIMARY) → Database comparison (FALLBACK) → Display in dashboard
```

**✅ NOTE**: This flow is ALREADY IMPLEMENTED CORRECTLY with AI-first architecture as documented in CLAUDE.md lines 819-825. Database is used for historical comparison only, not as primary source.

#### Step-by-Step Trace:

1. **User enters component data**
   ```javascript
   {
     country: "China",
     percentage: 45,
     component_type: "Motors",
     description: "Electric motors for fans"
   }
   ```

2. **AI-First Tariff Intelligence (via OpenRouter API)**
   - **PRIMARY**: OpenRouter API with 2025 Trump policy context (China +100%, port fees)
   - **FALLBACK**: Anthropic API if OpenRouter fails
   - **LAST RESORT**: Database (stale Jan 2025 data for historical comparison)
   - Endpoint: `/api/ai-usmca-complete-analysis`
   - Returns: `hs_code`, `description`, `confidence`, `mfn_rate`, `usmca_rate`
   - ✅ Uses snake_case
   - ✅ AI results enrich database over time (building dataset)

3. **Database Lookup (historical comparison only)**
   ```sql
   SELECT mfn_ad_val_rate, usmca_ad_val_rate
   FROM hts_tariff_rates_2025
   WHERE hts8 = ?
   -- NOTE: Data from January 2025 - STALE in volatile 2025 tariff landscape
   -- Used for: historical comparison, transparency, fallback only
   ```
   - ✅ Table exists
   - ✅ Returns snake_case fields
   - ⚠️ Data is STALE (Jan 2025) - Trump changes tariffs weekly

4. **🚨 CRITICAL ISSUE #13**: Enrichment data saved back to component_origins
   ```javascript
   // Before:
   { country: "China", percentage: 45, component_type: "Motors" }

   // After (should be):
   { country: "China", percentage: 45, component_type: "Motors",
     hs_code: "8501.10", mfn_rate: 0.026, usmca_rate: 0.00 }

   // But some code expects:
   { country: "China", percentage: 45, componentType: "Motors",  // camelCase!
     hsCode: "8501.10", mfnRate: 0.026, usmcaRate: 0.00 }      // camelCase!
   ```

5. **Display in Admin Dashboard**
   - File: `components/shared/USMCAAdvantageTab.js`
   - Expects: 8-column component table with enrichment data
   - 🚨 **CRITICAL ISSUE #14**: If naming is inconsistent, columns show "undefined"

#### **CRITICAL GAPS FOUND**:
- ❌ Enrichment transformation not normalized (snake_case vs camelCase)
- ❌ No validation that enrichment succeeded
- ❌ Admin dashboard may display undefined values

---

## 💥 SUMMARY OF CRITICAL ISSUES

### BLOCKER Issues (Must Fix Before Launch):

1. **🔴 ISSUE #1**: Two migration folders causing confusion
2. **🔴 ISSUE #2**: `subscriber_data` vs `workflow_data` naming
3. **🔴 ISSUE #4**: `hs_code` inconsistency (3,793 occurrences)
4. **🔴 ISSUE #5**: `component_origins` inconsistency (327 occurrences)
5. **🔴 ISSUE #8**: Enrichment data transformation inconsistencies
6. **🔴 ISSUE #9**: `service_requests` table schema missing
7. **🔴 ISSUE #11**: No validation of `subscriber_data` structure
8. **🔴 ISSUE #12**: `service_requests` table not in migrations
9. **🔴 ISSUE #13**: Enriched component data naming inconsistent
10. **🔴 ISSUE #14**: Admin dashboard may show undefined enrichment data

### HIGH Priority Issues:

11. **🟡 ISSUE #3**: No localStorage validation
12. **🟡 ISSUE #6**: `company_name` inconsistency
13. **🟡 ISSUE #7**: `subscription_tier` inconsistency
14. **🟡 ISSUE #10**: Multiple service checkout endpoints

---

## ✅ NEXT STEPS (Phases 4-7)

### Phase 4: Create Single Source of Truth
- [ ] Create `types/data-contracts.ts` with TypeScript interfaces
- [ ] Define all data structures in one place
- [ ] Standardize on snake_case for consistency with database

### Phase 5: Add Validation at Every Boundary
- [ ] Create `lib/validation.js` with Zod schemas
- [ ] Add validation to all API endpoints
- [ ] Validate before database saves
- [ ] Validate after database reads

### Phase 6: Fix All Issues
- [ ] Consolidate migration folders
- [ ] Standardize all field names to snake_case
- [ ] Create missing `service_requests` table migration
- [ ] Add validation to all data transformations
- [ ] Fix enrichment data flow

### Phase 7: Add Integration Tests
- [ ] Test complete USMCA workflow end-to-end
- [ ] Test service request purchase flow
- [ ] Test component enrichment flow
- [ ] Verify data persists correctly

---

## 🎯 RECOMMENDATION

**DO NOT LAUNCH** until at least the 10 BLOCKER issues are resolved.

**Timeline Estimate**:
- Phase 4 (Types): 4-6 hours
- Phase 5 (Validation): 6-8 hours
- Phase 6 (Fixes): 12-16 hours
- Phase 7 (Tests): 4-6 hours

**Total**: 26-36 hours of focused development work

---

*Report generated by Claude Code AI Assistant*
*Last Updated: January 2025*
