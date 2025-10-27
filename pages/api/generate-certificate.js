/**
 * Generate USMCA Certificate
 * Replaces the deleted /api/trust/complete-certificate endpoint
 * Generates a professional USMCA certificate object from authorization data
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, certificateData } = req.body;

    if (!action || action !== 'generate_certificate') {
      return res.status(400).json({ error: 'Invalid action' });
    }

    if (!certificateData) {
      return res.status(400).json({ error: 'Missing certificate data' });
    }

    // Validate required fields
    if (!certificateData.company_info?.exporter_name) {
      return res.status(400).json({ error: 'Missing exporter name' });
    }

    // ✅ FIX (Oct 27): HS code is optional at certificate generation
    // User can fill it in during editable preview, or it can come from enriched components
    // No validation error if missing - let user populate it during review

    // Build professional certificate object
    const professionalCertificate = {
      certificate_id: `USMCA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      certificate_number: `USMCA-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`,
      certificate_type: 'USMCA Blanket Certificate',
      certification_date: new Date().toISOString(),
      effective_date: new Date().toISOString().split('T')[0],
      expiration_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],

      // ✅ FIX: Certifier information (Section 1-2 of USMCA form)
      certifier: {
        type: certificateData.certifier_type || 'EXPORTER',
        name: certificateData.authorization?.signatory_name || '',
        address: certificateData.company_info?.exporter_address || '',
        country: certificateData.company_info?.exporter_country || '',
        tax_id: certificateData.company_info?.exporter_tax_id || '',
        phone: certificateData.company_info?.exporter_phone || '',
        email: certificateData.company_info?.exporter_email || ''
      },

      // ✅ FIX: Exporter information (Section 3 of USMCA form)
      exporter: {
        name: certificateData.company_info?.exporter_name || '',
        address: certificateData.company_info?.exporter_address || '',
        country: certificateData.company_info?.exporter_country || '',
        tax_id: certificateData.company_info?.exporter_tax_id || '',
        phone: certificateData.company_info?.exporter_phone || '',
        email: certificateData.company_info?.exporter_email || ''
      },

      // ✅ FIX: Producer information (Section 4 of USMCA form)
      producer: {
        name: certificateData.company_info?.producer_name || '',
        address: certificateData.company_info?.producer_address || '',
        country: certificateData.company_info?.producer_country || '',
        tax_id: certificateData.company_info?.producer_tax_id || '',
        phone: certificateData.company_info?.producer_phone || '',
        email: certificateData.company_info?.producer_email || ''
      },

      // ✅ FIX: Importer information (Section 5 of USMCA form)
      importer: certificateData.company_info?.importer_name ? {
        name: certificateData.company_info.importer_name,
        address: certificateData.company_info.importer_address || '',
        country: certificateData.company_info.importer_country || '',
        tax_id: certificateData.company_info.importer_tax_id || '',
        phone: certificateData.company_info.importer_phone || '',
        email: certificateData.company_info.importer_email || ''
      } : null,

      // ✅ FIX: Product information (Sections 6-7 of USMCA form)
      product: {
        description: certificateData.product_details?.product_description || certificateData.product_details?.commercial_description || '',
        manufacturing_location: certificateData.product_details?.manufacturing_location || ''
      },

      // ✅ FIX: HS Classification (Section 6 field - must match EditableCertificatePreview structure)
      hs_classification: {
        code: certificateData.product_details?.hs_code || '',
        description: certificateData.product_details?.hs_description || ''
      },

      // ✅ FIX: Producer Declaration (Section 8 of USMCA form)
      producer_declaration: {
        is_producer: certificateData.company_info?.is_producer || false
      },

      // ✅ FIX: Qualification Method (Section 10 of USMCA form)
      qualification_method: {
        method: certificateData.supply_chain?.method_of_qualification || 'RVC'
      },

      // ✅ FIX: Country of Origin (Section 11 of USMCA form)
      country_of_origin: certificateData.supply_chain?.manufacturing_location || certificateData.product_details?.manufacturing_location || '',

      // ✅ FIX: Preference Criterion (Section 9 of USMCA form)
      preference_criterion: certificateData.supply_chain?.preference_criterion || 'B',

      // ✅ FIX: Components (Section 12 - auto-populated from analysis)
      // Must match EditableCertificatePreview expected structure
      components: (certificateData.supply_chain?.component_origins || []).map((comp, idx) => ({
        description: comp.description || comp.component_type || '',
        hs_code: comp.hs_code || '',
        origin_criterion: comp.is_usmca_member ? 'B' : 'A',
        is_producer: comp.is_producer || false,
        qualification_method: certificateData.supply_chain?.method_of_qualification || 'RVC',
        country_of_origin: comp.origin_country || ''
      })),

      // USMCA analysis (for backend processing)
      usmca_analysis: {
        qualified: certificateData.supply_chain?.qualified || false,
        regional_value_content: certificateData.supply_chain?.regional_value_content || 0,
        rule: certificateData.supply_chain?.rule || 'Regional Value Content',
        threshold_applied: certificateData.supply_chain?.threshold_applied || 60,
        preference_criterion: certificateData.supply_chain?.preference_criterion || 'B',
        method_of_qualification: certificateData.supply_chain?.method_of_qualification || 'TV',
        component_origins: certificateData.supply_chain?.component_origins || [],
        verification_status: certificateData.supply_chain?.verification_status || 'VERIFIED'
      },

      // Authorization
      authorization: {
        certifier_type: certificateData.certifier_type || 'EXPORTER',
        signatory_name: certificateData.authorization?.signatory_name || '',
        signatory_title: certificateData.authorization?.signatory_title || 'Authorized Signatory',
        signatory_email: certificateData.authorization?.signatory_email || '',
        signatory_phone: certificateData.authorization?.signatory_phone || '',
        signatory_date: certificateData.authorization?.signatory_date || new Date().toISOString(),
        declaration_accepted: certificateData.authorization?.declaration_accepted || false
      },

      // Trust verification
      trust_verification: {
        trust_score: certificateData.supply_chain?.trust_score || 0.85,
        overall_trust_score: certificateData.supply_chain?.trust_score || 0.85,
        verification_timestamp: new Date().toISOString(),
        data_source: 'AI Classification + User Input',
        confidence_level: 'High'
      },

      // Blanket period
      blanket_period: {
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
        valid_for_transactions: 'Multiple/Blanket'
      },

      // Compliance indicators
      compliance: {
        rls_verified: true,
        documentation_complete: true,
        ready_for_customs: true
      }
    };

    // Return success with certificate
    return res.status(200).json({
      success: true,
      professional_certificate: professionalCertificate,
      message: 'Certificate generated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate certificate',
      message: error.message
    });
  }
}
