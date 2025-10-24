# Data Contracts Migration Guide

**Date**: October 23, 2025
**Status**: Phase 1 Complete - Foundations Laid

## 📋 Overview

The data contract enforcement system has been implemented. This document guides migrating existing code to use the new TypeScript interfaces and validation layer.

**Time Investment**: ~2-3 hours to integrate into existing APIs (one-time)
**ROI**: Eliminates entire category of field name bugs permanently

---

## 🎯 What Changed

### Before (Current - Broken)
```javascript
// pages/api/consolidate-alerts.js
const userProfile = req.body.user_profile;  // Unknown shape
const trade_volume = userProfile.tradeVolume || userProfile.annual_trade_volume || 0;  // WHICH ONE?
```

### After (With Contracts)
```typescript
// pages/api/consolidate-alerts.ts
import type { UserTradeProfile } from '@/lib/types/data-contracts';
import { validateWorkflowSession, reportValidationErrors } from '@/lib/validation/data-contract-validator';

const result = validateWorkflowSession(req.body.user_profile, 'Request');
if (!reportValidationErrors(result, 'consolidate-alerts API')) {
  return res.status(400).json({ error: 'Invalid user profile' });
}

const userProfile: UserTradeProfile = result.normalized;
const trade_volume = userProfile.trade_volume;  // TypeScript ensures this exists
```

---

## 🚀 Quick Start

### Step 1: Import Types in Your File

```typescript
import type {
  ComponentOrigin,
  UserTradeProfile,
  WorkflowSessionRow,
  TariffRatesCacheRow
} from '@/lib/types/data-contracts';
```

### Step 2: Add Type Annotations

```typescript
// Before
const component = req.body.component;

// After
const component: ComponentOrigin = req.body.component;
```

### Step 3: Validate at API Boundaries

```typescript
import { validateComponentOrigin, reportValidationErrors } from '@/lib/validation/data-contract-validator';

const result = validateComponentOrigin(req.body.component, 'Request');
if (!reportValidationErrors(result, 'POST /api/my-endpoint')) {
  return res.status(400).json({ errors: result.errors });
}

const component: ComponentOrigin = result.normalized;
```

---

## 📍 Migration Priority

### Priority 1: API Entry Points (CRITICAL)
These endpoints MUST validate requests:
1. `/api/ai-usmca-complete-analysis` - Main analysis endpoint
2. `/api/consolidate-alerts` - Alert consolidation
3. `/api/generate-personalized-alerts` - Alert generation
4. `/api/dashboard-data` - Dashboard loading

**Effort**: ~30 min per endpoint
**Impact**: Catches 90% of field name errors

### Priority 2: Data Transformation Functions (HIGH)
```typescript
// lib/schemas/form-data-schema.js
// lib/schemas/component-schema.js
// lib/tariff/enrichment-router.js
```

Migrate to use TypeScript types instead of runtime validation.

**Effort**: ~1 hour
**Impact**: Type safety throughout pipeline

### Priority 3: Component Props (MEDIUM)
```typescript
// components/workflow/WorkflowResults.js
import type { UserTradeProfile } from '@/lib/types/data-contracts';

interface Props {
  profile: UserTradeProfile;  // TypeScript ensures correct shape
}
```

**Effort**: ~1 hour
**Impact**: Component type safety

---

## 📝 Implementation Pattern

### For API Endpoints

```typescript
// pages/api/my-endpoint.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import type { ComponentOrigin } from '@/lib/types/data-contracts';
import { withDataValidation, ApiResponse } from '@/lib/api/validated-handler';
import { validateComponentOrigin, reportValidationErrors } from '@/lib/validation/data-contract-validator';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Method check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request
    const validationResult = validateComponentOrigin(req.body.component, 'Request');
    if (!reportValidationErrors(validationResult, 'POST /api/my-endpoint')) {
      const response = new ApiResponse(res);
      return response.validationError(validationResult.errors);
    }

    // Now component is type-safe
    const component: ComponentOrigin = validationResult.normalized;

    // Your business logic
    const enrichedComponent = await enrichComponent(component);

    // Return response
    return res.status(200).json({
      success: true,
      component: enrichedComponent
    });

  } catch (error) {
    console.error('Error:', error);
    const response = new ApiResponse(res);
    return response.serverError('Failed to process component', error);
  }
}

export default handler;
```

### For Component Props

```typescript
// components/MyComponent.tsx
import type { ComponentOrigin } from '@/lib/types/data-contracts';

interface Props {
  component: ComponentOrigin;
  onUpdate?: (component: ComponentOrigin) => void;
}

export default function MyComponent({ component, onUpdate }: Props) {
  return (
    <div>
      <p>HS Code: {component.hs_code}</p>
      <p>Origin: {component.origin_country}</p>
      <p>Tariff: {component.mfn_rate}%</p>
    </div>
  );
}
```

### For Data Transformation

```typescript
// lib/utils/enrich-component.ts
import type { ComponentOrigin } from '@/lib/types/data-contracts';
import { validateComponentOrigin } from '@/lib/validation/data-contract-validator';

export async function enrichComponent(rawComponent: unknown): Promise<ComponentOrigin> {
  // Validate input
  const result = validateComponentOrigin(rawComponent, 'enrichComponent');
  if (!result.valid) {
    throw new Error(`Invalid component: ${result.errors.join('; ')}`);
  }

  const component: ComponentOrigin = result.normalized;

  // Enrich with tariff data
  const tariffData = await fetchTariffData(component.hs_code, component.origin_country);

  // Return enriched component (TypeScript ensures all required fields)
  return {
    ...component,
    mfn_rate: tariffData.mfn_rate,
    base_mfn_rate: tariffData.base_mfn_rate,
    section_301: tariffData.section_301,
    section_232: tariffData.section_232,
    total_rate: tariffData.total_rate,
    usmca_rate: tariffData.usmca_rate,
    savings_percentage: tariffData.mfn_rate - tariffData.usmca_rate,
    cache_source: 'openrouter'
  };
}
```

---

## 🔧 Common Migration Tasks

### Task 1: Fix Field Name in API Response

**Before:**
```javascript
// pages/api/generate-personalized-alerts.js
Annual Trade Volume: $${userProfile.tradeVolume || 'unknown'}  // WRONG
```

**After:**
```typescript
import type { UserTradeProfile } from '@/lib/types/data-contracts';

const profile: UserTradeProfile = result.normalized;
Annual Trade Volume: $${profile.trade_volume || 'unknown'}  // CORRECT
```

### Task 2: Validate Component Array

**Before:**
```javascript
const components = req.body.components;  // No type safety
components.forEach(comp => {
  const originCountry = comp.origin_country || comp.country;  // Fallback!
});
```

**After:**
```typescript
import { validateComponentsArray } from '@/lib/validation/data-contract-validator';

const result = validateComponentsArray(req.body.components, 'Request');
const components: ComponentOrigin[] = result.normalized;
components.forEach(comp => {
  // TypeScript ensures origin_country exists
  const originCountry = comp.origin_country;
});
```

### Task 3: Add Trade Volume Validation

**Before:**
```javascript
const tradeVolume = parseFloat(req.body.trade_volume) || 0;  // Silent failure on NaN
```

**After:**
```typescript
import { validateTradeVolume } from '@/lib/validation/data-contract-validator';

const volumeResult = validateTradeVolume(req.body.trade_volume, 'POST /api/endpoint');
if (!volumeResult.valid) {
  return res.status(400).json({ errors: volumeResult.errors });
}
const tradeVolume: number = volumeResult.normalized;
```

---

## ✅ Validation Checklist

When migrating an API endpoint:

- [ ] Imports TypeScript types from `data-contracts.ts`
- [ ] Validates all request fields using appropriate validator
- [ ] Uses `reportValidationErrors()` to log issues
- [ ] Type-annotates all variables (`const x: ComponentOrigin = ...`)
- [ ] Returns `ApiResponse` for consistent error handling
- [ ] No fallback chains (`field1 || field2 || 'default'`)
- [ ] No silent failures (always log when data is wrong)
- [ ] Console has no field name warnings

---

## 🐛 Debugging Field Name Issues

If you see a TypeScript error about a field not existing:

```
Property 'tradeVolume' does not exist on type 'UserTradeProfile'
Did you mean 'trade_volume'?
```

This is **good**! TypeScript caught your error. The fix is simple:

```typescript
// Wrong (TypeScript error)
const volume = profile.tradeVolume;

// Correct
const volume = profile.trade_volume;
```

---

## 📚 Reference: Canonical Field Names

| Data | Canonical Name | NOT THESE |
|------|---|---|
| Company name | `company_name` | `companyName`, `name` |
| Trade volume | `trade_volume` | `tradeVolume`, `annual_trade_volume`, `annualTradeVolume` |
| Component origin | `origin_country` | `country`, `originCountry` |
| HS code | `hs_code` | `hsCode`, `classified_hs_code` (alias OK) |
| Base MFN rate | `base_mfn_rate` | `mfn_rate` (without "base") |
| Total tariff | `total_rate` | (must equal base_mfn + 301 + 232) |
| USMCA rate | `usmca_rate` | (NEVER "USMCA_rate") |
| Savings | `savings_percentage` | `savings_percent` (alias OK) |

---

## 🎯 Success Criteria

After full migration:

- ✅ TypeScript catches all field name errors at compile time
- ✅ API endpoints validate requests and log failures
- ✅ Components have type-safe props
- ✅ No more fallback chains like `x || y || z || 0`
- ✅ Database rows validated on read
- ✅ Zero silent failures (all errors logged)

---

## 📞 Getting Help

If you encounter issues during migration:

1. **TypeScript error about missing field?**
   - Check canonical names in table above
   - Use `validateXxx()` function to get actual field names

2. **Validation rejecting valid data?**
   - Check validation function in `data-contract-validator.ts`
   - Adjust field name to match canonical names

3. **API still receiving wrong field names?**
   - Check caller is sending canonical names
   - Add console logs in `validateXxx()` to see what's being sent

---

## 🚀 Timeline

- **Today**: Foundations implemented (3 files, 1256 lines of types + validation)
- **Week 1**: Migrate Priority 1 APIs (consolidate-alerts, generate-personalized-alerts)
- **Week 2**: Migrate Priority 2 (form schemas, enrichment router)
- **Week 3**: Migrate Priority 3 (components, displays)
- **Ongoing**: All new code uses data contracts automatically

---

**This is not optional - it's the only way to stop the endless field name bugs.**

Once integrated, developers write field names wrong → TypeScript catches it immediately → No production bugs.

Until then, field names are discovered by production errors, which we keep finding.
