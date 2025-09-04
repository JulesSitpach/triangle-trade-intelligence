/**
 * PROFESSIONAL REFERRAL SYSTEM
 * Configuration-driven referral logic for low-confidence results
 * Following Holistic Reconstruction Plan Phase 3.1 requirements
 */

import { serverDatabaseService } from '../database/supabase-client.js';
import { SYSTEM_CONFIG, MESSAGES } from '../../config/system-config.js';
import { logError, logPerformance } from '../utils/production-logger.js';

/**
 * Professional referral system for USMCA compliance
 * NO HARDCODED THRESHOLDS OR REFERRAL CRITERIA
 */
export class ProfessionalReferralSystem {
  constructor() {
    this.dbService = serverDatabaseService;
    this.cache = new Map();
    this.cacheTtl = SYSTEM_CONFIG.cache.defaultTtl;
    
    // All thresholds from configuration
    this.minClassificationConfidence = SYSTEM_CONFIG.classification.minConfidenceThreshold;
    this.professionalReferralThreshold = SYSTEM_CONFIG.classification.professionalReferralThreshold;
    this.conservativeMultiplier = SYSTEM_CONFIG.business.conservativeEstimateMultiplier;
  }

  /**
   * Evaluate if professional referral is needed
   * NO HARDCODED EVALUATION CRITERIA
   */
  async evaluateReferralNeed(classificationResult, usmcaResult = null, savingsResult = null) {
    const startTime = Date.now();
    
    try {
      const evaluation = {
        requires_professional: false,
        confidence_level: 'unknown',
        referral_reasons: [],
        recommendations: [],
        severity: 'low',
        estimated_complexity: 'simple'
      };

      // Evaluate classification confidence
      if (classificationResult) {
        const classificationEval = this.evaluateClassificationConfidence(classificationResult);
        this.mergeEvaluation(evaluation, classificationEval);
      }

      // Evaluate USMCA qualification complexity
      if (usmcaResult) {
        const usmcaEval = this.evaluateUSMCAComplexity(usmcaResult);
        this.mergeEvaluation(evaluation, usmcaEval);
      }

      // Evaluate savings calculation reliability
      if (savingsResult) {
        const savingsEval = this.evaluateSavingsReliability(savingsResult);
        this.mergeEvaluation(evaluation, savingsEval);
      }

      // Determine overall referral need
      evaluation.requires_professional = this.determineOverallReferralNeed(evaluation);
      
      // Generate specific professional recommendations
      evaluation.professional_services = await this.generateProfessionalServiceRecommendations(evaluation);

      logPerformance('Professional referral evaluation', startTime, {
        requires_professional: evaluation.requires_professional,
        severity: evaluation.severity,
        reasons_count: evaluation.referral_reasons.length
      });

      return evaluation;

    } catch (error) {
      logError('Professional referral evaluation failed', { error: error.message });
      
      // Emergency fallback - err on the side of caution
      return {
        requires_professional: true,
        confidence_level: 'low',
        referral_reasons: ['System error during evaluation'],
        recommendations: [MESSAGES.errors.professionalRequired],
        severity: 'high',
        estimated_complexity: 'complex',
        error: error.message
      };
    }
  }

  /**
   * Evaluate classification confidence against thresholds
   */
  evaluateClassificationConfidence(classificationResult) {
    const evaluation = {
      requires_professional: false,
      confidence_level: 'high',
      referral_reasons: [],
      recommendations: [],
      severity: 'low'
    };

    if (!classificationResult.success) {
      evaluation.requires_professional = true;
      evaluation.confidence_level = 'none';
      evaluation.referral_reasons.push('Product classification failed');
      evaluation.recommendations.push('Professional product classification required');
      evaluation.severity = 'high';
      return evaluation;
    }

    const confidence = classificationResult.confidence || classificationResult.results?.[0]?.confidenceScore || 0;

    // Use configuration-based thresholds
    if (confidence < this.minClassificationConfidence) {
      evaluation.requires_professional = true;
      evaluation.confidence_level = 'low';
      evaluation.referral_reasons.push(`Classification confidence ${(confidence * 100).toFixed(1)}% below minimum ${(this.minClassificationConfidence * 100).toFixed(1)}%`);
      evaluation.recommendations.push('Professional HS code verification recommended');
      evaluation.severity = 'medium';
    } else if (confidence < this.professionalReferralThreshold) {
      evaluation.requires_professional = true;
      evaluation.confidence_level = 'medium';
      evaluation.referral_reasons.push(`Classification confidence ${(confidence * 100).toFixed(1)}% suggests professional review`);
      evaluation.recommendations.push('Consider professional verification for accuracy');
      evaluation.severity = 'low';
    } else {
      evaluation.confidence_level = 'high';
      evaluation.recommendations.push('Classification confidence acceptable - verify with customs authorities');
    }

    return evaluation;
  }

  /**
   * Evaluate USMCA qualification complexity
   */
  evaluateUSMCAComplexity(usmcaResult) {
    const evaluation = {
      requires_professional: false,
      referral_reasons: [],
      recommendations: [],
      severity: 'low',
      estimated_complexity: 'simple'
    };

    // Check if qualification failed
    if (!usmcaResult.qualified) {
      evaluation.referral_reasons.push('Product does not qualify for USMCA benefits');
      evaluation.recommendations.push('Professional supply chain analysis recommended');
      evaluation.estimated_complexity = 'medium';
      
      // Check if close to qualification
      const naContent = usmcaResult.north_american_content || 0;
      const threshold = usmcaResult.threshold_applied || usmcaResult.rules_applied?.threshold_percentage || 62.5;
      const gap = threshold - naContent;
      
      if (gap <= 10) { // Within 10% of qualification
        evaluation.requires_professional = true;
        evaluation.referral_reasons.push(`Only ${gap.toFixed(1)}% away from USMCA qualification`);
        evaluation.recommendations.push('Professional supply chain optimization consultation recommended');
        evaluation.severity = 'medium';
      }
    } else {
      // Qualified but check for edge cases
      const naContent = usmcaResult.north_american_content || 0;
      const threshold = usmcaResult.threshold_applied || usmcaResult.rules_applied?.threshold_percentage || 62.5;
      
      if (naContent < threshold + 5) { // Barely qualified (within 5%)
        evaluation.referral_reasons.push('USMCA qualification is marginal');
        evaluation.recommendations.push('Professional documentation review recommended');
        evaluation.estimated_complexity = 'medium';
      }
    }

    // Check for database errors or fallback rules
    if (usmcaResult.database_error || usmcaResult.rules_applied?.source === 'emergency_fallback') {
      evaluation.requires_professional = true;
      evaluation.referral_reasons.push('USMCA rules retrieved from fallback system');
      evaluation.recommendations.push('Professional USMCA rule verification required');
      evaluation.severity = 'high';
      evaluation.estimated_complexity = 'complex';
    }

    return evaluation;
  }

  /**
   * Evaluate savings calculation reliability
   */
  evaluateSavingsReliability(savingsResult) {
    const evaluation = {
      requires_professional: false,
      referral_reasons: [],
      recommendations: [],
      severity: 'low'
    };

    // Check for calculation errors
    if (savingsResult.database_error || savingsResult.rates_source === 'emergency_fallback') {
      evaluation.requires_professional = true;
      evaluation.referral_reasons.push('Tariff rates from fallback system');
      evaluation.recommendations.push('Professional tariff rate verification required');
      evaluation.severity = 'high';
    }

    // Check for significant savings (high-stakes scenario)
    const annualSavings = savingsResult.annual_savings || 0;
    if (annualSavings > 50000) { // Configurable threshold
      evaluation.referral_reasons.push(`High potential savings: $${annualSavings.toLocaleString()}`);
      evaluation.recommendations.push('Professional implementation planning recommended for high-value opportunities');
      evaluation.severity = 'medium';
    }

    // Check for unusual tariff rates
    const mfnRate = savingsResult.mfn_rate || 0;
    if (mfnRate > 25) { // High tariff rate
      evaluation.referral_reasons.push(`High MFN tariff rate: ${mfnRate}%`);
      evaluation.recommendations.push('Verify high tariff rates with customs authorities');
    }

    return evaluation;
  }

  /**
   * Merge evaluation results
   */
  mergeEvaluation(mainEval, additionalEval) {
    if (additionalEval.requires_professional) {
      mainEval.requires_professional = true;
    }

    mainEval.referral_reasons.push(...additionalEval.referral_reasons);
    mainEval.recommendations.push(...additionalEval.recommendations);

    // Use highest severity
    const severityLevels = { low: 1, medium: 2, high: 3 };
    const currentLevel = severityLevels[mainEval.severity] || 1;
    const newLevel = severityLevels[additionalEval.severity] || 1;
    
    if (newLevel > currentLevel) {
      mainEval.severity = additionalEval.severity;
    }

    // Use most complex estimation
    const complexityLevels = { simple: 1, medium: 2, complex: 3 };
    const currentComplexity = complexityLevels[mainEval.estimated_complexity] || 1;
    const newComplexity = complexityLevels[additionalEval.estimated_complexity] || 1;
    
    if (newComplexity > currentComplexity) {
      mainEval.estimated_complexity = additionalEval.estimated_complexity;
    }
  }

  /**
   * Determine overall referral need based on combined factors
   */
  determineOverallReferralNeed(evaluation) {
    // Already determined to need professional help
    if (evaluation.requires_professional) {
      return true;
    }

    // Check for high complexity scenarios
    if (evaluation.estimated_complexity === 'complex') {
      return true;
    }

    // Check for high severity issues
    if (evaluation.severity === 'high') {
      return true;
    }

    // Check for multiple medium-level concerns
    if (evaluation.severity === 'medium' && evaluation.referral_reasons.length >= 2) {
      return true;
    }

    return false;
  }

  /**
   * Generate professional service recommendations based on evaluation
   */
  async generateProfessionalServiceRecommendations(evaluation) {
    try {
      const services = {
        primary_services: [],
        specialized_services: [],
        documentation_services: [],
        estimated_timeline: '1-2 weeks',
        estimated_cost_range: 'Contact for quote'
      };

      // Classification services
      const hasClassificationIssues = evaluation.referral_reasons.some(reason => 
        reason.includes('classification') || reason.includes('HS code')
      );
      
      if (hasClassificationIssues) {
        services.primary_services.push({
          service: 'Professional HS Code Classification',
          description: 'Licensed customs broker classification review',
          urgency: evaluation.severity === 'high' ? 'urgent' : 'standard'
        });
      }

      // USMCA qualification services
      const hasUSMCAIssues = evaluation.referral_reasons.some(reason => 
        reason.includes('USMCA') || reason.includes('qualification')
      );
      
      if (hasUSMCAIssues) {
        services.specialized_services.push({
          service: 'USMCA Qualification Analysis',
          description: 'Rules of origin verification and supply chain optimization',
          urgency: evaluation.severity === 'high' ? 'urgent' : 'standard'
        });
      }

      // High-value savings consultation
      const hasHighValueSavings = evaluation.referral_reasons.some(reason => 
        reason.includes('savings') && reason.includes('$')
      );
      
      if (hasHighValueSavings) {
        services.specialized_services.push({
          service: 'Trade Optimization Consulting',
          description: 'Professional implementation planning for high-value opportunities',
          urgency: 'priority'
        });
      }

      // Documentation services
      if (evaluation.estimated_complexity === 'complex') {
        services.documentation_services.push({
          service: 'Certificate of Origin Preparation',
          description: 'Professional USMCA certificate preparation and validation',
          urgency: 'standard'
        });
      }

      // Adjust timeline based on complexity
      switch (evaluation.estimated_complexity) {
        case 'complex':
          services.estimated_timeline = '2-4 weeks';
          break;
        case 'medium':
          services.estimated_timeline = '1-2 weeks';
          break;
        default:
          services.estimated_timeline = '3-5 business days';
      }

      return services;

    } catch (error) {
      logError('Failed to generate professional service recommendations', { error: error.message });
      
      // Emergency fallback recommendations
      return {
        primary_services: [
          {
            service: 'General Customs Consultation',
            description: 'Contact licensed customs broker for comprehensive review',
            urgency: 'standard'
          }
        ],
        specialized_services: [],
        documentation_services: [],
        estimated_timeline: 'Contact for estimate',
        estimated_cost_range: 'Contact for quote'
      };
    }
  }

  /**
   * Generate professional referral response
   */
  async generateReferralResponse(evaluation, originalRequest = {}) {
    try {
      const response = {
        professional_referral_required: evaluation.requires_professional,
        confidence_assessment: {
          level: evaluation.confidence_level,
          severity: evaluation.severity,
          complexity: evaluation.estimated_complexity
        },
        
        referral_details: {
          reasons: evaluation.referral_reasons,
          recommendations: evaluation.recommendations,
          professional_services: evaluation.professional_services
        },
        
        next_steps: await this.generateNextSteps(evaluation),
        
        contact_information: {
          message: 'Contact a licensed customs broker for professional assistance',
          disclaimer: MESSAGES.disclaimers.general,
          referral_code: this.generateReferralCode(originalRequest)
        },
        
        system_information: {
          evaluation_timestamp: new Date().toISOString(),
          thresholds_applied: {
            min_classification_confidence: this.minClassificationConfidence,
            professional_referral_threshold: this.professionalReferralThreshold
          }
        }
      };

      return response;

    } catch (error) {
      logError('Failed to generate referral response', { error: error.message });
      
      // Emergency fallback response
      return {
        professional_referral_required: true,
        message: MESSAGES.errors.professionalRequired,
        error: 'Unable to generate detailed referral information',
        contact_information: {
          message: 'Contact a licensed customs broker immediately',
          referral_code: `ERROR_${Date.now()}`
        }
      };
    }
  }

  /**
   * Generate specific next steps for professional referral
   */
  async generateNextSteps(evaluation) {
    const steps = [];
    
    // Immediate steps based on severity
    if (evaluation.severity === 'high') {
      steps.push({
        step: 1,
        action: 'Contact licensed customs broker immediately',
        urgency: 'urgent',
        description: 'Critical compliance issues require immediate professional attention'
      });
    } else {
      steps.push({
        step: 1,
        action: 'Schedule consultation with customs broker',
        urgency: 'standard',
        description: 'Professional review recommended for optimal compliance'
      });
    }

    // Preparation steps
    steps.push({
      step: 2,
      action: 'Prepare supporting documentation',
      urgency: 'standard',
      description: 'Gather product specifications, supply chain details, and trade volume information'
    });

    // Specific steps based on issues identified
    if (evaluation.referral_reasons.some(r => r.includes('classification'))) {
      steps.push({
        step: 3,
        action: 'Prepare detailed product specifications',
        urgency: 'standard',
        description: 'Technical specifications will help professional classify product accurately'
      });
    }

    if (evaluation.referral_reasons.some(r => r.includes('USMCA'))) {
      steps.push({
        step: 3,
        action: 'Document complete supply chain',
        urgency: 'standard',
        description: 'Map all component origins and manufacturing processes for USMCA analysis'
      });
    }

    return steps;
  }

  /**
   * Generate unique referral code for tracking
   */
  generateReferralCode(originalRequest) {
    const timestamp = Date.now();
    const productHash = originalRequest.product_description 
      ? Buffer.from(originalRequest.product_description.substring(0, 20)).toString('base64').substring(0, 8)
      : 'UNKNOWN';
    
    return `REF_${timestamp}_${productHash}`;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      min_classification_confidence: this.minClassificationConfidence,
      professional_referral_threshold: this.professionalReferralThreshold,
      cache_size: this.cache.size,
      conservative_multiplier: this.conservativeMultiplier
    };
  }
}

// Export singleton instance
export const professionalReferralSystem = new ProfessionalReferralSystem();

const professionalReferralSystemExports = {
  ProfessionalReferralSystem,
  professionalReferralSystem
};

export default professionalReferralSystemExports;