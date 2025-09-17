const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTableSchemas() {
  console.log('🔍 Getting table schemas...\n');

  try {
    // Try to get workflow_completions schema using PostgreSQL system catalogs
    console.log('=== WORKFLOW_COMPLETIONS TABLE SCHEMA ===');
    const { data: workflowSchema, error: workflowError } = await supabase.rpc('get_table_schema', {
      table_name: 'workflow_completions'
    });

    if (workflowError) {
      console.log('RPC not available, trying direct query...');

      // Alternative: Get a sample record and show its structure
      const { data: sampleData, error: sampleError } = await supabase
        .from('workflow_completions')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.error('Error getting sample data:', sampleError);
      } else if (sampleData && sampleData.length > 0) {
        console.log('✅ workflow_completions table exists with these columns:');
        Object.keys(sampleData[0]).forEach(key => {
          const value = sampleData[0][key];
          const type = typeof value;
          const isDate = value && typeof value === 'string' && value.includes('T') && value.includes('Z');
          console.log(`  📊 ${key}: ${isDate ? 'timestamp' : type} ${value === null ? '(nullable)' : ''}`);
        });
      }
    }

    // Check user_profiles
    console.log('\n=== USER_PROFILES TABLE SCHEMA ===');
    const { data: userSample, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (userError) {
      console.log('❌ user_profiles table error:', userError.message);
    } else if (userSample && userSample.length > 0) {
      console.log('✅ user_profiles table exists with these columns:');
      Object.keys(userSample[0]).forEach(key => {
        const value = userSample[0][key];
        const type = typeof value;
        const isDate = value && typeof value === 'string' && value.includes('T') && value.includes('Z');
        console.log(`  👤 ${key}: ${isDate ? 'timestamp' : type} ${value === null ? '(nullable)' : ''}`);
      });
    } else {
      console.log('⚠️ user_profiles table exists but is empty');
    }

    // Check for other tables by trying common workflow-related table names
    const tablesToCheck = [
      'certificates',
      'workflow_sessions',
      'company_profiles',
      'usmca_qualifications',
      'workflow_data',
      'session_data'
    ];

    console.log('\n=== CHECKING OTHER WORKFLOW TABLES ===');
    for (const tableName of tablesToCheck) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!error && data !== null) {
        console.log(`✅ ${tableName} table exists`);
        if (data.length > 0) {
          console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
        } else {
          console.log(`   (empty table)`);
        }
      } else {
        console.log(`❌ ${tableName} table does not exist`);
      }
    }

  } catch (error) {
    console.error('Schema examination error:', error);
  }
}

getTableSchemas().then(() => process.exit(0));