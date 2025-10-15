/**
 * API: Crisis Response Analysis with OpenRouter AI + Professional Management
 * Used by Cristina's CrisisResponseTab - 3-stage workflow
 * Stage 2: AI analysis with FULL business intelligence context
 * Stage 3: Cristina's professional validation and execution
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { original_request, crisis_assessment, professional_input } = req.body;

    // Extract comprehensive subscriber data and crisis details
    const subscriberData = original_request?.subscriber_data || {};
    const serviceDetails = original_request?.service_details || {};
    const crisisDetails = crisis_assessment || {};

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
        component_origins: serviceDetails?.component_origins || subscriberData?.component_origins || []
      },
      trade: {
        annual_volume: serviceDetails?.trade_volume || original_request?.trade_volume,
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
      crisis: {
        type: crisisDetails.crisis_type || serviceDetails?.crisis_type,
        timeline: crisisDetails.timeline || serviceDetails?.crisis_timeline,
        current_impact: crisisDetails.current_impact || serviceDetails?.business_impact,
        immediate_concerns: crisisDetails.immediate_concerns
      }
    };

    // Construct comprehensive AI prompt with full business intelligence
    const aiPrompt = `You are a senior crisis management and USMCA trade compliance expert with 20+ years of experience in trade policy, customs regulations, and supply chain resilience. You are assisting our Licensed Trade Compliance Expert (#4601913) with 17 years of logistics experience specializing in electronics/telecom industries.

===== COMPLETE BUSINESS INTELLIGENCE CONTEXT =====

Company Profile:
- Company: ${businessContext.company.name}
- Business Type: ${businessContext.company.business_type}
- Industry: ${businessContext.company.industry}
- Contact: ${businessContext.company.contact} (${businessContext.company.email}, ${businessContext.company.phone})

Product & Supply Chain:
- Product: ${businessContext.product.description}
- Category: ${businessContext.product.category}
- Current Manufacturing: ${businessContext.product.manufacturing_location}

===== SUPPLY CHAIN COMPONENTS WITH TARIFF INTELLIGENCE =====
${Array.isArray(businessContext.product.component_origins) && businessContext.product.component_origins.length > 0 ? businessContext.product.component_origins.map((c, idx) => {
    const country = c.origin_country || c.country || 'Unknown';
    const percentage = c.value_percentage || c.percentage || 0;
    const description = c.description || c.component_type || `Component ${idx + 1}`;
    const hsCode = c.hs_code || c.classified_hs_code || 'Not classified';
    const mfnRate = c.mfn_rate || c.tariff_rates?.mfn_rate || 0;
    const usmcaRate = c.usmca_rate || c.tariff_rates?.usmca_rate || 0;
    const savings = mfnRate - usmcaRate;
    const confidence = c.confidence || 'N/A';
    const isUSMCA = ['US', 'MX', 'CA'].includes(country) ? 'Yes' : 'No';

    let componentInfo = `• ${description}: ${percentage}% from ${country}`;
    if (hsCode !== 'Not classified') {
      componentInfo += `\n  HS Code: ${hsCode}`;
      if (mfnRate > 0 || usmcaRate > 0) {
        componentInfo += `\n  Tariff Rates: MFN ${mfnRate.toFixed(1)}% | USMCA ${usmcaRate.toFixed(1)}% | Savings: ${savings.toFixed(1)}%`;
      }
      if (confidence !== 'N/A') {
        componentInfo += `\n  AI Classification Confidence: ${confidence}%`;
      }
    }
    componentInfo += `\n  USMCA Member: ${isUSMCA}`;
    return componentInfo;
  }).join('\n\n') : '• No component data available'}

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
${Array.isArray(businessContext.risk_assessment.compliance_gaps) ? businessContext.risk_assessment.compliance_gaps.map(g => `- ${g}`).join('\n') : '- None identified'}

Known Vulnerability Factors:
${Array.isArray(businessContext.risk_assessment.vulnerability_factors) ? businessContext.risk_assessment.vulnerability_factors.map(v => `- ${v}`).join('\n') : '- None identified'}

Regulatory Requirements:
${Array.isArray(businessContext.risk_assessment.regulatory_requirements) ? businessContext.risk_assessment.regulatory_requirements.map(r => `- ${r}`).join('\n') : '- Standard regulatory compliance required'}

CRISIS SITUATION:
- Crisis Type: ${businessContext.crisis.type}
- Timeline: ${businessContext.crisis.timeline}
- Current Impact: ${businessContext.crisis.current_impact}
- Immediate Concerns: ${businessContext.crisis.immediate_concerns}

TASK:
Provide a comprehensive crisis response analysis that Cristina can review and validate. Include:

1. Crisis Severity Assessment (Critical/High/Medium/Low) based on the complete business context
2. Immediate Impact Analysis considering their trade volume, supply chain concentration, and financial exposure
3. Specific Risk Factors based on their known vulnerabilities and compliance gaps
4. Detailed Action Plan with three phases:
   - Immediate Actions (0-24 hours): Specific steps considering their product type and regulatory requirements
   - Short-term Actions (24-72 hours): Tactical responses based on their supply chain structure
   - Long-term Strategy: Preventive measures addressing their vulnerability factors

5. Financial Impact Mitigation: How to minimize costs given their current tariff exposure
6. Regulatory Compliance Steps: Specific to their regulatory requirements and industry
7. Supply Chain Diversification Recommendations: Based on current component origins and concentration risk

Format as JSON with these exact keys: crisis_severity, immediate_impact, risk_factors (array), action_plan (object with immediate_actions, short_term_actions, long_term_strategy arrays), financial_mitigation (array), regulatory_steps (array), supply_chain_recommendations (array).`;

    console.log('[CRISIS RESPONSE] Calling OpenRouter API with comprehensive business context...');

    // Call OpenRouter API with full business intelligence
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Triangle Trade Intelligence - Crisis Response Analysis'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
        messages: [{
          role: 'user',
          content: aiPrompt
        }],
        temperature: 0.7,
        max_tokens: 2500
      })
    });

    if (!openRouterResponse.ok) {
      throw new Error(`OpenRouter API error: ${openRouterResponse.status} ${openRouterResponse.statusText}`);
    }

    const openRouterData = await openRouterResponse.json();
    const aiResponseText = openRouterData.choices[0]?.message?.content || '';

    console.log('[CRISIS RESPONSE] OpenRouter API response received');

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
      console.log('[CRISIS RESPONSE] JSON parse failed, using structured fallback');
      // Fallback: structure the text response
      aiAnalysis = {
        crisis_severity: 'High',
        immediate_impact: aiResponseText.substring(0, 200),
        risk_factors: ['AI analysis provided - requires professional review'],
        action_plan: {
          immediate_actions: ['Review AI analysis below', 'Validate with business context'],
          short_term_actions: ['Implement validated recommendations'],
          long_term_strategy: ['Establish prevention protocols']
        },
        financial_mitigation: ['Minimize tariff exposure', 'Diversify supply chain'],
        regulatory_steps: ['Ensure compliance with regulations'],
        supply_chain_recommendations: ['Reduce concentration risk'],
        raw_ai_analysis: aiResponseText
      };
    }

    // Return AI analysis for Cristina's professional review in Stage 3
    res.status(200).json({
      success: true,
      ai_analysis: aiAnalysis,
      business_context: businessContext, // Include for Stage 3 reference
      requires_professional_validation: true,
      next_stage: {
        stage: 3,
        title: 'Professional Validation & Execution',
        description: 'Cristina reviews AI analysis and adds professional crisis management execution plan',
        expert: 'Trade Compliance Expert',
        credentials: 'Professional Certification #4601913, 17 years logistics & crisis management experience'
      },
      professional_value_add: {
        what_ai_provides: 'Comprehensive analysis based on business intelligence',
        what_cristina_adds: [
          'Professional validation with 17 years logistics expertise',
          'Direct regulatory agency relationships and contacts',
          'Hands-on crisis execution coordination',
          'Legal liability coverage for professional recommendations',
          'Real-time monitoring and adjustment as crisis evolves'
        ]
      }
    });

  } catch (error) {
    console.error('Crisis response analysis error:', error);
    res.status(500).json({
      error: 'Crisis response analysis failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}