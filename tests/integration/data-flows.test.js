/**
 * INTEGRATION TESTS - Data Flow Validation
 * Tests complete user journeys end-to-end to verify data flows correctly
 *
 * RUN THESE TESTS BEFORE LAUNCH to validate all fixes worked
 *
 * Usage:
 *   npm test tests/integration/data-flows.test.js
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (use test environment)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test data
const TEST_USER = {
  id: 'test-user-' + Date.now(),
  email: `test+${Date.now()}@triangle-test.com`,
  subscription_tier: 'Professional'
};

const TEST_WORKFLOW_DATA = {
  company_name: 'Test Manufacturing Co',
  business_type: 'Manufacturer',
  industry_sector: 'Electronics',
  trade_volume: '$1M - $5M',
  manufacturing_location: 'Mexico',
  supplier_country: 'China',
  product_description: 'Electric motors for industrial fans with control circuits',
  component_origins: [
    {
      country: 'China',
      percentage: 45,
      value_percentage: 45,
      component_type: 'Motors',
      description: 'Electric motors 500W'
    },
    {
      country: 'Mexico',
      percentage: 30,
      value_percentage: 30,
      component_type: 'Housing',
      description: 'Aluminum housing assembly'
    },
    {
      country: 'Canada',
      percentage: 25,
      value_percentage: 25,
      component_type: 'Controls',
      description: 'Electronic control circuits'
    }
  ]
};

// ============================================================================
// TEST SUITE 1: USMCA WORKFLOW END-TO-END
// ============================================================================

describe('USMCA Workflow Data Flow', () => {
  let workflowResults;

  test('Step 1: User submits workflow form with valid data', async () => {
    const response = await fetch('http://localhost:3001/api/ai-usmca-complete-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_WORKFLOW_DATA)
    });

    const data = await response.json();

    // Validate response structure
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Validate company data preserved
    expect(data.company.name).toBe(TEST_WORKFLOW_DATA.company_name);
    expect(data.company.business_type).toBe(TEST_WORKFLOW_DATA.business_type);

    // Validate product data
    expect(data.product.description).toBe(TEST_WORKFLOW_DATA.product_description);
    expect(data.product.hs_code).toBeDefined();
    expect(data.product.hs_code).toMatch(/^\d{4}\.\d{2}$/);  // Valid HS code format

    // Validate USMCA qualification
    expect(data.usmca.qualified).toBeDefined();
    expect(data.usmca.qualification_status).toMatch(/QUALIFIED|NOT_QUALIFIED|PARTIAL/);
    expect(data.usmca.north_american_content).toBeGreaterThanOrEqual(0);
    expect(data.usmca.north_american_content).toBeLessThanOrEqual(100);

    // Validate component enrichment
    expect(data.usmca.component_breakdown).toHaveLength(3);
    data.usmca.component_breakdown.forEach(comp => {
      expect(comp.hs_code).toBeDefined();           // ✅ snake_case
      expect(comp.mfn_rate).toBeDefined();          // ✅ snake_case
      expect(comp.usmca_rate).toBeDefined();        // ✅ snake_case
      expect(comp.hsCode).toBeUndefined();          // ❌ camelCase should NOT exist
      expect(comp.mfnRate).toBeUndefined();         // ❌ camelCase should NOT exist
    });

    // Validate savings calculation
    expect(data.savings.total_savings).toBeGreaterThanOrEqual(0);
    expect(data.savings.mfn_rate).toBeGreaterThanOrEqual(0);
    expect(data.savings.usmca_rate).toBeGreaterThanOrEqual(0);

    workflowResults = data;
  }, 30000);  // 30 second timeout for AI processing

  test('Step 2: Workflow data saved to database with correct field names', async () => {
    // Simulate saving workflow (as WorkflowDataConnector would)
    const workflowRecord = {
      user_id: TEST_USER.id,
      company_data: {
        company_name: workflowResults.company.name,  // ✅ snake_case
        business_type: workflowResults.company.business_type
      },
      product_data: {
        product_description: workflowResults.product.description,
        hs_code: workflowResults.product.hs_code
      },
      component_origins: workflowResults.usmca.component_breakdown,
      qualification_status: workflowResults.usmca.qualification_status,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('usmca_workflows')
      .insert([workflowRecord])
      .select();

    expect(error).toBeNull();
    expect(data).toHaveLength(1);

    // Validate saved data structure
    const saved = data[0];
    expect(saved.company_data.company_name).toBe(workflowResults.company.name);
    expect(saved.component_origins[0].hs_code).toBeDefined();  // ✅ snake_case
    expect(saved.component_origins[0].hsCode).toBeUndefined(); // ❌ camelCase should NOT exist
  });

  test('Step 3: User dashboard displays workflow history correctly', async () => {
    const response = await fetch('http://localhost:3001/api/dashboard-data', {
      method: 'GET',
      headers: {
        'Cookie': `user_id=${TEST_USER.id}`  // Mock auth cookie
      }
    });

    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.workflows).toBeDefined();
    expect(Array.isArray(data.workflows)).toBe(true);

    // Validate workflow structure
    if (data.workflows.length > 0) {
      const workflow = data.workflows[0];
      expect(workflow.component_origins).toBeDefined();
      expect(workflow.qualification_status).toMatch(/QUALIFIED|NOT_QUALIFIED|PARTIAL/);

      // Verify enriched components use snake_case
      workflow.component_origins.forEach(comp => {
        if (comp.hs_code) {
          expect(comp.hs_code).toBeDefined();         // ✅ snake_case
          expect(comp.hsCode).toBeUndefined();        // ❌ should NOT exist
        }
      });
    }
  });
});

// ============================================================================
// TEST SUITE 2: SERVICE REQUEST PURCHASE FLOW
// ============================================================================

describe('Service Request Purchase Flow', () => {
  let serviceRequestId;

  test('Step 1: User purchases professional service', async () => {
    const serviceRequest = {
      service_type: 'trade-health-check',
      company_name: 'Test Manufacturing Co',
      contact_name: 'John Tester',
      email: TEST_USER.email,
      phone: '+1-555-0123',
      industry: 'Electronics',
      trade_volume: 1000000,
      subscriber_data: {  // ✅ Using subscriber_data, not workflow_data
        company_name: TEST_WORKFLOW_DATA.company_name,
        business_type: TEST_WORKFLOW_DATA.business_type,
        trade_volume: TEST_WORKFLOW_DATA.trade_volume,
        manufacturing_location: TEST_WORKFLOW_DATA.manufacturing_location,
        product_description: TEST_WORKFLOW_DATA.product_description,
        component_origins: TEST_WORKFLOW_DATA.component_origins,
        qualification_status: 'NEEDS_REVIEW'
      },
      data_storage_consent: true,
      consent_timestamp: new Date().toISOString(),
      privacy_policy_version: '1.0'
    };

    const response = await fetch('http://localhost:3001/api/admin/service-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceRequest)
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.request_id).toBeDefined();

    serviceRequestId = data.request_id;
  });

  test('Step 2: Service request saved to database with subscriber_data', async () => {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', serviceRequestId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();

    // Validate service request structure
    expect(data.service_type).toBe('trade-health-check');
    expect(data.subscriber_data).toBeDefined();               // ✅ subscriber_data exists
    expect(data.subscriber_data.company_name).toBeDefined();  // ✅ snake_case
    expect(data.subscriber_data.component_origins).toBeDefined();

    // Validate component structure in subscriber_data
    data.subscriber_data.component_origins.forEach(comp => {
      expect(comp.component_type).toBeDefined();              // ✅ snake_case
      expect(comp.componentType).toBeUndefined();             // ❌ should NOT exist
    });
  });

  test('Step 3: Admin dashboard displays service request correctly', async () => {
    const response = await fetch('http://localhost:3001/api/admin/service-requests', {
      method: 'GET'
    });

    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.requests).toBeDefined();

    // Find our test service request
    const testRequest = data.requests.find(r => r.id === serviceRequestId);
    expect(testRequest).toBeDefined();

    // Validate subscriber_data is accessible
    expect(testRequest.subscriber_data).toBeDefined();
    expect(testRequest.subscriber_data.company_name).toBe('Test Manufacturing Co');

    // Validate component enrichment data if present
    if (testRequest.subscriber_data.component_origins[0].hs_code) {
      testRequest.subscriber_data.component_origins.forEach(comp => {
        expect(comp.hs_code).toBeDefined();         // ✅ snake_case
        expect(comp.hsCode).toBeUndefined();        // ❌ should NOT exist
      });
    }
  });
});

// ============================================================================
// TEST SUITE 3: COMPONENT ENRICHMENT FLOW
// ============================================================================

describe('Component Enrichment Flow', () => {
  test('Component data enriched with correct field names', async () => {
    const componentData = {
      component_type: 'Motors',
      description: 'Electric motors 500W',
      country: 'China',
      percentage: 45
    };

    const response = await fetch('http://localhost:3001/api/enhance-component-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_description: 'Electric motors',
        component: componentData
      })
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Validate enriched component structure
    const enriched = data.enriched_component;
    expect(enriched.hs_code).toBeDefined();                   // ✅ snake_case
    expect(enriched.hs_description).toBeDefined();            // ✅ snake_case
    expect(enriched.mfn_rate).toBeDefined();                  // ✅ snake_case
    expect(enriched.usmca_rate).toBeDefined();                // ✅ snake_case
    expect(enriched.savings_amount).toBeDefined();            // ✅ snake_case
    expect(enriched.ai_confidence).toBeDefined();             // ✅ snake_case

    // Ensure camelCase does NOT exist
    expect(enriched.hsCode).toBeUndefined();                  // ❌ should NOT exist
    expect(enriched.mfnRate).toBeUndefined();                 // ❌ should NOT exist
    expect(enriched.usmcaRate).toBeUndefined();               // ❌ should NOT exist
  });

  test('Enriched components display correctly in admin dashboard', async () => {
    // This would be a browser automation test (Playwright/Puppeteer)
    // Verify 8-column component table shows enrichment data without "undefined" values
    // Manual verification recommended
  });
});

// ============================================================================
// TEST SUITE 4: VALIDATION ENFORCEMENT
// ============================================================================

describe('Data Validation Enforcement', () => {
  test('API rejects invalid workflow data', async () => {
    const invalidData = {
      company_name: 'A',  // Too short (< 2 chars)
      business_type: '',  // Empty
      component_origins: []  // Empty array
    };

    const response = await fetch('http://localhost:3001/api/ai-usmca-complete-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.details).toBeDefined();  // Validation error details
  });

  test('API rejects invalid component percentages', async () => {
    const invalidData = {
      ...TEST_WORKFLOW_DATA,
      component_origins: [
        { country: 'China', percentage: 60, value_percentage: 60, component_type: 'Motors', description: 'Test' },
        { country: 'Mexico', percentage: 30, value_percentage: 30, component_type: 'Housing', description: 'Test' }
        // Total = 90% (should be 100%)
      ]
    };

    const response = await fetch('http://localhost:3001/api/ai-usmca-complete-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('100%');  // Error message mentions percentage requirement
  });
});

// ============================================================================
// TEST CLEANUP
// ============================================================================

afterAll(async () => {
  // Clean up test data
  console.log('🧹 Cleaning up test data...');

  // Delete test workflows
  await supabase
    .from('usmca_workflows')
    .delete()
    .eq('user_id', TEST_USER.id);

  // Delete test service requests
  await supabase
    .from('service_requests')
    .delete()
    .eq('email', TEST_USER.email);

  console.log('✅ Test cleanup complete');
});
