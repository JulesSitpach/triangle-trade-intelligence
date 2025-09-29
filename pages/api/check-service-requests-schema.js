/**
 * Check service_requests table schema and add workflow_data column if missing
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    console.log('🔍 Checking service_requests table schema...');

    // First, let's check what columns exist
    const { data: existingData, error: selectError } = await supabase
      .from('service_requests')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('Error querying table:', selectError);
      return res.status(500).json({ error: selectError.message });
    }

    const existingRecord = existingData?.[0];
    console.log('📊 Current table structure:');
    if (existingRecord) {
      Object.keys(existingRecord).forEach(key => {
        console.log(`   ${key}: ${typeof existingRecord[key]}`);
      });
    }

    // Check if workflow_data column exists
    const hasWorkflowData = existingRecord && 'workflow_data' in existingRecord;
    console.log(`workflow_data column exists: ${hasWorkflowData}`);

    if (!hasWorkflowData) {
      console.log('⚠️ workflow_data column is missing');

      // Try to add the column using a SQL query
      const { data: sqlResult, error: sqlError } = await supabase.rpc('execute_sql', {
        query: 'ALTER TABLE service_requests ADD COLUMN workflow_data JSONB;'
      });

      if (sqlError) {
        console.log('Cannot add column via RPC, column might need to be added manually');
        return res.status(200).json({
          success: false,
          missing_column: 'workflow_data',
          recommendation: 'Add workflow_data JSONB column to service_requests table manually',
          current_schema: Object.keys(existingRecord || {})
        });
      }
    }

    // Now let's test updating a record with workflow data
    const sampleWorkflowData = {
      company_name: 'AutoParts Corp',
      product_description: 'Automotive brake components',
      classified_hs_code: '8708.30.50',
      test_data: true
    };

    // Try to update AutoParts Corp with workflow data
    const { data: updateResult, error: updateError } = await supabase
      .from('service_requests')
      .update({
        workflow_data: sampleWorkflowData
      })
      .eq('company_name', 'AutoParts Corp')
      .select();

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Cannot update workflow_data',
        details: updateError.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Schema check completed',
      workflow_data_column_exists: hasWorkflowData,
      updated_records: updateResult?.length || 0,
      sample_update: 'Applied to AutoParts Corp'
    });

  } catch (error) {
    console.error('❌ Schema check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}