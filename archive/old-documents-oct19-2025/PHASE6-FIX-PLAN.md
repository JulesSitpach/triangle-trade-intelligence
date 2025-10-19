# PHASE 6: SYSTEMATIC FIX PLAN

**Generated**: January 2025
**Status**: READY TO EXECUTE
**Estimated Time**: 12-16 hours

This document provides step-by-step instructions to fix all 14 critical issues identified in the audit.

---

## 🎯 FIX EXECUTION ORDER

Fixes are ordered by dependency - fix foundational issues first, then build on top.

---

## FIX #1: Consolidate Migration Folders (HIGH PRIORITY)

**Issue**: Two migration folders causing confusion
- `/database/migrations/` → 3 files
- `/migrations/` → 20+ files

**Root Cause**: Historical accumulation of migrations in different folders

**Fix Steps**:

1. **Review all migrations in both folders**:
   ```bash
   ls -la database/migrations/*.sql
   ls -la migrations/*.sql
   ```

2. **Identify duplicates and conflicts**:
   - Check if any tables are defined in both places
   - Verify which version is correct

3. **Consolidate to single `/migrations` folder**:
   ```bash
   # Keep /migrations as primary
   # Move unique migrations from /database/migrations
   cp database/migrations/001_create_hts_tariff_rates_2025.sql migrations/017_hts_tariff_rates_2025.sql
   ```

4. **Archive old folder**:
   ```bash
   mv database/migrations database/migrations.ARCHIVE.20250115
   ```

5. **Update migration runner scripts**:
   - `scripts/run-database-migrations.js` → Point to `/migrations` only

6. **Document migration order** in `migrations/README.md`

**Estimated Time**: 1 hour

---

## FIX #2: Create Missing service_requests Table Migration

**Issue**: `service_requests` table used everywhere but no CREATE TABLE migration

**Root Cause**: Table may have been created manually or migration was lost

**Fix Steps**:

1. **Extract current table schema from Supabase**:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT column_name, data_type, character_maximum_length, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'service_requests'
   ORDER BY ordinal_position;
   ```

2. **Create migration file** `migrations/018_create_service_requests_table.sql`:
   ```sql
   CREATE TABLE IF NOT EXISTS service_requests (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     service_type TEXT NOT NULL,
     company_name TEXT NOT NULL,
     contact_name TEXT NOT NULL,
     email TEXT NOT NULL,
     phone TEXT,
     industry TEXT,
     trade_volume DECIMAL(15,2),

     assigned_to TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'pending',
     priority TEXT DEFAULT 'medium',

     timeline TEXT,
     budget_range TEXT,

     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),

     -- Client consent
     data_storage_consent BOOLEAN NOT NULL DEFAULT false,
     consent_timestamp TIMESTAMPTZ,
     privacy_policy_version TEXT,
     consent_ip_address TEXT,
     consent_user_agent TEXT,

     -- JSONB fields
     service_details JSONB,
     workflow_data JSONB,
     subscriber_data JSONB,

     -- Consultation tracking
     consultation_status TEXT,
     consultation_duration TEXT,
     next_steps TEXT,

     CONSTRAINT valid_service_type CHECK (service_type IN (
       'trade-health-check', 'usmca-advantage', 'supply-chain-optimization',
       'pathfinder', 'supply-chain-resilience', 'crisis-navigator'
     )),
     CONSTRAINT valid_status CHECK (status IN (
       'pending_payment', 'pending', 'in_progress', 'research_in_progress',
       'proposal_sent', 'completed', 'cancelled', 'pending_schedule',
       'scheduled', 'consultation_completed'
     ))
   );

   -- Indexes
   CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_to
     ON service_requests(assigned_to);
   CREATE INDEX IF NOT EXISTS idx_service_requests_status
     ON service_requests(status);
   CREATE INDEX IF NOT EXISTS idx_service_requests_created_at
     ON service_requests(created_at DESC);

   -- Updated_at trigger
   CREATE TRIGGER update_service_requests_updated_at
     BEFORE UPDATE ON service_requests
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
   ```

3. **Run migration**:
   ```bash
   npm run db:migrate
   ```

**Estimated Time**: 1 hour

---

## FIX #3: Standardize subscriber_data vs workflow_data

**Issue**: Two field names for same concept in service_requests table

**Root Cause**: Naming evolution during development

**Fix Steps**:

1. **Decision**: Use `subscriber_data` as primary field name (more descriptive)

2. **Update database**:
   ```sql
   -- Add migration: migrations/019_standardize_subscriber_data.sql
   -- Copy workflow_data to subscriber_data if null
   UPDATE service_requests
   SET subscriber_data = workflow_data
   WHERE subscriber_data IS NULL AND workflow_data IS NOT NULL;

   -- Drop workflow_data column (optional - can keep for backwards compat)
   -- ALTER TABLE service_requests DROP COLUMN workflow_data;
   ```

3. **Update ALL API endpoints** to use `subscriber_data`:
   ```javascript
   // Find all occurrences:
   grep -r "workflow_data" pages/api/ --include="*.js"

   // Replace with subscriber_data
   ```

4. **Update admin dashboards**:
   - `pages/api/admin/service-requests.js` line 135
   - All service tab components

**Estimated Time**: 2 hours

---

## FIX #4: Fix hs_code Naming Inconsistency (CRITICAL - 3,793 occurrences)

**Issue**: Mix of `hs_code` (snake_case) and `hsCode` (camelCase)

**Decision**: Use `hs_code` everywhere (matches database)

**Fix Steps**:

1. **Find all camelCase occurrences**:
   ```bash
   grep -rn "hsCode" --include="*.js" --include="*.jsx" --include="*.ts" | wc -l
   ```

2. **Create replacement script**:
   ```javascript
   // scripts/fix-hs-code-naming.js
   const fs = require('fs');
   const path = require('path');

   function fixFile(filePath) {
     let content = fs.readFileSync(filePath, 'utf-8');
     let changed = false;

     // Replace hsCode with hs_code
     const patterns = [
       { from: /\.hsCode/g, to: '.hs_code' },
       { from: /\bhsCode:/g, to: 'hs_code:' },
       { from: /\bhsCode\s*=/g, to: 'hs_code =' },
       { from: /\{hsCode\}/g, to: '{hs_code}' },
       { from: /\{.*hsCode.*\}/g, to: (match) => match.replace(/hsCode/g, 'hs_code') }
     ];

     patterns.forEach(({ from, to }) => {
       if (content.match(from)) {
         content = content.replace(from, to);
         changed = true;
       }
     });

     if (changed) {
       fs.writeFileSync(filePath, content, 'utf-8');
       console.log(`✅ Fixed: ${filePath}`);
     }
   }

   // Run on all JS/JSX files
   ```

3. **Run replacement systematically by directory**:
   ```bash
   node scripts/fix-hs-code-naming.js components/
   node scripts/fix-hs-code-naming.js pages/api/
   node scripts/fix-hs-code-naming.js lib/
   ```

4. **Manual review of critical files**:
   - `components/workflow/ComponentOriginsStepEnhanced.js`
   - `components/shared/USMCAAdvantageTab.js`
   - `pages/api/ai-usmca-complete-analysis.js`

**Estimated Time**: 3-4 hours (due to high occurrence count)

---

## FIX #5: Fix component_origins Naming Inconsistency (327 occurrences)

**Issue**: Mix of `component_origins` and `componentOrigins`

**Decision**: Use `component_origins` everywhere

**Fix Steps**:

1. **Similar to Fix #4**, create replacement script:
   ```javascript
   // scripts/fix-component-origins-naming.js
   const patterns = [
     { from: /\.componentOrigins/g, to: '.component_origins' },
     { from: /\bcomponentOrigins:/g, to: 'component_origins:' },
     { from: /\bcomponentOrigins\s*=/g, to: 'component_origins =' },
     { from: /\{componentOrigins\}/g, to: '{component_origins}' }
   ];
   ```

2. **Run on all files**

**Estimated Time**: 2 hours

---

## FIX #6: Fix company_name Inconsistency (40 occurrences)

**Decision**: Use `company_name` everywhere

**Fix Steps**: Same pattern as Fix #4 & #5

**Estimated Time**: 30 minutes

---

## FIX #7: Fix subscription_tier Inconsistency (85 occurrences)

**Decision**: Use `subscription_tier` everywhere

**Fix Steps**: Same pattern as Fix #4 & #5

**Estimated Time**: 1 hour

---

## FIX #8: Add Validation to All API Endpoints

**Issue**: No validation before processing data

**Fix Steps**:

1. **Update `/api/ai-usmca-complete-analysis`**:
   ```javascript
   import { validateWorkflowFormData } from '../../lib/validation';

   export default async function handler(req, res) {
     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method not allowed' });
     }

     // VALIDATE INPUT
     const validation = validateWorkflowFormData(req.body);
     if (!validation.isValid) {
       return res.status(400).json({
         success: false,
         error: 'Invalid workflow data',
         details: validation.errors
       });
     }

     // Continue with validated data...
   }
   ```

2. **Update `/api/admin/service-requests`**:
   ```javascript
   import { validateServiceRequest, validateSubscriberData } from '../../../lib/validation';

   // Validate service request creation
   const validation = validateServiceRequest(serviceRequest);
   if (!validation.isValid) {
     return res.status(400).json({
       success: false,
       error: 'Invalid service request',
       details: validation.errors
     });
   }

   // Validate subscriber_data if present
   if (workflow_data) {
     const subValidation = validateSubscriberData(workflow_data);
     if (!subValidation.isValid) {
       console.warn('⚠️ subscriber_data validation failed:', subValidation.errors);
       // Continue but log warning
     }
   }
   ```

3. **Update `/api/auth/me`**:
   ```javascript
   import { validateAuthResponse } from '../../lib/validation';

   // Before returning response
   const response = {
     success: true,
     authenticated: true,
     user: {...}
   };

   // Validate before sending
   const validation = validateAuthResponse(response);
   if (!validation.isValid) {
     console.error('❌ Auth response validation failed:', validation.errors);
   }

   return res.status(200).json(response);
   ```

4. **Repeat for all API endpoints** (30+ files)

**Estimated Time**: 4-5 hours

---

## FIX #9: Add Database Schema Validation

**Issue**: No validation before saving to database

**Fix Steps**:

1. **Create database save wrapper**:
   ```javascript
   // lib/database/validated-save.js
   import { validateSubscriberData } from '../validation';

   export async function saveServiceRequest(supabase, serviceRequest) {
     // Validate before save
     if (serviceRequest.subscriber_data) {
       const validation = validateSubscriberData(serviceRequest.subscriber_data);
       if (!validation.isValid) {
         throw new Error(`Invalid subscriber_data: ${validation.errors.join(', ')}`);
       }
     }

     // Save to database
     const { data, error } = await supabase
       .from('service_requests')
       .insert([serviceRequest])
       .select();

     if (error) throw error;
     return data[0];
   }
   ```

2. **Use in all database operations**

**Estimated Time**: 2 hours

---

## FIX #10: Fix Component Enrichment Data Flow

**Issue**: Enriched fields use inconsistent naming

**Fix Steps**:

1. **Update enrichment API** `/api/enhance-component-details.js`:
   ```javascript
   // Ensure all enriched fields use snake_case
   const enrichedComponent = {
     ...component,
     hs_code: hsCode,           // snake_case
     hs_description: description, // snake_case
     mfn_rate: mfnRate,          // snake_case
     usmca_rate: usmcaRate,      // snake_case
     savings_amount: savingsAmount,
     savings_percentage: savingsPercentage,
     ai_confidence: confidence,
     enriched: true,
     enrichment_timestamp: new Date().toISOString()
   };
   ```

2. **Update admin dashboards to expect snake_case**:
   ```javascript
   // components/shared/USMCAAdvantageTab.js
   <td>{comp.hs_code || 'Not classified'}</td>
   <td>{comp.mfn_rate ? (comp.mfn_rate * 100).toFixed(2) + '%' : 'N/A'}</td>
   <td>{comp.usmca_rate ? (comp.usmca_rate * 100).toFixed(2) + '%' : 'N/A'}</td>
   ```

**Estimated Time**: 1 hour

---

## FIX #11: Add localStorage Validation

**Issue**: No validation of localStorage data

**Fix Steps**:

1. **Create localStorage helpers**:
   ```javascript
   // lib/utils/validated-storage.js
   import { validateWorkflowFormData, USMCAWorkflowResultsSchema } from '../validation';

   export function saveWorkflowData(key, data) {
     // Validate before saving
     const validation = validateWorkflowFormData(data);
     if (!validation.isValid) {
       console.warn('⚠️ Saving invalid workflow data:', validation.errors);
     }

     localStorage.setItem(key, JSON.stringify(data));
   }

   export function loadWorkflowData(key) {
     const data = localStorage.getItem(key);
     if (!data) return null;

     try {
       const parsed = JSON.parse(data);
       const validation = validateWorkflowFormData(parsed);

       if (!validation.isValid) {
         console.warn('⚠️ Loaded data is invalid:', validation.errors);
         // Return null or fix data
         return null;
       }

       return parsed;
     } catch (error) {
       console.error('❌ Failed to parse localStorage data:', error);
       return null;
     }
   }
   ```

2. **Replace all `localStorage.setItem/getItem` calls**

**Estimated Time**: 1 hour

---

## 📊 FIX EXECUTION SUMMARY

| Fix # | Issue | Priority | Est. Time |
|-------|-------|----------|-----------|
| 1 | Consolidate migrations | HIGH | 1h |
| 2 | Create service_requests migration | HIGH | 1h |
| 3 | Standardize subscriber_data | HIGH | 2h |
| 4 | Fix hs_code naming | CRITICAL | 3-4h |
| 5 | Fix component_origins naming | HIGH | 2h |
| 6 | Fix company_name naming | MEDIUM | 30m |
| 7 | Fix subscription_tier naming | MEDIUM | 1h |
| 8 | Add API validation | CRITICAL | 4-5h |
| 9 | Add database validation | HIGH | 2h |
| 10 | Fix enrichment flow | HIGH | 1h |
| 11 | Add localStorage validation | MEDIUM | 1h |

**TOTAL ESTIMATED TIME**: 19-21 hours

---

## 🎯 RECOMMENDED EXECUTION SEQUENCE

### Day 1 (6-8 hours):
1. Fix #1: Consolidate migrations
2. Fix #2: Create service_requests migration
3. Fix #3: Standardize subscriber_data
4. **TEST DATABASE** - Verify all tables exist

### Day 2 (8-10 hours):
5. Fix #4: Fix hs_code naming (longest task)
6. Fix #5: Fix component_origins naming
7. **TEST USER WORKFLOW** - Verify data flows correctly

### Day 3 (5-6 hours):
8. Fix #6-7: Fix remaining naming issues
9. Fix #8: Add API validation
10. **TEST API ENDPOINTS** - Verify validation works

### Day 4 (4-5 hours):
11. Fix #9-10: Add database validation and fix enrichment
12. Fix #11: Add localStorage validation
13. **FULL INTEGRATION TEST** - Test complete user journey

---

*Ready for execution after user approval*
