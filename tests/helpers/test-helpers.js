/**
 * TEST HELPERS & UTILITIES
 *
 * Shared utilities for infrastructure and feature tests:
 * - Mock user creation
 * - Mock API requests/responses
 * - Database test data helpers
 * - Authentication token generation
 * - Common assertions
 */

const { createMocks } = require('node-mocks-http');
const jwt = require('jsonwebtoken');

// ========================================================================
// USER MOCK HELPERS
// ========================================================================

/**
 * Create mock user for testing
 */
function createMockUser(overrides = {}) {
  return {
    id: 'user_test_123',
    email: 'test@example.com',
    company_name: 'Test Company Inc',
    company_country: 'US',
    subscription_tier: 'Trial',
    analysis_count: 0,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    created_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Create mock user with specific subscription tier
 */
function createMockUserWithTier(tier, usageCount = 0) {
  const tierLimits = {
    Trial: 1,
    Starter: 15,
    Professional: 100,
    Premium: 500
  };

  return createMockUser({
    subscription_tier: tier,
    analysis_count: usageCount,
    limit: tierLimits[tier]
  });
}

/**
 * Create mock user at subscription limit
 */
function createMockUserAtLimit(tier) {
  const tierLimits = {
    Trial: 1,
    Starter: 15,
    Professional: 100,
    Premium: 500
  };

  return createMockUser({
    subscription_tier: tier,
    analysis_count: tierLimits[tier]
  });
}

// ========================================================================
// JWT TOKEN HELPERS
// ========================================================================

/**
 * Generate mock JWT token
 */
function generateMockToken(userId = 'user_test_123', expiresIn = '24h') {
  const secret = process.env.JWT_SECRET || 'test_secret_key';

  return jwt.sign(
    {
      userId: userId,
      email: 'test@example.com'
    },
    secret,
    { expiresIn }
  );
}

/**
 * Generate expired JWT token
 */
function generateExpiredToken(userId = 'user_test_123') {
  const secret = process.env.JWT_SECRET || 'test_secret_key';

  return jwt.sign(
    {
      userId: userId,
      email: 'test@example.com'
    },
    secret,
    { expiresIn: '-1h' } // Already expired
  );
}

// ========================================================================
// API REQUEST HELPERS
// ========================================================================

/**
 * Create mock API request with authentication
 */
function createAuthenticatedRequest(method = 'GET', body = {}, userId = 'user_test_123') {
  const token = generateMockToken(userId);

  const { req, res } = createMocks({
    method,
    headers: {
      authorization: `Bearer ${token}`
    },
    body
  });

  return { req, res };
}

/**
 * Create mock unauthenticated API request
 */
function createUnauthenticatedRequest(method = 'GET', body = {}) {
  const { req, res } = createMocks({
    method,
    headers: {},
    body
  });

  return { req, res };
}

/**
 * Create mock Stripe webhook request
 */
function createStripeWebhookRequest(eventType, eventData) {
  const { req, res } = createMocks({
    method: 'POST',
    headers: {
      'stripe-signature': 'mock_signature'
    },
    body: {
      type: eventType,
      data: eventData
    }
  });

  return { req, res };
}

// ========================================================================
// WORKFLOW MOCK HELPERS
// ========================================================================

/**
 * Create mock workflow session
 */
function createMockWorkflowSession(overrides = {}) {
  return {
    id: 'ws_test_123',
    user_id: 'user_test_123',
    company_name: 'Test Company',
    company_country: 'US',
    destination_country: 'US',
    trade_volume: '1000000',
    components: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Create mock component data
 */
function createMockComponent(overrides = {}) {
  return {
    description: 'Test Component',
    origin_country: 'CN',
    value_percentage: 100,
    manufacturing_location: 'CN',
    hs_code: '8542.31.00',
    mfn_rate: 0.0,
    section_301_rate: 25.0,
    total_tariff_rate: 25.0,
    ...overrides
  };
}

/**
 * Create USMCA-qualified workflow
 */
function createUSMCAQualifiedWorkflow() {
  return createMockWorkflowSession({
    components: [
      createMockComponent({
        description: 'US-made component',
        origin_country: 'US',
        value_percentage: 60
      }),
      createMockComponent({
        description: 'Mexico-made component',
        origin_country: 'MX',
        value_percentage: 40
      })
    ],
    qualification_status: 'QUALIFIED',
    regional_content_percentage: 100
  });
}

/**
 * Create non-USMCA-qualified workflow (China origin)
 */
function createNonUSMCAQualifiedWorkflow() {
  return createMockWorkflowSession({
    components: [
      createMockComponent({
        description: 'China component',
        origin_country: 'CN',
        value_percentage: 100,
        section_301_rate: 25.0
      })
    ],
    qualification_status: 'NOT_QUALIFIED',
    regional_content_percentage: 0
  });
}

// ========================================================================
// SUBSCRIPTION & BILLING HELPERS
// ========================================================================

/**
 * Create mock Stripe checkout session
 */
function createMockStripeSession(overrides = {}) {
  return {
    id: 'cs_test_123',
    customer: 'cus_test_123',
    subscription: 'sub_test_123',
    client_reference_id: 'user_test_123',
    amount_total: 9900,
    payment_status: 'paid',
    ...overrides
  };
}

/**
 * Create mock Stripe invoice
 */
function createMockStripeInvoice(overrides = {}) {
  return {
    id: 'in_test_123',
    customer: 'cus_test_123',
    subscription: 'sub_test_123',
    amount_paid: 9900,
    amount_due: 9900,
    currency: 'usd',
    status: 'paid',
    created: Math.floor(Date.now() / 1000),
    ...overrides
  };
}

/**
 * Create mock subscription record
 */
function createMockSubscription(tier = 'Starter', overrides = {}) {
  return {
    user_id: 'user_test_123',
    stripe_customer_id: 'cus_test_123',
    stripe_subscription_id: 'sub_test_123',
    subscription_tier: tier,
    subscription_status: 'active',
    billing_cycle_start: new Date().toISOString(),
    cancel_at_period_end: false,
    ...overrides
  };
}

// ========================================================================
// ALERT & POLICY HELPERS
// ========================================================================

/**
 * Create mock crisis alert
 */
function createMockCrisisAlert(overrides = {}) {
  return {
    id: 'alert_test_123',
    title: 'Section 301 Tariff Update',
    description: 'New tariffs on Chinese electronics',
    severity: 'HIGH',
    status: 'NEW',
    effective_date: new Date().toISOString(),
    affected_countries: ['CN'],
    affected_hs_codes: ['8542.31'],
    relevant_industries: ['Electronics'],
    ...overrides
  };
}

/**
 * Create mock tariff intelligence data
 */
function createMockTariffData(hsCode, overrides = {}) {
  return {
    hs_code: hsCode,
    mfn_ad_val_rate: 0.0,
    section_301_rate: 0.0,
    section_232_rate: 0.0,
    usmca_ad_val_rate: 0.0,
    description: 'Test product',
    ...overrides
  };
}

// ========================================================================
// ASSERTION HELPERS
// ========================================================================

/**
 * Assert API response structure
 */
function assertAPIResponse(response, expectedStatus, expectedFields = []) {
  expect(response.statusCode).toBe(expectedStatus);
  expect(response.body).toBeDefined();

  if (expectedStatus === 200) {
    expect(response.body.success).toBe(true);
  }

  expectedFields.forEach(field => {
    expect(response.body).toHaveProperty(field);
  });
}

/**
 * Assert authentication required
 */
function assertAuthRequired(response) {
  expect(response.statusCode).toBe(401);
  expect(response.body.success).toBe(false);
  expect(response.body.error).toMatch(/auth|token|login/i);
}

/**
 * Assert limit exceeded
 */
function assertLimitExceeded(response) {
  expect(response.statusCode).toBe(403);
  expect(response.body.success).toBe(false);
  expect(response.body.error).toMatch(/limit|exceeded|reached/i);
}

/**
 * Assert subscription tier
 */
function assertSubscriptionTier(user, expectedTier) {
  expect(user.subscription_tier).toBe(expectedTier);
}

/**
 * Assert usage count
 */
function assertUsageCount(user, expectedCount) {
  expect(user.analysis_count).toBe(expectedCount);
}

// ========================================================================
// DATABASE TEST HELPERS
// ========================================================================

/**
 * Clean test data (use in beforeEach/afterEach)
 */
async function cleanTestData(supabase, userId = 'user_test_123') {
  // Delete user's workflows
  await supabase
    .from('workflow_sessions')
    .delete()
    .eq('user_id', userId);

  // Delete user's completions
  await supabase
    .from('workflow_completions')
    .delete()
    .eq('user_id', userId);

  // Delete test user
  await supabase
    .from('user_profiles')
    .delete()
    .eq('id', userId);
}

/**
 * Create test user in database
 */
async function createTestUser(supabase, userData = {}) {
  const user = createMockUser(userData);

  const { data, error } = await supabase
    .from('user_profiles')
    .insert(user)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  return data;
}

// ========================================================================
// EXPORTS
// ========================================================================

module.exports = {
  // User helpers
  createMockUser,
  createMockUserWithTier,
  createMockUserAtLimit,

  // Token helpers
  generateMockToken,
  generateExpiredToken,

  // API helpers
  createAuthenticatedRequest,
  createUnauthenticatedRequest,
  createStripeWebhookRequest,

  // Workflow helpers
  createMockWorkflowSession,
  createMockComponent,
  createUSMCAQualifiedWorkflow,
  createNonUSMCAQualifiedWorkflow,

  // Subscription helpers
  createMockStripeSession,
  createMockStripeInvoice,
  createMockSubscription,

  // Alert helpers
  createMockCrisisAlert,
  createMockTariffData,

  // Assertion helpers
  assertAPIResponse,
  assertAuthRequired,
  assertLimitExceeded,
  assertSubscriptionTier,
  assertUsageCount,

  // Database helpers
  cleanTestData,
  createTestUser
};
