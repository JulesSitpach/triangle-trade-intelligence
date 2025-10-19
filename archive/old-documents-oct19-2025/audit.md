Looking at your CLAUDE.md, I can see this is a complex system with multiple data transformation points. Here's the **specific prompt for your agent** based on your actual architecture:

---

## Complete Data Flow Audit - Triangle Trade Intelligence Platform

**Context:** This is a USMCA compliance platform with complex data flows blocking launch. User keeps finding data inconsistencies, naming mismatches, and persistence issues throughout the system.

### Your Mission: Find and Fix ALL Data Flow Issues

---

## Phase 1: Map All Data Structures (DO THIS FIRST)

**Find and document every place data is defined:**

1. **Database schemas** (`database/migrations/`)
   - user_profiles table
   - usmca_workflows table  
   - service_requests table
   - hs_master_rebuild table

2. **API request/response structures** (`pages/api/**/*.js`)
   - `/api/auth/me` response
   - `/api/stripe/create-service-checkout` request
   - All admin service APIs
   - Workflow save/retrieve APIs

3. **Component prop structures** (`components/**/*.js`)
   - subscriberData structure
   - componentOrigins structure
   - serviceRequest structure
   - enrichedComponent structure

4. **localStorage/state structures**
   - What gets saved to localStorage
   - What gets saved to database
   - What stays in React state only

5. **Config files** (`config/*.js`)
   - SERVICE_CONFIGURATIONS
   - TEAM_CONFIG
   - All status enums

**Deliverable:** Create `AUDIT-REPORT.md` listing EVERY data structure you find with:
- Where it's defined
- What fields it has
- Where it's used
- Any inconsistencies with other similar structures

---

## Phase 2: Find Naming Inconsistencies

**Search the entire codebase for these patterns:**

```bash
# Find all variations of similar field names
grep -r "company_name\|companyName\|company" --include="*.js" --include="*.jsx"
grep -r "subscription_tier\|subscriptionTier\|tier" --include="*.js"
grep -r "hs_code\|hsCode\|hs-code" --include="*.js"
grep -r "tariff_rate\|tariffRate\|rate" --include="*.js"
```

**Common problems to look for:**
- snake_case vs camelCase (company_name vs companyName)
- Inconsistent pluralization (component vs components)
- Missing fields in transformations
- Different names for same concept

**Deliverable:** Add to `AUDIT-REPORT.md` a section listing all naming inconsistencies.

---

## Phase 3: Trace Critical Data Flows

**Pick 3 critical user journeys and trace data end-to-end:**

### Flow 1: USMCA Workflow Submission
```
User fills form → localStorage → database → enrichment → display
```

**Trace every transformation:**
1. What fields does CompanyInformationStep.js expect?
2. What gets saved to localStorage?
3. What API endpoint saves to database?
4. Does the database schema match?
5. What does enrichment add?
6. What does WorkflowResults.js display?
7. **Are ANY fields lost along the way?**

### Flow 2: Service Request Purchase
```
User selects service → Stripe checkout → service_requests table → admin dashboard
```

**Trace every transformation:**
1. What data does create-service-checkout.js receive?
2. What gets sent to Stripe?
3. What gets saved to service_requests table?
4. What does admin dashboard expect?
5. **Are subscriber_data fields consistent?**

### Flow 3: Component Enrichment
```
Component data → AI classification → tariff lookup → display in dashboard
```

**Trace every transformation:**
1. What fields start in component_origins?
2. What does OpenRouter API add?
3. What does database lookup add?
4. What gets saved back to database?
5. What do admin dashboards display?
6. **Are enrichment fields consistent everywhere?**

**Deliverable:** Add to `AUDIT-REPORT.md` a section showing each flow with data structure at each step. Highlight where data gets lost or transformed incorrectly.

---

## Phase 4: Create Single Source of Truth

**Create `types/data-contracts.ts` with TypeScript interfaces for everything:**

```typescript
// Example structure you need to create
export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  subscription_tier: 'Trial' | 'Starter' | 'Professional' | 'Premium';
  company_name: string;
  created_at: string;
}

export interface ComponentOrigin {
  country: string;
  percentage: number;
  component_type: string;
  description: string;
  // Enrichment fields
  hs_code?: string;
  hs_description?: string;
  mfn_rate?: number;
  usmca_rate?: number;
  savings_amount?: number;
  ai_confidence?: number;
}

export interface SubscriberData {
  company_name: string;
  business_type: string;
  trade_volume: string;
  product_description: string;
  component_origins: ComponentOrigin[];
  qualification_status: string;
  // Add ALL fields that should be here
}

// Create interfaces for:
// - ServiceRequest
// - USMCAWorkflow
// - EnrichedComponent
// - API responses
// - Everything else
```

**Deliverable:** Complete `types/data-contracts.ts` file

---

## Phase 5: Add Validation at Every Boundary

**Create `lib/validation.js` with validation functions:**

```javascript
import { z } from 'zod'; // Use Zod for validation

// Example validation schema
export const ComponentOriginSchema = z.object({
  country: z.string().min(1),
  percentage: z.number().min(0).max(100),
  component_type: z.string().min(1),
  description: z.string().optional(),
  hs_code: z.string().optional(),
  // Add all fields
});

export const SubscriberDataSchema = z.object({
  company_name: z.string().min(1),
  business_type: z.string().min(1),
  component_origins: z.array(ComponentOriginSchema),
  // Add all required fields
});

// Validation helper
export function validateSubscriberData(data) {
  const result = SubscriberDataSchema.safeParse(data);
  if (!result.success) {
    console.error('Validation failed:', result.error.format());
    throw new Error(`Invalid subscriber data: ${result.error.message}`);
  }
  return result.data;
}
```

**Then add validation to:**
- All API endpoints (validate incoming data)
- Before database saves (validate structure)
- After database reads (validate returned data)
- Before passing to components (validate props)

**Deliverable:** Complete `lib/validation.js` and add validation calls to all API endpoints

---

## Phase 6: Fix All Issues

**Now systematically fix every issue found:**

1. **Standardize field names** - Pick one convention (snake_case or camelCase) and update everywhere
2. **Add missing fields** - Ensure all transformations preserve all data
3. **Fix database schema** - Update migrations if needed
4. **Update all APIs** - Use validation, return consistent structures
5. **Update all components** - Use TypeScript interfaces, validate props
6. **Add error handling** - Fail loudly when validation fails

**Deliverable:** Git commits for each fix with clear messages

---

## Phase 7: Add Integration Tests

**Create `tests/data-flows.test.js`:**

```javascript
// Test complete data flows end-to-end
test('USMCA workflow saves all data correctly', async () => {
  const workflowData = {
    company_name: 'Test Co',
    business_type: 'Manufacturer',
    // ... complete test data
  };
  
  // Save to localStorage
  localStorage.setItem('workflowData', JSON.stringify(workflowData));
  
  // Call API
  const response = await fetch('/api/workflows/save', {
    method: 'POST',
    body: JSON.stringify(workflowData)
  });
  
  // Verify response
  expect(response.ok).toBe(true);
  
  // Verify database
  const saved = await supabase
    .from('usmca_workflows')
    .select('*')
    .eq('id', response.id)
    .single();
    
  // Assert all fields present
  expect(saved.company_name).toBe(workflowData.company_name);
  // ... check every field
});
```

**Deliverable:** Test suite that validates data flows work end-to-end

---

## Specific Issues to Look For

Based on the CLAUDE.md, check these specific problem areas:

1. **Subscription tier flow:**
   - Does `/api/auth/me` always return subscription_tier?
   - Is it used consistently everywhere?
   - Do components handle missing tier gracefully?

2. **Component enrichment:**
   - Do enriched fields persist to database?
   - Are enriched components displayed correctly in all dashboards?
   - Does enrichment handle missing data?

3. **Service request flow:**
   - Does subscriber_data include ALL workflow fields?
   - Are service prices calculated correctly?
   - Do admin dashboards show complete subscriber context?

4. **Config vs database:**
   - Are configs the source of truth for static data?
   - Is database the source of truth for user data?
   - No overlap or confusion?

---

## Final Deliverable

**Create a Pull Request with:**

1. `AUDIT-REPORT.md` - Complete audit findings
2. `types/data-contracts.ts` - TypeScript interfaces for everything
3. `lib/validation.js` - Validation functions
4. All fixed files with consistent data structures
5. `tests/data-flows.test.js` - Integration tests
6. Updated `CLAUDE.md` reflecting the fixed architecture

**Success Criteria:**
- ✅ All data flows traced and documented
- ✅ Single source of truth for all data structures
- ✅ Validation at every boundary
- ✅ All naming inconsistencies fixed
- ✅ All tests passing
- ✅ No data lost in transformations

---

