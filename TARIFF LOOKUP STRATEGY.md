# TARIFF LOOKUP STRATEGY - Correct Hierarchy

**The database is RIGHT. The query logic was WRONG.**

---

## THE REAL TARIFF STRUCTURE

```
TARIFF HIERARCHY (Most Specific → Least Specific)

Level 1: 8-digit HTS (Product-specific) [MOST SPECIFIC]
├─ Example: 85078000 (Starter motors with specific specs)
├─ Tariff: section_301 = 7.5%, section_232 = 0%
└─ Applies to ONLY this exact product

Level 2: 6-digit HS (Category-level) [GENERAL]
├─ Example: 850780 (All starter motors)
├─ Tariff: section_301 = 25%, section_232 = null
└─ Applies to ALL products in this family (8507.80.XX)

Level 3: 4-digit HS (Heading) [FALLBACK]
├─ Example: 8507 (Electric accumulators and parts)
├─ Tariff: Rare, but sometimes set here
└─ Applies to entire heading

Level 4: Prefix Match [LAST RESORT]
├─ Example: 85% (All Chapter 85)
├─ Tariff: Very rare
└─ Last resort if nothing else matches
```

---

## THE CORRECT LOOKUP ALGORITHM

```javascript
async function getTariffRates(hsCode, origin) {
  const normalized8 = normalizeToHTS8(hsCode);  // 85078000
  const normalized6 = normalized8.slice(0, 6);   // 850780
  const normalized4 = normalized8.slice(0, 4);   // 8507
  
  // STEP 1: Try exact 8-digit match (most specific)
  let rates = await db.policy_tariffs_cache.findUnique({
    where: {
      hs_code_origin: {
        hs_code: normalized8,           // 85078000
        origin_country: origin
      }
    }
  });
  
  if (rates) {
    return {
      ...rates,
      matchLevel: 'exact_8digit',
      appliedCode: normalized8
    };
  }

  // STEP 2: Try 6-digit parent (category-level tariff)
  rates = await db.policy_tariffs_cache.findUnique({
    where: {
      hs_code_origin: {
        hs_code: normalized6,           // 850780
        origin_country: origin
      }
    }
  });

  if (rates) {
    return {
      ...rates,
      matchLevel: 'parent_6digit',
      appliedCode: normalized6,
      note: `Using category-level rate (6-digit parent code)`
    };
  }

  // STEP 3: Try 4-digit heading (rare fallback)
  rates = await db.policy_tariffs_cache.findUnique({
    where: {
      hs_code_origin: {
        hs_code: normalized4 + '00',    // 85070000
        origin_country: origin
      }
    }
  });

  if (rates) {
    return {
      ...rates,
      matchLevel: 'heading_4digit',
      appliedCode: normalized4,
      note: `Using heading-level rate (4-digit code)`
    };
  }

  // STEP 4: Prefix match (emergency fallback)
  rates = await db.policy_tariffs_cache.findMany({
    where: {
      hs_code: {
        startsWith: normalized6
      },
      origin_country: origin
    },
    orderBy: {
      hs_code: 'desc'  // Get most specific available
    },
    take: 1
  });

  if (rates.length > 0) {
    return {
      ...rates[0],
      matchLevel: 'prefix_match',
      appliedCode: rates[0].hs_code,
      note: `No exact match found. Using closest prefix match.`
    };
  }

  // STEP 5: Not found - return null, NOT 0%
  return {
    section_301: null,
    section_232: null,
    matchLevel: 'not_found',
    appliedCode: null,
    note: `No tariff rate found for ${normalized8}. Requires manual research.`
  };
}
```

---

## EXAMPLE: How This Works

**User asks about: Electrical starter motor (85078000)**

### Scenario 1: Product-specific rate exists

```
Query: 85078000 (8-digit)
Found: YES in policy_tariffs_cache
Result:
├─ section_301: 0.075 (7.5%)
├─ section_232: 0.00 (0%)
├─ matchLevel: exact_8digit
└─ This is the precise rate for THIS product
```

### Scenario 2: Only category rate exists

```
Query: 85078000 (8-digit)
Found: NO

Query: 850780 (6-digit parent)
Found: YES in policy_tariffs_cache
Result:
├─ section_301: 0.25 (25%)
├─ section_232: null (not applicable)
├─ matchLevel: parent_6digit
├─ appliedCode: 850780
└─ Note: "Using category-level rate"
```

### Scenario 3: Only heading rate exists

```
Query: 85078000 (8-digit) → NOT FOUND
Query: 850780 (6-digit) → NOT FOUND
Query: 85070000 (4-digit) → FOUND

Result:
├─ section_301: 0.25 (25%)
├─ matchLevel: heading_4digit
└─ Note: "Using heading-level rate"
```

### Scenario 4: No rate found anywhere

```
Query: 85078000, 850780, 85070000, prefix → ALL NOT FOUND

Result:
├─ section_301: null (NOT 0%!)
├─ section_232: null
├─ matchLevel: not_found
└─ Note: "Requires manual research with customs broker"
```

---

## DATABASE SCHEMA UPDATE

**Your policy_tariffs_cache should look like:**

```sql
SELECT hs_code, origin_country, section_301, section_232
FROM policy_tariffs_cache
WHERE hs_code LIKE '8507%' OR hs_code LIKE '7326%'
ORDER BY LENGTH(hs_code) DESC, hs_code;

-- Results (example data):
-- 85078000 | CN | 0.075 | 0.00    (8-digit product-specific)
-- 850780  | CN | 0.25  | NULL    (6-digit category)
-- 8507    | CN | 0.25  | NULL    (4-digit heading - rare)
--
-- 73269070 | CN | 0.25 | 0.50    (8-digit product-specific)
-- 732690   | CN | 0.25 | NULL    (6-digit category)
-- 7326     | CN | 0.25 | NULL    (4-digit heading)
```

**Key insight:** You can have BOTH 6-digit and 8-digit codes for the same product family. They're not duplicates - they're different tariff levels.

---

## INDEX OPTIMIZATION

```sql
-- For fast exact matching
CREATE UNIQUE INDEX idx_hs_code_origin_exact
ON policy_tariffs_cache(hs_code, origin_country)
WHERE LENGTH(hs_code) = 8;  -- Only index 8-digit codes

-- For prefix matching fallback
CREATE INDEX idx_hs_code_prefix
ON policy_tariffs_cache(LEFT(hs_code, 6), origin_country)
WHERE LENGTH(hs_code) = 6;  -- Index the 6-digit codes
```

---

## IMPLEMENTATION IN YOUR API

**File: `pages/api/ai-usmca-complete-analysis.js` (or equivalent)**

```javascript
import { normalizeToHTS8 } from '@/lib/hs-code-utils';

async function enrichComponentWithTariffs(component) {
  try {
    // Get rates using fallback hierarchy
    const rates = await getTariffRates(component.hsCode, component.origin);
    
    // Apply rates to calculation
    if (rates.matchLevel === 'not_found') {
      return {
        ...component,
        tariff_status: 'NEEDS_RESEARCH',
        error: `No tariff rate found. Used: ${rates.note}`,
        section_301: null,
        section_232: null,
        confidence: 0
      };
    }
    
    return {
      ...component,
      tariff_status: 'FOUND',
      section_301: rates.section_301,
      section_232: rates.section_232,
      matchLevel: rates.matchLevel,
      appliedCode: rates.appliedCode,
      confidence: getConfidence(rates.matchLevel)
    };
  } catch (error) {
    console.error('Tariff lookup error:', error);
    throw error;
  }
}

function getConfidence(matchLevel) {
  const confidenceMap = {
    'exact_8digit': 100,      // Perfect match
    'parent_6digit': 85,      // Category rate (applies to all in family)
    'heading_4digit': 70,     // Heading level (rare)
    'prefix_match': 50,       // Best we could find
    'not_found': 0            // Requires manual research
  };
  
  return confidenceMap[matchLevel] || 0;
}
```

---

## THE CRITICAL FIX

**Old logic (WRONG):**
```javascript
const rates = await db.policy_tariffs_cache.findUnique({
  where: {
    hs_code: normalizedHsCode,  // Only tries 8-digit
    origin_country: origin
  }
});

if (!rates) {
  return { section_301: 0, section_232: 0 };  // ❌ DEFAULTS TO 0!
}
```

**New logic (CORRECT):**
```javascript
// Try 8-digit, then 6-digit, then 4-digit, then prefix
// Never default to 0% - default to null (needs research)
// Return confidence level and which code was applied
```

---

## DATA QUALITY RULES

**Keep in policy_tariffs_cache:**

```
✅ KEEP 8-digit codes (product-specific)
   Example: 73269070, 85078000

✅ KEEP 6-digit codes (category-level)
   Example: 732690, 850780
   
✅ KEEP 4-digit codes (heading-level - rare)
   Example: 7326, 8507

❌ DON'T default to 0%
   Use null instead (triggers manual research)

❌ DON'T ignore category rates
   They apply when product-specific rate doesn't exist
```

---

## WHY THIS WORKS

| Code Format | Purpose | When Used |
|------------|---------|-----------|
| **8-digit** | Product-specific tariff | Exact product exists in database |
| **6-digit** | Category-level tariff | No 8-digit found, use category default |
| **4-digit** | Heading-level tariff | Rare fallback, very general |
| **Prefix** | Emergency fallback | Nothing else found |
| **null** | Needs research | No match at any level |

**This is how real tariff systems work.**

---

## NEXT STEPS FOR YOUR AGENT

1. **Verify database has BOTH 6-digit and 8-digit codes**
   ```sql
   SELECT DISTINCT LENGTH(hs_code), COUNT(*)
   FROM policy_tariffs_cache
   GROUP BY LENGTH(hs_code);
   ```

2. **Keep both** (don't delete 6-digit codes!)

3. **Update query logic** to implement the fallback hierarchy

4. **Update API** to return matchLevel + confidence

5. **Update Claude prompt** to explain why answer has confidence < 100

6. **Test thoroughly** with codes that:
   - Have 8-digit match (confidence 100)
   - Only have 6-digit match (confidence 85)
   - Only have 4-digit match (confidence 70)
   - Have no match (confidence 0, need research)

**This is the correct solution.**