/**
 * API: HS Classification Validation with OpenRouter AI + Professional Customs Broker Review
 * Used by Cristina's HSClassificationTab - 2-stage workflow
 * Stage 2: AI analysis with FULL business intelligence context + Cristina's professional validation
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { original_request, classification_data, professional_review } = req.body;

    // Extract comprehensive subscriber data and classification context
    const subscriberData = original_request?.subscriber_data || {};
    const serviceDetails = original_request?.service_details || {};
    const classificationContext = classification_data || {};

    // Parse trade volume from string if needed
    const parseTradeVolume = (volume) => {
      if (!volume) return 0;
      if (typeof volume === 'number') return volume;
      // Extract numeric value from strings like "$2,100,000", "2.1M", "$2.1 million"
      const numericMatch = String(volume).match(/[\d,\.]+/);
      if (!numericMatch) return 0;
      const numeric = numericMatch[0].replace(/,/g, '');

      // Handle M, K suffixes
      if (String(volume).toLowerCase().includes('m')) {
        return parseFloat(numeric) * 1000000;
      } else if (String(volume).toLowerCase().includes('k')) {
        return parseFloat(numeric) * 1000;
      }
      return parseFloat(numeric);
    };

    const tradeVolume = parseTradeVolume(serviceDetails?.trade_volume || original_request?.trade_volume);

    // Build comprehensive business context for AI analysis
    const businessContext = {
      company: {
        name: original_request?.company_name || serviceDetails?.company_name,
        business_type: serviceDetails?.business_type,
        industry: original_request?.industry,
        contact: original_request?.contact_name,
        email: serviceDetails?.contact_email || original_request?.email,
        phone: serviceDetails?.contact_phone || original_request?.phone
      },
      product: {
        description: serviceDetails?.product_description || subscriberData?.product_description,
        category: serviceDetails?.product_category,
        manufacturing_location: serviceDetails?.manufacturing_location,
        current_hs_code: serviceDetails?.current_hs_code || subscriberData?.current_hs_code,
        component_origins: serviceDetails?.component_origins || subscriberData?.component_origins || []
      },
      trade: {
        annual_volume: tradeVolume,
        supplier_country: serviceDetails?.supplier_country,
        target_markets: serviceDetails?.target_markets || [],
        import_frequency: serviceDetails?.import_frequency,
        current_usmca_status: serviceDetails?.qualification_status
      },
      financial_impact: {
        annual_tariff_cost: serviceDetails?.annual_tariff_cost,
        potential_usmca_savings: serviceDetails?.potential_usmca_savings
      },
      risk_assessment: {
        compliance_gaps: serviceDetails?.compliance_gaps || [],
        vulnerability_factors: serviceDetails?.vulnerability_factors || [],
        regulatory_requirements: serviceDetails?.regulatory_requirements || []
      },
      classification_request: {
        preliminary_hs_code: classificationContext.preliminary_hs_code,
        classification_reasoning: classificationContext.classification_reasoning,
        industry_context: classificationContext.industry_context
      }
    };

    // Construct comprehensive AI prompt with full business intelligence
    const aiPrompt = `You are assisting Cristina Escalante, a Licensed Customs Broker (#4601913) with 17 years of logistics experience specializing in electronics/telecom industries and HTS code classification expertise.

BUSINESS INTELLIGENCE CONTEXT:

Company Profile:
- Company: ${businessContext.company.name}
- Business Type: ${businessContext.company.business_type}
- Industry: ${businessContext.company.industry}
- Contact: ${businessContext.company.contact} (${businessContext.company.email}, ${businessContext.company.phone})

Product & Supply Chain:
- Product: ${businessContext.product.description}
- Category: ${businessContext.product.category}
- Current Manufacturing: ${businessContext.product.manufacturing_location}
- Current HS Code: ${businessContext.product.current_hs_code || 'Not yet classified'}
- Component Origins:
${businessContext.product.component_origins.map(c => `  • ${c.country} (${c.percentage}%): ${c.description || c.component_type}`).join('\n')}

Trade Profile:
- Annual Trade Volume: $${Number(businessContext.trade.annual_volume || 0).toLocaleString()}
- Primary Supplier: ${businessContext.trade.supplier_country}
- Target Markets: ${businessContext.trade.target_markets.join(', ')}
- Import Frequency: ${businessContext.trade.import_frequency}
- USMCA Status: ${businessContext.trade.current_usmca_status}

Financial Impact:
- Annual Tariff Cost: $${Number(businessContext.financial_impact.annual_tariff_cost || 0).toLocaleString()}
- Potential USMCA Savings: $${Number(businessContext.financial_impact.potential_usmca_savings || 0).toLocaleString()}/year

Known Compliance Gaps:
${businessContext.risk_assessment.compliance_gaps.map(g => `- ${g}`).join('\n')}

Regulatory Requirements:
${businessContext.risk_assessment.regulatory_requirements.map(r => `- ${r}`).join('\n')}

CLASSIFICATION REQUEST:
- Preliminary HS Code Suggested: ${businessContext.classification_request.preliminary_hs_code || 'To be determined'}
- Classification Reasoning: ${businessContext.classification_request.classification_reasoning || 'Initial analysis pending'}
- Industry Context: ${businessContext.classification_request.industry_context || businessContext.company.industry}

TASK:
Provide a comprehensive HS classification analysis that Cristina can review and validate with her customs broker license. Include:

1. HS Code Analysis:
   - Recommended HTS code(s) with detailed justification
   - Alternative classifications to consider
   - Chapter/heading/subheading breakdown and rationale
   - Component-level classification considerations based on origins

2. Tariff Impact Analysis:
   - Current MFN duty rate for recommended HS code
   - USMCA preferential rate (if applicable)
   - Annual duty cost calculation: MUST calculate ${businessContext.trade.annual_volume.toLocaleString()} × duty_rate%. Show your math.
   - Potential savings with USMCA qualification (current tariff cost - USMCA tariff cost)

   CRITICAL: The annual trade volume is $${businessContext.trade.annual_volume.toLocaleString()}. DO NOT say "if trade volume is $0" or return $0 calculations. Calculate actual tariff costs.

3. Regulatory Compliance:
   - CBP classification requirements specific to this product category
   - Required certifications (${businessContext.risk_assessment.regulatory_requirements.join(', ')})
   - Special trade program eligibility (USMCA, GSP, etc.)
   - Country-of-origin determination rules

4. Risk Assessment:
   - Classification certainty level (High/Medium/Low)
   - Potential audit risk factors
   - Documentation requirements for audit defense
   - Alternative classifications that CBP might consider

5. Implementation Guidance:
   - Entry filing requirements
   - Certificate of origin preparation (if USMCA-eligible)
   - Supplier documentation needs
   - Timeline for implementation

6. Component Origin Considerations:
   - How component origins affect final classification
   - USMCA regional value content (RVC) implications
   - Substantial transformation analysis
   - Country-specific duty implications

   CRITICAL RVC CALCULATION INSTRUCTIONS:
   Component breakdown:
${businessContext.product.component_origins.map(c => `   - ${c.country}: ${c.percentage}%`).join('\n')}

   Calculate current RVC: Sum only US, Canada, and Mexico percentages. Do NOT include China, Taiwan, or other non-USMCA countries.
   USMCA requires 75% RVC minimum for most electronics.
   Show your math: Mexico ${businessContext.product.component_origins.find(c => c.country === 'MX' || c.country === 'Mexico')?.percentage || 0}% + US ${businessContext.product.component_origins.find(c => c.country === 'US' || c.country === 'United States')?.percentage || 0}% + Canada ${businessContext.product.component_origins.find(c => c.country === 'CA' || c.country === 'Canada')?.percentage || 0}% = X% current RVC.

Format as JSON with these exact keys: recommended_hs_code, confidence_level, classification_justification, alternative_codes (array of objects with code and reasoning), tariff_analysis (object with mfn_rate, usmca_rate, annual_duty_cost, potential_savings), regulatory_requirements (array), risk_factors (array), audit_defense_recommendations (array), implementation_steps (array), component_origin_impact (string), current_rvc_percentage (number), required_rvc_percentage (number).`;

    console.log('[HS CLASSIFICATION] Calling OpenRouter API with comprehensive business context...');

    // Call OpenRouter API with full business intelligence
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Triangle Intelligence - HS Classification Analysis'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
        messages: [{
          role: 'user',
          content: aiPrompt
        }],
        temperature: 0.3, // Lower temperature for more precise classification
        max_tokens: 3000
      })
    });

    if (!openRouterResponse.ok) {
      throw new Error(`OpenRouter API error: ${openRouterResponse.status} ${openRouterResponse.statusText}`);
    }

    const openRouterData = await openRouterResponse.json();
    const aiResponseText = openRouterData.choices[0]?.message?.content || '';

    console.log('[HS CLASSIFICATION] OpenRouter API response received');

    // Parse AI response (try JSON first, fallback to text parsing)
    let aiAnalysis;
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.log('[HS CLASSIFICATION] JSON parse failed, using structured fallback');
      // Fallback: structure the text response
      aiAnalysis = {
        recommended_hs_code: classificationContext.preliminary_hs_code || 'To be determined',
        confidence_level: 'Medium',
        classification_justification: aiResponseText.substring(0, 300),
        alternative_codes: [],
        tariff_analysis: {
          mfn_rate: 'To be verified',
          usmca_rate: 'To be verified',
          annual_duty_cost: businessContext.financial_impact.annual_tariff_cost || 0,
          potential_savings: businessContext.financial_impact.potential_usmca_savings || 0
        },
        regulatory_requirements: businessContext.risk_assessment.regulatory_requirements || [],
        risk_factors: ['AI analysis provided - requires professional customs broker review'],
        audit_defense_recommendations: ['Professional classification report', 'Supporting documentation'],
        implementation_steps: ['Review with customs broker', 'Prepare filing documentation'],
        component_origin_impact: 'Analysis pending professional review',
        raw_ai_analysis: aiResponseText
      };
    }

    // Return AI analysis for Cristina's professional customs broker validation
    res.status(200).json({
      success: true,
      ai_analysis: aiAnalysis,
      business_context: businessContext, // Include for professional review reference
      requires_professional_validation: true,
      next_action: {
        stage: 'Professional Validation',
        title: 'Customs Broker Professional Review',
        description: 'Cristina applies 17 years of HTS classification expertise and customs broker license validation',
        expert: 'Cristina Escalante',
        credentials: 'Licensed Customs Broker #4601913, Electronics/Telecom Specialization'
      },
      professional_value_add: {
        what_ai_provides: 'Comprehensive HS code analysis based on complete business intelligence',
        what_cristina_adds: [
          'Licensed customs broker validation with legal backing',
          'Professional liability coverage for classification recommendations',
          '17 years of electronics/telecom HTS code expertise',
          'Direct CBP relationships for ruling requests if needed',
          'Audit defense preparation and representation',
          'Binding ruling request preparation (if complex)',
          'Ongoing classification support for product variations'
        ]
      },
      classification_deliverables: [
        'Professional HS classification report with customs broker validation',
        'Tariff impact analysis with duty calculations',
        'CBP audit defense documentation package',
        'Entry filing guidance and requirements',
        'Certificate of origin preparation (if USMCA-eligible)',
        'Ongoing classification support for 12 months'
      ]
    });

  } catch (error) {
    console.error('HS classification validation error:', error);
    res.status(500).json({
      error: 'HS classification validation failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}