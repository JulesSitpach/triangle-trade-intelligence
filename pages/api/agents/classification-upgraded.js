// UPGRADED Classification Agent API - Now with Web Search & Database Updates
// Replace /api/agents/classification.js with this enhanced version

import EnhancedClassificationAgent from '../../../lib/agents/enhanced-classification-agent.js';
import { ClassificationAgent } from '../../../lib/agents/classification-agent.js'; // Fallback

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { action, productDescription, hsCode, componentOrigins, additionalContext } = req.body;

    console.log(`[UPGRADED AGENT] ${action} request for: "${productDescription}"`);

    // Use Enhanced Agent for primary HS code suggestions
    if (action === 'suggest_hs_code' && productDescription) {
      const enhancedAgent = new EnhancedClassificationAgent();

      const enhancedResult = await enhancedAgent.processRequest({
        product_description: productDescription,
        origin_country: additionalContext?.origin_country || 'MX',
        destination_country: additionalContext?.destination_country || 'US',
        trade_volume: additionalContext?.trade_volume || 100000,
        context: {
          path: req.headers.referer,
          action: action,
          component_origins: componentOrigins,
          user_agent: req.headers['user-agent']
        }
      });

      // Transform enhanced result to match existing UI expectations
      const response = {
        success: true,

        // Main classification result (what UI expects)
        classification: {
          hsCode: enhancedResult.classification?.hs_code,
          description: enhancedResult.classification?.description,
          confidence: enhancedResult.classification?.confidence,
          verification_status: enhancedResult.verification?.database_verified ? 'web_verified' : 'database_only',
          data_freshness: enhancedResult.verification?.last_checked
        },

        // Enhanced capabilities (new features for UI)
        enhanced_features: {
          usmca_analysis: enhancedResult.usmca_analysis,
          data_quality: enhancedResult.data_quality,
          web_verification: {
            performed: enhancedResult.verification?.database_verified || false,
            sources_consulted: enhancedResult.verification?.sources_consulted || 0,
            last_verified: enhancedResult.verification?.last_checked
          }
        },

        // Agent metadata for debugging/monitoring
        agent_metadata: {
          processing_time_ms: Date.now() - startTime,
          web_searches_performed: enhancedResult.verification?.sources_consulted || 0,
          database_updated: true,
          agent_version: 'enhanced_with_web_search',
          confidence_threshold_met: (enhancedResult.classification?.confidence || '0%').replace('%', '') >= '75'
        },

        // Backward compatibility data
        data: {
          hsCode: enhancedResult.classification?.hs_code,
          description: enhancedResult.classification?.description,
          confidence: parseFloat(enhancedResult.classification?.confidence?.replace('%', '') || '0') / 100
        }
      };

      console.log(`[UPGRADED AGENT] Enhanced response: ${enhancedResult.classification?.hs_code} (${enhancedResult.classification?.confidence})`);

      return res.status(200).json(response);
    }

    // Fallback to original agent for legacy actions
    console.log(`[FALLBACK] Using original agent for action: ${action}`);

    const agent = new ClassificationAgent();

    switch (action) {
      case 'validate_hs_code':
        if (!hsCode || !productDescription) {
          return res.status(400).json({
            error: 'hsCode and productDescription required'
          });
        }

        const validation = await agent.validateHSCode(hsCode, productDescription);
        return res.status(200).json(validation);

      case 'get_alternatives':
        if (!hsCode || !productDescription) {
          return res.status(400).json({
            error: 'hsCode and productDescription required'
          });
        }

        const alternatives = await agent.getAlternativeClassifications(
          productDescription,
          hsCode
        );
        return res.status(200).json(alternatives);

      case 'search_similar':
        if (!productDescription) {
          return res.status(400).json({ error: 'productDescription required' });
        }

        const similarCodes = await agent.searchSimilarHSCodes(productDescription);
        return res.status(200).json({
          success: true,
          data: similarCodes
        });

      default:
        return res.status(400).json({
          error: 'Invalid action',
          validActions: ['suggest_hs_code', 'validate_hs_code', 'get_alternatives', 'search_similar']
        });
    }

  } catch (error) {
    console.error('[ENHANCED CLASSIFICATION API] Error:', error);

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