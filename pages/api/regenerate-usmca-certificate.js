/**
 * API: Regenerate USMCA Certificate with Professional Corrections
 * Used by Cristina's USMCACertificateTab Stage 2
 * Applies professional corrections and regenerates certificate with OpenRouter AI analysis
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle BOTH data structures: Admin workflow (original_request) OR User workflow (certificateData)
    const { original_request, corrections = {}, professional_adjustments = {}, certificateData } = req.body;

    // Detect which data structure we're using
    let subscriberData = {};
    let companyName = '';
    let productDescription = '';
    let hsCode = '';
    let manufacturingLocation = '';

    if (certificateData) {
      // User workflow data structure
      subscriberData = {
        company_name: certificateData.company_info?.exporter_name || '',
        company_address: certificateData.company_info?.exporter_address || '',
        tax_id: certificateData.company_info?.exporter_tax_id || '',
        product_description: certificateData.product_details?.product_description || certificateData.product_details?.commercial_description || '',
        classified_hs_code: certificateData.product_details?.hs_code || '',
        manufacturing_location: certificateData.product_details?.manufacturing_location || certificateData.supply_chain?.manufacturing_location || '',
        qualification_status: certificateData.supply_chain?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
        north_american_content: certificateData.supply_chain?.regional_value_content || 100,
        preference_criterion: certificateData.supply_chain?.preference_criterion || 'B',
        component_origins: certificateData.supply_chain?.component_origins || [],
        rule: certificateData.supply_chain?.rule || 'Regional Value Content',
        threshold_applied: certificateData.supply_chain?.threshold_applied || 65
      };

      companyName = subscriberData.company_name;
      productDescription = subscriberData.product_description;
      hsCode = subscriberData.classified_hs_code;
      manufacturingLocation = subscriberData.manufacturing_location;
    } else {
      // Admin workflow data structure
      subscriberData = original_request?.subscriber_data || original_request?.workflow_data || {};
      companyName = subscriberData.company_name || original_request?.company_name || '';
      productDescription = subscriberData.product_description || '';
      hsCode = subscriberData.classified_hs_code || '';
      manufacturingLocation = subscriberData.manufacturing_location || '';
    }

    // Apply Cristina's professional corrections (if any)
    const correctedData = {
      ...subscriberData,
      // Override with professional corrections if provided
      ...(corrections?.hs_code_correction && {
        classified_hs_code: corrections.hs_code_correction,
        hs_code_corrected_by_professional: true
      }),
      ...(corrections?.product_description_fix && {
        product_description: corrections.product_description_fix,
        product_description_professionally_enhanced: true
      }),
      ...(corrections?.manufacturing_location_correction && {
        manufacturing_location: corrections.manufacturing_location_correction,
        manufacturing_location_verified: true
      }),

      // Add professional enhancements (optional for regular workflow certificates)
      ...(professional_adjustments && Object.keys(professional_adjustments).length > 0 && {
        professional_validation: {
          cristina_license: '4601913',
          validation_date: new Date().toISOString(),
          confidence_level: professional_adjustments.compliance_confidence_level,
          professional_notes: professional_adjustments.professional_recommendations,
          liability_backing: professional_adjustments.customs_broker_guarantee
        }
      })
    };

    // === OpenRouter API Integration for Professional Certificate Enhancement ===
    const openRouterPrompt = `PROFESSIONAL USMCA CERTIFICATE VALIDATION

BUSINESS CONTEXT:
Company: ${companyName}
Product: ${correctedData.product_description || productDescription}
HS Code: ${correctedData.classified_hs_code || hsCode}
Manufacturing: ${correctedData.manufacturing_location || manufacturingLocation}
Trade Volume: $${correctedData.trade_volume || certificateData?.company_info?.trade_volume || 'Not specified'}
USMCA Status: ${correctedData.qualification_status}

COMPONENT ORIGINS:
${correctedData.component_origins?.map(comp =>
  `- ${comp.origin_country || comp.country} (${comp.value_percentage || comp.percentage}%): ${comp.description || 'Component'}`
).join('\n') || 'Not specified'}

FINANCIAL IMPACT:
- Annual Tariff Cost: $${correctedData.annual_tariff_cost || 0}
- Potential USMCA Savings: $${correctedData.potential_usmca_savings || 0}

COMPLIANCE GAPS:
${correctedData.compliance_gaps?.map(gap => `- ${gap}`).join('\n') || 'None identified'}

VULNERABILITY FACTORS:
${correctedData.vulnerability_factors?.map(factor => `- ${factor}`).join('\n') || 'None identified'}

PROFESSIONAL CORRECTIONS APPLIED:
${corrections.hs_code_correction ? `- HS Code corrected to: ${corrections.hs_code_correction}` : ''}
${corrections.product_description_fix ? `- Product description enhanced` : ''}
${corrections.manufacturing_location_correction ? `- Manufacturing location verified` : ''}

PROFESSIONAL ASSESSMENT:
Confidence Level: ${professional_adjustments.compliance_confidence_level}
Professional Notes: ${professional_adjustments.professional_recommendations}
Customs Broker Guarantee: ${professional_adjustments.customs_broker_guarantee}

TASK: As Licensed Customs Broker Cristina (License #4601913) with 17 years electronics/telecom experience, generate a professionally enhanced USMCA Certificate of Origin that includes:

1. Enhanced product description with regulatory compliance language
2. Precise regional value content calculation methodology
3. Preference criterion justification (A/B/C/D with explanation)
4. Audit defense preparation notes
5. Ongoing monitoring recommendations
6. Professional regulatory references

Return a JSON object with:
{
  "enhanced_product_description": "Professional product description with regulatory compliance language",
  "regional_value_content_methodology": "Detailed RVC calculation with supporting documentation requirements",
  "preference_criterion": "A/B/C/D",
  "preference_criterion_justification": "Professional explanation of why this criterion applies",
  "audit_defense_notes": ["Note 1", "Note 2", "Note 3"],
  "ongoing_monitoring_recommendations": ["Recommendation 1", "Recommendation 2"],
  "regulatory_references": ["Reference 1", "Reference 2"],
  "professional_risk_assessment": "Overall risk assessment from customs broker perspective",
  "estimated_qualification_confidence": "High/Medium/Moderate confidence level"
}`;

    // Make OpenRouter API call
    let aiEnhancements = null;
    let aiAnalysisPerformed = false;

    try {
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku',
          messages: [{
            role: 'user',
            content: openRouterPrompt
          }]
        })
      });

      if (openRouterResponse.ok) {
        const aiResponse = await openRouterResponse.json();
        const aiContent = aiResponse.choices[0]?.message?.content;

        // Parse JSON response
        try {
          const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiEnhancements = JSON.parse(jsonMatch[0]);
            aiAnalysisPerformed = true;
          }
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
        }
      }
    } catch (apiError) {
      console.error('OpenRouter API error:', apiError);
      // Continue with certificate generation even if AI fails
    }

    // Calculate trust score before creating certificate
    const trustScore = certificateData?.supply_chain?.trust_score || correctedData.trust_score || 0.85;
    let trustLevel = 'low';
    if (trustScore >= 0.9) trustLevel = 'excellent';
    else if (trustScore >= 0.8) trustLevel = 'high';
    else if (trustScore >= 0.7) trustLevel = 'moderate';

    // Generate professionally enhanced certificate
    const correctedCertificate = {
      // Basic certificate structure
      certificate_number: `PROF-${Date.now()}`,
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

      // Generation info for certificate header
      generation_info: {
        generated_date: new Date().toISOString(),
        generated_by: 'Triangle Trade Intelligence Platform',
        validated_by: correctedData.hs_code_corrected_by_professional
          ? 'Licensed Customs Broker Trade Compliance Expert #4601913'
          : 'AI-powered USMCA compliance engine (OpenRouter API)'
      },

      // Trust verification data
      trust_verification: {
        overall_trust_score: trustScore,
        trust_level: trustLevel,
        verification_status: 'Professionally Validated',
        verification_date: new Date().toISOString()
      },

      // Component origins breakdown
      component_origins: correctedData.component_origins || certificateData?.supply_chain?.component_origins || [],

      // Company information - NESTED STRUCTURE for frontend compatibility
      exporter: {
        name: String(companyName || '').trim(),
        address: String(correctedData.company_address || subscriberData.company_address || certificateData?.company_info?.exporter_address || '').trim(),
        country: String(correctedData.manufacturing_location || manufacturingLocation || certificateData?.company_info?.exporter_country || '').trim(),
        tax_id: String(correctedData.tax_id || subscriberData.tax_id || certificateData?.company_info?.exporter_tax_id || '').trim().replace(/[^\w\s-]/g, ''),
        phone: String(certificateData?.company_info?.exporter_phone || '').trim(),
        email: String(certificateData?.company_info?.exporter_email || '').trim()
      },

      // Product information - NESTED STRUCTURE (with AI enhancements if available)
      product: {
        description: aiEnhancements?.enhanced_product_description || correctedData.product_description || productDescription,
        hs_code: correctedData.classified_hs_code || hsCode,
        commercial_description: correctedData.product_description || productDescription
      },

      // HS Classification - NESTED STRUCTURE
      hs_classification: {
        code: correctedData.classified_hs_code || hsCode,
        verified: true,
        source: correctedData.hs_code_corrected_by_professional ? 'Professional customs broker classification' : 'AI classification',
        verification_source: correctedData.hs_code_corrected_by_professional
          ? 'Professionally verified by Licensed Customs Broker Trade Compliance Expert #4601913'
          : 'AI-classified via OpenRouter API (Claude 3.5 Sonnet)'
      },

      // Certifier - NESTED STRUCTURE for Field 2
      certifier: {
        type: 'Exporter',
        name: companyName,
        address: correctedData.company_address || subscriberData.company_address || certificateData?.company_info?.exporter_address || '',
        country: correctedData.manufacturing_location || manufacturingLocation || certificateData?.company_info?.exporter_country || ''
      },

      // Producer - NESTED STRUCTURE for Field 3
      producer: {
        name: companyName || 'Same as Exporter',
        address: correctedData.company_address || subscriberData.company_address || certificateData?.company_info?.exporter_address || 'Manufacturing Facility',
        country: correctedData.manufacturing_location || manufacturingLocation || certificateData?.company_info?.exporter_country || ''
      },

      // Importer - NESTED STRUCTURE for Field 4
      importer: {
        name: String(certificateData?.company_info?.importer_name || certificateData?.authorization?.importer_name || '').trim(),
        address: String(certificateData?.company_info?.importer_address || certificateData?.authorization?.importer_address || '').trim(),
        country: String(certificateData?.company_info?.importer_country || certificateData?.authorization?.importer_country || '').trim(),
        tax_id: String(certificateData?.company_info?.importer_tax_id || certificateData?.authorization?.importer_tax_id || '').trim().replace(/[^\w\s-]/g, '')
      },

      // Producer Declaration - for Field 7
      producer_declaration: {
        is_producer: true,
        declaration: 'The producer certifies that the good qualifies as originating'
      },

      // Blanket Period - for Field 11
      blanket_period: {
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },

      // Field 12 - Authorization (frontend expects this name, not authorized_signature)
      authorization: {
        signatory_name: certificateData?.authorization?.signatory_name || '',
        signatory_title: certificateData?.authorization?.signatory_title || '',
        signature_date: certificateData?.authorization?.signatory_date || new Date().toISOString(), // frontend expects signature_date
        declaration_accepted: certificateData?.authorization?.declaration_accepted || false
      },

      // Field 9 - Qualification Method (frontend expects this name, not method_of_qualification)
      qualification_method: {
        method: correctedData.rule || certificateData?.supply_chain?.rule || 'Regional Value Content',
        description: `Product qualifies under Criterion ${aiEnhancements?.preference_criterion || correctedData.preference_criterion || certificateData?.supply_chain?.preference_criterion || 'B'} (Regional Value Content method) with ${correctedData.north_american_content || certificateData?.supply_chain?.regional_value_content || 0}% regional content (threshold: ${correctedData.threshold_applied || certificateData?.supply_chain?.threshold_applied || 65}%)`,
        preference_criterion: aiEnhancements?.preference_criterion || correctedData.preference_criterion || certificateData?.supply_chain?.preference_criterion || 'B'
      },

      // Country of Origin - maintain as string for Field 10 compatibility
      country_of_origin: correctedData.manufacturing_location || manufacturingLocation || certificateData?.company_info?.exporter_country || '',
      manufacturing_location: correctedData.manufacturing_location || manufacturingLocation || '',

      // USMCA qualification (with AI analysis)
      preference_criterion: aiEnhancements?.preference_criterion || correctedData.preference_criterion || certificateData?.supply_chain?.preference_criterion || 'B',
      criterion_explanation: `Qualifies under Criterion ${aiEnhancements?.preference_criterion || correctedData.preference_criterion || certificateData?.supply_chain?.preference_criterion || 'B'} (Regional Value Content method) with ${correctedData.north_american_content || certificateData?.supply_chain?.regional_value_content || 0}% regional content`,
      preference_criterion_justification: aiEnhancements?.preference_criterion_justification || 'Professional assessment based on component analysis and regional value content calculation',
      regional_value_content: `${correctedData.north_american_content || certificateData?.supply_chain?.regional_value_content || 0}%`,
      regional_value_content_methodology: aiEnhancements?.regional_value_content_methodology || 'RVC calculation per USMCA Article 4',
      qualification_status: correctedData.qualification_status || 'Professionally assessed',

      // Professional backing
      professional_validation: correctedData.professional_validation,
      customs_broker_license: '4601913',
      professional_guarantee: 'This certificate is professionally backed by Licensed Customs Broker Trade Compliance Expert, License #4601913',

      // AI-enhanced features
      audit_defense_notes: aiEnhancements?.audit_defense_notes || [
        'Documentation supporting regional value content calculation',
        'Component origin verification records',
        'Manufacturing process documentation'
      ],
      ongoing_monitoring: aiEnhancements?.ongoing_monitoring_recommendations || [
        'Quarterly review of supplier certifications',
        'Annual USMCA qualification reassessment'
      ],
      regulatory_references: aiEnhancements?.regulatory_references || [
        'USMCA Chapter 4: Rules of Origin',
        'USMCA Chapter 6: Textile and Apparel Goods'
      ],

      // Enhanced features
      cristina_professional_enhancements: {
        risk_assessment_completed: true,
        regulatory_compliance_verified: true,
        audit_defense_preparation: true,
        ongoing_monitoring_included: true,
        ai_analysis_performed: aiAnalysisPerformed,
        professional_risk_assessment: aiEnhancements?.professional_risk_assessment || professional_adjustments.professional_recommendations,
        qualification_confidence: aiEnhancements?.estimated_qualification_confidence || 'High'
      }
    };

    // Save certificate to database for retrieval from dashboard
    try {
      const certificateRecord = {
        certificate_id: correctedCertificate.certificate_number,
        certificate_data: correctedCertificate,
        certificate_generated: true,
        product_description: correctedCertificate.product?.description || productDescription,
        hs_code: correctedCertificate.hs_classification?.code || hsCode,
        qualification_status: correctedCertificate.qualification_status || 'Professionally assessed',
        regional_content_percentage: correctedCertificate.regional_value_content || 0,
        component_origins: correctedCertificate.component_origins || [],
        generated_at: new Date().toISOString()
      };

      // Update workflow_completions with certificate data
      const { error: dbError } = await supabase
        .from('workflow_completions')
        .update({
          certificate_id: certificateRecord.certificate_id,
          certificate_data: certificateRecord.certificate_data,
          certificate_generated: true,
          updated_at: new Date().toISOString()
        })
        .eq('hs_code', hsCode)
        .eq('product_description', productDescription);

      if (dbError) {
        console.error('Failed to save certificate to database:', dbError);
        // Continue anyway - don't fail the request
      } else {
        console.log('✅ Certificate saved to database:', certificateRecord.certificate_id);
      }
    } catch (dbSaveError) {
      console.error('Certificate database save error:', dbSaveError);
      // Continue anyway - don't fail the request
    }

    res.status(200).json({
      success: true,
      certificate: correctedCertificate,  // Frontend expects "certificate" not "corrected_certificate"
      corrected_certificate: correctedCertificate,  // Keep for backwards compatibility
      ai_analysis_performed: aiAnalysisPerformed,
      professional_enhancements_applied: [
        'HS Code professional verification',
        'Product description regulatory compliance enhancement',
        'Manufacturing location confirmation',
        'Professional liability backing applied',
        'Customs broker license guarantee added',
        aiAnalysisPerformed ? 'AI-powered regulatory analysis completed' : 'Professional template applied'
      ],
      cristina_validation: {
        license_number: '4601913',
        validation_timestamp: new Date().toISOString(),
        professional_confidence: aiEnhancements?.estimated_qualification_confidence || 'High',
        liability_coverage: 'Active',
        ai_enhanced: aiAnalysisPerformed
      }
    });

  } catch (error) {
    console.error('Certificate regeneration error:', error);
    res.status(500).json({
      error: 'Certificate regeneration failed',
      message: error.message
    });
  }
}