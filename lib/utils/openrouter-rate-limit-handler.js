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
 * Call OpenRouter API with automatic retry on rate limits
 *
 * @param {Object} requestBody - OpenRouter API request body
 * @param {Number} maxRetries - Maximum retry attempts (default: 3)
 * @param {String} context - Context for logging (default: 'OpenRouter')
 * @returns {Object} Response data from OpenRouter
 * @throws {Error} If all retries fail
 */
export async function callOpenRouterWithRetry(requestBody, maxRetries = 3, context = 'OpenRouter') {
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

      // ❌ OTHER ERROR: Throw immediately
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);

    } catch (error) {
      // Last attempt failed - throw error
      if (attempt === maxRetries) {
        console.error(`[${context}] ❌ All ${maxRetries} attempts failed:`, error.message);
        throw error;
      }

      // Network error or timeout - retry with backoff
      if (error.message.includes('fetch') || error.message.includes('timeout')) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[${context}] 🔄 Network error on attempt ${attempt}, retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }

      // Other error - don't retry
      throw error;
    }
  }

  throw new Error(`[${context}] Maximum retry attempts (${maxRetries}) exceeded`);
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

    // Convert OpenRouter model format to Anthropic format
    const anthropicModel = model.includes('haiku')
      ? 'claude-haiku-4-20250514'
      : 'claude-sonnet-4-20250514';

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
