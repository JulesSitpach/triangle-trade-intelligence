/**
 * API Endpoint: USMCA Compliance Risk Analysis - Stage 2
 * AI prepares compliance analysis → Cristina validates with 17 years logistics expertise
 * Following the AI + Human pattern: AI identifies issues → Professional validates
 * Professional License #4601913 (International Commerce Degree - Cristina)
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

    const prompt = `You are Cristina's AI assistant for USMCA compliance risk analysis.

**CRISTINA'S BACKGROUND**:
- Mexico-based (Professional License #4601913 - International Commerce Degree) - Native Spanish speaker
- 17 years optimizing logistics at Motorola, Arris, Tekmovil (all in Mexico)
- HTS code classification specialist (strongest skill - classified thousands of electronics/telecom products)
- INCOTERMS expert with direct experience in international shipping terms
- Worked WITH customs brokers for 17 years (import/export procedures, regulations, compliance)
- Understands Mexican regulations (NOMS), customs procedures, and freight forwarding

**CRISTINA'S COMPETITIVE ADVANTAGE**:
- Direct relationships with Mexico customs brokers and freight forwarders (built over 17 years)
- Brings Fortune 500 logistics best practices to SMB scale
- Can review compliance in Spanish and English (bilingual advantage)
- Time zone aligned with US/Canada clients
- **NOT a licensed customs broker** - provides compliance optimization guidance, partners with licensed professionals when needed

**CRISTINA'S TASK**: Validate Jorge's document analysis and provide professional compliance risk assessment focusing on what's REALISTIC for an SMB to address without $10K+ in fees.

${businessContext}

**CRISTINA'S HTS CLASSIFICATION FOCUS**:
Current HS Code: ${subscriberData.classified_hs_code || subscriberData.hs_code || 'Not classified'}
Product: ${subscriberData.product_description || 'Not specified'}
- Does this HS code make sense for this product? (Cristina's strongest skill)
- Are there classification risks that could disqualify USMCA status?
- Should client verify with licensed customs broker?

**COMPLIANCE RISK PRIORITIES** (Cristina's 17 years of experience):
1. HTS code accuracy (misclassification = biggest compliance risk)
2. INCOTERMS implications (shipping terms affect origin determination)
3. Documentation completeness (what Jorge found missing)
4. Supplier verification requirements (realistic for SMB budget)
5. Audit defense readiness (Fortune 500 best practices)

**MARKETPLACE INTELLIGENCE TO COLLECT**:
- Which compliance risks are most common in ${subscriberData.business_type || 'this industry'}?
- Which documentation gaps are hardest to fix?
- Which countries in their supply chain have higher audit risk?
- What's the realistic cost to fix each compliance gap?

**PREPARE FOR USMCA POLICY CHANGES**:
- If trilateral becomes bilateral (Canada drops out), how vulnerable is this company?
- Can they replace ${subscriberData.component_origins ? subscriberData.component_origins.filter(c => c.origin_country === 'Canada').map(c => c.value_percentage + '%').join(', ') || '0%' : '0%'} Canada sourcing with Mexico?
- Geographic diversification: Are they too dependent on one country?

Provide detailed compliance risk analysis in this EXACT JSON structure:

{
  "compliance_risks": [
    "List 3-5 specific compliance risks from Cristina's HTS/INCOTERMS/logistics perspective",
    "Focus on risks that require professional validation (not generic AI advice)",
    "Include HS code classification risks, documentation gaps, and audit vulnerabilities"
  ],
  "component_risks": [
    "Analyze each component origin for sourcing risks",
    "Identify countries with trade agreement uncertainty",
    "Flag components that could disqualify USMCA status"
  ],
  "hs_code_validation": {
    "current_classification": "${subscriberData.classified_hs_code || subscriberData.hs_code || 'Unknown'}",
    "cristina_assessment": "Does this HS code accurately reflect the product? (Cristina's strongest skill)",
    "classification_risks": ["List specific classification risks that could cause audit issues"],
    "alternative_codes_consider": ["Suggest 1-2 alternative HS codes to research if current seems wrong"],
    "requires_customs_broker_validation": "true/false - Does Cristina recommend licensed customs broker validation?"
  },
  "tariff_exposure": "Calculate potential tariff exposure if USMCA qualification is challenged (use real trade volume)",
  "recommendations": [
    "List 3-5 actionable recommendations Cristina would provide",
    "Focus on realistic fixes for SMBs (not $10K+ solutions)",
    "Prioritize: 1) HTS verification 2) INCOTERMS review 3) Documentation 4) Supplier verification"
  ],
  "risk_score": "HIGH/MEDIUM/LOW (Cristina's professional assessment)",
  "audit_readiness": "How prepared is this company for customs audit? (Be specific about gaps)",
  "marketplace_insights": {
    "common_industry_risks": "What compliance risks are typical in ${subscriberData.business_type || 'this industry'}?",
    "documentation_difficulty": "Which missing docs are hardest for SMBs to obtain?",
    "canada_dependency": "If USMCA becomes bilateral, can they replace ${subscriberData.component_origins ? subscriberData.component_origins.filter(c => c.origin_country === 'Canada').map(c => c.value_percentage + '%').join(', ') || '0%' : '0%'} Canada with Mexico?"
  }
}

**CRISTINA'S REALITY CHECK**: Focus on compliance risks that SMBs can actually fix. If something requires a licensed customs broker, say so explicitly. Bring Fortune 500 rigor to SMB budget constraints.

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

      // Fallback structured response (Cristina's professional assessment)
      analysisData = {
        compliance_risks: [
          'Unable to complete full AI analysis - Cristina will manually review with 17 years logistics expertise',
          `Product: ${subscriberData.product_description || 'Unknown'} requires HTS classification verification (Cristina's specialty)`,
          `Component origins from ${subscriberData.component_origins?.length || 0} countries need documentation verification`
        ],
        component_risks: Array.isArray(subscriberData.component_origins) ? subscriberData.component_origins.map(comp =>
          `${comp.origin_country || comp.country} sourcing at ${comp.value_percentage || comp.percentage}% requires supplier verification`
        ) : [],
        hs_code_validation: {
          current_classification: subscriberData.classified_hs_code || subscriberData.hs_code || 'Unknown',
          cristina_assessment: 'Manual HTS validation required - Cristina will review with her classification expertise',
          classification_risks: ['Unable to auto-assess - requires professional review'],
          alternative_codes_consider: [],
          requires_customs_broker_validation: 'Cristina will assess and recommend if needed'
        },
        tariff_exposure: `Potential tariff exposure: $${((subscriberData.trade_volume || 0) * 0.05).toLocaleString()} if USMCA qualification is challenged`,
        recommendations: [
          'Cristina will verify HTS code accuracy (her strongest skill)',
          'Obtain supplier origin certificates for all non-USMCA components',
          'Document manufacturing process and value-added activities',
          'Prepare comprehensive audit defense package (Fortune 500 best practices)',
          'Review INCOTERMS implications with logistics expert'
        ],
        risk_score: 'MEDIUM',
        audit_readiness: 'Requires Cristina\'s professional documentation review and supplier verification',
        marketplace_insights: {
          common_industry_risks: 'Unable to analyze - requires manual assessment',
          documentation_difficulty: 'Unable to analyze - requires manual assessment',
          canada_dependency: 'Manual assessment needed for USMCA policy change readiness'
        }
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
      hs_code_validation: analysisData.hs_code_validation || {
        current_classification: subscriberData.classified_hs_code || 'Unknown',
        cristina_assessment: 'Requires Cristina\'s manual HTS review',
        classification_risks: [],
        alternative_codes_consider: [],
        requires_customs_broker_validation: 'TBD'
      },
      tariff_exposure: analysisData.tariff_exposure || 'Analysis required',
      recommendations: analysisData.recommendations || [],
      risk_score: analysisData.risk_score || 'MEDIUM',
      audit_readiness: analysisData.audit_readiness || 'Requires professional review',
      marketplace_insights: analysisData.marketplace_insights || {
        common_industry_risks: 'Requires manual assessment',
        documentation_difficulty: 'Requires manual assessment',
        canada_dependency: 'Requires manual assessment'
      },
      ai_analysis_timestamp: new Date().toISOString(),
      analyzed_by: 'AI (Claude Haiku) + Cristina\'s 17-year logistics expertise'
    });

  } catch (error) {
    console.error('[USMCA RISK ANALYSIS] Error:', error);
    return res.status(500).json({
      error: 'Failed to complete compliance risk analysis',
      details: error.message
    });
  }
}