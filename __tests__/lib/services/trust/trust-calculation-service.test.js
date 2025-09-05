/**
 * TRUST CALCULATION SERVICE TESTS
 * Comprehensive testing for trust scoring, validation, and metrics calculations
 * Tests the core trust calculation logic used by all 6 microservices
 */

import { TrustCalculationService, trustCalculationService } from '../../../../lib/services/trust/trust-calculation-service.js';
import { TRUST_CONFIG, TRUST_VALIDATION_RULES } from '../../../../config/trust-config.js';

// Mock the production logger
jest.mock('../../../../lib/utils/production-logger.js', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logPerformance: jest.fn()
}));

// Mock system config import
jest.mock('../../../../config/system-config.js', () => ({
  SYSTEM_CONFIG: {
    database: {
      connectionTimeout: 30000
    }
  }
}));

describe('TrustCalculationService', () => {
  let trustService;

  beforeEach(() => {
    trustService = new TrustCalculationService();
  });

  describe('Service Initialization', () => {
    test('should initialize with configuration values', () => {
      expect(trustService.sourceReliabilityScores).toBeDefined();
      expect(trustService.validationRules).toBeDefined();
      expect(trustService.cache).toBeInstanceOf(Map);
    });

    test('should have singleton instance available', () => {
      expect(trustCalculationService).toBeInstanceOf(TrustCalculationService);
    });
  });

  describe('calculateTrustScore', () => {
    test('should calculate trust score with valid provenance data', () => {
      const provenanceData = {
        success: true,
        provenance: {
          confidence_score: 0.85,
          age_hours: 12,
          expert_reviews: 2,
          source: 'CBP'
        }
      };

      const classificationResult = {
        results: [{
          confidenceScore: 0.90
        }]
      };

      const trustScore = trustService.calculateTrustScore(provenanceData, classificationResult);

      expect(trustScore).toBeGreaterThan(0);
      expect(trustScore).toBeLessThanOrEqual(1);
      expect(trustScore).toBeGreaterThan(0.8); // Should be high with good data
    });

    test('should handle missing provenance data gracefully', () => {
      const provenanceData = { success: false };
      const classificationResult = {};

      const trustScore = trustService.calculateTrustScore(provenanceData, classificationResult);

      expect(trustScore).toBe(Math.max(TRUST_VALIDATION_RULES.trustScore.minValue, 0.3));
    });

    test('should apply configurable weights correctly', () => {
      const provenanceData = {
        success: true,
        provenance: {
          confidence_score: 0.8,
          age_hours: 24,
          expert_reviews: 1
        }
      };

      const classificationResult = {
        results: [{
          confidenceScore: 0.9
        }]
      };

      const options = { classificationWeight: 0.6 }; // Higher classification weight
      const trustScore = trustService.calculateTrustScore(provenanceData, classificationResult, options);

      expect(trustScore).toBeGreaterThan(0.7);
    });

    test('should enforce validation rules constraints', () => {
      const provenanceData = {
        success: true,
        provenance: {
          confidence_score: 1.5, // Artificially high
          age_hours: 0,
          expert_reviews: 10
        }
      };

      const classificationResult = {
        results: [{
          confidenceScore: 1.2 // Artificially high
        }]
      };

      const trustScore = trustService.calculateTrustScore(provenanceData, classificationResult);

      expect(trustScore).toBeLessThanOrEqual(TRUST_VALIDATION_RULES.trustScore.maxValue);
      expect(trustScore).toBeGreaterThanOrEqual(TRUST_VALIDATION_RULES.trustScore.minValue);
    });

    test('should handle calculation errors gracefully', () => {
      const invalidProvenanceData = null;
      const classificationResult = {};

      const trustScore = trustService.calculateTrustScore(invalidProvenanceData, classificationResult);

      expect(trustScore).toBe(TRUST_VALIDATION_RULES.trustScore.minValue);
    });
  });

  describe('calculateUSMCATrustScore', () => {
    test('should calculate USMCA-specific trust score', () => {
      const usmcaResult = {
        qualified: true,
        north_american_content: 85,
        qualification_rules: ['regional_content', 'tariff_shift']
      };

      const rulesProvenance = {
        success: true,
        provenance: {
          confidence_score: 0.9,
          source: 'CBP_USMCA_RULES_2024'
        }
      };

      const trustScore = trustService.calculateUSMCATrustScore(usmcaResult, rulesProvenance);

      expect(trustScore).toBeGreaterThan(0.8); // Should be high for qualified products
      expect(trustScore).toBeLessThanOrEqual(1);
    });

    test('should penalize unqualified products', () => {
      const usmcaResult = {
        qualified: false,
        north_american_content: 45,
        qualification_rules: []
      };

      const rulesProvenance = {
        success: true,
        provenance: {
          confidence_score: 0.9
        }
      };

      const trustScore = trustService.calculateUSMCATrustScore(usmcaResult, rulesProvenance);

      expect(trustScore).toBeLessThan(0.8); // Should be lower for unqualified
    });

    test('should handle missing provenance for USMCA calculations', () => {
      const usmcaResult = {
        qualified: true,
        north_american_content: 75
      };

      const rulesProvenance = { success: false };

      const trustScore = trustService.calculateUSMCATrustScore(usmcaResult, rulesProvenance);

      expect(trustScore).toBeGreaterThanOrEqual(TRUST_VALIDATION_RULES.trustScore.minValue);
    });
  });

  describe('calculateSavingsTrustScore', () => {
    test('should calculate savings trust score with reliable sources', () => {
      const savingsResult = {
        annual_savings: 50000,
        rates_source: 'CBP_HARMONIZED_TARIFF_SCHEDULE_2024',
        mfn_rate_verified: true,
        usmca_rate_verified: true
      };

      const ratesProvenance = {
        success: true,
        provenance: {
          confidence_score: 0.92,
          source: 'CBP'
        }
      };

      const trustScore = trustService.calculateSavingsTrustScore(savingsResult, ratesProvenance);

      expect(trustScore).toBeGreaterThan(0.8); // Should be high with verified rates
    });

    test('should apply source reliability correctly', () => {
      const cbpSavingsResult = {
        rates_source: 'CBP_HARMONIZED_TARIFF_SCHEDULE',
        mfn_rate_verified: true,
        usmca_rate_verified: true
      };

      const emergencySavingsResult = {
        rates_source: 'EMERGENCY_FALLBACK',
        mfn_rate_verified: false,
        usmca_rate_verified: false
      };

      const provenance = {
        success: true,
        provenance: { confidence_score: 0.8 }
      };

      const cbpScore = trustService.calculateSavingsTrustScore(cbpSavingsResult, provenance);
      const emergencyScore = trustService.calculateSavingsTrustScore(emergencySavingsResult, provenance);

      expect(cbpScore).toBeGreaterThan(emergencyScore);
    });
  });

  describe('verifyDataSources', () => {
    test('should verify multiple data sources', () => {
      const dataSources = ['CBP', 'CBSA', 'COMTRADE'];

      const verification = trustService.verifyDataSources(dataSources);

      expect(verification).toHaveProperty('verified_sources');
      expect(verification).toHaveProperty('total_sources', 3);
      expect(verification).toHaveProperty('reliability_scores');
      expect(verification).toHaveProperty('overall_reliability');
      expect(verification).toHaveProperty('source_agreement');
      expect(verification.verification_status).toMatch(/verified|partially_verified|failed/);
    });

    test('should handle empty sources array', () => {
      const verification = trustService.verifyDataSources([]);

      expect(verification.total_sources).toBe(0);
      expect(verification.verified_sources).toBe(0);
      expect(verification.verification_status).toBe('failed');
    });

    test('should calculate source agreement correctly', () => {
      const highQualitySources = ['CBP', 'CBSA', 'SAT']; // All government sources
      const mixedSources = ['CBP', 'EMERGENCY_FALLBACK', 'UNKNOWN'];

      const highQualityVerification = trustService.verifyDataSources(highQualitySources);
      const mixedVerification = trustService.verifyDataSources(mixedSources);

      expect(highQualityVerification.source_agreement).toBeGreaterThan(mixedVerification.source_agreement);
    });
  });

  describe('calculateAccuracyMetrics', () => {
    test('should calculate comprehensive accuracy metrics', () => {
      const performanceData = {
        classification_accuracy: 0.975,
        qualification_accuracy: 0.958,
        savings_accuracy: 0.982
      };

      const metrics = trustService.calculateAccuracyMetrics(performanceData);

      expect(metrics).toHaveProperty('classification_accuracy');
      expect(metrics).toHaveProperty('qualification_accuracy');
      expect(metrics).toHaveProperty('savings_calculation_accuracy');
      expect(metrics).toHaveProperty('overall_accuracy');
      expect(metrics).toHaveProperty('meets_threshold');
      expect(metrics).toHaveProperty('accuracy_trend');

      expect(metrics.overall_accuracy).toBeGreaterThan(0);
      expect(metrics.overall_accuracy).toBeLessThanOrEqual(1);
    });

    test('should determine if accuracy meets configured threshold', () => {
      const highPerformanceData = {
        classification_accuracy: 0.98,
        qualification_accuracy: 0.97,
        savings_accuracy: 0.99
      };

      const lowPerformanceData = {
        classification_accuracy: 0.85,
        qualification_accuracy: 0.80,
        savings_accuracy: 0.88
      };

      const highMetrics = trustService.calculateAccuracyMetrics(highPerformanceData);
      const lowMetrics = trustService.calculateAccuracyMetrics(lowPerformanceData);

      expect(highMetrics.meets_threshold).toBe(true);
      expect(lowMetrics.meets_threshold).toBe(false);
    });

    test('should use default values when performance data is missing', () => {
      const metrics = trustService.calculateAccuracyMetrics({});

      expect(metrics.classification_accuracy).toBeGreaterThan(0);
      expect(metrics.qualification_accuracy).toBeGreaterThan(0);
      expect(metrics.savings_calculation_accuracy).toBeGreaterThan(0);
    });
  });

  describe('calculatePerformanceMetrics', () => {
    test('should calculate performance metrics with thresholds', () => {
      const responseData = {
        avg_response_time_ms: 150,
        max_response_time_ms: 400,
        uptime_percentage: 0.999
      };

      const metrics = trustService.calculatePerformanceMetrics(responseData);

      expect(metrics).toHaveProperty('avg_response_time_ms');
      expect(metrics).toHaveProperty('max_response_time_ms');
      expect(metrics).toHaveProperty('uptime_percentage');
      expect(metrics).toHaveProperty('meets_performance_targets');
      expect(metrics).toHaveProperty('performance_grade');

      expect(['excellent', 'good', 'needs_improvement', 'unknown']).toContain(metrics.performance_grade);
    });

    test('should grade performance correctly', () => {
      const excellentData = {
        avg_response_time_ms: 100,
        uptime_percentage: 0.999
      };

      const poorData = {
        avg_response_time_ms: 5000,
        uptime_percentage: 0.95
      };

      const excellentMetrics = trustService.calculatePerformanceMetrics(excellentData);
      const poorMetrics = trustService.calculatePerformanceMetrics(poorData);

      expect(excellentMetrics.performance_grade).toBe('excellent');
      expect(poorMetrics.performance_grade).toBe('needs_improvement');
    });
  });

  describe('evaluateExpertValidationNeed', () => {
    test('should require expert validation for low trust scores', () => {
      const lowTrustScore = 0.4;

      const evaluation = trustService.evaluateExpertValidationNeed(lowTrustScore);

      expect(evaluation.validation_required).toBe(true);
      expect(evaluation.urgency_level).toMatch(/critical|high|normal/);
      expect(evaluation.estimated_time_hours).toBeGreaterThan(0);
    });

    test('should not require validation for high trust scores', () => {
      const highTrustScore = 0.98;

      const evaluation = trustService.evaluateExpertValidationNeed(highTrustScore);

      expect(evaluation.validation_required).toBe(false);
      expect(evaluation.confidence_threshold_met).toBe(true);
      expect(evaluation.urgency_level).toBe('none');
    });

    test('should escalate critical cases appropriately', () => {
      const criticalTrustScore = 0.2;

      const evaluation = trustService.evaluateExpertValidationNeed(criticalTrustScore);

      expect(evaluation.urgency_level).toBe('critical');
      expect(evaluation.recommended_expert_level).toBe(3); // Senior expert
      expect(evaluation.estimated_time_hours).toBe(2); // Fast response
    });

    test('should use configurable thresholds', () => {
      const mediumTrustScore = 0.75;

      const evaluation = trustService.evaluateExpertValidationNeed(mediumTrustScore);

      expect(evaluation.validation_required).toBe(true);
      expect(evaluation.urgency_level).toBe('high');
      expect(evaluation.estimated_time_hours).toBe(TRUST_CONFIG.expertValidation.expertResponseTimeHours);
    });
  });

  describe('generateTrustIndicators', () => {
    test('should generate comprehensive trust indicators', () => {
      const trustMetrics = {
        overall_trust_score: 0.92,
        accuracy_rate: 0.968,
        avg_response_time: 180
      };

      const indicators = trustService.generateTrustIndicators(trustMetrics);

      expect(indicators).toHaveProperty('data_provenance_verified');
      expect(indicators).toHaveProperty('expert_validation_available');
      expect(indicators).toHaveProperty('continuous_verification_active');
      expect(indicators).toHaveProperty('meets_accuracy_threshold');
      expect(indicators).toHaveProperty('meets_performance_threshold');
      expect(indicators).toHaveProperty('overall_trust_level');
      expect(indicators).toHaveProperty('trust_score_display');

      expect(['very_high', 'high', 'medium', 'low', 'unknown']).toContain(indicators.overall_trust_level);
      expect(indicators.trust_score_display).toMatch(/^\d{1,3}%$/);
    });

    test('should categorize trust levels correctly', () => {
      const veryHighMetrics = { overall_trust_score: 0.95 };
      const highMetrics = { overall_trust_score: 0.85 };
      const mediumMetrics = { overall_trust_score: 0.75 };
      const lowMetrics = { overall_trust_score: 0.60 };

      const veryHighIndicators = trustService.generateTrustIndicators(veryHighMetrics);
      const highIndicators = trustService.generateTrustIndicators(highMetrics);
      const mediumIndicators = trustService.generateTrustIndicators(mediumMetrics);
      const lowIndicators = trustService.generateTrustIndicators(lowMetrics);

      expect(veryHighIndicators.overall_trust_level).toBe('very_high');
      expect(highIndicators.overall_trust_level).toBe('high');
      expect(mediumIndicators.overall_trust_level).toBe('medium');
      expect(lowIndicators.overall_trust_level).toBe('low');
    });
  });

  describe('Helper Methods', () => {
    describe('calculateFreshnessBonus', () => {
      test('should give bonus for fresh data', () => {
        const freshBonus = trustService.calculateFreshnessBonus(12); // 12 hours
        const staleBonus = trustService.calculateFreshnessBonus(100); // 100 hours
        const expiredPenalty = trustService.calculateFreshnessBonus(800); // 800 hours

        expect(freshBonus).toBeGreaterThan(staleBonus);
        expect(staleBonus).toBeGreaterThan(expiredPenalty);
        expect(expiredPenalty).toBeLessThan(0);
      });
    });

    describe('getSourceReliability', () => {
      test('should return correct reliability scores for known sources', () => {
        const cbpScore = trustService.getSourceReliability('CBP_HARMONIZED_TARIFF_SCHEDULE');
        const cbsaScore = trustService.getSourceReliability('CBSA_TARIFF_2024');
        const comtradeScore = trustService.getSourceReliability('UN_COMTRADE');
        const unknownScore = trustService.getSourceReliability('UNKNOWN_SOURCE');

        expect(cbpScore).toBeGreaterThan(cbsaScore);
        expect(cbsaScore).toBeGreaterThan(comtradeScore);
        expect(unknownScore).toBe(0.7); // Default for unknown
      });

      test('should handle null or undefined sources', () => {
        const nullScore = trustService.getSourceReliability(null);
        const undefinedScore = trustService.getSourceReliability(undefined);

        expect(nullScore).toBe(0.3);
        expect(undefinedScore).toBe(0.3);
      });
    });

    describe('calculateVerificationBonus', () => {
      test('should give bonus for verified rates', () => {
        const verifiedResult = {
          mfn_rate_verified: true,
          usmca_rate_verified: true,
          rates_source: 'database_lookup'
        };

        const unverifiedResult = {
          mfn_rate_verified: false,
          usmca_rate_verified: false,
          rates_source: 'emergency_fallback'
        };

        const verifiedBonus = trustService.calculateVerificationBonus(verifiedResult);
        const unverifiedBonus = trustService.calculateVerificationBonus(unverifiedResult);

        expect(verifiedBonus).toBeGreaterThan(unverifiedBonus);
        expect(verifiedBonus).toBeGreaterThan(0);
      });
    });
  });

  describe('Configuration Integration', () => {
    test('should use configurable reliability scores', () => {
      expect(trustService.sourceReliabilityScores.cbp).toBe(TRUST_CONFIG.provenance.sourceReliabilityScores.cbp);
      expect(trustService.sourceReliabilityScores.cbsa).toBe(TRUST_CONFIG.provenance.sourceReliabilityScores.cbsa);
      expect(trustService.sourceReliabilityScores.sat).toBe(TRUST_CONFIG.provenance.sourceReliabilityScores.sat);
    });

    test('should respect validation rules constraints', () => {
      expect(trustService.validationRules.trustScore.minValue).toBe(TRUST_VALIDATION_RULES.trustScore.minValue);
      expect(trustService.validationRules.trustScore.maxValue).toBe(TRUST_VALIDATION_RULES.trustScore.maxValue);
    });
  });

  describe('Performance Requirements', () => {
    test('should complete trust score calculations quickly', async () => {
      const startTime = performance.now();

      const provenanceData = {
        success: true,
        provenance: {
          confidence_score: 0.85,
          age_hours: 24,
          expert_reviews: 1
        }
      };

      const classificationResult = {
        results: [{ confidenceScore: 0.9 }]
      };

      // Run calculation 100 times to test performance
      for (let i = 0; i < 100; i++) {
        trustService.calculateTrustScore(provenanceData, classificationResult);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 100;

      expect(averageTime).toBeLessThan(10); // Less than 10ms per calculation
    });

    test('should handle concurrent calculations without issues', async () => {
      const provenanceData = {
        success: true,
        provenance: { confidence_score: 0.85, age_hours: 24, expert_reviews: 1 }
      };
      const classificationResult = { results: [{ confidenceScore: 0.9 }] };

      // Run multiple concurrent calculations
      const promises = Array(50).fill(null).map(() => 
        Promise.resolve(trustService.calculateTrustScore(provenanceData, classificationResult))
      );

      const results = await Promise.all(promises);

      // All results should be consistent
      expect(results.every(score => score === results[0])).toBe(true);
      expect(results[0]).toBeGreaterThan(0.8);
    });
  });

  describe('Zero Hardcoded Values Compliance', () => {
    test('should not contain hardcoded business logic values', () => {
      // Test that service uses configuration instead of hardcoded values
      const trustScore = trustService.calculateTrustScore(
        { success: true, provenance: { confidence_score: 0.8, age_hours: 24, expert_reviews: 1 } },
        { results: [{ confidenceScore: 0.9 }] }
      );

      // Verify score is within configured bounds
      expect(trustScore).toBeLessThanOrEqual(TRUST_VALIDATION_RULES.trustScore.maxValue);
      expect(trustScore).toBeGreaterThanOrEqual(TRUST_VALIDATION_RULES.trustScore.minValue);

      // Verify service uses configuration values, not hardcoded ones
      expect(trustService.sourceReliabilityScores.cbp).toBe(TRUST_CONFIG.provenance.sourceReliabilityScores.cbp);
    });

    test('should support configuration changes without code modification', () => {
      // Verify that service adapts to configuration changes
      const originalScore = trustService.getSourceReliability('CBP');
      
      // This test ensures the service reads from configuration
      expect(originalScore).toBe(TRUST_CONFIG.provenance.sourceReliabilityScores.cbp);
    });
  });

  describe('Microservices Architecture Support', () => {
    test('should be suitable for microservice consumption', () => {
      // Test that service is stateless (except for cache)
      const service1 = new TrustCalculationService();
      const service2 = new TrustCalculationService();

      const testData = {
        provenance: { success: true, provenance: { confidence_score: 0.8, age_hours: 24, expert_reviews: 1 } },
        classification: { results: [{ confidenceScore: 0.9 }] }
      };

      const score1 = service1.calculateTrustScore(testData.provenance, testData.classification);
      const score2 = service2.calculateTrustScore(testData.provenance, testData.classification);

      expect(score1).toBe(score2); // Same inputs should produce same outputs
    });

    test('should provide all required methods for microservice integration', () => {
      const requiredMethods = [
        'calculateTrustScore',
        'calculateUSMCATrustScore',
        'calculateSavingsTrustScore',
        'verifyDataSources',
        'calculateAccuracyMetrics',
        'calculatePerformanceMetrics',
        'evaluateExpertValidationNeed',
        'generateTrustIndicators'
      ];

      requiredMethods.forEach(method => {
        expect(typeof trustService[method]).toBe('function');
      });
    });
  });
});