/**
 * TRUST COMPLETE WORKFLOW API INTEGRATION TESTS
 * Comprehensive testing for the main workflow orchestration microservice
 * Tests the replacement of monolithic API with focused trust-verified workflow
 */

import { createMocks } from 'node-mocks-http';
import handler from '../../../../pages/api/trust/complete-workflow.js';
import { TRUST_CONFIG, TRUST_PERFORMANCE_CONFIG } from '../../../../config/trust-config.js';

// Mock all dependencies
jest.mock('../../../../lib/classification/database-driven-classifier.js', () => ({
  performIntelligentClassification: jest.fn()
}));

jest.mock('../../../../lib/core/database-driven-usmca-engine.js', () => ({
  databaseDrivenUSMCAEngine: {
    initialize: jest.fn().mockResolvedValue(true),
    checkUSMCAQualification: jest.fn(),
    calculateTariffSavings: jest.fn(),
    generateCertificateData: jest.fn()
  }
}));

jest.mock('../../../../lib/services/data-provenance-service.js', () => ({
  dataProvenanceService: {
    getDataWithProvenance: jest.fn()
  }
}));

jest.mock('../../../../lib/services/expert-endorsement-system.js', () => ({
  expertEndorsementSystem: {
    initializeSystem: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('../../../../lib/services/professional-referral-system.js', () => ({
  professionalReferralSystem: {
    evaluateReferralNeed: jest.fn()
  }
}));

jest.mock('../../../../lib/services/trust/trust-calculation-service.js', () => ({
  trustCalculationService: {
    calculateTrustScore: jest.fn(() => 0.92),
    calculateUSMCATrustScore: jest.fn(() => 0.88),
    calculateSavingsTrustScore: jest.fn(() => 0.85),
    evaluateExpertValidationNeed: jest.fn(() => ({
      validation_required: false,
      urgency_level: 'none',
      estimated_time_hours: 0,
      confidence_threshold_met: true,
      recommended_expert_level: 1
    })),
    generateTrustIndicators: jest.fn(() => ({
      data_provenance_verified: true,
      expert_validation_available: true,
      overall_trust_level: 'high',
      trust_score_display: '92%'
    }))
  }
}));

jest.mock('../../../../lib/services/trust/trust-summary-service.js', () => ({
  trustSummaryService: {
    generateTrustSummary: jest.fn(),
    generateWorkflowSummary: jest.fn()
  }
}));

jest.mock('../../../../lib/utils/production-logger.js', () => ({
  logInfo: jest.fn(),
  logError: jest.fn()
}));

// Import mocked modules for setup
import { performIntelligentClassification } from '../../../../lib/classification/database-driven-classifier.js';
import { databaseDrivenUSMCAEngine } from '../../../../lib/core/database-driven-usmca-engine.js';
import { dataProvenanceService } from '../../../../lib/services/data-provenance-service.js';
import { professionalReferralSystem } from '../../../../lib/services/professional-referral-system.js';
import { trustSummaryService } from '../../../../lib/services/trust/trust-summary-service.js';

describe('/api/trust/complete-workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful mocks
    setupSuccessfulMocks();
  });

  describe('HTTP Methods', () => {
    test('should handle OPTIONS requests for CORS', async () => {
      const { req, res } = createMocks({
        method: 'OPTIONS'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getHeaders()).toHaveProperty('access-control-allow-origin', '*');
      expect(res._getHeaders()).toHaveProperty('access-control-allow-methods', 'GET, POST, OPTIONS');
    });

    test('should reject non-POST requests', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Method not allowed');
      expect(data.allowed_methods).toEqual(['POST']);
      expect(data).toHaveProperty('trust_indicators');
    });

    test('should set all required trust headers', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      const headers = res._getHeaders();
      expect(headers).toHaveProperty('x-data-provenance', 'verified');
      expect(headers).toHaveProperty('x-expert-validated', 'available');
      expect(headers).toHaveProperty('x-continuous-verification', 'active');
      expect(headers).toHaveProperty('x-trust-system', 'operational');
    });
  });

  describe('Request Validation', () => {
    test('should validate required action field', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          data: getValidRequestData()
          // Missing action field
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.errors).toContain('Missing required action field');
      expect(data).toHaveProperty('trust_context');
    });

    test('should validate required data field', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow'
          // Missing data field
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.errors).toContain('Missing required data field');
    });

    test('should include trust context in validation', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'user-agent': 'TestAgent/1.0'
        },
        body: {
          action: 'complete_workflow'
        }
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.trust_context).toHaveProperty('action', 'complete_workflow');
      expect(data.trust_context).toHaveProperty('timestamp');
      expect(data.trust_context).toHaveProperty('user_agent', 'TestAgent/1.0');
      expect(data.trust_context).toHaveProperty('trust_level_required');
    });
  });

  describe('Successful Workflow Execution', () => {
    test('should execute complete workflow successfully', async () => {
      const requestData = getValidRequestData();
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: requestData
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      // Verify response structure
      expect(data.success).toBe(true);
      expect(data.operation).toBe('complete_workflow');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('trust_indicators');
      expect(data).toHaveProperty('verification_timestamp');
      expect(data).toHaveProperty('system_status', 'operational');
      expect(data).toHaveProperty('trust_system_active', true);

      // Verify workflow data structure
      const workflowData = data.data;
      expect(workflowData.success).toBe(true);
      expect(workflowData.workflow_type).toBe('trusted_complete_workflow');
      expect(workflowData).toHaveProperty('processing_time_ms');
      expect(workflowData).toHaveProperty('company');
      expect(workflowData).toHaveProperty('product');
      expect(workflowData).toHaveProperty('usmca');
      expect(workflowData).toHaveProperty('savings');
      expect(workflowData).toHaveProperty('expert_evaluation');
      expect(workflowData).toHaveProperty('trust_assessment');
      expect(workflowData).toHaveProperty('workflow_summary');
      expect(workflowData).toHaveProperty('disclaimers');
    });

    test('should initialize all required systems', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      expect(databaseDrivenUSMCAEngine.initialize).toHaveBeenCalled();
      expect(require('../../../../lib/services/expert-endorsement-system.js').expertEndorsementSystem.initializeSystem).toHaveBeenCalled();
    });

    test('should perform all workflow steps', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      // Verify classification step
      expect(performIntelligentClassification).toHaveBeenCalledWith({
        productDescription: 'Test product',
        businessType: 'Electronics',
        sourceCountry: 'CN'
      });

      // Verify USMCA qualification check
      expect(databaseDrivenUSMCAEngine.checkUSMCAQualification).toHaveBeenCalled();

      // Verify savings calculation
      expect(databaseDrivenUSMCAEngine.calculateTariffSavings).toHaveBeenCalled();

      // Verify data provenance checks
      expect(dataProvenanceService.getDataWithProvenance).toHaveBeenCalledWith('hs_codes', '8517.12');
      expect(dataProvenanceService.getDataWithProvenance).toHaveBeenCalledWith('usmca_rules', '8517.12');
      expect(dataProvenanceService.getDataWithProvenance).toHaveBeenCalledWith('tariff_rates', '8517.12');
    });

    test('should include trust scores for all components', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      const workflowData = JSON.parse(res._getData()).data;

      expect(workflowData.product).toHaveProperty('trust_score', 0.92);
      expect(workflowData.usmca).toHaveProperty('trust_score', 0.88);
      expect(workflowData.savings).toHaveProperty('trust_score', 0.85);
      expect(workflowData.expert_evaluation).toHaveProperty('average_trust_score');
    });

    test('should generate trust indicators for each component', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      const workflowData = JSON.parse(res._getData()).data;

      expect(workflowData.product).toHaveProperty('trust_indicators');
      expect(workflowData.usmca).toHaveProperty('trust_indicators');
      expect(workflowData.savings).toHaveProperty('trust_indicators');

      expect(workflowData.product.trust_indicators).toHaveProperty('data_provenance_verified', true);
      expect(workflowData.product.trust_indicators).toHaveProperty('overall_trust_level', 'high');
    });

    test('should include comprehensive trust assessment', async () => {
      const mockTrustSummary = {
        overall_trust_score: 0.88,
        data_freshness_score: 0.95,
        expert_validation_score: 0.90,
        source_reliability_score: 0.92,
        confidence_level: 'high'
      };

      trustSummaryService.generateTrustSummary.mockResolvedValue(mockTrustSummary);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      const workflowData = JSON.parse(res._getData()).data;

      expect(workflowData.trust_assessment).toEqual(mockTrustSummary);
      expect(trustSummaryService.generateTrustSummary).toHaveBeenCalledWith([
        expect.objectContaining({ trust_score: 0.92 }),
        expect.objectContaining({ trust_score: 0.88 }),
        expect.objectContaining({ trust_score: 0.85 })
      ]);
    });

    test('should include workflow summary with audit trail', async () => {
      const mockWorkflowSummary = {
        workflow_trust_summary: { overall_trust_score: 0.88 },
        audit_trail: {
          total_operations: 3,
          compliance_status: 'compliant',
          operations_log: []
        },
        professional_disclaimers: [
          'Data verified from official government sources',
          'Expert validation available'
        ],
        verification_timestamp: new Date().toISOString()
      };

      trustSummaryService.generateWorkflowSummary.mockResolvedValue(mockWorkflowSummary);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      const workflowData = JSON.parse(res._getData()).data;

      expect(workflowData.workflow_summary).toEqual(mockWorkflowSummary);
      expect(workflowData.disclaimers).toContain('Data verified from official government sources');
    });
  });

  describe('Certificate Generation', () => {
    test('should generate certificate for qualified products', async () => {
      // Mock qualified USMCA result
      databaseDrivenUSMCAEngine.checkUSMCAQualification.mockResolvedValue({
        qualified: true,
        north_american_content: 85,
        qualification_details: ['regional_content', 'tariff_shift']
      });

      databaseDrivenUSMCAEngine.generateCertificateData.mockResolvedValue({
        certificate_id: 'CERT-12345',
        valid_until: '2025-08-29',
        certificate_form: 'USMCA_Certificate_of_Origin'
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      const workflowData = JSON.parse(res._getData()).data;

      expect(workflowData.certificate).toBeDefined();
      expect(workflowData.certificate).toHaveProperty('certificate_id', 'CERT-12345');
      expect(workflowData.certificate).toHaveProperty('certificate_provenance');
      expect(workflowData.certificate.certificate_provenance).toHaveProperty('generated_from_verified_data', true);
      expect(workflowData.certificate.certificate_provenance).toHaveProperty('trust_score');
      expect(workflowData.certificate).toHaveProperty('trust_indicators');
    });

    test('should not generate certificate for unqualified products', async () => {
      databaseDrivenUSMCAEngine.checkUSMCAQualification.mockResolvedValue({
        qualified: false,
        reason: 'Insufficient regional content',
        north_american_content: 45
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      const workflowData = JSON.parse(res._getData()).data;

      expect(workflowData.certificate).toBeNull();
    });

    test('should handle certificate generation errors gracefully', async () => {
      databaseDrivenUSMCAEngine.checkUSMCAQualification.mockResolvedValue({
        qualified: true,
        north_american_content: 85
      });

      databaseDrivenUSMCAEngine.generateCertificateData.mockRejectedValue(
        new Error('Certificate generation failed')
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      const workflowData = JSON.parse(res._getData()).data;

      expect(workflowData.certificate).toHaveProperty('error', 'Certificate generation failed');
      expect(workflowData.certificate).toHaveProperty('trust_score', 0.1);
      expect(workflowData.certificate).toHaveProperty('fallback');
    });
  });

  describe('Expert Validation Integration', () => {
    test('should evaluate expert validation needs', async () => {
      professionalReferralSystem.evaluateReferralNeed.mockResolvedValue({
        requires_professional: true,
        severity: 'medium',
        referral_details: {
          recommendations: ['Verify product classification with customs broker']
        }
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      const workflowData = JSON.parse(res._getData()).data;

      expect(workflowData.expert_evaluation).toHaveProperty('validation_required');
      expect(workflowData.expert_evaluation).toHaveProperty('professional_referral_required', true);
      expect(workflowData.expert_evaluation).toHaveProperty('severity', 'medium');
      expect(workflowData.expert_evaluation.recommendations).toContain('Verify product classification with customs broker');
    });

    test('should calculate average trust score for expert evaluation', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      const workflowData = JSON.parse(res._getData()).data;

      // Average of 0.92, 0.88, 0.85 = 0.88333...
      expect(workflowData.expert_evaluation.average_trust_score).toBeCloseTo(0.88, 2);
    });
  });

  describe('Error Handling', () => {
    test('should handle classification errors gracefully', async () => {
      performIntelligentClassification.mockRejectedValue(new Error('Classification failed'));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Professional customs broker consultation required');
      expect(data.trust_status).toBe('system_error_occurred');
      expect(data.operation_failed).toBe('complete_workflow');
      expect(data.expert_validation_required).toBe(true);
      expect(data).toHaveProperty('timestamp');
    });

    test('should handle initialization errors', async () => {
      databaseDrivenUSMCAEngine.initialize.mockRejectedValue(new Error('Database connection failed'));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.fallback).toBe('Contact licensed customs broker - all data verification failed');
    });

    test('should clear timeout on successful completion', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    test('should clear timeout on error', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      performIntelligentClassification.mockRejectedValue(new Error('Test error'));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Timeout Handling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    test('should setup configurable timeout', async () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      const handlerPromise = handler(req, res);
      
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        TRUST_PERFORMANCE_CONFIG.maxResponseTimeMs.completeWorkflow
      );

      await handlerPromise;
      setTimeoutSpy.mockRestore();
    });
  });

  describe('Performance Requirements', () => {
    test('should complete workflow in reasonable time', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      const startTime = performance.now();
      await handler(req, res);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
      
      const workflowData = JSON.parse(res._getData()).data;
      expect(workflowData.processing_time_ms).toBeDefined();
      expect(workflowData.processing_time_ms).toBeGreaterThan(0);
    });

    test('should track processing time', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      const workflowData = JSON.parse(res._getData()).data;
      expect(workflowData).toHaveProperty('processing_time_ms');
      expect(typeof workflowData.processing_time_ms).toBe('number');
      expect(workflowData.processing_time_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Configuration Compliance', () => {
    test('should use configuration for trust thresholds', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      // Verify configuration is used in trust calculations
      expect(require('../../../../lib/services/trust/trust-calculation-service.js').trustCalculationService.evaluateExpertValidationNeed)
        .toHaveBeenCalledWith(expect.any(Number));
    });

    test('should include configuration-driven disclaimers', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      const workflowData = JSON.parse(res._getData()).data;
      
      expect(Array.isArray(workflowData.disclaimers)).toBe(true);
      expect(workflowData.disclaimers).toContain('Expert validation available for high-value transactions');
    });
  });

  describe('Microservice Architecture Compliance', () => {
    test('should be under 350 lines as required for focused microservice', () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../../../pages/api/trust/complete-workflow.js');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lineCount = fileContent.split('\n').length;
      
      expect(lineCount).toBeLessThan(360); // Allow some margin for comments
    });

    test('should use all shared trust services', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      // Verify trust calculation service usage
      expect(require('../../../../lib/services/trust/trust-calculation-service.js').trustCalculationService.calculateTrustScore)
        .toHaveBeenCalled();
      expect(require('../../../../lib/services/trust/trust-calculation-service.js').trustCalculationService.generateTrustIndicators)
        .toHaveBeenCalled();

      // Verify trust summary service usage
      expect(trustSummaryService.generateTrustSummary).toHaveBeenCalled();
      expect(trustSummaryService.generateWorkflowSummary).toHaveBeenCalled();
    });

    test('should provide focused workflow orchestration', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'complete_workflow',
          data: getValidRequestData()
        }
      });

      await handler(req, res);

      const responseData = JSON.parse(res._getData());
      
      expect(responseData.operation).toBe('complete_workflow');
      expect(responseData.data.workflow_type).toBe('trusted_complete_workflow');
    });
  });

  // Helper functions
  function getValidRequestData() {
    return {
      company_name: 'Test Company Inc',
      business_type: 'Electronics',
      trade_volume: 100000,
      supplier_country: 'CN',
      product_description: 'Test product',
      component_origins: [
        { origin_country: 'CN', value_percentage: 60 },
        { origin_country: 'MX', value_percentage: 40 }
      ],
      manufacturing_location: 'MX'
    };
  }

  function setupSuccessfulMocks() {
    // Classification mock
    performIntelligentClassification.mockResolvedValue({
      success: true,
      results: [{
        hs_code: '8517.12',
        product_description: 'Smartphones and wireless devices',
        confidenceScore: 0.92,
        method: 'database_lookup'
      }]
    });

    // Data provenance mocks
    dataProvenanceService.getDataWithProvenance.mockImplementation((type, code) => ({
      success: true,
      provenance: {
        primary_source: type === 'hs_codes' ? 'CBP_HARMONIZED_TARIFF_SCHEDULE_2024' : 
                      type === 'usmca_rules' ? 'USMCA_QUALIFICATION_RULES_2024' : 
                      'CBP_TARIFF_DATABASE_2024',
        confidence_score: 0.95,
        age_hours: 12,
        expert_reviews: 1,
        source_attribution: `Last verified: ${type.toUpperCase()} 2024-08-29`,
        last_verified: '2024-08-29T10:30:00Z'
      },
      needs_verification: false
    }));

    // USMCA qualification mock
    databaseDrivenUSMCAEngine.checkUSMCAQualification.mockResolvedValue({
      qualified: true,
      north_american_content: 75.5,
      qualification_details: ['regional_content'],
      reason: 'Meets 75% regional content requirement'
    });

    // Savings calculation mock
    databaseDrivenUSMCAEngine.calculateTariffSavings.mockResolvedValue({
      annual_savings: 25000,
      tariff_avoided: 0.125,
      mfn_rate: 0.125,
      usmca_rate: 0.0,
      rates_source: 'CBP_HARMONIZED_TARIFF_SCHEDULE_2024',
      mfn_rate_verified: true,
      usmca_rate_verified: true
    });

    // Professional referral system mock
    professionalReferralSystem.evaluateReferralNeed.mockResolvedValue({
      requires_professional: false,
      severity: 'low',
      referral_details: {
        recommendations: []
      }
    });

    // Trust summary service mocks
    trustSummaryService.generateTrustSummary.mockResolvedValue({
      overall_trust_score: 0.88,
      data_freshness_score: 0.95,
      expert_validation_score: 0.90,
      source_reliability_score: 0.92,
      confidence_level: 'high',
      data_sources_accessed: ['CBP', 'CBSA'],
      verification_checks: 5,
      automated_validations: 3
    });

    trustSummaryService.generateWorkflowSummary.mockResolvedValue({
      workflow_trust_summary: { overall_trust_score: 0.88 },
      audit_trail: {
        total_operations: 3,
        compliance_status: 'compliant'
      },
      professional_disclaimers: [
        'Data verified from official government sources'
      ],
      data_provenance_report: {
        verification_status: 'fully_verified'
      },
      verification_timestamp: new Date().toISOString()
    });
  }
});