/**
 * Anthropic API Utility - Claude 3.5 Haiku Integration
 * Standardized AI calls for Triangle Intelligence Platform
 * Cost-optimized with Claude 3.5 Haiku for business analysis
 */

/**
 * Standard Anthropic API call for Triangle Intelligence
 * @param {string} prompt - The AI prompt
 * @param {object} options - Optional parameters
 * @returns {Promise<object>} - Parsed AI response
 */
export async function callAnthropicAPI(prompt, options = {}) {
  const {
    maxTokens = 2000,
    temperature = 0.7,
    model = 'claude-3-5-haiku-20241022', // Cost-effective choice
    parseJSON = true
  } = options;

  console.log(`[ANTHROPIC] Calling ${model} with prompt length: ${prompt.length}`);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponseText = data.content[0]?.text || '';

    if (!aiResponseText || aiResponseText.length < 20) {
      throw new Error('Anthropic API returned empty or insufficient response');
    }

    console.log(`[ANTHROPIC] ✅ Response received - length: ${aiResponseText.length} tokens`);

    // Parse JSON if requested
    if (parseJSON) {
      try {
        const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log(`[ANTHROPIC] ✅ JSON parsing successful`);
          return {
            success: true,
            data: parsed,
            rawText: aiResponseText,
            usage: data.usage,
            model: model
          };
        } else {
          console.log(`[ANTHROPIC] ⚠️ No JSON found, returning raw text`);
          return {
            success: true,
            data: null,
            rawText: aiResponseText,
            usage: data.usage,
            model: model
          };
        }
      } catch (parseError) {
        console.log(`[ANTHROPIC] ⚠️ JSON parse failed: ${parseError.message}`);
        return {
          success: true,
          data: null,
          rawText: aiResponseText,
          usage: data.usage,
          model: model,
          parseError: parseError.message
        };
      }
    }

    // Return raw text if JSON parsing not requested
    return {
      success: true,
      data: aiResponseText,
      rawText: aiResponseText,
      usage: data.usage,
      model: model
    };

  } catch (error) {
    console.error(`[ANTHROPIC] ❌ API call failed:`, error);
    throw error;
  }
}

/**
 * Validate that Anthropic API key is configured
 */
export function validateAnthropicConfig() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  
  if (!process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    throw new Error('Invalid Anthropic API key format');
  }
  
  return true;
}

/**
 * Calculate estimated cost for a prompt
 * @param {string} prompt - The prompt text
 * @param {number} expectedOutputTokens - Expected response length
 * @returns {object} - Cost estimate
 */
export function estimateCost(prompt, expectedOutputTokens = 1500) {
  // Claude 3.5 Haiku pricing
  const INPUT_COST_PER_1M = 1.00;
  const OUTPUT_COST_PER_1M = 5.00;
  
  // Rough token estimation (4 chars = 1 token)
  const inputTokens = Math.ceil(prompt.length / 4);
  
  const inputCost = (inputTokens / 1000000) * INPUT_COST_PER_1M;
  const outputCost = (expectedOutputTokens / 1000000) * OUTPUT_COST_PER_1M;
  const totalCost = inputCost + outputCost;
  
  return {
    inputTokens,
    expectedOutputTokens,
    inputCost: inputCost.toFixed(6),
    outputCost: outputCost.toFixed(6),
    totalCost: totalCost.toFixed(6),
    model: 'claude-3-5-haiku-20241022'
  };
}

/**
 * Create fallback analysis structure for when JSON parsing fails
 * @param {string} rawText - The raw AI response
 * @param {string} analysisType - Type of analysis (crisis, supplier, etc.)
 * @returns {object} - Structured fallback analysis
 */
export function createFallbackAnalysis(rawText, analysisType) {
  const baseAnalysis = {
    raw_ai_analysis: rawText,
    analysis_type: analysisType,
    parsing_status: 'fallback_structure_used',
    ai_provider: 'Anthropic Claude 3.5 Haiku'
  };

  switch (analysisType) {
    case 'crisis':
      return {
        ...baseAnalysis,
        crisis_severity: 'High',
        immediate_impact: rawText.substring(0, 300),
        risk_factors: ['AI analysis provided - requires professional review'],
        action_plan: {
          immediate_actions: ['Review AI analysis', 'Validate with business context'],
          short_term_actions: ['Implement validated recommendations'],
          long_term_strategy: ['Establish prevention protocols']
        },
        financial_mitigation: ['Minimize cost exposure', 'Diversify operations'],
        regulatory_steps: ['Ensure compliance requirements'],
        supply_chain_recommendations: ['Reduce concentration risk']
      };

    case 'supplier':
      return {
        ...baseAnalysis,
        prioritized_suppliers: [],
        usmca_strategy: {
          regional_value_improvement: 'Analysis provided in raw text',
          tariff_savings_potential: 'See detailed analysis',
          qualification_timeline: 'Professional review required'
        },
        implementation_roadmap: {
          immediate_actions: ['Review AI analysis'],
          short_term_plan: ['Validate recommendations'],
          long_term_strategy: ['Build supplier relationships']
        }
      };

    case 'manufacturing':
      return {
        ...baseAnalysis,
        feasibility_score: 75,
        location_analysis: 'See detailed analysis in raw text',
        cost_estimates: 'Professional review required',
        timeline_assessment: 'Analysis provided',
        risk_factors: ['Review raw analysis for details']
      };

    case 'market':
      return {
        ...baseAnalysis,
        market_opportunity: 'Medium',
        entry_strategy: 'See detailed analysis',
        competitive_analysis: 'Professional review required',
        regulatory_requirements: ['Standard market entry compliance'],
        implementation_plan: ['Review AI analysis', 'Validate recommendations']
      };

    case 'classification':
      return {
        ...baseAnalysis,
        classification_validation: 'Review required',
        confidence_level: 'Medium',
        regulatory_notes: 'See detailed analysis',
        compliance_recommendations: ['Professional validation required']
      };

    case 'certificate':
      return {
        ...baseAnalysis,
        certificate_enhancement: 'AI analysis provided',
        rvc_analysis: 'Professional review required',
        compliance_notes: ['Review detailed analysis'],
        audit_preparation: ['Validate with customs broker']
      };

    default:
      return baseAnalysis;
  }
}
