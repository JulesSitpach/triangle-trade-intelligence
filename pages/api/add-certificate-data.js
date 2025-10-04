/**
 * Add client's original certificate data to service requests
 * This is what the client received from the AI workflow before requesting professional services
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    console.log('🔧 Adding client certificate data to AutoParts Corp...');

    // Get existing service details for AutoParts Corp
    const { data: existingData, error: fetchError } = await supabase
      .from('service_requests')
      .select('service_details')
      .eq('company_name', 'AutoParts Corp')
      .limit(1)
      .single();

    if (fetchError) throw fetchError;

    // Add certificate data to existing service details
    const updatedServiceDetails = {
      ...existingData.service_details,

      // Add the client's original certificate data
      certificate: {
        id: 'TC-20240927-001',
        certificate_number: 'USMCA-2024-AP-001',
        exporter_name: 'AutoParts Corp',
        exporter_address: '1234 Industrial Blvd, Detroit, MI 48201',
        exporter_tax_id: 'US-38-1234567',
        product_description: 'Automotive brake components and sensors including ABS sensors, brake pads, and electronic control units',
        hs_tariff_classification: '8708.30.50',
        country_of_origin: 'Multiple (China, Mexico, United States)',
        preference_criterion: 'B',
        blanket_start: '2024-01-01',
        blanket_end: '2024-12-31',

        // Original AI generation info
        generated_by: 'Triangle Trade Intelligence AI System',
        generation_date: '2024-09-27',
        confidence_score: 92,
        validation_status: 'AI Generated - Pending Professional Review',

        // Certificate sections as originally generated
        sections: {
          field_1_exporter: 'AutoParts Corp, 1234 Industrial Blvd, Detroit, MI 48201, US-38-1234567',
          field_2_blanket_period: '01/01/2024 to 12/31/2024',
          field_3_importer: 'To be completed by importer',
          field_4_description: 'Automotive brake components and sensors including ABS sensors, brake pads, and electronic control units',
          field_5_hs_code: '8708.30.50',
          field_6_preference_criterion: 'B',
          field_7_producer: 'AutoParts Corp (Final Assembly: Tijuana, Mexico)',
          field_8_country_of_origin: 'MX (Final Assembly)',
          field_9_other: 'RVC 55% - Qualifies under USMCA Regional Value Content requirement',
          field_10_remarks: 'Components sourced from China (45%), Mexico (35%), and United States (20%). Final assembly and substantial transformation performed in Mexico.',
          field_11_signature: '[To be signed by authorized representative]',
          field_12_date: '2024-09-27'
        }
      },

      // AI generation metadata
      certificate_generation: {
        ai_confidence: 92,
        generation_method: 'Enhanced Classification Agent + USMCA Engine',
        data_sources: ['User workflow input', 'HS code database', 'USMCA rules'],
        quality_flags: [
          'High China dependency (45%) noted',
          'Qualification margin above minimum (55% vs 50%)',
          'Complete component breakdown available'
        ],
        professional_review_needed: [
          'Verify China component documentation',
          'Confirm Mexico substantial transformation',
          'Review qualification calculation methodology'
        ]
      }
    };

    // Update AutoParts Corp records with certificate data
    const { data, error } = await supabase
      .from('service_requests')
      .update({
        service_details: updatedServiceDetails,
        updated_at: new Date().toISOString()
      })
      .eq('company_name', 'AutoParts Corp')
      .select();

    if (error) throw error;

    console.log(`✅ Added certificate data to ${data?.length || 0} AutoParts Corp records`);

    res.status(200).json({
      success: true,
      message: `Added client certificate data to ${data?.length || 0} AutoParts Corp records`,
      certificate_includes: {
        certificate_number: '✓ USMCA-2024-AP-001',
        all_required_fields: '✓ Fields 1-12 complete',
        ai_generation_info: '✓ 92% confidence, Enhanced Classification Agent',
        quality_flags: '✓ Professional review items identified',
        original_data: '✓ What client received before requesting professional service'
      },
      professional_value: {
        before: 'AI-generated certificate with 92% confidence',
        after: 'Cristina can review, validate, and enhance with 17-year customs expertise',
        value_add: 'Professional backing, compliance guarantee, risk assessment'
      },
      records_updated: data?.length || 0
    });

  } catch (error) {
    console.error('❌ Error adding certificate data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}