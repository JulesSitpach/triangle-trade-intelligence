# 🗄️ Database Schema Documentation & Validation System

**Status**: ✅ **SCHEMA VERIFIED** (2025-08-28)  
**Purpose**: Prevent database schema mismatches by documenting actual database structure

---

## 🎯 **Problem Solved**

❌ **Before**: Code assumed database columns that didn't exist  
✅ **After**: All queries validated against actual schema with automatic fixes

### **Specific Issues Fixed:**
- ❌ `countries.usmca_member` column → ✅ Use `trade_agreements` field  
- ❌ `comtrade_reference.chapter` column → ✅ Extract from `hs_code` field
- ❌ `trade_volume_mappings.min_value` → ✅ Use `numeric_value` field
- ❌ `classification_logs` table (doesn't exist) → ✅ Use `comtrade_reference`

---

## 📊 **Verified Database Structure**

| Table | Rows | Status | Primary Use |
|-------|------|--------|-------------|
| `comtrade_reference` | 5,751 | ✅ Active | HS codes, product descriptions |
| `tariff_rates` | 14,486 | ✅ Active | Tariff calculations (US only) |
| `usmca_qualification_rules` | 10 | ✅ Active | Business types, thresholds |
| `triangle_routing_opportunities` | 12 | ✅ Active | Routing recommendations |
| `countries` | 39 | ✅ Active | Country data with trade agreements |
| `trade_volume_mappings` | 6 | ✅ Active | Volume ranges for UI dropdowns |
| `hs_codes` | 0 | ⚠️ Empty | Use `comtrade_reference` instead |
| `classification_logs` | N/A | ❌ Missing | Table does not exist |

---

## 🛠️ **How to Use This System**

### **1. Quick Schema Check**
```bash
# Inspect your current database structure
node inspect-supabase.js
```

### **2. Validate Queries Before Writing**
```javascript
import { validateQuery } from './lib/database/validate-schema.js';

// This will throw an error if column doesn't exist
validateQuery('countries', ['usmca_member']); // ❌ Throws error

// This will pass validation  
validateQuery('countries', ['code', 'name', 'trade_agreements']); // ✅ Valid
```

### **3. Use Schema-Aware Database Client**
```javascript
import { createSchemaAwareClient } from './lib/database/validate-schema.js';
import { getSupabaseServiceClient } from './lib/database/supabase-client.js';

const client = createSchemaAwareClient(getSupabaseServiceClient());

// Automatically validates columns and suggests fixes
const countries = await client.select('countries', ['code', 'name']);
```

### **4. Use Safe Query Patterns**
```javascript
import { safeQuery } from './lib/database/validate-schema.js';

// Get pre-validated SQL for common operations
const sql = safeQuery('getAllCountries'); 
// Returns: SELECT code, name, CASE WHEN code IN ('US','CA','MX') THEN true...
```

### **5. Auto-Fix Existing Queries**
```bash
# Scan codebase and fix common schema issues
node scripts/fix-database-queries.js
```

---

## 📋 **Safe Query Patterns**

Instead of writing raw queries, use these verified patterns:

```javascript
// ✅ SAFE: Get countries with USMCA status
const countries = await client.executeSafeQuery('getAllCountries');

// ✅ SAFE: Get HS chapters from codes
const chapters = await client.executeSafeQuery('getHSChapters');

// ✅ SAFE: Get business types from rules
const types = await client.executeSafeQuery('getBusinessTypes');
```

---

## 🔧 **Column Mappings**

| Wrong Column | Correct Approach | Table |
|-------------|------------------|-------|
| `usmca_member` | Check `code IN ('US','CA','MX')` or `trade_agreements` | `countries` |
| `chapter` | `SUBSTRING(hs_code, 1, 2)` | `comtrade_reference` |
| `min_value` | Use `numeric_value` | `trade_volume_mappings` |

---

## 🚨 **Error Prevention Rules**

1. **Always validate new queries**: `validateQuery(table, columns)`
2. **Use `VERIFIED_TABLE_CONFIG`** from `database-schema.js`
3. **Check schema docs** before assuming column names
4. **Use safe query patterns** for complex operations
5. **Run inspection script** when database changes

---

## 📁 **File Structure**

```
lib/database/
├── database-schema.js     # ✅ Complete schema documentation
├── validate-schema.js     # ✅ Validation utilities  
├── supabase-client.js     # ✅ Updated with schema awareness
└── ...

scripts/
├── fix-database-queries.js  # ✅ Auto-fix existing queries
└── ...

config/
└── system-config.js       # ✅ Uses verified table names

inspect-supabase.js        # ✅ Database inspection script
```

---

## 🎯 **Quick Commands**

```bash
# Check current database structure
node inspect-supabase.js

# Fix queries in codebase automatically  
node scripts/fix-database-queries.js

# Test dropdown API (should work now)
curl "http://localhost:3001/api/database-driven-dropdown-options?category=countries"

# Start development with validated schema
npm run dev
```

---

## ✅ **Verification Status**

- ✅ **Schema documented** with actual column names and row counts
- ✅ **System config updated** to use verified table names
- ✅ **Validation utilities created** for preventing future mismatches  
- ✅ **Dropdown APIs fixed** to work with real schema
- ✅ **Auto-fix script created** for existing queries
- ✅ **Safe query patterns documented** for common operations

**Result**: No more "column does not exist" errors! 🎉

---

## 🤝 **Contributing**

When adding new database queries:

1. **Check the schema**: Review `lib/database/database-schema.js` first
2. **Validate your query**: Use `validateQuery()` before implementing
3. **Add safe patterns**: Add commonly used queries to `SAFE_QUERIES`
4. **Update docs**: Document any new tables or patterns you discover

---

*This system ensures the codebase always matches the actual database structure, preventing the schema mismatches that caused empty dropdowns and API errors.*