// UPGRADED Classification Agent API - Now with Web Search & Database Updates
// Enhanced with EnhancedClassificationAgent for primary HS code suggestions
// SUBSCRIPTION-AWARE: Integrates subscription validation and usage tracking

import EnhancedClassificationAgent from '../../../lib/agents/enhanced-classification-agent.js';
import { ClassificationAgent } from '../../../lib/agents/classification-agent.js'; // Fallback
import { addSubscriptionContext } from '../../../lib/services/subscription-service.js';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue.js';

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

    // Add user context for subscription validation
    req.user = { id: userId };

    console.log(`[SUBSCRIPTION-AWARE AGENT] ${action} request for: "${productDescription}" (User: ${userId || 'anonymous'})`);

    // Use AI-powered ClassificationAgent for HS code suggestions
    if (action === 'suggest_hs_code' && productDescription) {
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
      const response = {
        success: true,

        // Main classification result (what UI expects)
        classification: {
          hsCode: aiResult.data.hsCode,
          description: aiResult.data.description || `HS Code ${aiResult.data.hsCode}`,
          confidence: `${Math.round(aiResult.data.confidence || 0)}%`,
          verification_status: aiResult.data.databaseMatch ? 'database_verified' : 'ai_generated',
          usmca_qualification: aiResult.data.usmcaQualification
        },

        // Additional AI insights
        enhanced_features: {
          alternative_codes: aiResult.data.alternativeCodes || [],
          required_documentation: aiResult.data.requiredDocumentation || [],
          reasoning: aiResult.data.explanation
        },

        // Agent metadata for debugging/monitoring
        agent_metadata: {
          processing_time_ms: Date.now() - startTime,
          agent_version: 'ai_classification_agent',
          confidence_threshold_met: (aiResult.data.confidence || 0) >= 75,
          database_match: aiResult.data.databaseMatch || false
        },

        // Backward compatibility data
        data: {
          hsCode: aiResult.data.hsCode,
          description: aiResult.data.description || extractShortDescription(aiResult.data.explanation, productDescription),
          confidence: Math.round(aiResult.data.confidence || 0),
          explanation: aiResult.data.explanation,
          reasoning: aiResult.data.explanation,
          source: 'AI Classification Agent'
        }
      };

      console.log(`[AI AGENT] Classification result: ${aiResult.data.hsCode} (${aiResult.data.confidence}% confidence)`);

      // Add subscription context to the response
      const responseWithSubscription = await addSubscriptionContext(req, response, 'classification');

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