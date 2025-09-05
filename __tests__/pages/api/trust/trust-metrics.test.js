/**
 * TRUST METRICS API INTEGRATION TESTS
 * Comprehensive testing for public trust dashboard and performance transparency
 * Tests the microservice that provides transparent performance metrics for customer confidence
 */

import { createMocks } from 'node-mocks-http';
import handler from '../../../../pages/api/trust/trust-metrics.js';
import { TRUST_CONFIG, TRUST_PERFORMANCE_CONFIG, TRUST_MESSAGES } from '../../../../config/trust-config.js';

// Mock all dependencies
jest.mock('../../../../lib/services/data-provenance-service.js', () => ({
  dataProvenanceService: {
    getSystemStatus: jest.fn(() => ({ operational: true }))
  }
}));

jest.mock('../../../../lib/services/expert-endorsement-system.js', () => ({
  expertEndorsementSystem: {
    initializeSystem: jest.fn().mockResolvedValue(true),
    generateAccuracyMetrics: jest.fn(() => ({
      overall_accuracy: 0.968,
      classification_accuracy: 0.962,
      usmca_accuracy: 0.974,
      tariff_accuracy: 0.989,
      expert_agreement: 0.934
    }))
  }
}));

jest.mock('../../../../lib/services/continuous-verification-service.js', () => ({
  continuousVerificationService: {
    startService: jest.fn().mockResolvedValue(true),
    getServiceStatus: jest.fn(() => ({
      running: true,
      last_check: new Date().toISOString(),
      healthy: true
    }))
  }
}));

jest.mock('../../../../lib/utils/production-logger.js', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logRequest: jest.fn()
}));

// Import mocked modules for testing
import { expertEndorsementSystem } from '../../../../lib/services/expert-endorsement-system.js';
import { continuousVerificationService } from '../../../../lib/services/continuous-verification-service.js';
import { logInfo, logError, logRequest } from '../../../../lib/utils/production-logger.js';

describe('/api/trust/trust-metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful responses
    expertEndorsementSystem.generateAccuracyMetrics.mockReturnValue({
      overall_accuracy: 0.968,
      classification_accuracy: 0.962,
      usmca_accuracy: 0.974,
      tariff_accuracy: 0.989,
      expert_agreement: 0.934
    });

    continuousVerificationService.getServiceStatus.mockReturnValue({
      running: true,
      last_check: new Date().toISOString(),
      healthy: true
    });
  });

  describe('HTTP Methods and Headers', () => {
    test('should handle OPTIONS requests for CORS', async () => {
      const { req, res } = createMocks({
        method: 'OPTIONS'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const headers = res._getHeaders();
      expect(headers).toHaveProperty('x-trust-metrics', 'public');
      expect(headers).toHaveProperty('x-transparency-dashboard', 'enabled');
      expect(headers).toHaveProperty('x-performance-metrics', 'real-time');
      expect(headers).toHaveProperty('access-control-allow-origin', '*');
    });

    test('should set transparency headers for all requests', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      const headers = res._getHeaders();
      expect(headers).toHaveProperty('x-trust-metrics', 'public');
      expect(headers).toHaveProperty('x-transparency-dashboard', 'enabled');
      expect(headers).toHaveProperty('x-performance-metrics', 'real-time');
    });

    test('should accept both GET and POST requests', async () => {
      // Test GET request
      const { req: getReq, res: getRes } = createMocks({
        method: 'GET'
      });

      await handler(getReq, getRes);
      expect(getRes._getStatusCode()).toBe(200);

      // Test POST request
      const { req: postReq, res: postRes } = createMocks({
        method: 'POST',
        body: { action: 'get_public_metrics' }
      });

      await handler(postReq, postRes);
      expect(postRes._getStatusCode()).toBe(200);
    });
  });

  describe('Public Metrics Request', () => {
    test('should return comprehensive public metrics', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_public_metrics' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      expect(data.success).toBe(true);
      expect(data).toHaveProperty('public_metrics');
      expect(data).toHaveProperty('transparency_note');
      expect(data).toHaveProperty('trust_indicators');
      expect(data).toHaveProperty('metrics_generated_at');

      // Verify public metrics structure
      const publicMetrics = data.public_metrics;
      expect(publicMetrics).toHaveProperty('performance');
      expect(publicMetrics).toHaveProperty('health_indicators');
      expect(publicMetrics).toHaveProperty('trust_score');
      expect(publicMetrics).toHaveProperty('verification_status');

      // Verify performance metrics
      expect(publicMetrics.performance).toHaveProperty('average_response_time_ms');
      expect(publicMetrics.performance).toHaveProperty('accuracy_rate');
      expect(publicMetrics.performance).toHaveProperty('uptime_percentage');
      expect(publicMetrics.performance).toHaveProperty('data_freshness_hours');
      expect(publicMetrics.performance).toHaveProperty('verification_sources_active');

      // Verify health indicators
      expect(publicMetrics.health_indicators).toHaveProperty('classification_system');
      expect(publicMetrics.health_indicators).toHaveProperty('data_verification');
      expect(publicMetrics.health_indicators).toHaveProperty('expert_validation');
      expect(publicMetrics.health_indicators).toHaveProperty('continuous_monitoring');

      // Verify verification status
      expect(publicMetrics.verification_status).toHaveProperty('government_sources_verified', true);
      expect(publicMetrics.verification_status).toHaveProperty('expert_network_active', true);
      expect(publicMetrics.verification_status).toHaveProperty('audit_trail_complete', true);
    });

    test('should calculate trust score correctly', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      const trustScore = data.public_metrics.trust_score;

      expect(typeof trustScore).toBe('number');
      expect(trustScore).toBeGreaterThan(0);
      expect(trustScore).toBeLessThanOrEqual(1);
    });

    test('should handle public metrics errors gracefully', async () => {
      expertEndorsementSystem.generateAccuracyMetrics.mockImplementation(() => {
        throw new Error('Metrics generation failed');
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_public_metrics' }
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('fallback_metrics');
      expect(data.fallback_metrics).toHaveProperty('system_status', 'operational');
    });

    test('should use configuration-based accuracy metrics', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      const accuracyRate = data.public_metrics.performance.accuracy_rate;

      // Should use actual metrics or fall back to configuration minimum
      expect(accuracyRate).toBeGreaterThanOrEqual(TRUST_CONFIG.trustMetrics.minAccuracyRate);
    });
  });

  describe('System Health Request', () => {
    test('should return comprehensive system health status', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_system_health' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      expect(data.success).toBe(true);
      expect(data).toHaveProperty('system_health');

      const systemHealth = data.system_health;
      expect(systemHealth).toHaveProperty('overall_status');
      expect(systemHealth).toHaveProperty('components');
      expect(systemHealth).toHaveProperty('performance_targets');
      expect(systemHealth).toHaveProperty('monitoring_active', true);
      expect(systemHealth).toHaveProperty('last_health_check');

      // Verify components health check
      expect(systemHealth.components).toHaveProperty('data_provenance_service');
      expect(systemHealth.components).toHaveProperty('expert_endorsement_system');
      expect(systemHealth.components).toHaveProperty('continuous_verification');
      expect(systemHealth.components).toHaveProperty('database_connectivity');
      expect(systemHealth.components).toHaveProperty('external_apis_status');
      expect(systemHealth.components).toHaveProperty('trust_calculations');

      // Verify performance targets use configuration
      expect(systemHealth.performance_targets.response_time).toContain(
        TRUST_PERFORMANCE_CONFIG.maxResponseTimeMs.trustMetrics.toString()
      );
      expect(systemHealth.performance_targets.accuracy_rate).toContain(
        (TRUST_CONFIG.trustMetrics.minAccuracyRate * 100).toString()
      );
    });

    test('should determine overall health status correctly', async () => {
      // Test healthy system
      const { req: healthyReq, res: healthyRes } = createMocks({
        method: 'POST',
        body: { action: 'get_system_health' }
      });

      await handler(healthyReq, healthyRes);

      const healthyData = JSON.parse(healthyRes._getData());
      expect(healthyData.system_health.overall_status).toBe('healthy');
    });

    test('should handle system health check errors', async () => {
      // Mock one service failing
      continuousVerificationService.getServiceStatus.mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_system_health' }
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('fallback_status', 'operational');
    });
  });

  describe('Trust Indicators Request', () => {
    test('should return enhanced trust indicators', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_trust_indicators' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      expect(data.success).toBe(true);
      expect(data).toHaveProperty('trust_indicators');
      expect(data).toHaveProperty('confidence_building');

      const trustIndicators = data.trust_indicators;
      expect(trustIndicators).toHaveProperty('data_quality_score');
      expect(trustIndicators).toHaveProperty('expert_validation_rate');
      expect(trustIndicators).toHaveProperty('source_agreement_percentage');
      expect(trustIndicators).toHaveProperty('automated_verification_success');
      expect(trustIndicators).toHaveProperty('trust_building_metrics');

      // Verify trust building metrics
      expect(trustIndicators.trust_building_metrics).toHaveProperty('transparent_reporting');
      expect(trustIndicators.trust_building_metrics).toHaveProperty('audit_trail_complete', true);
      expect(trustIndicators.trust_building_metrics).toHaveProperty('expert_oversight', true);
      expect(trustIndicators.trust_building_metrics).toHaveProperty('government_source_verified', true);

      // Verify confidence building messages
      const confidenceBuilding = data.confidence_building;
      expect(confidenceBuilding).toHaveProperty('data_transparency');
      expect(confidenceBuilding).toHaveProperty('expert_validation');
      expect(confidenceBuilding).toHaveProperty('continuous_monitoring');
      expect(confidenceBuilding).toHaveProperty('audit_compliance');
    });

    test('should handle trust indicators errors with fallback', async () => {
      // Mock the getTrustIndicators function to throw an error during enhancement
      const originalConsoleError = console.error;
      console.error = jest.fn(); // Suppress error logging for test

      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_trust_indicators' }
      });

      // Mock a specific function to fail
      jest.doMock('../../../../config/trust-config.js', () => ({
        ...jest.requireActual('../../../../config/trust-config.js'),
        getTrustIndicators: jest.fn().mockImplementation(async () => {
          throw new Error('Indicators unavailable');
        })
      }));

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('basic_indicators');

      console.error = originalConsoleError;
    });
  });

  describe('Accuracy Metrics Request', () => {
    test('should return comprehensive accuracy metrics', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { 
          action: 'get_accuracy_metrics',
          data: {
            time_frame: 'last_30_days',
            product_category: 'electronics'
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      expect(data.success).toBe(true);
      expect(data).toHaveProperty('accuracy_metrics');
      expect(data).toHaveProperty('benchmarks');
      expect(data).toHaveProperty('improvement_tracking');

      const accuracyMetrics = data.accuracy_metrics;
      expect(accuracyMetrics).toHaveProperty('overall_accuracy');
      expect(accuracyMetrics).toHaveProperty('classification_accuracy');
      expect(accuracyMetrics).toHaveProperty('usmca_qualification_accuracy');
      expect(accuracyMetrics).toHaveProperty('tariff_calculation_accuracy');
      expect(accuracyMetrics).toHaveProperty('expert_agreement_rate');
      expect(accuracyMetrics).toHaveProperty('category_performance');
      expect(accuracyMetrics).toHaveProperty('time_frame', 'last_30_days');

      // Verify benchmarks
      const benchmarks = data.benchmarks;
      expect(benchmarks).toHaveProperty('industry_standard');
      expect(benchmarks).toHaveProperty('professional_grade');
      expect(benchmarks).toHaveProperty('expert_level');
      expect(benchmarks).toHaveProperty('current_performance');

      // Current performance should meet or exceed professional grade
      expect(benchmarks.current_performance).toBeGreaterThanOrEqual(benchmarks.professional_grade);
    });

    test('should filter by product category correctly', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { 
          action: 'get_accuracy_metrics',
          data: { product_category: 'textiles' }
        }
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      const categoryPerformance = data.accuracy_metrics.category_performance;

      expect(categoryPerformance).toHaveProperty('textiles');
      expect(categoryPerformance.textiles).toHaveProperty('accuracy');
      expect(categoryPerformance.textiles).toHaveProperty('confidence');
    });

    test('should handle accuracy metrics errors gracefully', async () => {
      expertEndorsementSystem.generateAccuracyMetrics.mockImplementation(() => {
        throw new Error('Accuracy calculation failed');
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_accuracy_metrics' }
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('fallback_accuracy');
    });

    test('should use default filters when not provided', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_accuracy_metrics' }
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.accuracy_metrics.time_frame).toBe('last_30_days');
      
      // Should include all categories when category is 'all'
      const categoryPerformance = data.accuracy_metrics.category_performance;
      expect(categoryPerformance).toHaveProperty('electronics');
      expect(categoryPerformance).toHaveProperty('textiles');
      expect(categoryPerformance).toHaveProperty('automotive');
      expect(categoryPerformance).toHaveProperty('general');
    });
  });

  describe('Transparency Report Request', () => {
    test('should generate comprehensive transparency report', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { 
          action: 'get_transparency_report',
          data: {
            period: 'quarterly',
            include_details: true
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      expect(data.success).toBe(true);
      expect(data).toHaveProperty('transparency_report');
      expect(data).toHaveProperty('public_commitment');
      expect(data).toHaveProperty('verification_note');

      const report = data.transparency_report;
      expect(report).toHaveProperty('report_period', 'quarterly');
      expect(report).toHaveProperty('report_date');
      expect(report).toHaveProperty('data_sources');
      expect(report).toHaveProperty('expert_validation');
      expect(report).toHaveProperty('system_performance');
      expect(report).toHaveProperty('continuous_improvement');

      // Verify data sources section
      expect(report.data_sources).toHaveProperty('primary_sources');
      expect(report.data_sources).toHaveProperty('verification_frequency');
      expect(report.data_sources).toHaveProperty('source_agreement_threshold');
      expect(report.data_sources).toHaveProperty('data_freshness_target');

      // Verify expert validation section
      expect(report.expert_validation).toHaveProperty('active_experts');
      expect(report.expert_validation).toHaveProperty('average_response_time');
      expect(report.expert_validation).toHaveProperty('validation_coverage');
      expect(report.expert_validation).toHaveProperty('expert_agreement_rate');

      // Should include detailed metrics when requested
      expect(report).toHaveProperty('detailed_metrics');
      expect(report.detailed_metrics).toHaveProperty('classification_breakdown');
      expect(report.detailed_metrics).toHaveProperty('source_reliability_scores');
      expect(report.detailed_metrics).toHaveProperty('expert_specializations');
      expect(report.detailed_metrics).toHaveProperty('audit_trail_completeness', '100%');
    });

    test('should exclude details when include_details is false', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { 
          action: 'get_transparency_report',
          data: {
            include_details: false
          }
        }
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      const report = data.transparency_report;

      expect(report).not.toHaveProperty('detailed_metrics');
    });

    test('should use configuration values in transparency report', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_transparency_report' }
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      const report = data.transparency_report;

      // Verify configuration usage
      expect(report.data_sources.primary_sources).toEqual(
        Object.keys(TRUST_CONFIG.provenance.sourceReliabilityScores)
      );
      expect(report.data_sources.source_agreement_threshold).toBe(
        `${TRUST_CONFIG.provenance.requiredSourceAgreement * 100}%`
      );
      expect(report.data_sources.data_freshness_target).toBe(
        `<${TRUST_CONFIG.provenance.maxDataAgeHours} hours`
      );
      expect(report.expert_validation.average_response_time).toBe(
        `${TRUST_CONFIG.expertValidation.expertResponseTimeHours} hours`
      );
    });

    test('should handle transparency report errors gracefully', async () => {
      // Mock error in report generation
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_transparency_report' }
      });

      // Mock a function to fail
      const mockError = new Error('Report generation failed');
      const originalGetActiveExpertCount = require('../../../../pages/api/trust/trust-metrics.js').getActiveExpertCount;
      
      await handler(req, res);

      // Should handle errors gracefully even if some helper functions fail
      expect(res._getStatusCode()).toBe(200);
      
      console.error = originalConsoleError;
    });
  });

  describe('Error Handling and Validation', () => {
    test('should reject invalid actions', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'invalid_action' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());

      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid action for trust metrics');
      expect(data).toHaveProperty('supported_actions');
      expect(Array.isArray(data.supported_actions)).toBe(true);
      expect(data.supported_actions).toContain('get_public_metrics');
      expect(data.supported_actions).toContain('get_system_health');
      expect(data.supported_actions).toContain('get_trust_indicators');
      expect(data.supported_actions).toContain('get_accuracy_metrics');
      expect(data.supported_actions).toContain('get_transparency_report');
    });

    test('should handle service initialization errors', async () => {
      expertEndorsementSystem.initializeSystem.mockRejectedValue(
        new Error('Service initialization failed')
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_public_metrics' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());

      expect(data.success).toBe(false);
      expect(data.error).toBe(TRUST_MESSAGES.trustMetrics.trustIndicatorUnavailable);
      expect(data.trust_status).toBe('metrics_system_error');
      expect(data).toHaveProperty('fallback');
      expect(data).toHaveProperty('timestamp');
    });

    test('should log requests and errors appropriately', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_public_metrics' },
        ip: '192.168.1.1'
      });

      await handler(req, res);

      // Verify logging calls
      expect(logInfo).toHaveBeenCalledWith('Trust metrics request', {
        action: 'get_public_metrics',
        method: 'POST',
        ip: '192.168.1.1'
      });

      expect(logRequest).toHaveBeenCalledWith(
        'POST',
        expect.any(String),
        200,
        expect.any(Number),
        { action: 'get_public_metrics', success: true }
      );
    });

    test('should log errors with proper context', async () => {
      expertEndorsementSystem.initializeSystem.mockRejectedValue(
        new Error('Test error')
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_public_metrics' }
      });

      await handler(req, res);

      expect(logError).toHaveBeenCalledWith('Trust metrics error', {
        error: 'Test error',
        operation: 'get_public_metrics',
        responseTime: expect.any(Number),
        stack: expect.any(String)
      });

      expect(logRequest).toHaveBeenCalledWith(
        'POST',
        expect.any(String),
        500,
        expect.any(Number),
        { operation: 'get_public_metrics', success: false }
      );
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

    test('should setup configurable timeout for metrics requests', async () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_public_metrics' }
      });

      const handlerPromise = handler(req, res);

      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        TRUST_PERFORMANCE_CONFIG.maxResponseTimeMs.trustMetrics
      );

      await handlerPromise;
      setTimeoutSpy.mockRestore();
    });

    test('should handle timeout gracefully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_public_metrics' }
      });

      // Start handler but don't wait for completion
      const handlerPromise = handler(req, res);

      // Advance time to trigger timeout
      jest.advanceTimersByTime(TRUST_PERFORMANCE_CONFIG.maxResponseTimeMs.trustMetrics);

      // Wait a bit for timeout handler to execute
      jest.advanceTimersByTime(10);

      expect(res._getStatusCode()).toBe(408);
      const data = JSON.parse(res._getData());

      expect(data.success).toBe(false);
      expect(data.error).toBe('Trust metrics request timeout');
      expect(data.trust_status).toBe('metrics_unavailable');
      expect(data.fallback).toBe(TRUST_MESSAGES.trustMetrics.trustIndicatorUnavailable);
    });

    test('should clear timeout on successful completion', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_public_metrics' }
      });

      await handler(req, res);

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Performance Requirements', () => {
    test('should complete metrics requests quickly', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_public_metrics' }
      });

      const startTime = performance.now();
      await handler(req, res);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Less than 100ms
      expect(res._getStatusCode()).toBe(200);
    });

    test('should include processing time in response', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_public_metrics' }
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('metrics_generated_at');
      
      // Verify timestamp format
      expect(data.metrics_generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Configuration Integration', () => {
    test('should use configuration values throughout', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_public_metrics' }
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      
      // Verify configuration usage
      expect(data.public_metrics.performance.uptime_percentage).toBe(TRUST_CONFIG.trustMetrics.minUptimePercentage);
      expect(data.public_metrics.performance.verification_sources_active).toBe(
        Object.keys(TRUST_CONFIG.provenance.sourceReliabilityScores).length
      );
      expect(data.public_metrics.verification_status.transparency_enabled).toBe(
        TRUST_CONFIG.trustMetrics.publicMetricsEnabled
      );
    });

    test('should respect public metrics configuration', async () => {
      // Test when public metrics are disabled
      const originalConfig = TRUST_CONFIG.trustMetrics.publicMetricsEnabled;
      TRUST_CONFIG.trustMetrics.publicMetricsEnabled = false;

      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_public_metrics' }
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.public_metrics.verification_status.transparency_enabled).toBe(false);

      // Restore original config
      TRUST_CONFIG.trustMetrics.publicMetricsEnabled = originalConfig;
    });
  });

  describe('Microservice Architecture Compliance', () => {
    test('should be focused on metrics and transparency only', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_public_metrics' }
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      
      // Should focus on trust and performance metrics
      expect(data).toHaveProperty('public_metrics');
      expect(data).toHaveProperty('trust_indicators');
      expect(data).toHaveProperty('transparency_note');
      
      // Should not include business logic like classification or calculations
      expect(data).not.toHaveProperty('classification_results');
      expect(data).not.toHaveProperty('usmca_qualification');
      expect(data).not.toHaveProperty('savings_calculation');
    });

    test('should initialize required services independently', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_system_health' }
      });

      await handler(req, res);

      expect(expertEndorsementSystem.initializeSystem).toHaveBeenCalled();
      expect(continuousVerificationService.startService).toHaveBeenCalled();
    });

    test('should provide all required metric actions', async () => {
      const supportedActions = [
        'get_public_metrics',
        'get_system_health',
        'get_trust_indicators', 
        'get_accuracy_metrics',
        'get_transparency_report'
      ];

      for (const action of supportedActions) {
        const { req, res } = createMocks({
          method: 'POST',
          body: { action }
        });

        await handler(req, res);
        expect(res._getStatusCode()).toBe(200);
      }
    });
  });

  describe('Trust Building Features', () => {
    test('should provide transparency for customer confidence', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_public_metrics' }
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());

      expect(data.transparency_note).toContain('verified from official sources');
      expect(data.public_metrics.verification_status.government_sources_verified).toBe(true);
      expect(data.public_metrics.verification_status.expert_network_active).toBe(true);
      expect(data.public_metrics.verification_status.audit_trail_complete).toBe(true);
    });

    test('should include confidence building messages', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { action: 'get_trust_indicators' }
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      const confidenceBuilding = data.confidence_building;

      expect(confidenceBuilding.data_transparency).toContain('Complete source attribution');
      expect(confidenceBuilding.expert_validation).toContain('Licensed customs brokers');
      expect(confidenceBuilding.continuous_monitoring).toContain('Real-time verification');
      expect(confidenceBuilding.audit_compliance).toContain('regulatory compliance');
    });
  });
});