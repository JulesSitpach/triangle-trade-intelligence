/**
 * TRUST-VERIFIED CERTIFICATE GENERATION SERVICE
 * Professional-grade USMCA certificate generation with complete data provenance
 * Integrates with trust microservices architecture for enhanced reliability
 */

import { dataProvenanceService } from './data-provenance-service.js';
import { expertEndorsementSystem } from './expert-endorsement-system.js';
import { trustCalculationService } from './trust/trust-calculation-service.js';
import { certificateErrorRecoveryService } from './certificate-error-recovery-service.js';
import { TRUST_CONFIG, TRUST_MESSAGES } from '../../config/trust-config.js';
import { SYSTEM_CONFIG } from '../../config/system-config.js';
import { logInfo, logError, logPerformance } from '../utils/production-logger.js';

export class TrustVerifiedCertificateService {
  constructor() {
    this.certificateVersion = '2.0-TRUST';
    this.defaultValidityDays = SYSTEM_CONFIG.usmca.certificateValidityDays;
  }

  /**
   * Generate trust-verified USMCA certificate with complete provenance
   */
  async generateTrustVerifiedCertificate(classificationResult, usmcaResult, formData, options = {}) {
    const startTime = Date.now();
    const certificateId = this.generateCertificateId();

    try {
      logInfo('Trust-verified certificate generation started', { 
        certificateId, 
        company: formData.company_name 
      });

      // Step 1: Validate qualification
      if (!usmcaResult?.qualified) {
        throw new Error('Cannot generate certificate: Product does not qualify for USMCA preferential treatment');
      }

      // Step 2: Gather data provenance for all certificate components
      const certificateProvenance = await this.gatherCertificateProvenance(
        classificationResult, usmcaResult, formData
      );

      // Step 3: Calculate certificate trust score
      const certificateTrustScore = await this.calculateCertificateTrustScore(
        classificationResult, usmcaResult, certificateProvenance
      );

      // Step 4: Check if expert validation is required
      const expertValidation = await this.evaluateExpertValidationNeed(
        certificateTrustScore, classificationResult, usmcaResult
      );

      // Step 5: Generate certificate data structure
      const certificateData = await this.buildCertificateDataStructure(
        classificationResult, usmcaResult, formData, certificateId
      );

      // Step 6: Add trust verification elements
      const trustVerifiedCertificate = await this.addTrustVerificationElements(
        certificateData, certificateProvenance, certificateTrustScore, expertValidation
      );

      // Step 7: Generate audit trail
      const auditTrail = await this.generateCertificateAuditTrail(
        trustVerifiedCertificate, certificateProvenance, formData
      );

      logPerformance('Trust-verified certificate generation', startTime, {
        certificateId,
        trustScore: certificateTrustScore,
        expertValidationRequired: expertValidation.expert_validation_required
      });

      return {
        success: true,
        certificate: trustVerifiedCertificate,
        trust_verification: {
          trust_score: certificateTrustScore,
          provenance: certificateProvenance,
          expert_validation: expertValidation,
          audit_trail: auditTrail
        },
        generation_metadata: {
          certificate_id: certificateId,
          version: this.certificateVersion,
          generated_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
      };

    } catch (error) {
      logError('Trust-verified certificate generation failed - attempting recovery', { 
        error: error.message, 
        certificateId, 
        company: formData.company_name 
      });

      // Attempt error recovery
      try {
        const recoveryResult = await certificateErrorRecoveryService.attemptCertificateRecovery(
          error, classificationResult, usmcaResult, formData
        );
        
        // Reset fallback attempts on successful recovery
        certificateErrorRecoveryService.resetFallbackAttempts();
        
        // Add recovery metadata
        if (recoveryResult.success) {
          recoveryResult.certificate.recovery_applied = true;
          recoveryResult.certificate.original_error = error.message;
        }
        
        return recoveryResult;
        
      } catch (recoveryError) {
        logError('Certificate error recovery failed', { 
          originalError: error.message,
          recoveryError: recoveryError.message,
          certificateId 
        });
        
        return {
          success: false,
          error: `Certificate generation failed: ${error.message}`,
          recovery_error: recoveryError.message,
          fallback: {
            recommendation: 'Manual certificate preparation required with customs broker assistance',
            expert_consultation_required: true,
            trust_score: 0.0,
            emergency_contact: 'Contact licensed customs broker immediately',
            system_status: 'certificate_generation_unavailable'
          }
        };
      }
    }
  }

  /**
   * Gather complete data provenance for certificate generation
   */
  async gatherCertificateProvenance(classificationResult, usmcaResult, formData) {
    try {
      const provenance = {
        hs_code_provenance: null,
        tariff_rates_provenance: null,
        usmca_rules_provenance: null,
        verification_timestamp: new Date().toISOString()
      };

      // Get HS code provenance
      if (classificationResult?.hs_code) {
        const hsCodeProvenance = await dataProvenanceService.getDataWithProvenance(
          'hs_codes', classificationResult.hs_code
        );
        provenance.hs_code_provenance = hsCodeProvenance.success ? hsCodeProvenance.provenance : null;
      }

      // Get tariff rates provenance
      if (classificationResult?.hs_code) {
        const tariffProvenance = await dataProvenanceService.getDataWithProvenance(
          'tariff_rates', classificationResult.hs_code
        );
        provenance.tariff_rates_provenance = tariffProvenance.success ? tariffProvenance.provenance : null;
      }

      // Get USMCA rules provenance
      if (classificationResult?.hs_code && formData?.business_type) {
        const rulesProvenance = await dataProvenanceService.getDataWithProvenance(
          'usmca_rules', `${classificationResult.hs_code}_${formData.business_type}`
        );
        provenance.usmca_rules_provenance = rulesProvenance.success ? rulesProvenance.provenance : null;
      }

      return provenance;

    } catch (error) {
      logError('Certificate provenance gathering failed', { error: error.message });
      return {
        verification_timestamp: new Date().toISOString(),
        error: 'Provenance data unavailable - manual verification required'
      };
    }
  }

  /**
   * Calculate comprehensive trust score for certificate
   */
  async calculateCertificateTrustScore(classificationResult, usmcaResult, certificateProvenance) {
    try {
      const scores = {
        classification_trust: classificationResult.trust_score || 0,
        usmca_qualification_trust: usmcaResult.trust_score || 0,
        provenance_completeness: this.calculateProvenanceCompleteness(certificateProvenance),
        data_freshness: this.calculateDataFreshness(certificateProvenance)
      };

      // Weight the scores based on importance
      const weights = {
        classification_trust: 0.35,
        usmca_qualification_trust: 0.35,
        provenance_completeness: 0.20,
        data_freshness: 0.10
      };

      const overallTrustScore = Object.entries(scores).reduce((total, [key, score]) => {
        return total + (score * weights[key]);
      }, 0);

      return Math.min(Math.max(overallTrustScore, 0), 1); // Clamp between 0 and 1

    } catch (error) {
      logError('Certificate trust score calculation failed', { error: error.message });
      return 0.1; // Very low trust score on error
    }
  }

  /**
   * Calculate provenance completeness score
   */
  calculateProvenanceCompleteness(certificateProvenance) {
    if (!certificateProvenance) return 0;

    const requiredProvenance = [
      'hs_code_provenance',
      'tariff_rates_provenance', 
      'usmca_rules_provenance'
    ];

    const availableProvenance = requiredProvenance.filter(key => 
      certificateProvenance[key] && !certificateProvenance[key].error
    );

    return availableProvenance.length / requiredProvenance.length;
  }

  /**
   * Calculate data freshness score based on verification timestamps
   */
  calculateDataFreshness(certificateProvenance) {
    if (!certificateProvenance) return 0;

    try {
      const now = new Date();
      const maxAgeHours = TRUST_CONFIG.provenance.maxDataAgeHours;
      
      const provenanceItems = [
        certificateProvenance.hs_code_provenance,
        certificateProvenance.tariff_rates_provenance,
        certificateProvenance.usmca_rules_provenance
      ].filter(item => item && item.last_verified);

      if (provenanceItems.length === 0) return 0;

      const avgAge = provenanceItems.reduce((sum, item) => {
        const verifiedDate = new Date(item.last_verified);
        const ageHours = (now - verifiedDate) / (1000 * 60 * 60);
        return sum + Math.min(ageHours, maxAgeHours);
      }, 0) / provenanceItems.length;

      // Fresher data gets higher score
      return Math.max(0, 1 - (avgAge / maxAgeHours));

    } catch (error) {
      return 0;
    }
  }

  /**
   * Evaluate if expert validation is required for certificate
   */
  async evaluateExpertValidationNeed(certificateTrustScore, classificationResult, usmcaResult) {
    try {
      const expertValidationRequired = certificateTrustScore < TRUST_CONFIG.expertValidation.autoApprovalThreshold;
      
      let expertValidation = {
        expert_validation_required: expertValidationRequired,
        trust_score_threshold: TRUST_CONFIG.expertValidation.autoApprovalThreshold,
        current_trust_score: certificateTrustScore,
        validation_status: expertValidationRequired ? 'required' : 'auto_approved',
        expert_contact_info: null
      };

      if (expertValidationRequired) {
        // Get available expert for validation
        const expertInfo = await expertEndorsementSystem.getAvailableExpert({
          specialization: 'usmca_certificates',
          hs_code: classificationResult?.hs_code,
          business_type: classificationResult?.business_type
        });

        expertValidation.expert_contact_info = expertInfo.success ? expertInfo.expert : null;
        expertValidation.estimated_review_time_hours = TRUST_CONFIG.expertValidation.expertResponseTimeHours;
      }

      return expertValidation;

    } catch (error) {
      logError('Expert validation evaluation failed', { error: error.message });
      return {
        expert_validation_required: true,
        validation_status: 'error_requires_expert',
        error: 'Unable to evaluate expert validation need'
      };
    }
  }

  /**
   * Build comprehensive certificate data structure
   */
  async buildCertificateDataStructure(classificationResult, usmcaResult, formData, certificateId) {
    const today = new Date();
    const validUntil = new Date(today);
    validUntil.setDate(today.getDate() + this.defaultValidityDays);

    return {
      // Certificate identification
      certificate_id: certificateId,
      certificate_number: `USMCA-${certificateId}`,
      certificate_version: this.certificateVersion,
      
      // Standard USMCA Certificate Fields (9-Element Structure)
      
      // Field 1: Exporter information
      exporter: {
        name: formData.company_name || 'TO BE COMPLETED BY EXPORTER',
        address: formData.company_address || 'TO BE COMPLETED BY EXPORTER',
        tax_id: formData.tax_id || 'TO BE COMPLETED BY EXPORTER',
        country: formData.supplier_country || 'TO BE COMPLETED'
      },
      
      // Field 2: Producer information
      producer: {
        name: formData.producer_name || formData.company_name || 'TO BE COMPLETED BY PRODUCER',
        address: formData.producer_address || `Manufacturing Location: ${formData.manufacturing_location || 'TO BE COMPLETED'}`,
        tax_id: formData.producer_tax_id || 'TO BE COMPLETED BY PRODUCER',
        phone: formData.producer_phone || '',
        email: formData.producer_email || '',
        country: formData.producer_country || formData.manufacturing_location || 'TO BE COMPLETED',
        same_as_exporter: formData.producer_same_as_exporter || false
      },
      
      // Field 3: Importer information
      importer: {
        name: 'TO BE COMPLETED BY IMPORTER',
        address: 'TO BE COMPLETED BY IMPORTER',
        tax_id: 'TO BE COMPLETED BY IMPORTER'
      },
      
      // Field 4: Product description and HS classification
      product: {
        description: formData.product_description || classificationResult?.description,
        hs_code: classificationResult?.hs_code || 'TO BE VERIFIED',
        detailed_description: 'TO BE COMPLETED WITH SPECIFIC SHIPMENT DETAILS'
      },
      
      // Field 5: Preference criterion (Field #8 - Origin Criterion)
      preference_criterion: formData.origin_criterion || this.determinePreferenceCriterion(usmcaResult),
      preference_explanation: usmcaResult?.rule || 'Regional Value Content requirement met',
      
      // Field 6: Producer certification
      producer_certification: 'I certify that the information on this document is true and accurate and I assume responsibility for proving such representations.',
      
      // Field 7: Blanket period
      blanket_period: {
        start_date: today.toISOString().split('T')[0],
        end_date: validUntil.toISOString().split('T')[0],
        validity_days: this.defaultValidityDays
      },
      
      // Field 8: Authorized signature
      authorized_signature: {
        signatory_name: 'TO BE COMPLETED BY AUTHORIZED SIGNATORY',
        signatory_title: 'TO BE COMPLETED',
        signature_date: 'TO BE COMPLETED UPON SIGNING',
        signature_placeholder: '________________________'
      },
      
      // Field 9: Additional information
      additional_information: {
        regional_value_content: `${usmcaResult?.north_american_content?.toFixed(1) || 'TBD'}%`,
        qualification_rule: usmcaResult?.rule || 'Regional Value Content',
        method_of_qualification: formData.method_of_qualification || 'TV',
        manufacturing_country: formData.manufacturing_location,
        component_breakdown: usmcaResult?.component_breakdown || []
      },
      
      // Generation metadata
      generation_info: {
        generated_date: today.toISOString(),
        generated_by: 'Triangle Trade Intelligence USMCA Compliance Platform',
        platform_version: this.certificateVersion
      }
    };
  }

  /**
   * Add trust verification elements to certificate
   */
  async addTrustVerificationElements(certificateData, certificateProvenance, certificateTrustScore, expertValidation) {
    const trustElements = {
      // Trust verification section
      trust_verification: {
        overall_trust_score: certificateTrustScore,
        trust_level: this.getTrustLevel(certificateTrustScore),
        verification_status: certificateTrustScore >= TRUST_CONFIG.expertValidation.autoApprovalThreshold ? 'verified' : 'requires_validation',
        data_sources_verified: this.getVerifiedDataSources(certificateProvenance),
        expert_validation: expertValidation
      },
      
      // Data provenance section
      data_provenance: {
        hs_code_source: this.formatProvenanceInfo(certificateProvenance.hs_code_provenance),
        tariff_rates_source: this.formatProvenanceInfo(certificateProvenance.tariff_rates_provenance),
        usmca_rules_source: this.formatProvenanceInfo(certificateProvenance.usmca_rules_provenance),
        verification_timestamp: certificateProvenance.verification_timestamp
      },
      
      // Professional disclaimers
      professional_disclaimers: [
        'This certificate template is generated based on information provided and current USMCA regulations.',
        'Users are responsible for verifying accuracy, completing all required fields, and ensuring compliance with current customs regulations.',
        'Consult qualified customs professionals for complex classifications or unusual circumstances.',
        `Trust Score: ${(certificateTrustScore * 100).toFixed(1)}% - Based on data source reliability and verification freshness.`,
        expertValidation.expert_validation_required ? 
          'EXPERT VALIDATION REQUIRED: This certificate requires professional customs broker review before use.' :
          'Data verification complete - certificate ready for completion and use.'
      ],
      
      // Compliance instructions
      compliance_instructions: [
        'Complete all "TO BE COMPLETED" fields with accurate information',
        'Ensure authorized signatory physically signs and dates the certificate',
        'Verify HS code accuracy with current CBP classifications',
        'Maintain supporting documentation for 5 years minimum',
        'Present this certificate to customs at time of import',
        'Each shipment must reference this certificate number',
        'Valid only for goods shipped during the blanket period'
      ]
    };

    return {
      ...certificateData,
      ...trustElements
    };
  }

  /**
   * Format provenance information for display
   */
  formatProvenanceInfo(provenance) {
    if (!provenance) {
      return 'Source verification unavailable - manual verification required';
    }

    if (provenance.error) {
      return `Verification error: ${provenance.error}`;
    }

    return `Last verified: ${provenance.source} on ${new Date(provenance.last_verified).toLocaleDateString()}`;
  }

  /**
   * Get verified data sources list
   */
  getVerifiedDataSources(certificateProvenance) {
    const sources = [];
    
    if (certificateProvenance.hs_code_provenance?.source) {
      sources.push(`HS Codes: ${certificateProvenance.hs_code_provenance.source}`);
    }
    
    if (certificateProvenance.tariff_rates_provenance?.source) {
      sources.push(`Tariff Rates: ${certificateProvenance.tariff_rates_provenance.source}`);
    }
    
    if (certificateProvenance.usmca_rules_provenance?.source) {
      sources.push(`USMCA Rules: ${certificateProvenance.usmca_rules_provenance.source}`);
    }
    
    return sources.length > 0 ? sources : ['No verified sources available'];
  }

  /**
   * Determine trust level based on score
   */
  getTrustLevel(trustScore) {
    if (trustScore >= 0.95) return 'very_high';
    if (trustScore >= 0.85) return 'high';
    if (trustScore >= 0.70) return 'medium';
    if (trustScore >= 0.50) return 'low';
    return 'very_low';
  }

  /**
   * Determine USMCA preference criterion
   */
  determinePreferenceCriterion(usmcaResult) {
    if (!usmcaResult?.rules_applied) return 'B'; // Default regional content
    
    switch (usmcaResult.rules_applied.rule_type) {
      case 'wholly_obtained': return 'A';
      case 'regional_content': return 'B';
      case 'tariff_shift': return 'C';
      case 'specific_manufacturing': return 'D';
      default: return 'B';
    }
  }

  /**
   * Generate certificate audit trail
   */
  async generateCertificateAuditTrail(certificateData, certificateProvenance, formData) {
    return {
      certificate_id: certificateData.certificate_id,
      generation_timestamp: new Date().toISOString(),
      company_name: formData.company_name,
      product_description: formData.product_description,
      hs_code: certificateData.product.hs_code,
      trust_score: certificateData.trust_verification.overall_trust_score,
      data_sources_used: this.getVerifiedDataSources(certificateProvenance),
      expert_validation_required: certificateData.trust_verification.expert_validation.expert_validation_required,
      compliance_status: 'generated_awaiting_completion',
      audit_trail_id: `AUDIT-${certificateData.certificate_id}-${Date.now()}`
    };
  }

  /**
   * Generate unique certificate ID
   */
  generateCertificateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${timestamp}${random}`;
  }
}

// Export singleton instance
export const trustVerifiedCertificateService = new TrustVerifiedCertificateService();

export default trustVerifiedCertificateService;