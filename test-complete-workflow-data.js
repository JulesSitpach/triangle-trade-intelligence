/**
 * Test Script: Create Complete Workflow Data for Cristina's Dashboard
 * This creates a properly populated service request with comprehensive workflow data
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createCompleteServiceRequest() {
  console.log('🧪 Creating service request with complete workflow data...');

  // Complete workflow data structure (what user actually provides after workflow completion)
  const completeWorkflowData = {
    // Company Profile Data
    company_name: 'AutoParts Corp',
    business_type: 'Automotive Parts Manufacturer',
    company_address: '1234 Industrial Blvd, Detroit, MI 48201',
    tax_id: 'US-38-1234567',
    contact_person: 'Mike Rodriguez',
    contact_email: 'mike@autoparts.com',
    contact_phone: '555-0234',
    supplier_country: 'CN',
    destination_country: 'US',
    trade_volume: '1800000', // $1.8M

    // Product Intelligence
    product_description: 'Automotive brake components and sensors including ABS sensors, brake pads, and electronic control units',
    manufacturing_location: 'Tijuana, Mexico',
    classified_hs_code: '8708.30.50',
    hs_code_description: 'Brake systems and parts for motor vehicles',
    hs_code_confidence: 92,
    classification_method: 'Enhanced Classification Agent with web verification',

    // Component Origins (detailed breakdown)
    component_origins: [
      {
        origin_country: 'CN',
        value_percentage: 45,
        description: 'Electronic sensors and control units'
      },
      {
        origin_country: 'MX',
        value_percentage: 35,
        description: 'Assembled brake components'
      },
      {
        origin_country: 'US',
        value_percentage: 20,
        description: 'Raw materials and specialized alloys'
      }
    ],

    // USMCA Analysis
    north_american_content: 55, // MX + US = 35% + 20%
    qualification_status: 'USMCA Qualified',
    qualification_level: 'Regional Value Content',
    qualification_rule: 'RVC 62.5%',
    preference_criterion: 'B',

    // Financial Intelligence
    current_tariff_rate: 6.8,
    usmca_tariff_rate: 0.0,
    annual_tariff_savings: 122400, // $1.8M * 6.8%
    monthly_savings: 10200,

    // Manufacturing Intelligence
    current_production_countries: ['CN', 'MX'],
    recommended_optimization: 'Increase Mexico manufacturing to 60% for enhanced USMCA benefits',

    // Risk Assessment
    compliance_gaps: 'Documentation needed for China-sourced electronic components',
    audit_risk_level: 'Medium - due to mixed sourcing',

    // Certificate Requirements
    blanket_period_start: '2024-01-01',
    blanket_period_end: '2024-12-31',
    certificate_number: 'TC-20240927-001'
  };

  const serviceRequest = {
    id: 'SR' + Date.now().toString().slice(-6),
    service_type: 'USMCA Certificates',
    company_name: 'AutoParts Corp',
    contact_name: 'Mike Rodriguez',
    email: 'mike@autoparts.com',
    phone: '555-0234',
    industry: 'Automotive Parts',
    trade_volume: 1800000,
    assigned_to: 'Cristina',
    status: 'consultation_scheduled',
    priority: 'high',
    timeline: 'immediate',
    budget_range: '250',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // Client consent tracking
    data_storage_consent: true,
    consent_timestamp: new Date().toISOString(),
    privacy_policy_version: '1.0',
    consent_ip_address: '192.168.1.100',
    consent_user_agent: 'Mozilla/5.0 Test Browser',

    // Service-specific data
    service_details: {
      current_challenges: 'Need USMCA compliance documentation for automotive exports',
      goals: 'Secure USMCA certificate for $1.8M annual trade volume',
      product_description: completeWorkflowData.product_description,
      quality_standards: 'ISO 9001, IATF 16949',
      target_regions: 'United States, Canada',
      investment_budget: '$50,000 for compliance implementation'
    },

    // 🔑 THIS IS THE KEY - Complete USMCA workflow data
    workflow_data: completeWorkflowData,

    // Consultation info
    consultation_status: 'pending_schedule',
    consultation_duration: '15 minutes',
    next_steps: 'Professional certificate validation by Cristina'
  };

  try {
    const { data, error } = await supabase
      .from('service_requests')
      .insert([serviceRequest])
      .select();

    if (error) throw error;

    console.log('✅ Complete service request created:', serviceRequest.id);
    console.log('📊 Workflow data includes:');
    console.log('   Company Profile: ✓ Complete');
    console.log('   Product Intelligence: ✓ Complete');
    console.log('   Component Origins: ✓ 3 countries detailed');
    console.log('   USMCA Analysis: ✓ 55% North American content');
    console.log('   Financial Intelligence: ✓ $122.4K annual savings');
    console.log('   Classification: ✓ 92% confidence with method');

    return serviceRequest;
  } catch (error) {
    console.error('❌ Failed to create complete service request:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createCompleteServiceRequest()
    .then(() => console.log('🎉 Complete workflow data test completed!'))
    .catch(console.error);
}

export { createCompleteServiceRequest };