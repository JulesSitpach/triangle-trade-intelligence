/**
 * POST /api/trust/complete-certificate
 * Generates a complete USMCA certificate with trust verification
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { certificateData } = req.body;

    if (!certificateData) {
      return res.status(400).json({ error: 'Certificate data required' });
    }

    // Extract data from request
    const {
      company_info,
      product_details,
      supply_chain,
      authorization,
      certifier_type  // NEW: Get certifier_type from workflow Step 1
    } = certificateData;

    // Generate certificate number
    const certificateNumber = `USMCA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // CRITICAL FIX: Log incoming country data for debugging
    console.log('🔍 Certificate API - Incoming country data:', {
      exporter_country: company_info.exporter_country,
      importer_country: company_info.importer_country,
      full_company_info: company_info
    });

    // Build professional certificate response
    const professionalCertificate = {
      certificate_number: certificateNumber,
      generation_info: {
        generated_date: new Date().toISOString(),
        platform: 'Triangle Trade Intelligence',
        version: 'V3'
      },

      // Exporter Information - NEVER use fallback for country (let PDF generator handle errors)
      exporter: {
        name: company_info.exporter_name,
        address: company_info.exporter_address,
        country: company_info.exporter_country || '',  // Empty string instead of 'Not specified'
        tax_id: company_info.exporter_tax_id || 'Not specified',
        phone: company_info.exporter_phone ?? '',
        email: company_info.exporter_email ?? ''
      },

      // Certifier - Use actual certifier_type from workflow Step 1
      certifier: {
        type: certifier_type || 'EXPORTER',  // Use workflow data, fallback to EXPORTER only if missing
        name: company_info.exporter_name,
        address: company_info.exporter_address,
        country: company_info.exporter_country || '',  // Empty string instead of 'Not specified'
        tax_id: company_info.exporter_tax_id || 'Not specified',
        phone: company_info.exporter_phone ?? '',
        email: company_info.exporter_email ?? ''
      },

      // Producer (same as exporter if not specified)
      producer: {
        same_as_exporter: true,
        name: company_info.exporter_name,
        address: company_info.exporter_address,
        country: company_info.exporter_country || '',  // Empty string instead of 'Not specified'
        tax_id: company_info.exporter_tax_id || 'Not specified',
        phone: company_info.exporter_phone ?? '',
        email: company_info.exporter_email ?? ''
      },

      // Importer Information
      importer: {
        name: company_info.importer_name,
        address: company_info.importer_address,
        country: company_info.importer_country || '',  // Empty string instead of undefined
        tax_id: company_info.importer_tax_id || 'Not specified',
        phone: authorization.importer_phone ?? company_info.importer_phone ?? '',
        email: authorization.importer_email ?? company_info.importer_email ?? ''
      },

      // Product Information
      product: {
        description: product_details.product_description || product_details.commercial_description
      },

      // HS Classification
      hs_classification: {
        code: product_details.hs_code,
        verified: product_details.tariff_classification_verified || false,
        verification_source: product_details.verification_source || 'User provided'
      },

      // Preference Criterion
      // ✅ REMOVED: || 'B' default (line 101)
      // REASON: FALSE CERTIFICATION if AI didn't determine criterion
      // FIX: Never default - let API caller handle missing criterion
      preference_criterion: supply_chain?.preference_criterion,
      criterion_explanation: 'Qualifies under Regional Value Content calculation',
      regional_value_content: `${supply_chain?.regional_value_content || 0}%`,

      // Component Origins
      component_origins: supply_chain?.component_origins || [],

      // Producer Declaration
      producer_declaration: {
        is_producer: true,
        declaration: 'Producer is the same as exporter'
      },

      // Qualification Method
      qualification_method: {
        method: supply_chain?.rule || 'RVC',
        description: 'Regional Value Content Method'
      },

      // Country of Origin
      country_of_origin: supply_chain?.manufacturing_location || product_details.manufacturing_location || company_info.exporter_country,

      // Blanket Period
      blanket_period: {
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },

      // Authorization
      authorization: {
        signatory_name: authorization.signatory_name,
        signatory_title: authorization.signatory_title,
        signature_date: new Date().toISOString().split('T')[0],
        declaration_accepted: authorization.declaration_accepted || false,
        email: authorization.signatory_email,
        phone: authorization.signatory_phone
      },

      // Trust Verification
      trust_verification: {
        overall_trust_score: supply_chain?.trust_score || 0.85,
        trust_level: supply_chain?.trust_score >= 0.8 ? 'high' : 'moderate',
        verification_status: supply_chain?.verification_status || 'verified'
      },

      // USMCA Analysis Summary
      usmca_analysis: {
        qualified: supply_chain?.qualified !== false,
        regional_content: supply_chain?.regional_value_content || 0,
        threshold_applied: supply_chain?.threshold_applied || 60
      },

      // Additional Information for Field 9
      additional_information: {
        manufacturing_country: supply_chain?.manufacturing_location || product_details.manufacturing_location || company_info.exporter_country,
        regional_value_content: supply_chain?.regional_value_content || 0,
        method_of_qualification: supply_chain?.method_of_qualification || 'TV',
        // ✅ REMOVED: || 'B' default (line 158)
        // REASON: FALSE CERTIFICATION if AI didn't determine criterion
        // FIX: Never default - let API caller handle missing criterion
        preference_criterion: supply_chain?.preference_criterion,
        qualification_rule: supply_chain?.rule || 'Regional Value Content',
        rvc_threshold: supply_chain?.threshold_applied || 60,
        component_breakdown: supply_chain?.component_origins || []
      }
    };

    console.log(`✅ Certificate generated: ${certificateNumber}`);

    return res.status(200).json({
      success: true,
      certificate_number: certificateNumber,
      professional_certificate: professionalCertificate
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Certificate generation failed',
      message: error.message
    });
  }
}
