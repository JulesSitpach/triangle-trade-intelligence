/**
 * CERTIFICATE ERROR RECOVERY SERVICE
 * Comprehensive error handling and fallback patterns for certificate generation
 * Ensures certificate generation always provides a useful result
 */

import { logError, logInfo } from '../utils/production-logger.js';
import { TRUST_CONFIG, TRUST_MESSAGES } from '../../config/trust-config.js';

export class CertificateErrorRecoveryService {
  constructor() {
    this.fallbackAttempts = 0;
    this.maxFallbackAttempts = 3;
  }

  /**
   * Attempt to recover from certificate generation errors
   */
  async attemptCertificateRecovery(error, classificationResult, usmcaResult, formData) {
    this.fallbackAttempts++;
    
    logError(`Certificate error recovery attempt ${this.fallbackAttempts}`, {
      error: error.message,
      company: formData.company_name,
      attempt: this.fallbackAttempts
    });

    try {
      // Determine error type and appropriate recovery strategy
      const errorType = this.classifyError(error);
      
      switch (errorType) {
        case 'data_missing':
          return await this.recoverFromMissingData(error, classificationResult, usmcaResult, formData);
        
        case 'provenance_failed':
          return await this.recoverFromProvenanceFailure(error, classificationResult, usmcaResult, formData);
        
        case 'trust_calculation_failed':
          return await this.recoverFromTrustCalculationFailure(error, classificationResult, usmcaResult, formData);
        
        case 'expert_validation_failed':
          return await this.recoverFromExpertValidationFailure(error, classificationResult, usmcaResult, formData);
        
        case 'formatting_failed':
          return await this.recoverFromFormattingFailure(error, classificationResult, usmcaResult, formData);
        
        case 'system_error':
          return await this.recoverFromSystemError(error, classificationResult, usmcaResult, formData);
        
        default:
          return await this.generateFallbackCertificate(error, classificationResult, usmcaResult, formData);
      }
    } catch (recoveryError) {
      logError('Certificate recovery failed', { 
        originalError: error.message, 
        recoveryError: recoveryError.message 
      });
      
      return this.generateEmergencyFallback(error, classificationResult, usmcaResult, formData);
    }
  }

  /**
   * Classify the type of error for targeted recovery
   */
  classifyError(error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('missing') || errorMessage.includes('required') || errorMessage.includes('undefined')) {
      return 'data_missing';
    }
    
    if (errorMessage.includes('provenance') || errorMessage.includes('verification')) {
      return 'provenance_failed';
    }
    
    if (errorMessage.includes('trust') || errorMessage.includes('score')) {
      return 'trust_calculation_failed';
    }
    
    if (errorMessage.includes('expert') || errorMessage.includes('validation')) {
      return 'expert_validation_failed';
    }
    
    if (errorMessage.includes('format') || errorMessage.includes('template')) {
      return 'formatting_failed';
    }
    
    if (errorMessage.includes('database') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
      return 'system_error';
    }
    
    return 'unknown_error';
  }

  /**
   * Recover from missing data errors
   */
  async recoverFromMissingData(error, classificationResult, usmcaResult, formData) {
    logInfo('Attempting recovery from missing data', { error: error.message });
    
    // Create a certificate with placeholder values and warnings
    const fallbackCertificate = {
      success: true,
      certificate: {
        certificate_id: `FALLBACK-${Date.now()}`,
        certificate_number: `USMCA-FALLBACK-${Date.now()}`,
        certificate_version: '2.0-FALLBACK',
        
        // Use available data or safe defaults
        exporter: {
          name: formData.company_name || 'TO BE COMPLETED BY EXPORTER',
          address: formData.company_address || 'TO BE COMPLETED BY EXPORTER',
          tax_id: formData.tax_id || 'TO BE COMPLETED BY EXPORTER',
          country: formData.supplier_country || 'TO BE COMPLETED'
        },
        
        producer: {
          name: formData.company_name || 'TO BE COMPLETED BY PRODUCER',
          address: `Manufacturing Location: ${formData.manufacturing_location || 'TO BE COMPLETED'}`,
          tax_id: 'TO BE COMPLETED BY PRODUCER',
          country: formData.manufacturing_location || 'TO BE COMPLETED'
        },
        
        importer: {
          name: 'TO BE COMPLETED BY IMPORTER',
          address: 'TO BE COMPLETED BY IMPORTER', 
          tax_id: 'TO BE COMPLETED BY IMPORTER'
        },
        
        product: {
          description: formData.product_description || classificationResult?.description || 'TO BE COMPLETED',
          hs_code: classificationResult?.hs_code || 'TO BE VERIFIED WITH CUSTOMS BROKER',
          detailed_description: 'TO BE COMPLETED WITH SPECIFIC SHIPMENT DETAILS'
        },
        
        preference_criterion: usmcaResult?.qualified ? 'B' : 'REQUIRES VERIFICATION',
        preference_explanation: usmcaResult?.reason || 'Professional verification required',
        
        blanket_period: {
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
          validity_days: 365
        },
        
        authorized_signature: {
          signatory_name: 'TO BE COMPLETED BY AUTHORIZED SIGNATORY',
          signatory_title: 'TO BE COMPLETED',
          signature_date: 'TO BE COMPLETED UPON SIGNING',
          signature_placeholder: '________________________'
        },
        
        additional_information: {
          regional_value_content: usmcaResult?.north_american_content ? 
            `${usmcaResult.north_american_content.toFixed(1)}%` : 'TO BE CALCULATED',
          qualification_rule: usmcaResult?.rule || 'TO BE DETERMINED',
          manufacturing_country: formData.manufacturing_location || 'TO BE COMPLETED',
          component_breakdown: usmcaResult?.component_breakdown || []
        },
        
        // Trust verification with error context
        trust_verification: {
          overall_trust_score: 0.1,
          trust_level: 'very_low',
          verification_status: 'failed_requires_manual',
          data_sources_verified: [],
          expert_validation: {
            expert_validation_required: true,
            validation_status: 'required_due_to_error',
            current_trust_score: 0.1,
            trust_score_threshold: 0.95
          }
        },
        
        // Recovery information
        recovery_info: {
          recovery_method: 'missing_data_fallback',
          original_error: error.message,
          recovery_timestamp: new Date().toISOString(),
          data_completeness: this.calculateDataCompleteness(classificationResult, usmcaResult, formData)
        },
        
        professional_disclaimers: [
          'CERTIFICATE GENERATED WITH INCOMPLETE DATA - Expert validation required',
          'This certificate was generated using fallback procedures due to missing information',
          'All fields must be verified and completed before submission to customs authorities',
          'Contact a trade compliance expert for professional assistance with classification and qualification',
          error.message
        ]
      }
    };
    
    return fallbackCertificate;
  }

  /**
   * Recover from data provenance failures
   */
  async recoverFromProvenanceFailure(error, classificationResult, usmcaResult, formData) {
    logInfo('Attempting recovery from provenance failure', { error: error.message });
    
    // Generate certificate with provenance warnings
    const fallbackCertificate = await this.recoverFromMissingData(error, classificationResult, usmcaResult, formData);
    
    // Update trust verification to reflect provenance issues
    fallbackCertificate.certificate.trust_verification = {
      overall_trust_score: 0.2,
      trust_level: 'very_low',
      verification_status: 'provenance_unavailable',
      data_sources_verified: ['Source verification failed - manual verification required'],
      expert_validation: {
        expert_validation_required: true,
        validation_status: 'required_due_to_provenance_failure',
        current_trust_score: 0.2,
        trust_score_threshold: 0.95
      }
    };
    
    fallbackCertificate.certificate.data_provenance = {
      verification_timestamp: new Date().toISOString(),
      error: 'Data provenance verification failed',
      fallback_message: 'Manual verification required - consult official government sources'
    };
    
    fallbackCertificate.certificate.professional_disclaimers = [
      'DATA PROVENANCE VERIFICATION FAILED - Expert validation required',
      'Source verification could not be completed - verify all data with official sources',
      'Consult CBP, CBSA, or SAT databases directly for current tariff rates and rules',
      'Licensed customs broker consultation strongly recommended',
      `Original error: ${error.message}`
    ];
    
    return fallbackCertificate;
  }

  /**
   * Recover from trust calculation failures
   */
  async recoverFromTrustCalculationFailure(error, classificationResult, usmcaResult, formData) {
    logInfo('Attempting recovery from trust calculation failure', { error: error.message });
    
    const fallbackCertificate = await this.recoverFromMissingData(error, classificationResult, usmcaResult, formData);
    
    // Set minimal trust indicators
    fallbackCertificate.certificate.trust_verification = {
      overall_trust_score: 0.0,
      trust_level: 'calculation_failed',
      verification_status: 'manual_verification_required',
      data_sources_verified: ['Trust calculation unavailable'],
      expert_validation: {
        expert_validation_required: true,
        validation_status: 'required_due_to_calculation_failure',
        current_trust_score: 0.0,
        trust_score_threshold: 0.95
      }
    };
    
    fallbackCertificate.certificate.professional_disclaimers = [
      'TRUST CALCULATION FAILED - Manual verification required',
      'Automatic trust scoring is unavailable - professional validation essential',
      'All certificate data requires independent verification',
      'Do not rely on automated confidence indicators',
      `Technical error: ${error.message}`
    ];
    
    return fallbackCertificate;
  }

  /**
   * Recover from expert validation failures
   */
  async recoverFromExpertValidationFailure(error, classificationResult, usmcaResult, formData) {
    logInfo('Attempting recovery from expert validation failure', { error: error.message });
    
    const fallbackCertificate = await this.recoverFromMissingData(error, classificationResult, usmcaResult, formData);
    
    // Set expert validation as unavailable but required
    fallbackCertificate.certificate.trust_verification.expert_validation = {
      expert_validation_required: true,
      validation_status: 'expert_system_unavailable',
      current_trust_score: 0.1,
      trust_score_threshold: 0.95,
      expert_contact_info: null,
      fallback_recommendation: 'Contact trade compliance expert directly'
    };
    
    fallbackCertificate.certificate.professional_disclaimers = [
      'EXPERT VALIDATION SYSTEM UNAVAILABLE - Contact customs broker directly',
      'Automated expert consultation is temporarily unavailable',
      'Manual expert validation is required before certificate use',
      'Seek professional customs broker or trade compliance specialist assistance',
      `System error: ${error.message}`
    ];
    
    return fallbackCertificate;
  }

  /**
   * Recover from formatting failures
   */
  async recoverFromFormattingFailure(error, classificationResult, usmcaResult, formData) {
    logInfo('Attempting recovery from formatting failure', { error: error.message });
    
    // Create a basic certificate structure that can be formatted
    return {
      success: true,
      certificate: {
        certificate_id: `FORMAT-RECOVERY-${Date.now()}`,
        certificate_number: `USMCA-${Date.now()}`,
        
        // Basic certificate data
        company_name: formData.company_name,
        product_description: formData.product_description,
        hs_code: classificationResult?.hs_code,
        qualification_status: usmcaResult?.qualified ? 'Qualified' : 'Not Qualified',
        
        // Simple format fallback
        simple_certificate_text: this.generateSimpleCertificateText(
          formData, classificationResult, usmcaResult
        ),
        
        recovery_info: {
          recovery_method: 'formatting_fallback',
          original_error: error.message,
          format_available: 'simple_text_only'
        },
        
        professional_disclaimers: [
          'CERTIFICATE FORMATTING FAILED - Simple format provided',
          'Manual reformatting may be required for official submission',
          'Ensure all information is transferred to official USMCA certificate form',
          `Formatting error: ${error.message}`
        ]
      }
    };
  }

  /**
   * Recover from system errors
   */
  async recoverFromSystemError(error, classificationResult, usmcaResult, formData) {
    logInfo('Attempting recovery from system error', { error: error.message });
    
    return {
      success: false,
      error: 'System error - certificate generation unavailable',
      fallback: {
        recommendation: 'Manual certificate preparation required',
        expert_consultation_required: true,
        system_status: 'experiencing_issues',
        alternative_approach: [
          'Use official USMCA certificate form directly',
          'Contact trade compliance expert for assistance',
          'Verify product qualification manually using USMCA rules',
          'Consult CBP, CBSA, or SAT websites for current requirements'
        ],
        error_details: error.message,
        system_recovery_info: {
          error_type: 'system_error',
          recovery_attempted: true,
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  /**
   * Generate fallback certificate when other recovery methods fail
   */
  async generateFallbackCertificate(error, classificationResult, usmcaResult, formData) {
    logInfo('Generating fallback certificate', { error: error.message });
    
    return {
      success: true,
      certificate: {
        certificate_id: `EMERGENCY-${Date.now()}`,
        certificate_type: 'emergency_fallback',
        
        basic_info: {
          company: formData.company_name || 'TO BE COMPLETED',
          product: formData.product_description || 'TO BE COMPLETED',
          hs_code: classificationResult?.hs_code || 'TO BE VERIFIED',
          manufacturing_location: formData.manufacturing_location || 'TO BE COMPLETED'
        },
        
        qualification_status: 'REQUIRES_MANUAL_VERIFICATION',
        
        emergency_instructions: [
          'This is an emergency fallback certificate template',
          'Manual completion of all fields is required',
          'Professional customs broker consultation is essential',
          'Verify all information with official USMCA sources',
          'Do not submit without expert validation'
        ],
        
        professional_disclaimers: [
          'EMERGENCY CERTIFICATE TEMPLATE - Manual verification required',
          'System error prevented full certificate generation',
          'All information must be independently verified',
          'Licensed customs broker assistance strongly recommended',
          `System error: ${error.message}`
        ]
      }
    };
  }

  /**
   * Generate emergency fallback when all recovery attempts fail
   */
  generateEmergencyFallback(error, classificationResult, usmcaResult, formData) {
    logError('All certificate recovery attempts failed - generating emergency fallback', {
      error: error.message,
      attempts: this.fallbackAttempts
    });
    
    return {
      success: false,
      error: 'Certificate generation failed - emergency fallback provided',
      emergency_fallback: {
        message: 'Automatic certificate generation is currently unavailable',
        manual_steps: [
          '1. Download blank USMCA Certificate of Origin form',
          '2. Complete all required fields manually',
          '3. Contact trade compliance expert for assistance',
          '4. Verify HS code classification independently',
          '5. Calculate regional value content manually',
          '6. Obtain authorized signature before submission'
        ],
        contact_info: {
          cbp_website: 'https://www.cbp.gov',
          cbsa_website: 'https://www.cbsa-asfc.gc.ca',
          sat_website: 'https://www.sat.gob.mx',
          find_customs_broker: 'Search for trade compliance experts in your area'
        },
        error_context: {
          original_error: error.message,
          recovery_attempts: this.fallbackAttempts,
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  /**
   * Calculate data completeness percentage
   */
  calculateDataCompleteness(classificationResult, usmcaResult, formData) {
    let completeness = 0;
    const totalFields = 10;
    
    if (formData.company_name) completeness++;
    if (formData.product_description) completeness++;
    if (formData.manufacturing_location) completeness++;
    if (formData.supplier_country) completeness++;
    if (formData.business_type) completeness++;
    if (classificationResult?.hs_code) completeness++;
    if (usmcaResult?.qualified !== undefined) completeness++;
    if (usmcaResult?.north_american_content) completeness++;
    if (usmcaResult?.component_breakdown?.length > 0) completeness++;
    if (formData.trade_volume) completeness++;
    
    return Math.round((completeness / totalFields) * 100);
  }

  /**
   * Generate simple certificate text for basic fallback
   */
  generateSimpleCertificateText(formData, classificationResult, usmcaResult) {
    return `USMCA CERTIFICATE OF ORIGIN (Emergency Format)

Company: ${formData.company_name || 'TO BE COMPLETED'}
Product: ${formData.product_description || 'TO BE COMPLETED'}
HS Code: ${classificationResult?.hs_code || 'TO BE VERIFIED'}
Manufacturing: ${formData.manufacturing_location || 'TO BE COMPLETED'}

Qualification Status: ${usmcaResult?.qualified ? 'Qualified' : 'Requires Verification'}
Regional Content: ${usmcaResult?.north_american_content ? 
  `${usmcaResult.north_american_content.toFixed(1)}%` : 'TO BE CALCULATED'}

IMPORTANT: This is an emergency format. Complete all fields and 
obtain professional validation before submission to customs.

Generated: ${new Date().toLocaleDateString()}`;
  }

  /**
   * Reset fallback attempt counter
   */
  resetFallbackAttempts() {
    this.fallbackAttempts = 0;
  }
}

// Export singleton instance
export const certificateErrorRecoveryService = new CertificateErrorRecoveryService();

export default certificateErrorRecoveryService;