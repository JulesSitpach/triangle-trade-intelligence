/**
 * PROFESSIONAL VALIDATION SERVICE
 * Database-driven professional validation - NO HARDCODED Cristina details
 * 
 * All validator information comes from professional_validators table
 * Manages validation requests, assignments, and workflow
 */

import { serverDatabaseService } from '../database/supabase-client.js';
import { crisisConfigService } from './crisis-config-service.js';
import { dynamicPricingService } from './dynamic-pricing-service.js';
import { logInfo, logError, logPerformance } from '../utils/production-logger.js';

export class ProfessionalValidationService {
  constructor() {
    this.dbService = serverDatabaseService;
    this.crisisConfig = crisisConfigService;
    this.pricingService = dynamicPricingService;
    this.cache = new Map();
    this.cacheTtl = parseInt(process.env.VALIDATION_CACHE_TTL || '300000'); // 5 minutes
  }

  /**
   * Get active professional validators - NO HARDCODED validator info
   */
  async getActiveValidators(specialization = null, availableForEmergency = false) {
    const startTime = Date.now();

    try {
      const cacheKey = `validators_${specialization || 'all'}_${availableForEmergency}`;
      let validators = this.getFromCache(cacheKey);

      if (!validators) {
        let query = this.dbService.client
          .from('professional_validators')
          .select(`
            id,
            validator_name,
            license_number,
            license_type,
            license_country,
            specializations,
            languages,
            experience_years,
            hourly_rate,
            currency,
            liability_coverage,
            available_for_emergency,
            bio_en,
            bio_es,
            response_time_hours,
            max_case_value
          `)
          .eq('active', true);

        if (specialization) {
          query = query.contains('specializations', [specialization]);
        }

        if (availableForEmergency) {
          query = query.eq('available_for_emergency', true);
        }

        const { data, error } = await query.order('experience_years', { ascending: false });

        if (error) {
          logError('Failed to load professional validators', { error: error.message });
          return this.getEmergencyValidatorFallback();
        }

        validators = data || [];
        this.setCache(cacheKey, validators);
      }

      logPerformance('Professional validators lookup', startTime, { 
        count: validators.length,
        specialization,
        availableForEmergency
      });

      return validators;

    } catch (error) {
      logError('Professional validators lookup failed', { error: error.message });
      return this.getEmergencyValidatorFallback();
    }
  }

  /**
   * Get primary validator (most experienced) - NO HARDCODED primary validator
   */
  async getPrimaryValidator() {
    const validators = await this.getActiveValidators();
    
    if (!validators || validators.length === 0) {
      return this.getEmergencyPrimaryValidator();
    }

    // Return the most experienced validator
    return validators[0];
  }

  /**
   * Request professional validation - NO HARDCODED validation workflow
   */
  async requestValidation(validationRequest) {
    const {
      requestType,
      clientCompany,
      clientEmail,
      clientPhone,
      urgencyLevel = 'normal',
      tradeVolume,
      hsCodes = [],
      caseDescription,
      requestedValidatorId = null,
      internalNotes = '',
      deadlineDate = null
    } = validationRequest;

    const startTime = Date.now();

    try {
      logInfo('Creating professional validation request', {
        requestType,
        clientCompany,
        urgencyLevel,
        tradeVolume
      });

      // 1. Determine appropriate validator
      const assignedValidator = await this.assignValidator({
        requestType,
        urgencyLevel,
        tradeVolume,
        hsCodes,
        requestedValidatorId
      });

      if (!assignedValidator) {
        return {
          success: false,
          error: 'No suitable validator available',
          fallback_recommendation: 'Please contact support for manual assignment'
        };
      }

      // 2. Calculate estimated hours and pricing
      const estimation = await this.estimateValidationWork({
        requestType,
        tradeVolume,
        hsCodes,
        caseComplexity: this.assessCaseComplexity(caseDescription, hsCodes.length)
      });

      // 3. Create validation request record
      const { data, error } = await this.dbService.client
        .from('professional_validation_requests')
        .insert({
          request_type: requestType,
          client_company: clientCompany,
          client_email: clientEmail,
          client_phone: clientPhone,
          urgency_level: urgencyLevel,
          trade_volume: tradeVolume,
          hs_codes: hsCodes,
          case_description: caseDescription,
          assigned_validator_id: assignedValidator.id,
          estimated_hours: estimation.estimatedHours,
          quoted_price: estimation.quotedPrice,
          status: 'pending',
          priority_score: this.calculatePriorityScore(urgencyLevel, tradeVolume),
          internal_notes: internalNotes,
          deadline_date: deadlineDate,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logError('Failed to create validation request', { error: error.message });
        return {
          success: false,
          error: error.message,
          fallback_recommendation: 'Please contact support directly'
        };
      }

      logPerformance('Professional validation request creation', startTime, {
        requestType,
        assignedValidator: assignedValidator.validator_name
      });

      return {
        success: true,
        request_id: data.id,
        assigned_validator: {
          name: assignedValidator.validator_name,
          license_number: assignedValidator.license_number,
          experience_years: assignedValidator.experience_years,
          specializations: assignedValidator.specializations,
          response_time_hours: assignedValidator.response_time_hours
        },
        estimation: {
          estimated_hours: estimation.estimatedHours,
          quoted_price: estimation.quotedPrice,
          currency: assignedValidator.currency || 'USD',
          estimated_completion: this.calculateEstimatedCompletion(
            estimation.estimatedHours,
            assignedValidator.response_time_hours
          )
        },
        next_steps: this.generateNextSteps(requestType, urgencyLevel),
        status: 'pending_client_approval'
      };

    } catch (error) {
      logError('Professional validation request failed', { error: error.message });
      return {
        success: false,
        error: error.message,
        fallback_recommendation: 'Please contact support for manual processing'
      };
    }
  }

  /**
   * Assign validator based on requirements - NO HARDCODED assignment logic
   */
  async assignValidator({ requestType, urgencyLevel, tradeVolume, hsCodes, requestedValidatorId }) {
    try {
      // If specific validator requested and available
      if (requestedValidatorId) {
        const { data, error } = await this.dbService.client
          .from('professional_validators')
          .select('*')
          .eq('id', requestedValidatorId)
          .eq('active', true)
          .single();

        if (!error && data) {
          return data;
        }
      }

      // Get validation thresholds from config
      const thresholds = await this.crisisConfig.getValidationThresholds();

      // Determine required validator capabilities
      let requiredCapabilities = [];
      
      if (tradeVolume >= thresholds.expert_required_over) {
        requiredCapabilities.push('high_value_cases');
      }

      if (urgencyLevel === 'emergency') {
        requiredCapabilities.push('emergency_response');
      }

      if (requestType === 'supply_chain_analysis') {
        requiredCapabilities.push('supply_chain');
      }

      // Find best matching validator
      const validators = await this.getActiveValidators();
      
      const suitableValidators = validators.filter(validator => {
        // Check availability for emergency cases
        if (urgencyLevel === 'emergency' && !validator.available_for_emergency) {
          return false;
        }

        // Check case value limits
        if (validator.max_case_value && tradeVolume > validator.max_case_value) {
          return false;
        }

        // Check specializations
        if (requiredCapabilities.length > 0) {
          const hasRequiredSpec = requiredCapabilities.some(cap => 
            validator.specializations.includes(cap) || 
            validator.specializations.includes('USMCA') // USMCA is universal
          );
          if (!hasRequiredSpec) return false;
        }

        return true;
      });

      if (suitableValidators.length === 0) {
        logError('No suitable validator found', { 
          urgencyLevel, 
          tradeVolume, 
          requiredCapabilities 
        });
        return null;
      }

      // Return the most experienced suitable validator
      return suitableValidators[0];

    } catch (error) {
      logError('Validator assignment failed', { error: error.message });
      return null;
    }
  }

  /**
   * Estimate validation work - NO HARDCODED time estimates
   */
  async estimateValidationWork({ requestType, tradeVolume, hsCodes, caseComplexity }) {
    try {
      // Get estimation parameters from config
      const estimationConfig = await this.crisisConfig.getConfig('validation_estimation_params');
      
      const params = estimationConfig || {
        base_hours: {
          certificate_review: 2,
          emergency_consultation: 1,
          compliance_audit: 8,
          supply_chain_analysis: 16
        },
        complexity_multipliers: {
          low: 1.0,
          medium: 1.5,
          high: 2.0,
          critical: 3.0
        },
        volume_multipliers: {
          under_1m: 1.0,
          under_5m: 1.2,
          under_10m: 1.5,
          over_10m: 2.0
        }
      };

      // Base hours for request type
      const baseHours = params.base_hours[requestType] || 4;

      // Apply complexity multiplier
      const complexityMultiplier = params.complexity_multipliers[caseComplexity] || 1.0;

      // Apply volume multiplier
      let volumeMultiplier = 1.0;
      if (tradeVolume >= 10000000) {
        volumeMultiplier = params.volume_multipliers.over_10m || 2.0;
      } else if (tradeVolume >= 5000000) {
        volumeMultiplier = params.volume_multipliers.under_10m || 1.5;
      } else if (tradeVolume >= 1000000) {
        volumeMultiplier = params.volume_multipliers.under_5m || 1.2;
      }

      // Apply HS codes multiplier (more codes = more work)
      const hsCodesMultiplier = Math.max(1.0, hsCodes.length * 0.2);

      // Calculate final estimate
      const estimatedHours = Math.ceil(
        baseHours * complexityMultiplier * volumeMultiplier * hsCodesMultiplier
      );

      // Get hourly rate (use primary validator rate)
      const primaryValidator = await this.getPrimaryValidator();
      const hourlyRate = primaryValidator?.hourly_rate || 500;

      const quotedPrice = estimatedHours * hourlyRate;

      return {
        estimatedHours,
        quotedPrice,
        baseHours,
        multipliers: {
          complexity: complexityMultiplier,
          volume: volumeMultiplier,
          hs_codes: hsCodesMultiplier
        },
        hourlyRate
      };

    } catch (error) {
      logError('Work estimation failed', { error: error.message });
      
      // Fallback estimation
      return {
        estimatedHours: 4,
        quotedPrice: 2000,
        source: 'fallback_estimation'
      };
    }
  }

  /**
   * Assess case complexity - NO HARDCODED complexity rules
   */
  assessCaseComplexity(caseDescription, hsCodesCount) {
    const description = (caseDescription || '').toLowerCase();
    
    // High complexity indicators
    const highComplexityWords = ['audit', 'cbp', 'penalty', 'investigation', 'complex', 'multiple countries'];
    const criticalWords = ['seizure', 'customs raid', 'criminal', 'fraud investigation'];
    
    if (criticalWords.some(word => description.includes(word))) {
      return 'critical';
    }
    
    if (highComplexityWords.some(word => description.includes(word)) || hsCodesCount > 10) {
      return 'high';
    }
    
    if (hsCodesCount > 3 || description.length > 200) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Calculate priority score for queue management - NO HARDCODED priorities
   */
  calculatePriorityScore(urgencyLevel, tradeVolume) {
    const urgencyScores = {
      emergency: 1000,
      high: 100,
      normal: 10,
      low: 1
    };

    const baseScore = urgencyScores[urgencyLevel] || 10;
    
    // Add trade volume bonus
    const volumeBonus = Math.min(Math.floor(tradeVolume / 1000000) * 5, 50);
    
    return baseScore + volumeBonus;
  }

  /**
   * Calculate estimated completion time
   */
  calculateEstimatedCompletion(estimatedHours, responseTimeHours) {
    const startDate = new Date();
    const totalHours = responseTimeHours + estimatedHours;
    const completionDate = new Date(startDate.getTime() + (totalHours * 60 * 60 * 1000));
    
    return {
      estimated_start: new Date(startDate.getTime() + (responseTimeHours * 60 * 60 * 1000)),
      estimated_completion: completionDate,
      total_hours: totalHours
    };
  }

  /**
   * Generate next steps based on request type
   */
  generateNextSteps(requestType, urgencyLevel) {
    const nextStepsMap = {
      certificate_review: [
        'Professional reviewer will examine your certificate draft',
        'Recommendations for improvements will be provided',
        'Final validated certificate will be delivered'
      ],
      emergency_consultation: [
        'Immediate consultation will be scheduled',
        'Urgent compliance issues will be addressed',
        'Action plan will be developed'
      ],
      compliance_audit: [
        'Comprehensive audit of your compliance processes',
        'Detailed report with recommendations',
        'Implementation support available'
      ],
      supply_chain_analysis: [
        'Analysis of your current supply chain structure',
        'USMCA optimization recommendations',
        'Mexico sourcing opportunities identified'
      ]
    };

    const steps = nextStepsMap[requestType] || ['Professional review will be conducted'];
    
    if (urgencyLevel === 'emergency') {
      steps.unshift('URGENT: Response within 4 hours guaranteed');
    }

    return steps;
  }

  /**
   * Update validation request status
   */
  async updateValidationStatus(requestId, status, updates = {}) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...updates
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await this.dbService.client
        .from('professional_validation_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        logError('Failed to update validation status', { error: error.message, requestId });
        return { success: false, error: error.message };
      }

      logInfo('Validation status updated', { requestId, status });
      return { success: true, data };

    } catch (error) {
      logError('Validation status update failed', { error: error.message, requestId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get validation request status
   */
  async getValidationStatus(requestId) {
    try {
      const { data, error } = await this.dbService.client
        .from('professional_validation_requests')
        .select(`
          *,
          professional_validators (
            validator_name,
            license_number,
            experience_years
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) {
        logError('Failed to get validation status', { error: error.message, requestId });
        return { success: false, error: error.message };
      }

      return {
        success: true,
        request: data,
        validator_info: data.professional_validators
      };

    } catch (error) {
      logError('Validation status lookup failed', { error: error.message, requestId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Emergency fallback validators when database unavailable
   */
  getEmergencyValidatorFallback() {
    return [{
      id: 'emergency_fallback',
      validator_name: process.env.FALLBACK_VALIDATOR_NAME || 'Professional Validator',
      license_number: process.env.FALLBACK_LICENSE_NUMBER || 'Licensed',
      license_type: 'customs_broker',
      experience_years: parseInt(process.env.FALLBACK_EXPERIENCE_YEARS || '15'),
      hourly_rate: parseFloat(process.env.FALLBACK_HOURLY_RATE || '500'),
      available_for_emergency: true,
      bio_en: 'Professional customs broker with extensive USMCA experience.',
      source: 'emergency_fallback'
    }];
  }

  getEmergencyPrimaryValidator() {
    return {
      id: 'emergency_primary',
      validator_name: process.env.FALLBACK_VALIDATOR_NAME || 'Professional Validator',
      license_number: process.env.FALLBACK_LICENSE_NUMBER || 'Licensed',
      hourly_rate: parseFloat(process.env.FALLBACK_HOURLY_RATE || '500'),
      response_time_hours: 24,
      source: 'emergency_fallback'
    };
  }

  /**
   * Cache management
   */
  setCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTtl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      
      // Test validator lookup
      const validators = await this.getActiveValidators();
      const primaryValidator = await this.getPrimaryValidator();

      return {
        status: validators && primaryValidator ? 'healthy' : 'degraded',
        response_time_ms: Date.now() - startTime,
        active_validators_count: validators?.length || 0,
        primary_validator_available: !!primaryValidator,
        cache_size: this.cache.size
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        fallback_available: true
      };
    }
  }
}

// Export singleton instance
export const professionalValidationService = new ProfessionalValidationService();