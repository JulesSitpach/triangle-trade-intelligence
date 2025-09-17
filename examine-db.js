const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function examineDatabase() {
  console.log('🔍 Examining database schema...\n');

  try {
    // Get all tables
    console.log('=== ALL TABLES ===');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
    } else {
      tables.forEach(table => console.log('📋', table.table_name));
    }

    console.log('\n=== WORKFLOW_COMPLETIONS TABLE SCHEMA ===');
    const { data: workflowCols, error: workflowError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'workflow_completions')
      .order('ordinal_position');

    if (workflowError) {
      console.error('Error fetching workflow_completions schema:', workflowError);
    } else if (workflowCols && workflowCols.length > 0) {
      workflowCols.forEach(col => {
        console.log(`📊 ${col.column_name} | ${col.data_type} | nullable: ${col.is_nullable} | default: ${col.column_default || 'none'}`);
      });
    } else {
      console.log('❌ workflow_completions table not found or no columns');
    }

    console.log('\n=== USER_PROFILES TABLE SCHEMA ===');
    const { data: userCols, error: userError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_profiles')
      .order('ordinal_position');

    if (userError) {
      console.error('Error fetching user_profiles schema:', userError);
    } else if (userCols && userCols.length > 0) {
      userCols.forEach(col => {
        console.log(`👤 ${col.column_name} | ${col.data_type} | nullable: ${col.is_nullable} | default: ${col.column_default || 'none'}`);
      });
    } else {
      console.log('❌ user_profiles table not found or no columns');
    }

    // Check for other workflow-related tables
    console.log('\n=== OTHER WORKFLOW-RELATED TABLES ===');
    const workflowTables = tables?.filter(t =>
      t.table_name.includes('workflow') ||
      t.table_name.includes('certificate') ||
      t.table_name.includes('company') ||
      t.table_name.includes('usmca')
    ) || [];

    for (const table of workflowTables) {
      if (table.table_name !== 'workflow_completions') {
        console.log(`\n📋 ${table.table_name.toUpperCase()} TABLE SCHEMA:`);
        const { data: cols, error } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name)
          .order('ordinal_position');

        if (!error && cols) {
          cols.forEach(col => {
            console.log(`   ${col.column_name} | ${col.data_type} | nullable: ${col.is_nullable}`);
          });
        }
      }
    }

    // Sample some actual data from workflow_completions
    console.log('\n=== SAMPLE WORKFLOW_COMPLETIONS DATA ===');
    const { data: sampleData, error: sampleError } = await supabase
      .from('workflow_completions')
      .select('*')
      .limit(3);

    if (sampleError) {
      console.error('Error fetching sample data:', sampleError);
    } else if (sampleData && sampleData.length > 0) {
      console.log('Sample records found:', sampleData.length);
      console.log('Sample data keys:', Object.keys(sampleData[0]));
      console.log('First record:', JSON.stringify(sampleData[0], null, 2));
    } else {
      console.log('No data in workflow_completions table');
    }

  } catch (error) {
    console.error('Database examination error:', error);
  }
}

examineDatabase().then(() => process.exit(0));