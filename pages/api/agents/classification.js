// UPGRADED Classification Agent API - Database-backed classification cache
// Uses ClassificationAgent for HS code suggestions
// SUBSCRIPTION-AWARE: Integrates subscription validation and usage tracking

import { ClassificationAgent } from '../../../lib/agents/classification-agent.js';
import { addSubscriptionContext } from '../../../lib/services/subscription-service.js';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cache key normalization (lowercase + trim for consistent lookups)
function getCacheKey(productDescription) {
  return productDescription.toLowerCase().trim();
}

function extractShortDescription(explanation, productDescription) {
  if (!explanation) return productDescription || 'Product classification';

  // Extract first text in single quotes (OpenRouter format: "HS code 8413.91.90 'Parts of pumps for liquids'")
  const quoteMatch = explanation.match(/'([^']+)'/);
  if (quoteMatch) {
    return quoteMatch[1].trim();
  }

  // Fallback
  return productDescription || 'Product classification';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    await DevIssue.validationError('classification_api', 'http_method', req.method, { endpoint: '/api/agents/classification' });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { action, productDescription, hsCode, componentOrigins, additionalContext, userId } = req.body;

    // ✅ FIX: Extract userId from multiple sources
    // Priority: 1. Request body, 2. Query params, 3. Auth header (JWT)
    let authenticatedUserId = userId;

    if (!authenticatedUserId) {
      // Try to extract from Authorization header if present (JWT token)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // In production, would decode JWT; for now log that auth exists
        authenticatedUserId = 'authenticated-via-header';
      }
    }

    if (!authenticatedUserId && req.query?.userId) {
      authenticatedUserId = req.query.userId;
    }

    // Add user context for subscription validation
    req.user = { id: authenticatedUserId };

    console.log(`[SUBSCRIPTION-AWARE AGENT] ${action} request for: "${productDescription}" (User: ${authenticatedUserId || 'anonymous'})`);

    // Use AI-powered ClassificationAgent for HS code suggestions
    if (action === 'suggest_hs_code' && productDescription) {
      // ✅ CHECK DATABASE CACHE FIRST - Avoid 13-second AI calls for repeated requests
      const cacheKey = getCacheKey(productDescription);

      const { data: cached, error: cacheError } = await supabase
        .from('hs_code_classifications')
        .select('*')
        .ilike('component_description', cacheKey)
        .single();

      if (cached && !cacheError) {
        console.log(`💰 Database Cache HIT for "${productDescription.substring(0, 40)}..." (saved ~13 seconds)`);

        // Transform database record to API response format
        // ✅ SAFETY: Ensure all fields are strings (database might have JSONB)
        const safeExplanation = typeof cached.explanation === 'string' ? cached.explanation : JSON.stringify(cached.explanation || '');

        // ✅ SAFETY: Normalize cached alternative_codes (old data might have unnormalized objects)
        const cachedAlternativeCodes = (cached.alternative_codes || []).map(alt => ({
          code: typeof alt.code === 'string' ? alt.code : String(alt.code || ''),
          confidence: Number(alt.confidence) || 0,
          reason: typeof alt.reason === 'string' ? alt.reason : JSON.stringify(alt.reason || 'Alternative classification option')
        }));

        const cachedResponse = {
          success: true,
          classification: {
            hsCode: cached.hs_code,
            description: cached.hs_description,
            confidence: `${cached.confidence}%`,
            verification_status: cached.verified ? 'human_verified' : 'ai_generated',
            usmca_qualification: 'possible'
          },
          enhanced_features: {
            alternative_codes: cachedAlternativeCodes,
            required_documentation: [],
            reasoning: safeExplanation
          },
          agent_metadata: {
            processing_time_ms: Date.now() - startTime,
            agent_version: 'database_cache',
            confidence_threshold_met: cached.confidence >= 75,
            database_match: true,
            cache_hit: true,
            cached_at: cached.created_at
          },
          data: {
            hsCode: cached.hs_code,
            description: cached.hs_description,
            confidence: cached.confidence,
            explanation: safeExplanation,
            reasoning: safeExplanation,
            source: cached.verified ? 'Human Expert' : 'AI Classification Agent (Cached)'
          }
        };

        return res.json(await addSubscriptionContext(req, cachedResponse, 'classification'));
      }

      console.log(`⏳ Database Cache MISS - Making AI call for "${productDescription.substring(0, 40)}..."`);
      const agent = new ClassificationAgent();
      const aiResult = await agent.suggestHSCode(productDescription, componentOrigins, additionalContext);

      if (!aiResult.success) {
        await logDevIssue({
          type: 'api_error',
          severity: 'critical',
          component: 'classification_api',
          message: 'AI classification failed',
          data: {
            productDescription,
            error: aiResult.error,
            userId,
            componentOrigins
          }
        });
        return res.status(500).json({
          success: false,
          error: 'AI classification failed',
          message: aiResult.error
        });
      }

      // Transform AI result to match UI expectations
      // CLASSIFICATION ONLY - NO TARIFF RATES (separation of concerns)

      // ✅ NORMALIZE usmcaQualification - AI might return object or string
      let usmcaQualificationString = 'possible';
      if (typeof aiResult.data.usmcaQualification === 'string') {
        usmcaQualificationString = aiResult.data.usmcaQualification;
      } else if (typeof aiResult.data.usmcaQualification === 'object') {
        // AI returned detailed object - extract status or default to 'possible'
        usmcaQualificationString = aiResult.data.usmcaQualification?.status || 'possible';
      }

      // ✅ SAFETY: Normalize alternative_codes array (AI might return objects in reason field)
      const safeAlternativeCodes = (aiResult.data.alternative_codes || []).map(alt => ({
        code: typeof alt.code === 'string' ? alt.code : String(alt.code || ''),
        confidence: Number(alt.confidence) || 0,
        reason: typeof alt.reason === 'string' ? alt.reason : JSON.stringify(alt.reason || 'Alternative classification option')
      }));

      // 🚨 CRITICAL FIX: Ensure PRIMARY HS code is always the HIGHEST confidence option
      // For financial compliance, the most confident classification must be primary
      let primary_hs_code = aiResult.data.hs_code;
      let primaryConfidence = Number(aiResult.data.confidence) || 0;
      let finalAlternativeCodes = [...safeAlternativeCodes];

      // Check if any alternative code has higher confidence than the primary
      const allCodes = [
        { code: primary_hs_code, confidence: primaryConfidence, isOriginalPrimary: true },
        ...finalAlternativeCodes
      ];

      const sortedByConfidence = allCodes.sort((a, b) => b.confidence - a.confidence);
      const highestConfidenceCode = sortedByConfidence[0];

      // If highest confidence is NOT the original primary, swap them
      if (highestConfidenceCode.code !== primary_hs_code) {
        console.warn(`⚠️ CLASSIFICATION PRIORITY FIX: Highest confidence code (${highestConfidenceCode.code} at ${highestConfidenceCode.confidence}%) was not primary. Swapping with original primary (${primary_hs_code} at ${primaryConfidence}%). This is a critical fix for compliance accuracy.`);

        primary_hs_code = highestConfidenceCode.code;
        primaryConfidence = highestConfidenceCode.confidence;

        // Rebuild alternatives without the new primary
        finalAlternativeCodes = sortedByConfidence
          .filter(item => item.code !== primaryHSCode)
          .map(item => ({
            code: item.code,
            confidence: item.confidence,
            reason: item.isOriginalPrimary
              ? `Previously selected as primary (${primaryConfidence}% confidence). However, ${primaryHSCode} has higher confidence (${item.confidence}%).`
              : item.reason
          }));
      }

      // Sort final alternatives by confidence (highest first) for display
      finalAlternativeCodes.sort((a, b) => b.confidence - a.confidence);

      // ✅ SAFETY: Normalize requiredDocumentation (ensure all strings)
      const safeDocumentation = (aiResult.data.requiredDocumentation || []).map(doc =>
        typeof doc === 'string' ? doc : JSON.stringify(doc)
      );

      const response = {
        success: true,

        // Main classification result (what UI expects)
        classification: {
          hsCode: primaryHSCode,
          description: aiResult.data.description || `HS Code ${primaryHSCode}`,
          confidence: `${Math.round(primaryConfidence)}%`,
          verification_status: aiResult.data.databaseMatch ? 'database_verified' : 'ai_generated',
          usmca_qualification: usmcaQualificationString
        },

        // Additional AI insights
        enhanced_features: {
          alternative_codes: finalAlternativeCodes,
          required_documentation: safeDocumentation,
          reasoning: typeof aiResult.data.explanation === 'string' ? aiResult.data.explanation : JSON.stringify(aiResult.data.explanation || '')
        },

        // Agent metadata for debugging/monitoring
        agent_metadata: {
          processing_time_ms: Date.now() - startTime,
          agent_version: 'ai_classification_agent',
          confidence_threshold_met: primaryConfidence >= 75,
          database_match: aiResult.data.databaseMatch || false,
          classification_priority_adjusted: primary_hs_code !== aiResult.data.hs_code
        },

        // Backward compatibility data
        data: {
          hs_code: primary_hs_code,
          description: aiResult.data.description || extractShortDescription(aiResult.data.explanation, productDescription),
          confidence: Math.round(primaryConfidence),
          explanation: typeof aiResult.data.explanation === 'string' ? aiResult.data.explanation : JSON.stringify(aiResult.data.explanation || ''),
          reasoning: typeof aiResult.data.explanation === 'string' ? aiResult.data.explanation : JSON.stringify(aiResult.data.explanation || ''),
          source: 'AI Classification Agent',
          alternative_codes: finalAlternativeCodes
        }
      };

      console.log(`[AI AGENT] Classification result: ${primary_hs_code} (${primaryConfidence}% confidence)${primary_hs_code !== aiResult.data.hs_code ? ' [CORRECTED from ' + aiResult.data.hs_code + ']' : ''}`);

      // Add subscription context to the response
      const responseWithSubscription = await addSubscriptionContext(req, response, 'classification');

      // ✅ SAVE TO DATABASE - Build permanent classification cache
      const safeExplanationForDB = typeof aiResult.data.explanation === 'string'
        ? aiResult.data.explanation
        : JSON.stringify(aiResult.data.explanation || '');

      const { error: saveError } = await supabase
        .from('hs_code_classifications')
        .insert({
          component_description: cacheKey,
          hs_code: primaryHSCode,
          hs_description: aiResult.data.description || extractShortDescription(aiResult.data.explanation, productDescription),
          confidence: Math.round(primaryConfidence),
          explanation: safeExplanationForDB,
          alternative_codes: finalAlternativeCodes,  // ✅ Use corrected sorted alternatives
          source: 'ai_agent',
          verified: false
        });

      if (saveError) {
        console.error(`⚠️ Failed to save classification to database:`, saveError.message);
        // Don't fail the request - classification still succeeded
      } else {
        console.log(`💾 Saved classification to database for "${productDescription.substring(0, 40)}..." - next request will be instant!`);
      }

      return res.status(200).json(responseWithSubscription);
    }

    // Fallback to original agent for legacy actions
    console.log(`[FALLBACK] Using original agent for action: ${action}`);

    const agent = new ClassificationAgent();

    switch (action) {
      case 'search_similar':
        if (!productDescription) {
          await DevIssue.missingData('classification_api', 'productDescription', { action, userId });
          return res.status(400).json({ error: 'productDescription required' });
        }

        const similarCodes = await agent.searchSimilarHSCodes(productDescription);
        const similarResponse = {
          success: true,
          data: similarCodes
        };
        const similarWithSubscription = await addSubscriptionContext(req, similarResponse, 'classification');
        return res.status(200).json(similarWithSubscription);

      default:
        return res.status(400).json({
          error: 'Invalid action',
          validActions: ['suggest_hs_code', 'search_similar']
        });
    }

  } catch (error) {
    console.error('[ENHANCED CLASSIFICATION API] Error:', error);

    await DevIssue.apiError('classification_api', '/api/agents/classification', error, {
      action: req.body.action,
      userId: req.body.userId,
      productDescription: req.body.productDescription
    });

    return res.status(500).json({
      error: 'Classification processing failed',
      message: error.message,
      agent_metadata: {
        processing_time_ms: Date.now() - startTime,
        agent_version: 'enhanced_with_web_search',
        error_type: error.constructor.name,
        fallback_available: true
      }
    });
  }
}