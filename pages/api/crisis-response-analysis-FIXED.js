/**
 * API: Crisis Response Analysis with Claude 3.5 Haiku + Professional Management
 * Cost-optimized AI analysis using standardized Anthropic client
 * Used by Cristina's CrisisResponseTab - 3-stage workflow
 * Stage 2: AI analysis with FULL business intelligence context
 * Stage 3: Cristina's professional validation and execution
 */

import { callAnthropicAPI, validateAnthropicConfig, createFallbackAnalysis, estimateCost } from '../../lib/anthropic-client.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate Anthropic configuration
    validateAnthropicConfig();
    
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
    const aiPrompt = `You are assisting Cristina Escalante, a Licensed Customs Broker (#4601913) with 17 years of logistics experience specializing in electronics/telecom industries and crisis management.

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
- Component Origins:
${Array.isArray(businessContext.product.component_origins) ? businessContext.product.component_origins.map(c => `  • ${c.country} (${c.percentage}%): ${c.description || c.component_type}`).join('\n') : '  • No component data available'}

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

    console.log('[CRISIS RESPONSE] Calling Claude 3.5 Haiku with comprehensive business context...');

    // Calculate estimated cost for transparency
    const costEstimate = estimateCost(aiPrompt);
    console.log(`[CRISIS RESPONSE] Estimated cost: $${costEstimate.totalCost}`);

    // Use standardized Anthropic client with Claude 3.5 Haiku
    const aiResult = await callAnthropicAPI(aiPrompt, {
      maxTokens: 2000,
      temperature: 0.7,
      parseJSON: true
    });

    let aiAnalysis;
    
    if (aiResult.success && aiResult.data) {
      // Successfully parsed JSON response
      aiAnalysis = aiResult.data;
      console.log('[CRISIS RESPONSE] ✅ JSON analysis parsed successfully');
    } else if (aiResult.success && aiResult.rawText) {
      // Fallback to structured analysis from raw text
      console.log('[CRISIS RESPONSE] Using fallback analysis structure');
      aiAnalysis = createFallbackAnalysis(aiResult.rawText, 'crisis');
    } else {
      throw new Error('Failed to get valid response from Anthropic API');
    }

    // Validate that we have meaningful analysis
    if (!aiAnalysis || typeof aiAnalysis !== 'object') {
      throw new Error('Failed to generate valid crisis analysis');
    }

    console.log('[CRISIS RESPONSE] ✅ Crisis analysis completed successfully');

    // Return AI analysis for Cristina's professional review in Stage 3
    res.status(200).json({
      success: true,
      ai_analysis: aiAnalysis,
      business_context: businessContext, // Include for Stage 3 reference
      requires_professional_validation: true,
      ai_provider: 'Anthropic Claude 3.5 Haiku', // Cost-optimized model
      response_quality: aiResult.rawText?.length > 500 ? 'High' : 'Medium',
      cost_estimate: costEstimate,
      usage: aiResult.usage,
      next_stage: {
        stage: 3,
        title: 'Professional Validation & Execution',
        description: 'Cristina reviews AI analysis and adds professional crisis management execution plan',
        expert: 'Cristina Escalante',
        credentials: 'Licensed Customs Broker #4601913, 17 years logistics & crisis management'
      },
      professional_value_add: {
        what_ai_provides: 'Comprehensive analysis based on business intelligence',
        what_cristina_adds: [
          'Professional validation with customs broker license backing',
          'Direct regulatory agency relationships and contacts',
          'Hands-on crisis execution coordination',
          'Legal liability coverage for professional recommendations',
          'Real-time monitoring and adjustment as crisis evolves'
        ]
      }
    });

  } catch (error) {
    console.error('Crisis response analysis error:', error);
    
    // Provide detailed error info for debugging
    res.status(500).json({
      error: 'Crisis response analysis failed',
      message: error.message,
      ai_provider: 'Anthropic Claude 3.5 Haiku',
      debug_info: {
        anthropic_key_available: !!process.env.ANTHROPIC_API_KEY,
        error_type: error.name,
        is_config_error: error.message.includes('ANTHROPIC_API_KEY'),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
}
