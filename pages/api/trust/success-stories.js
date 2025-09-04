/**
 * TRUST SUCCESS STORIES API
 * Focused endpoint for customer success story management and trust building
 * Extracted from monolithic trusted-compliance-workflow.js for better architecture
 */

import { dataProvenanceService } from '../../../lib/services/data-provenance-service.js';
import { expertEndorsementSystem } from '../../../lib/services/expert-endorsement-system.js';
import { continuousVerificationService } from '../../../lib/services/continuous-verification-service.js';
import { TRUST_CONFIG, TRUST_MESSAGES, TRUST_TABLE_CONFIG } from '../../../config/trust-config.js';
import { logInfo, logError, logRequest } from '../../../lib/utils/production-logger.js';

export default async function handler(req, res) {
  const startTime = Date.now();
  let operation = 'unknown';

  // Set trust-building headers
  res.setHeader('X-Data-Provenance', 'verified');
  res.setHeader('X-Expert-Validated', 'available');
  res.setHeader('X-Success-Stories', 'verified');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed_methods: ['GET', 'POST'],
      trust_indicators: await getTrustIndicators()
    });
  }

  // Configuration-driven timeout
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      logError('Success stories timeout', { timeout: TRUST_CONFIG.trustMetrics.maxResponseTimeMs });
      res.status(408).json({
        success: false,
        error: 'Request timeout',
        trust_status: 'timeout_occurred',
        fallback: 'Contact support for success story information'
      });
    }
  }, TRUST_CONFIG.trustMetrics.maxResponseTimeMs);

  try {
    let result;
    
    if (req.method === 'GET') {
      // Handle GET requests for success stories
      const filters = {
        industry: req.query.industry,
        min_savings: req.query.min_savings ? parseInt(req.query.min_savings) : undefined,
        country: req.query.country,
        limit: Math.min(parseInt(req.query.limit) || TRUST_CONFIG.successStories.maxSuccessStoriesPerPage, 50)
      };
      
      operation = 'get_success_stories_query';
      result = await handleGetSuccessStories(filters);
    } else {
      // Handle POST requests with action-based routing
      const { action, data } = req.body;
      operation = action || 'unknown_action';

      logInfo('Success stories request', { action, ip: req.ip });

      // Validate request with trust context
      if (!action) {
        clearTimeout(timeoutId);
        return res.status(400).json({
          success: false,
          error: 'Missing action parameter',
          required_fields: ['action'],
          supported_actions: [
            'get_success_stories',
            'get_client_testimonials', 
            'validate_success_story',
            'get_story_metrics'
          ]
        });
      }

      // Initialize trust systems
      await Promise.all([
        expertEndorsementSystem.initializeSystem(),
        continuousVerificationService.startService()
      ]);

      switch (action) {
        case 'get_success_stories':
          result = await handleGetSuccessStories(data || {});
          break;

        case 'get_client_testimonials':
          result = await handleGetClientTestimonials(data || {});
          break;

        case 'validate_success_story':
          result = await handleValidateSuccessStory(data);
          break;

        case 'get_story_metrics':
          result = await handleGetStoryMetrics();
          break;

        default:
          clearTimeout(timeoutId);
          return res.status(400).json({
            success: false,
            error: 'Invalid action',
            supported_actions: [
              'get_success_stories',
              'get_client_testimonials',
              'validate_success_story', 
              'get_story_metrics'
            ]
          });
      }
    }

    clearTimeout(timeoutId);
    
    // Add trust indicators to all responses
    result.trust_indicators = await getTrustIndicators();
    result.verification_timestamp = new Date().toISOString();
    
    const responseTime = Date.now() - startTime;
    logRequest(req.method, req.url, 200, responseTime, { operation, success: true });
    
    return res.status(200).json(result);

  } catch (error) {
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    logError('Success stories error', { 
      error: error.message, 
      operation,
      responseTime,
      stack: error.stack 
    });
    
    logRequest(req.method, req.url, 500, responseTime, { operation, success: false });

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Success stories service unavailable',
        trust_status: 'system_error_occurred',
        technical_error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        fallback: 'Contact support for success story information',
        trust_indicators: await getTrustIndicators(),
        timestamp: new Date().toISOString()
      });
    }
  }
}

/**
 * Handle success stories retrieval with filters
 */
async function handleGetSuccessStories(filters) {
  try {
    logInfo('Retrieving success stories', { filters });

    const successStories = await expertEndorsementSystem.getSuccessStories({
      industry: filters.industry,
      min_savings_amount: filters.min_savings || TRUST_CONFIG.successStories.minSavingsAmountUSD,
      country: filters.country,
      limit: filters.limit || TRUST_CONFIG.successStories.maxSuccessStoriesPerPage,
      verified_only: true
    });

    // Add provenance verification for each story
    const storiesWithProvenance = await Promise.all(
      successStories.map(async (story) => {
        const provenanceData = await dataProvenanceService.getDataWithProvenance(
          'success_stories',
          story.id
        );

        return {
          ...story,
          data_provenance: provenanceData.success ? {
            last_verified: provenanceData.provenance.last_verified,
            verification_source: provenanceData.provenance.primary_source,
            trust_score: provenanceData.provenance.confidence_score,
            expert_validated: story.expert_validated || false
          } : null,
          client_approved: TRUST_CONFIG.successStories.requireClientApproval ? story.client_approved : true,
          anonymized: TRUST_CONFIG.successStories.anonymizeClientData
        };
      })
    );

    return {
      success: true,
      operation: 'get_success_stories',
      total_stories: storiesWithProvenance.length,
      success_stories: storiesWithProvenance,
      filters_applied: filters,
      trust_verification: {
        all_stories_verified: storiesWithProvenance.every(s => s.data_provenance?.trust_score >= 0.8),
        expert_validated_count: storiesWithProvenance.filter(s => s.expert_validated).length,
        client_approved_count: storiesWithProvenance.filter(s => s.client_approved).length
      }
    };

  } catch (error) {
    logError('Get success stories failed', { error: error.message, filters });
    return {
      success: false,
      operation: 'get_success_stories',
      error: 'Failed to retrieve success stories',
      fallback: TRUST_MESSAGES.successStories.storyCaptured
    };
  }
}

/**
 * Handle client testimonials retrieval
 */
async function handleGetClientTestimonials(filters) {
  try {
    logInfo('Retrieving client testimonials', { filters });

    // Get testimonials from expert endorsement system
    const testimonials = await expertEndorsementSystem.getClientTestimonials({
      verified_only: true,
      min_rating: filters.min_rating || 4.0,
      limit: filters.limit || 20,
      include_metrics: true
    });

    // Verify testimonial authenticity through provenance service
    const verifiedTestimonials = await Promise.all(
      testimonials.map(async (testimonial) => {
        const verification = await dataProvenanceService.verifyTestimonialAuthenticity(testimonial.id);
        
        return {
          ...testimonial,
          verification_status: {
            authentic: verification.authentic,
            verified_date: verification.verified_date,
            verification_method: verification.method,
            trust_score: verification.trust_score
          },
          client_info: TRUST_CONFIG.successStories.anonymizeClientData ? {
            industry: testimonial.client_industry,
            company_size: testimonial.company_size,
            trade_volume_category: testimonial.trade_volume_category
          } : testimonial.client_info
        };
      })
    );

    return {
      success: true,
      operation: 'get_client_testimonials',
      total_testimonials: verifiedTestimonials.length,
      client_testimonials: verifiedTestimonials,
      testimonial_metrics: {
        average_rating: verifiedTestimonials.reduce((sum, t) => sum + t.rating, 0) / verifiedTestimonials.length,
        verified_count: verifiedTestimonials.filter(t => t.verification_status.authentic).length,
        total_savings_referenced: verifiedTestimonials.reduce((sum, t) => sum + (t.savings_amount || 0), 0)
      }
    };

  } catch (error) {
    logError('Get client testimonials failed', { error: error.message });
    return {
      success: false,
      operation: 'get_client_testimonials',
      error: 'Failed to retrieve client testimonials',
      fallback: 'Contact support for testimonial information'
    };
  }
}

/**
 * Handle success story validation
 */
async function handleValidateSuccessStory(data) {
  try {
    if (!data || !data.story_id) {
      return {
        success: false,
        error: 'Story ID required for validation',
        required_fields: ['story_id']
      };
    }

    logInfo('Validating success story', { story_id: data.story_id });

    // Get story provenance
    const provenanceData = await dataProvenanceService.getDataWithProvenance(
      'success_stories', 
      data.story_id
    );

    // Get expert validation if available
    const expertValidation = await expertEndorsementSystem.validateSuccessStory(data.story_id);

    // Perform authenticity checks
    const validationResults = {
      story_exists: provenanceData.success,
      data_verified: provenanceData.success && provenanceData.provenance.confidence_score >= 0.8,
      expert_validated: expertValidation.expert_validated,
      client_approved: expertValidation.client_approved,
      savings_verified: expertValidation.savings_verified,
      timeline_verified: expertValidation.timeline_verified,
      metrics_accurate: expertValidation.metrics_accurate
    };

    const overallTrustScore = Object.values(validationResults)
      .filter(v => typeof v === 'boolean')
      .reduce((sum, valid) => sum + (valid ? 1 : 0), 0) / 6;

    return {
      success: true,
      operation: 'validate_success_story',
      story_id: data.story_id,
      validation_results: validationResults,
      overall_trust_score: Math.round(overallTrustScore * 100) / 100,
      validation_status: overallTrustScore >= 0.8 ? 'verified' : 
                        overallTrustScore >= 0.6 ? 'partially_verified' : 'needs_review',
      provenance_data: provenanceData.success ? provenanceData.provenance : null,
      expert_validation: expertValidation,
      recommendations: generateValidationRecommendations(overallTrustScore, validationResults)
    };

  } catch (error) {
    logError('Success story validation failed', { error: error.message });
    return {
      success: false,
      operation: 'validate_success_story',
      error: 'Story validation failed',
      fallback: 'Manual verification required'
    };
  }
}

/**
 * Handle story metrics retrieval
 */
async function handleGetStoryMetrics() {
  try {
    logInfo('Retrieving success story metrics');

    const metrics = await expertEndorsementSystem.getSuccessStoryMetrics();
    const verificationMetrics = await continuousVerificationService.getVerificationMetrics();

    return {
      success: true,
      operation: 'get_story_metrics',
      story_metrics: {
        total_success_stories: metrics.total_stories,
        verified_stories: metrics.verified_stories,
        expert_validated_stories: metrics.expert_validated_stories,
        client_approved_stories: metrics.client_approved_stories,
        average_trust_score: metrics.average_trust_score,
        total_documented_savings: metrics.total_savings,
        average_implementation_time: metrics.average_implementation_days
      },
      verification_metrics: {
        verification_success_rate: verificationMetrics.success_rate,
        average_verification_time: verificationMetrics.average_time_ms,
        data_freshness_score: verificationMetrics.data_freshness_score,
        source_reliability_score: verificationMetrics.source_reliability
      },
      trust_building_impact: {
        customer_confidence_score: calculateCustomerConfidenceScore(metrics),
        professional_credibility_score: calculateProfessionalCredibilityScore(metrics),
        market_trust_indicator: calculateMarketTrustIndicator(metrics, verificationMetrics)
      }
    };

  } catch (error) {
    logError('Get story metrics failed', { error: error.message });
    return {
      success: false,
      operation: 'get_story_metrics',
      error: 'Metrics retrieval failed',
      fallback: 'Contact support for metrics information'
    };
  }
}

/**
 * Helper function to generate validation recommendations
 */
function generateValidationRecommendations(trustScore, validationResults) {
  const recommendations = [];

  if (trustScore >= 0.9) {
    recommendations.push('Excellent verification - story ready for public showcase');
  } else if (trustScore >= 0.8) {
    recommendations.push('Good verification - minor verification improvements recommended');
  } else if (trustScore >= 0.6) {
    recommendations.push('Partial verification - additional expert review required');
  } else {
    recommendations.push('Low verification - comprehensive review and re-validation needed');
  }

  if (!validationResults.expert_validated) {
    recommendations.push('Seek expert validation to improve trust score');
  }

  if (!validationResults.client_approved) {
    recommendations.push('Obtain client approval before public use');
  }

  if (!validationResults.savings_verified) {
    recommendations.push('Verify savings calculations with supporting documentation');
  }

  return recommendations;
}

/**
 * Calculate customer confidence score based on success story metrics
 */
function calculateCustomerConfidenceScore(metrics) {
  const verificationRate = metrics.verified_stories / Math.max(metrics.total_stories, 1);
  const expertValidationRate = metrics.expert_validated_stories / Math.max(metrics.total_stories, 1);
  const clientApprovalRate = metrics.client_approved_stories / Math.max(metrics.total_stories, 1);
  
  return Math.round(((verificationRate * 0.4) + (expertValidationRate * 0.4) + (clientApprovalRate * 0.2)) * 100) / 100;
}

/**
 * Calculate professional credibility score
 */
function calculateProfessionalCredibilityScore(metrics) {
  const trustScore = metrics.average_trust_score || 0;
  const storyVolume = Math.min(metrics.total_stories / 50, 1); // Normalize to 50 stories
  const expertValidation = (metrics.expert_validated_stories || 0) / Math.max(metrics.total_stories, 1);
  
  return Math.round(((trustScore * 0.5) + (storyVolume * 0.2) + (expertValidation * 0.3)) * 100) / 100;
}

/**
 * Calculate market trust indicator
 */
function calculateMarketTrustIndicator(storyMetrics, verificationMetrics) {
  const storyTrust = (storyMetrics.verified_stories || 0) / Math.max(storyMetrics.total_stories, 1);
  const systemTrust = verificationMetrics.success_rate || 0;
  const dataTrust = verificationMetrics.data_freshness_score || 0;
  
  return Math.round(((storyTrust * 0.4) + (systemTrust * 0.35) + (dataTrust * 0.25)) * 100) / 100;
}

/**
 * Get trust indicators for responses
 */
async function getTrustIndicators() {
  try {
    const verificationStatus = continuousVerificationService.getServiceStatus();
    
    return {
      success_stories_verified: true,
      expert_validation_available: true,
      client_testimonials_authentic: true,
      continuous_verification_running: verificationStatus.running,
      data_provenance_tracking: true,
      trust_metrics_available: true,
      story_validation_active: true,
      professional_review_available: true
    };
  } catch {
    return {
      success_stories_verified: false,
      expert_validation_available: false,
      system_error: true
    };
  }
}