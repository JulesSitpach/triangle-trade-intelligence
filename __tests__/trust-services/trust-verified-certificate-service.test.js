/**
 * TRUST-VERIFIED CERTIFICATE SERVICE TESTS
 * Comprehensive testing for enhanced certificate generation with trust verification
 */

import { TrustVerifiedCertificateService } from '../../lib/services/trust-verified-certificate-service.js';
import { certificateErrorRecoveryService } from '../../lib/services/certificate-error-recovery-service.js';
import { trustVerifiedCertificateFormatter } from '../../lib/utils/trust-verified-certificate-formatter.js';

// Mock dependencies
jest.mock('../../lib/services/data-provenance-service.js', () => ({
  dataProvenanceService: {
    getDataWithProvenance: jest.fn()
  }
}));

jest.mock('../../lib/services/expert-endorsement-system.js', () => ({
  expertEndorsementSystem: {
    getAvailableExpert: jest.fn()
  }
}));

jest.mock('../../lib/services/trust/trust-calculation-service.js', () => ({
  trustCalculationService: {
    calculateTrustScore: jest.fn(),
    calculateUSMCATrustScore: jest.fn(),
    calculateSavingsTrustScore: jest.fn(),
    evaluateExpertValidationNeed: jest.fn(),
    generateTrustIndicators: jest.fn()
  }
}));

describe('TrustVerifiedCertificateService', () => {
  let service;
  let mockClassificationResult;
  let mockUSMCAResult;
  let mockFormData;

  beforeEach(() => {
    service = new TrustVerifiedCertificateService();
    
    mockClassificationResult = {
      success: true,
      hs_code: '6204.62.2000',
      description: 'Women\'s cotton trousers',
      confidence: 0.95,
      trust_score: 0.90
    };

    mockUSMCAResult = {
      qualified: true,
      qualification_level: 'qualified',
      north_american_content: 75.5,
      rule: 'Regional Value Content (62.5% required)',
      trust_score: 0.85,
      component_breakdown: [
        { origin_country: 'MX', value_percentage: 60, is_usmca_member: true },
        { origin_country: 'US', value_percentage: 15.5, is_usmca_member: true },
        { origin_country: 'CN', value_percentage: 24.5, is_usmca_member: false }
      ]
    };

    mockFormData = {
      company_name: 'Test Manufacturing Corp',
      product_description: 'Women\'s cotton trousers',
      business_type: 'Textiles',
      supplier_country: 'MX',
      manufacturing_location: 'MX',
      trade_volume: '5000000',
      component_origins: [
        { origin_country: 'MX', value_percentage: 60 },
        { origin_country: 'US', value_percentage: 15.5 },
        { origin_country: 'CN', value_percentage: 24.5 }
      ]
    };
  });

  describe('generateTrustVerifiedCertificate', () => {
    it('should generate a complete trust-verified certificate', async () => {
      // Mock all dependencies to return successful results
      const { dataProvenanceService } = require('../../lib/services/data-provenance-service.js');
      const { expertEndorsementSystem } = require('../../lib/services/expert-endorsement-system.js');
      const { trustCalculationService } = require('../../lib/services/trust/trust-calculation-service.js');

      dataProvenanceService.getDataWithProvenance.mockResolvedValue({
        success: true,
        provenance: {
          source: 'CBP_Harmonized_Tariff_Schedule_2024',
          last_verified: '2024-08-29T10:00:00Z',
          verification_id: 'CBP_2024_Q3_001'
        }
      });

      expertEndorsementSystem.getAvailableExpert.mockResolvedValue({
        success: true,
        expert: {
          expert_name: 'Licensed Customs Broker #12345',
          specializations: ['usmca_certificates', 'textiles']
        }
      });

      trustCalculationService.calculateTrustScore.mockReturnValue(0.92);
      trustCalculationService.evaluateExpertValidationNeed.mockReturnValue({
        expert_validation_required: false,
        validation_status: 'auto_approved'
      });

      const result = await service.generateTrustVerifiedCertificate(
        mockClassificationResult, 
        mockUSMCAResult, 
        mockFormData
      );

      expect(result.success).toBe(true);
      expect(result.certificate).toBeDefined();
      expect(result.certificate.certificate_id).toBeDefined();
      expect(result.certificate.exporter.name).toBe('Test Manufacturing Corp');
      expect(result.certificate.product.hs_code).toBe('6204.62.2000');
      expect(result.certificate.preference_criterion).toBe('B');
      expect(result.trust_verification).toBeDefined();
      expect(result.trust_verification.trust_score).toBeGreaterThan(0.8);
    });

    it('should require expert validation for low trust scores', async () => {
      const { dataProvenanceService } = require('../../lib/services/data-provenance-service.js');
      const { expertEndorsementSystem } = require('../../lib/services/expert-endorsement-system.js');
      const { trustCalculationService } = require('../../lib/services/trust/trust-calculation-service.js');

      dataProvenanceService.getDataWithProvenance.mockResolvedValue({
        success: true,
        provenance: {
          source: 'CBP_Harmonized_Tariff_Schedule_2024',
          last_verified: '2024-07-01T10:00:00Z', // Older data
          verification_id: 'CBP_2024_Q2_001'
        }
      });

      expertEndorsementSystem.getAvailableExpert.mockResolvedValue({
        success: true,
        expert: {
          expert_name: 'Expert Validator',
          contact_info: 'expert@customs.com'
        }
      });

      trustCalculationService.calculateTrustScore.mockReturnValue(0.65); // Low trust score
      trustCalculationService.evaluateExpertValidationNeed.mockReturnValue({
        expert_validation_required: true,
        validation_status: 'required',
        estimated_review_time_hours: 24
      });

      const result = await service.generateTrustVerifiedCertificate(
        mockClassificationResult, 
        mockUSMCAResult, 
        mockFormData
      );

      expect(result.success).toBe(true);
      expect(result.trust_verification.expert_validation.expert_validation_required).toBe(true);
      expect(result.trust_verification.expert_validation.validation_status).toBe('required');
    });

    it('should handle non-qualifying products', async () => {
      const nonQualifyingUSMCAResult = {
        ...mockUSMCAResult,
        qualified: false,
        north_american_content: 45.0,
        reason: 'Insufficient North American content (45.0% < 62.5% required)'
      };

      const result = await service.generateTrustVerifiedCertificate(
        mockClassificationResult, 
        nonQualifyingUSMCAResult, 
        mockFormData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not qualify for USMCA');
    });

    it('should recover from errors using error recovery service', async () => {
      // Mock data provenance service to throw an error
      const { dataProvenanceService } = require('../../lib/services/data-provenance-service.js');
      dataProvenanceService.getDataWithProvenance.mockRejectedValue(new Error('Data provenance service unavailable'));

      // Mock recovery service
      jest.spyOn(certificateErrorRecoveryService, 'attemptCertificateRecovery').mockResolvedValue({
        success: true,
        certificate: {
          certificate_id: 'FALLBACK-123456',
          recovery_applied: true,
          trust_verification: {
            overall_trust_score: 0.1,
            trust_level: 'very_low',
            verification_status: 'failed_requires_manual'
          }
        }
      });

      const result = await service.generateTrustVerifiedCertificate(
        mockClassificationResult, 
        mockUSMCAResult, 
        mockFormData
      );

      expect(result.success).toBe(true);
      expect(result.certificate.recovery_applied).toBe(true);
      expect(certificateErrorRecoveryService.attemptCertificateRecovery).toHaveBeenCalled();
    });
  });

  describe('calculateCertificateTrustScore', () => {
    it('should calculate trust score from multiple components', async () => {
      const mockProvenance = {
        hs_code_provenance: {
          source: 'CBP',
          last_verified: new Date().toISOString()
        },
        tariff_rates_provenance: {
          source: 'CBP',
          last_verified: new Date().toISOString()
        },
        usmca_rules_provenance: {
          source: 'CBP',
          last_verified: new Date().toISOString()
        }
      };

      const trustScore = await service.calculateCertificateTrustScore(
        mockClassificationResult,
        mockUSMCAResult,
        mockProvenance
      );

      expect(trustScore).toBeGreaterThan(0);
      expect(trustScore).toBeLessThanOrEqual(1);
    });

    it('should handle missing provenance data', async () => {
      const trustScore = await service.calculateCertificateTrustScore(
        mockClassificationResult,
        mockUSMCAResult,
        null
      );

      expect(trustScore).toBe(0.1); // Very low trust score on error
    });
  });

  describe('buildCertificateDataStructure', () => {
    it('should build complete 9-element USMCA certificate structure', async () => {
      const certificate = await service.buildCertificateDataStructure(
        mockClassificationResult,
        mockUSMCAResult,
        mockFormData,
        'TEST-CERT-123'
      );

      // Verify all 9 USMCA certificate elements are present
      expect(certificate.exporter).toBeDefined();
      expect(certificate.producer).toBeDefined(); 
      expect(certificate.importer).toBeDefined();
      expect(certificate.product).toBeDefined();
      expect(certificate.preference_criterion).toBeDefined();
      expect(certificate.producer_certification).toBeDefined();
      expect(certificate.blanket_period).toBeDefined();
      expect(certificate.authorized_signature).toBeDefined();
      expect(certificate.additional_information).toBeDefined();

      // Verify key data is populated correctly
      expect(certificate.exporter.name).toBe('Test Manufacturing Corp');
      expect(certificate.product.hs_code).toBe('6204.62.2000');
      expect(certificate.preference_criterion).toBe('B');
      expect(certificate.additional_information.regional_value_content).toBe('75.5%');
    });
  });

  describe('determinePreferenceCriterion', () => {
    it('should return correct preference criteria for different rule types', () => {
      const ruleTypes = [
        { rule_type: 'wholly_obtained', expected: 'A' },
        { rule_type: 'regional_content', expected: 'B' },
        { rule_type: 'tariff_shift', expected: 'C' },
        { rule_type: 'specific_manufacturing', expected: 'D' },
        { rule_type: 'unknown', expected: 'B' }
      ];

      ruleTypes.forEach(({ rule_type, expected }) => {
        const usmcaResult = {
          rules_applied: { rule_type }
        };
        const criterion = service.determinePreferenceCriterion(usmcaResult);
        expect(criterion).toBe(expected);
      });
    });
  });
});

describe('CertificateErrorRecoveryService', () => {
  describe('attemptCertificateRecovery', () => {
    it('should classify different error types correctly', () => {
      const errorTypes = [
        { message: 'Missing required field', expected: 'data_missing' },
        { message: 'Data provenance verification failed', expected: 'provenance_failed' },
        { message: 'Trust score calculation error', expected: 'trust_calculation_failed' },
        { message: 'Expert validation system unavailable', expected: 'expert_validation_failed' },
        { message: 'Certificate formatting failed', expected: 'formatting_failed' },
        { message: 'Database connection timeout', expected: 'system_error' },
        { message: 'Unknown error occurred', expected: 'unknown_error' }
      ];

      errorTypes.forEach(({ message, expected }) => {
        const error = new Error(message);
        const errorType = certificateErrorRecoveryService.classifyError(error);
        expect(errorType).toBe(expected);
      });
    });

    it('should generate fallback certificate for missing data', async () => {
      const error = new Error('Missing required field: hs_code');
      const result = await certificateErrorRecoveryService.recoverFromMissingData(
        error,
        null, // Missing classification result
        mockUSMCAResult,
        mockFormData
      );

      expect(result.success).toBe(true);
      expect(result.certificate).toBeDefined();
      expect(result.certificate.trust_verification.overall_trust_score).toBe(0.1);
      expect(result.certificate.professional_disclaimers).toContain(
        'CERTIFICATE GENERATED WITH INCOMPLETE DATA - Expert validation required'
      );
    });

    it('should handle complete system failures', async () => {
      const error = new Error('System database unavailable');
      const result = await certificateErrorRecoveryService.recoverFromSystemError(
        error,
        mockClassificationResult,
        mockUSMCAResult,
        mockFormData
      );

      expect(result.success).toBe(false);
      expect(result.fallback).toBeDefined();
      expect(result.fallback.expert_consultation_required).toBe(true);
      expect(result.fallback.alternative_approach).toContain(
        'Use official USMCA certificate form directly'
      );
    });
  });
});

describe('TrustVerifiedCertificateFormatter', () => {
  let mockCertificate;

  beforeEach(() => {
    mockCertificate = {
      certificate_number: 'USMCA-TEST-123456',
      certificate_version: '2.0-TRUST',
      exporter: {
        name: 'Test Corp',
        address: '123 Test Street',
        tax_id: 'TAX123',
        country: 'MX'
      },
      product: {
        description: 'Test Product',
        hs_code: '1234.56.7890'
      },
      trust_verification: {
        overall_trust_score: 0.92,
        trust_level: 'high',
        verification_status: 'verified',
        data_sources_verified: ['CBP: Last verified 2024-08-29'],
        expert_validation: {
          expert_validation_required: false,
          validation_status: 'auto_approved'
        }
      },
      generation_info: {
        generated_date: '2024-08-29T10:00:00Z',
        generated_by: 'Triangle Intelligence'
      }
    };
  });

  describe('formatForDownload', () => {
    it('should format official USMCA certificate correctly', () => {
      const formatted = trustVerifiedCertificateFormatter.formatForDownload(
        mockCertificate, 
        'official'
      );

      expect(formatted).toContain('UNITED STATES-MEXICO-CANADA AGREEMENT');
      expect(formatted).toContain('CERTIFICATE OF ORIGIN');
      expect(formatted).toContain('TRUST-VERIFIED CERTIFICATE');
      expect(formatted).toContain('Certificate Number: USMCA-TEST-123456');
      expect(formatted).toContain('Trust Level: HIGH (92.0%)');
      expect(formatted).toContain('AUTO-VALIDATED');
      expect(formatted).toContain('FIELD 1 - EXPORTER NAME AND ADDRESS');
      expect(formatted).toContain('Test Corp');
    });

    it('should format detailed trust certificate', () => {
      const formatted = trustVerifiedCertificateFormatter.formatForDownload(
        mockCertificate, 
        'detailed'
      );

      expect(formatted).toContain('DETAILED TRUST-VERIFIED CERTIFICATE');
      expect(formatted).toContain('TRUST VERIFICATION ANALYSIS');
      expect(formatted).toContain('Overall Trust Score: 92.0%');
      expect(formatted).toContain('CERTIFICATE READINESS ASSESSMENT');
    });

    it('should format simple certificate', () => {
      const formatted = trustVerifiedCertificateFormatter.formatForDownload(
        mockCertificate, 
        'simple'
      );

      expect(formatted).toContain('SIMPLE FORMAT');
      expect(formatted).toContain('Trust Level: HIGH');
      expect(formatted).toContain('Trust Score: 92.0%');
      expect(formatted).toContain('Certificate ready for completion and use');
    });
  });

  describe('generateDownloadFilename', () => {
    it('should generate appropriate filenames', () => {
      const filename = trustVerifiedCertificateFormatter.generateDownloadFilename(
        mockCertificate, 
        'official'
      );

      expect(filename).toMatch(/USMCA_Certificate_Test_Corp_1234\.56\.7890_\d{4}-\d{2}-\d{2}_official\.txt/);
    });
  });

  describe('getTrustLevelDisplay', () => {
    it('should return correct trust level displays', () => {
      const levels = [
        { score: 0.98, expected: 'VERY HIGH' },
        { score: 0.90, expected: 'HIGH' },
        { score: 0.75, expected: 'MEDIUM' },
        { score: 0.55, expected: 'LOW' },
        { score: 0.30, expected: 'VERY LOW' }
      ];

      levels.forEach(({ score, expected }) => {
        const level = trustVerifiedCertificateFormatter.getTrustLevelDisplay(score);
        expect(level).toBe(expected);
      });
    });
  });
});