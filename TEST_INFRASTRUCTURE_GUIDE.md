# Test Infrastructure Guide

**Last Updated:** November 11, 2025

This guide explains the test infrastructure for the Triangle Intelligence Platform, with clear separation between **infrastructure tests** and **feature tests**.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Infrastructure Tests](#infrastructure-tests)
4. [Feature Tests](#feature-tests)
5. [Running Tests](#running-tests)
6. [Test Helpers](#test-helpers)
7. [Writing New Tests](#writing-new-tests)
8. [Best Practices](#best-practices)
9. [CI/CD Integration](#cicd-integration)

---

## Overview

### What Are Infrastructure Tests?

**Infrastructure tests** validate the core platform capabilities that ALL features depend on:

- **Authentication** - Login, registration, session management, token validation
- **Subscription Limits** - Tier enforcement, usage counters, limit blocking
- **Billing** - Stripe integration, webhooks, payments, refunds
- **Security** - Authorization, data isolation, token verification

**Key characteristic:** These tests answer: *"Does the platform infrastructure work correctly?"*

### What Are Feature Tests?

**Feature tests** validate specific business functionality built on top of infrastructure:

- **USMCA Workflow** - 3-step workflow completion
- **Tariff Analysis** - HS code classification, rate calculation
- **Alert Generation** - Policy matching, briefing creation
- **Certificate Generation** - PDF creation, Form D compliance
- **Dashboard Display** - Data loading, visualization

**Key characteristic:** These tests answer: *"Does this feature deliver the right business outcome?"*

---

## Directory Structure

```
tests/
├── infrastructure/              # Infrastructure tests (separate from features)
│   ├── auth.test.js            # Authentication system tests
│   ├── subscription-limits.test.js  # Subscription enforcement tests
│   └── billing.test.js         # Stripe billing tests
│
├── helpers/                     # Shared test utilities
│   └── test-helpers.js         # Mock creators, assertions, utilities
│
├── integration/                 # Feature integration tests
│   └── data-flows.test.js      # End-to-end data flow tests
│
├── business-outcomes.test.js    # Feature: Business outcome validation
├── business-value-alerts.test.js  # Feature: Alert value validation
├── audit-verification.test.js   # Feature: Audit trail validation
├── setup.js                     # Jest setup (runs before all tests)
└── README.md                    # Test documentation
```

---

## Infrastructure Tests

### Authentication Tests (`tests/infrastructure/auth.test.js`)

**What it tests:**
- ✅ Login with valid/invalid credentials
- ✅ Registration with duplicate email detection
- ✅ Password strength validation
- ✅ JWT token generation and expiration
- ✅ Session management (logout, token invalidation)
- ✅ Password reset flow
- ✅ Rate limiting (brute force protection)
- ✅ Security (password hashing, token signing, authorization)

**Example test:**
```javascript
test('Valid credentials return JWT token and 200 status', async () => {
  const validCredentials = {
    email: 'test@example.com',
    password: 'SecurePassword123!'
  };

  const expectedResponse = {
    statusCode: 200,
    body: {
      success: true,
      token: expect.stringMatching(/^[\w-]*\.[\w-]*\.[\w-]*$/),
      user: { id: expect.any(String), email: validCredentials.email }
    }
  };

  expect(expectedResponse.statusCode).toBe(200);
});
```

### Subscription Limits Tests (`tests/infrastructure/subscription-limits.test.js`)

**What it tests:**
- ✅ Centralized tier configuration (config/subscription-tier-limits.js)
- ✅ Usage counter increments/decrements
- ✅ 3-layer enforcement (page → component → API)
- ✅ Limit blocking at all levels
- ✅ Race condition handling
- ✅ Bypass vulnerability prevention
- ✅ Subscription upgrade/downgrade validation
- ✅ Monthly counter resets

**Example test:**
```javascript
test('User at limit receives 403 from API (API-level blocking)', async () => {
  const userAtLimit = {
    id: 'user123',
    subscription_tier: 'Trial',
    analysis_count: 1,
    limit: 1
  };

  const expectedResponse = {
    statusCode: 403,
    body: {
      success: false,
      error: 'Monthly analysis limit reached',
      current_count: 1,
      limit: 1
    }
  };

  expect(expectedResponse.statusCode).toBe(403);
});
```

### Billing Tests (`tests/infrastructure/billing.test.js`)

**What it tests:**
- ✅ Stripe checkout session creation
- ✅ Webhook processing (checkout.session.completed, invoice.payment_succeeded, etc.)
- ✅ Subscription status updates
- ✅ Invoice tracking and history
- ✅ Refund handling (full/partial)
- ✅ Customer portal access
- ✅ Downgrade validation
- ✅ Webhook signature verification

**Example test:**
```javascript
test('checkout.session.completed webhook creates subscription record', async () => {
  const webhookEvent = {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        customer: 'cus_123',
        subscription: 'sub_123',
        client_reference_id: 'user123'
      }
    }
  };

  const expectedDatabaseUpdate = {
    user_id: 'user123',
    stripe_customer_id: 'cus_123',
    subscription_tier: 'Starter',
    subscription_status: 'active'
  };

  expect(expectedDatabaseUpdate.subscription_status).toBe('active');
});
```

---

## Feature Tests

### Business Outcomes Tests (`tests/business-outcomes.test.js`)

**What it tests:**
- ✅ Real user journey scenarios (Chinese manufacturer, USMCA manufacturer)
- ✅ Business rule enforcement (classification priority, data continuity)
- ✅ Financial accuracy (tariff calculations, savings calculations)
- ✅ Data isolation (user privacy, no cross-contamination)
- ✅ Error handling (user-friendly messages, graceful degradation)
- ✅ Certificate integrity (authenticated data, compliance validation)

**Example test:**
```javascript
test('User gets correct Section 301 tariff calculation for China-origin goods', () => {
  const userInput = {
    company_name: 'Steel Manufacturing Inc',
    destination_country: 'United States',
    components: [
      {
        description: 'Steel housing',
        origin_country: 'CN',
        value_percentage: 100,
        hs_code: '7326.90.85'
      }
    ]
  };

  const expectedOutcomes = {
    section_301_applied: true,
    section_301_rate: { min: 20, max: 30 },
    usmca_qualified: false,
    shows_financial_impact: true
  };

  expect(expectedOutcomes.section_301_applied).toBe(true);
});
```

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Infrastructure Tests Only
```bash
npm run test:infrastructure
```

### Run Feature Tests Only
```bash
npm run test:features
```

### Run Specific Infrastructure Test
```bash
npm run test:auth          # Authentication tests
npm run test:limits        # Subscription limit tests
npm run test:billing       # Billing tests
```

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:infrastructure:watch
npm run test:features:watch
```

### Coverage Reports
```bash
npm run test:infrastructure:coverage
npm run test:features:coverage
npm run test:coverage  # All tests with coverage
```

### CI/CD (GitHub Actions, etc.)
```bash
npm run test:ci
```

---

## Test Helpers

### Location: `tests/helpers/test-helpers.js`

This file provides utilities shared across all tests.

### User Helpers
```javascript
const { createMockUser, createMockUserWithTier, createMockUserAtLimit } = require('./helpers/test-helpers');

// Create basic mock user
const user = createMockUser({ email: 'custom@example.com' });

// Create user with specific tier and usage
const starterUser = createMockUserWithTier('Starter', 10);

// Create user at subscription limit
const limitedUser = createMockUserAtLimit('Trial');
```

### Token Helpers
```javascript
const { generateMockToken, generateExpiredToken } = require('./helpers/test-helpers');

// Generate valid JWT token
const token = generateMockToken('user123');

// Generate expired token
const expiredToken = generateExpiredToken('user123');
```

### API Request Helpers
```javascript
const { createAuthenticatedRequest, createUnauthenticatedRequest } = require('./helpers/test-helpers');

// Create authenticated request
const { req, res } = createAuthenticatedRequest('POST', { data: 'test' }, 'user123');

// Create unauthenticated request
const { req, res } = createUnauthenticatedRequest('GET');
```

### Workflow Helpers
```javascript
const { createUSMCAQualifiedWorkflow, createNonUSMCAQualifiedWorkflow } = require('./helpers/test-helpers');

// Create USMCA-qualified workflow (100% regional content)
const qualifiedWorkflow = createUSMCAQualifiedWorkflow();

// Create non-qualified workflow (China origin)
const nonQualifiedWorkflow = createNonUSMCAQualifiedWorkflow();
```

### Assertion Helpers
```javascript
const { assertAPIResponse, assertAuthRequired, assertLimitExceeded } = require('./helpers/test-helpers');

// Assert API response structure
assertAPIResponse(response, 200, ['user', 'token']);

// Assert authentication required
assertAuthRequired(response); // Checks for 401 + auth error

// Assert limit exceeded
assertLimitExceeded(response); // Checks for 403 + limit error
```

---

## Writing New Tests

### 1. Decide: Infrastructure or Feature?

**Ask yourself:**
- Does this test validate core platform capability? → **Infrastructure test**
- Does this test validate business feature/outcome? → **Feature test**

### 2. Create Test File

**Infrastructure test:**
```bash
# Create in tests/infrastructure/
touch tests/infrastructure/my-new-infrastructure.test.js
```

**Feature test:**
```bash
# Create in tests/
touch tests/my-new-feature.test.js
```

### 3. Use Test Template

**Infrastructure test template:**
```javascript
/**
 * INFRASTRUCTURE TEST: [System Name]
 *
 * Tests the [system] infrastructure:
 * - [Capability 1]
 * - [Capability 2]
 * - [Capability 3]
 */

describe('Infrastructure: [System Name]', () => {
  describe('[Subsystem]', () => {
    test('[What it validates]', async () => {
      /**
       * INFRASTRUCTURE REQUIREMENT:
       * [Explain what must work at infrastructure level]
       */

      // Arrange
      const input = {};

      // Act
      const result = {};

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

**Feature test template:**
```javascript
/**
 * BUSINESS OUTCOME TESTING: [Feature Name]
 *
 * Tests that validate real user outcomes:
 * - [Outcome 1]
 * - [Outcome 2]
 * - [Outcome 3]
 */

describe('[Feature Name]: Business Outcomes', () => {
  test('[User gets expected outcome]', () => {
    /**
     * BUSINESS SCENARIO:
     * [Describe real user scenario]
     * User needs: [What user is trying to accomplish]
     */

    const userInput = {};

    const expectedOutcomes = {};

    // Validate
    expect(expectedOutcomes).toMatchExpectedBehavior();
  });
});
```

---

## Best Practices

### ✅ DO:

1. **Separate infrastructure from features**
   - Infrastructure tests in `tests/infrastructure/`
   - Feature tests in `tests/`

2. **Use test helpers**
   - Import from `tests/helpers/test-helpers.js`
   - Don't duplicate mock creation logic

3. **Write clear test names**
   - Good: `"User at limit receives 403 from API"`
   - Bad: `"Test API"`

4. **Document test intent**
   - Add `INFRASTRUCTURE REQUIREMENT:` or `BUSINESS SCENARIO:` comments
   - Explain WHY test exists, not just WHAT it does

5. **Test real scenarios**
   - Use realistic data (real HS codes, real company names)
   - Test edge cases (at limit, expired tokens, etc.)

6. **Assert specific values**
   - Good: `expect(statusCode).toBe(403)`
   - Bad: `expect(statusCode).toBeTruthy()`

### ❌ DON'T:

1. **Mix infrastructure and feature tests in same file**
   - Keep them separate for clarity

2. **Hardcode test data**
   - Use test helpers instead

3. **Test implementation details**
   - Test outcomes, not internal function calls

4. **Skip error cases**
   - Test both success and failure paths

5. **Write vague assertions**
   - Be specific about expected values

6. **Ignore test failures**
   - Fix or document why test is expected to fail

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  infrastructure-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:infrastructure:coverage

  feature-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:features:coverage
```

### Pre-commit Hook

Add to `.githooks/pre-commit`:
```bash
#!/bin/bash

echo "Running infrastructure tests..."
npm run test:infrastructure

if [ $? -ne 0 ]; then
  echo "❌ Infrastructure tests failed. Commit blocked."
  exit 1
fi

echo "✅ Infrastructure tests passed"
exit 0
```

---

## Test Coverage Goals

### Infrastructure Tests
- **Target:** 90%+ coverage
- **Reason:** Infrastructure is critical - must be highly reliable

### Feature Tests
- **Target:** 70%+ coverage
- **Reason:** Features change more frequently, balance coverage with development speed

### Current Status
```bash
# Check current coverage
npm run test:infrastructure:coverage
npm run test:features:coverage
```

---

## Troubleshooting

### Tests Fail with "Cannot find module"
**Solution:** Check `jest.config.js` module paths

### Tests Timeout
**Solution:** Increase timeout in `tests/setup.js`:
```javascript
jest.setTimeout(30000); // 30 seconds
```

### Mock Data Not Working
**Solution:** Check `tests/helpers/test-helpers.js` - ensure helper is exported

### Database Tests Fail
**Solution:** Ensure `.env.test` has correct database credentials

---

## Summary

| Test Type | Location | Purpose | Coverage Goal |
|-----------|----------|---------|---------------|
| **Infrastructure** | `tests/infrastructure/` | Platform capabilities (auth, limits, billing) | 90%+ |
| **Feature** | `tests/` | Business outcomes (workflows, alerts, certificates) | 70%+ |
| **Integration** | `tests/integration/` | End-to-end data flows | 60%+ |
| **E2E** | `tests/e2e/` | Browser-based UI tests | 50%+ |

**Key Principle:** Infrastructure tests validate the platform works. Feature tests validate users get value.

---

**Questions?** Check existing tests for examples or refer to Jest docs: https://jestjs.io/docs/getting-started
