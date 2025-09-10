/**
 * INTELLIGENT CLASSIFICATION API ENDPOINT
 * AI-powered HS code classification with hierarchical matching
 * Generic system for all users and products - NO HARDCODING
 */

import { intelligentHSClassifier } from '../../lib/classification/intelligent-hs-classifier.js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';

export default async function handler(req, res) {
  const startTime = Date.now();

  // CORS headers for cross-origin access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      supportedMethods: ['POST'],
      usage: {
        method: 'POST',
        body: {
          description: 'Product description (required)',
          options: {
            limit: 'Number of results to return (default: 10)',
            knownChapter: 'HS chapter if known (e.g., 85 for electrical)',
            context: {
              businessType: 'Type of business (optional)',
              industry: 'Industry sector (optional)',
              productCategory: 'Product category (optional)'
            }
          }
        }
      }
    });
  }

  try {
    const { description, options = {} } = req.body;

    // Validate input
    if (!description || typeof description !== 'string' || description.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Valid product description required (minimum 3 characters)',
        example: 'copper wire for electrical circuits'
      });
    }

    // Extract classification options
    const classificationOptions = {
      limit: Math.min(20, Math.max(1, parseInt(options.limit) || 10)),
      knownChapter: options.knownChapter ? parseInt(options.knownChapter) : null,
      context: {
        businessType: options.context?.businessType,
        industry: options.context?.industry,
        productCategory: options.context?.productCategory
      }
    };

    logInfo('Intelligent classification request', {
      description: description.substring(0, 100),
      options: classificationOptions
    });

    // Perform intelligent classification
    const result = await intelligentHSClassifier.classifyProduct(description, classificationOptions);

    const responseTime = Date.now() - startTime;

    if (result.success) {
      // Add response metadata
      const response = {
        ...result,
        metadata: {
          responseTimeMs: responseTime,
          timestamp: new Date().toISOString(),
          apiVersion: '2.0',
          classificationApproach: 'ai_powered_hierarchical',
          databaseRecords: '34,476+ government HS codes',
          features: [
            'Semantic phrase matching',
            'Hierarchical chapter analysis', 
            'Product relationship matching',
            'Contextual similarity scoring',
            'Intelligent relevance ranking'
          ]
        }
      };

      logInfo('Intelligent classification completed successfully', {
        description: description.substring(0, 50),
        resultsCount: result.results.length,
        topConfidence: result.results[0]?.confidence || 0,
        responseTime
      });

      return res.json(response);
    } else {
      // Classification failed - return error with fallback suggestions
      logError('Intelligent classification failed', new Error(result.error));
      
      return res.status(500).json({
        success: false,
        error: result.error,
        fallback: {
          suggested: 'Try using the AI classification API',
          endpoint: '/api/ai-classification',
          recommendation: 'Use more specific product descriptions'
        },
        timestamp: new Date().toISOString(),
        responseTimeMs: responseTime
      });
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logError('Intelligent classification API error', error);

    return res.status(500).json({
      success: false,
      error: 'Classification service temporarily unavailable',
      details: error.message,
      timestamp: new Date().toISOString(),
      responseTimeMs: responseTime,
      recommendation: 'Please try again or use the basic search API'
    });
  }
}

/**
 * Helper function to validate and normalize classification options
 */
function validateClassificationOptions(options) {
  const validated = {
    limit: 10,
    knownChapter: null,
    context: {}
  };

  if (options.limit) {
    const limit = parseInt(options.limit);
    if (limit > 0 && limit <= 50) {
      validated.limit = limit;
    }
  }

  if (options.knownChapter) {
    const chapter = parseInt(options.knownChapter);
    if (chapter >= 1 && chapter <= 99) {
      validated.knownChapter = chapter;
    }
  }

  if (options.context) {
    if (typeof options.context.businessType === 'string') {
      validated.context.businessType = options.context.businessType.trim();
    }
    
    if (typeof options.context.industry === 'string') {
      validated.context.industry = options.context.industry.trim();
    }
    
    if (typeof options.context.productCategory === 'string') {
      validated.context.productCategory = options.context.productCategory.trim();
    }
  }

  return validated;
}

/**
 * Helper function to enhance results with additional metadata
 */
function enhanceResults(results, originalDescription) {
  return results.map((result, index) => ({
    ...result,
    rank: index + 1,
    confidenceLevel: getConfidenceLevel(result.confidence),
    tradeRelevance: calculateTradeRelevance(result),
    usageRecommendation: getUsageRecommendation(result.confidence, result.matchType)
  }));
}

function getConfidenceLevel(confidence) {
  if (confidence >= 90) return 'very_high';
  if (confidence >= 80) return 'high';
  if (confidence >= 70) return 'good';
  if (confidence >= 60) return 'moderate';
  if (confidence >= 40) return 'low';
  return 'very_low';
}

function calculateTradeRelevance(result) {
  let relevance = 'standard';
  
  if (result.usmcaRate < result.mfnRate) {
    relevance = 'usmca_advantageous';
  }
  
  if (result.mfnRate > 10) {
    relevance = 'high_tariff_risk';
  }
  
  if (result.mfnRate === 0) {
    relevance = 'duty_free';
  }
  
  return relevance;
}

function getUsageRecommendation(confidence, matchType) {
  if (confidence >= 85) {
    return 'Highly recommended - use with confidence';
  }
  
  if (confidence >= 70) {
    return 'Good match - verify details before use';
  }
  
  if (confidence >= 50) {
    return 'Possible match - requires professional validation';
  }
  
  return 'Low confidence - consider consulting a customs broker';
}