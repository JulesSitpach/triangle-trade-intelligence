/**
 * Database-Driven USMCA Compliance
 * POST /api/database-driven-usmca-compliance
 *
 * ✅ AI-powered product classification with HS code lookup
 * ✅ Returns detailed tariff rates and USMCA eligibility for each match
 * ✅ Supports action: 'classify_product' with product description, business type, and source country
 */

import { protectedApiHandler } from '../../lib/api/apiHandler';
import { BaseAgent } from '../../lib/agents/base-agent';
import { applyRateLimit, apiLimiter } from '../../lib/security/rateLimiter.js';

const baseAgent = new BaseAgent();

export default protectedApiHandler({
  POST: async (req, res) => {
    // 🛡️ RATE LIMITING: 60 requests per minute for database operations
    try {
      await applyRateLimit(apiLimiter)(req, res);
    } catch (error) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait before making another request.',
        retry_after: 60 // seconds
      });
    }

    try {
      const { action, data } = req.body;

      // ✅ VALIDATION: Fail loudly with missing action
      if (!action) {
        return res.status(400).json({
          success: false,
          error: 'action is required (e.g., "classify_product")'
        });
      }

      // Handle product classification
      if (action === 'classify_product') {
        const { product_description, business_type, source_country } = data || {};

        // ✅ VALIDATION: Fail loudly with missing required fields
        if (!product_description) {
          return res.status(400).json({
            success: false,
            error: 'product_description is required in data object'
          });
        }

        if (!business_type) {
          return res.status(400).json({
            success: false,
            error: 'business_type is required in data object'
          });
        }

        if (!source_country) {
          return res.status(400).json({
            success: false,
            error: 'source_country is required in data object (e.g., "US", "CN", "MX")'
          });
        }

        try {
          // Use AI to classify the product and return HS codes with tariff data
          const classificationResult = await baseAgent.runWithFallback(
            'anthropic/claude-3.5-haiku',
            `You are a trade classification expert. Classify the product and return HS codes with tariff information.

Product: ${product_description}
Business Type: ${business_type}
Source Country: ${source_country}

Respond in JSON format with:
{
  "results": [
    {
      "hs_code": "xxxxxxxx",
      "product_description": "description",
      "usmca_eligible": true/false,
      "mfn_tariff_rate": 0.0,
      "usmca_tariff_rate": 0.0,
      "confidenceScore": 0.85
    }
  ]
}

Return 3-8 possible classifications in order of confidence.`,
            { max_tokens: 1500 }
          );

          // Parse AI response
          let parsedResult;
          try {
            // Try to parse as direct JSON
            parsedResult = JSON.parse(classificationResult);
          } catch (e) {
            // Try to extract JSON from response text
            const jsonMatch = classificationResult.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsedResult = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('Could not parse classification response as JSON');
            }
          }

          // Validate response structure
          if (!parsedResult.results || !Array.isArray(parsedResult.results)) {
            return res.status(200).json({
              success: true,
              results: [
                {
                  hs_code: '9999.99.99',
                  product_description: product_description,
                  usmca_eligible: false,
                  mfn_tariff_rate: 0,
                  usmca_tariff_rate: 0,
                  confidenceScore: 0.3,
                  note: 'Could not classify product - please verify HS code manually'
                }
              ]
            });
          }

          // Ensure all results have required fields
          const results = parsedResult.results.map((result, index) => ({
            hs_code: result.hs_code || '9999.99.99',
            product_description: result.product_description || product_description,
            usmca_eligible: result.usmca_eligible !== undefined ? result.usmca_eligible : false,
            mfn_tariff_rate: typeof result.mfn_tariff_rate === 'number' ? result.mfn_tariff_rate : 0,
            usmca_tariff_rate: typeof result.usmca_tariff_rate === 'number' ? result.usmca_tariff_rate : 0,
            confidenceScore: typeof result.confidenceScore === 'number' ? result.confidenceScore : (0.9 - index * 0.1),
            source_country: source_country
          }));

          return res.status(200).json({
            success: true,
            results: results,
            classification_method: 'ai_powered',
            business_type: business_type,
            source_country: source_country
          });

        } catch (aiError) {
          console.error('AI classification error:', aiError);

          // Return fallback classification
          return res.status(200).json({
            success: true,
            results: [
              {
                hs_code: '9999.99.99',
                product_description: product_description,
                usmca_eligible: false,
                mfn_tariff_rate: 0,
                usmca_tariff_rate: 0,
                confidenceScore: 0.3,
                note: 'AI service temporarily unavailable - please verify HS code manually'
              }
            ],
            warning: 'Using fallback classification due to AI service issue'
          });
        }
      }

      // Unknown action
      return res.status(400).json({
        success: false,
        error: `Unknown action: ${action}. Supported actions: classify_product`
      });

    } catch (error) {
      console.error('USMCA compliance check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process USMCA compliance request'
      });
    }
  }
});
