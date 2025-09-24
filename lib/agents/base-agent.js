import Anthropic from '@anthropic-ai/sdk';

export class BaseAgent {
  constructor(config = {}) {
    this.name = config.name || 'BaseAgent';
    this.model = config.model || 'claude-3-haiku-20240307';
    this.maxTokens = config.maxTokens || 2000;
    this.maxRetries = config.maxRetries || 3;

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async execute(prompt, context = {}) {
    const systemPrompt = this.buildSystemPrompt(context);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const message = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: this.maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }]
        });

        const response = message.content[0].text;
        const parsed = this.parseResponse(response);

        return {
          success: true,
          data: parsed,
          confidence: this.calculateConfidence(parsed, context),
          metadata: {
            agent: this.name,
            model: this.model,
            attempt: attempt,
            timestamp: new Date().toISOString()
          }
        };

      } catch (error) {
        console.error(`[${this.name}] Attempt ${attempt} failed:`, error.message);

        if (error.status === 529 && attempt < this.maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`[${this.name}] Retrying in ${waitTime}ms...`);
          await this.sleep(waitTime);
          continue;
        }

        if (attempt === this.maxRetries) {
          return {
            success: false,
            error: error.message,
            metadata: {
              agent: this.name,
              attempts: attempt,
              timestamp: new Date().toISOString()
            }
          };
        }
      }
    }
  }

  buildSystemPrompt(context) {
    return `You are ${this.name}, an AI agent specialized in USMCA trade compliance and certificate preparation.

Your role: Provide accurate, helpful assistance while maintaining high confidence in your recommendations.

Context: ${JSON.stringify(context, null, 2)}

Guidelines:
1. Be precise and accurate with trade regulations
2. Provide confidence scores (0-100) for your suggestions
3. Explain your reasoning clearly
4. Suggest alternatives when confidence is medium (70-85%)
5. Recommend expert review when confidence is low (<70%)

Response format: Always return valid JSON with your analysis.`;
  }

  parseResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { raw: response };
    } catch (error) {
      console.error(`[${this.name}] Failed to parse response:`, error);
      return { raw: response, parseError: true };
    }
  }

  calculateConfidence(parsedResponse, context) {
    if (parsedResponse.confidence !== undefined) {
      return parsedResponse.confidence;
    }

    let confidence = 50;

    if (parsedResponse.hsCode && parsedResponse.hsCode.length >= 6) {
      confidence += 15;
    }

    if (parsedResponse.explanation && parsedResponse.explanation.length > 50) {
      confidence += 10;
    }

    if (parsedResponse.sources && parsedResponse.sources.length > 0) {
      confidence += 15;
    }

    if (context.previousCertificates && context.previousCertificates.length > 0) {
      confidence += 10;
    }

    return Math.min(confidence, 100);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  logInteraction(prompt, response, success) {
    const log = {
      agent: this.name,
      timestamp: new Date().toISOString(),
      prompt: prompt.substring(0, 200) + '...',
      success,
      confidence: response.confidence,
      model: this.model
    };

    console.log(`[${this.name}] Interaction:`, JSON.stringify(log, null, 2));

    return log;
  }

  async getAlternativeSuggestions(primarySuggestion, context) {
    const alternativesPrompt = `Based on the primary suggestion: ${JSON.stringify(primarySuggestion)}

    Provide 2-3 alternative options with explanations.
    Consider edge cases and different interpretations.

    Return as JSON array: [{ option, confidence, explanation }]`;

    return await this.execute(alternativesPrompt, context);
  }

  shouldEscalateToExpert(confidence, complexity = 'medium') {
    const thresholds = {
      low: 85,
      medium: 75,
      high: 65
    };

    const threshold = thresholds[complexity] || 75;

    return {
      escalate: confidence < threshold,
      reason: confidence < threshold
        ? `Low confidence (${confidence}%) for ${complexity} complexity case`
        : `Confidence sufficient (${confidence}%)`,
      recommendedService: confidence < 70 ? 'expert_completion' : 'expert_review',
      estimatedPrice: confidence < 70 ? 200 : 50
    };
  }
}

export default BaseAgent;