# Workflow Completion Validation System

**Created:** November 7, 2025
**Purpose:** Prevent incomplete/corrupted workflows from breaking dashboard display

---

## Problem Statement

The Triangle Trade Intelligence platform stores workflow data in a JSONB column (`workflow_data`) in the `workflow_completions` table. The dashboard reads nested fields from this JSONB structure to display:

- Company information
- Component origins with tariff data
- Regional content percentage
- Qualification status
- Savings calculations

**If any of these fields are missing, the dashboard breaks silently** - showing blank data, "undefined", or causing components to not render.

This validation system **fails loudly** when required data is missing, preventing corrupted workflows from being saved.

---

## Architecture

### Files

1. **`lib/validation/workflow-completion-validator.js`**
   - Core validation logic
   - Exports 3 functions:
     - `validateWorkflowCompletionData()` - Basic validation for all workflows
     - `validateQualifiedWorkflow()` - Strict validation for QUALIFIED workflows only
     - `getValidationReport()` - Detailed validation report for debugging

2. **`pages/api/workflow-complete.js`** (updated)
   - Calls validator before saving to database
   - Rejects save if validation fails (HTTP 400)
   - Logs errors to `dev_issues` table

3. **`scripts/validate-existing-workflows.js`**
   - Audit script to validate existing workflows in database
   - Generates report of valid vs invalid workflows
   - Suggests SQL fixes for invalid data

---

## Validation Rules

### Level 1: Top-Level Workflow Data

```javascript
workflow_data: {
  qualification_result: { ... },  // ❌ ERROR if missing
  company: { ... },               // ⚠️  WARNING if missing
  product: { ... }                // ⚠️  WARNING if missing
}
```

### Level 2: qualification_result (CRITICAL)

```javascript
qualification_result: {
  status: "QUALIFIED" | "NOT_QUALIFIED",  // ❌ ERROR if missing or invalid
  component_origins: [                     // ❌ ERROR if missing/empty
    {
      origin_country: "CN",                // ❌ ERROR if missing
      value_percentage: 35,                // ❌ ERROR if missing
      hs_code: "8542.31.00",              // ⚠️  WARNING if missing
      description: "Microprocessor",       // ⚠️  WARNING if missing
      mfn_rate: 0.25,                     // ⚠️  WARNING if missing
      usmca_rate: 0                       // ⚠️  WARNING if missing
    }
  ],
  manufacturing_location: "MX",           // ❌ ERROR if missing
  regional_content: 65.5,                 // ❌ ERROR if missing
  required_threshold: 60                  // ⚠️  WARNING if missing
}
```

### Level 3: Company Data (for certificate generation)

```javascript
company: {
  company_name: "Acme Corp",              // ❌ ERROR if missing
  company_country: "US",                  // ❌ ERROR if missing
  destination_country: "MX",              // ❌ ERROR if missing
  industry_sector: "electronics"          // ⚠️  WARNING if missing
}
```

### Level 4: Product Data

```javascript
product: {
  hs_code: "8542.31.00",                  // ❌ ERROR if missing
  description: "Smartphone assembly"      // ⚠️  WARNING if missing
}
```

### QUALIFIED Workflow Strict Validation

For workflows with `qualification_result.status === "QUALIFIED"`, additional checks:

1. ✅ Must have `savings_calculation` or `annual_savings` data
2. ✅ All components must have `mfn_rate` or `base_mfn_rate`
3. ✅ RVC percentage must be >= threshold

---

## Usage

### In API Endpoints (Automatic)

The validation runs automatically in `/api/workflow-complete`:

```javascript
import { validateQualifiedWorkflow } from '../../lib/validation/workflow-completion-validator.js';

// Before saving to database
const validation = validateQualifiedWorkflow(workflowData, userId);

if (!validation.valid) {
  return res.status(400).json({
    success: false,
    error: 'Workflow data validation failed',
    validation_errors: validation.errors
  });
}

// Proceed with save only if valid
await supabase.from('workflow_completions').insert({ ... });
```

### Manual Validation (Testing)

```javascript
import { getValidationReport } from '../lib/validation/workflow-completion-validator.js';

const report = getValidationReport(workflowData, userId);

console.log('Validation Summary:', report.summary);
// {
//   status: 'PASS' | 'FAIL',
//   errorCount: 0,
//   warningCount: 2,
//   qualification: 'QUALIFIED',
//   componentCount: 4
// }

if (!report.valid) {
  console.error('Errors:', report.errors);
}

if (report.warnings.length > 0) {
  console.warn('Warnings:', report.warnings);
}
```

### Audit Existing Workflows

Run the validation script on all existing workflows:

```bash
node scripts/validate-existing-workflows.js
```

**Output:**
- ✅ Count of valid workflows
- ❌ Count of invalid workflows
- 📋 Detailed error report for each invalid workflow
- 💡 Suggested SQL fixes (DELETE or UPDATE to NOT_QUALIFIED)
- 🚀 Launch readiness check

---

## Error Handling

### Validation Errors (Block Save)

These prevent workflow from being saved:

- Missing `qualification_result`
- Missing `component_origins` array
- Empty `component_origins` array
- Component missing `origin_country`
- Component missing `value_percentage`
- Missing `manufacturing_location`
- Missing `regional_content`
- Missing `status` or invalid value
- (QUALIFIED only) Missing savings data
- (QUALIFIED only) Components without tariff rates
- (QUALIFIED only) RVC < threshold

### Validation Warnings (Save Anyway)

These allow save but log warnings:

- Missing `hs_code` on component
- Missing `description` on component
- Missing `mfn_rate` or `usmca_rate` on component
- Missing `required_threshold`
- Missing `industry_sector`
- Missing `product.description`

---

## Testing Checklist

### Before Launch

1. **Run validation on existing workflows:**
   ```bash
   node scripts/validate-existing-workflows.js
   ```

2. **Verify all QUALIFIED workflows pass:**
   - Check output for "✅ ALL WORKFLOWS VALID - READY FOR LAUNCH"
   - If any invalid, apply suggested SQL fixes

3. **Test new workflow creation:**
   - Create a test workflow with complete data → Should save ✅
   - Create a test workflow with missing `component_origins` → Should reject ❌
   - Create a test workflow with missing `manufacturing_location` → Should reject ❌

4. **Test dashboard display:**
   - Valid workflows should display all data correctly
   - No "undefined" or blank fields
   - Component table shows origin countries and percentages

---

## Troubleshooting

### "Workflow data validation failed" Error

**Symptoms:**
```json
{
  "success": false,
  "error": "Workflow data validation failed - incomplete or corrupted data",
  "validation_errors": [
    "qualification_result.component_origins is missing",
    "qualification_result.manufacturing_location is missing"
  ]
}
```

**Cause:**
AI response did not include required fields in the expected JSONB structure.

**Fix:**
1. Check AI prompt in `lib/usmca/qualification-engine.js`
2. Verify AI is returning `qualification_result.component_origins` array
3. Check that each component has `origin_country` and `value_percentage`
4. Ensure `manufacturing_location` is set (should be MX, CA, or US)

### Dashboard Shows "undefined" for Components

**Symptoms:**
- Component table shows "undefined: undefined%"
- No tariff data displayed

**Cause:**
Workflow saved before validation was implemented (legacy data).

**Fix:**
```sql
-- Option 1: Mark as NOT_QUALIFIED (prevents display)
UPDATE workflow_completions
SET qualification_status = 'NOT_QUALIFIED'
WHERE id = 'bad-workflow-id';

-- Option 2: Delete entirely
DELETE FROM workflow_completions
WHERE id = 'bad-workflow-id';
```

Then ask user to re-run the workflow.

---

## Maintenance

### Adding New Required Fields

If a new field becomes required for dashboard display:

1. **Update validator** (`lib/validation/workflow-completion-validator.js`):
   ```javascript
   // Add new validation check
   if (!qualResult.new_required_field) {
     errors.push('qualification_result.new_required_field is missing');
   }
   ```

2. **Run audit script** to check existing workflows:
   ```bash
   node scripts/validate-existing-workflows.js
   ```

3. **Fix invalid workflows** using suggested SQL

4. **Update this README** with new field in validation rules

---

## Integration with DevIssue Logging

Failed validations are automatically logged to `dev_issues` table:

```javascript
{
  issue_type: 'validation_error',
  severity: 'high',
  component: 'workflow_completion',
  message: 'incomplete_workflow_data',
  context_data: {
    userId: 'user-uuid',
    errors: ['qualification_result.component_origins is missing'],
    warnings: ['component_origins[0].hs_code is missing'],
    has_qualification_result: true,
    has_component_origins: false,
    component_count: 0
  }
}
```

Monitor `dev_issues` table for recurring validation failures.

---

## Launch Checklist

Before deploying to production:

- [ ] Run `node scripts/validate-existing-workflows.js`
- [ ] Verify output shows "✅ ALL WORKFLOWS VALID - READY FOR LAUNCH"
- [ ] Test creating new QUALIFIED workflow → saves successfully
- [ ] Test creating workflow with missing data → rejects with 400 error
- [ ] Verify dashboard displays all fields correctly
- [ ] Check `dev_issues` table for validation errors (should be empty)

---

## Summary

This validation system ensures that **ONLY complete, valid workflows are saved to the database**. This prevents:

- ❌ Dashboard displaying "undefined"
- ❌ Empty component tables
- ❌ Missing tariff data
- ❌ Certificate generation failures

By failing loudly at save time, we catch data integrity issues immediately rather than discovering them when users try to view their workflows.
