/**
 * Validate Existing Workflows Script
 *
 * Purpose: Run validation checks on all existing workflow_completions
 *          to ensure data integrity before launch.
 *
 * Usage: node scripts/validate-existing-workflows.js
 *
 * This script will:
 * 1. Query all QUALIFIED workflows from workflow_completions table
 * 2. Run validation checks on each workflow's workflow_data JSONB
 * 3. Report which workflows are valid vs invalid
 * 4. Suggest fixes for invalid workflows
 */

import { createClient } from '@supabase/supabase-js';
import { validateQualifiedWorkflow, getValidationReport } from '../lib/validation/workflow-completion-validator.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateExistingWorkflows() {
  console.log('🔍 VALIDATING EXISTING WORKFLOWS...\n');

  try {
    // Fetch all QUALIFIED workflows
    const { data: workflows, error } = await supabase
      .from('workflow_completions')
      .select('id, user_id, product_description, qualification_status, workflow_data, created_at')
      .eq('qualification_status', 'QUALIFIED')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database query error:', error);
      return;
    }

    console.log(`📊 Found ${workflows.length} QUALIFIED workflows\n`);

    const results = {
      total: workflows.length,
      valid: 0,
      invalid: 0,
      validWorkflows: [],
      invalidWorkflows: []
    };

    // Validate each workflow
    for (const workflow of workflows) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📝 Workflow: ${workflow.id}`);
      console.log(`   Product: ${workflow.product_description}`);
      console.log(`   Created: ${new Date(workflow.created_at).toLocaleDateString()}`);
      console.log(`   Status: ${workflow.qualification_status}`);
      console.log(`${'='.repeat(80)}`);

      const validation = getValidationReport(workflow.workflow_data, workflow.user_id);

      if (validation.valid) {
        console.log('✅ VALIDATION PASSED');
        console.log(`   Components: ${validation.summary.componentCount}`);

        if (validation.warnings.length > 0) {
          console.log(`   Warnings: ${validation.warnings.length}`);
          validation.warnings.forEach(w => console.log(`     ⚠️  ${w}`));
        }

        results.valid++;
        results.validWorkflows.push({
          id: workflow.id,
          product: workflow.product_description,
          componentCount: validation.summary.componentCount,
          warnings: validation.warnings
        });
      } else {
        console.log('❌ VALIDATION FAILED');
        console.log(`   Errors: ${validation.errors.length}`);
        validation.errors.forEach(e => console.log(`     ❌ ${e}`));

        if (validation.warnings.length > 0) {
          console.log(`   Warnings: ${validation.warnings.length}`);
          validation.warnings.forEach(w => console.log(`     ⚠️  ${w}`));
        }

        results.invalid++;
        results.invalidWorkflows.push({
          id: workflow.id,
          product: workflow.product_description,
          errors: validation.errors,
          warnings: validation.warnings,
          data_snapshot: {
            has_qualification_result: !!workflow.workflow_data?.qualification_result,
            has_component_origins: !!(workflow.workflow_data?.qualification_result?.component_origins),
            component_count: workflow.workflow_data?.qualification_result?.component_origins?.length || 0
          }
        });
      }
    }

    // ========================================
    // SUMMARY REPORT
    // ========================================
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('📊 VALIDATION SUMMARY');
    console.log(`${'='.repeat(80)}`);
    console.log(`Total Workflows:   ${results.total}`);
    console.log(`✅ Valid:           ${results.valid} (${Math.round(results.valid/results.total*100)}%)`);
    console.log(`❌ Invalid:         ${results.invalid} (${Math.round(results.invalid/results.total*100)}%)`);

    if (results.invalidWorkflows.length > 0) {
      console.log(`\n\n${'='.repeat(80)}`);
      console.log('❌ INVALID WORKFLOWS - ACTION REQUIRED');
      console.log(`${'='.repeat(80)}`);

      results.invalidWorkflows.forEach((wf, idx) => {
        console.log(`\n${idx + 1}. ${wf.product} (ID: ${wf.id.substring(0, 8)}...)`);
        console.log(`   Errors:`);
        wf.errors.forEach(e => console.log(`     • ${e}`));
        console.log(`   Data Snapshot:`);
        console.log(`     • Has qualification_result: ${wf.data_snapshot.has_qualification_result}`);
        console.log(`     • Has component_origins: ${wf.data_snapshot.has_component_origins}`);
        console.log(`     • Component count: ${wf.data_snapshot.component_count}`);
      });

      console.log(`\n\n${'='.repeat(80)}`);
      console.log('🔧 RECOMMENDED ACTIONS:');
      console.log(`${'='.repeat(80)}`);
      console.log(`1. OPTION A: Delete invalid workflows from database`);
      console.log(`   SQL: DELETE FROM workflow_completions WHERE id IN (`);
      results.invalidWorkflows.forEach(wf => {
        console.log(`     '${wf.id}',`);
      });
      console.log(`   );`);
      console.log(``);
      console.log(`2. OPTION B: Change status to NOT_QUALIFIED`);
      console.log(`   SQL: UPDATE workflow_completions SET qualification_status = 'NOT_QUALIFIED' WHERE id IN (`);
      results.invalidWorkflows.forEach(wf => {
        console.log(`     '${wf.id}',`);
      });
      console.log(`   );`);
      console.log(``);
      console.log(`3. OPTION C: Re-run workflows to regenerate data`);
      console.log(`   (Requires manual user action)`);
    }

    if (results.validWorkflows.length > 0) {
      const workflowsWithWarnings = results.validWorkflows.filter(wf => wf.warnings.length > 0);

      if (workflowsWithWarnings.length > 0) {
        console.log(`\n\n${'='.repeat(80)}`);
        console.log('⚠️  VALID WORKFLOWS WITH WARNINGS');
        console.log(`${'='.repeat(80)}`);

        workflowsWithWarnings.forEach((wf, idx) => {
          console.log(`\n${idx + 1}. ${wf.product} (ID: ${wf.id.substring(0, 8)}...)`);
          console.log(`   Warnings:`);
          wf.warnings.forEach(w => console.log(`     • ${w}`));
        });

        console.log(`\n   These workflows will function but may display incomplete data in dashboard.`);
      }
    }

    // ========================================
    // LAUNCH READINESS
    // ========================================
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('🚀 LAUNCH READINESS CHECK');
    console.log(`${'='.repeat(80)}`);

    if (results.invalid === 0) {
      console.log(`✅ ALL WORKFLOWS VALID - READY FOR LAUNCH`);
      console.log(`   No action required. All ${results.total} workflows have complete data.`);
    } else {
      console.log(`❌ LAUNCH BLOCKED - ${results.invalid} INVALID WORKFLOWS`);
      console.log(`   Action required before launch to prevent dashboard errors.`);
      console.log(`   See recommended actions above.`);
    }

    console.log(`\n`);

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the validation
validateExistingWorkflows();
