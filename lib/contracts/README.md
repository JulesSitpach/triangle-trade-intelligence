# Data Contract System - Preventing Field Name Chaos

## The Problem We're Solving

**Every layer of the application uses different field names for the same data:**

```javascript
// Database stores
{ mfn_rate: 25.00, section_301: 25, origin_country: 'CN' }

// API expects
{ mfn_rate: 25, section_301: 25, origin_country: 'CN' }  // Inconsistent!

// Frontend wants
{ mfnRate: 25, section301: 25, originCountry: 'CN' }

// AI returns
{ tariffRate: 25, section_301_tariff: 25, origin_country: 'CN' }
```

**Result:** Adding one field breaks 15 files. Data types change silently. Developers spend 3 hours debugging why `mfn_rate` became `undefined` in the frontend.

## The Solution: Data Contract Pattern

**One file defines all field names, types, and transformations across all layers.**

### Files in This Directory

#### 1. `COMPONENT_DATA_CONTRACT.js`
**Single source of truth for all component field definitions.**

For each field, it defines:
- ✅ What the field means (label, description)
- ✅ How each layer names it (database, api, frontend, ai)
- ✅ What data type it is in each layer
- ✅ How to transform between layers
- ✅ Validation rules (min/max, pattern, required)
- ✅ Examples and fallback values

**Example:**
```javascript
const schema = COMPONENT_DATA_CONTRACT.fields.mfn_rate;

// What it's called in different layers
schema.names.database  // "mfn_rate"
schema.names.api       // "mfn_rate"
schema.names.frontend  // "mfnRate"
schema.names.ai        // "base_mfn_rate"

// How to transform
COMPONENT_DATA_CONTRACT.transform(25.00, 'database', 'api', 'mfn_rate')
// Returns: 25 (string to number conversion)

// Validation
COMPONENT_DATA_CONTRACT.validate('mfn_rate', 25)
// Returns: { valid: true, errors: [] }
```

#### 2. `component-transformer.js`
**Utilities that enforce the contract.**

Functions:
- `transformDatabaseToAPI(component)` - Converts database records to API format
- `transformAPIToFrontend(component)` - Converts API to frontend (field renaming)
- `transformAIToDatabase(component)` - Validates & converts AI response
- `validateComponent(component, layer)` - Catches missing/wrong data
- `compareComponents(before, after)` - Debug tool to see what changed

**Example:**
```javascript
import { transformDatabaseToAPI, validateComponent } from './component-transformer.js';

// Database returns string values
const dbRecord = {
  description: 'Microprocessor',
  mfn_rate: '25.00',        // String
  origin_country: 'cn',      // Lowercase
  value_percentage: '35'     // String
};

// Transform automatically handles type conversion + field normalization
const apiComponent = transformDatabaseToAPI(dbRecord);
// Result: { description: 'Microprocessor', mfn_rate: 25, origin_country: 'CN', ... }

// Validate before sending to user
const validation = validateComponent(apiComponent, 'api');
if (!validation.valid) {
  throw new Error(validation.errors.join('\n'));
}
```

## How to Use in Your Code

### In API Endpoints

```javascript
import { transformDatabaseToAPI, validateComponent } from '../contracts/component-transformer.js';

export default async function handler(req, res) {
  try {
    // Get components from database
    const dbComponents = await supabase.from('components').select('*');

    // Transform to API format (handles type conversion + field names)
    const apiComponents = dbComponents.map(transformDatabaseToAPI);

    // Validate before response (LOUD if data is missing)
    const validation = validateComponent(apiComponents[0], 'api');
    if (!validation.valid) {
      throw new Error(`API validation failed: ${validation.errors.join('; ')}`);
    }

    // Send to frontend
    return res.json({ components: apiComponents });

  } catch (error) {
    console.error('❌ Transformation error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
```

### In Frontend Components

```javascript
import { transformAPIToFrontend } from '../contracts/component-transformer.js';

export default function ComponentTable({ apiData }) {
  // Transform API data to frontend format
  const components = apiData.map(transformAPIToFrontend);

  return (
    <table>
      {components.map(c => (
        <tr key={c.hsCode}>
          <td>{c.description}</td>
          <td>{c.mfnRate}%</td>          {/* Field auto-renamed from mfn_rate */}
          <td>{c.savingsPercentage}%</td> {/* Field auto-renamed from savings_percentage */}
        </tr>
      ))}
    </table>
  );
}
```

### Adding a New Field

**The Data Contract way (correct):**

1. Add field definition to `COMPONENT_DATA_CONTRACT.js`:
```javascript
export const COMPONENT_DATA_CONTRACT = {
  fields: {
    // ... existing fields ...

    new_field: {
      label: 'My New Field',
      category: 'classification',
      names: {
        database: 'new_field',
        api: 'new_field',
        frontend: 'newField',        // Automatically camelCase
        ai: 'new_field_name'
      },
      types: {
        database: 'TEXT',
        api: 'string',
        frontend: 'string',
        ai: 'string'
      },
      required: true,
      transform: {
        database_to_api: (val) => val?.trim() || '',
        api_to_frontend: (val) => val || 'N/A',
        ai_to_database: (val) => val?.substring(0, 255) || ''
      }
    }
  }
};
```

2. Use it in your code:
```javascript
// API automatically uses new field
const transformed = transformDatabaseToAPI({ new_field: 'value' });
// Works automatically - no other changes needed!

// Frontend automatically uses camelCase
const frontend = transformAPIToFrontend(transformed);
// frontend.newField === 'value'  ✅ Automatic!
```

**The old way (broken):**
- Add field to database migration
- Update 3 API endpoints to handle it
- Update frontend component to display it
- Hope everyone remembers the same field name
- Debug when someone uses `newField` instead of `new_field`

## Fixing Common Bugs

### Bug: Component shows 0.0% instead of actual rate

**Before (debugging nightmare):**
```
Server log: section_301: 25
Browser console: rawSection301: 0
Hours spent: 3+

Root cause: API sent raw components instead of enriched components
```

**After (catches immediately):**
```javascript
// Before sending API response, validate
validateComponent(result.component_origins, 'api');

// Output if bug exists:
// ❌ VALIDATION FAILED: Components missing tariff data
//   Component 1 "Microprocessor": All tariff fields are empty/zero
//   [mfn:undefined, usmca:undefined, s301:undefined]
```

### Bug: Frontend expects `mfnRate` but API sends `mfn_rate`

**Before:**
- Component receives `{ mfn_rate: 25 }`
- Code accesses `component.mfnRate`
- Result: undefined in frontend
- Frontend shows empty

**After:**
```javascript
// Automatic field renaming
const component = transformAPIToFrontend(apiData);
// Returns: { mfnRate: 25 }  ✅ Correct field name

// Type conversion also automatic
const rate = component.mfnRate;  // Always a number, never a string
```

### Bug: Database returns string "25.00" but calculator expects number 25

**Before:**
```javascript
const savings = mfn_rate - usmca_rate;
// "25.00" - 0 = "25.000" ❌ Wrong type!
```

**After:**
```javascript
const component = transformDatabaseToAPI(dbRecord);
// mfn_rate is guaranteed to be a number
const savings = component.mfn_rate - component.usmca_rate;
// 25 - 0 = 25 ✅ Correct!
```

## Debugging Tools

### See what changed in transformation

```javascript
import { compareComponents } from '../contracts/component-transformer.js';

const before = {
  mfn_rate: '25.00',
  section_301: '25',
  origin_country: 'cn'
};

const after = transformDatabaseToAPI(before);

compareComponents(before, after, 'Database → API');

// Output:
// 📊 COMPONENT COMPARISON: Database → API
// ============================================================
//   mfn_rate:
//     Before: "25.00" (string)
//     After:  25 (number)
//   origin_country:
//     Before: "cn" (string)
//     After:  "CN" (string)
//   section_301:
//     Before: "25" (string)
//     After:  25 (number)
//
// Total changes: 3
// ============================================================
```

### Batch transform with error reporting

```javascript
import { transformBatch } from '../contracts/component-transformer.js';

const { success, errors, failedCount } = transformBatch(
  dbComponents,
  'database',
  'api'
);

console.log(`✅ Transformed ${success.length}, ❌ Failed ${failedCount}`);

errors.forEach(({ index, component, error }) => {
  console.error(`Component ${index} "${component}": ${error}`);
});
```

## Next Steps: Integration

This system is ready to use, but adoption is gradual:

1. **Phase 1 (Done):** Create contract + transformers
2. **Phase 2 (Next):** Add validation to API response layer
3. **Phase 3:** Update existing API endpoints to use transformers
4. **Phase 4:** Update frontend components to use transformers
5. **Phase 5:** Remove all manual field name handling

## Key Principle

> **Every data transformation goes through the contract.**
>
> No more hardcoded field name mapping. No more silent type conversions. No more 3-hour debugging sessions.
>
> One file. One source of truth. Works everywhere.

## Questions?

- **How do I add a new field?** Update `COMPONENT_DATA_CONTRACT.fields`, transformers auto-update
- **What if I forgot the field in the contract?** Validation will fail loudly with a detailed error
- **Can I use different field names in different places?** Yes, define them in `names.` section of the field definition
- **What if transformation logic is complex?** Add a custom transform function in the field definition

---

**Commit:** `c78c81f` - Added data contract layer to prevent field name chaos
