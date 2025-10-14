/**
 * API: Mexico Market Entry Analysis with OpenRouter AI + Jorge's Professional Execution
 * Used by Jorge's MarketEntryTab - 3-stage workflow
 * Stage 2: AI analysis with FULL business intelligence context
 * Stage 3: Jorge's B2B relationship building and Mexico market execution
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { original_request, market_strategy } = req.body;

    // Extract comprehensive subscriber data and market strategy context
    const subscriberData = original_request?.subscriber_data || {};
    const serviceDetails = original_request?.service_details || {};
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
    const aiPrompt = `You are assisting Jorge Ochoa, a B2B sales expert with 4+ years at CCVIAL, proven track record in industrial/manufacturing sectors, bilingual (Spanish/English), specializing in Mexico market entry and partnership development.

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

TASK:
Provide comprehensive Mexico market entry analysis that Jorge can use for B2B partnership development and execution. Include:

1. Mexico Market Opportunity Analysis:
   - Market size and growth potential for ${businessContext.product.category}
   - Target customer segments and buying patterns
   - Distribution channel analysis (direct, distributors, retailers, e-commerce)
   - Regulatory and compliance requirements specific to Mexico
   - Import/export considerations given their ${businessContext.trade.current_usmca_status} USMCA status

2. Competitive Landscape Assessment:
   - Key competitors currently in Mexico market for similar products
   - Market positioning opportunities and differentiation strategies
   - Pricing dynamics and expected margins
   - Barriers to entry and competitive advantages
   - USMCA advantages vs non-USMCA competitors

3. Entry Strategy Recommendations:
   - Recommended market entry approach (partnership, direct, hybrid)
   - Distribution strategy (geographic priorities, channel mix)
   - Partnership vs direct sales analysis
   - Investment requirements breakdown
   - Expected revenue trajectory and timeline

4. Partnership Development Strategy:
   - Types of partnerships needed (distributors, retailers, strategic alliances)
   - Ideal partner profiles and selection criteria
   - Value proposition for potential Mexico partners
   - Negotiation considerations and deal structures
   - Cultural business practices for Mexico partnerships

5. Implementation Roadmap:
   - Phase 1 (0-3 months): Market research, partner identification, initial outreach
   - Phase 2 (3-6 months): Partnership negotiations, pilot programs, market testing
   - Phase 3 (6-12 months): Market expansion, distribution growth, revenue scaling
   - Critical milestones and success metrics for each phase

6. Risk Assessment & Mitigation:
   - Market entry risks (regulatory, competitive, financial, operational)
   - Partnership risks (alignment, performance, termination)
   - Supply chain risks (logistics, customs, USMCA compliance)
   - Mitigation strategies for each risk category

7. Financial Projections:
   - Investment requirements (marketing, partnerships, logistics, compliance)
   - Revenue projections (Year 1, Year 2, Year 3)
   - Profitability timeline and breakeven analysis
   - ROI calculation considering $${Number(businessContext.financial_impact.potential_usmca_savings || 0).toLocaleString()} USMCA savings benefit

8. Jorge's B2B Execution Plan:
   - Partner identification and outreach strategy
   - Spanish-language communication and relationship building approach
   - Cultural navigation and business protocol guidance
   - Negotiation strategy and talking points
   - Ongoing partnership management and support

Format as JSON with these exact keys: market_opportunity (object with market_size, growth_rate, target_segments, distribution_channels, regulatory_overview), competitive_analysis (object with key_competitors, market_positioning, pricing_dynamics, barriers_to_entry, usmca_advantages), entry_strategy (object with recommended_approach, distribution_strategy, partnership_vs_direct, investment_requirements, revenue_trajectory), partnership_strategy (object with partner_types, ideal_profiles, value_proposition, negotiation_considerations, cultural_practices), implementation_phases (object with phase1, phase2, phase3, critical_milestones arrays), risk_mitigation (array with risk_category, specific_risks, mitigation_strategies), financial_projections (object with investment_breakdown, revenue_projections, profitability_timeline, roi_analysis), jorge_execution_approach (object with partner_outreach, relationship_building, cultural_navigation, negotiation_strategy, ongoing_management arrays).`;

    console.log('[MARKET ENTRY] Calling OpenRouter API with comprehensive business context...');

    // Call OpenRouter API with full business intelligence
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Triangle Trade Intelligence - Market Entry Analysis'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
        messages: [{
          role: 'user',
          content: aiPrompt
        }],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!openRouterResponse.ok) {
      throw new Error(`OpenRouter API error: ${openRouterResponse.status} ${openRouterResponse.statusText}`);
    }

    const openRouterData = await openRouterResponse.json();
    const aiResponseText = openRouterData.choices[0]?.message?.content || '';

    console.log('[MARKET ENTRY] OpenRouter API response received');

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
      console.log('[MARKET ENTRY] JSON parse failed, using structured fallback');
      // Fallback: structure the text response
      aiAnalysis = {
        market_opportunity: {
          market_size: 'Analysis pending',
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
        raw_ai_analysis: aiResponseText
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
        expert: 'Jorge Ochoa',
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
    res.status(500).json({
      error: 'Market entry analysis failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}