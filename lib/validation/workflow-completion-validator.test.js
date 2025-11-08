/**
 * Workflow Completion Validator Tests
 *
 * Tests validator fixes from VALIDATOR FIXES.md
 * Ensures critical fields are properly validated
 */

import { validateWorkflowCompletionData } from './workflow-completion-validator.js';

// Helper to create base valid workflow
const createValidWorkflow = () => ({
  company_name: "Acme Corp",
  company_country: "US",
  destination_country: "MX",
  manufacturing_location: "Mexico",
  industry_sector: "Electronics",
  business_type: "Electronics Manufacturer",
  trade_volume: "5000",
  supplier_country: "CN",
  tax_id: "12-3456789",
  company_address: "123 Main St",
  contact_person: "John Doe",
  contact_phone: "555-1234",
  contact_email: "john@acme.com",
  hs_code: "8542.31.00",
  product_description: "Integrated Circuits",
  qualification_result: {
    status: 'QUALIFIED',
    regional_content: 68.5,
    regional_content_percentage: 68.5,
    required_threshold: 65,
    component_origins: [
      {
        description: "PCB Assembly",
        origin_country: "MX",
        value_percentage: 40,
        hs_code: "8542.31.00",
        mfn_rate: 0.0,
        usmca_rate: 0.0
      },
      {
        description: "Plastic Case",
        origin_country: "US",
        value_percentage: 28.5,
        hs_code: "3926.90.99",
        mfn_rate: 5.3,
        usmca_rate: 0.0
      }
    ]
  }
});

console.log('\n========================================');
console.log('WORKFLOW COMPLETION VALIDATOR TESTS');
console.log('========================================\n');

// Test 1: Valid workflow should pass
console.log('TEST 1: Valid workflow with all fields');
const validWorkflow = createValidWorkflow();
const result1 = validateWorkflowCompletionData(validWorkflow);
console.log('Result:', result1.valid ? '✅ PASS' : '❌ FAIL');
console.log('Errors:', result1.errors.length);
console.log('Warnings:', result1.warnings.length);
if (!result1.valid) {
  console.log('Error details:', result1.errors);
}
console.log('');

// Test 2: Missing trade_volume should FAIL
console.log('TEST 2: Missing trade_volume (should return ERROR)');
const noVolume = { ...createValidWorkflow(), trade_volume: '' };
const result2 = validateWorkflowCompletionData(noVolume);
console.log('Result:', !result2.valid ? '✅ PASS (correctly failed)' : '❌ FAIL (should have failed)');
console.log('Has trade_volume error:', result2.errors.some(e => e.includes('trade_volume')) ? '✅ YES' : '❌ NO');
console.log('Errors:', result2.errors.filter(e => e.includes('trade_volume')));
console.log('');

// Test 3: trade_volume = 0 should FAIL
console.log('TEST 3: trade_volume = 0 (should return ERROR)');
const zeroVolume = { ...createValidWorkflow(), trade_volume: '0' };
const result3 = validateWorkflowCompletionData(zeroVolume);
console.log('Result:', !result3.valid ? '✅ PASS (correctly failed)' : '❌ FAIL (should have failed)');
console.log('Has trade_volume error:', result3.errors.some(e => e.includes('trade_volume')) ? '✅ YES' : '❌ NO');
console.log('Errors:', result3.errors.filter(e => e.includes('trade_volume')));
console.log('');

// Test 4: Missing industry_sector should FAIL (upgraded to ERROR)
console.log('TEST 4: Missing industry_sector (should return ERROR, not WARNING)');
const noIndustry = { ...createValidWorkflow(), industry_sector: '' };
const result4 = validateWorkflowCompletionData(noIndustry);
console.log('Result:', !result4.valid ? '✅ PASS (correctly failed)' : '❌ FAIL (should have failed)');
console.log('Has industry_sector error:', result4.errors.some(e => e.includes('industry_sector')) ? '✅ YES' : '❌ NO');
console.log('Is in warnings (should be NO):', result4.warnings.some(e => e.includes('industry_sector')) ? '❌ YES (wrong)' : '✅ NO (correct)');
console.log('Errors:', result4.errors.filter(e => e.includes('industry_sector')));
console.log('');

// Test 5: Missing supplier_country should FAIL (API-enforced)
console.log('TEST 5: Missing supplier_country (should return ERROR - API enforced)');
const noSupplier = { ...createValidWorkflow(), supplier_country: '' };
const result5 = validateWorkflowCompletionData(noSupplier);
console.log('Result:', !result5.valid ? '✅ PASS (correctly failed)' : '❌ FAIL (should have failed)');
console.log('Has supplier_country error:', result5.errors.some(e => e.includes('supplier_country')) ? '✅ YES' : '❌ NO');
console.log('Errors:', result5.errors.filter(e => e.includes('supplier_country')));
console.log('');

// Test 6: Missing tax_id should FAIL (API-enforced)
console.log('TEST 6: Missing tax_id (should return ERROR - API enforced)');
const noTaxId = { ...createValidWorkflow(), tax_id: '' };
const result6 = validateWorkflowCompletionData(noTaxId);
console.log('Result:', !result6.valid ? '✅ PASS (correctly failed)' : '❌ FAIL (should have failed)');
console.log('Has tax_id error:', result6.errors.some(e => e.includes('tax_id')) ? '✅ YES' : '❌ NO');
console.log('Errors:', result6.errors.filter(e => e.includes('tax_id')));
console.log('');

// Test 7: Missing company_address should FAIL (API-enforced)
console.log('TEST 7: Missing company_address (should return ERROR - API enforced)');
const noAddress = { ...createValidWorkflow(), company_address: '' };
const result7 = validateWorkflowCompletionData(noAddress);
console.log('Result:', !result7.valid ? '✅ PASS (correctly failed)' : '❌ FAIL (should have failed)');
console.log('Has company_address error:', result7.errors.some(e => e.includes('company_address')) ? '✅ YES' : '❌ NO');
console.log('Errors:', result7.errors.filter(e => e.includes('company_address')));
console.log('');

// Test 8: Missing contact fields should FAIL (API-enforced)
console.log('TEST 8: Missing contact_person (should return ERROR - API enforced)');
const noContact = { ...createValidWorkflow(), contact_person: '' };
const result8 = validateWorkflowCompletionData(noContact);
console.log('Result:', !result8.valid ? '✅ PASS (correctly failed)' : '❌ FAIL (should have failed)');
console.log('Has contact_person error:', result8.errors.some(e => e.includes('contact_person')) ? '✅ YES' : '❌ NO');
console.log('Errors:', result8.errors.filter(e => e.includes('contact_person')));
console.log('');

// Test 9: Missing business_type should WARN (not ERROR)
console.log('TEST 9: Missing business_type (should return WARNING, not ERROR)');
const noBusinessType = { ...createValidWorkflow(), business_type: '' };
const result9 = validateWorkflowCompletionData(noBusinessType);
console.log('Result:', result9.valid ? '✅ PASS (should still pass with warning)' : '❌ FAIL (should not block)');
console.log('Has business_type warning:', result9.warnings.some(w => w.includes('business_type')) ? '✅ YES' : '❌ NO');
console.log('Is in errors (should be NO):', result9.errors.some(e => e.includes('business_type')) ? '❌ YES (wrong)' : '✅ NO (correct)');
console.log('Warnings:', result9.warnings.filter(w => w.includes('business_type')));
console.log('');

// Test 10: trade_volume with commas should parse correctly
console.log('TEST 10: trade_volume with commas (should parse correctly)');
const volumeWithCommas = { ...createValidWorkflow(), trade_volume: '1,000,000' };
const result10 = validateWorkflowCompletionData(volumeWithCommas);
console.log('Result:', result10.valid ? '✅ PASS (commas parsed)' : '❌ FAIL');
console.log('Has trade_volume error:', result10.errors.some(e => e.includes('trade_volume')) ? '❌ YES (should parse commas)' : '✅ NO');
if (!result10.valid) {
  console.log('Errors:', result10.errors.filter(e => e.includes('trade_volume')));
}
console.log('');

// Summary
console.log('========================================');
console.log('TEST SUMMARY');
console.log('========================================');
console.log('Total tests: 10');
console.log('Expected passes: 10');
console.log('');
console.log('Key validations added:');
console.log('✅ trade_volume ERROR validation (blocks $0 bug)');
console.log('✅ industry_sector upgraded to ERROR (blocks wrong threshold)');
console.log('✅ API-enforced fields (supplier_country, tax_id, company_address, contacts)');
console.log('✅ business_type WARNING (not blocking)');
console.log('');
console.log('Run this test with: node lib/validation/workflow-completion-validator.test.js');
console.log('');
