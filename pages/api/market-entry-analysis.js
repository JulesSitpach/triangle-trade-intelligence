/**
 * API: Mexico Market Entry Analysis with OpenRouter AI + Jorge's Professional Execution
 * Used by Jorge's MarketEntryTab - 3-stage workflow
 * Stage 2: AI analysis with FULL business intelligence context
 * Stage 3: Jorge's B2B relationship building and Mexico market execution
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
    const { original_request, market_strategy } = req.body;

    // ✅ VALIDATION: Fail loudly if required data is missing (AI Fallback Architecture Rule 1)
    if (!original_request || !original_request.subscriber_data) {
      await DevIssue.missingData('market_entry_api', 'original_request.subscriber_data', {
        endpoint: '/api/market-entry-analysis'
      });
      return res.status(400).json({ error: 'Missing required field: original_request.subscriber_data' });
    }
    if (!original_request.subscriber_data.company_name) {
      await DevIssue.missingData('market_entry_api', 'subscriber_data.company_name', {
        subscriberData: original_request.subscriber_data
      });
      return res.status(400).json({ error: 'Missing required field: company_name' });
    }
    if (!original_request.subscriber_data.product_description) {
      await DevIssue.missingData('market_entry_api', 'subscriber_data.product_description', {
        company: original_request.subscriber_data.company_name
      });
      return res.status(400).json({ error: 'Missing required field: product_description' });
    }

    // Extract comprehensive subscriber data and market strategy context
    const subscriberData = original_request.subscriber_data;
    const serviceDetails = original_request.service_details || {};
    const marketContext = market_strategy || {};

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
      market_entry_goals: {
        entry_approach: marketContext.entry_approach || serviceDetails?.entry_approach,
        target_revenue: marketContext.target_revenue || serviceDetails?.target_revenue,
        timeline: marketContext.timeline || serviceDetails?.entry_timeline,
        investment_budget: marketContext.investment_budget || serviceDetails?.investment_budget,
        market_priorities: marketContext.market_priorities || [],
        competitive_landscape: serviceDetails?.competitive_landscape
      }
    };

    // Construct comprehensive AI prompt with full business intelligence
    const aiPrompt = `Provide Mexico market entry analysis for B2B partnership development.

Company Profile:
- Company: ${businessContext.company.name}
- Business Type: ${businessContext.company.business_type}
- Industry: ${businessContext.company.industry}
- Contact: ${businessContext.company.contact} (${businessContext.company.email}, ${businessContext.company.phone})

Product & Supply Chain:
- Product: ${businessContext.product.description}
- Category: ${businessContext.product.category}
- Current Manufacturing: ${businessContext.product.manufacturing_location}
- Current Component Origins (with Tariff Intelligence):
${Array.isArray(businessContext.product.component_origins) && businessContext.product.component_origins.length > 0 ? businessContext.product.component_origins.map((c, idx) => {
    const country = c.origin_country || c.country || 'Unknown';
    const percentage = c.value_percentage || c.percentage || 0;
    const description = c.description || c.component_type || `Component ${idx + 1}`;
    const hsCode = c.hs_code || c.classified_hs_code || 'Not classified';
    const mfnRate = c.mfn_rate || c.tariff_rates?.mfn_rate || 0;
    const usmcaRate = c.usmca_rate || c.tariff_rates?.usmca_rate || 0;
    const savings = mfnRate - usmcaRate;
    const confidence = c.confidence || 'N/A';
    const isUSMCA = c.is_usmca_member ? 'Yes' : 'No';

    let componentInfo = `  • ${description}: ${percentage}% from ${country}`;
    if (hsCode !== 'Not classified') {
      componentInfo += `\n    HS Code: ${hsCode}`;
      if (mfnRate > 0 || usmcaRate > 0) {
        componentInfo += `\n    Tariff Rates: MFN ${mfnRate.toFixed(1)}% | USMCA ${usmcaRate.toFixed(1)}% | Savings: ${savings.toFixed(1)}%`;
      }
      if (confidence !== 'N/A') {
        componentInfo += `\n    AI Classification Confidence: ${confidence}%`;
      }
    }
    componentInfo += `\n    USMCA Member: ${isUSMCA}`;
    return componentInfo;
  }).join('\n\n') : '  • No component data available'}

Trade Profile:
- Annual Trade Volume: $${Number(businessContext.trade.annual_volume || 0).toLocaleString()}
- Primary Supplier: ${businessContext.trade.supplier_country}
- Current Target Markets: ${businessContext.trade.target_markets.join(', ')}
- Import Frequency: ${businessContext.trade.import_frequency}
- USMCA Status: ${businessContext.trade.current_usmca_status}

Financial Impact:
- Annual Tariff Cost: $${Number(businessContext.financial_impact.annual_tariff_cost || 0).toLocaleString()}
- Potential USMCA Savings: $${Number(businessContext.financial_impact.potential_usmca_savings || 0).toLocaleString()}/year

Known Compliance Gaps:
${Array.isArray(businessContext.risk_assessment.compliance_gaps) ? businessContext.risk_assessment.compliance_gaps.map(g => `- ${g}`).join('\n') : '- None identified'}

Known Vulnerability Factors:
${Array.isArray(businessContext.risk_assessment.vulnerability_factors) ? businessContext.risk_assessment.vulnerability_factors.map(v => `- ${v}`).join('\n') : '- None identified'}

MARKET ENTRY GOALS:
- Entry Approach: ${businessContext.market_entry_goals.entry_approach || 'Distribution partnership'}
- Target Revenue: ${businessContext.market_entry_goals.target_revenue || '$1M+ in Year 1'}
- Timeline: ${businessContext.market_entry_goals.timeline || '12 months'}
- Investment Budget: ${businessContext.market_entry_goals.investment_budget || 'Moderate'}
- Market Priorities: ${businessContext.market_entry_goals.market_priorities.join(', ') || 'Mexico market expansion'}
- Competitive Landscape: ${businessContext.market_entry_goals.competitive_landscape || 'To be assessed'}

Provide comprehensive Mexico market entry analysis for B2B partnership development with educational explanations.

Return JSON:
{
  "market_opportunity": {
    "market_size": "Size and growth potential for ${businessContext.product.category}",
    "growth_rate": "Projected growth percentage",
    "target_segments": ["Customer segments and buying patterns"],
    "distribution_channels": ["Analysis of direct, distributors, retailers, e-commerce"],
    "regulatory_overview": "Mexico-specific requirements for ${businessContext.trade.current_usmca_status} USMCA status"
  },
  "competitive_analysis": {
    "key_competitors": ["Current Mexico market competitors"],
    "market_positioning": "Differentiation opportunities",
    "pricing_dynamics": "Expected margins and pricing strategies",
    "barriers_to_entry": ["Entry barriers and competitive advantages"],
    "usmca_advantages": "Benefits vs non-USMCA competitors"
  },
  "entry_strategy": {
    "recommended_approach": "Partnership/direct/hybrid recommendation",
    "distribution_strategy": "Geographic priorities and channel mix",
    "partnership_vs_direct": "Analysis with tradeoffs",
    "investment_requirements": "Breakdown of needed investment",
    "revenue_trajectory": "Expected timeline and revenue growth"
  },
  "partnership_strategy": {
    "partner_types": ["Distributors, retailers, strategic alliances needed"],
    "ideal_profiles": "Partner selection criteria",
    "value_proposition": "Why Mexico partners should work with them",
    "negotiation_considerations": "Deal structures and cultural practices",
    "cultural_practices": "Mexico business protocol guidance"
  },
  "implementation_phases": {
    "phase1": ["0-3 months: Market research, partner identification, outreach"],
    "phase2": ["3-6 months: Negotiations, pilot programs, testing"],
    "phase3": ["6-12 months: Expansion, distribution growth, revenue scaling"],
    "critical_milestones": ["Success metrics for each phase"]
  },
  "risk_mitigation": [
    {"risk_category": "Market/Partnership/Supply Chain", "specific_risks": [], "mitigation_strategies": []}
  ],
  "financial_projections": {
    "investment_breakdown": "Marketing, partnerships, logistics, compliance costs",
    "revenue_projections": "Year 1, 2, 3 projections",
    "profitability_timeline": "Breakeven analysis",
    "roi_analysis": "Include $${Number(businessContext.financial_impact.potential_usmca_savings || 0).toLocaleString()} USMCA savings benefit"
  },
  "jorge_execution_approach": {
    "partner_outreach": ["Identification and outreach strategy"],
    "relationship_building": ["Spanish-language communication approach"],
    "cultural_navigation": ["Business protocol guidance"],
    "negotiation_strategy": ["Talking points and approach"],
    "ongoing_management": ["Partnership support and management"]
  }
}`;

    console.log('[MARKET ENTRY] Calling AI with 3-tier fallback architecture...');

    // 🔄 Call AI with 3-tier fallback (OpenRouter → Anthropic → Graceful fail)
    // UPGRADED: Mexico market entry decisions worth $50K-500K+ need expert Sonnet 4.5, not quick Haiku
    const aiResult = await executeAIWithFallback({
      prompt: aiPrompt,
      model: 'anthropic/claude-sonnet-4.5', // Upgraded from Haiku - market entry is critical business decision
      maxTokens: 4000
    });

    if (!aiResult.success) {
      console.error('All AI tiers failed:', aiResult.error);
      await logDevIssue({
        type: 'api_error',
        severity: 'critical',
        component: 'market_entry_api',
        message: 'AI market entry analysis failed for all tiers',
        data: {
          error: aiResult.error,
          company: businessContext.company.name,
          entryApproach: businessContext.market_entry_goals.entry_approach
        }
      });
      throw new Error(aiResult.error);
    }

    console.log(`[MARKET ENTRY] Using ${aiResult.provider} (Tier ${aiResult.tier}) - ${aiResult.duration}ms`);

    // Parse AI response with robust error handling
    let aiAnalysis;
    try {
      aiAnalysis = parseAIResponse(aiResult.content);

      if (aiAnalysis.parseError) {
        await logDevIssue({
          type: 'api_error',
          severity: 'high',
          component: 'market_entry_api',
          message: 'AI response parsing failed',
          data: {
            company: businessContext.company.name,
            responsePreview: aiResult.content?.substring(0, 200)
          }
        });
        throw new Error('Failed to parse AI response');
      }
    } catch (parseError) {
      console.log('[MARKET ENTRY] JSON parse failed, using structured fallback');
      await logDevIssue({
        type: 'api_error',
        severity: 'medium',
        component: 'market_entry_api',
        message: 'JSON parsing failed - using structured fallback',
        data: {
          company: businessContext.company.name,
          parseError: parseError.message
        }
      });
      // Fallback: structure the text response
      aiAnalysis = {
        market_opportunity: {
          market_size: 'Analysis pending - Jorge will provide professional market research',
          growth_rate: 'Analysis pending',
          target_segments: [],
          distribution_channels: [],
          regulatory_overview: 'Analysis pending'
        },
        competitive_analysis: {},
        entry_strategy: {
          recommended_approach: marketContext.entry_approach || 'Partnership-based',
          investment_requirements: 'Analysis pending',
          revenue_trajectory: 'Analysis pending'
        },
        partnership_strategy: {},
        implementation_phases: {},
        risk_mitigation: [],
        financial_projections: {
          revenue_projections: 'Analysis pending',
          roi_analysis: businessContext.financial_impact.potential_usmca_savings || 0
        },
        jorge_execution_approach: {},
        raw_ai_analysis: aiResult.content
      };
    }

    // Return AI analysis for Jorge's professional B2B execution
    res.status(200).json({
      success: true,
      ai_analysis: aiAnalysis,
      business_context: businessContext, // Include for Stage 3 reference
      requires_professional_execution: true,
      next_stage: {
        stage: 3,
        title: 'Professional Market Entry Execution & Partnership Building',
        description: 'Jorge leverages Mexico business networks to identify partners, build relationships, negotiate agreements, and manage market entry execution',
        expert: 'Business Development Specialist',
        credentials: 'B2B Sales Expert, 4+ years at CCVIAL, Mexico Market Specialist, Bilingual Spanish/English'
      },
      professional_value_add: {
        what_ai_provides: 'Comprehensive market analysis and entry strategy based on complete business intelligence',
        what_jorge_adds: [
          'Direct access to Mexico distribution networks and business contacts',
          'Spanish-language partner outreach and relationship building',
          'Cultural navigation and Mexico business protocol expertise',
          'B2B contract negotiation using proven consultative methodology',
          'On-the-ground market intelligence and competitive monitoring',
          'Partnership management and issue resolution with local presence',
          'Ongoing market development and revenue growth support'
        ]
      },
      service_deliverables: [
        'Comprehensive Mexico market entry strategy and analysis',
        'Qualified distribution partner introductions and relationship building',
        'Partnership negotiation support and contract guidance',
        'Cultural and business practice navigation for Mexico market',
        'Implementation roadmap with milestones and success metrics',
        'Competitive intelligence and market monitoring',
        'Ongoing partnership management and market development for 12 months'
      ],
      competitive_advantages: {
        local_presence: 'Mexico-based expert with on-the-ground market knowledge',
        proven_relationships: 'Established partner networks vs cold market entry',
        cultural_expertise: 'Native Spanish speaker with cultural understanding',
        b2b_execution: 'Direct sales and partnership execution vs strategy-only consulting',
        usmca_optimization: `$${Number(businessContext.financial_impact.potential_usmca_savings || 0).toLocaleString()}/year savings leverage for competitive positioning`
      }
    });

  } catch (error) {
    console.error('Market entry analysis error:', error);
    await DevIssue.apiError('market_entry_api', '/api/market-entry-analysis', error, {
      hasOriginalRequest: !!req.body.original_request,
      hasSubscriberData: !!req.body.original_request?.subscriber_data,
      company: req.body.original_request?.subscriber_data?.company_name || 'unknown'
    });
    res.status(500).json({
      error: 'Market entry analysis failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}