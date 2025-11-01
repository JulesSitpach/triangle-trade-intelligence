# Schema Validation Layer Usage Guide

## Problem This Solves

**Before:**
```javascript
// ❌ Silent failure - returns empty data
const { data } = await supabase
  .from('workflow_sessions')
  .select('workflow_data');  // Column doesn't exist!

console.log(data);  // null or undefined - no error thrown!
```

**After:**
```javascript
// ✅ Immediate descriptive error
const { data } = await supabase
  .from('workflow_sessions')
  .select('workflow_data');

// THROWS: [SCHEMA VALIDATION] Column "workflow_data" does not exist in "workflow_sessions".
// Use "data" instead (workflow_sessions has "data", not "workflow_data")
```

---

## Quick Start

### Option 1: Use Validated Client (Recommended)

Replace your Supabase client creation with the validated version:

**Before:**
```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);
```

**After:**
```javascript
const { createValidatedClient } = require('./lib/database/validated-supabase');
const supabase = createValidatedClient(url, key);
```

That's it! All queries will now be validated automatically.

---

### Option 2: Manual Validation (For Existing Code)

If you don't want to replace the client, use manual validation:

```javascript
const { validateQuery } = require('./lib/database/validated-supabase');

// Validate before querying
const validation = validateQuery('workflow_sessions', 'select', 'workflow_data');
if (!validation.valid) {
  console.error(validation.error);
  return;
}

// Safe to query
const { data } = await supabase.from('workflow_sessions').select('workflow_data');
```

---

## Examples

### Example 1: Catch Wrong Column Name

```javascript
const { createValidatedClient } = require('./lib/database/validated-supabase');
const supabase = createValidatedClient(url, key);

// ❌ THROWS ERROR IMMEDIATELY
const { data } = await supabase
  .from('workflow_sessions')
  .select('workflow_data');

// Error message:
// [SCHEMA VALIDATION] SELECT query on "workflow_sessions":
// Column "workflow_data" does not exist in "workflow_sessions".
// Use "data" instead (workflow_sessions has "data", not "workflow_data")
```

### Example 2: Catch Wrong Table Name

```javascript
// ❌ THROWS ERROR IMMEDIATELY
const { data } = await supabase
  .from('certificates')
  .select('*');

// Error message:
// [SCHEMA VALIDATION] Table "certificates" does not exist.
// No "certificates" table - use workflow_completions.workflow_data.certificate instead
```

### Example 3: Catch Wrong Column in UPDATE

```javascript
// ❌ THROWS ERROR IMMEDIATELY
await supabase
  .from('workflow_sessions')
  .update({ workflow_data: { foo: 'bar' } })
  .eq('id', '123');

// Error message:
// [SCHEMA VALIDATION] UPDATE query on "workflow_sessions":
// Column "workflow_data" does not exist in "workflow_sessions".
// Use "data" instead (workflow_sessions has "data", not "workflow_data")
```

### Example 4: Catch Wrong Column in WHERE Clause

```javascript
// ❌ THROWS ERROR IMMEDIATELY
const { data } = await supabase
  .from('workflow_completions')
  .select('*')
  .eq('workflow_id', '123');

// Error message:
// [SCHEMA VALIDATION] WHERE clause on "workflow_completions":
// Column "workflow_id" does not exist in table "workflow_completions".
// Available columns: id, user_id, workflow_type, ...
```

---

## Migration Guide

### Step 1: Update Your API Files

**Old code:**
```javascript
const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data } = await supabase
    .from('workflow_sessions')
    .select('workflow_data');  // ❌ Silent failure

  return res.json(data);
}
```

**New code:**
```javascript
const { createValidatedClient } = require('./lib/database/validated-supabase');

export default async function handler(req, res) {
  const supabase = createValidatedClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data } = await supabase
    .from('workflow_sessions')
    .select('data');  // ✅ Correct column name

  return res.json(data);
}
```

### Step 2: Test Your API Endpoints

Run your API endpoints and check the logs. If you see validation errors:

```
[SCHEMA VALIDATION] Column "workflow_data" does not exist...
```

Fix the column name in your code.

---

## Disabling Validation (For Debugging)

If validation is blocking legitimate queries, temporarily disable it:

```javascript
const supabase = createValidatedClient(url, key, {
  skipValidation: true  // Disable validation
});
```

**Warning:** Only use this for debugging! Re-enable validation after fixing the issue.

---

## Maintaining the Schema

The schema is defined in `lib/database/schema.js`. When the database schema changes:

1. **Verify actual schema:**
   ```sql
   SELECT table_name, column_name, data_type
   FROM information_schema.columns
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

2. **Update schema.js:**
   - Add new columns to the `columns` array
   - Add new tables to the `TABLES` object
   - Update `commonMistakes` if you discover new patterns

3. **Update validation layer:**
   - If you add new query methods (like `.contains()`, `.overlap()`, etc.), add validation in `validated-supabase.js`

---

## Common Mistakes Caught by Validation

| Wrong | Correct | Table |
|-------|---------|-------|
| `workflow_data` | `data` | workflow_sessions |
| `data` | `workflow_data` | workflow_completions |
| `workflow_id` | `id` | All tables |
| `certificates` table | `workflow_completions.workflow_data.certificate` | N/A |
| `hs_code` | `hts8` | tariff_intelligence_master |

---

## Benefits

✅ **Immediate feedback** - Errors thrown at query time, not silently
✅ **Descriptive errors** - Know exactly what's wrong and how to fix it
✅ **Prevents data loss** - Can't accidentally query wrong columns
✅ **Self-documenting** - Schema file serves as documentation
✅ **Easy to integrate** - One-line change to existing code
✅ **Zero runtime overhead** - Only validates during development/debugging

---

## Troubleshooting

**Q: I'm getting validation errors but the column exists!**
A: Update `lib/database/schema.js` with the actual schema. Run the SQL query at the top of the schema file to verify.

**Q: Can I use this with RLS policies?**
A: Yes! Validation happens before the query is sent to Supabase, so RLS policies still apply.

**Q: Does this work with `.rpc()` calls?**
A: Not yet. RPC calls bypass the validation layer. Use manual validation for RPC calls.

**Q: What about performance?**
A: Validation is a simple object lookup (O(1)) - negligible performance impact.

---

## Next Steps

1. **Update one API file** - Test the validation layer with `pages/api/dashboard-data.js`
2. **Gradually migrate** - Replace `createClient` with `createValidatedClient` in other files
3. **Update schema** - Keep `lib/database/schema.js` in sync with database changes
4. **Report issues** - If validation catches something incorrect, update the schema or add to `commonMistakes`

---

## Example: Migrating dashboard-data.js

**Before (Silent failure):**
```javascript
const { data: sessionsRows } = await supabase
  .from('workflow_sessions')
  .select('*')
  .eq('user_id', userId);

const workflowData = row.workflow_data || {};  // Always empty!
```

**After (Immediate error):**
```javascript
const { createValidatedClient } = require('./lib/database/validated-supabase');
const supabase = createValidatedClient(url, key);

const { data: sessionsRows } = await supabase
  .from('workflow_sessions')
  .select('*')
  .eq('user_id', userId);

const workflowData = row.data || {};  // ✅ Correct column
```

If you tried to use `row.workflow_data`, you'd get:
```
[SCHEMA VALIDATION] Column "workflow_data" does not exist in "workflow_sessions".
Use "data" instead (workflow_sessions has "data", not "workflow_data")
```
