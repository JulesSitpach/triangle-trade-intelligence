/**
 * API Endpoint: USMCA Compliance Risk Analysis
 * OpenRouter AI analyzes USMCA certificate for compliance risks before Cristina's review
 * Following the AI + Human pattern: AI identifies issues → Human validates
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { serviceRequestId, subscriberData, stage1Data } = req.body;

    console.log('[USMCA RISK ANALYSIS] Starting AI compliance risk analysis:', {
      serviceRequestId,
      company: subscriberData?.company_name,
      product: subscriberData?.product_description,
      hsCode: subscriberData?.classified_hs_code,
      qualificationStatus: subscriberData?.qualification_status
    });

    // Prepare comprehensive context for AI analysis
    const businessContext = `
BUSINESS CONTEXT:
Company: ${subscriberData.company_name || 'Company name not available'}
Product: ${subscriberData.product_description || 'Product not specified'}
HS Code: ${subscriberData.classified_hs_code || subscriberData.hs_code || 'Not classified'}
USMCA Qualification Status: ${subscriberData.qualification_status || 'Not assessed'}
Annual Trade Volume: $${(subscriberData.trade_volume || 0).toLocaleString()}
Manufacturing Location: ${subscriberData.manufacturing_location || 'Not specified'}

COMPONENT ORIGINS:
${Array.isArray(subscriberData.component_origins) ? subscriberData.component_origins.map(comp =>
  `- ${comp.origin_country || comp.country}: ${comp.value_percentage || comp.percentage}% (${comp.description || comp.component_type || 'Component'})`
).join('\n') : 'No component breakdown available'}

USMCA QUALIFICATION DATA:
- Regional Value Content: ${subscriberData.north_american_content || 'Not calculated'}%
- Non-originating Materials: ${subscriberData.non_originating_percentage || 'Not calculated'}%
- Qualification Status: ${subscriberData.qualification_status || 'Unknown'}

FINANCIAL IMPACT:
- Annual Tariff Cost: $${(subscriberData.annual_tariff_cost || 0).toLocaleString()}
- Potential USMCA Savings: $${(subscriberData.potential_usmca_savings || 0).toLocaleString()}
- Cost Analysis: ${subscriberData.cost_analysis ? JSON.stringify(subscriberData.cost_analysis) : 'Not available'}

COMPLIANCE GAPS IDENTIFIED:
${Array.isArray(subscriberData.compliance_gaps) ? subscriberData.compliance_gaps.map(gap => `- ${gap}`).join('\n') : 'No gaps identified yet'}

VULNERABILITY FACTORS:
${Array.isArray(subscriberData.vulnerability_factors) ? subscriberData.vulnerability_factors.map(factor => `- ${factor}`).join('\n') : 'No vulnerabilities identified yet'}
`;

    const prompt = `You are a USMCA compliance risk analysis AI assisting Licensed Customs Broker Cristina (License #4601913) with her professional review.

${businessContext}

TASK: Analyze this USMCA certificate for compliance risks that Cristina should review with her 17 years of customs expertise.

Provide a detailed compliance risk analysis in this EXACT JSON structure:

{
  "compliance_risks": [
    "List 3-5 specific compliance risks (e.g., 'China sourcing at 45% creates tariff exposure if USMCA terms change')",
    "Focus on risks that require customs broker expertise to validate",
    "Include regulatory risks, documentation gaps, and audit vulnerabilities"
  ],
  "component_risks": [
    "Analyze each component origin for sourcing risks",
    "Identify countries with trade agreement uncertainty",
    "Flag components that could disqualify USMCA status"
  ],
  "tariff_exposure": "Calculate potential tariff exposure if USMCA qualification is challenged (specific dollar amounts if possible)",
  "recommendations": [
    "List 3-5 actionable recommendations for Cristina to implement",
    "Focus on documentation, supplier verification, compliance monitoring",
    "Suggest audit defense preparations"
  ],
  "risk_score": "HIGH/MEDIUM/LOW based on overall compliance risk assessment",
  "audit_readiness": "Assessment of how prepared this company is for a customs audit (e.g., 'Documentation gaps present - requires supplier certificates')"
}

IMPORTANT:
- Be specific with actual data from the business context above
- Use real percentages, countries, and dollar amounts
- Identify actual compliance gaps that Cristina can fix
- Don't be generic - reference specific components and their origins
- Calculate real tariff exposure using trade volume and tariff rates

Return ONLY valid JSON, no markdown formatting.`;

    // Call OpenRouter API with Claude model
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
          content: prompt
        }]
      })
    });

    if (!openRouterResponse.ok) {
      throw new Error(`OpenRouter API failed: ${openRouterResponse.status}`);
    }

    const aiResult = await openRouterResponse.json();
    const aiAnalysis = aiResult.choices[0].message.content;

    console.log('[USMCA RISK ANALYSIS] OpenRouter raw response:', aiAnalysis);

    // Parse AI response
    let analysisData;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = aiAnalysis.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('[USMCA RISK ANALYSIS] Failed to parse AI response:', parseError);

      // Fallback structured response
      analysisData = {
        compliance_risks: [
          'Unable to complete full AI analysis - manual customs broker review required',
          `Product: ${subscriberData.product_description || 'Unknown'} requires professional classification review`,
          `Component origins from ${subscriberData.component_origins?.length || 0} countries need documentation verification`
        ],
        component_risks: Array.isArray(subscriberData.component_origins) ? subscriberData.component_origins.map(comp =>
          `${comp.origin_country || comp.country} sourcing at ${comp.value_percentage || comp.percentage}% requires supplier verification`
        ) : [],
        tariff_exposure: `Potential tariff exposure: $${((subscriberData.trade_volume || 0) * 0.05).toLocaleString()} if USMCA qualification is challenged`,
        recommendations: [
          'Obtain supplier origin certificates for all non-USMCA components',
          'Document manufacturing process and value-added activities',
          'Prepare comprehensive audit defense package',
          'Review HS code classification with customs broker',
          'Monitor trade agreement changes and regulatory updates'
        ],
        risk_score: 'MEDIUM',
        audit_readiness: 'Requires comprehensive documentation review and supplier verification'
      };
    }

    console.log('[USMCA RISK ANALYSIS] Structured analysis data:', analysisData);

    // Store analysis in database (update service request with Stage 2 data)
    // This would integrate with Supabase to update the service request
    // For now, just return the analysis

    return res.status(200).json({
      success: true,
      compliance_risks: analysisData.compliance_risks || [],
      component_risks: analysisData.component_risks || [],
      tariff_exposure: analysisData.tariff_exposure || 'Analysis required',
      recommendations: analysisData.recommendations || [],
      risk_score: analysisData.risk_score || 'MEDIUM',
      audit_readiness: analysisData.audit_readiness || 'Requires professional review',
      ai_analysis_timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[USMCA RISK ANALYSIS] Error:', error);
    return res.status(500).json({
      error: 'Failed to complete compliance risk analysis',
      details: error.message
    });
  }
}