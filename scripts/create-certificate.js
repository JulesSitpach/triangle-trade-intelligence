/**
 * Create certificate for Industrial Hydraulics workflow
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createCertificate() {
  console.log('Creating certificate for Industrial Hydraulics workflow...\n');

  const certificate = {
    workflow_id: 'd4cece36-38d1-4699-9baf-4c927e5b25eb',
    user_id: '570206c8-b431-4936-81e8-8186ea4065f0',
    certificate_number: `USMCA-IH-${Date.now()}`,
    certificate_data: {
      exporter: {
        name: 'Industrial Hydraulics Mexico SA de CV',
        address: 'Mexico City, Mexico',
        tax_id: 'MX-IH-2025'
      },
      product: {
        description: 'High-pressure hydraulic pumps for construction equipment',
        hs_code: '8413.50'
      },
      usmca_analysis: {
        qualified: true,
        regional_content: 65,
        annual_savings: 480000
      },
      authorization: {
        signatory_name: 'Authorized Signatory',
        signatory_title: 'Export Manager',
        date: new Date().toISOString()
      }
    }
  };

  const { data, error } = await supabase
    .from('usmca_certificate_completions')
    .insert(certificate)
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\nAttempting insert with minimal fields...\n');

    // Try with just workflow_id and certificate_data
    const minimal = {
      workflow_id: 'd4cece36-38d1-4699-9baf-4c927e5b25eb',
      certificate_data: certificate.certificate_data
    };

    const { data: data2, error: error2 } = await supabase
      .from('usmca_certificate_completions')
      .insert(minimal)
      .select();

    if (error2) {
      console.error('❌ Minimal insert also failed:', error2.message);
      process.exit(1);
    } else {
      console.log('✅ Certificate created with minimal fields:', data2[0].id);
    }
  } else {
    console.log('✅ Certificate created:', data[0].id);
  }

  // Also update the workflow to mark certificate as generated
  const { error: updateError } = await supabase
    .from('workflow_completions')
    .update({ certificate_generated: true })
    .eq('id', 'd4cece36-38d1-4699-9baf-4c927e5b25eb');

  if (updateError) {
    console.error('⚠️ Failed to update workflow:', updateError.message);
  } else {
    console.log('✅ Workflow marked as certificate_generated = true');
  }

  process.exit(0);
}

createCertificate().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
