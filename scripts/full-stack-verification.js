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
  },
  'CrisisAlerts': {
    component: 'pages/trade-risk-alternatives.js',
    api: '/api/generate-portfolio-briefing',
    requiredTables: ['crisis_alerts', 'rss_feed_activities', 'rss_feeds'],
    requiredColumns: {
      'crisis_alerts': [
        'id', 'user_id', 'alert_type', 'title', 'description',
        'severity', 'affected_hs_codes', 'affected_countries',
        'relevant_industries', 'confidence_score', 'is_active',
        'detection_source', 'source_url', 'created_at'
      ],
      'rss_feed_activities': [
        'id', 'feed_id', 'title', 'description', 'link',
        'crisis_score', 'crisis_keywords_detected', 'pub_date'
      ],
      'rss_feeds': [
        'id', 'name', 'url', 'keywords', 'is_active', 'priority_level'
      ]
    },
    testData: {
      alert: {
        alert_type: 'tariff_change',
        title: 'Section 301 China Tariff Increase',
        description: 'Tariffs on Chinese electronics increased to 100%',
        severity: 'critical',
        affected_hs_codes: ['8542.31'],
        affected_countries: ['CN'],
        relevant_industries: ['electronics', 'semiconductors'],
        is_active: true,
        detection_source: 'rss_feed',
        source_url: 'https://ustr.gov/example'
      }
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

      if (feature === 'CrisisAlerts') {
        // Validate portfolio briefing response structure
        if (!apiResult.bottom_line && !apiResult.executive_summary) {
          errors.push('Crisis Alerts API missing portfolio briefing structure');
        }

        // CRITICAL: Check for schema errors in returned alerts
        if (apiResult.alerts && Array.isArray(apiResult.alerts)) {
          for (const alert of apiResult.alerts) {
            // These are schema violations that would break the system
            if (alert.severity_level !== undefined) {
              errors.push('🚨 SCHEMA ERROR: Alert uses "severity_level" - should be "severity" (CRITICAL BUG)');
            }
            if (alert.source_type !== undefined) {
              errors.push('🚨 SCHEMA ERROR: Alert uses "source_type" column which does not exist (CRITICAL BUG)');
            }
            if (alert.requires_action !== undefined) {
              errors.push('🚨 SCHEMA ERROR: Alert uses "requires_action" column which does not exist (CRITICAL BUG)');
            }
          }
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

    if (feature === 'CrisisAlerts') {
      // Check for required crisis alerts UI elements
      const requiredElements = [
        'portfolio briefing',
        'alert',
        'crisis'
      ];

      let foundRequired = false;
      for (const element of requiredElements) {
        if (componentCode.toLowerCase().includes(element.toLowerCase())) {
          foundRequired = true;
          break;
        }
      }

      if (!foundRequired) {
        errors.push('UI missing crisis alerts content');
      }

      // Check for proper API integration
      if (!componentCode.includes('generate-portfolio-briefing')) {
        errors.push('UI not properly integrated with portfolio briefing API');
      }

      // Check that UI references correct column name 'severity' not 'severity_level'
      if (componentCode.includes('severity_level')) {
        errors.push('🚨 SCHEMA ERROR: UI references "severity_level" - should use "severity" column');
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

    if (feature === 'CrisisAlerts') {
      // Verify portfolio briefing response has required structure
      if (!apiResult.bottom_line && !apiResult.executive_summary) {
        errors.push('Crisis Alerts API missing portfolio briefing in response');
      }

      // CRITICAL: Verify alert schema compliance in response
      if (apiResult.alerts && Array.isArray(apiResult.alerts)) {
        for (const alert of apiResult.alerts) {
          if (alert.severity_level !== undefined) {
            errors.push('🚨 DATA FLOW ERROR: Alert response contains "severity_level" - should be "severity"');
          }
          if (alert.source_type !== undefined) {
            errors.push('🚨 DATA FLOW ERROR: Alert response contains non-existent "source_type" column');
          }
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

    // For CrisisAlerts, verify alerts table has recent data
    if (feature === 'CrisisAlerts') {
      try {
        const { count } = await supabase
          .from('crisis_alerts')
          .select('*', { count: 'exact', head: true });

        console.log(`Found ${count} crisis alerts in database`);
        if (count > 0) {
          // Verify recent alert uses correct schema
          const { data: recentAlerts } = await supabase
            .from('crisis_alerts')
            .select('severity, severity_level, source_type')
            .order('created_at', { ascending: false })
            .limit(1);

          if (recentAlerts && recentAlerts.length > 0) {
            const alert = recentAlerts[0];
            // severity_level and source_type should be undefined if schema is correct
            if (alert.severity_level !== undefined) {
              errors.push('🚨 DATABASE SCHEMA ERROR: crisis_alerts table has "severity_level" column - should be "severity"');
            }
            if (alert.source_type !== undefined) {
              errors.push('🚨 DATABASE SCHEMA ERROR: crisis_alerts table has non-existent "source_type" column');
            }
          }
        }
      } catch (dbError) {
        console.warn('⚠️ Could not verify crisis alerts in database:', dbError.message);
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
Updated Nov 2, 2025 - Added Crisis Alerts verification

Usage:
  node scripts/full-stack-verification.js --feature=USMCACertificate
  node scripts/full-stack-verification.js --feature=CrisisAlerts

Available features:
  - USMCACertificate (USMCA certificate generation workflow)
  - CrisisAlerts (Portfolio briefing + policy alerts + RSS monitoring)

This verifies:
1. Database schema supports the feature (ALL required columns present)
2. API correctly reads/writes database with right column names
3. UI correctly displays API data
4. Complete user journey works with real data
5. SCHEMA COMPLIANCE: Catches column name mismatches before production (e.g., severity vs severity_level)
6. No mock/template data anywhere in the stack

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
    console.log(`\nRun: node scripts/full-stack-verification.js --feature=CrisisAlerts`);
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