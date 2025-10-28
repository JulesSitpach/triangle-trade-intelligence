# Component Authority Map - SINGLE SOURCE OF TRUTH

**Last Updated:** Oct 28, 2025
**Purpose:** Prevent duplicate table/component implementations from wasting dev time

## Results Page Component Hierarchy

```
WorkflowResults.js (Page orchestrator)
├── Line 825: USMCAQualification (✅ AUTHORITATIVE)
│   ├── 8-column component table (Component | Origin | Value % | MFN | USMCA | Add'l | Total | Savings)
│   ├── RVC breakdown (Material + Labor)
│   ├── Component savings details
│   └── Gap analysis (for non-qualified products)
│
├── Line 758: PolicyTimeline (✅ AUTHORITATIVE)
│   └── Tariff policy alerts by component
│
├── TariffSavings.js (✅ AUTHORITATIVE)
│   └── Annual/monthly savings + Section 301 burden
│
└── ❌ REMOVED: Inline component_breakdown table (lines 825-879)
    └── Was showing stale data - DELETED Oct 28
```

## Authority Rules (CRITICAL)

| Component | Location | Purpose | Owner | Status |
|-----------|----------|---------|-------|--------|
| **USMCAQualification** | `results/USMCAQualification.js` | Main component analysis table | AI/enrichment | ✅ ACTIVE |
| **TariffSavings** | `results/TariffSavings.js` | Financial breakdown | API response | ✅ ACTIVE |
| **PolicyTimeline** | `PolicyTimeline.js` | Policy alerts | Static config | ✅ ACTIVE |
| ~~Inline table~~ | ~~WorkflowResults.js~~ | ~~Quick view~~ | ~~DELETED~~ | ❌ REMOVED |

## If You See Two Tables

**IMMEDIATE ACTION:**
1. Check which file they come from:
   - `USMCAQualification.js` = Authoritative ✅
   - `WorkflowResults.js` inline = Duplicate ❌

2. Delete the WorkflowResults inline version

3. Verify USMCAQualification is imported and rendered:
   ```javascript
   // In WorkflowResults.js
   import USMCAQualification from './results/USMCAQualification';

   // In render:
   {isPaidUser && <USMCAQualification results={results} />}
   ```

4. Delete the inline table code

5. Hard refresh browser (`Ctrl+Shift+R`)

## Preventing This Again

**Before every commit, run:**
```bash
./DUPLICATE_COMPONENT_AUDIT.sh
```

**What it checks:**
- How many files render `component_breakdown`?
- Are duplicate tables being imported?
- Are imported components actually being used?

## Recent Incident Log

**Oct 28, 2025 - 5 hour waste:**
- Problem: USMCAQualification.js fixed to 8 columns, but WorkflowResults.js had old inline table
- Result: User saw broken table instead of fixed component
- Root cause: Inline table never removed when component was created
- Fix: Removed inline table, kept only USMCAQualification import
- Prevention: This audit doc + script

**Key Lesson:** ALWAYS delete old implementations when new components are created. Never keep "backup" tables.
