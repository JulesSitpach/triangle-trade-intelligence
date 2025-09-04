/**
 * DATA PROVENANCE API ENDPOINT
 * Focused API for data source verification and provenance tracking
 * Extracted from monolithic trusted-compliance-workflow.js
 * 
 * Supports data transparency and source reliability assessment
 */

import { dataProvenanceService } from '../../../lib/services/data-provenance-service.js';
import { continuousVerificationService } from '../../../lib/services/continuous-verification-service.js';
import { expertEndorsementSystem } from '../../../lib/services/expert-endorsement-system.js';
import { SYSTEM_CONFIG, MESSAGES } from '../../../config/system-config.js';
import { logInfo, logError, logRequest, logPerformance } from '../../../lib/utils/production-logger.js';

export default async function handler(req, res) {
  const startTime = Date.now();
  let operation = 'unknown';

  // Set trust-building headers
  res.setHeader('X-Data-Provenance-API', 'active');
  res.setHeader('X-Source-Transparency', 'enabled');
  res.setHeader('X-Verification-Available', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed_methods: ['POST'],
      api_purpose: 'Data provenance verification and source transparency'
    });
  }

  // Configuration-driven timeout
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      logError('Data provenance API timeout', { timeout: SYSTEM_CONFIG.api.timeout });
      res.status(408).json({
        success: false,
        error: MESSAGES.errors.timeoutError,
        trust_status: 'verification_timeout',
        fallback: 'Contact support for manual data verification'
      });
    }
  }, SYSTEM_CONFIG.api.timeout);

  try {
    const { action, data } = req.body;
    operation = action || 'unknown_action';

    logInfo('Data provenance API request', { action, ip: req.ip });

    // Validate request
    if (!action || !data) {
      clearTimeout(timeoutId);
      return res.status(400).json({
        success: false,
        error: 'Invalid request format',
        required_fields: ['action', 'data'],
        supported_actions: [
          'verify_data_sources',
          'get_provenance_report',
          'check_verification_status',
          'validate_source_agreement'
        ]
      });
    }

    let result;
    switch (action) {
      case 'verify_data_sources':
        result = await handleDataSourceVerification(data);
        break;
      
      case 'get_provenance_report':
        result = await handleProvenanceReport(data);
        break;
      
      case 'check_verification_status':
        result = await handleVerificationStatus(data);
        break;
      
      case 'validate_source_agreement':
        result = await handleSourceAgreementValidation(data);
        break;

      default:
        clearTimeout(timeoutId);
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
          supported_actions: [
            'verify_data_sources',
            'get_provenance_report', 
            'check_verification_status',
            'validate_source_agreement'
          ]
        });
    }

    clearTimeout(timeoutId);
    
    // Add provenance indicators to all responses
    result.provenance_indicators = {
      api_version: '1.0',
      service_active: true,
      verification_available: true,
      expert_validation_available: true,
      continuous_monitoring: continuousVerificationService.getServiceStatus().running
    };
    result.response_timestamp = new Date().toISOString();
    
    const responseTime = Date.now() - startTime;
    logRequest(req.method, req.url, 200, responseTime, { action, success: true });
    
    return res.status(200).json(result);

  } catch (error) {
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    logError('Data provenance API error', { 
      error: error.message, 
      operation,
      responseTime,
      stack: error.stack 
    });
    
    logRequest(req.method, req.url, 500, responseTime, { operation, success: false });

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Data provenance verification failed',
        technical_error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        fallback: 'Contact support for manual data verification',
        timestamp: new Date().toISOString()
      });
    }
  }
}

/**
 * Verify specific data sources and their reliability
 */
async function handleDataSourceVerification(data) {
  try {
    const { dataType, identifiers, sources } = data;
    
    if (!dataType || !identifiers) {
      return {
        success: false,
        error: 'Missing required fields: dataType and identifiers'
      };
    }

    const verificationResults = [];
    const sourceReliability = {};

    // Process each identifier
    for (const identifier of identifiers) {
      const provenanceData = await dataProvenanceService.getDataWithProvenance(
        dataType,
        identifier
      );

      if (provenanceData.success) {
        verificationResults.push({
          identifier,
          verified: true,
          provenance: provenanceData.provenance,
          trust_score: provenanceData.provenance.confidence_score,
          data_freshness_hours: provenanceData.provenance.age_hours,
          expert_reviews: provenanceData.expert_reviews.length,
          needs_verification: provenanceData.needs_verification
        });

        // Track source reliability
        const source = provenanceData.provenance.primary_source;
        if (!sourceReliability[source]) {
          sourceReliability[source] = {
            source_name: source,
            verified_count: 0,
            avg_confidence: 0,
            confidence_scores: []
          };
        }
        sourceReliability[source].verified_count++;
        sourceReliability[source].confidence_scores.push(provenanceData.provenance.confidence_score);
      } else {
        verificationResults.push({
          identifier,
          verified: false,
          error: provenanceData.error,
          requires_expert_review: provenanceData.requires_expert_review
        });
      }
    }

    // Calculate source reliability averages
    Object.keys(sourceReliability).forEach(source => {
      const scores = sourceReliability[source].confidence_scores;
      sourceReliability[source].avg_confidence = 
        scores.reduce((sum, score) => sum + score, 0) / scores.length;
      sourceReliability[source].reliability_rating = 
        getReliabilityRating(sourceReliability[source].avg_confidence);
    });

    return {
      success: true,
      data_type: dataType,
      verification_summary: {
        total_identifiers: identifiers.length,
        verified_count: verificationResults.filter(r => r.verified).length,
        failed_count: verificationResults.filter(r => !r.verified).length,
        avg_trust_score: calculateAverageTrustScore(verificationResults)
      },
      verification_results: verificationResults,
      source_reliability: Object.values(sourceReliability),
      recommendations: generateVerificationRecommendations(verificationResults)
    };

  } catch (error) {
    logError('Data source verification failed', { error: error.message });
    return {
      success: false,
      error: 'Data source verification failed',
      fallback: 'Manual verification required'
    };
  }
}

/**
 * Generate detailed provenance report for specific data
 */
async function handleProvenanceReport(data) {
  try {
    const { dataType, identifier } = data;
    
    const provenanceData = await dataProvenanceService.getDataWithProvenance(
      dataType,
      identifier
    );
    
    if (!provenanceData.success) {
      return {
        success: false,
        error: provenanceData.error,
        requires_expert_review: provenanceData.requires_expert_review
      };
    }

    // Generate comprehensive provenance report
    const report = {
      success: true,
      data_type: dataType,
      identifier: identifier,
      
      // Source information
      primary_source: {
        name: provenanceData.provenance.primary_source,
        document: provenanceData.provenance.source_document,
        last_verified: provenanceData.provenance.last_verified,
        confidence_score: provenanceData.provenance.confidence_score
      },
      
      // Data quality metrics
      quality_metrics: {
        age_hours: provenanceData.provenance.age_hours,
        verification_count: provenanceData.provenance.verification_count,
        expert_review_count: provenanceData.provenance.expert_review_count,
        expert_approval_rate: provenanceData.provenance.expert_approval_rate,
        cross_source_validated: provenanceData.provenance.cross_source_validated
      },
      
      // Trust assessment
      trust_assessment: {
        overall_trust_score: provenanceData.provenance.confidence_score,
        freshness_score: getFreshnessScore(provenanceData.provenance.age_hours),
        expert_validation_score: getExpertValidationScore(provenanceData.provenance),
        source_authority_score: dataProvenanceService.getSourceConfidence(provenanceData.provenance.primary_source)
      },
      
      // Verification status
      verification_status: {
        needs_verification: provenanceData.needs_verification,
        next_verification_due: provenanceData.provenance.next_verification_due,
        continuous_monitoring: true
      },
      
      // Audit trail
      audit_trail: provenanceData.audit_trail,
      expert_reviews: provenanceData.expert_reviews,
      
      // Trust indicators for UI
      trust_indicators: provenanceData.trust_indicators,
      
      // Source attribution
      source_attribution: `Data verified from ${provenanceData.provenance.primary_source} on ${new Date(provenanceData.provenance.last_verified).toLocaleDateString()}`,
      
      // Recommendations
      recommendations: generateProvenanceRecommendations(provenanceData)
    };

    return report;

  } catch (error) {
    logError('Provenance report generation failed', { error: error.message });
    return {
      success: false,
      error: 'Provenance report generation failed',
      fallback: 'Contact support for manual provenance documentation'
    };
  }
}

/**
 * Check continuous verification service status
 */
async function handleVerificationStatus() {
  try {
    const serviceStatus = continuousVerificationService.getServiceStatus();
    const provenanceStats = dataProvenanceService.getStats();
    
    return {
      success: true,
      continuous_verification: {
        service_running: serviceStatus.running,
        configuration: serviceStatus.configuration,
        thresholds: serviceStatus.thresholds
      },
      provenance_service: {
        active: true,
        cache_size: provenanceStats.cache_size,
        daily_sync_enabled: provenanceStats.daily_sync_enabled,
        weekly_deep_sync: provenanceStats.weekly_deep_sync,
        max_data_age_hours: provenanceStats.max_data_age_hours
      },
      expert_validation: {
        system_active: true,
        auto_approval_threshold: SYSTEM_CONFIG.classification.professionalReferralThreshold
      },
      last_status_check: new Date().toISOString(),
      overall_health: serviceStatus.running ? 'healthy' : 'degraded'
    };

  } catch (error) {
    logError('Verification status check failed', { error: error.message });
    return {
      success: false,
      error: 'Verification status check failed',
      overall_health: 'unknown'
    };
  }
}

/**
 * Validate agreement between multiple sources
 */
async function handleSourceAgreementValidation(data) {
  try {
    const { dataType, identifier, compareSourceTypes } = data;
    
    // Get current data with provenance
    const currentData = await dataProvenanceService.getDataWithProvenance(
      dataType,
      identifier
    );
    
    if (!currentData.success) {
      return {
        success: false,
        error: 'Cannot validate source agreement - primary data not found'
      };
    }

    // Verify data type has multiple source validation
    const verificationResult = await continuousVerificationService.verifyDataType(dataType);
    
    const agreement = {
      success: true,
      data_type: dataType,
      identifier: identifier,
      primary_source: currentData.provenance.primary_source,
      
      // Source agreement analysis
      source_agreement: {
        total_sources_checked: verificationResult.sources?.length || 1,
        agreement_percentage: 100 - (verificationResult.discrepancyPercentage * 100),
        sources_in_agreement: verificationResult.sources || [currentData.provenance.primary_source],
        discrepancies_found: verificationResult.discrepancyFound,
        discrepancy_severity: verificationResult.severity
      },
      
      // Verification details
      verification_details: {
        last_cross_verification: verificationResult.lastVerified,
        affected_records: verificationResult.affectedRecords,
        verification_method: 'automated_cross_source_validation'
      },
      
      // Trust impact
      trust_impact: {
        confidence_adjustment: calculateConfidenceAdjustment(verificationResult),
        requires_expert_review: verificationResult.severity === 'high' || verificationResult.severity === 'critical',
        expert_review_urgency: mapSeverityToUrgency(verificationResult.severity)
      },
      
      // Recommendations
      recommendations: generateSourceAgreementRecommendations(verificationResult)
    };

    return agreement;

  } catch (error) {
    logError('Source agreement validation failed', { error: error.message });
    return {
      success: false,
      error: 'Source agreement validation failed',
      fallback: 'Manual cross-source validation required'
    };
  }
}

/**
 * Helper functions for provenance operations
 */

function getReliabilityRating(confidence) {
  if (confidence >= 0.9) return 'excellent';
  if (confidence >= 0.8) return 'good';
  if (confidence >= 0.7) return 'acceptable';
  return 'needs_improvement';
}

function calculateAverageTrustScore(results) {
  const verifiedResults = results.filter(r => r.verified && r.trust_score);
  if (verifiedResults.length === 0) return 0;
  
  const sum = verifiedResults.reduce((acc, r) => acc + r.trust_score, 0);
  return Math.round((sum / verifiedResults.length) * 100) / 100;
}

function getFreshnessScore(ageHours) {
  if (ageHours <= 24) return 0.95;
  if (ageHours <= 168) return 0.85;
  if (ageHours <= 720) return 0.70;
  return 0.50;
}

function getExpertValidationScore(provenance) {
  if (!provenance.expert_review_count) return 0.5;
  return Math.min(1.0, 0.5 + (provenance.expert_approval_rate * 0.5));
}

function calculateConfidenceAdjustment(verificationResult) {
  if (!verificationResult.discrepancyFound) return 0.05; // Small boost for agreement
  
  const discrepancy = verificationResult.discrepancyPercentage;
  if (discrepancy < 0.05) return 0; // No adjustment for minor discrepancies
  if (discrepancy < 0.1) return -0.1;
  if (discrepancy < 0.2) return -0.2;
  return -0.3; // Major penalty for significant discrepancies
}

function mapSeverityToUrgency(severity) {
  const mapping = {
    'critical': 'immediate',
    'high': 'urgent',
    'medium': 'normal',
    'low': 'routine'
  };
  return mapping[severity] || 'normal';
}

function generateVerificationRecommendations(results) {
  const recommendations = [];
  
  const verifiedCount = results.filter(r => r.verified).length;
  const totalCount = results.length;
  const verificationRate = verifiedCount / totalCount;
  
  if (verificationRate < 0.8) {
    recommendations.push('Low verification rate - consider data quality improvement');
  }
  
  const needsReview = results.filter(r => r.needs_verification?.needed).length;
  if (needsReview > 0) {
    recommendations.push(`${needsReview} items require immediate verification`);
  }
  
  const expertReviewNeeded = results.filter(r => r.requires_expert_review).length;
  if (expertReviewNeeded > 0) {
    recommendations.push(`${expertReviewNeeded} items require expert review`);
  }
  
  return recommendations;
}

function generateProvenanceRecommendations(provenanceData) {
  const recommendations = [];
  
  if (provenanceData.provenance.age_hours > 168) {
    recommendations.push('Data is aging - schedule verification update');
  }
  
  if (provenanceData.provenance.confidence_score < 0.8) {
    recommendations.push('Below optimal confidence - consider expert review');
  }
  
  if (!provenanceData.provenance.cross_source_validated) {
    recommendations.push('Single source data - cross-validate with additional sources');
  }
  
  if (provenanceData.needs_verification.needed) {
    recommendations.push(provenanceData.needs_verification.recommended_action);
  }
  
  return recommendations.length > 0 ? recommendations : ['Data meets quality standards'];
}

function generateSourceAgreementRecommendations(verificationResult) {
  const recommendations = [];
  
  if (verificationResult.discrepancyFound) {
    recommendations.push('Source discrepancies detected - expert review recommended');
  } else {
    recommendations.push('Sources in good agreement - data reliability confirmed');
  }
  
  if (verificationResult.severity === 'critical') {
    recommendations.push('Critical discrepancy - immediate expert intervention required');
  }
  
  if (verificationResult.sources && verificationResult.sources.length < 2) {
    recommendations.push('Consider adding additional verification sources');
  }
  
  return recommendations;
}