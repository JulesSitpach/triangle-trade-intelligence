/**
 * Debug Certificate Data Flow
 * Run this in browser console on certificate page to see what data is available
 */

console.log('🔍 CERTIFICATE DATA DEBUG\n');
console.log('==========================================\n');

// Check localStorage
const sessionId = localStorage.getItem('workflow_session_id');
const workflowResults = localStorage.getItem('usmca_workflow_results');
const authData = localStorage.getItem('usmca_authorization_data');
const certificateEdits = localStorage.getItem('usmca_certificate_edits');

console.log('📦 localStorage Data:');
console.log('  session_id:', sessionId);
console.log('  has_workflow_results:', !!workflowResults);
console.log('  has_auth_data:', !!authData);
console.log('  has_certificate_edits:', !!certificateEdits);

if (workflowResults) {
  try {
    const parsed = JSON.parse(workflowResults);
    console.log('\n📊 Workflow Results:');
    console.log('  Company Name:', parsed.company?.name || parsed.company?.company_name);
    console.log('  Company Country:', parsed.company?.company_country);
    console.log('  Company Tax ID:', parsed.company?.tax_id);
    console.log('  Components:', parsed.components?.length || 0);
  } catch (e) {
    console.error('  ❌ Failed to parse workflow results:', e);
  }
}

if (authData) {
  try {
    const parsed = JSON.parse(authData);
    console.log('\n🔐 Authorization Data:');
    console.log('  Certifier Type:', parsed.certifier_type);
    console.log('  Signatory:', parsed.signatory_name);
    console.log('\n  📋 Exporter:');
    console.log('    Name:', parsed.exporter_name || '[Missing]');
    console.log('    Tax ID:', parsed.exporter_tax_id || '[Missing]');
    console.log('\n  🏭 Producer:');
    console.log('    Name:', parsed.producer_name || '[Same as exporter or missing]');
    console.log('    Tax ID:', parsed.producer_tax_id || '[Same as exporter or missing]');
    console.log('    Same as Exporter?:', parsed.producer_same_as_exporter);
    console.log('\n  📦 Importer:');
    console.log('    Name:', parsed.importer_name || '[Missing]');
    console.log('    Tax ID:', parsed.importer_tax_id || '[Missing]');
  } catch (e) {
    console.error('  ❌ Failed to parse auth data:', e);
  }
}

if (certificateEdits) {
  try {
    const parsed = JSON.parse(certificateEdits);
    console.log('\n✏️ Certificate Edits:');
    console.log('  Timestamp:', parsed.timestamp);
    console.log('  Has Certificate:', !!parsed.certificate);

    if (parsed.certificate) {
      console.log('\n  🔍 Certificate Data:');
      console.log('    Exporter Tax ID:', parsed.certificate.exporter?.tax_id || '[Missing]');
      console.log('    Producer Tax ID:', parsed.certificate.producer?.tax_id || '[Missing]');
      console.log('    Importer Tax ID:', parsed.certificate.importer?.tax_id || '[Missing]');
    }
  } catch (e) {
    console.error('  ❌ Failed to parse certificate edits:', e);
  }
}

console.log('\n==========================================');
console.log('💡 Next Steps:');
console.log('  1. Check if producer_same_as_exporter is causing duplication');
console.log('  2. Verify importer tax ID is being collected in AuthorizationStep');
console.log('  3. Check if generate-certificate.js is correctly mapping fields');
