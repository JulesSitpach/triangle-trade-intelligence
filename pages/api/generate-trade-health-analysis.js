/**
 * AI-Enhanced Trade Health Analysis API
 *
 * Generates comprehensive trade health assessment using OpenRouter API with Claude
 * Used in Trade Health Check Stage 2 for AI-powered analysis
 *
 * Returns:
 * - Health scores (overall + 4 categories)
 * - Detailed assessments for each category
 * - Prioritized service recommendations with ROI
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { serviceRequestId, clientData } = req.body;

    if (!clientData) {
      return res.status(400).json({ error: 'Client data is required' });
    }

    // Validate OpenRouter API key
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('Missing OPENROUTER_API_KEY');
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    console.log('Running AI Trade Health Analysis for:', clientData.company);

    // Build comprehensive prompt with all business context
    const analysisPrompt = buildAnalysisPrompt(clientData);

    // Call OpenRouter API with Claude model
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://triangle-trade-intelligence.vercel.app',
        'X-Title': 'Triangle Trade Intelligence - Health Check'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API failed: ${openRouterResponse.status}`);
    }

    const aiResult = await openRouterResponse.json();
    const aiContent = aiResult.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No content returned from AI');
    }

    // Parse AI response into structured format
    const analysis = parseAIAnalysis(aiContent, clientData);

    console.log('AI Trade Health Analysis completed:', {
      company: clientData.company,
      overall_score: analysis.overall_score,
      recommendations: analysis.service_recommendations?.length
    });

    return res.status(200).json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error generating trade health analysis:', error);
    return res.status(500).json({
      error: 'Failed to generate trade health analysis',
      details: error.message
    });
  }
}

/**
 * Build comprehensive analysis prompt with all business context
 */
function buildAnalysisPrompt(clientData) {
  const {
    company,
    product,
    trade_volume,
    manufacturing_location,
    usmca_status,
    component_origins,
    annual_tariff_cost,
    potential_savings
  } = clientData;

  // Build component breakdown for analysis
  const componentBreakdown = component_origins?.map(comp =>
    `  - ${comp.value_percentage || comp.percentage}% from ${comp.origin_country || comp.country} (${comp.description || comp.component_type})`
  ).join('\n') || '  - No component data provided';

  return `You are a USMCA compliance and Mexico trade expert conducting a comprehensive Trade Health Check assessment.

COMPANY PROFILE:
- Company: ${company}
- Product: ${product}
- Annual Trade Volume: $${Number(trade_volume || 0).toLocaleString()}
- Manufacturing Location: ${manufacturing_location}
- Current USMCA Status: ${usmca_status}

SUPPLY CHAIN BREAKDOWN:
${componentBreakdown}

FINANCIAL CONTEXT:
${annual_tariff_cost ? `- Current Annual Tariff Cost: $${Number(annual_tariff_cost).toLocaleString()}` : '- Annual tariff cost not specified'}
${potential_savings ? `- Potential USMCA Savings: $${Number(potential_savings).toLocaleString()}/year` : ''}

YOUR TASK:
Generate a comprehensive Trade Health Check assessment with specific scores and recommendations.

Return your analysis in the following EXACT JSON format (no other text):

{
  "overall_score": 67,
  "usmca_score": 45,
  "supply_chain_score": 72,
  "market_expansion_score": 58,
  "risk_resilience_score": 63,
  "usmca_assessment": "USMCA NON-QUALIFIED: Current ${usmca_status} status indicates [specific gap analysis]. Regional content is estimated at X% vs required Y% for ${product} products. Main gap: [specific sourcing issue]. Path to qualification: [concrete steps].",
  "supply_chain_assessment": "Supply chain shows [strengths and weaknesses]. Single-source dependencies: [identify risks]. Geographic concentration: [analysis]. Lead time vulnerabilities: [assess]. Optimization opportunities: [specific recommendations].",
  "market_expansion_assessment": "Company demonstrates [readiness factors] for Mexico market entry. Trade volume of $${Number(trade_volume || 0).toLocaleString()} indicates [scale assessment]. Current manufacturing in ${manufacturing_location} creates [opportunities/challenges]. Mexico expansion readiness: [concrete assessment].",
  "risk_assessment": "Risk factors: [identify specific vulnerabilities]. Supplier concentration: [analyze dependency]. Geopolitical exposure: [assess trade policy risks]. Regulatory compliance: [identify gaps]. Mitigation priorities: [rank by severity].",
  "service_recommendations": [
    {
      "priority": 1,
      "service": "USMCA Optimization",
      "price": 175,
      "expected_outcome": "$${potential_savings ? Number(potential_savings).toLocaleString() : 'XX,XXX'} annual savings potential",
      "rationale": "Client is currently non-qualified for USMCA benefits. Quick path to qualification by [specific action]. Math works: moving X% sourcing to Mexico suppliers achieves required regional content threshold."
    },
    {
      "priority": 2,
      "service": "Supplier Sourcing",
      "price": 450,
      "expected_outcome": "Reduce single-supplier risk, establish backup sources",
      "rationale": "[Identify specific supplier concentration risk]. Need vetted Mexico alternatives to [specific action]. ROI: Avoids [$XXX,XXX] production disruption if current supplier fails."
    },
    {
      "priority": 3,
      "service": "Supply Chain Resilience",
      "price": 450,
      "expected_outcome": "Build backup supplier network, reduce geographic risk",
      "rationale": "[Analyze multi-supplier strategy benefits]. Current X% concentration in [country] creates vulnerability. Recommend diversification to [specific regions]."
    }
  ]
}

SCORING GUIDELINES:
- Overall Score: Average of 4 category scores (0-100)
- USMCA Score: Based on qualification status and gap size (qualified=80-100, partial=40-70, non-qualified=0-40)
- Supply Chain Score: Based on diversification, efficiency, cost optimization (single source=low, diversified=high)
- Market Expansion Score: Based on readiness for Mexico entry (volume, product fit, current operations)
- Risk & Resilience Score: Based on vulnerabilities and mitigation status (high concentration=low, diversified=high)

SERVICE RECOMMENDATIONS:
- Prioritize by ROI and urgency (not just upselling)
- Only recommend services that genuinely solve client's problems
- Include specific expected outcomes with dollar amounts when possible
- Rationale must explain WHY this service matters for THIS client
- Services: USMCA Optimization ($175), Supplier Sourcing ($450), Manufacturing Feasibility ($650), Market Entry ($550), Supply Chain Resilience ($450), Supply Chain Optimization ($275)

Be specific, analytical, and focused on actionable insights. Avoid generic advice.`;
}

/**
 * Parse AI response into structured analysis object
 */
function parseAIAnalysis(aiContent, clientData) {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(aiContent);

    // Validate required fields
    if (!parsed.overall_score || !parsed.usmca_assessment) {
      throw new Error('Missing required fields in AI response');
    }

    return {
      overall_score: parsed.overall_score,
      usmca_score: parsed.usmca_score,
      supply_chain_score: parsed.supply_chain_score,
      market_expansion_score: parsed.market_expansion_score,
      risk_resilience_score: parsed.risk_resilience_score,
      usmca_assessment: parsed.usmca_assessment,
      supply_chain_assessment: parsed.supply_chain_assessment,
      market_expansion_assessment: parsed.market_expansion_assessment,
      risk_assessment: parsed.risk_assessment,
      service_recommendations: parsed.service_recommendations || []
    };

  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', parseError);

    // Fallback: Generate structured response from unstructured text
    return generateFallbackAnalysis(aiContent, clientData);
  }
}

/**
 * Fallback analysis generator if AI doesn't return valid JSON
 */
function generateFallbackAnalysis(aiContent, clientData) {
  console.log('Using fallback analysis structure');

  // Calculate basic scores based on client data
  const usmcaScore = clientData.usmca_status === 'QUALIFIED' ? 85 :
                     clientData.usmca_status === 'PARTIAL' ? 55 : 35;

  const supplySources = clientData.component_origins?.length || 1;
  const supplyChainScore = Math.min(40 + (supplySources * 15), 85);

  const tradeVolume = Number(clientData.trade_volume || 0);
  const marketScore = tradeVolume > 1000000 ? 75 : tradeVolume > 500000 ? 60 : 45;

  const riskScore = supplySources > 3 ? 75 : supplySources > 1 ? 55 : 40;

  const overallScore = Math.round((usmcaScore + supplyChainScore + marketScore + riskScore) / 4);

  return {
    overall_score: overallScore,
    usmca_score: usmcaScore,
    supply_chain_score: supplyChainScore,
    market_expansion_score: marketScore,
    risk_resilience_score: riskScore,
    usmca_assessment: `Current USMCA status: ${clientData.usmca_status}. ${aiContent.substring(0, 300)}...`,
    supply_chain_assessment: `Supply chain analysis based on ${supplySources} source(s). ${aiContent.substring(300, 600)}...`,
    market_expansion_assessment: `Trade volume: $${tradeVolume.toLocaleString()}. Market readiness assessment. ${aiContent.substring(600, 900)}...`,
    risk_assessment: `Risk evaluation based on supplier concentration and geographic exposure. ${aiContent.substring(900, 1200)}...`,
    service_recommendations: generateDefaultRecommendations(clientData)
  };
}

/**
 * Generate default service recommendations based on client profile
 */
function generateDefaultRecommendations(clientData) {
  const recommendations = [];

  // USMCA Optimization if not qualified
  if (clientData.usmca_status !== 'QUALIFIED') {
    recommendations.push({
      priority: recommendations.length + 1,
      service: 'USMCA Optimization',
      price: 175,
      expected_outcome: clientData.potential_savings ?
        `$${Number(clientData.potential_savings).toLocaleString()} annual savings` :
        'Achieve USMCA qualification',
      rationale: 'Current non-qualified status leaves significant tariff savings on the table. Path to qualification exists through supplier restructuring.'
    });
  }

  // Supplier Sourcing if limited sources
  const supplySources = clientData.component_origins?.length || 1;
  if (supplySources <= 2) {
    recommendations.push({
      priority: recommendations.length + 1,
      service: 'Supplier Sourcing',
      price: 450,
      expected_outcome: 'Establish backup supplier network, reduce dependency risk',
      rationale: 'Limited supplier diversification creates production vulnerability. Need vetted alternatives in Mexico.'
    });
  }

  // Market Entry if high trade volume
  const tradeVolume = Number(clientData.trade_volume || 0);
  if (tradeVolume > 500000) {
    recommendations.push({
      priority: recommendations.length + 1,
      service: 'Market Entry Strategy',
      price: 550,
      expected_outcome: 'Develop Mexico expansion roadmap',
      rationale: `Trade volume of $${tradeVolume.toLocaleString()} indicates scale for Mexico market entry. Strategic timing for expansion.`
    });
  }

  return recommendations;
}
