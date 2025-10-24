/**
 * API: Crisis Response Analysis with OpenRouter AI + Professional Management
 * Used by Cristina's CrisisResponseTab - 3-stage workflow
 * Stage 2: AI analysis with FULL business intelligence context
 * Stage 3: Cristina's professional validation and execution
 *
 * 🔄 3-Tier Fallback Architecture:
 * TIER 1: OpenRouter → TIER 2: Anthropic → TIER 3: Graceful fail
 */

import { executeAIWithFallback, parseAIResponse } from '../../lib/ai-helpers.js';
import { logDevIssue, DevIssue } from '../../lib/utils/logDevIssue.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { original_request, crisis_assessment, professional_input } = req.body;

    // ✅ VALIDATION: Fail loudly if required data is missing (AI Fallback Architecture Rule 1)
    if (!original_request || !original_request.subscriber_data) {
      await DevIssue.missingData('crisis_response_api', 'original_request.subscriber_data', {
        endpoint: '/api/crisis-response-analysis',
        requestBody: req.body
      });
      return res.status(400).json({ error: 'Missing required field: original_request.subscriber_data' });
    }
    if (!original_request.subscriber_data.company_name) {
      await DevIssue.missingData('crisis_response_api', 'subscriber_data.company_name', {
        subscriberData: original_request.subscriber_data
      });
      return res.status(400).json({ error: 'Missing required field: company_name' });
    }
    if (!original_request.subscriber_data.product_description) {
      await DevIssue.missingData('crisis_response_api', 'subscriber_data.product_description', {
        company: original_request.subscriber_data.company_name
      });
      return res.status(400).json({ error: 'Missing required field: product_description' });
    }
    if (!crisis_assessment || !crisis_assessment.crisis_type) {
      await DevIssue.missingData('crisis_response_api', 'crisis_assessment.crisis_type', {
        company: original_request.subscriber_data.company_name,
        hasAssessment: !!crisis_assessment
      });
      return res.status(400).json({ error: 'Missing required field: crisis_assessment.crisis_type' });
    }

    // Extract comprehensive subscriber data and crisis details
    const subscriberData = original_request.subscriber_data;
    const serviceDetails = original_request.service_details || {};
    const crisisDetails = crisis_assessment;

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
    const aiPrompt = `Provide crisis response analysis for an SMB owner facing trade disruption.

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

Provide comprehensive crisis response analysis with educational explanations for an SMB owner juggling their business.

Return JSON:
{
  "crisis_severity": "Critical/High/Medium/Low based on complete business context",
  "immediate_impact": "Analysis considering trade volume, supply chain concentration, financial exposure",
  "risk_factors": ["Specific risks based on known vulnerabilities and compliance gaps"],
  "action_plan": {
    "immediate_actions": ["0-24 hours - specific steps for their product and regulatory requirements"],
    "short_term_actions": ["24-72 hours - tactical responses for their supply chain structure"],
    "long_term_strategy": ["Preventive measures addressing vulnerability factors"]
  },
  "financial_mitigation": ["How to minimize costs given tariff exposure"],
  "regulatory_steps": ["Specific to their regulatory requirements and industry"],
  "supply_chain_recommendations": ["Based on component origins and concentration risk"]
}`;

    console.log('[CRISIS RESPONSE] Calling AI with 3-tier fallback architecture...');

    // 🔄 Call AI with 3-tier fallback (OpenRouter → Anthropic → Graceful fail)
    // UPGRADED: Crisis decisions need expert Sonnet 4.5 analysis, not quick Haiku responses
    const aiResult = await executeAIWithFallback({
      prompt: aiPrompt,
      model: 'anthropic/claude-sonnet-4.5', // Both OpenRouter AND Anthropic fallback use Sonnet 4.5
      maxTokens: 3000 // Increased for detailed strategic crisis analysis
    });

    if (!aiResult.success) {
      console.error('All AI tiers failed:', aiResult.error);
      await logDevIssue({
        type: 'api_error',
        severity: 'critical',
        component: 'crisis_response_api',
        message: 'AI crisis analysis failed for all tiers',
        data: {
          error: aiResult.error,
          company: businessContext.company.name,
          crisisType: businessContext.crisis.type,
          componentCount: businessContext.product.component_origins?.length || 0
        }
      });
      throw new Error(aiResult.error);
    }

    console.log(`[CRISIS RESPONSE] Using ${aiResult.provider} (Tier ${aiResult.tier}) - ${aiResult.duration}ms`);

    // Parse AI response with robust error handling
    let aiAnalysis;
    try {
      aiAnalysis = parseAIResponse(aiResult.content);

      if (aiAnalysis.parseError) {
        await logDevIssue({
          type: 'api_error',
          severity: 'high',
          component: 'crisis_response_api',
          message: 'AI response parsing failed - using fallback',
          data: {
            company: businessContext.company.name,
            crisisType: businessContext.crisis.type,
            responsePreview: aiResult.content?.substring(0, 200)
          }
        });
        throw new Error('Failed to parse AI response');
      }
    } catch (parseError) {
      console.log('[CRISIS RESPONSE] JSON parse failed, using structured fallback');
      await logDevIssue({
        type: 'api_error',
        severity: 'medium',
        component: 'crisis_response_api',
        message: 'JSON parsing failed - using structured fallback',
        data: {
          company: businessContext.company.name,
          parseError: parseError.message
        }
      });
      // Fallback: structure the text response
      aiAnalysis = {
        crisis_severity: 'High',
        immediate_impact: 'AI analysis provided - requires Cristina\'s professional review',
        risk_factors: ['AI analysis provided - requires professional review'],
        action_plan: {
          immediate_actions: ['Review AI analysis below', 'Validate with business context'],
          short_term_actions: ['Implement validated recommendations'],
          long_term_strategy: ['Establish prevention protocols']
        },
        financial_mitigation: ['Minimize tariff exposure', 'Diversify supply chain'],
        regulatory_steps: ['Ensure compliance with regulations'],
        supply_chain_recommendations: ['Reduce concentration risk'],
        raw_ai_analysis: aiResult.content
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
    await DevIssue.apiError('crisis_response_api', '/api/crisis-response-analysis', error, {
      hasOriginalRequest: !!req.body.original_request,
      hasSubscriberData: !!req.body.original_request?.subscriber_data,
      hasCrisisAssessment: !!req.body.crisis_assessment,
      company: req.body.original_request?.subscriber_data?.company_name || 'unknown'
    });
    res.status(500).json({
      error: 'Crisis response analysis failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}