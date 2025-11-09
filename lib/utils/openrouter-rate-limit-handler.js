/**
 * Centralized OpenRouter Rate Limit Handler
 *
 * Handles 429 (Too Many Requests) and 529 (Overloaded) errors with exponential backoff
 *
 * Usage:
 *   import { callOpenRouterWithRetry } from './openrouter-rate-limit-handler';
 *   const response = await callOpenRouterWithRetry(requestBody, maxRetries);
 */

/**
 * Sleep utility for exponential backoff
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call OpenRouter API with automatic retry on rate limits + Anthropic fallback
 *
 * @param {Object} requestBody - OpenRouter API request body
 * @param {Number} maxRetries - Maximum retry attempts (default: 3)
 * @param {String} context - Context for logging (default: 'OpenRouter')
 * @param {Boolean} enableFallback - Enable Anthropic fallback on total failure (default: true)
 * @returns {Object} Response data from OpenRouter or Anthropic
 * @throws {Error} If all retries AND fallback fail
 */
export async function callOpenRouterWithRetry(requestBody, maxRetries = 3, context = 'OpenRouter', enableFallback = true) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${context}] 📞 API call attempt ${attempt}/${maxRetries}`);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://triangleintelligence.com',
          'X-Title': 'Triangle Intelligence Platform',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      // ✅ SUCCESS: Return response data
      if (response.ok) {
        const data = await response.json();
        console.log(`[${context}] ✅ API call succeeded on attempt ${attempt}`);
        return data;
      }

      // ⚠️ RATE LIMIT: Retry with exponential backoff
      if ((response.status === 429 || response.status === 529) && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;  // 2s, 4s, 8s
        console.log(`[${context}] 🚦 Rate limited (${response.status}), waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
        await sleep(waitTime);
        continue;  // Try again
      }

      // ❌ ERROR: Save for potential fallback
      const errorText = await response.text();
      lastError = new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);

      // If last attempt and rate limited, try fallback instead of throwing
      if (attempt === maxRetries && (response.status === 429 || response.status === 529)) {
        console.warn(`[${context}] ⚠️ OpenRouter rate limited after ${maxRetries} attempts`);
        break; // Exit loop to trigger fallback
      }

      throw lastError;

    } catch (error) {
      lastError = error;

      // Last attempt failed - try fallback or throw
      if (attempt === maxRetries) {
        console.error(`[${context}] ❌ All ${maxRetries} attempts failed:`, error.message);
        break; // Exit loop to trigger fallback
      }

      // Network error or timeout - retry with backoff
      if (error.message.includes('fetch') || error.message.includes('timeout')) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[${context}] 🔄 Network error on attempt ${attempt}, retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }

      // Other error - don't retry, try fallback immediately
      break;
    }
  }

  // ✅ FALLBACK TO ANTHROPIC if enabled and OpenRouter failed
  if (enableFallback && lastError) {
    console.log(`[${context}] 🔄 OpenRouter failed, attempting Anthropic fallback...`);

    try {
      // Extract prompt from requestBody
      const userMessage = requestBody.messages?.find(m => m.role === 'user');
      const systemMessage = requestBody.messages?.find(m => m.role === 'system');

      if (!userMessage?.content) {
        throw new Error('No user message found in request body for fallback');
      }

      const fallbackResult = await fallbackToAnthropic(
        userMessage.content,
        systemMessage?.content || '',
        requestBody.model,
        requestBody.max_tokens || 2000
      );

      // Transform Anthropic response to match OpenRouter format
      return {
        choices: [{
          message: {
            role: 'assistant',
            content: fallbackResult.data
          }
        }],
        provider: 'anthropic_fallback',
        model: 'claude-haiku-4-20250514'
      };

    } catch (fallbackError) {
      console.error(`[${context}] ❌ Anthropic fallback also failed:`, fallbackError.message);
      throw new Error(`Both OpenRouter and Anthropic failed. OpenRouter: ${lastError.message}. Anthropic: ${fallbackError.message}`);
    }
  }

  // No fallback enabled or no error - throw original error
  throw lastError || new Error(`[${context}] Maximum retry attempts (${maxRetries}) exceeded`);
}

/**
 * Fallback to Anthropic SDK when OpenRouter fails
 *
 * @param {String} prompt - User prompt
 * @param {String} systemPrompt - System prompt
 * @param {String} model - Model identifier (e.g., 'anthropic/claude-haiku-4.5')
 * @param {Number} maxTokens - Max tokens in response
 * @returns {Object} { success: true, data: parsed_response }
 */
export async function fallbackToAnthropic(prompt, systemPrompt, model, maxTokens = 2000) {
  try {
    console.log('🔄 Falling back to Anthropic SDK...');

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // ✅ Use Haiku 4.5 for Anthropic Direct (matches Sonnet 4 performance, faster, cheaper)
    const anthropicModel = 'claude-haiku-4-20250514';

    const message = await anthropic.messages.create({
      model: anthropicModel,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    console.log('✅ Anthropic fallback succeeded');

    return {
      success: true,
      data: responseText,
      provider: 'anthropic_fallback'
    };

  } catch (error) {
    console.error('❌ Anthropic fallback failed:', error.message);
    throw new Error(`Both OpenRouter and Anthropic failed: ${error.message}`);
  }
}

export default { callOpenRouterWithRetry, fallbackToAnthropic };
