# Test Infrastructure - Quick Reference

## 🚀 Quick Start

```bash
# Run all tests
npm test

# Run infrastructure tests only
npm run test:infrastructure

# Run feature tests only
npm run test:features

# Run specific infrastructure test
npm run test:auth
npm run test:limits
npm run test:billing

# Watch mode (auto-rerun on changes)
npm run test:infrastructure:watch
npm run test:features:watch

# Coverage reports
npm run test:infrastructure:coverage
npm run test:features:coverage
```

---

## 📁 Directory Structure

```
tests/
├── infrastructure/              # INFRASTRUCTURE TESTS
│   ├── auth.test.js            # Authentication system
│   ├── subscription-limits.test.js  # Subscription enforcement
│   └── billing.test.js         # Stripe billing
│
├── helpers/                     # SHARED UTILITIES
│   └── test-helpers.js         # Mock creators, assertions
│
├── business-outcomes.test.js    # FEATURE TESTS
├── business-value-alerts.test.js
├── audit-verification.test.js
└── integration/
    └── data-flows.test.js
```

---

## 🔍 What's the Difference?

### Infrastructure Tests (`tests/infrastructure/`)
**Answer:** *"Does the platform infrastructure work correctly?"*

- ✅ Authentication (login, tokens, sessions)
- ✅ Subscription limits (counters, enforcement, bypass prevention)
- ✅ Billing (Stripe webhooks, payments, refunds)
- ✅ Security (authorization, data isolation)

**Coverage Goal:** 90%+

### Feature Tests (`tests/*.test.js`)
**Answer:** *"Does this feature deliver the right business outcome?"*

- ✅ USMCA workflow completion
- ✅ Tariff analysis accuracy
- ✅ Alert generation
- ✅ Certificate creation
- ✅ Dashboard display

**Coverage Goal:** 70%+

---

## 🛠️ Test Helpers

### Import Helpers
```javascript
const {
  createMockUser,
  createMockUserWithTier,
  createMockUserAtLimit,
  generateMockToken,
  createAuthenticatedRequest,
  assertAPIResponse,
  assertLimitExceeded
} = require('./helpers/test-helpers');
```

### Common Patterns

#### Create Mock User
```javascript
// Basic user
const user = createMockUser({ email: 'test@example.com' });

// User with specific tier
const starterUser = createMockUserWithTier('Starter', 10);

// User at limit
const limitedUser = createMockUserAtLimit('Trial');
```

#### Create API Request
```javascript
// Authenticated request
const { req, res } = createAuthenticatedRequest('POST', { data: 'test' });

// Unauthenticated request
const { req, res } = createUnauthenticatedRequest('GET');
```

#### Assertions
```javascript
// Assert API response
assertAPIResponse(response, 200, ['user', 'token']);

// Assert auth required
assertAuthRequired(response);

// Assert limit exceeded
assertLimitExceeded(response);
```

---

## 📝 Writing New Tests

### 1. Is it infrastructure or feature?

**Infrastructure test if:**
- Tests authentication, authorization, security
- Tests subscription limits, counters, billing
- Tests platform capability used by ALL features

**Feature test if:**
- Tests specific business workflow (USMCA, alerts, etc.)
- Tests business rule or calculation
- Tests user outcome or data flow

### 2. Create test file

**Infrastructure:**
```bash
touch tests/infrastructure/my-test.test.js
```

**Feature:**
```bash
touch tests/my-feature.test.js
```

### 3. Use template

**Infrastructure test:**
```javascript
describe('Infrastructure: [System]', () => {
  test('[What it validates]', async () => {
    /**
     * INFRASTRUCTURE REQUIREMENT:
     * [Explain what must work]
     */

    // Arrange
    const input = {};

    // Act
    const result = {};

    // Assert
    expect(result).toBe(expected);
  });
});
```

**Feature test:**
```javascript
describe('[Feature]: Business Outcomes', () => {
  test('[User gets expected outcome]', () => {
    /**
     * BUSINESS SCENARIO:
     * [Describe user scenario]
     */

    const userInput = {};
    const expectedOutcomes = {};

    expect(expectedOutcomes).toBe(expected);
  });
});
```

---

## 🎯 Testing Checklist

Before committing code, ensure:

- [ ] Infrastructure tests pass (`npm run test:infrastructure`)
- [ ] Feature tests pass (`npm run test:features`)
- [ ] New features have corresponding tests
- [ ] Test names clearly describe what's tested
- [ ] Tests use helpers from `test-helpers.js`
- [ ] Both success and failure cases are tested
- [ ] No hardcoded test data (use helpers)

---

## 📊 Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
# Open: coverage/lcov-report/index.html in browser
```

**Coverage Goals:**
- Infrastructure: 90%+
- Features: 70%+
- Integration: 60%+

---

## 🐛 Troubleshooting

### Tests timeout
```javascript
// In tests/setup.js
jest.setTimeout(30000); // Increase to 30s
```

### Cannot find module
Check `jest.config.js` module paths

### Mock not working
Check `tests/helpers/test-helpers.js` - ensure exported

### Database tests fail
Check `.env.test` credentials

---

## 📖 Full Documentation

For detailed guide, see: [TEST_INFRASTRUCTURE_GUIDE.md](../TEST_INFRASTRUCTURE_GUIDE.md)

For Jest docs, see: https://jestjs.io/docs/getting-started

---

## 🎓 Examples

### Example 1: Test Authentication
```javascript
const { createAuthenticatedRequest, assertAPIResponse } = require('./helpers/test-helpers');

test('Valid token grants access', async () => {
  const { req, res } = createAuthenticatedRequest('GET', {}, 'user123');

  // Call your API endpoint here
  // await myAPIHandler(req, res);

  assertAPIResponse(res, 200, ['data']);
});
```

### Example 2: Test Subscription Limit
```javascript
const { createMockUserAtLimit, assertLimitExceeded } = require('./helpers/test-helpers');

test('User at limit cannot proceed', async () => {
  const user = createMockUserAtLimit('Trial');

  const response = {
    statusCode: 403,
    body: { success: false, error: 'Limit reached' }
  };

  assertLimitExceeded(response);
});
```

### Example 3: Test Business Outcome
```javascript
test('User sees correct tariff savings', () => {
  const userInput = {
    trade_volume: 1000000,
    mfn_rate: 12.5,
    usmca_rate: 0
  };

  const savings = (userInput.mfn_rate - userInput.usmca_rate) * userInput.trade_volume / 100;

  expect(savings).toBe(125000); // $125,000 annual savings
});
```

---

**Last Updated:** November 11, 2025
