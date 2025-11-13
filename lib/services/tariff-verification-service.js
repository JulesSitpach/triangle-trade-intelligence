/**
 * Tariff Verification Service - Smart Multi-Source Verification
 *
 * Tries multiple sources in order of preference:
 * 1. USITC DataWeb API (free, official, government-verified)
 * 2. AI Research (OpenRouter/Anthropic, ~$0.02, accurate)
 *
 * This ensures maximum uptime and accuracy by falling back when APIs are down.
 *
 * Usage:
 * ```javascript
 * import { verifyTariffRates } from './lib/services/tariff-verification-service.js';
 * const result = await verifyTariffRates('8534310000', 'Printed circuit board assembly');
 * ```
 */

import { usitcDataWebAPI } from './usitc-dataweb-api.js';
import { BaseAgent } from '../agents/base-agent.js';
import { logInfo, logError, logWarn } from '../utils/production-logger.js';

/**
 * Verify tariff rates using USITC API with AI fallback
 *
 * @param {string} hsCode - HS code to verify (6, 8, or 10 digits)
 * @param {string} description - Component description (for AI context)
 * @param {string} origin - Country of origin (optional, for better AI context)
 * @returns {object} { hts8, description, mfn_rate, usmca_rate, data_source, confidence }
 */
export async function verifyTariffRates(hsCode, description, origin = null) {
  const normalizedHS = hsCode.replace(/[.\s]/g, '').substring(0, 8);

  logInfo(`🔍 [TARIFF-VERIFY] Starting verification for ${normalizedHS}`);

  // TIER 1: Try USITC DataWeb API (free, official)
  try {
    const usitcResult = await usitcDataWebAPI.verifyAndGetTariffRates(hsCode);

    if (usitcResult) {
      logInfo(`✅ [TARIFF-VERIFY] USITC verified ${usitcResult.hts8}`);
      return {
        ...usitcResult,
        data_source: 'USITC DataWeb API (Government Official)',
        confidence: 0.98, // 98% confidence - government verified
        tier: 'usitc',
        cost: 0.00
      };
    }
  } catch (error) {
    // USITC failed - check if it's a temporary outage
    if (error.message.includes('503')) {
      logWarn(`⚠️  [TARIFF-VERIFY] USITC API unavailable (503) - falling back to AI`);
    } else if (error.message.includes('500')) {
      logWarn(`⚠️  [TARIFF-VERIFY] USITC API error (500) - falling back to AI`);
    } else {
      logWarn(`⚠️  [TARIFF-VERIFY] USITC API failed - falling back to AI`, { error: error.message });
    }
  }

  // TIER 2: Fall back to AI Research (OpenRouter → Anthropic)
  logInfo(`🤖 [TARIFF-VERIFY] Falling back to AI research for ${normalizedHS}`);

  try {
    const aiResult = await researchTariffRatesWithAI(normalizedHS, description, origin);

    if (aiResult) {
      logInfo(`✅ [TARIFF-VERIFY] AI verified ${aiResult.hts8} with ${(aiResult.confidence * 100).toFixed(0)}% confidence`);
      return {
        ...aiResult,
        tier: 'ai',
        cost: 0.02 // Approximate AI cost
      };
    }
  } catch (error) {
    logError(`❌ [TARIFF-VERIFY] AI research failed for ${normalizedHS}`, { error: error.message });
  }

  // TIER 3: Complete failure - return null
  logError(`❌ [TARIFF-VERIFY] All verification methods failed for ${normalizedHS}`);
  return null;
}

/**
 * Research tariff rates using AI (OpenRouter → Anthropic fallback)
 *
 * @param {string} hsCode - 8-digit HTS code
 * @param {string} description - Component description
 * @param {string} origin - Country of origin
 * @returns {object} Tariff rate data from AI
 */
async function researchTariffRatesWithAI(hsCode, description, origin) {
  const prompt = `You are a customs tariff specialist. Research the official US tariff rates for this product:

HS Code: ${hsCode}
Description: ${description}
${origin ? `Origin: ${origin}` : ''}

Provide the following information:
1. Official 8-digit HTS code (US tariff schedule)
2. Brief product description
3. MFN (Most Favored Nation) tariff rate as decimal (e.g., 0.057 for 5.7%)
4. USMCA preferential tariff rate as decimal
5. Confidence level (0.0 to 1.0)

Respond ONLY with valid JSON in this exact format:
{
  "hts8": "85343100",
  "description": "Multilayer printed circuits",
  "mfn_rate": 0.0,
  "usmca_rate": 0.0,
  "confidence": 0.88,
  "data_source": "AI Research (OpenRouter/Anthropic)",
  "notes": "Based on HTS 2025 schedule"
}`;

  const agent = new BaseAgent({
    model: 'anthropic/claude-3.5-haiku',
    maxTokens: 1000
  });

  try {
    const response = await agent.execute(prompt, { temperature: 0.1 });

    // BaseAgent returns { success, data, ... }
    if (!response.success || !response.data) {
      throw new Error('AI response did not succeed');
    }

    const result = response.data;

    // Validate required fields
    if (!result.hts8 || result.mfn_rate === undefined || result.usmca_rate === undefined) {
      throw new Error('AI response missing required fields');
    }

    // Ensure rates are numbers
    result.mfn_rate = parseFloat(result.mfn_rate);
    result.usmca_rate = parseFloat(result.usmca_rate);
    result.confidence = parseFloat(result.confidence || 0.75);

    return result;

  } catch (error) {
    logError('AI tariff research failed', { error: error.message });
    throw error;
  }
}

/**
 * Check if USITC API is available
 *
 * Quick health check before attempting verification
 * @returns {boolean} true if USITC is responding
 */
export async function isUSITCAvailable() {
  try {
    // Try a simple known code (aluminum - 76109000)
    const result = await usitcDataWebAPI.verifyAndGetTariffRates('76109000');
    return result !== null;
  } catch (error) {
    return false;
  }
}

export default {
  verifyTariffRates,
  isUSITCAvailable
};
