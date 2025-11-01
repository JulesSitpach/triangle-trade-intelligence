/**
 * AI-POWERED CONFIDENCE SCORING SERVICE
 * Uses Claude AI to provide accurate confidence scores for HS code classifications
 */

import { logInfo, logError } from '../utils/production-logger.js';

export class AIConfidenceScoringService {
  constructor() {
    this.apiUrl = "https://api.anthropic.com/v1/messages";
    this.model = "claude-haiku-4-20250514";
    this.maxTokens = 150;
    
    // Get API key from environment variables
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!this.apiKey) {
      logError('Anthropic API key not found in environment variables');
    }
  }

  /**
   * Create confidence scoring prompt for Claude AI
   */
  createConfidencePrompt(userDescription, hsCodes) {
    return `
Analyze how well each HS code matches the user's product description.

User's product description: "${userDescription}"

Rate each HS code on a scale of 1-100 based on how closely the official description matches what the user described. Consider material types, product categories, intended use, and specific features mentioned by the user.

HS Codes to evaluate:
${hsCodes.map((code, index) => 
  `${index + 1}. Code ${code.hs_code}: ${code.product_description}`
).join('\n')}

Scoring guidelines:
- 90-100: Perfect match - all key attributes align
- 80-89: Very good match - most attributes align with minor differences  
- 70-79: Good match - core product type matches but some specifics differ
- 60-69: Partial match - related product but notable differences
- Below 60: Poor match - different product category or major misalignment

Return only a JSON array of scores in the same order as listed above. No explanations, just the numbers.

Format: [score1, score2, score3, ...]
    `.trim();
  }

  /**
   * Score HS codes using AI analysis
   */
  async scoreHSCodes(userDescription, hsCodes) {
    if (!this.apiKey) {
      logError('Cannot score HS codes: Anthropic API key not configured');
      return this.fallbackScoring(userDescription, hsCodes);
    }

    if (!hsCodes || hsCodes.length === 0) {
      return [];
    }

    try {
      const prompt = this.createConfidencePrompt(userDescription, hsCodes);
      
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        logError(`AI scoring API error: ${response.status} ${response.statusText}`);
        return this.fallbackScoring(userDescription, hsCodes);
      }

      const data = await response.json();
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        logError('Invalid response format from AI scoring API');
        return this.fallbackScoring(userDescription, hsCodes);
      }

      // Parse the JSON array of scores
      const scoresText = data.content[0].text.trim();
      const scores = JSON.parse(scoresText);
      
      if (!Array.isArray(scores) || scores.length !== hsCodes.length) {
        logError('AI returned invalid score array format');
        return this.fallbackScoring(userDescription, hsCodes);
      }

      // Add AI scores to HS codes
      const scoredCodes = hsCodes.map((code, index) => ({
        ...code,
        confidence: Math.max(1, Math.min(100, scores[index] || 50)), // Clamp between 1-100
        confidenceSource: 'ai_claude'
      }));

      logInfo(`AI confidence scoring completed for ${hsCodes.length} HS codes`);
      return scoredCodes;

    } catch (error) {
      logError('AI confidence scoring failed', { 
        error: error.message,
        userDescription: userDescription.substring(0, 50) 
      });
      return this.fallbackScoring(userDescription, hsCodes);
    }
  }

  /**
   * Fallback scoring when AI is not available
   */
  fallbackScoring(userDescription, hsCodes) {
    logInfo('Using fallback confidence scoring');
    
    const userWords = userDescription.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    return hsCodes.map(code => {
      const description = code.product_description.toLowerCase();
      const matchedWords = userWords.filter(word => description.includes(word));
      const matchRatio = matchedWords.length / Math.max(userWords.length, 1);
      
      // Convert ratio to confidence score (30-85 range for fallback)
      const baseScore = 30 + (matchRatio * 55);
      
      // Bonus for USMCA eligibility
      const usmcaBonus = code.usmca_eligible ? 5 : 0;
      
      // Bonus for having tariff data
      const dataBonus = (code.mfn_tariff_rate !== null && code.usmca_tariff_rate !== null) ? 5 : 0;
      
      const finalScore = Math.round(Math.min(85, baseScore + usmcaBonus + dataBonus));
      
      return {
        ...code,
        confidence: finalScore,
        confidenceSource: 'fallback'
      };
    });
  }

  /**
   * Batch score multiple classification requests
   */
  async batchScoreClassifications(requests) {
    const results = [];
    
    for (const request of requests) {
      const scored = await this.scoreHSCodes(request.userDescription, request.hsCodes);
      results.push({
        ...request,
        scoredCodes: scored
      });
    }
    
    return results;
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      apiConfigured: !!this.apiKey,
      model: this.model,
      maxTokens: this.maxTokens,
      fallbackAvailable: true
    };
  }
}

// Export singleton instance
export const aiConfidenceScoringService = new AIConfidenceScoringService();

export default AIConfidenceScoringService;