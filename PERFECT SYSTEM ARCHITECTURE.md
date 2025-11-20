# TRIANGLE TRADE INTELLIGENCE - PERFECT SYSTEM ARCHITECTURE

**The definitive design for how tariff data flows from source → user analysis**

---

## 🎯 CORE PRINCIPLE

**Single Source of Truth, Multiple Verification Layers**

Every tariff rate comes from ONE authoritative government source, gets cached with verification metadata, and is never assumed to be 0% (null = needs research, 0% = confirmed duty-free).

---

## PART 1: DATA SOURCES - THE GROUND TRUTH

### 1.1 Official Government Sources (Ranked by Authority)

**TIER 1: USTR (US Trade Representative)**
- Authority: Controls Section 301 tariffs on China
- Source: `https://ustr.gov/issue-areas/enforcement/section-301-investigations/search`
- Data: HS code → Section 301 rate (25% standard for China)
- Update Frequency: Quarterly reviews, ad-hoc changes
- Verification: Published Federal Register notices
- Format: XML/API or manual USTR search tool

**TIER 2: White House / Executive Orders**
- Authority: Section 232 (national security) steel/aluminum
- Source: Proclamations (e.g., Proclamation 10896, 10895)
- Data: HS code → Section 232 rate (50% for steel as of June 2025)
- Update Frequency: Changes with administration directives
- Verification: Official.whitehouse.gov proclamations
- Format: PDF documents + CBP notices

**TIER 3: US Customs & Border Protection (CBP)**
- Authority: Implementation authority for all tariffs
- Source: CBP trade remedies pages + CSMS notices
- Data: HS code classification + applicable tariffs + exclusions
- Update Frequency: Weekly updates
- Verification: Federal Register + CBP announcements
- Format: HTML tables, Excel sheets, API

**TIER 4: USITC Harmonized Tariff Schedule**
- Authority: HS code classification authority
- Source: `https://hts.usitc.gov/`
- Data: HS code structure + MFN rates + USMCA rates
- Update Frequency: Annual (January 1)
- Verification: Official HTS database
- Format: Searchable database + Excel downloads

### 1.2 Data You Should NEVER Assume

❌ **NEVER assume:**
- A product is duty-free without verification
- An HS code applies without checking USITC
- Section 301 = 0% for China (always 25% unless explicitly excluded)
- Section 232 = 0% for steel (always 25-50% depending on product/year)
- Origin country exemptions without White House proclamation proof

✅ **Default to NULL (needs research) not 0% (duty-free)**

---

## PART 2: DATABASE DESIGN

### 2.1 Core Table: `policy_tariffs_cache`

**Purpose:** Single source of truth for all tariff rates  
**Scope:** All HS codes (10,000+) × All tariff regimes × All origin countries

```sql
CREATE TABLE policy_tariffs_cache (
  -- Identification
  id BIGSERIAL PRIMARY KEY,
  hs_code VARCHAR(10) NOT NULL,        -- e.g., "7326.90.70"
  hs_code_normalized VARCHAR(10),      -- Normalized: "7326907000"
  chapter_id INT,                      -- Chapter 73 (steel/iron)
  product_description TEXT,            -- "Stamped steel parts"
  origin_country VARCHAR(2),           -- "CN", "US", "MX", "CA"
  
  -- Tariff Rates (CRITICAL: Use DECIMAL, store as decimals 0.00-1.00)
  section_301 DECIMAL(5,4),            -- 0.25 = 25%, NULL = needs research
  section_232 DECIMAL(5,4),            -- 0.50 = 50%, NULL = needs research
  section_201 DECIMAL(5,4),            -- Safeguard tariffs
  ieepa_rate DECIMAL(5,4),             -- Fentanyl tariff
  base_mfn_rate DECIMAL(5,4),          -- Standard MFN rate
  usmca_rate DECIMAL(5,4),             -- USMCA preferential rate
  
  -- Data Quality Metadata
  verified_source VARCHAR(100),        -- "USTR_API", "WHITE_HOUSE_PROC", "CBP_NOTICE"
  verified_date DATE,                  -- When this was verified
  confidence_level INT,                -- 100 = verified by source, 50 = AI research, 0 = assumed
  research_notes TEXT,                 -- Why this rate? Any caveats?
  
  -- Timing
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,                -- When does this need re-verification?
  
  -- Audit
  updated_by VARCHAR(50),              -- "populate-section-301", "populate-section-232", "manual_entry"
  last_validation_error TEXT,          -- If validation failed, why?
  
  UNIQUE(hs_code_normalized, origin_country),
  INDEX idx_chapter_origin (chapter_id, origin_country),
  INDEX idx_verified_date (verified_date),
  INDEX idx_expires_at (expires_at)
);
```

### 2.2 Supporting Tables

**`tariff_exclusions`** - Products/HS codes exempt from tariffs
```sql
CREATE TABLE tariff_exclusions (
  id SERIAL PRIMARY KEY,
  hs_code VARCHAR(10),
  tariff_type VARCHAR(50),          -- "section_301", "section_232"
  reason TEXT,                      -- Why excluded?
  excluded_until DATE,              -- Exclusions have expiration dates!
  verified_source VARCHAR(100),
  created_at TIMESTAMP
);
```

**`tariff_rule_changes`** - Audit log of changes
```sql
CREATE TABLE tariff_rule_changes (
  id SERIAL PRIMARY KEY,
  hs_code VARCHAR(10),
  tariff_type VARCHAR(50),
  old_rate DECIMAL(5,4),
  new_rate DECIMAL(5,4),
  change_reason TEXT,               -- "Updated per USTR notice", "Policy change"
  changed_at TIMESTAMP,
  changed_by VARCHAR(50),
  verified_source VARCHAR(100)
);
```

### 2.3 Data Type Rules

**CRITICAL ENFORCEMENT:**

```sql
-- Tariff rates MUST be:
-- ✅ DECIMAL(5,4) - stores 0.0000 to 99.9999
-- ✅ In decimal form: 0.25 = 25%, 0.50 = 50%
-- ✅ NULL if not researched (never 0)
-- ❌ NEVER INTEGER
-- ❌ NEVER stored as 25 (should be 0.25)
-- ❌ NEVER default to 0 if missing
```

---

## PART 3: DATA POPULATION FLOW

### 3.1 The Perfect Execution Order

```
┌─────────────────────────────────────────────────────────────┐
│                   TARIFF DATA PIPELINE                      │
└─────────────────────────────────────────────────────────────┘

        ↓ STEP 1: VERIFY HS CODE CLASSIFICATION
        
    [USITC HTS Database]
    └─→ Get correct HS code for product
    └─→ Get HS code chapter & structure
    └─→ Verify product description matches
    └─→ Result: Normalized HS code (e.g., 7326907000)

        ↓ STEP 2: ESTABLISH BASELINE TARIFF (Section 301)
        
    [USTR API / USTR Search Tool]
    └─→ Search: Does this HS code have Section 301?
    └─→ Section 301 = China IP duties (baseline is 0.25 = 25%)
    └─→ Unless explicitly excluded, rate = 0.25
    └─→ Result: section_301 = 0.25 (or NULL if excluded/unclear)
    └─→ Store: verified_source = "USTR_API", confidence = 100

        ↓ STEP 3: ADD SECTION 232 OVERLAY (Steel/Aluminum)
        
    [White House Proclamations + CBP]
    └─→ Is this product steel or aluminum? (Chapter 72-76)
    └─→ What's the current Section 232 rate? (0.25 or 0.50)
    └─→ Are there country-specific exemptions?
    └─→ Result: section_232 = 0.50 (or NULL if not steel)
    └─→ Store: verified_source = "PROCLAMATION_10896", confidence = 100
    └─→ Important: Does NOT overwrite section_301

        ↓ STEP 4: ADD OTHER OVERLAY TARIFFS (Section 201, IEEPA)
        
    [Various Government Sources]
    └─→ Section 201: Safeguard investigations (temporary)
    └─→ IEEPA: Fentanyl/miscellaneous tariffs
    └─→ Result: Additional rates if applicable
    └─→ Store each with source and expiration date

        ↓ STEP 5: ADD BASE RATES (For Reference)
        
    [USITC HTS Schedule]
    └─→ MFN rate: Standard rate for non-USMCA countries
    └─→ USMCA rate: Preferential rate for Mexico/Canada
    └─→ Result: base_mfn_rate, usmca_rate
    └─→ Store: verified_source = "USITC_HTS"

        ↓ STEP 6: VALIDATION & STORAGE
        
    [Data Quality Checks]
    ✅ Never default to 0% (must be explicit or NULL)
    ✅ All rates are in decimal form (0.25, not 25)
    ✅ Verified source is documented
    ✅ Confidence level is set
    ✅ Expiration date set if applicable
    
    └─→ Store in policy_tariffs_cache
    └─→ Set expires_at = 90 days (auto-refresh)
```

### 3.2 Script Execution Order (CRITICAL)

**These MUST run in this order, every time:**

```bash
# 1️⃣  BASELINE TARIFFS - SECTION 301 (China IP duties)
node scripts/populate-section-301-overlay.js --all-chapters
# Populates: section_301 for all HS codes
# Source: USTR
# Expected: 100% of Chapter 73 codes get section_301 = 0.25
# Time: ~5 minutes
# Output: Creates/updates cache records

# 2️⃣  OVERLAY TARIFFS - SECTION 232 (Steel/Aluminum)
node scripts/populate-section-232-overlay.js --all-chapters
# Populates: section_232 for steel/aluminum codes
# Source: White House Proclamations
# Expected: All steel/aluminum codes get section_232 rate
# Time: ~3 minutes
# CRITICAL: Does NOT overwrite existing section_301 values
# Output: Updates cache records, preserves section_301

# 3️⃣  OVERLAY TARIFFS - SECTION 201 (Safeguards)
node scripts/populate-section-201-overlay.js --all-chapters
# Populates: section_201 where applicable
# Source: ITC investigations
# Expected: Only codes with active investigations
# Time: ~2 minutes

# 4️⃣  OVERLAY TARIFFS - IEEPA (Fentanyl/Policy)
node scripts/populate-ieepa-overlay.js --all-chapters
# Populates: ieepa_rate
# Source: Executive orders
# Expected: Codes related to China, fentanyl precursors
# Time: ~2 minutes

# 5️⃣  BASE RATES - FOR REFERENCE
node scripts/populate-base-rates.js --all-chapters
# Populates: base_mfn_rate, usmca_rate
# Source: USITC HTS
# Expected: All codes get MFN + USMCA rates
# Time: ~5 minutes

# Total: ~17 minutes for complete refresh of all chapters
```

### 3.3 What Each Script Does

**`populate-section-301-overlay.js`**
```javascript
// Pseudocode
async function populate(options) {
  for (const chapter of options.chapters) {
    // 1. Get all HS codes in this chapter from USITC
    const hsCodes = await getHSCodesForChapter(chapter);
    
    // 2. For each HS code, research Section 301 rate
    for (const hs of hsCodes) {
      const section301 = await ustrApi.searchSection301(hs.code);
      
      // 3. Create or update cache
      await cache.upsert({
        hs_code: hs.code,
        chapter_id: chapter,
        origin_country: 'CN',  // Section 301 is China-specific
        section_301: section301?.rate || null,  // NULL if not found, never 0
        section_232: (existing) => existing.section_232,  // PRESERVE existing
        verified_source: 'USTR_API',
        verified_date: new Date(),
        confidence_level: section301 ? 100 : 50,
        research_notes: section301?.notes || 'No Section 301 found'
      });
    }
  }
}
```

**`populate-section-232-overlay.js`**
```javascript
// Pseudocode
async function populate(options) {
  for (const chapter of options.chapters) {
    // Only process steel/aluminum chapters (72-76, 81-82, etc)
    if (!isMetalChapter(chapter)) continue;
    
    // 1. Get all HS codes in this chapter
    const hsCodes = await getHSCodesForChapter(chapter);
    
    // 2. For each HS code, get Section 232 rate
    for (const hs of hsCodes) {
      const section232 = await cbp.searchSection232(hs.code);
      
      // 3. Update cache, PRESERVE existing section_301
      await cache.upsert({
        hs_code: hs.code,
        chapter_id: chapter,
        origin_country: 'CN',
        section_232: section232?.rate || null,  // NULL if not found, never 0
        section_301: (existing) => existing.section_301,  // PRESERVE - don't touch!
        verified_source: 'CBP_SECTION232',
        verified_date: new Date(),
        confidence_level: section232 ? 100 : 50,
        research_notes: section232?.notes
      });
    }
  }
}
```

---

## PART 4: TARIFF CALCULATION (How Rates Are Used)

### 4.1 Calculation Logic

**Input:**
- Component value: $500,000
- HS code: 7326.90.70
- Origin: China
- Destination: USA

**Process:**
```
1. Look up HS code in cache
   └─ section_301: 0.25 (25%)
   └─ section_232: 0.50 (50%)
   └─ ieepa_rate: 0.20 (20%)
   └─ reciprocal_rate: 0.10 (10%)

2. Calculate applicable rates (STACKING):
   Total Duty = base_mfn_rate 
              + section_301 (if from China)
              + section_232 (if steel/aluminum)
              + ieepa_rate (if applicable)
              + reciprocal_rate (if applicable)
   
   Example:
   Total Duty = 0.035 + 0.25 + 0.50 + 0.20 + 0.10 = 1.085 (108.5%)

3. Apply to component value:
   Annual Tariff Cost = $500,000 × 1.085 = $542,500
   Monthly Tariff Cost = $542,500 ÷ 12 = $45,208

4. Compare to alternatives:
   - If sourced from Mexico instead: lower total duty
   - USMCA rate: 0% for many products
   - Savings calculation: China cost - Mexico cost
```

### 4.2 Code Implementation

```javascript
async function calculateTariffs(component) {
  // 1. Get tariff rates from cache
  const rates = await db.policy_tariffs_cache.findUnique({
    where: {
      hs_code_origin: {
        hs_code: component.hsCode,
        origin_country: component.origin
      }
    }
  });

  // 2. Validate rates exist (never assume null = 0%)
  if (!rates.section_301 && rates.origin === 'CN') {
    throw new Error(
      `Section 301 rate missing for ${component.hsCode}. ` +
      `All Chinese imports must have Section 301 rate (minimum 25%). ` +
      `This code may need manual research.`
    );
  }

  // 3. Calculate total duty (rates are already decimals: 0.25 = 25%)
  const totalDutyRate = 
    (rates.base_mfn_rate || 0) +
    (rates.section_301 || 0) +
    (rates.section_232 || 0) +
    (rates.ieepa_rate || 0) +
    (rates.reciprocal_rate || 0);

  // 4. Apply to component value
  const annualTariffCost = component.value * totalDutyRate;
  const monthlyTariffCost = annualTariffCost / 12;

  // 5. Return with metadata
  return {
    monthly: monthlyTariffCost,
    annual: annualTariffCost,
    breakdown: {
      base_mfn: component.value * (rates.base_mfn_rate || 0),
      section_301: component.value * (rates.section_301 || 0),
      section_232: component.value * (rates.section_232 || 0),
      ieepa: component.value * (rates.ieepa_rate || 0),
      reciprocal: component.value * (rates.reciprocal_rate || 0)
    },
    verified_date: rates.verified_date,
    confidence_level: rates.confidence_level
  };
}
```

---

## PART 5: DATA VALIDATION & QUALITY

### 5.1 Pre-Storage Validation

Every record must pass these checks BEFORE being saved:

```javascript
function validateTariffRecord(record) {
  const errors = [];

  // 1. HS Code validation
  if (!record.hs_code || record.hs_code.length < 4) {
    errors.push('Invalid HS code format');
  }

  // 2. Tariff rate validation
  for (const rateField of ['section_301', 'section_232', 'section_201', 'ieepa_rate']) {
    if (record[rateField] !== null && record[rateField] !== undefined) {
      // Must be decimal (0-1), not integer (0-100)
      if (record[rateField] > 1 || record[rateField] < 0) {
        errors.push(
          `${rateField} must be in decimal form (0.25 = 25%), not ${record[rateField]}`
        );
      }
    }
  }

  // 3. China-specific validation
  if (record.origin_country === 'CN' && record.section_301 === null) {
    errors.push(
      'Chinese products MUST have Section 301 rate ' +
      '(minimum 25% / 0.25). This code needs research.'
    );
  }

  // 4. Steel/aluminum validation
  if (isMetalChapter(record.chapter_id) && record.section_232 === null) {
    errors.push(
      'Steel/aluminum products MUST have Section 232 rate. ' +
      'This code needs research.'
    );
  }

  // 5. Source validation
  if (!record.verified_source) {
    errors.push('verified_source is required');
  }

  // 6. Date validation
  if (!record.verified_date) {
    errors.push('verified_date is required');
  }

  // 7. Confidence level validation
  if (record.confidence_level !== 100 && !record.research_notes) {
    errors.push(
      'research_notes required when confidence_level < 100'
    );
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.join('\n')}`);
  }

  return true;
}
```

### 5.2 Post-Storage Validation

After any population script, run these checks:

```javascript
async function validateCacheIntegrity() {
  const issues = [];

  // Check 1: No zero tariffs (except duty-free which should be null)
  const zeroRates = await db.policy_tariffs_cache.findMany({
    where: {
      OR: [
        { section_301: 0 },
        { section_232: 0 },
        { section_201: 0 }
      ]
    }
  });
  if (zeroRates.length > 0) {
    issues.push(`Found ${zeroRates.length} records with 0% tariffs (should be null)`);
  }

  // Check 2: China must have Section 301
  const cnWithout301 = await db.policy_tariffs_cache.findMany({
    where: {
      origin_country: 'CN',
      section_301: null,
      updated_at: { gte: new Date(Date.now() - 86400000) } // Last 24 hours
    }
  });
  if (cnWithout301.length > 0) {
    issues.push(`Found ${cnWithout301.length} Chinese codes without Section 301`);
  }

  // Check 3: Steel must have Section 232
  const steelWithout232 = await db.policy_tariffs_cache.findMany({
    where: {
      chapter_id: 73,
      section_232: null,
      updated_at: { gte: new Date(Date.now() - 86400000) }
    }
  });
  if (steelWithout232.length > 0) {
    issues.push(`Found ${steelWithout232.length} steel codes without Section 232`);
  }

  // Check 4: Confidence level must be documented
  const lowConfidenceUndocumented = await db.policy_tariffs_cache.findMany({
    where: {
      confidence_level: { lt: 100 },
      research_notes: null
    }
  });
  if (lowConfidenceUndocumented.length > 0) {
    issues.push(`Found ${lowConfidenceUndocumented.length} low-confidence records without notes`);
  }

  if (issues.length > 0) {
    throw new Error(`Cache integrity issues:\n${issues.join('\n')}`);
  }

  return { valid: true, timestamp: new Date() };
}
```

---

## PART 6: ORCHESTRATION & SCHEDULING

### 6.1 Master Sync Script

**File:** `scripts/sync-all-tariff-overlays.js`

```javascript
#!/usr/bin/env node

/**
 * MASTER TARIFF SYNCHRONIZATION
 * 
 * This is the ONLY script that should be run for tariff updates.
 * All individual scripts are called in the correct order.
 */

const config = {
  chapters: [1, 3, 6, 7, 13, 15, 25, 39, 40, 48, 49, 50, 51, 52, 55, 57, 58, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98],
  scripts: [
    {
      name: 'Section 301 (Baseline)',
      file: './populate-section-301-overlay.js',
      timeout: 10 * 60 * 1000 // 10 minutes
    },
    {
      name: 'Section 232 (Steel/Aluminum)',
      file: './populate-section-232-overlay.js',
      timeout: 10 * 60 * 1000
    },
    {
      name: 'Section 201 (Safeguards)',
      file: './populate-section-201-overlay.js',
      timeout: 5 * 60 * 1000
    },
    {
      name: 'IEEPA (Fentanyl/Policy)',
      file: './populate-ieepa-overlay.js',
      timeout: 5 * 60 * 1000
    },
    {
      name: 'Base Rates (MFN/USMCA)',
      file: './populate-base-rates.js',
      timeout: 10 * 60 * 1000
    }
  ]
};

async function main() {
  console.log('🚀 TRIANGLE TRADE INTELLIGENCE - TARIFF OVERLAY SYNC');
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('');
  
  for (const scriptConfig of config.scripts) {
    console.log(`\n📍 Running: ${scriptConfig.name}`);
    console.log('─'.repeat(60));
    
    try {
      const script = require(scriptConfig.file);
      await script.populate({ chapters: config.chapters });
      
      console.log(`✅ ${scriptConfig.name} completed`);
    } catch (error) {
      console.error(`❌ ${scriptConfig.name} FAILED`);
      console.error(error.message);
      process.exit(1);
    }
  }
  
  // Final validation
  console.log('\n\n🔍 FINAL VALIDATION');
  console.log('─'.repeat(60));
  try {
    await validateCacheIntegrity();
    console.log('✅ Cache integrity verified');
  } catch (error) {
    console.error('❌ Validation failed');
    console.error(error.message);
    process.exit(1);
  }
  
  console.log('\n✅ ALL TARIFF OVERLAYS SYNCHRONIZED SUCCESSFULLY');
  console.log(`Completed: ${new Date().toISOString()}`);
}

main().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
```

### 6.2 Scheduled Execution

**Cron Job Configuration:**

```bash
# Refresh tariff cache daily at 2 AM EST (when markets closed)
0 7 * * * cd /app && node scripts/sync-all-tariff-overlays.js >> logs/tariff-sync.log 2>&1

# Weekly comprehensive audit (Sunday at 3 AM)
0 8 * * 0 cd /app && node scripts/validate-tariff-cache.js >> logs/tariff-validation.log 2>&1

# Monthly archive (First day of month at 1 AM)
0 6 1 * * cd /app && node scripts/archive-tariff-changes.js >> logs/tariff-archive.log 2>&1
```

---

## PART 7: MONITORING & ALERTS

### 7.1 Health Checks

```javascript
async function checkTariffDataHealth() {
  const checks = [
    {
      name: 'Cache Coverage',
      query: 'COUNT(*) WHERE verified_date > NOW() - 7 days',
      threshold: 10000, // Should have 10k+ codes from last week
      severity: 'HIGH'
    },
    {
      name: 'China Steel Coverage',
      query: 'COUNT(*) WHERE origin_country="CN" AND chapter_id=73 AND section_301 IS NOT NULL',
      threshold: 300, // 312 codes in Chapter 73
      severity: 'CRITICAL'
    },
    {
      name: 'Stale Data',
      query: 'COUNT(*) WHERE verified_date < NOW() - 90 days',
      threshold: 100, // Max 100 codes can be older than 90 days
      severity: 'MEDIUM'
    },
    {
      name: 'Data Corruption',
      query: 'COUNT(*) WHERE section_301=0 OR section_232=0',
      threshold: 0, // ZERO tolerance
      severity: 'CRITICAL'
    }
  ];
  
  for (const check of checks) {
    const result = await db.$queryRaw(check.query);
    if (result[0] < check.threshold) {
      sendAlert({
        severity: check.severity,
        message: `${check.name}: ${result[0]} (threshold: ${check.threshold})`
      });
    }
  }
}
```

---

## PART 8: USER-FACING ACCURACY

### 8.1 Display Rules

When showing tariff rates to users:

```javascript
function displayTariffRate(rate, confidence, verifiedDate) {
  // Never show rates without metadata
  
  if (confidence === 100) {
    // ✅ Verified from government source
    return {
      rate: rate,
      status: '✅ Verified',
      source: 'US Government',
      refreshed: verifiedDate
    };
  } else if (confidence >= 50) {
    // ⚠️  AI-researched, needs verification
    return {
      rate: rate,
      status: '⚠️  AI-Researched - Review with broker',
      source: 'AI Research',
      refreshed: verifiedDate,
      disclaimer: 'This rate was researched by AI and should be verified by a customs broker before filing'
    };
  } else {
    // ❌ No verified rate available
    return {
      rate: null,
      status: '❌ Not Available',
      source: 'Needs Manual Research',
      action: 'Contact our trade specialists'
    };
  }
}
```

### 8.2 Calculation Display to Users

```
Your Component Analysis:
═══════════════════════════════════════════════════════════════

Component: Brake hardware assembly (steel fasteners)
HS Code: 7326.90.70 ✅ Verified
Origin: China
Value: $500,000 annually

Applicable Tariffs:
├── Section 301 (China IP duties)         25.0%  ✅ Verified USTR
├── Section 232 (Steel national security) 50.0%  ✅ Verified White House
├── IEEPA (Fentanyl tariff)               20.0%  ✅ Verified EO
└── Reciprocal Tariff                     10.0%  ✅ Verified CBP

Total Duty Rate: 105.0%

Cost Impact:
├── Annual Tariff:   $525,000
├── Monthly Tariff:   $43,750
└── Per Unit Cost:   [calculated based on order size]

⚠️  This calculation assumes current tariff policy as of Nov 20, 2025.
    Tariff rates change regularly. Review with customs broker before filing.
```

---

## SUMMARY: THE PERFECT SYSTEM

✅ **Single Source of Truth** - One cache, all data flows through it  
✅ **Proper Data Types** - Decimals (0.25), never integers (25)  
✅ **No Assumptions** - NULL = needs research, never default to 0%  
✅ **Script Order** - Section 301 FIRST, then overlays in sequence  
✅ **Data Preservation** - Each script preserves what came before  
✅ **Validation** - Pre and post-storage checks catch corruption  
✅ **Metadata** - Every rate includes source, date, confidence, notes  
✅ **Monitoring** - Continuous health checks and alerts  
✅ **Transparency** - Users see confidence levels and sources  
✅ **Compliance** - Never shows rates without verification  

This is what working correctly looks like.