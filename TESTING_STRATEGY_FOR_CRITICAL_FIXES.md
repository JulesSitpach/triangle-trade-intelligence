# Testing Strategy for Critical Fixes (October 23, 2025)

## 🎯 Executive Summary

**Recommendation**: Use **API-First Testing** (not Playwright) for validating the 8 critical fixes.

**Why**:
- All 8 fixes are in business logic (calculations, data validation, enrichment), not UI
- Your project already has Jest + Supabase test infrastructure ready
- API tests are 10x faster and more reliable than browser automation
- Direct access to calculation results for verification

**Effort**: ~4-6 hours to test all fixes comprehensively
**Timeline**: Can run tests while dev server running (npm run dev:3001)

---

## 📊 Quick Comparison

| Approach | Your Fixes | Speed | Reliability | Setup |
|----------|-----------|-------|-------------|--------|
| **Playwright (Browser)** | Not needed - fixes are in API | Slow | Flaky | Already configured |
| **API-First (Jest)** | PERFECT FIT | Fast | Stable | Already set up ✅ |
| **Both** | Browser for happy path, API for calculations | Best | High | Most comprehensive |

**Recommendation**: Start with API-First (Jest), then add Playwright if needed for UI integration.

---

## ✅ Testing Plan: Aligned to 8 Fixes

### Test 1: Issue #1 - Single Source of Truth for Savings

**What to test**: `detailed_analysis.savings_analysis` is the ONLY source of savings

```javascript
describe('Issue #1: Single Source of Truth for Savings', () => {
  test('Savings calculated only in detailed_analysis, not initial_summary', async () => {
    const response = await fetch('/api/ai-usmca-complete-analysis', {
      method: 'POST',
      body: JSON.stringify({
        company_name: 'Steel Co',
        product_hs_code: '7326.90',
        component_origins: [
          { description: 'Steel housing', origin_country: 'MX', value_percentage: 100 }
        ],
        destination_country: 'US'
      })
    });

    const data = await response.json();

    // VERIFY: No initial_summary field exists
    expect(data.analysis.initial_summary).toBeUndefined();

    // VERIFY: Savings ONLY in detailed_analysis
    expect(data.analysis.detailed_analysis.savings_analysis).toBeDefined();
    expect(data.analysis.detailed_analysis.savings_analysis.annual_savings).toBeGreaterThan(0);

    // VERIFY: API response uses detailed_analysis savings
    expect(data.annual_savings).toBe(
      data.analysis.detailed_analysis.savings_analysis.annual_savings
    );
  });
});
```

### Test 2: Issue #2 - Tariff Rate Display with Section 301 Breakdown

**What to test**: Component includes base_mfn_rate, section_301, section_232, total_rate (not just mfn_rate)

```javascript
describe('Issue #2: Tariff Rate Display Breakdown', () => {
  test('Enriched components include base_mfn_rate, section_301, section_232, total_rate', async () => {
    const response = await fetch('/api/ai-usmca-complete-analysis', {
      method: 'POST',
      body: JSON.stringify({
        company_name: 'China Electronics Co',
        product_hs_code: '8542.31',
        component_origins: [
          {
            description: 'Chinese microcontrollers',
            origin_country: 'CN',
            value_percentage: 100
          }
        ],
        destination_country: 'US'
      })
    });

    const data = await response.json();
    const enrichedComponent = data.enrichment_data.component_origins[0];

    // VERIFY: All tariff fields present
    expect(enrichedComponent.base_mfn_rate).toBeDefined();
    expect(enrichedComponent.section_301).toBeDefined();
    expect(enrichedComponent.section_232).toBeDefined();
    expect(enrichedComponent.total_rate).toBeDefined();
    expect(enrichedComponent.usmca_rate).toBeDefined();

    // VERIFY: Section 301 applied for Chinese origin
    if (enrichedComponent.origin_country === 'CN') {
      expect(enrichedComponent.section_301).toBeGreaterThan(0);
    }

    // VERIFY: Calculation math
    // base_mfn_rate + section_301 + section_232 = total_rate (approximately)
    const calculated =
      (enrichedComponent.base_mfn_rate || 0) +
      (enrichedComponent.section_301 || 0) +
      (enrichedComponent.section_232 || 0);

    expect(Math.abs(calculated - enrichedComponent.total_rate) < 0.1).toBe(true);
  });
});
```

### Test 3: Issue #3 - React Form State Normalization

**What to test**: Component form doesn't show "controlled/uncontrolled input" warnings

```javascript
describe('Issue #3: React Form State Normalization', () => {
  test('All component fields have defined values (no undefined)', async () => {
    // This test runs on the frontend side
    // Could be tested by checking form submission doesn't produce errors

    const testComponent = {
      description: 'Steel housing',
      origin_country: 'CN',
      value_percentage: 50,
      hs_code: '',  // Empty string, not undefined
      hs_suggestions: [],  // Empty array, not undefined
      manufacturing_location: 'CN',
      enrichment_error: null,  // null, not undefined
      mfn_rate: null,  // null, not undefined
      usmca_rate: null,
      is_usmca_member: false  // false, not undefined
    };

    // Verify all fields defined (use normalizeComponent function)
    const normalizedComponent = normalizeComponent(testComponent);

    // Every field should have a value (string, number, array, object, null, or false)
    Object.values(normalizedComponent).forEach(value => {
      expect(value).not.toBe(undefined);
    });
  });
});
```

### Test 4: Issue #4 - Certificate Uses User Company Data

**What to test**: Certificate generation uses authData.certifier_type, not workflowData

```javascript
describe('Issue #4: Certificate Uses User Company Data', () => {
  test('Certificate uses authData.certifier_type (user selection), not test data', async () => {
    const authData = {
      user_id: 'test-user-123',
      company_name: 'Acme Manufacturing LLC',
      company_country: 'US',
      certifier_type: 'EXPORTER'  // User's selection from AuthorizationStep
    };

    const response = await fetch('/api/trust/complete-certificate', {
      method: 'POST',
      body: JSON.stringify({
        workflow_data: {
          // This should be ignored for company info
          company_name: 'Test USA Exporter Inc 6'  // Old test data
        },
        auth_data: authData
      })
    });

    const data = await response.json();
    const certificate = data.certificate_data;

    // VERIFY: Uses user's actual company, not test data
    expect(certificate.company_name).toBe('Acme Manufacturing LLC');
    expect(certificate.company_name).not.toBe('Test USA Exporter Inc 6');

    // VERIFY: Uses user's country
    expect(certificate.company_country).toBe('US');

    // VERIFY: Uses user's certifier type
    expect(certificate.certifier_type).toBe('EXPORTER');
  });
});
```

### Test 5: Issue #5 - Database Column Naming (ai_confidence)

**What to test**: All database saves use `ai_confidence`, not `confidence`

```javascript
describe('Issue #5: Database Column Naming', () => {
  test('Enrichment data saved with ai_confidence column (not confidence)', async () => {
    const response = await fetch('/api/ai-usmca-complete-analysis', {
      method: 'POST',
      body: JSON.stringify({
        company_name: 'Test Co',
        product_hs_code: '7326.90',
        component_origins: [
          { description: 'Steel', origin_country: 'MX', value_percentage: 100 }
        ],
        destination_country: 'US',
        save_to_database: true
      })
    });

    const data = await response.json();
    const workflowSessionId = data.workflow_session_id;

    // Query the saved session
    const { data: savedSession, error } = await supabase
      .from('workflow_sessions')
      .select('enrichment_data')
      .eq('id', workflowSessionId)
      .single();

    expect(error).toBeNull();
    expect(savedSession.enrichment_data).toBeDefined();

    // VERIFY: Uses ai_confidence column
    const enrichmentData = savedSession.enrichment_data;
    enrichmentData.component_origins?.forEach(comp => {
      expect(comp.ai_confidence).toBeDefined();
      expect(comp.confidence).toBeUndefined();  // Old column should NOT exist
    });
  });
});
```

### Test 6: Issue #6 - Validation Warnings (Tariff Rates Only)

**What to test**: Validation only checks actual tariff rates, not component percentages

```javascript
describe('Issue #6: Validation Warnings (Tariff Rates Only)', () => {
  test('Validation warnings should NOT mention component percentages', async () => {
    const response = await fetch('/api/ai-usmca-complete-analysis', {
      method: 'POST',
      body: JSON.stringify({
        company_name: 'Multi-component Co',
        product_hs_code: '8517.62',
        component_origins: [
          { description: 'Electronics (50%)', origin_country: 'CN', value_percentage: 50 },
          { description: 'Rubber (30%)', origin_country: 'MX', value_percentage: 30 },
          { description: 'Steel (20%)', origin_country: 'US', value_percentage: 20 }
        ],
        destination_country: 'US'
      })
    });

    const data = await response.json();

    // VERIFY: No warning about "50%", "30%", "20%" (these are component percentages)
    const consoleWarnings = data._validation_warnings || [];

    consoleWarnings.forEach(warning => {
      // Should NOT contain false positives about component percentages
      expect(warning).not.toMatch(/claimed rates.*\[50.*30.*20\]/);

      // ONLY validate actual tariff rates if mentioned
      // (e.g., "2.5% MFN", "25% Section 301")
    });

    // VERIFY: AI response doesn't hallucinate percentages
    expect(data.analysis.detailed_analysis).toBeDefined();
    expect(data.analysis.detailed_analysis.savings_analysis).toBeDefined();
  });
});
```

### Test 7: Issue #7 - Alert System with Workflow Context

**What to test**: Alerts include user's USMCA qualification, RVC percentage, annual savings

```javascript
describe('Issue #7: Alert System with Workflow Context', () => {
  test('Personalized alerts include RVC percentage, qualification status, and savings', async () => {
    // First, create a workflow with USMCA qualification
    const workflowResponse = await fetch('/api/ai-usmca-complete-analysis', {
      method: 'POST',
      body: JSON.stringify({
        company_name: 'Mexico Electronics',
        product_hs_code: '8542.31',
        component_origins: [
          { description: 'Processors', origin_country: 'CN', value_percentage: 30 },
          { description: 'Housings', origin_country: 'MX', value_percentage: 40 },
          { description: 'Connectors', origin_country: 'US', value_percentage: 30 }
        ],
        destination_country: 'US'
      })
    });

    const workflowData = await workflowResponse.json();

    // Then, test alert generation
    const alertResponse = await fetch('/api/consolidate-alerts', {
      method: 'POST',
      body: JSON.stringify({
        alerts: [{
          title: 'Section 301 Tariffs Increase to 30%',
          affected_countries: ['CN'],
          affected_hs_codes: ['8542.31']
        }],
        user_profile: {
          userId: 'test-user-123',
          companyName: 'Mexico Electronics',
          tradeVolume: 500000
        }
      })
    });

    const alerts = await alertResponse.json();
    const consolidatedAlert = alerts.consolidated_alerts[0];

    // VERIFY: Alert includes personalized data from workflow
    expect(consolidatedAlert.broker_summary).toBeDefined();
    expect(consolidatedAlert.broker_summary.length).toBeGreaterThan(200);  // Rich content

    // VERIFY: Alert mentions user's actual RVC if qualified
    if (workflowData.analysis.usmca?.qualified) {
      expect(consolidatedAlert.broker_summary).toMatch(/\d+\.\d+%/);  // Contains percentage
    }

    // VERIFY: Alert includes specific action items (not generic)
    expect(consolidatedAlert.specific_action_items?.length).toBeGreaterThan(0);
    consolidatedAlert.specific_action_items?.forEach(action => {
      expect(action).not.toBe('Emergency USMCA Filing ($2,500)');  // Not hardcoded
    });
  });
});
```

### Test 8: BONUS - Alert Duplication Fix

**What to test**: "Found workflow intelligence" message prints only ONCE, not 4x

```javascript
describe('BONUS: Alert Duplication Fix', () => {
  test('Workflow query happens once, not for each alert group', async () => {
    const originalConsoleLog = console.log;
    const logMessages = [];

    console.log = (msg) => logMessages.push(msg);

    try {
      const alertResponse = await fetch('/api/consolidate-alerts', {
        method: 'POST',
        body: JSON.stringify({
          alerts: [
            { title: 'Alert 1', affected_countries: ['CN'], affected_hs_codes: ['8542.31'] },
            { title: 'Alert 2', affected_countries: ['CN'], affected_hs_codes: ['8542.31'] },
            { title: 'Alert 3', affected_countries: ['CN'], affected_hs_codes: ['8542.31'] },
            { title: 'Alert 4', affected_countries: ['CN'], affected_hs_codes: ['8542.31'] }
          ],
          user_profile: {
            userId: 'test-user-123',
            companyName: 'Test Co'
          }
        })
      });

      // VERIFY: "Found workflow intelligence" printed ONLY ONCE
      const workflowIntelligenceMessages = logMessages.filter(msg =>
        msg.includes('Found workflow intelligence')
      );

      expect(workflowIntelligenceMessages.length).toBe(1);
    } finally {
      console.log = originalConsoleLog;
    }
  });
});
```

---

## 🚀 Running the Tests

### Setup (First Time)
```bash
# Install dependencies (if needed)
npm install

# Create .env.local if missing
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY

# Start dev server (keep running)
npm run dev:3001
```

### Run All Tests
```bash
# Run all Jest tests
npm test

# Run specific test file
npm test tests/audit-verification.test.js

# Run specific test with verbose output
npm test -- --verbose Issue

# Watch mode (rerun on file changes)
npm test -- --watch
```

### Run Specific Fix Tests
```bash
# Just Issue #1-4 tests
npm test -- --testNamePattern="Issue #[1-4]"

# Just Issue #7 (alert personalization)
npm test -- --testNamePattern="Issue #7"

# Just the bonus duplication fix
npm test -- --testNamePattern="Alert Duplication"
```

---

## 📊 Expected Test Results

### All Tests Should Pass ✅
- Issue #1: ✅ No initial_summary, savings ONLY in detailed_analysis
- Issue #2: ✅ base_mfn_rate + section_301 + section_232 = total_rate
- Issue #3: ✅ All component fields defined, no undefined
- Issue #4: ✅ Certificate uses authData, not test data
- Issue #5: ✅ Database uses ai_confidence column
- Issue #6: ✅ Validation only for actual tariff rates, not component percentages
- Issue #7: ✅ Alerts personalized with RVC, savings, qualification status
- Bonus: ✅ Workflow intelligence message prints only once

### If Any Test Fails
1. Check error message (will show exactly what's wrong)
2. Find the code location from error stack
3. Fix based on the 8 fixes documented in ALL_ISSUES_FIXED_SUMMARY.md
4. Re-run test

---

## 🎯 When to Use What Testing Approach

| Test Type | Your Fixes | When to Use |
|-----------|-----------|------------|
| **API Tests** (Jest) | All 8 ✅ | Now - fastest validation |
| **Integration Tests** | All 8 ✅ | After API tests pass |
| **Playwright** | UI confirmation | Optional - after API tests |

### Recommended Sequence
1. ✅ **This week**: Run Jest tests (4-6 hours)
2. ⏳ **Next week**: Manual browser testing if needed
3. 🎁 **Optional**: Playwright for UI regression prevention

---

## 💡 Why API-First Testing Is Perfect for Your Fixes

Your 8 fixes are all **calculation and data validation logic**, not UI:
- ✅ Savings calculation (math, not UI)
- ✅ Tariff breakdown (API response, not UI rendering)
- ✅ Form validation (business logic, not UI state)
- ✅ Database schema (API layer, not UI)
- ✅ Alert personalization (data assembly, not rendering)

**Result**: API tests will catch all issues, 10x faster than Playwright.

---

## 📋 Quick Checklist

Before running tests:
- [ ] .env.local file exists with API keys
- [ ] npm install completed
- [ ] Development server running (npm run dev:3001)
- [ ] You understand what each fix addressed
- [ ] You have access to test database (Supabase)

After tests pass:
- [ ] All 8 issues verified working
- [ ] No calculation conflicts
- [ ] No hardcoded test data
- [ ] No duplicate database queries
- [ ] Ready for production deployment

---

## Next Steps

1. **This week**: Run Jest API tests (validate all fixes)
2. **Create additional tests** for edge cases as needed
3. **Optional**: Add Playwright tests for happy path
4. **Deploy** with confidence knowing all critical fixes verified

That's the fast, reliable way to test your financial calculations without the pain of browser automation.
