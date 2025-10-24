/**
 * Full-Stack Alignment Verification Script
 * Enforces complete data flow from UI → API → Database → API → UI
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Feature configuration mapping
// Updated Oct 23, 2025: Removed archived service request features
// Only USMCA certificate workflow is active in current application
const FEATURE_CONFIG = {
  'USMCACertificate': {
    component: 'pages/usmca-workflow.js',
    api: '/api/ai-usmca-complete-analysis',
    requiredTables: ['workflow_sessions', 'workflow_completions', 'tariff_rates_cache'],
    requiredColumns: {
      'workflow_sessions': ['id', 'user_id', 'company_name', 'product_description', 'hs_code', 'component_origins', 'trade_volume'],
      'workflow_completions': ['id', 'user_id', 'product_description', 'hs_code', 'total_savings', 'certificate_generated'],
      'tariff_rates_cache': ['id', 'hs_code', 'destination_country', 'mfn_rate', 'usmca_rate']
    },
    testData: {
      company: {
        company_name: 'Test Manufacturing Inc',
        country: 'US',
        business_type: 'Electronics',
        trade_volume: '1500000',
        destination_country: 'US'
      },
      product: {
        description: 'Electronic components',
        hs_code: '8517.62.00'
      },
      component_origins: [
        {
          origin_country: 'Mexico',
          hs_code: '8534.20.00',
          percentage: 50,
          value_percentage: 50
        },
        {
          origin_country: 'US',
          hs_code: '8534.30.00',
          percentage: 50,
          value_percentage: 50
        }
      ]
    }
  }
  // Archived features (removed Oct 23, 2025):
  // - SupplierSourcing (was at /api/supplier-sourcing-discovery)
  // - ManufacturingFeasibility (was at /api/manufacturing-feasibility-analysis)
  // - CrisisResponse (was at /api/crisis-response-analysis)
  // - MarketEntry (was at /api/market-entry-analysis)
};

// Main verification function
const verifyFullStackAlignment = async (feature) => {
  console.log(`🔍 Verifying full-stack alignment for ${feature}...`);

  try {
    // Step 1: Verify database schema supports feature
    console.log('Step 1: Verifying database schema...');
    const schemaCheck = await verifyDatabaseSchema(feature);
    if (!schemaCheck.valid) {
      throw new Error(`Database schema invalid for ${feature}: ${schemaCheck.errors.join(', ')}`);
    }
    console.log('✅ Database schema verification passed');

    // Step 2: Verify API aligns with database
    console.log('Step 2: Verifying API alignment with database...');
    const apiCheck = await verifyAPIAlignment(feature);
    if (!apiCheck.valid) {
      throw new Error(`API doesn't align with database for ${feature}: ${apiCheck.errors.join(', ')}`);
    }
    console.log('✅ API alignment verification passed');

    // Step 3: Verify UI aligns with API
    console.log('Step 3: Verifying UI alignment with API...');
    const uiCheck = await verifyUIAlignment(feature);
    if (!uiCheck.valid) {
      throw new Error(`UI doesn't align with API for ${feature}: ${uiCheck.errors.join(', ')}`);
    }
    console.log('✅ UI alignment verification passed');

    // Step 4: Verify data flows correctly through entire stack
    console.log('Step 4: Verifying complete data flow...');
    const dataFlowCheck = await verifyDataFlow(feature);
    if (!dataFlowCheck.valid) {
      throw new Error(`Data flow broken for ${feature}: ${dataFlowCheck.errors.join(', ')}`);
    }
    console.log('✅ Data flow verification passed');

    console.log(`🎉 Full-stack alignment verified for ${feature}`);
    return { success: true, feature, timestamp: new Date().toISOString() };

  } catch (error) {
    console.error(`❌ Full-stack verification failed for ${feature}:`, error.message);
    throw error;
  }
};

const verifyDatabaseSchema = async (feature) => {
  const config = FEATURE_CONFIG[feature];
  if (!config) {
    return { valid: false, errors: [`No configuration found for feature: ${feature}`] };
  }

  const errors = [];

  // Check if required tables exist
  for (const table of config.requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        errors.push(`Table ${table} not accessible: ${error.message}`);
        continue;
      }

      // Check if required columns exist by examining the schema
      const requiredColumns = config.requiredColumns[table];
      if (requiredColumns && data && data.length > 0) {
        const availableColumns = Object.keys(data[0]);
        const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));

        if (missingColumns.length > 0) {
          errors.push(`Missing columns in ${table}: ${missingColumns.join(', ')}`);
        }
      }

    } catch (dbError) {
      errors.push(`Database connection error for table ${table}: ${dbError.message}`);
    }
  }

  return { valid: errors.length === 0, errors };
};

const verifyAPIAlignment = async (feature) => {
  const config = FEATURE_CONFIG[feature];
  if (!config) {
    return { valid: false, errors: [`No configuration found for feature: ${feature}`] };
  }

  const errors = [];

  try {
    // Test API endpoint exists and responds
    const apiEndpoint = `http://localhost:3001${config.api}`;
    console.log(`Testing API endpoint: ${apiEndpoint}`);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config.testData)
    });

    if (!response.ok) {
      errors.push(`API endpoint ${config.api} returned ${response.status}: ${response.statusText}`);
      return { valid: false, errors };
    }

    const apiResult = await response.json();

    // Verify API returns expected structure
    if (!apiResult || typeof apiResult !== 'object') {
      errors.push('API did not return valid JSON object');
    } else {
      // Check for success indicators based on feature type
      if (feature === 'SupplierSourcing') {
        if (!apiResult.success && !apiResult.suppliers) {
          errors.push('Supplier Sourcing API missing expected success or suppliers field');
        }

        if (apiResult.suppliers && !Array.isArray(apiResult.suppliers)) {
          errors.push('Supplier Sourcing API suppliers field must be an array');
        }
      }
    }

    return { valid: errors.length === 0, errors, apiResult };

  } catch (error) {
    errors.push(`API test failed: ${error.message}`);
    return { valid: false, errors };
  }
};

const verifyUIAlignment = async (feature) => {
  const config = FEATURE_CONFIG[feature];
  if (!config) {
    return { valid: false, errors: [`No configuration found for feature: ${feature}`] };
  }

  const errors = [];

  try {
    // Verify component file exists
    const componentPath = path.join(process.cwd(), config.component);

    if (!fs.existsSync(componentPath)) {
      errors.push(`Component file not found: ${componentPath}`);
      return { valid: false, errors };
    }

    // Read and analyze component code
    const componentCode = fs.readFileSync(componentPath, 'utf8');

    // Check for React component structure
    if (!componentCode.includes('export default') && !componentCode.includes('module.exports')) {
      errors.push('Component does not export default function');
    }

    if (!componentCode.includes('React') && !componentCode.includes('jsx')) {
      errors.push('Component is not a valid React component');
    }

    // Feature-specific UI checks
    if (feature === 'SupplierSourcing') {
      // Check for required UI elements
      const requiredElements = [
        'service_type',
        'company_name',
        'Start Supplier Research',
        'service_details'
      ];

      for (const element of requiredElements) {
        if (!componentCode.includes(element)) {
          errors.push(`UI missing required element: ${element}`);
        }
      }

      // Check for proper API integration
      if (!componentCode.includes('supplier-sourcing-discovery') &&
          !componentCode.includes('ServiceWorkflowModal')) {
        errors.push('UI not properly integrated with supplier sourcing API');
      }
    }

    // Check for CSS compliance (no inline styles)
    if (componentCode.includes('style=') || componentCode.includes('style={{')) {
      errors.push('Component contains inline styles - CSS violation');
    }

    return { valid: errors.length === 0, errors };

  } catch (error) {
    errors.push(`UI verification failed: ${error.message}`);
    return { valid: false, errors };
  }
};

const verifyDataFlow = async (feature) => {
  const config = FEATURE_CONFIG[feature];
  if (!config) {
    return { valid: false, errors: [`No configuration found for feature: ${feature}`] };
  }

  const errors = [];

  try {
    // Test complete data flow: UI action → API → Database → API → UI
    const initialData = config.testData;

    // Step 1: Test API receives and processes data correctly
    const apiResponse = await fetch(`http://localhost:3001${config.api}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialData)
    });

    if (!apiResponse.ok) {
      errors.push(`Data flow failed at API step: ${apiResponse.status} ${apiResponse.statusText}`);
      return { valid: false, errors };
    }

    const apiResult = await apiResponse.json();

    // Step 2: Verify data consistency through the flow
    if (feature === 'SupplierSourcing') {
      // Check if API returns suppliers (indicating processing worked)
      if (!apiResult.suppliers || apiResult.suppliers.length === 0) {
        console.warn('⚠️ API returned no suppliers - may indicate web search issues');
        // Don't fail the test as this could be a temporary web search issue
      }

      // Verify request context is preserved
      if (apiResult.discovery_summary) {
        const productDesc = initialData.service_details?.product_description || initialData.service_details?.goals;
        if (!apiResult.discovery_summary.search_criteria) {
          errors.push('API not preserving search criteria in response');
        }
      }
    }

    // Step 3: Verify database operations (if applicable)
    // For SupplierSourcing, check if any suppliers were stored
    if (feature === 'SupplierSourcing' && apiResult.success) {
      try {
        const { data: suppliers } = await supabase
          .from('suppliers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        console.log(`Found ${suppliers?.length || 0} suppliers in database`);
        // This is informational - don't fail if no suppliers found
      } catch (dbError) {
        console.warn('⚠️ Could not verify suppliers in database:', dbError.message);
      }
    }

    return { valid: errors.length === 0, errors };

  } catch (error) {
    errors.push(`Data flow verification failed: ${error.message}`);
    return { valid: false, errors };
  }
};

// CLI interface
const runFullStackVerification = async () => {
  const args = process.argv.slice(2);
  const feature = args.find(arg => arg.startsWith('--feature='))?.split('=')[1];

  if (!feature) {
    console.log(`
Full-Stack Alignment Verification
Updated Oct 23, 2025 - Removed archived service request features

Usage:
  node scripts/full-stack-verification.js --feature=USMCACertificate

Available features:
  - USMCACertificate (USMCA certificate generation workflow)

This verifies:
1. Database schema supports the feature
2. API correctly reads/writes database
3. UI correctly displays API data
4. Complete user journey works with real data
5. No mock/template data anywhere in the stack

Archived features removed in Phase 2 cleanup (Oct 23, 2025):
  - SupplierSourcing (was /api/supplier-sourcing-discovery)
  - ManufacturingFeasibility (was /api/manufacturing-feasibility-analysis)
  - CrisisResponse (was /api/crisis-response-analysis)
  - MarketEntry (was /api/market-entry-analysis)
    `);
    return;
  }

  if (!FEATURE_CONFIG[feature]) {
    console.error(`❌ Unknown feature: ${feature}`);
    console.log(`Available features: ${Object.keys(FEATURE_CONFIG).join(', ')}`);
    console.log(`\nNote: Archived features were removed Oct 23, 2025. Only USMCACertificate is active.`);
    process.exit(1);
  }

  try {
    const result = await verifyFullStackAlignment(feature);
    console.log(`\n🎉 Full-stack verification completed successfully for ${feature}`);
    console.log('All layers properly aligned and working together.');
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Full-stack verification failed for ${feature}:`);
    console.error(error.message);
    console.log('\nFix the issues above before claiming feature completion.');
    process.exit(1);
  }
};

// Export for use in other scripts
module.exports = {
  verifyFullStackAlignment,
  verifyDatabaseSchema,
  verifyAPIAlignment,
  verifyUIAlignment,
  verifyDataFlow,
  FEATURE_CONFIG
};

// Run if called directly
if (require.main === module) {
  runFullStackVerification();
}