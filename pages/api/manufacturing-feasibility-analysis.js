/**
 * API: Manufacturing Feasibility Analysis with OpenRouter AI + Jorge's Professional Validation
 * Used by Jorge's ManufacturingFeasibilityTab - 3-stage workflow
 * Stage 2: AI analysis with FULL business intelligence context
 * Stage 3: Jorge's B2B expertise and Mexico relationship building
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { original_request, manufacturing_context, professional_input } = req.body;

    // Extract comprehensive subscriber data and manufacturing context
    const subscriberData = original_request?.subscriber_data || {};
    const serviceDetails = original_request?.service_details || {};
    const mfgContext = manufacturing_context || {};

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
      manufacturing_requirements: {
        why_mexico: mfgContext.why_mexico || serviceDetails?.why_mexico,
        current_challenges: mfgContext.challenges || serviceDetails?.current_challenges,
        timeline: mfgContext.timeline || serviceDetails?.timeline_requirement,
        required_certifications: mfgContext.certifications || serviceDetails?.quality_certifications || [],
        budget_range: mfgContext.budget || serviceDetails?.budget_range,
        production_volume: mfgContext.production_volume || serviceDetails?.production_volume
      }
    };

    // Construct comprehensive AI prompt with full business intelligence
    const aiPrompt = `You are assisting Jorge Ochoa, a B2B sales expert with 4+ years at CCVIAL, proven track record in industrial/manufacturing sectors, bilingual (Spanish/English), specializing in Mexico manufacturing partnerships.

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
- Current Component Origins:
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

MANUFACTURING REQUIREMENTS:
- Why Mexico: ${businessContext.manufacturing_requirements.why_mexico || 'USMCA benefits, cost reduction, supply chain optimization'}
- Current Challenges: ${businessContext.manufacturing_requirements.current_challenges || 'High manufacturing costs, long lead times'}
- Timeline: ${businessContext.manufacturing_requirements.timeline || 'Standard implementation'}
- Required Certifications: ${businessContext.manufacturing_requirements.required_certifications.join(', ') || 'ISO 9001'}
- Budget Range: ${businessContext.manufacturing_requirements.budget_range || 'To be determined'}
- Production Volume: ${businessContext.manufacturing_requirements.production_volume || 'Based on trade volume'}

TASK:
Provide comprehensive manufacturing feasibility analysis that Jorge can review and validate using his Mexico manufacturing expertise. Include:

1. Location Analysis (2-3 specific Mexico regions):
   - Recommended cities/regions based on product type and industry specialization
   - Labor availability and skill levels for ${businessContext.product.category}
   - Proximity to current supply chain and target markets
   - Infrastructure readiness (ports, airports, highways, utilities)
   - Industrial park availability and incentives

2. Financial Feasibility:
   - Setup cost estimates (facility, equipment, tooling)
   - Annual operational costs (labor, utilities, overhead)
   - Cost comparison vs current ${businessContext.product.manufacturing_location} manufacturing
   - ROI calculation based on $${Number(businessContext.financial_impact.annual_tariff_cost || 0).toLocaleString()} current tariff cost
   - USMCA savings realization ($${Number(businessContext.financial_impact.potential_usmca_savings || 0).toLocaleString()}/year potential)
   - Payback period estimate

3. Timeline Feasibility:
   - Phase 1: Site selection and partner identification (months)
   - Phase 2: Facility setup and equipment installation (months)
   - Phase 3: Production ramp-up and certification (months)
   - Total implementation timeline
   - Critical path items and dependencies

4. Risk Assessment & Mitigation:
   - Technical risks (equipment, process transfer, quality control)
   - Supply chain risks (component sourcing, logistics)
   - Regulatory risks (permits, certifications, compliance)
   - Financial risks (currency, cost overruns, market changes)
   - Mitigation strategies for each risk category

5. USMCA Qualification Strategy:
   - Regional value content calculation and optimization
   - Manufacturing process requirements for USMCA eligibility
   - Certificate of origin preparation readiness
   - Tariff classification implications

6. Implementation Roadmap:
   - Immediate actions (0-30 days): Due diligence, site visits, partner shortlisting
   - Short-term (30-90 days): Contract negotiation, facility preparation
   - Medium-term (90-180 days): Equipment installation, hiring, training
   - Long-term (180+ days): Production ramp-up, certification, ongoing optimization

7. Jorge's B2B Action Plan:
   - Manufacturing partner identification approach
   - Site visit coordination strategy
   - Negotiation leverage points based on volume commitment
   - Relationship building with Mexico industrial development agencies
   - Implementation support and ongoing partnership management

Format as JSON with these exact keys: feasibility_score (1-10), recommended_locations (array with city, region, advantages, labor_profile, infrastructure, cost_profile, timeline), financial_analysis (object with setup_costs, annual_operational_costs, cost_comparison, roi_calculation, payback_period), implementation_timeline (object with phase1, phase2, phase3, total_months, critical_path arrays), risk_assessment (array with risk_category, specific_risks, mitigation_strategies), usmca_strategy (object with regional_value_content, qualification_timeline, certification_requirements), jorge_implementation_approach (object with partner_identification, site_visits, negotiation_strategy, relationship_building arrays).`;

    console.log('[MANUFACTURING FEASIBILITY] Calling OpenRouter API with comprehensive business context...');

    // Call OpenRouter API with full business intelligence
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Triangle Intelligence - Manufacturing Feasibility Analysis'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{
          role: 'user',
          content: aiPrompt
        }],
        temperature: 0.7,
        max_tokens: 3500
      })
    });

    if (!openRouterResponse.ok) {
      throw new Error(`OpenRouter API error: ${openRouterResponse.status} ${openRouterResponse.statusText}`);
    }

    const openRouterData = await openRouterResponse.json();
    const aiResponseText = openRouterData.choices[0]?.message?.content || '';

    console.log('[MANUFACTURING FEASIBILITY] OpenRouter API response received');

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
      console.log('[MANUFACTURING FEASIBILITY] JSON parse failed, using structured fallback');
      // Fallback: structure the text response
      aiAnalysis = {
        feasibility_score: 7,
        recommended_locations: [],
        financial_analysis: {
          setup_costs: 'Analysis pending',
          annual_operational_costs: 'Analysis pending',
          cost_comparison: 'Analysis pending',
          roi_calculation: businessContext.financial_impact.potential_usmca_savings || 0,
          payback_period: 'To be calculated'
        },
        implementation_timeline: {
          phase1: [],
          phase2: [],
          phase3: [],
          total_months: 12,
          critical_path: []
        },
        risk_assessment: [],
        usmca_strategy: {},
        jorge_implementation_approach: {},
        raw_ai_analysis: aiResponseText
      };
    }

    // Return AI analysis for Jorge's professional B2B validation and execution
    res.status(200).json({
      success: true,
      ai_analysis: aiAnalysis,
      business_context: businessContext, // Include for Stage 3 reference
      requires_professional_execution: true,
      next_stage: {
        stage: 3,
        title: 'Professional Manufacturing Partnership Execution',
        description: 'Jorge validates recommendations, coordinates site visits, negotiates with manufacturing partners, and manages implementation',
        expert: 'Jorge Ochoa',
        credentials: 'B2B Sales Expert, 4+ years at CCVIAL, Industrial Sector Specialist, Mexico Manufacturing Networks'
      },
      professional_value_add: {
        what_ai_provides: 'Comprehensive feasibility analysis based on complete business intelligence',
        what_jorge_adds: [
          'Direct manufacturing partner introductions using Mexico industrial networks',
          'On-site facility visits and capability validation',
          'B2B contract negotiation using proven methodology',
          'Cultural and business practice guidance for Mexico operations',
          'Implementation project management and coordination',
          'Ongoing relationship management with manufacturing partners',
          'Problem resolution with Spanish-language communication advantage'
        ]
      },
      service_deliverables: [
        'Comprehensive manufacturing feasibility report',
        'Recommended Mexico locations with cost analysis',
        'Manufacturing partner shortlist with direct introductions',
        'Site visit coordination and facility evaluation',
        'Implementation timeline and project roadmap',
        'USMCA qualification strategy',
        'Ongoing partnership management for 12 months'
      ]
    });

  } catch (error) {
    console.error('Manufacturing feasibility analysis error:', error);
    res.status(500).json({
      error: 'Manufacturing feasibility analysis failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}