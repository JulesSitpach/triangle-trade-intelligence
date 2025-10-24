/**
 * Universal Development Protocol Enforcement Script
 * Blocks any "completion" claims without proof of working functionality
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Test configuration
// NOTE: Test scripts updated Oct 23, 2025 - removed archived service request tabs
// USMCA workflow is the active user journey, other tabs were archived
const COMPONENT_LIST = [
  'USMCACertificateTab'
  // Archived tabs (no longer in active application):
  // - CrisisResponseTab (archived - use crisis-alerts endpoint instead)
  // - SupplierSourcingTab (archived - use ai-supplier-discovery instead)
  // - ManufacturingFeasibilityTab (archived - use ai-manufacturing-discovery instead)
  // - MarketEntryTab (archived - use ai-market-entry-discovery instead)
];

const API_ENDPOINTS = {
  'USMCACertificateTab': '/api/ai-usmca-complete-analysis'
  // Removed references to archived endpoints:
  // '/api/crisis-response-analysis' (deleted Oct 23, 2025)
  // '/api/supplier-sourcing-discovery' (archived - use ai-supplier-discovery)
  // '/api/manufacturing-feasibility-analysis' (deleted Oct 23, 2025)
  // '/api/market-entry-analysis' (deleted Oct 23, 2025)
};

// Main verification function
const verifyDevelopmentStep = async (step, component) => {
  console.log(`🔍 Verifying ${step} for ${component}...`);

  const tests = {
    'component-render': () => testComponentRenders(component),
    'api-response': () => testAPIResponse(component),
    'integration': () => testIntegration(component),
    'end-to-end': () => testEndToEnd(component),
    'database-connection': () => testDatabaseConnection(),
    'environment-variables': () => testEnvironmentVariables()
  };

  if (!tests[step]) {
    throw new Error(`Unknown test step: ${step}`);
  }

  const result = await tests[step]();

  if (!result.success) {
    throw new Error(`DEVELOPMENT BLOCKED: ${step} failed for ${component}

    Error: ${result.error}

    CANNOT PROCEED until this is fixed.
    DO NOT claim completion without passing tests.`);
  }

  console.log(`✅ ${step} verified for ${component}`);
  return true;
};

// Test Functions
const testComponentRenders = async (component) => {
  try {
    // Test if component file exists and is valid React component
    const fs = require('fs');
    const path = require('path');

    const componentPath = path.join(process.cwd(), 'components', getComponentFolder(component), `${component}.js`);

    if (!fs.existsSync(componentPath)) {
      return { success: false, error: `Component file not found: ${componentPath}` };
    }

    const componentCode = fs.readFileSync(componentPath, 'utf8');

    // Basic validation
    if (!componentCode.includes('export default') && !componentCode.includes('module.exports')) {
      return { success: false, error: 'Component does not export default function' };
    }

    if (!componentCode.includes('React') && !componentCode.includes('jsx')) {
      return { success: false, error: 'Component is not a valid React component' };
    }

    // Check for CSS compliance
    if (componentCode.includes('style=') || componentCode.includes('className=".*\\s(bg-|text-|p-|m-)')) {
      return { success: false, error: 'Component contains inline styles or Tailwind classes - CSS violation' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const testAPIResponse = async (component) => {
  try {
    const endpoint = API_ENDPOINTS[component];
    if (!endpoint) {
      return { success: false, error: `No API endpoint defined for ${component}` };
    }

    // Get test data for component
    const testData = getTestDataForComponent(component);

    const response = await fetch(`http://localhost:3001${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      return { success: false, error: `API returned ${response.status}: ${response.statusText}` };
    }

    const result = await response.json();

    if (!result || typeof result !== 'object') {
      return { success: false, error: 'API did not return valid JSON object' };
    }

    // Check for success indicators
    if (!result.success && !result.data && !result.suppliers && !result.certificate_url) {
      return { success: false, error: 'API response missing expected data fields' };
    }

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const testIntegration = async (component) => {
  try {
    // Test that component can connect to its API and handle responses
    const apiTest = await testAPIResponse(component);
    if (!apiTest.success) {
      return { success: false, error: `API integration failed: ${apiTest.error}` };
    }

    // Additional integration checks based on component type
    if (component.includes('Certificate')) {
      // Check PDF generation capability
      if (!apiTest.data.certificate_url && !apiTest.data.pdf_buffer) {
        return { success: false, error: 'Certificate component must generate PDF output' };
      }
    }

    if (component.includes('Sourcing')) {
      // Check supplier discovery
      if (!apiTest.data.suppliers || !Array.isArray(apiTest.data.suppliers)) {
        return { success: false, error: 'Sourcing component must return suppliers array' };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const testEndToEnd = async (component) => {
  try {
    // Test complete workflow from UI interaction to final output
    const testData = getTestDataForComponent(component);

    // Step 1: API call
    const apiResult = await testAPIResponse(component);
    if (!apiResult.success) {
      return { success: false, error: `End-to-end failed at API step: ${apiResult.error}` };
    }

    // Step 2: Verify database operations if applicable
    if (component !== 'HSClassificationTab') { // HS Classification doesn't write to service_requests
      const dbResult = await testDatabaseWrite(component, testData);
      if (!dbResult.success) {
        return { success: false, error: `End-to-end failed at database step: ${dbResult.error}` };
      }
    }

    // Step 3: Verify output accessibility
    const data = apiResult.data;
    if (data.certificate_url) {
      const pdfResponse = await fetch(data.certificate_url);
      if (!pdfResponse.ok) {
        return { success: false, error: 'Generated PDF is not accessible' };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const testDatabaseConnection = async () => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test connection with simple query
    const { data, error } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code')
      .limit(1);

    if (error) {
      return { success: false, error: `Database connection failed: ${error.message}` };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Database connected but no data found in hs_master_rebuild table' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const testEnvironmentVariables = async () => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY'
  ];

  const missing = required.filter(var_name => !process.env[var_name]);

  if (missing.length > 0) {
    return { success: false, error: `Missing required environment variables: ${missing.join(', ')}` };
  }

  return { success: true };
};

const testDatabaseWrite = async (component, testData) => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test service_requests table write
    const testId = 'TEST' + Date.now();
    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        id: testId,
        service_type: component.toLowerCase().replace('tab', ''),
        company_name: testData.subscriber_data?.company_name || 'Test Company',
        contact_name: 'Test Contact',
        email: 'test@example.com',
        phone: '+1-555-0123',
        service_details: testData,
        status: 'test',
        assigned_to: 'Test',
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      return { success: false, error: `Database write failed: ${error.message}` };
    }

    // Clean up test data
    if (data && data[0]) {
      await supabase
        .from('service_requests')
        .delete()
        .eq('id', data[0].id);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Helper functions
const getComponentFolder = (component) => {
  if (component.includes('USMCA') || component.includes('HS') || component.includes('Crisis')) {
    return 'cristina';
  }
  return 'jorge';
};

const getTestDataForComponent = (component) => {
  // Updated Oct 23, 2025: Only USMCACertificateTab is active
  // Archived service request tabs removed in Phase 2 cleanup

  if (component !== 'USMCACertificateTab') {
    throw new Error(`Component ${component} is archived and no longer supported. Only 'USMCACertificateTab' is active.`);
  }

  const testData = {
    company: {
      company_name: 'Test Manufacturing Corp',
      country: 'US',
      business_type: 'Manufacturing',
      trade_volume: '500000',
      destination_country: 'US'
    },
    product: {
      description: 'Electronic components assembly',
      hs_code: '8517.62.00'
    },
    component_origins: [
      {
        origin_country: 'Mexico',
        hs_code: '8534.20.00',
        percentage: 40,
        value_percentage: 40,
        mfn_rate: 3.5,
        usmca_rate: 0,
        component_type: 'PCB Assembly'
      },
      {
        origin_country: 'US',
        hs_code: '8534.30.00',
        percentage: 60,
        value_percentage: 60,
        mfn_rate: 2.5,
        usmca_rate: 0,
        component_type: 'Components'
      }
    ],
    usmca: {
      qualified: true
    }
  };

  return testData;
};

// CLI interface
const runProtocolEnforcement = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  const component = args.find(arg => arg.startsWith('--component='))?.split('=')[1];
  const step = args.find(arg => arg.startsWith('--step='))?.split('=')[1];

  try {
    switch (command) {
      case 'verify-component':
        if (!component) {
          throw new Error('--component= parameter required');
        }
        await verifyAllStepsForComponent(component);
        break;

      case 'verify-step':
        if (!component || !step) {
          throw new Error('Both --component= and --step= parameters required');
        }
        await verifyDevelopmentStep(step, component);
        break;

      case 'verify-foundation':
        await verifyFoundation();
        break;

      case 'verify-all':
        await verifyAllComponents();
        break;

      default:
        console.log(`
Universal Development Protocol Enforcement

Usage:
  node scripts/enforce-protocol.js verify-foundation
  node scripts/enforce-protocol.js verify-component --component=USMCACertificateTab
  node scripts/enforce-protocol.js verify-step --component=USMCACertificateTab --step=api-response
  node scripts/enforce-protocol.js verify-all

Available components: ${COMPONENT_LIST.join(', ')}
Available steps: component-render, api-response, integration, end-to-end
        `);
    }
  } catch (error) {
    console.error('❌ PROTOCOL ENFORCEMENT FAILED:', error.message);
    process.exit(1);
  }
};

const verifyFoundation = async () => {
  console.log('🔍 Phase 1: Foundation Testing');
  await verifyDevelopmentStep('database-connection', 'foundation');
  await verifyDevelopmentStep('environment-variables', 'foundation');
  console.log('✅ Foundation tests passed - can proceed to component development');
};

const verifyAllStepsForComponent = async (component) => {
  console.log(`🔍 Verifying all steps for ${component}`);
  const steps = ['component-render', 'api-response', 'integration', 'end-to-end'];

  for (const step of steps) {
    await verifyDevelopmentStep(step, component);
  }

  console.log(`✅ All tests passed for ${component} - component is ready for production`);
};

const verifyAllComponents = async () => {
  console.log('🔍 Verifying all components');

  for (const component of COMPONENT_LIST) {
    try {
      await verifyAllStepsForComponent(component);
    } catch (error) {
      console.error(`❌ ${component} failed verification:`, error.message);
      throw error;
    }
  }

  console.log('✅ All components verified - system ready for production');
};

// Export for use in other scripts
module.exports = {
  verifyDevelopmentStep,
  testComponentRenders,
  testAPIResponse,
  testIntegration,
  testEndToEnd,
  testDatabaseConnection,
  testEnvironmentVariables
};

// Run if called directly
if (require.main === module) {
  runProtocolEnforcement();
}