# HS CODE FORMAT STANDARD - Single Source of Truth

**RULE: All HS codes in Triangle Trade Intelligence must be 8-digit format**

---

## THE STANDARD

```
Format: XXXXXXXX (8 digits, no periods, no spaces)

Examples:
✅ 73269070 (steel backing plate)
✅ 68138100 (brake linings)
✅ 85182900 (electrical accessories)
✅ 61062990 (gloves)

❌ 732690 (6-digit, international)
❌ 73.26.90.70 (with periods)
❌ 7326907000 (10-digit statistical)
❌ 7326.90.70.00 (formatted with periods)
```

---

## WHERE THIS APPLIES

### 1. Database Storage (policy_tariffs_cache)
```sql
-- Column: hs_code
-- Type: VARCHAR(8)
-- Storage: XXXXXXXX format only
-- Example: 73269070

CREATE TABLE policy_tariffs_cache (
  hs_code VARCHAR(8) NOT NULL,  -- Must be 8-digit
  ...
);
```

### 2. Tariff Population Scripts
```javascript
// populate-section-301-overlay.js
// populate-section-232-overlay.js
// populate-section-201-overlay.js
// etc

// RULE: Convert to 8-digit before storing
const normalized = normalizeToHTS8(hsCode);
await db.policy_tariffs_cache.upsert({
  hs_code: normalized,  // Always 8-digit
  section_301: rate,
  ...
});
```

### 3. API Queries
```javascript
// pages/api/ai-usmca-complete-analysis.js
// Any endpoint that queries tariff rates

// RULE: Query with 8-digit format
const normalized = normalizeToHTS8(hsCode);
const rates = await supabase
  .from('policy_tariffs_cache')
  .eq('hs_code', normalized)  // Always 8-digit
  .select('section_301, section_232, ...');
```

### 4. HS Code Classification (AI)
```javascript
// When Claude classifies a product
// It must return 8-digit format

// Input: "brake hardware assembly"
// Output: "73269070" (NOT "732690", NOT "73.26.90.70")

// Claude prompt must specify:
// "Return ONLY the 8-digit HTS code, no periods, no spaces"
// "Example: 73269070"
```

### 5. User Inputs
```javascript
// When user uploads PDF or enters code manually
// Normalize immediately on input

function sanitizeHSCode(input) {
  // Remove periods, spaces, dashes
  let clean = input.replace(/[.\s\-]/g, '');
  
  // Normalize to 8-digit
  return normalizeToHTS8(clean);
}

// Usage:
const userInput = "73.26.90.70";
const normalized = sanitizeHSCode(userInput);  // Returns: "73269070"
```

---

## NORMALIZATION FUNCTION (Copy This Everywhere)

```javascript
/**
 * Normalize any HS code format to standard 8-digit HTS format
 * @param {string} hsCode - HS code in any format
 * @returns {string} - 8-digit HTS code (XXXXXXXX)
 * @throws {Error} - If code cannot be normalized
 */
function normalizeToHTS8(hsCode) {
  if (!hsCode) {
    throw new Error('HS code is required');
  }

  // Remove all non-digit characters (periods, spaces, dashes, etc)
  let clean = hsCode.toString().replace(/\D/g, '');

  // Validate length
  if (clean.length === 6) {
    // International HS code → pad to 8-digit
    return clean + '00';
  } else if (clean.length === 8) {
    // Already 8-digit → return as-is
    return clean;
  } else if (clean.length === 10) {
    // 10-digit statistical (with suffix) → remove last 2
    return clean.slice(0, 8);
  } else if (clean.length === 4) {
    // 4-digit heading → pad to 8
    return clean + '0000';
  } else {
    throw new Error(
      `Invalid HS code length: ${clean.length} digits. ` +
      `Expected 4, 6, 8, or 10 digits. Received: ${hsCode}`
    );
  }
}

// Export for use everywhere
module.exports = { normalizeToHTS8 };
```

---

## WHERE TO ADD THIS FUNCTION

**Create:** `lib/hs-code-utils.js`

```javascript
// lib/hs-code-utils.js
export function normalizeToHTS8(hsCode) {
  // [function from above]
}

// Then import everywhere:
// import { normalizeToHTS8 } from '@/lib/hs-code-utils';
```

**Use in:**
- `scripts/populate-*.js` (all 5 scripts)
- `pages/api/ai-usmca-complete-analysis.js`
- `pages/api/enrichment-analysis.js`
- Any other API that queries tariff rates
- User input sanitization

---

## ENFORCEMENT CHECKLIST

Before code is committed, verify:

- [ ] All database inserts use `normalizeToHTS8()`
- [ ] All database queries use `normalizeToHTS8()`
- [ ] All user inputs are sanitized with `normalizeToHTS8()`
- [ ] Claude prompts specify "8-digit HTS code, no periods"
- [ ] No hardcoded HS codes (all through normalization function)
- [ ] Tests verify normalization works:
  - `normalizeToHTS8('732690')` → `'73269000'` ✅
  - `normalizeToHTS8('73.26.90.70')` → `'73269070'` ✅
  - `normalizeToHTS8('7326907000')` → `'73269070'` ✅
  - `normalizeToHTS8('73269070')` → `'73269070'` ✅

---

## UNIT TESTS

```javascript
// tests/hs-code-utils.test.js

describe('normalizeToHTS8', () => {
  test('6-digit HS code → 8-digit with 00 padding', () => {
    expect(normalizeToHTS8('732690')).toBe('73269000');
  });

  test('8-digit code stays unchanged', () => {
    expect(normalizeToHTS8('73269070')).toBe('73269070');
  });

  test('Code with periods gets cleaned', () => {
    expect(normalizeToHTS8('73.26.90.70')).toBe('73269070');
  });

  test('10-digit code strips stat suffix', () => {
    expect(normalizeToHTS8('7326907000')).toBe('73269070');
  });

  test('4-digit heading pads to 8', () => {
    expect(normalizeToHTS8('7326')).toBe('73260000');
  });

  test('Rejects invalid lengths', () => {
    expect(() => normalizeToHTS8('732')).toThrow();
    expect(() => normalizeToHTS8('7326906999')).toThrow();
  });

  test('Handles various input formats', () => {
    expect(normalizeToHTS8('73-26-90-70')).toBe('73269070');
    expect(normalizeToHTS8('73 26 90 70')).toBe('73269070');
  });
});
```

---

## DATA MIGRATION

**Fix existing database:**

```sql
-- Step 1: Check current state
SELECT DISTINCT LENGTH(hs_code) as code_length, COUNT(*) as count
FROM policy_tariffs_cache
GROUP BY LENGTH(hs_code);

-- Step 2: Convert all to 8-digit
UPDATE policy_tariffs_cache
SET hs_code = CASE
  WHEN LENGTH(hs_code) = 6 THEN hs_code || '00'
  WHEN LENGTH(hs_code) = 4 THEN hs_code || '0000'
  WHEN LENGTH(hs_code) = 10 THEN SUBSTRING(hs_code, 1, 8)
  ELSE hs_code
END;

-- Step 3: Verify all are now 8-digit
SELECT DISTINCT LENGTH(hs_code) as code_length, COUNT(*) as count
FROM policy_tariffs_cache
GROUP BY LENGTH(hs_code);

-- Result should show only 8-digit codes
```

---

## CLAUDE PROMPT UPDATE

**When using Claude to classify HS codes:**

```
You are an expert at US trade classification using the Harmonized Tariff Schedule (HTS).

Your task: Classify the following product and return ONLY the 8-digit HTS code.

IMPORTANT FORMATTING REQUIREMENTS:
- Return ONLY the 8-digit code (e.g., 73269070)
- NO periods (not 73.26.90.70)
- NO spaces
- NO dashes
- NO descriptive text, just the code
- Pad with zeros if needed to reach 8 digits

Example outputs:
✅ 85182900
✅ 68138100
✅ 61062990
❌ 85.18.29.00 (has periods)
❌ 8518.29.00 (incomplete)
❌ 851829 (only 6 digits)

Product to classify: [USER INPUT]

Return ONLY the 8-digit code:
```

---

## SUMMARY

**One standard, applied everywhere:**

```
✅ Database: 8-digit
✅ Queries: 8-digit
✅ Population scripts: 8-digit
✅ API endpoints: 8-digit
✅ HS code classification: 8-digit
✅ User input: 8-digit (normalized)

Result: Everything matches, queries work, tariff rates found
```

**This is what should have been done from the start.**