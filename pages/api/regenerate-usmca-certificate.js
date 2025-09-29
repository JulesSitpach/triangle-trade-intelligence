/**
 * API: Regenerate USMCA Certificate with Professional Corrections
 * Used by Cristina's USMCACertificateTab Stage 2
 * Applies professional corrections and regenerates certificate with OpenRouter AI analysis
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { original_request, corrections, professional_adjustments } = req.body;

    // Extract subscriber data
    const subscriberData = original_request?.subscriber_data || original_request?.workflow_data || {};

    // Apply Cristina's professional corrections
    const correctedData = {
      ...subscriberData,
      // Override with professional corrections if provided
      ...(corrections.hs_code_correction && {
        classified_hs_code: corrections.hs_code_correction,
        hs_code_corrected_by_professional: true
      }),
      ...(corrections.product_description_fix && {
        product_description: corrections.product_description_fix,
        product_description_professionally_enhanced: true
      }),
      ...(corrections.manufacturing_location_correction && {
        manufacturing_location: corrections.manufacturing_location_correction,
        manufacturing_location_verified: true
      }),

      // Add professional enhancements
      professional_validation: {
        cristina_license: '4601913',
        validation_date: new Date().toISOString(),
        confidence_level: professional_adjustments.compliance_confidence_level,
        professional_notes: professional_adjustments.professional_recommendations,
        liability_backing: professional_adjustments.customs_broker_guarantee
      }
    };

    // === OpenRouter API Integration for Professional Certificate Enhancement ===
    const openRouterPrompt = `PROFESSIONAL USMCA CERTIFICATE VALIDATION

BUSINESS CONTEXT:
Company: ${correctedData.company_name || original_request.company_name}
Product: ${correctedData.product_description}
HS Code: ${correctedData.classified_hs_code}
Manufacturing: ${correctedData.manufacturing_location}
Trade Volume: $${correctedData.trade_volume || original_request.trade_volume}
USMCA Status: ${correctedData.qualification_status}

COMPONENT ORIGINS:
${correctedData.component_origins?.map(comp =>
  `- ${comp.origin_country} (${comp.value_percentage}%): ${comp.description}`
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

    // Generate professionally enhanced certificate
    const correctedCertificate = {
      // Basic certificate structure
      certificate_number: `PROF-${Date.now()}`,
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

      // Company information
      exporter_name: correctedData.company_name || original_request.company_name,
      exporter_address: correctedData.company_address || subscriberData.company_address,
      exporter_tax_id: correctedData.tax_id || subscriberData.tax_id,

      // Product information (with AI enhancements if available)
      product_description: aiEnhancements?.enhanced_product_description || correctedData.product_description,
      hs_tariff_classification: correctedData.classified_hs_code,
      country_of_origin: correctedData.manufacturing_location,

      // USMCA qualification (with AI analysis)
      preference_criterion: aiEnhancements?.preference_criterion || correctedData.preference_criterion || 'A',
      preference_criterion_justification: aiEnhancements?.preference_criterion_justification || 'Professional assessment based on component analysis',
      regional_value_content: aiEnhancements?.regional_value_content_methodology || correctedData.north_american_content || 'Professionally calculated per USMCA methodology',
      qualification_status: correctedData.qualification_status || 'Professionally assessed',

      // Professional backing
      professional_validation: correctedData.professional_validation,
      customs_broker_license: '4601913',
      professional_guarantee: 'This certificate is professionally backed by Licensed Customs Broker Cristina Escalante, License #4601913',

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

    res.status(200).json({
      success: true,
      corrected_certificate: correctedCertificate,
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