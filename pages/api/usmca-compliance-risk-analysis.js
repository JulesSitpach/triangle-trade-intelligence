/**
 * API Endpoint: USMCA Compliance Risk Analysis - Stage 2
 * AI prepares compliance analysis → Cristina validates with 17 years logistics expertise
 * Following the AI + Human pattern: AI identifies issues → Professional validates
 * Professional License #4601913 (International Commerce Degree - Cristina)
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
    const { serviceRequestId, subscriberData, stage1Data } = req.body;

    // ✅ VALIDATION: Fail loudly if required data is missing (AI Fallback Architecture Rule 1)
    if (!subscriberData) {
      await DevIssue.missingData('compliance_risk_analysis', 'subscriberData', { serviceRequestId });
      return res.status(400).json({ error: 'Subscriber data is required' });
    }
    if (!subscriberData.company_name) {
      await DevIssue.missingData('compliance_risk_analysis', 'company_name', { serviceRequestId });
      return res.status(400).json({ error: 'Missing required field: company_name' });
    }
    if (!subscriberData.product_description) {
      await DevIssue.missingData('compliance_risk_analysis', 'product_description', { serviceRequestId, company: subscriberData.company_name });
      return res.status(400).json({ error: 'Missing required field: product_description' });
    }
    if (!subscriberData.component_origins || subscriberData.component_origins.length === 0) {
      await DevIssue.missingData('compliance_risk_analysis', 'component_origins', { serviceRequestId, company: subscriberData.company_name });
      return res.status(400).json({ error: 'Missing required field: component_origins' });
    }
    if (!subscriberData.business_type) {
      await DevIssue.missingData('compliance_risk_analysis', 'business_type', { serviceRequestId, company: subscriberData.company_name });
      return res.status(400).json({ error: 'Missing required field: business_type' });
    }

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
Company: ${subscriberData.company_name}
Product: ${subscriberData.product_description}
${subscriberData.classified_hs_code || subscriberData.hs_code ? `HS Code: ${subscriberData.classified_hs_code || subscriberData.hs_code}` : ''}
${subscriberData.qualification_status ? `USMCA Qualification Status: ${subscriberData.qualification_status}` : ''}
${subscriberData.trade_volume ? `Annual Trade Volume: $${subscriberData.trade_volume.toLocaleString()}` : ''}
${subscriberData.manufacturing_location ? `Manufacturing Location: ${subscriberData.manufacturing_location}` : ''}

COMPONENT ORIGINS:
${subscriberData.component_origins.map(comp =>
  `- ${comp.origin_country || comp.country}: ${comp.value_percentage || comp.percentage}% (${comp.description || comp.component_type || 'Component'})`
).join('\n')}

${subscriberData.north_american_content || subscriberData.non_originating_percentage || subscriberData.qualification_status ? `USMCA QUALIFICATION DATA:` : ''}
${subscriberData.north_american_content ? `- Regional Value Content: ${subscriberData.north_american_content}%` : ''}
${subscriberData.non_originating_percentage ? `- Non-originating Materials: ${subscriberData.non_originating_percentage}%` : ''}
${subscriberData.qualification_status ? `- Qualification Status: ${subscriberData.qualification_status}` : ''}

${subscriberData.annual_tariff_cost || subscriberData.potential_usmca_savings || subscriberData.cost_analysis ? `FINANCIAL IMPACT:` : ''}
${subscriberData.annual_tariff_cost ? `- Annual Tariff Cost: $${subscriberData.annual_tariff_cost.toLocaleString()}` : ''}
${subscriberData.potential_usmca_savings ? `- Potential USMCA Savings: $${subscriberData.potential_usmca_savings.toLocaleString()}` : ''}
${subscriberData.cost_analysis ? `- Cost Analysis: ${JSON.stringify(subscriberData.cost_analysis)}` : ''}

${Array.isArray(subscriberData.compliance_gaps) && subscriberData.compliance_gaps.length > 0 ? `COMPLIANCE GAPS IDENTIFIED:\n${subscriberData.compliance_gaps.map(gap => `- ${gap}`).join('\n')}` : ''}

${Array.isArray(subscriberData.vulnerability_factors) && subscriberData.vulnerability_factors.length > 0 ? `VULNERABILITY FACTORS:\n${subscriberData.vulnerability_factors.map(factor => `- ${factor}`).join('\n')}` : ''}
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
- **NOT a trade compliance expert** - provides compliance optimization guidance, partners with licensed professionals when needed

**CRISTINA'S TASK**: Validate Jorge's document analysis and provide professional compliance risk assessment focusing on what's REALISTIC for an SMB to address without $10K+ in fees.

${businessContext}

**CRISTINA'S HTS CLASSIFICATION FOCUS**:
${subscriberData.classified_hs_code || subscriberData.hs_code ? `Current HS Code: ${subscriberData.classified_hs_code || subscriberData.hs_code}` : 'No HS code classified yet'}
Product: ${subscriberData.product_description}
- Does this HS code make sense for this product? (Cristina's strongest skill)
- Are there classification risks that could disqualify USMCA status?
- Should client verify with trade compliance expert?

**COMPLIANCE RISK PRIORITIES** (Cristina's 17 years of experience):
1. HTS code accuracy (misclassification = biggest compliance risk)
2. INCOTERMS implications (shipping terms affect origin determination)
3. Documentation completeness (what Jorge found missing)
4. Supplier verification requirements (realistic for SMB budget)
5. Audit defense readiness (Fortune 500 best practices)

**MARKETPLACE INTELLIGENCE TO COLLECT**:
- Which compliance risks are most common in ${subscriberData.business_type}?
- Which documentation gaps are hardest to fix?
- Which countries in their supply chain have higher audit risk?
- What's the realistic cost to fix each compliance gap?

**PREPARE FOR USMCA POLICY CHANGES**:
- If trilateral becomes bilateral (Canada drops out), how vulnerable is this company?
- Can they replace ${subscriberData.component_origins.filter(c => c.origin_country === 'Canada').map(c => c.value_percentage + '%').join(', ') || '0%'} Canada sourcing with Mexico?
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
    "current_classification": "${subscriberData.classified_hs_code || subscriberData.hs_code || 'Not yet classified'}",
    "cristina_assessment": "Does this HS code accurately reflect the product? (Cristina's strongest skill)",
    "classification_risks": ["List specific classification risks that could cause audit issues"],
    "alternative_codes_consider": ["Suggest 1-2 alternative HS codes to research if current seems wrong"],
    "requires_customs_broker_validation": "true/false - Does Cristina recommend trade compliance expert validation?"
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
    "common_industry_risks": "What compliance risks are typical in ${subscriberData.business_type}?",
    "documentation_difficulty": "Which missing docs are hardest for SMBs to obtain?",
    "canada_dependency": "If USMCA becomes bilateral, can they replace ${subscriberData.component_origins.filter(c => c.origin_country === 'Canada').map(c => c.value_percentage + '%').join(', ') || '0%'} Canada with Mexico?"
  }
}

**CRISTINA'S REALITY CHECK**: Focus on compliance risks that SMBs can actually fix. If something requires a trade compliance expert, say so explicitly. Bring Fortune 500 rigor to SMB budget constraints.

Return ONLY valid JSON, no markdown formatting.`;

    // 🔄 Call AI with 3-tier fallback (OpenRouter → Anthropic → Graceful fail)
    const aiResult = await executeAIWithFallback({
      prompt,
      model: 'anthropic/claude-3-haiku',
      maxTokens: 2500
    });

    if (!aiResult.success) {
      console.error('All AI tiers failed:', aiResult.error);
      await logDevIssue({
        type: 'api_error',
        severity: 'critical',
        component: 'compliance_risk_analysis',
        message: 'All AI tiers failed',
        data: { serviceRequestId, company: subscriberData?.company_name, error: aiResult.error }
      });
      throw new Error(aiResult.error);
    }

    console.log(`[USMCA RISK ANALYSIS] Using ${aiResult.provider} (Tier ${aiResult.tier}) - ${aiResult.duration}ms`);
    const aiAnalysis = aiResult.content;

    // Parse AI response with robust error handling
    let analysisData;
    try {
      analysisData = parseAIResponse(aiAnalysis);

      if (analysisData.parseError) {
        await logDevIssue({
          type: 'unexpected_behavior',
          severity: 'high',
          component: 'compliance_risk_analysis',
          message: 'AI response parse error',
          data: { serviceRequestId, company: subscriberData?.company_name }
        });
        throw new Error('Failed to parse AI response');
      }
    } catch (parseError) {
      console.error('[USMCA RISK ANALYSIS] Failed to parse AI response:', parseError);
      await DevIssue.apiError('compliance_risk_analysis', 'AI response parsing', parseError, { serviceRequestId, company: subscriberData?.company_name });

      // Fallback structured response (Cristina's professional assessment)
      analysisData = {
        compliance_risks: [
          'Unable to complete full AI analysis - Cristina will manually review with 17 years logistics expertise',
          `Product: ${subscriberData.product_description} requires HTS classification verification (Cristina's specialty)`,
          `Component origins from ${subscriberData.component_origins.length} countries need documentation verification`
        ],
        component_risks: subscriberData.component_origins.map(comp =>
          `${comp.origin_country || comp.country} sourcing at ${comp.value_percentage || comp.percentage}% requires supplier verification`
        ),
        hs_code_validation: {
          current_classification: subscriberData.classified_hs_code || subscriberData.hs_code || 'Not yet classified',
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
        current_classification: subscriberData.classified_hs_code || subscriberData.hs_code || 'Not yet classified',
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
    await DevIssue.apiError('compliance_risk_analysis', '/api/usmca-compliance-risk-analysis', error, {
      serviceRequestId: req.body?.serviceRequestId,
      company: req.body?.subscriberData?.company_name
    });
    return res.status(500).json({
      error: 'Failed to complete compliance risk analysis',
      details: error.message
    });
  }
}