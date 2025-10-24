export class BaseAgent {
  constructor(config = {}) {
    this.name = config.name || 'BaseAgent';
    this.model = config.model || 'anthropic/claude-haiku-4.5';
    this.maxTokens = config.maxTokens || 2000;
    this.maxRetries = config.maxRetries || 3;
  }

  async execute(prompt, context = {}) {
    const systemPrompt = this.buildSystemPrompt(context);

    // 📊 Metrics tracking
    const metrics = {
      startTime: Date.now(),
      openRouterCalls: 0,
      anthropicCalls: 0,
      parseErrors: 0
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // PRIMARY: Try OpenRouter API first
        const requestBody = {
          model: this.model,
          max_tokens: this.maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ]
        };

        // ✅ Add temperature from context if provided (for task-specific consistency)
        if (context.temperature !== undefined) {
          requestBody.temperature = context.temperature;
        }

        metrics.openRouterCalls++;
        console.log(`[${this.name}] 📞 OpenRouter API call #${metrics.openRouterCalls}:`, {
          model: requestBody.model,
          max_tokens: requestBody.max_tokens,
          attempt
        });

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://triangleintelligence.com', // Required by OpenRouter
            'X-Title': 'Triangle Intelligence Platform',          // Optional but recommended
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const responseText = data.choices[0].message.content;

        console.log(`[${this.name}] OpenRouter response length:`, responseText.length);
        console.log(`[${this.name}] OpenRouter usage:`, data.usage);
        console.log(`[${this.name}] OpenRouter finish_reason:`, data.choices[0].finish_reason);

        // Log if response was truncated
        if (data.choices[0].finish_reason === 'length') {
          console.warn(`[${this.name}] ⚠️ WARNING: Response was truncated due to max_tokens limit!`);
          console.warn(`[${this.name}] Current max_tokens: ${this.maxTokens}, consider increasing`);
        }

        // Debug: Save full response to check truncation
        if (responseText.length < 2000 && !responseText.includes('}')) {
          console.error(`[${this.name}] ❌ CRITICAL: Incomplete JSON detected!`);
          console.error(`[${this.name}] Response starts with:`, responseText.substring(0, 200));
          console.error(`[${this.name}] Response ends with:`, responseText.substring(responseText.length - 200));
        }

        // Log raw response BEFORE parsing for debugging
        console.log(`[${this.name}] Raw response (first 500 chars):`, responseText.substring(0, 500));
        console.log(`[${this.name}] Raw response (last 500 chars):`, responseText.substring(Math.max(0, responseText.length - 500)));

        // 🔥 CRITICAL: API call succeeded - parse errors should NOT trigger retry/fallback
        let parsed;
        try {
          parsed = this.parseResponse(responseText);
        } catch (parseError) {
          metrics.parseErrors++;

          // This is OUR bug, not OpenRouter's - don't retry the API
          console.error(`[${this.name}] ❌ PARSE ERROR (API call succeeded):`, parseError.message);
          console.error(`[${this.name}] Raw response that failed to parse:`, responseText);

          // Create a custom error so outer catch knows this is a parse failure
          const error = new Error(`Parse failed: ${parseError.message}`);
          error.isParseError = true;
          error.rawResponse = responseText;
          throw error;
        }

        // 📊 Success metrics
        const duration = Date.now() - metrics.startTime;
        console.log(`[${this.name}] ✅ SUCCESS - Metrics:`, {
          openRouterCalls: metrics.openRouterCalls,
          anthropicCalls: metrics.anthropicCalls,
          parseErrors: metrics.parseErrors,
          duration: `${duration}ms`,
          provider: 'openrouter'
        });

        return {
          success: true,
          data: parsed,
          confidence: this.calculateConfidence(parsed, context),
          metadata: {
            agent: this.name,
            model: this.model,
            provider: 'openrouter',
            attempt: attempt,
            timestamp: new Date().toISOString(),
            metrics: {
              openRouterCalls: metrics.openRouterCalls,
              anthropicCalls: metrics.anthropicCalls,
              parseErrors: metrics.parseErrors,
              duration
            }
          }
        };

      } catch (error) {
        // 🔥 CRITICAL: Separate parse errors from API errors
        if (error.isParseError) {
          // Parse error - API worked, but our parsing logic failed
          console.error(`[${this.name}] 🚨 Parse error detected - NOT retrying API (would waste calls)`);
          console.error(`[${this.name}] This is a code bug, not an API issue`);

          // Return failure with parse error details
          return {
            success: false,
            error: error.message,
            rawResponse: error.rawResponse,
            metadata: {
              agent: this.name,
              errorType: 'parse_error',
              timestamp: new Date().toISOString()
            }
          };
        }

        // This is a real API error (network, 500, timeout, etc.)
        console.error(`[${this.name}] API error on attempt ${attempt}:`, error.message);

        // FALLBACK: Try Anthropic SDK if OpenRouter fails (ONLY for API errors)
        if (attempt === this.maxRetries) {
          metrics.anthropicCalls++;
          console.log(`[${this.name}] 🔄 Falling back to Anthropic SDK (OpenRouter failed ${metrics.openRouterCalls} times)...`);

          try {
            const result = await this.executeWithAnthropic(prompt, systemPrompt, attempt);

            // Add metrics to fallback result
            const duration = Date.now() - metrics.startTime;
            console.log(`[${this.name}] ✅ FALLBACK SUCCESS - Metrics:`, {
              openRouterCalls: metrics.openRouterCalls,
              anthropicCalls: metrics.anthropicCalls,
              parseErrors: metrics.parseErrors,
              duration: `${duration}ms`,
              provider: 'anthropic_fallback'
            });

            result.metadata.metrics = {
              openRouterCalls: metrics.openRouterCalls,
              anthropicCalls: metrics.anthropicCalls,
              parseErrors: metrics.parseErrors,
              duration
            };

            return result;
          } catch (fallbackError) {
            const duration = Date.now() - metrics.startTime;
            console.error(`[${this.name}] ❌ BOTH APIs FAILED - Metrics:`, {
              openRouterCalls: metrics.openRouterCalls,
              anthropicCalls: metrics.anthropicCalls,
              parseErrors: metrics.parseErrors,
              duration: `${duration}ms`
            });

            return {
              success: false,
              error: `OpenRouter and Anthropic both failed: ${error.message}`,
              metadata: {
                agent: this.name,
                attempts: attempt,
                timestamp: new Date().toISOString(),
                metrics: {
                  openRouterCalls: metrics.openRouterCalls,
                  anthropicCalls: metrics.anthropicCalls,
                  parseErrors: metrics.parseErrors,
                  duration
                }
              }
            };
          }
        }

        // Special handling for rate limits
        if (error.status === 529 && attempt < this.maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`[${this.name}] Rate limited, retrying in ${waitTime}ms...`);
          await this.sleep(waitTime);
          continue;
        }
      }
    }
  }

  async executeWithAnthropic(prompt, systemPrompt, attempt) {
    // Fallback to Anthropic SDK
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Convert OpenRouter model format to Anthropic format
    const anthropicModel = this.model.replace('anthropic/', '');

    const message = await anthropic.messages.create({
      model: anthropicModel.includes('haiku') ? 'claude-haiku-4-20250514' : 'claude-sonnet-4-20250514',
      max_tokens: this.maxTokens,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    const responseText = message.content[0].text;
    const parsed = this.parseResponse(responseText);

    return {
      success: true,
      data: parsed,
      confidence: this.calculateConfidence(parsed, {}),
      metadata: {
        agent: this.name,
        model: this.model,
        provider: 'anthropic_fallback',
        attempt: attempt,
        timestamp: new Date().toISOString()
      }
    };
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
      // STEP 1: Try parsing the raw response first (it might be valid JSON already)
      try {
        return JSON.parse(response);
      } catch (e) {
        // Not valid JSON, continue with cleaning
      }

      // STEP 2: PRE-CLEAN the entire response (remove control characters)
      let preCleaned = response
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')  // Remove control characters
        .replace(/\n/g, ' ')  // Remove newlines
        .replace(/\r/g, ' ')  // Remove carriage returns
        .replace(/\t/g, ' ')  // Remove tabs
        .replace(/\s+/g, ' ')  // Collapse multiple spaces
        .trim();

      // STEP 3: Try parsing pre-cleaned version
      try {
        return JSON.parse(preCleaned);
      } catch (e) {
        // Still not valid, continue with pattern matching
      }

      // STEP 4: Find JSON block using pattern matching
      let jsonMatch = preCleaned.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        jsonMatch = preCleaned.match(/\{[^{]*\}$/);
      }

      // STEP 5: If still no match, try to repair incomplete JSON
      if (!jsonMatch && preCleaned.includes('{')) {
        console.warn(`[${this.name}] Attempting to repair incomplete JSON...`);

        const jsonStart = preCleaned.indexOf('{');
        let incompleteJson = preCleaned.substring(jsonStart);

        // Count braces
        const openBraces = (incompleteJson.match(/\{/g) || []).length;
        const closeBraces = (incompleteJson.match(/\}/g) || []).length;

        // Check for unclosed string value
        const lastQuoteIndex = incompleteJson.lastIndexOf('"');
        const lastColonIndex = incompleteJson.lastIndexOf(':');

        if (lastColonIndex > lastQuoteIndex) {
          console.warn(`[${this.name}] Detected unclosed string value, adding closing quote`);
          incompleteJson += '"';
        }

        // Add missing closing braces
        if (openBraces > closeBraces) {
          const missing = openBraces - closeBraces;
          incompleteJson += '}'.repeat(missing);
          console.warn(`[${this.name}] Added ${missing} closing brace(s) to repair JSON`);
          jsonMatch = [incompleteJson];
        }
      }

      if (jsonMatch) {
        let cleanedJson = jsonMatch[0]
          .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
          .trim();

        // Try parsing the extracted JSON
        return JSON.parse(cleanedJson);
      }

      // Fallback: try to extract key-value pairs manually
      const fallbackParse = this.extractKeyValues(response);
      if (fallbackParse) {
        return fallbackParse;
      }

      return { raw: response };
    } catch (error) {
      console.error(`[${this.name}] Failed to parse response:`, error);
      console.error(`[${this.name}] Raw response (first 500):`, response.substring(0, 500));
      console.error(`[${this.name}] Raw response (last 500):`, response.substring(Math.max(0, response.length - 500)));
      console.error(`[${this.name}] Total response length:`, response.length);

      // Check if response is just empty or a single brace
      if (!response || response.trim().length < 3) {
        return {
          parseError: true,
          errorType: 'empty_response',
          message: 'Model returned empty or incomplete response'
        };
      }

      // Try fallback parsing
      const fallback = this.extractKeyValues(response);
      return fallback || { raw: response, parseError: true };
    }
  }

  fixJsonStructure(jsonString) {
    try {
      // Fix array structures that might be broken
      jsonString = jsonString.replace(/\[\s*\{/g, '[{');
      jsonString = jsonString.replace(/\}\s*\]/g, '}]');

      // Fix object structures
      jsonString = jsonString.replace(/\{\s*"/g, '{"');
      jsonString = jsonString.replace(/"\s*\}/g, '"}');

      // Ensure proper comma placement
      jsonString = jsonString.replace(/"\s*"\s*:/g, '": ');
      jsonString = jsonString.replace(/:\s*"/g, ': "');

      return jsonString;
    } catch (error) {
      return jsonString; // Return original if fixing fails
    }
  }

  extractKeyValues(text) {
    try {
      const result = {};

      // Extract common fields
      const hsCodeMatch = text.match(/"hsCode":\s*"([^"]+)"/);
      if (hsCodeMatch) result.hsCode = hsCodeMatch[1];

      const confidenceMatch = text.match(/"confidence":\s*(\d+)/);
      if (confidenceMatch) result.confidence = parseInt(confidenceMatch[1]);

      const explanationMatch = text.match(/"explanation":\s*"([^"]+)"/);
      if (explanationMatch) result.explanation = explanationMatch[1];

      return Object.keys(result).length > 0 ? result : null;
    } catch (error) {
      return null;
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