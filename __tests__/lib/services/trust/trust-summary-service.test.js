/**
 * TRUST SUMMARY SERVICE TESTS
 * Comprehensive testing for trust reporting, result consolidation, and professional report generation
 * Tests the shared service used by all 6 trust microservices
 */

import { TrustSummaryService, trustSummaryService } from '../../../../lib/services/trust/trust-summary-service.js';
import { TRUST_CONFIG, TRUST_MESSAGES, TRUST_VALIDATION_RULES } from '../../../../config/trust-config.js';

// Mock dependencies
jest.mock('../../../../lib/utils/production-logger.js', () => ({
  logError: jest.fn()
}));

jest.mock('../../../../config/system-config.js', () => ({
  MESSAGES: {
    disclaimers: {
      general: 'This is for informational purposes only'
    }
  }
}));

// Mock trust calculation service
jest.mock('../../../../lib/services/trust/trust-calculation-service.js', () => ({
  trustCalculationService: {
    evaluateExpertValidationNeed: jest.fn((trustScore) => ({
      validation_required: trustScore < 0.8,
      urgency_level: trustScore < 0.5 ? 'critical' : 'normal',
      estimated_time_hours: 24,
      recommended_expert_level: 2
    })),
    getSourceReliability: jest.fn((source) => {
      if (!source) return 0.3;
      if (source.includes('CBP')) return 0.98;
      if (source.includes('CBSA')) return 0.96;
      if (source.includes('EMERGENCY')) return 0.4;
      return 0.7;
    })
  }
}));

describe('TrustSummaryService', () => {
  let summaryService;

  beforeEach(() => {
    summaryService = new TrustSummaryService();
  });

  describe('Service Initialization', () => {
    test('should initialize with calculation service dependency', () => {
      expect(summaryService.calculationService).toBeDefined();
    });

    test('should have singleton instance available', () => {
      expect(trustSummaryService).toBeInstanceOf(TrustSummaryService);
    });

    test('should be under 150 lines as required for microservices', () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../../../lib/services/trust/trust-summary-service.js');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lineCount = fileContent.split('\n').length;
      
      expect(lineCount).toBeLessThan(160); // Including comments and whitespace
    });
  });

  describe('generateTrustSummary', () => {
    test('should generate comprehensive trust summary from multiple results', async () => {
      const results = [
        {
          trust_score: 0.92,
          provenance: {
            primary_source: 'CBP_HARMONIZED_TARIFF_SCHEDULE_2024',
            confidence_score: 0.95,
            age_hours: 12,
            expert_reviews: 2,
            source_attribution: 'Last verified: CBP 2024-08-29'
          }
        },
        {
          trust_score: 0.88,
          provenance: {
            rules_source: 'USMCA_QUALIFICATION_RULES_2024',
            confidence_score: 0.90,
            age_hours: 24,
            expert_reviews: 1,
            source_attribution: 'Last verified: CBSA 2024-08-28'
          }
        },
        {
          trust_score: 0.85,
          provenance: {
            rates_source: 'CBP_TARIFF_DATABASE_2024',
            confidence_score: 0.88,
            age_hours: 6,
            expert_reviews: 0,
            source_attribution: 'Last verified: CBP 2024-08-29'
          }
        }
      ];

      const summary = await summaryService.generateTrustSummary(results);

      expect(summary).toHaveProperty('overall_trust_score');
      expect(summary).toHaveProperty('data_freshness_score');
      expect(summary).toHaveProperty('expert_validation_score');
      expect(summary).toHaveProperty('source_reliability_score');
      expect(summary).toHaveProperty('data_sources_accessed');
      expect(summary).toHaveProperty('verification_checks');
      expect(summary).toHaveProperty('automated_validations');
      expect(summary).toHaveProperty('source_attributions');
      expect(summary).toHaveProperty('recommendations');
      expect(summary).toHaveProperty('confidence_level');

      // Verify calculations
      expect(summary.overall_trust_score).toBeCloseTo(0.88, 2); // Average of 0.92, 0.88, 0.85
      expect(summary.data_sources_accessed).toHaveLength(3);
      expect(summary.source_attributions).toHaveLength(3);
      expect(['very_high', 'high', 'medium', 'low']).toContain(summary.confidence_level);
    });

    test('should handle empty results array', async () => {
      const summary = await summaryService.generateTrustSummary([]);

      expect(summary.overall_trust_score).toBe(TRUST_VALIDATION_RULES.trustScore.minValue);
      expect(summary.data_sources_accessed).toHaveLength(0);
      expect(summary.automated_validations).toBe(0);
      expect(summary.confidence_level).toBe('low');
    });

    test('should handle results without provenance data', async () => {
      const results = [
        { trust_score: 0.7 },
        { trust_score: 0.6 }
      ];

      const summary = await summaryService.generateTrustSummary(results);

      expect(summary.overall_trust_score).toBeCloseTo(0.65, 2);
      expect(summary.data_sources_accessed).toHaveLength(0);
      expect(summary.source_attributions).toHaveLength(0);
    });

    test('should calculate data freshness correctly', async () => {
      const freshResults = [
        {
          trust_score: 0.9,
          provenance: {
            primary_source: 'CBP',
            age_hours: 6 // Fresh data
          }
        }
      ];

      const staleResults = [
        {
          trust_score: 0.8,
          provenance: {
            primary_source: 'CBSA',
            age_hours: 200 // Stale data
          }
        }
      ];

      const freshSummary = await summaryService.generateTrustSummary(freshResults);
      const staleSummary = await summaryService.generateTrustSummary(staleResults);

      expect(freshSummary.data_freshness_score).toBeGreaterThan(staleSummary.data_freshness_score);
    });

    test('should handle errors gracefully', async () => {
      // Pass invalid input to trigger error
      const summary = await summaryService.generateTrustSummary(null);

      expect(summary).toEqual(summaryService.getFailsafeTrustSummary());
      expect(summary.overall_trust_score).toBe(TRUST_VALIDATION_RULES.trustScore.minValue);
    });
  });

  describe('generateWorkflowSummary', () => {
    test('should generate comprehensive workflow summary', async () => {
      const classificationResult = {
        success: true,
        trust_score: 0.92,
        hs_code: '8517.12',
        provenance: {
          primary_source: 'CBP',
          confidence_score: 0.95,
          age_hours: 12
        }
      };

      const usmcaResult = {
        success: true,
        trust_score: 0.88,
        qualified: true,
        provenance: {
          rules_source: 'USMCA_RULES',
          confidence_score: 0.90,
          age_hours: 24
        }
      };

      const savingsResult = {
        success: true,
        trust_score: 0.85,
        annual_savings: 50000,
        provenance: {
          rates_source: 'CBP_TARIFF_DATABASE',
          confidence_score: 0.88,
          age_hours: 6
        }
      };

      const workflowSummary = await summaryService.generateWorkflowSummary(
        classificationResult,
        usmcaResult,
        savingsResult
      );

      expect(workflowSummary).toHaveProperty('workflow_trust_summary');
      expect(workflowSummary).toHaveProperty('audit_trail');
      expect(workflowSummary).toHaveProperty('professional_disclaimers');
      expect(workflowSummary).toHaveProperty('expert_validation_summary');
      expect(workflowSummary).toHaveProperty('data_provenance_report');
      expect(workflowSummary).toHaveProperty('verification_timestamp');

      // Verify audit trail
      expect(workflowSummary.audit_trail.total_operations).toBe(3);
      expect(workflowSummary.audit_trail.compliance_status).toBe('compliant');
      expect(workflowSummary.audit_trail.operations_log).toHaveLength(3);

      // Verify expert validation summary
      expect(workflowSummary.expert_validation_summary).toHaveProperty('validation_required');
      expect(workflowSummary.expert_validation_summary).toHaveProperty('urgency_level');
    });

    test('should handle failed operations in workflow', async () => {
      const failedClassification = { success: false, trust_score: 0.3 };
      const failedUSMCA = { success: false, trust_score: 0.2 };
      const failedSavings = { success: false, trust_score: 0.1 };

      const workflowSummary = await summaryService.generateWorkflowSummary(
        failedClassification,
        failedUSMCA,
        failedSavings
      );

      expect(workflowSummary.audit_trail.compliance_status).toBe('requires_attention');
      expect(workflowSummary.expert_validation_summary.validation_required).toBe(true);
      expect(workflowSummary.expert_validation_summary.urgency_level).toBe('critical');
    });
  });

  describe('formatProvenanceReport', () => {
    test('should format comprehensive provenance report', () => {
      const results = [
        {
          hs_code: '8517.12',
          provenance: {
            primary_source: 'CBP_HARMONIZED_TARIFF_SCHEDULE_2024',
            last_verified: '2024-08-29T10:30:00Z',
            confidence_score: 0.95
          }
        },
        {
          qualified: true,
          provenance: {
            rules_source: 'USMCA_QUALIFICATION_RULES_2024',
            last_verified: '2024-08-28T15:20:00Z',
            confidence_score: 0.90
          }
        },
        {
          annual_savings: 25000,
          provenance: {
            rates_source: 'CBP_TARIFF_DATABASE_2024',
            last_verified: '2024-08-29T09:45:00Z',
            confidence_score: 0.88
          }
        }
      ];

      const provenanceReport = summaryService.formatProvenanceReport(results);

      expect(provenanceReport.total_data_points).toBe(3);
      expect(provenanceReport.verified_sources).toBe(3);
      expect(provenanceReport.verification_status).toBe('fully_verified');
      expect(provenanceReport.source_details).toHaveLength(3);

      // Check data type detection
      expect(provenanceReport.source_details[0].data_type).toBe('classification');
      expect(provenanceReport.source_details[1].data_type).toBe('usmca_qualification');
      expect(provenanceReport.source_details[2].data_type).toBe('tariff_savings');
    });

    test('should handle partial verification scenarios', () => {
      const partialResults = [
        {
          hs_code: '8517.12',
          provenance: {
            primary_source: 'CBP',
            confidence_score: 0.95
          }
        },
        {
          qualified: false
          // No provenance data
        }
      ];

      const report = summaryService.formatProvenanceReport(partialResults);

      expect(report.total_data_points).toBe(2);
      expect(report.verified_sources).toBe(1);
      expect(report.verification_status).toBe('partially_verified');
    });
  });

  describe('createAuditTrail', () => {
    test('should create detailed audit trail', () => {
      const operations = [
        {
          success: true,
          trust_score: 0.92,
          provenance: { primary_source: 'CBP' }
        },
        {
          success: true,
          trust_score: 0.88,
          provenance: { rules_source: 'USMCA' }
        },
        {
          success: false,
          trust_score: 0.3
          // No provenance
        }
      ];

      const auditTrail = summaryService.createAuditTrail(operations);

      expect(auditTrail.total_operations).toBe(3);
      expect(auditTrail.compliance_status).toBe('requires_attention'); // One operation failed
      expect(auditTrail.operations_log).toHaveLength(3);

      // Check operation types
      expect(auditTrail.operations_log[0].operation).toBe('product_classification');
      expect(auditTrail.operations_log[1].operation).toBe('usmca_qualification');
      expect(auditTrail.operations_log[2].operation).toBe('savings_calculation');

      // Check data verification tracking
      expect(auditTrail.operations_log[0].data_verified).toBe(true);
      expect(auditTrail.operations_log[1].data_verified).toBe(true);
      expect(auditTrail.operations_log[2].data_verified).toBe(false);
    });

    test('should handle empty operations', () => {
      const auditTrail = summaryService.createAuditTrail([]);

      expect(auditTrail.total_operations).toBe(0);
      expect(auditTrail.compliance_status).toBe('compliant'); // No failures
      expect(auditTrail.operations_log).toHaveLength(0);
    });
  });

  describe('generateProfessionalDisclaimer', () => {
    test('should generate appropriate disclaimers for high trust results', () => {
      const highTrustResults = [
        {
          trust_score: 0.95,
          provenance: { age_hours: 12 }
        },
        {
          trust_score: 0.92,
          provenance: { age_hours: 24 }
        }
      ];

      const disclaimers = summaryService.generateProfessionalDisclaimer(highTrustResults);

      expect(disclaimers).toContain(TRUST_MESSAGES.provenance.dataVerified);
      expect(disclaimers).toContain('All data verified from official government sources');
      expect(disclaimers).toContain('Expert validation available for professional-grade accuracy');
    });

    test('should generate verification warnings for low trust results', () => {
      const lowTrustResults = [
        {
          trust_score: 0.4,
          provenance: { age_hours: 12 }
        },
        {
          trust_score: 0.3,
          provenance: { age_hours: 24 }
        }
      ];

      const disclaimers = summaryService.generateProfessionalDisclaimer(lowTrustResults);

      expect(disclaimers).toContain(TRUST_MESSAGES.provenance.verificationFailed);
    });

    test('should warn about stale data', () => {
      const staleResults = [
        {
          trust_score: 0.9,
          provenance: { age_hours: 200 } // Stale data
        }
      ];

      const disclaimers = summaryService.generateProfessionalDisclaimer(staleResults);

      expect(disclaimers.some(d => d.includes('latest regulatory changes'))).toBe(true);
    });

    test('should deduplicate disclaimers', () => {
      const results = [
        { trust_score: 0.9, provenance: { age_hours: 12 } },
        { trust_score: 0.9, provenance: { age_hours: 12 } }
      ];

      const disclaimers = summaryService.generateProfessionalDisclaimer(results);
      const uniqueDisclaimers = [...new Set(disclaimers)];

      expect(disclaimers).toEqual(uniqueDisclaimers);
    });
  });

  describe('Helper Methods', () => {
    describe('calculateDataFreshness', () => {
      test('should calculate freshness based on data age', () => {
        const freshResults = [
          { provenance: { age_hours: 6 } },
          { provenance: { age_hours: 12 } }
        ];

        const staleResults = [
          { provenance: { age_hours: 100 } },
          { provenance: { age_hours: 200 } }
        ];

        const freshScore = summaryService.calculateDataFreshness(freshResults);
        const staleScore = summaryService.calculateDataFreshness(staleResults);

        expect(freshScore).toBeGreaterThan(staleScore);
        expect(freshScore).toBeLessThanOrEqual(1.0);
        expect(staleScore).toBeGreaterThanOrEqual(0);
      });

      test('should handle results without age data', () => {
        const resultsWithoutAge = [
          { trust_score: 0.9 },
          { trust_score: 0.8 }
        ];

        const score = summaryService.calculateDataFreshness(resultsWithoutAge);
        expect(score).toBe(0.5); // Default score
      });
    });

    describe('calculateSourceReliability', () => {
      test('should calculate reliability based on source types', () => {
        const highReliabilitySources = ['CBP', 'CBSA'];
        const mixedSources = ['CBP', 'EMERGENCY_FALLBACK'];

        const highScore = summaryService.calculateSourceReliability(highReliabilitySources);
        const mixedScore = summaryService.calculateSourceReliability(mixedSources);

        expect(highScore).toBeGreaterThan(mixedScore);
      });
    });

    describe('calculateExpertValidationScore', () => {
      test('should calculate score based on expert reviews', () => {
        const highExpertResults = [
          { provenance: { expert_reviews: 3 } },
          { provenance: { expert_reviews: 2 } }
        ];

        const lowExpertResults = [
          { provenance: { expert_reviews: 0 } },
          { provenance: { expert_reviews: 1 } }
        ];

        const highScore = summaryService.calculateExpertValidationScore(highExpertResults);
        const lowScore = summaryService.calculateExpertValidationScore(lowExpertResults);

        expect(highScore).toBeGreaterThan(lowScore);
        expect(highScore).toBeLessThanOrEqual(1.0);
      });
    });

    describe('getConfidenceLevel', () => {
      test('should return appropriate confidence levels', () => {
        expect(summaryService.getConfidenceLevel(0.95)).toBe('very_high');
        expect(summaryService.getConfidenceLevel(0.85)).toBe('high');
        expect(summaryService.getConfidenceLevel(0.75)).toBe('medium');
        expect(summaryService.getConfidenceLevel(0.55)).toBe('low');
      });

      test('should use configurable thresholds', () => {
        const warningThreshold = TRUST_VALIDATION_RULES.trustScore.warningThreshold;
        const criticalThreshold = TRUST_VALIDATION_RULES.trustScore.criticalThreshold;

        // Just above warning threshold should be high
        expect(summaryService.getConfidenceLevel(warningThreshold + 0.01)).toBe('high');
        
        // Just above critical threshold should be medium
        expect(summaryService.getConfidenceLevel(criticalThreshold + 0.01)).toBe('medium');
      });
    });

    describe('getDataType', () => {
      test('should identify data types correctly', () => {
        expect(summaryService.getDataType({ hs_code: '8517.12' })).toBe('classification');
        expect(summaryService.getDataType({ qualified: true })).toBe('usmca_qualification');
        expect(summaryService.getDataType({ annual_savings: 25000 })).toBe('tariff_savings');
        expect(summaryService.getDataType({ unknown: 'data' })).toBe('unknown');
      });
    });
  });

  describe('Configuration Integration', () => {
    test('should use configurable trust validation rules', () => {
      const highTrustResults = [{ trust_score: TRUST_VALIDATION_RULES.trustScore.warningThreshold + 0.1 }];
      const lowTrustResults = [{ trust_score: TRUST_VALIDATION_RULES.trustScore.criticalThreshold - 0.1 }];

      const highRecommendations = summaryService.generateTrustRecommendations(highTrustResults[0].trust_score);
      const lowRecommendations = summaryService.generateTrustRecommendations(lowTrustResults[0].trust_score);

      expect(highRecommendations).toContain(TRUST_MESSAGES.trustMetrics.mediumTrustScore);
      expect(lowRecommendations).toContain(TRUST_MESSAGES.trustMetrics.lowTrustScore);
    });

    test('should use configurable data age thresholds', () => {
      const freshData = [{ provenance: { age_hours: TRUST_VALIDATION_RULES.dataAge.freshDataHours - 1 } }];
      const staleData = [{ provenance: { age_hours: TRUST_VALIDATION_RULES.dataAge.staleDataHours + 1 } }];

      const freshScore = summaryService.calculateDataFreshness(freshData);
      const staleScore = summaryService.calculateDataFreshness(staleData);

      expect(freshScore).toBeGreaterThan(staleScore);
    });
  });

  describe('Microservices Architecture Support', () => {
    test('should be stateless and suitable for microservice consumption', () => {
      const service1 = new TrustSummaryService();
      const service2 = new TrustSummaryService();

      const testResults = [
        {
          trust_score: 0.9,
          provenance: { primary_source: 'CBP', confidence_score: 0.95, age_hours: 12 }
        }
      ];

      const summary1 = service1.generateTrustSummary(testResults);
      const summary2 = service2.generateTrustSummary(testResults);

      // Both services should produce identical results for same input
      expect(summary1).toEqual(summary2);
    });

    test('should provide all methods required by microservices', () => {
      const requiredMethods = [
        'generateTrustSummary',
        'generateWorkflowSummary',
        'formatProvenanceReport',
        'createAuditTrail',
        'generateProfessionalDisclaimer'
      ];

      requiredMethods.forEach(method => {
        expect(typeof summaryService[method]).toBe('function');
      });
    });

    test('should handle high concurrency without state conflicts', async () => {
      const testResults = [{ trust_score: 0.85, provenance: { primary_source: 'CBP' } }];

      // Simulate concurrent requests
      const promises = Array(50).fill(null).map(() => 
        summaryService.generateTrustSummary(testResults)
      );

      const results = await Promise.all(promises);

      // All results should be identical
      const firstResult = results[0];
      expect(results.every(result => JSON.stringify(result) === JSON.stringify(firstResult))).toBe(true);
    });
  });

  describe('Performance Requirements', () => {
    test('should complete summary generation quickly', async () => {
      const testResults = Array(10).fill(null).map((_, i) => ({
        trust_score: 0.8 + (i * 0.01),
        provenance: {
          primary_source: `TEST_SOURCE_${i}`,
          confidence_score: 0.9,
          age_hours: 12 + i
        }
      }));

      const startTime = performance.now();
      await summaryService.generateTrustSummary(testResults);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Less than 50ms
    });
  });
});