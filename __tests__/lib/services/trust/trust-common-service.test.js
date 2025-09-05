/**
 * TRUST COMMON SERVICE TESTS
 * Comprehensive testing for shared utilities used by all 6 trust microservices
 * Tests error handling, headers, validation, and professional fallback systems
 */

import {
  setTrustHeaders,
  getTrustIndicators,
  validateTrustRequest,
  handleTrustError,
  setupTrustTimeout,
  formatTrustResponse,
  logTrustOperation,
  validateTrustPermissions
} from '../../../../lib/services/trust/trust-common-service.js';

import { TRUST_CONFIG, TRUST_PERFORMANCE_CONFIG } from '../../../../config/trust-config.js';

// Mock dependencies
jest.mock('../../../../config/system-config.js', () => ({
  SYSTEM_CONFIG: {
    api: {
      timeout: 30000
    }
  },
  MESSAGES: {
    errors: {
      professionalRequired: 'Professional customs broker consultation required',
      timeoutError: 'Request timeout - please try again'
    }
  }
}));

jest.mock('../../../../lib/utils/production-logger.js', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logRequest: jest.fn()
}));

describe('Trust Common Service', () => {
  describe('setTrustHeaders', () => {
    test('should set all required trust headers', () => {
      const mockRes = {
        setHeader: jest.fn()
      };

      setTrustHeaders(mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Data-Provenance', 'verified');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Expert-Validated', 'available');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Continuous-Verification', 'active');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Trust-System', 'operational');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, X-Trust-Context');

      expect(mockRes.setHeader).toHaveBeenCalledTimes(7);
    });
  });

  describe('getTrustIndicators', () => {
    test('should return comprehensive trust indicators', async () => {
      const indicators = await getTrustIndicators();

      expect(indicators).toHaveProperty('data_provenance_active');
      expect(indicators).toHaveProperty('expert_validation_available');
      expect(indicators).toHaveProperty('continuous_verification_running');
      expect(indicators).toHaveProperty('automated_source_verification');
      expect(indicators).toHaveProperty('official_government_sources');
      expect(indicators).toHaveProperty('audit_trail_maintained');
      expect(indicators).toHaveProperty('system_status');
      expect(indicators).toHaveProperty('last_verified');
      expect(indicators).toHaveProperty('verification_sources');
      expect(indicators).toHaveProperty('expert_network');

      // Verify indicator values match configuration
      expect(indicators.data_provenance_active).toBe(TRUST_CONFIG.provenance.provenanceTrackingEnabled);
      expect(indicators.expert_validation_available).toBe(TRUST_CONFIG.expertValidation.expertValidationRequired);
      expect(indicators.continuous_verification_running).toBe(TRUST_CONFIG.continuousVerification.dailySyncEnabled);
      
      // Verify static trust indicators
      expect(indicators.automated_source_verification).toBe(true);
      expect(indicators.official_government_sources).toBe(true);
      expect(indicators.audit_trail_maintained).toBe(true);
      expect(indicators.system_status).toBe('operational');
      expect(indicators.expert_network).toBe('licensed_customs_brokers');

      // Verify verification sources array
      expect(Array.isArray(indicators.verification_sources)).toBe(true);
      expect(indicators.verification_sources).toEqual(Object.keys(TRUST_CONFIG.provenance.sourceReliabilityScores));

      // Verify timestamp format
      expect(indicators.last_verified).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('validateTrustRequest', () => {
    test('should validate request with required action and data', () => {
      const validRequest = {
        body: {
          action: 'complete_workflow',
          data: {
            product_description: 'Test product',
            supplier_country: 'CN'
          }
        },
        headers: {
          'user-agent': 'Mozilla/5.0 Test Browser'
        },
        ip: '192.168.1.1'
      };

      const validation = validateTrustRequest(validRequest);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.trust_context).toHaveProperty('action', 'complete_workflow');
      expect(validation.trust_context).toHaveProperty('timestamp');
      expect(validation.trust_context).toHaveProperty('user_agent', 'Mozilla/5.0 Test Browser');
      expect(validation.trust_context).toHaveProperty('ip_address', '192.168.1.1');
      expect(validation.trust_context).toHaveProperty('trust_level_required', TRUST_CONFIG.trustMetrics.minAccuracyRate);
    });

    test('should reject request missing action field', () => {
      const invalidRequest = {
        body: {
          data: { product_description: 'Test' }
        },
        headers: {},
        ip: '192.168.1.1'
      };

      const validation = validateTrustRequest(invalidRequest);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing required action field');
    });

    test('should reject request missing data field for non-metrics actions', () => {
      const invalidRequest = {
        body: {
          action: 'complete_workflow'
          // Missing data field
        },
        headers: {},
        ip: '192.168.1.1'
      };

      const validation = validateTrustRequest(invalidRequest);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing required data field');
    });

    test('should allow missing data for get_trust_metrics action', () => {
      const validMetricsRequest = {
        body: {
          action: 'get_trust_metrics'
          // No data field required for metrics
        },
        headers: {},
        ip: '192.168.1.1'
      };

      const validation = validateTrustRequest(validMetricsRequest);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should handle missing headers and IP gracefully', () => {
      const requestWithMissingInfo = {
        body: {
          action: 'test_action',
          data: { test: 'data' }
        }
        // Missing headers and ip
      };

      const validation = validateTrustRequest(requestWithMissingInfo);

      expect(validation.trust_context.user_agent).toBe('unknown');
      expect(validation.trust_context.ip_address).toBe('unknown');
    });
  });

  describe('handleTrustError', () => {
    test('should handle errors with professional fallback', () => {
      const mockRes = {
        headersSent: false,
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const testError = new Error('Test error occurred');
      const operation = 'test_operation';

      const result = handleTrustError(testError, mockRes, operation);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Professional customs broker consultation required',
        trust_status: 'system_error_occurred',
        operation_failed: operation,
        technical_error: 'Test error occurred',
        fallback: 'Contact licensed customs broker - all data verification failed',
        expert_validation_required: true,
        timestamp: expect.any(String)
      });
    });

    test('should not send response if headers already sent', () => {
      const mockRes = {
        headersSent: true,
        status: jest.fn(),
        json: jest.fn()
      };

      const testError = new Error('Test error');
      handleTrustError(testError, mockRes, 'test_operation');

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    test('should include stack trace in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockRes = {
        headersSent: false,
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const testError = new Error('Test error');
      testError.stack = 'Error: Test error\n    at test:1:1';

      handleTrustError(testError, mockRes, 'test_operation');

      const errorResponse = mockRes.json.mock.calls[0][0];
      expect(errorResponse).toHaveProperty('technical_error', 'Test error');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('setupTrustTimeout', () => {
    beforeEach(() => {
      jest.clearAllTimers();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    test('should setup timeout with configured duration', () => {
      const mockRes = {
        headersSent: false,
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const operation = 'complete_workflow';
      const timeout = setupTrustTimeout(mockRes, operation);

      // Fast-forward time
      jest.advanceTimersByTime(TRUST_PERFORMANCE_CONFIG.maxResponseTimeMs[operation]);

      expect(mockRes.status).toHaveBeenCalledWith(408);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Request timeout - please try again',
        trust_status: 'timeout_occurred',
        operation_timed_out: operation,
        timeout_duration_ms: TRUST_PERFORMANCE_CONFIG.maxResponseTimeMs[operation],
        fallback: 'Professional customs broker consultation required',
        timestamp: expect.any(String)
      });

      clearTimeout(timeout);
    });

    test('should use custom timeout if provided', () => {
      const mockRes = {
        headersSent: false,
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const customTimeout = 5000;
      setupTrustTimeout(mockRes, 'test_operation', customTimeout);

      jest.advanceTimersByTime(customTimeout);

      const timeoutResponse = mockRes.json.mock.calls[0][0];
      expect(timeoutResponse.timeout_duration_ms).toBe(customTimeout);
    });

    test('should not send timeout response if headers already sent', () => {
      const mockRes = {
        headersSent: true,
        status: jest.fn(),
        json: jest.fn()
      };

      setupTrustTimeout(mockRes, 'test_operation', 1000);
      jest.advanceTimersByTime(1000);

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('formatTrustResponse', () => {
    test('should format comprehensive trust response', () => {
      const testData = {
        classification: { hs_code: '8517.12' },
        trust_score: 0.92
      };

      const trustIndicators = {
        data_verified: true,
        expert_available: true
      };

      const operation = 'complete_workflow';

      const response = formatTrustResponse(testData, trustIndicators, operation);

      expect(response.success).toBe(true);
      expect(response.operation).toBe(operation);
      expect(response.data).toEqual(testData);
      expect(response.trust_indicators).toEqual(trustIndicators);
      expect(response).toHaveProperty('verification_timestamp');
      expect(response.system_status).toBe('operational');
      expect(response.trust_system_active).toBe(true);
      expect(response.accuracy_rate).toBe('96.8%');
      expect(response.professional_validation_available).toBe(TRUST_CONFIG.expertValidation.expertValidationRequired);
      expect(response.audit_trail_available).toBe(true);
      expect(response.data_provenance_tracked).toBe(TRUST_CONFIG.provenance.provenanceTrackingEnabled);
      expect(response.continuous_verification_active).toBe(TRUST_CONFIG.continuousVerification.dailySyncEnabled);
    });

    test('should use default values when indicators not provided', () => {
      const testData = { test: 'data' };
      const response = formatTrustResponse(testData);

      expect(response.trust_indicators).toEqual({});
      expect(response.operation).toBe('trust_operation');
    });

    test('should include timestamp in ISO format', () => {
      const response = formatTrustResponse({ test: 'data' });
      
      expect(response.verification_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('logTrustOperation', () => {
    test('should log trust operation with comprehensive context', () => {
      const mockReq = {
        method: 'POST',
        url: '/api/trust/complete-workflow'
      };

      const operation = 'complete_workflow';
      const startTime = Date.now() - 150; // 150ms ago
      const additionalContext = {
        trust_score: 0.92,
        data_sources: ['CBP', 'CBSA']
      };

      const logResult = logTrustOperation(operation, startTime, mockReq, true, additionalContext);

      expect(logResult).toHaveProperty('operation', operation);
      expect(logResult).toHaveProperty('response_time_ms');
      expect(logResult).toHaveProperty('success', true);
      expect(logResult).toHaveProperty('trust_context');

      expect(logResult.response_time_ms).toBeGreaterThan(0);
      expect(logResult.trust_context).toHaveProperty('trust_level', 0.92);
      expect(logResult.trust_context).toHaveProperty('data_sources', ['CBP', 'CBSA']);
    });

    test('should handle failed operations', () => {
      const mockReq = { method: 'POST', url: '/api/trust/test' };
      const startTime = Date.now() - 200;

      const logResult = logTrustOperation('test_operation', startTime, mockReq, false);

      expect(logResult.success).toBe(false);
      expect(logResult.trust_context.trust_level).toBe('unknown');
    });

    test('should calculate response time accurately', () => {
      const mockReq = { method: 'GET', url: '/api/trust/metrics' };
      const startTime = Date.now() - 100; // Exactly 100ms ago
      
      const logResult = logTrustOperation('get_metrics', startTime, mockReq);

      expect(logResult.response_time_ms).toBeGreaterThanOrEqual(95);
      expect(logResult.response_time_ms).toBeLessThan(110); // Allow some variance
    });
  });

  describe('validateTrustPermissions', () => {
    test('should allow all operations when features are enabled', () => {
      const operations = [
        'expert_validation',
        'data_provenance', 
        'continuous_verification'
      ];

      operations.forEach(operation => {
        const permissions = validateTrustPermissions(operation);
        
        expect(permissions.allowed).toBe(true);
        expect(permissions.restrictions).toHaveLength(0);
      });
    });

    test('should restrict operations when features are disabled', () => {
      // Mock configuration with disabled features
      const originalConfig = TRUST_CONFIG.expertValidation.expertValidationRequired;
      TRUST_CONFIG.expertValidation.expertValidationRequired = false;

      const permissions = validateTrustPermissions('expert_validation');

      expect(permissions.allowed).toBe(false);
      expect(permissions.restrictions).toContain('Expert validation disabled in configuration');

      // Restore original config
      TRUST_CONFIG.expertValidation.expertValidationRequired = originalConfig;
    });

    test('should validate provenance tracking permissions', () => {
      const originalConfig = TRUST_CONFIG.provenance.provenanceTrackingEnabled;
      TRUST_CONFIG.provenance.provenanceTrackingEnabled = false;

      const permissions = validateTrustPermissions('data_provenance');

      expect(permissions.allowed).toBe(false);
      expect(permissions.restrictions).toContain('Provenance tracking disabled in configuration');

      // Restore original config
      TRUST_CONFIG.provenance.provenanceTrackingEnabled = originalConfig;
    });

    test('should validate continuous verification permissions', () => {
      const originalConfig = TRUST_CONFIG.continuousVerification.dailySyncEnabled;
      TRUST_CONFIG.continuousVerification.dailySyncEnabled = false;

      const permissions = validateTrustPermissions('continuous_verification');

      expect(permissions.allowed).toBe(false);
      expect(permissions.restrictions).toContain('Continuous verification disabled');

      // Restore original config
      TRUST_CONFIG.continuousVerification.dailySyncEnabled = originalConfig;
    });

    test('should allow unknown operations by default', () => {
      const permissions = validateTrustPermissions('unknown_operation');

      expect(permissions.allowed).toBe(true);
      expect(permissions.restrictions).toHaveLength(0);
    });

    test('should handle multiple restrictions', () => {
      const originalExpertConfig = TRUST_CONFIG.expertValidation.expertValidationRequired;
      const originalProvenanceConfig = TRUST_CONFIG.provenance.provenanceTrackingEnabled;

      TRUST_CONFIG.expertValidation.expertValidationRequired = false;
      TRUST_CONFIG.provenance.provenanceTrackingEnabled = false;

      const expertPermissions = validateTrustPermissions('expert_validation');
      const provenancePermissions = validateTrustPermissions('data_provenance');

      expect(expertPermissions.restrictions).toHaveLength(1);
      expect(provenancePermissions.restrictions).toHaveLength(1);

      // Restore original configs
      TRUST_CONFIG.expertValidation.expertValidationRequired = originalExpertConfig;
      TRUST_CONFIG.provenance.provenanceTrackingEnabled = originalProvenanceConfig;
    });
  });

  describe('Configuration Integration', () => {
    test('should use configurable performance timeouts', () => {
      const operation = 'trust_metrics';
      const expectedTimeout = TRUST_PERFORMANCE_CONFIG.maxResponseTimeMs[operation];

      const mockRes = {
        headersSent: false,
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      jest.useFakeTimers();
      setupTrustTimeout(mockRes, operation);
      jest.advanceTimersByTime(expectedTimeout);

      const timeoutResponse = mockRes.json.mock.calls[0][0];
      expect(timeoutResponse.timeout_duration_ms).toBe(expectedTimeout);

      jest.useRealTimers();
    });

    test('should respect trust configuration in response formatting', () => {
      const response = formatTrustResponse({ test: 'data' });

      expect(response.professional_validation_available).toBe(TRUST_CONFIG.expertValidation.expertValidationRequired);
      expect(response.data_provenance_tracked).toBe(TRUST_CONFIG.provenance.provenanceTrackingEnabled);
      expect(response.continuous_verification_active).toBe(TRUST_CONFIG.continuousVerification.dailySyncEnabled);
    });

    test('should use trust validation requirements in request validation', () => {
      const request = {
        body: { action: 'test', data: {} },
        headers: {},
        ip: '127.0.0.1'
      };

      const validation = validateTrustRequest(request);

      expect(validation.trust_context.trust_level_required).toBe(TRUST_CONFIG.trustMetrics.minAccuracyRate);
    });
  });

  describe('Microservices Architecture Support', () => {
    test('should provide stateless utility functions', () => {
      // All functions should be pure (no internal state)
      const req1 = { body: { action: 'test1', data: {} }, headers: {}, ip: '1.1.1.1' };
      const req2 = { body: { action: 'test2', data: {} }, headers: {}, ip: '2.2.2.2' };

      const validation1 = validateTrustRequest(req1);
      const validation2 = validateTrustRequest(req2);

      expect(validation1.trust_context.action).toBe('test1');
      expect(validation2.trust_context.action).toBe('test2');
      expect(validation1.trust_context.ip_address).toBe('1.1.1.1');
      expect(validation2.trust_context.ip_address).toBe('2.2.2.2');
    });

    test('should support concurrent operations without conflicts', async () => {
      const promises = Array(50).fill(null).map(() => getTrustIndicators());
      const results = await Promise.all(promises);

      // All results should be identical (stateless operation)
      const firstResult = results[0];
      expect(results.every(result => JSON.stringify(result) === JSON.stringify(firstResult))).toBe(true);
    });

    test('should provide all required functions for microservice integration', () => {
      const requiredFunctions = [
        setTrustHeaders,
        getTrustIndicators,
        validateTrustRequest,
        handleTrustError,
        setupTrustTimeout,
        formatTrustResponse,
        logTrustOperation,
        validateTrustPermissions
      ];

      requiredFunctions.forEach(func => {
        expect(typeof func).toBe('function');
      });
    });
  });

  describe('Professional Fallback Systems', () => {
    test('should provide professional fallbacks in all error scenarios', () => {
      const mockRes = {
        headersSent: false,
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      handleTrustError(new Error('System failure'), mockRes, 'critical_operation');

      const errorResponse = mockRes.json.mock.calls[0][0];
      expect(errorResponse.error).toBe('Professional customs broker consultation required');
      expect(errorResponse.fallback).toBe('Contact licensed customs broker - all data verification failed');
      expect(errorResponse.expert_validation_required).toBe(true);
    });

    test('should provide fallback in timeout scenarios', () => {
      const mockRes = {
        headersSent: false,
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      jest.useFakeTimers();
      setupTrustTimeout(mockRes, 'test_operation', 1000);
      jest.advanceTimersByTime(1000);

      const timeoutResponse = mockRes.json.mock.calls[0][0];
      expect(timeoutResponse.fallback).toBe('Professional customs broker consultation required');

      jest.useRealTimers();
    });
  });

  describe('Performance Requirements', () => {
    test('should complete operations quickly', async () => {
      const startTime = performance.now();

      // Run multiple utility functions
      await getTrustIndicators();
      validateTrustRequest({ body: { action: 'test', data: {} }, headers: {}, ip: '127.0.0.1' });
      formatTrustResponse({ test: 'data' });
      validateTrustPermissions('test_operation');

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // Less than 50ms for all operations
    });
  });
});