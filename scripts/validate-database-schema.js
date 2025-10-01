/**
 * DATABASE SCHEMA VALIDATION SCRIPT
 * Validates all required tables for Triangle Intelligence Platform launch
 *
 * Run: node scripts/validate-database-schema.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Expected schema structure for service_requests table
 */
const EXPECTED_SERVICE_REQUESTS_SCHEMA = {
  tableName: 'service_requests',
  requiredColumns: [
    'id',
    'user_id',
    'client_company',
    'service_type',
    'status',
    'price',
    'subscriber_data',  // JSONB - CRITICAL for all services
    'workflow_data',     // JSONB - OPTIONAL (may be same as subscriber_data)
    'created_at',
    'updated_at'
  ],
  jsonbColumns: ['subscriber_data', 'workflow_data'],
  description: 'Main table for professional service requests (6 services)'
};

/**
 * Expected schema structure for service_completions table
 */
const EXPECTED_SERVICE_COMPLETIONS_SCHEMA = {
  tableName: 'service_completions',
  requiredColumns: [
    'id',
    'service_request_id',
    'completion_data',
    'report_url',
    'completed_at'
  ],
  foreignKeys: [
    { column: 'service_request_id', references: 'service_requests(id)' }
  ],
  description: 'Table for completed service deliverables'
};

/**
 * Expected subscriber_data structure
 */
const EXPECTED_SUBSCRIBER_DATA_STRUCTURE = {
  company_name: 'string',
  business_type: 'string',
  trade_volume: 'string|number',
  manufacturing_location: 'string',
  product_description: 'string',
  component_origins: 'array',
  qualification_status: 'string',
  annual_tariff_cost: 'number',
  potential_usmca_savings: 'number',
  compliance_gaps: 'array',
  vulnerability_factors: 'array'
};

/**
 * Check if table exists and get its structure
 */
async function validateTable(tableName) {
  console.log(`\n📊 Checking table: ${tableName}`);

  try {
    // Query table with limit 0 to get structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        return {
          exists: false,
          error: `❌ Table ${tableName} DOES NOT EXIST`,
          needsCreation: true
        };
      }

      return {
        exists: false,
        error: `❌ Error querying ${tableName}: ${error.message}`
      };
    }

    // Table exists - get columns
    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

    // Try to count rows
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    return {
      exists: true,
      columns: columns,
      rowCount: count || 0,
      sample: data && data.length > 0 ? data[0] : null
    };

  } catch (error) {
    return {
      exists: false,
      error: `❌ Unexpected error checking ${tableName}: ${error.message}`
    };
  }
}

/**
 * Validate service_requests table structure
 */
async function validateServiceRequests() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VALIDATING SERVICE_REQUESTS TABLE');
  console.log('='.repeat(80));

  const result = await validateTable('service_requests');

  if (!result.exists) {
    console.log(result.error);
    console.log('\n📋 SQL TO CREATE TABLE:');
    console.log(generateServiceRequestsSQL());
    return { valid: false, table: 'service_requests', needsCreation: true };
  }

  console.log(`✅ Table EXISTS with ${result.rowCount} rows`);
  console.log(`\n📋 EXISTING COLUMNS (${result.columns.length}):`);
  result.columns.forEach(col => console.log(`   - ${col}`));

  // Check for required columns
  const missingColumns = EXPECTED_SERVICE_REQUESTS_SCHEMA.requiredColumns.filter(
    col => !result.columns.includes(col)
  );

  if (missingColumns.length > 0) {
    console.log(`\n⚠️  MISSING COLUMNS (${missingColumns.length}):`);
    missingColumns.forEach(col => {
      console.log(`   ❌ ${col}`);

      // Special handling for workflow_data vs subscriber_data
      if (col === 'workflow_data' && result.columns.includes('subscriber_data')) {
        console.log(`      Note: subscriber_data exists - may be used instead`);
      }
    });

    console.log('\n📋 SQL TO ADD MISSING COLUMNS:');
    console.log(generateAddColumnsSQL('service_requests', missingColumns));

    return {
      valid: false,
      table: 'service_requests',
      missingColumns,
      hasSubscriberData: result.columns.includes('subscriber_data')
    };
  }

  // Check if subscriber_data is JSONB
  if (result.sample && result.sample.subscriber_data) {
    const subscriberData = result.sample.subscriber_data;
    console.log('\n📊 SUBSCRIBER_DATA STRUCTURE:');
    console.log(`   Type: ${typeof subscriberData}`);

    if (typeof subscriberData === 'object') {
      console.log('   ✅ Is JSONB object');
      console.log(`   Fields present: ${Object.keys(subscriberData).join(', ')}`);

      // Validate structure
      const missingFields = Object.keys(EXPECTED_SUBSCRIBER_DATA_STRUCTURE).filter(
        field => !(field in subscriberData)
      );

      if (missingFields.length > 0) {
        console.log(`\n   ⚠️  Missing expected fields: ${missingFields.join(', ')}`);
      }
    } else {
      console.log('   ❌ Not a JSONB object');
    }
  }

  console.log('\n✅ SERVICE_REQUESTS TABLE VALIDATION COMPLETE');
  return { valid: true, table: 'service_requests', result };
}

/**
 * Validate service_completions table
 */
async function validateServiceCompletions() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VALIDATING SERVICE_COMPLETIONS TABLE');
  console.log('='.repeat(80));

  const result = await validateTable('service_completions');

  if (!result.exists) {
    console.log(result.error || '❌ Table DOES NOT EXIST');
    console.log('\n📋 SQL TO CREATE TABLE:');
    console.log(generateServiceCompletionsSQL());
    return { valid: false, table: 'service_completions', needsCreation: true };
  }

  console.log(`✅ Table EXISTS with ${result.rowCount} rows`);
  console.log(`\n📋 EXISTING COLUMNS (${result.columns.length}):`);
  result.columns.forEach(col => console.log(`   - ${col}`));

  // Check for required columns
  const missingColumns = EXPECTED_SERVICE_COMPLETIONS_SCHEMA.requiredColumns.filter(
    col => !result.columns.includes(col)
  );

  if (missingColumns.length > 0) {
    console.log(`\n⚠️  MISSING COLUMNS (${missingColumns.length}):`);
    missingColumns.forEach(col => console.log(`   ❌ ${col}`));

    console.log('\n📋 SQL TO ADD MISSING COLUMNS:');
    console.log(generateAddColumnsSQL('service_completions', missingColumns));

    return { valid: false, table: 'service_completions', missingColumns };
  }

  console.log('\n✅ SERVICE_COMPLETIONS TABLE VALIDATION COMPLETE');
  return { valid: true, table: 'service_completions', result };
}

/**
 * Validate core database tables
 */
async function validateCoreTables() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VALIDATING CORE DATABASE TABLES');
  console.log('='.repeat(80));

  const coreTables = [
    { name: 'hs_master_rebuild', expectedRows: 34476, description: 'Comprehensive HS codes (US+CA+MX)' },
    { name: 'usmca_qualification_rules', expectedRows: 10, description: 'USMCA rules by category' },
    { name: 'triangle_routing_opportunities', expectedRows: 12, description: 'Triangle routing data' },
    { name: 'countries', expectedRows: 39, description: 'Country reference data' },
    { name: 'trade_volume_mappings', expectedRows: 6, description: 'Trade volume ranges' }
  ];

  const results = [];

  for (const table of coreTables) {
    const result = await validateTable(table.name);

    console.log(`\n📊 ${table.name}:`);
    console.log(`   Description: ${table.description}`);

    if (!result.exists) {
      console.log(`   ❌ MISSING`);
      results.push({ table: table.name, status: 'MISSING', valid: false });
    } else {
      console.log(`   ✅ EXISTS with ${result.rowCount} rows`);

      if (result.rowCount < table.expectedRows * 0.9) {
        console.log(`   ⚠️  Row count lower than expected (${table.expectedRows})`);
        results.push({ table: table.name, status: 'LOW_DATA', valid: false, rowCount: result.rowCount });
      } else {
        results.push({ table: table.name, status: 'OK', valid: true, rowCount: result.rowCount });
      }
    }
  }

  return results;
}

/**
 * Generate SQL for service_requests table
 */
function generateServiceRequestsSQL() {
  return `
-- Create service_requests table for professional services
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    client_company TEXT NOT NULL,
    service_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    price DECIMAL(10,2),

    -- CRITICAL: Complete workflow data from USMCA workflow
    subscriber_data JSONB NOT NULL,

    -- Optional: May be same as subscriber_data
    workflow_data JSONB,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes
    CONSTRAINT service_requests_service_type_check CHECK (
        service_type IN (
            'USMCA Certificates',
            'HS Classification',
            'Crisis Response',
            'Supplier Sourcing',
            'Manufacturing Feasibility',
            'Market Entry'
        )
    )
);

-- Create indexes
CREATE INDEX idx_service_requests_service_type ON service_requests(service_type);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX idx_service_requests_created_at ON service_requests(created_at);

-- Add update trigger
CREATE OR REPLACE FUNCTION update_service_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_requests_updated_at
    BEFORE UPDATE ON service_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_service_requests_updated_at();

COMMENT ON TABLE service_requests IS 'Professional service requests for all 6 services';
COMMENT ON COLUMN service_requests.subscriber_data IS 'Complete workflow data from USMCA workflow (JSONB)';
`;
}

/**
 * Generate SQL for service_completions table
 */
function generateServiceCompletionsSQL() {
  return `
-- Create service_completions table
CREATE TABLE IF NOT EXISTS service_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
    completion_data JSONB,
    report_url TEXT,
    completed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes
    CONSTRAINT service_completions_service_request_id_unique UNIQUE (service_request_id)
);

-- Create indexes
CREATE INDEX idx_service_completions_request_id ON service_completions(service_request_id);
CREATE INDEX idx_service_completions_completed_at ON service_completions(completed_at);

COMMENT ON TABLE service_completions IS 'Completed service deliverables';
COMMENT ON COLUMN service_completions.completion_data IS 'Service-specific completion data (JSONB)';
`;
}

/**
 * Generate SQL to add missing columns
 */
function generateAddColumnsSQL(tableName, columns) {
  const columnDefinitions = {
    subscriber_data: 'JSONB NOT NULL DEFAULT \'{}\'::jsonb',
    workflow_data: 'JSONB',
    user_id: 'UUID REFERENCES auth.users(id)',
    status: 'TEXT DEFAULT \'pending\'',
    price: 'DECIMAL(10,2)',
    created_at: 'TIMESTAMPTZ DEFAULT NOW()',
    updated_at: 'TIMESTAMPTZ DEFAULT NOW()',
    completion_data: 'JSONB',
    report_url: 'TEXT',
    completed_at: 'TIMESTAMPTZ DEFAULT NOW()'
  };

  return columns.map(col =>
    `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${col} ${columnDefinitions[col] || 'TEXT'};`
  ).join('\n');
}

/**
 * Main validation function
 */
async function runDatabaseValidation() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 TRIANGLE INTELLIGENCE PLATFORM - DATABASE SCHEMA VALIDATION');
  console.log('='.repeat(80));
  console.log(`Database: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`Date: ${new Date().toISOString()}`);

  try {
    // Validate service_requests
    const serviceRequestsResult = await validateServiceRequests();

    // Validate service_completions
    const serviceCompletionsResult = await validateServiceCompletions();

    // Validate core tables
    const coreTablesResults = await validateCoreTables();

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(80));

    const allResults = [
      serviceRequestsResult,
      serviceCompletionsResult,
      ...coreTablesResults
    ];

    const validTables = allResults.filter(r => r.valid).length;
    const totalTables = allResults.length;

    console.log(`\n✅ Valid Tables: ${validTables}/${totalTables}`);

    if (validTables === totalTables) {
      console.log('\n🎉 DATABASE SCHEMA VALIDATION PASSED - LAUNCH READY');
    } else {
      console.log('\n⚠️  DATABASE SCHEMA VALIDATION FAILED - REQUIRES FIXES');

      const failedTables = allResults.filter(r => !r.valid);
      console.log(`\n❌ Failed Tables (${failedTables.length}):`);
      failedTables.forEach(t => {
        console.log(`   - ${t.table}: ${t.status || 'INVALID'}`);
        if (t.missingColumns) {
          console.log(`     Missing columns: ${t.missingColumns.join(', ')}`);
        }
      });
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ VALIDATION ERROR:', error);
    process.exit(1);
  }
}

// Run validation
runDatabaseValidation()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
