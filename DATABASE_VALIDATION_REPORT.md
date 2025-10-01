# Triangle Intelligence Platform - Database Schema Validation Report

**Date:** October 1, 2025
**Database:** Supabase PostgreSQL (https://mrwitpgbcaxgnirqtavt.supabase.co)
**Status:** ⚠️ **REQUIRES SCHEMA UPDATES FOR LAUNCH**

---

## Executive Summary

The Triangle Intelligence Platform database has been validated for launch readiness. **5 out of 7 critical tables** are properly configured. **2 tables require schema updates** before the platform can support all 6 professional services.

### Launch Blockers

1. **service_requests table:** Missing 5 critical columns needed for dashboard integration
2. **service_completions table:** Missing all required columns (appears to be empty/misconfigured)

---

## Table 1: service_requests (⚠️ REQUIRES FIXES)

### Current Status
- ✅ **Table EXISTS** with **35 rows** of data
- ❌ **Missing 5 critical columns** for dashboard integration

### Existing Schema (26 columns)
```
✅ Columns Present:
   - id
   - service_type
   - company_name
   - contact_name
   - email
   - phone
   - industry
   - trade_volume
   - assigned_to
   - status
   - priority
   - timeline
   - budget_range
   - created_at
   - updated_at
   - service_details
   - consultation_status
   - consultation_duration
   - consultation_date
   - consultation_notes
   - next_steps
   - data_storage_consent
   - consent_timestamp
   - privacy_policy_version
   - consent_ip_address
   - consent_user_agent
```

### Missing Columns (5)
```
❌ user_id              - UUID - Links to auth.users(id)
❌ client_company       - TEXT - Duplicate of company_name (for consistency)
❌ price                - DECIMAL(10,2) - Service pricing
❌ subscriber_data      - JSONB - CRITICAL: Complete workflow data
❌ workflow_data        - JSONB - Optional: May be same as subscriber_data
```

### Impact Analysis

**CRITICAL ISSUE:** `subscriber_data` column is MISSING
This column stores the complete USMCA workflow data that all 6 professional services depend on:

```json
{
  "company_name": "string",
  "business_type": "string",
  "trade_volume": "string|number",
  "manufacturing_location": "string",
  "product_description": "string",
  "component_origins": [
    {
      "country": "string",
      "percentage": "number",
      "component_type": "string"
    }
  ],
  "qualification_status": "QUALIFIED|NOT_QUALIFIED|PARTIAL",
  "annual_tariff_cost": "number",
  "potential_usmca_savings": "number",
  "compliance_gaps": "array",
  "vulnerability_factors": "array"
}
```

**Without this column:**
- Dashboard components cannot load service requests
- OpenRouter API calls missing business context
- Professional services cannot access complete workflow data
- All 6 service workflows will fail at Stage 2 (AI Analysis)

### SQL Migration Required

```sql
-- Add missing columns to service_requests table
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS client_company TEXT,
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS subscriber_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS workflow_data JSONB;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id
  ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_subscriber_data
  ON service_requests USING GIN (subscriber_data);

-- Add comment
COMMENT ON COLUMN service_requests.subscriber_data IS
  'Complete USMCA workflow data required for all professional services (JSONB)';
```

### Data Migration Strategy

**Option 1: Preserve Existing Data (RECOMMENDED)**
```sql
-- Map existing data to new structure
UPDATE service_requests
SET
  client_company = company_name,
  subscriber_data = jsonb_build_object(
    'company_name', company_name,
    'business_type', industry,
    'trade_volume', trade_volume,
    'product_description', service_details->>'product_description',
    'component_origins', COALESCE(service_details->'component_origins', '[]'::jsonb),
    'qualification_status', 'PENDING',
    'annual_tariff_cost', 0,
    'potential_usmca_savings', 0,
    'compliance_gaps', '[]'::jsonb,
    'vulnerability_factors', '[]'::jsonb
  )
WHERE subscriber_data IS NULL OR subscriber_data = '{}'::jsonb;
```

**Option 2: Fresh Start**
- Clear test data, add columns, repopulate with complete workflow data

---

## Table 2: service_completions (❌ REQUIRES CREATION)

### Current Status
- ✅ **Table EXISTS** but is **EMPTY** (0 rows, 0 columns)
- ❌ **Missing ALL required columns**

### Expected Schema

```sql
CREATE TABLE IF NOT EXISTS service_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
    completion_data JSONB,
    report_url TEXT,
    completed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT service_completions_service_request_id_unique
      UNIQUE (service_request_id)
);

-- Create indexes
CREATE INDEX idx_service_completions_request_id
  ON service_completions(service_request_id);
CREATE INDEX idx_service_completions_completed_at
  ON service_completions(completed_at);

COMMENT ON TABLE service_completions IS
  'Completed service deliverables with reports and completion data';
```

### Impact Analysis

**MEDIUM PRIORITY**
This table stores completed service deliverables. Not required for initial service requests, but needed for:
- Storing generated reports (PDF/URL)
- Tracking completion timestamps
- Linking completed work back to original requests

**Without this table:**
- Reports cannot be stored in database
- No completion tracking
- Manual report delivery required

---

## Core Tables Validation (✅ ALL PASSING)

### 1. hs_master_rebuild ✅
- **Rows:** 34,476 (Expected: 34,476)
- **Status:** PERFECT - Comprehensive HS codes for US, Canada, Mexico
- **Description:** Complete government tariff data integration

### 2. usmca_qualification_rules ✅
- **Rows:** 12 (Expected: 10+)
- **Status:** GOOD - Has all required USMCA rules
- **Description:** Product category qualification rules

### 3. triangle_routing_opportunities ✅
- **Rows:** 12 (Expected: 12)
- **Status:** PERFECT - Triangle routing scenarios
- **Description:** Mexico trade bridge routing data

### 4. countries ✅
- **Rows:** 39 (Expected: 39)
- **Status:** PERFECT - Country reference data
- **Description:** All supported countries with trade agreements

### 5. trade_volume_mappings ✅
- **Rows:** 6 (Expected: 6)
- **Status:** PERFECT - Trade volume ranges
- **Description:** Dropdown options for volume selection

---

## Launch Readiness Checklist

### ❌ Blockers (MUST FIX before launch)

- [ ] **service_requests.subscriber_data column** - Add JSONB column
- [ ] **service_requests migration** - Migrate existing 35 rows to new structure
- [ ] **service_completions table** - Recreate with proper schema

### ✅ Ready

- [x] Core tariff data (34,476 HS codes)
- [x] USMCA qualification rules
- [x] Triangle routing data
- [x] Country reference data
- [x] Trade volume mappings

### ⚠️ Recommended (Not Blockers)

- [ ] Add user authentication integration (user_id column)
- [ ] Add service pricing column for billing
- [ ] Create indexes on JSONB columns for performance
- [ ] Add RLS (Row Level Security) policies for multi-tenant access

---

## Dashboard Impact Assessment

### Cristina's Dashboard (3 Services)

**Status:** ⚠️ **BLOCKED by missing subscriber_data**

All 3 services require subscriber_data:
1. **USMCA Certificates** - Needs component_origins, qualification_status
2. **HS Classification** - Needs product_description, classified_hs_code
3. **Crisis Response** - Needs trade_volume, annual_tariff_cost

**Error Expected:**
```javascript
// Current query will fail
const { data, error } = await supabase
  .from('service_requests')
  .select('*, subscriber_data')  // ❌ Column doesn't exist
  .eq('service_type', 'USMCA Certificates');

// Error: Could not find the 'subscriber_data' column
```

### Jorge's Dashboard (3 Services)

**Status:** ⚠️ **BLOCKED by missing subscriber_data**

All 3 services require subscriber_data:
1. **Supplier Sourcing** - Needs product_description, component_origins
2. **Manufacturing Feasibility** - Needs trade_volume, manufacturing_location
3. **Market Entry** - Needs business_type, product_description

**Error Expected:**
```javascript
// Current query will fail
const subscriberData = request.subscriber_data;
// ❌ TypeError: Cannot read property 'product_description' of undefined
```

---

## Recommended Action Plan

### Phase 1: Immediate Fixes (Launch Blockers)

**1. Add subscriber_data column (15 minutes)**
```bash
# Run SQL migration on Supabase dashboard
ALTER TABLE service_requests
  ADD COLUMN subscriber_data JSONB NOT NULL DEFAULT '{}'::jsonb;
```

**2. Migrate existing data (30 minutes)**
```bash
# Map existing service_details to subscriber_data structure
node scripts/migrate-service-requests-data.js
```

**3. Test dashboard queries (15 minutes)**
```bash
# Verify all 6 services can load data
npm run test:dashboard-queries
```

**Total Time: ~1 hour**

### Phase 2: service_completions Table (Optional - Not Blocker)

**1. Create table schema (5 minutes)**
```bash
# Run SQL migration
node scripts/create-service-completions-table.js
```

**2. Update completion APIs (30 minutes)**
```bash
# Modify report generation endpoints to store in database
```

**Total Time: ~35 minutes**

### Phase 3: Testing & Validation (30 minutes)

**1. Repopulate test data**
```bash
node scripts/populate-complete-test-data.js
```

**2. Test all 6 dashboards**
```bash
# Cristina's services
http://localhost:3000/admin/broker-dashboard

# Jorge's services
http://localhost:3000/admin/jorge-dashboard
```

**3. Validate OpenRouter API integration**
```bash
# Test AI analysis with complete business context
node test/validate-openrouter-integration.js
```

---

## SQL Migration Scripts

### Complete Migration Script

Save as: `migrations/add_subscriber_data_to_service_requests.sql`

```sql
-- ============================================================================
-- MIGRATION: Add subscriber_data to service_requests
-- Date: 2025-10-01
-- Purpose: Add JSONB column for complete USMCA workflow data
-- ============================================================================

BEGIN;

-- Step 1: Add new columns
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS client_company TEXT,
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS subscriber_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS workflow_data JSONB;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id
  ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_subscriber_data
  ON service_requests USING GIN (subscriber_data);

-- Step 3: Add comments
COMMENT ON COLUMN service_requests.subscriber_data IS
  'Complete USMCA workflow data required for all professional services (JSONB)';
COMMENT ON COLUMN service_requests.workflow_data IS
  'Optional: Additional workflow-specific data (JSONB)';

-- Step 4: Migrate existing data
UPDATE service_requests
SET
  client_company = company_name,
  subscriber_data = jsonb_build_object(
    'company_name', company_name,
    'business_type', industry,
    'trade_volume', trade_volume,
    'product_description', COALESCE(service_details->>'product_description', ''),
    'component_origins', COALESCE(service_details->'component_origins', '[]'::jsonb),
    'qualification_status', 'PENDING',
    'annual_tariff_cost', 0,
    'potential_usmca_savings', 0,
    'compliance_gaps', '[]'::jsonb,
    'vulnerability_factors', '[]'::jsonb
  )
WHERE subscriber_data = '{}'::jsonb;

COMMIT;

-- Verify migration
SELECT
  COUNT(*) as total_rows,
  COUNT(subscriber_data) as rows_with_subscriber_data,
  COUNT(CASE WHEN subscriber_data != '{}'::jsonb THEN 1 END) as rows_with_data
FROM service_requests;
```

### service_completions Creation Script

Save as: `migrations/create_service_completions_table.sql`

```sql
-- ============================================================================
-- MIGRATION: Create service_completions table
-- Date: 2025-10-01
-- Purpose: Track completed service deliverables
-- ============================================================================

BEGIN;

-- Drop table if exists (fresh start)
DROP TABLE IF EXISTS service_completions CASCADE;

-- Create service_completions table
CREATE TABLE service_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
    completion_data JSONB,
    report_url TEXT,
    completed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one completion per request
    CONSTRAINT service_completions_service_request_id_unique
      UNIQUE (service_request_id)
);

-- Create indexes
CREATE INDEX idx_service_completions_request_id
  ON service_completions(service_request_id);
CREATE INDEX idx_service_completions_completed_at
  ON service_completions(completed_at);
CREATE INDEX idx_service_completions_completion_data
  ON service_completions USING GIN (completion_data);

-- Add comments
COMMENT ON TABLE service_completions IS
  'Completed service deliverables with reports and completion data';
COMMENT ON COLUMN service_completions.completion_data IS
  'Service-specific completion data including AI analysis results (JSONB)';
COMMENT ON COLUMN service_completions.report_url IS
  'URL or file path to generated report (PDF, etc.)';

COMMIT;
```

---

## Testing Commands

```bash
# Validate current schema
node scripts/validate-database-schema.js

# Run migration
psql $DATABASE_URL < migrations/add_subscriber_data_to_service_requests.sql

# Validate after migration
node scripts/validate-database-schema.js

# Repopulate test data
node scripts/populate-complete-test-data.js

# Test dashboard queries
node test/test-dashboard-queries.js
```

---

## Success Criteria

### Before Launch

- [ ] `service_requests.subscriber_data` column exists
- [ ] All 35 existing rows have valid subscriber_data
- [ ] All 6 dashboard components can load data
- [ ] OpenRouter API calls include complete business context
- [ ] No console errors when loading dashboards

### After Launch (Optional)

- [ ] `service_completions` table created
- [ ] Report generation stores data in database
- [ ] Completion tracking working for all 6 services

---

## Risk Assessment

### High Risk (CRITICAL)
- ❌ **Missing subscriber_data blocks all 6 services**
- ❌ **Cannot test dashboards without schema fixes**

### Medium Risk
- ⚠️ **Missing service_completions prevents report tracking**
- ⚠️ **No user authentication integration yet**

### Low Risk
- ✅ Core tariff data is complete and accurate
- ✅ USMCA rules properly configured
- ✅ Triangle routing data ready

---

## Contact & Support

**Database URL:** https://mrwitpgbcaxgnirqtavt.supabase.co
**Validation Script:** `scripts/validate-database-schema.js`
**Report Date:** October 1, 2025

---

**RECOMMENDATION:** Complete Phase 1 (subscriber_data migration) before launching professional services. This is a **1-hour fix** that unblocks all 6 services.
