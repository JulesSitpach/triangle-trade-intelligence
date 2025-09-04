/**
 * Microservices Client for Trust-Verified USMCA Platform
 * Provides unified interface for all trust microservice endpoints
 * Handles fallback, retry logic, and error handling
 */

import { API_CONFIG, MICROSERVICES_CONFIG, TRUST_CONFIG } from '../../config/classificationConfig';

export class TrustMicroservicesClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '';
    this.timeout = options.timeout || MICROSERVICES_CONFIG.trust.timeout;
    this.retryAttempts = options.retryAttempts || MICROSERVICES_CONFIG.trust.retryAttempts;
    this.enableFallback = options.enableFallback || MICROSERVICES_CONFIG.fallback.enableLegacyFallback;
  }

  /**
   * Complete USMCA Workflow - Main orchestration endpoint
   */
  async completeWorkflow(data, action = 'trusted_complete_workflow') {
    return this._makeRequest(API_CONFIG.endpoints.trustCompleteWorkflow, {
      action,
      data
    });
  }

  /**
   * Data Provenance - Verify data sources and timestamps
   */
  async getDataProvenance(hsCode, options = {}) {
    if (!MICROSERVICES_CONFIG.trust.enableDataProvenance) {
      return { success: false, error: 'Data provenance disabled' };
    }

    return this._makeRequest(API_CONFIG.endpoints.trustDataProvenance, {
      action: 'verify_data_provenance',
      data: { hs_code: hsCode, ...options }
    });
  }

  /**
   * Expert Validation - Request professional customs broker validation
   */
  async requestExpertValidation(classificationData, confidenceScore) {
    if (!MICROSERVICES_CONFIG.trust.enableExpertValidation) {
      return { success: false, error: 'Expert validation disabled' };
    }

    const shouldAutoRequest = TRUST_CONFIG.expertValidation.autoRequestValidation && 
                             confidenceScore < TRUST_CONFIG.expertValidation.lowConfidenceThreshold;

    if (!shouldAutoRequest) {
      return { success: false, reason: 'Confidence score above threshold' };
    }

    return this._makeRequest(API_CONFIG.endpoints.trustExpertValidation, {
      action: 'request_expert_validation',
      data: {
        ...classificationData,
        confidence_score: confidenceScore,
        auto_requested: true
      }
    });
  }

  /**
   * Trust Metrics - Get public transparency metrics
   */
  async getTrustMetrics(options = {}) {
    if (!MICROSERVICES_CONFIG.trust.enableTrustMetrics) {
      return { success: false, error: 'Trust metrics disabled' };
    }

    return this._makeRequest(API_CONFIG.endpoints.trustMetrics, {
      action: 'get_trust_metrics',
      data: { 
        include_accuracy: TRUST_CONFIG.trustMetrics.showAccuracyRates,
        include_response_times: TRUST_CONFIG.trustMetrics.showResponseTimes,
        ...options 
      }
    });
  }

  /**
   * Success Stories - Get verified client success stories
   */
  async getSuccessStories(filters = {}) {
    if (!MICROSERVICES_CONFIG.trust.enableSuccessStories) {
      return { success: false, error: 'Success stories disabled' };
    }

    return this._makeRequest(API_CONFIG.endpoints.trustSuccessStories, {
      action: 'get_success_stories',
      data: filters
    });
  }

  /**
   * Case Studies - Get technical compliance case studies
   */
  async getCaseStudies(options = {}) {
    if (!MICROSERVICES_CONFIG.trust.enableCaseStudies) {
      return { success: false, error: 'Case studies disabled' };
    }

    return this._makeRequest(API_CONFIG.endpoints.trustCaseStudies, {
      action: 'get_case_studies',
      data: options
    });
  }

  /**
   * Submit Case Study - Create new case study from successful classification
   */
  async submitCaseStudy(caseStudyData) {
    if (!MICROSERVICES_CONFIG.trust.enableCaseStudies) {
      return { success: false, error: 'Case studies disabled' };
    }

    return this._makeRequest(API_CONFIG.endpoints.trustCaseStudies, {
      action: 'submit_case_study',
      data: caseStudyData
    });
  }

  /**
   * Internal request handler with retry logic and fallback
   */
  async _makeRequest(endpoint, payload, attempt = 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Attempt': attempt.toString(),
          'X-Client-Version': '2.0-microservices'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Add trust indicators if enabled
      if (TRUST_CONFIG.dataProvenance.showSourceAttribution && data.success) {
        data._trustMetadata = {
          sourceAttribution: data.source_attribution || 'System Generated',
          verificationTimestamp: data.verification_timestamp || new Date().toISOString(),
          requestId: data.request_id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }

      return data;

    } catch (error) {
      console.error(`Trust API Error (attempt ${attempt}/${this.retryAttempts}):`, {
        endpoint,
        error: error.message,
        payload: payload?.action
      });

      // Retry logic
      if (attempt < this.retryAttempts && !error.name?.includes('AbortError')) {
        await this._delay(1000 * attempt); // Exponential backoff
        return this._makeRequest(endpoint, payload, attempt + 1);
      }

      // Fallback to legacy endpoint for complete workflow only
      if (this.enableFallback && endpoint.includes('complete-workflow')) {
        console.log('Attempting legacy fallback...');
        return this._legacyFallback(payload);
      }

      return {
        success: false,
        error: 'Trust microservice unavailable',
        details: error.message,
        endpoint,
        attempt
      };
    }
  }

  /**
   * Legacy fallback (if old monolithic API still exists)
   */
  async _legacyFallback(payload) {
    try {
      await this._delay(MICROSERVICES_CONFIG.fallback.fallbackDelay);
      
      const response = await fetch(`${this.baseUrl}/api/trusted-compliance-workflow`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Fallback-Mode': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        data._fallbackUsed = true;
        return data;
      }

      throw new Error(`Legacy fallback failed: ${response.status}`);

    } catch (error) {
      return {
        success: false,
        error: 'All endpoints unavailable',
        details: error.message,
        fallbackAttempted: true
      };
    }
  }

  /**
   * Utility delay function
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const trustClient = new TrustMicroservicesClient();

// Export individual convenience functions
export const completeWorkflow = (data, action) => trustClient.completeWorkflow(data, action);
export const getDataProvenance = (hsCode, options) => trustClient.getDataProvenance(hsCode, options);
export const requestExpertValidation = (data, confidence) => trustClient.requestExpertValidation(data, confidence);
export const getTrustMetrics = (options) => trustClient.getTrustMetrics(options);
export const getSuccessStories = (filters) => trustClient.getSuccessStories(filters);
export const getCaseStudies = (options) => trustClient.getCaseStudies(options);
export const submitCaseStudy = (data) => trustClient.submitCaseStudy(data);