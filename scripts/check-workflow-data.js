/**
 * Check workflow data for Industrial Hydraulics Mexico SA de CV
 * Verify data flow from workflow → alerts → certificates
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDataFlow() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('STEP 1: CHECK WORKFLOW_COMPLETIONS TABLE');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Query workflow_completions (company name is in workflow_data JSONB)
  const { data: workflows, error: workflowError } = await supabase
    .from('workflow_completions')
    .select('*')
    .order('completed_at', { ascending: false })
    .limit(10); // Get last 10 workflows

  if (workflowError) {
    console.error('❌ Error querying workflow_completions:', workflowError);
  } else if (!workflows || workflows.length === 0) {
    console.log('❌ NO WORKFLOWS FOUND in database');
    console.log('→ PROBLEM: Workflow data is NOT being saved to database');
    return;
  } else {
    // Find Industrial Hydraulics workflow in the list
    console.log(`Found ${workflows.length} total workflows. Searching for Industrial Hydraulics...\n`);

    const workflow = workflows.find(w => {
      const companyName = w.workflow_data?.company?.name || w.workflow_data?.company?.company_name || '';
      return companyName.includes('Industrial Hydraulics');
    });

    if (!workflow) {
      console.log('❌ NO WORKFLOW FOUND for Industrial Hydraulics');
      console.log('\nAll workflows found:');
      workflows.forEach((w, i) => {
        const companyName = w.workflow_data?.company?.name || w.workflow_data?.company?.company_name || 'Unknown';
        console.log(`  ${i + 1}. ${companyName} (${w.hs_code}) - ${w.completed_at}`);
      });
      return;
    }
    console.log('✅ Found workflow record:\n');
    console.log('ID:', workflow.id);
    console.log('User ID:', workflow.user_id);
    console.log('Email:', workflow.email);
    console.log('Workflow Type:', workflow.workflow_type);
    console.log('HS Code:', workflow.hs_code);
    console.log('Product Description:', workflow.product_description);
    console.log('Total Savings:', workflow.total_savings);
    console.log('Certificate Generated:', workflow.certificate_generated);
    console.log('Status:', workflow.status);
    console.log('Completed At:', workflow.completed_at);

    // Check workflow_data JSONB field
    console.log('\n📊 Checking workflow_data JSONB field:');
    if (workflow.workflow_data) {
      const data = workflow.workflow_data;
      console.log('  - Has company data:', !!(data.company));
      console.log('  - Has product data:', !!(data.product));
      console.log('  - Has USMCA data:', !!(data.usmca));
      console.log('  - Has components:', !!(data.components || data.component_origins));

      if (data.company) {
        console.log('\n  Company data:');
        console.log('    - Name:', data.company.name || data.company.company_name);
        console.log('    - Annual Volume:', data.company.annual_trade_volume || data.company.trade_volume);
        console.log('    - Business Type:', data.company.business_type);
      }

      if (data.components || data.component_origins) {
        const components = data.components || data.component_origins;
        console.log('\n  Components:', components.length);
        components.forEach((comp, i) => {
          console.log(`    ${i + 1}. ${comp.origin_country || comp.country}: ${comp.value_percentage || comp.percentage}%`);
        });
      }
    } else {
      console.log('❌ workflow_data is NULL or empty');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('STEP 2: CHECK VULNERABILITY_ANALYSES TABLE');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Query vulnerability_analyses (for workflow's user_id)
    const { data: alerts, error: alertError } = await supabase
      .from('vulnerability_analyses')
      .select('*')
      .eq('user_id', workflow.user_id)
      .order('analyzed_at', { ascending: false })
      .limit(5); // Get last 5 alerts for this user

    if (alertError) {
      console.error('❌ Error querying vulnerability_analyses:', alertError);
    } else if (!alerts || alerts.length === 0) {
      console.log('❌ NO ALERTS FOUND for this user');
      console.log('→ PROBLEM: Alert creation is broken OR workflow → alert transfer is broken');
    } else {
      console.log(`✅ Found ${alerts.length} alert(s) for this user:\n`);
      alerts.forEach((alert, i) => {
        console.log(`\n━━━ Alert ${i + 1} ━━━`);
        console.log('ID:', alert.id);
        console.log('Company Name:', alert.company_name);
        console.log('HS Code:', alert.hs_code);
        console.log('Product Description:', alert.product_description);
        console.log('Annual Trade Volume:', alert.annual_trade_volume);
        console.log('Qualification Status:', alert.qualification_status);
        console.log('Business Type:', alert.business_type);
        console.log('Component Origins:', JSON.stringify(alert.component_origins, null, 2));
        console.log('Recommended Alternatives:', JSON.stringify(alert.recommended_alternatives, null, 2));
        console.log('Vulnerabilities:', JSON.stringify(alert.vulnerabilities, null, 2));
        console.log('Analyzed At:', alert.analyzed_at);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('STEP 3: CHECK USMCA_CERTIFICATE_COMPLETIONS TABLE');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Query certificates
    const { data: certs, error: certError } = await supabase
      .from('usmca_certificate_completions')
      .select('*')
      .eq('workflow_id', workflow.id)
      .limit(1);

    if (certError) {
      console.error('❌ Error querying usmca_certificate_completions:', certError);
    } else if (!certs || certs.length === 0) {
      // Check if workflow is qualified
      const isQualified = workflow.workflow_data?.qualification_result?.status === 'QUALIFIED' ||
                         workflow.workflow_data?.usmca?.qualified === true;

      if (isQualified) {
        console.log('❌ NO CERTIFICATE FOUND for QUALIFIED workflow');
        console.log('→ PROBLEM: Certificate generation is broken for qualified workflows');
      } else {
        console.log('ℹ️ No certificate found');
        console.log('→ This is expected (workflow is NOT QUALIFIED)');
      }
    } else {
      const cert = certs[0];
      console.log('✅ Found certificate record:\n');
      console.log('ID:', cert.id);
      console.log('Workflow ID:', cert.workflow_id);
      console.log('Certificate Number:', cert.certificate_number);
      console.log('Certificate Data:', cert.certificate_data ? 'Present' : 'NULL');
      console.log('PDF URL:', cert.pdf_url);
      console.log('Created At:', cert.created_at);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('DIAGNOSIS COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');
}

checkDataFlow()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
