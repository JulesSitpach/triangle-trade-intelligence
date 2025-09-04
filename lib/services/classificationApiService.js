/**
 * Classification API Service Layer
 * Handles all API calls for product classification with proper error handling,
 * retry logic, debouncing, and response validation
 * Follows database-first, zero-hardcoded values principles
 */

import { 
  API_CONFIG, 
  ERROR_MESSAGES, 
  DEBOUNCE_CONFIG,
  VALIDATION_RULES,
  CONFIDENCE_CONFIG 
} from '../../config/classificationConfig';

/**
 * Base API service class with common functionality
 */
class BaseApiService {
  constructor() {
    this.abortController = null;
    this.requestCache = new Map();
  }

  /**
   * Create a new request with timeout and abort handling
   */
  async makeRequest(url, options = {}) {
    // Abort any existing request
    if (this.abortController) {
      this.abortController.abort();
    }

    // Create new abort controller
    this.abortController = new AbortController();
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: this.abortController.signal,
      ...options
    };

    try {
      const response = await Promise.race([
        fetch(url, defaultOptions),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), API_CONFIG.timeout)
        )
      ]);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  async withRetry(requestFn, maxRetries = API_CONFIG.retryAttempts) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }

        // Don't retry for abort errors or client errors (4xx)
        if (error.name === 'AbortError' || 
            (error.message.includes('HTTP 4') && !error.message.includes('429'))) {
          throw error;
        }

        // Exponential backoff
        const delay = API_CONFIG.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Cache key generator
   */
  generateCacheKey(endpoint, params) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  /**
   * Get cached response if valid
   */
  getCachedResponse(cacheKey, ttl) {
    const cached = this.requestCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < ttl) {
      return cached.data;
    }
    return null;
  }

  /**
   * Cache response
   */
  setCachedResponse(cacheKey, data) {
    this.requestCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.requestCache.clear();
  }

  /**
   * Cleanup method
   */
  cleanup() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.clearCache();
  }
}

/**
 * Classification API Service
 */
export class ClassificationApiService extends BaseApiService {
  constructor() {
    super();
    this.debounceTimers = new Map();
  }

  /**
   * Debounced API call
   */
  debounce(key, fn, delay = DEBOUNCE_CONFIG.userInput) {
    return new Promise((resolve, reject) => {
      // Clear existing timer
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }

      // Set new timer
      const timer = setTimeout(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.debounceTimers.delete(key);
        }
      }, delay);

      this.debounceTimers.set(key, timer);
    });
  }

  /**
   * Validate HS code format
   */
  validateHSCode(hsCode) {
    if (!hsCode || typeof hsCode !== 'string') {
      throw new Error(ERROR_MESSAGES.invalidHSCode);
    }

    const trimmed = hsCode.trim();
    
    if (trimmed.length < VALIDATION_RULES.hsCode.minLength ||
        trimmed.length > VALIDATION_RULES.hsCode.maxLength) {
      throw new Error(ERROR_MESSAGES.invalidHSCode);
    }

    if (!new RegExp(VALIDATION_RULES.hsCode.pattern).test(trimmed)) {
      throw new Error(ERROR_MESSAGES.invalidHSCode);
    }

    return trimmed;
  }

  /**
   * Validate product description
   */
  validateProductDescription(description) {
    if (!description || typeof description !== 'string') {
      throw new Error('Product description is required');
    }

    const trimmed = description.trim();
    
    if (trimmed.length < VALIDATION_RULES.productDescription.minLength) {
      throw new Error('Product description too short');
    }

    if (trimmed.length > VALIDATION_RULES.productDescription.maxLength) {
      throw new Error('Product description too long');
    }

    return trimmed;
  }

  /**
   * Load product categories
   */
  async loadProductCategories(useCache = true) {
    const cacheKey = this.generateCacheKey(API_CONFIG.endpoints.productCategories, {});
    
    if (useCache) {
      const cached = this.getCachedResponse(cacheKey, 300000); // 5 minute cache
      if (cached) {
        return cached;
      }
    }

    const requestFn = async () => {
      const response = await this.makeRequest(API_CONFIG.endpoints.productCategories);
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(ERROR_MESSAGES.categoriesLoadError);
      }

      return data.data;
    };

    try {
      const result = await this.withRetry(requestFn);
      this.setCachedResponse(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Failed to load categories:', error);
      throw new Error(ERROR_MESSAGES.categoriesLoadError);
    }
  }

  /**
   * Get dynamic HS codes with debouncing
   */
  async getDynamicHSCodes(productDescription, businessType, debounced = true) {
    const validatedDescription = this.validateProductDescription(productDescription);
    
    if (!businessType) {
      throw new Error('Business type is required');
    }

    const requestParams = { businessType, productDescription: validatedDescription };
    const cacheKey = this.generateCacheKey('dynamicHSCodes', requestParams);
    
    // Check cache first
    const cached = this.getCachedResponse(cacheKey, 180000); // 3 minute cache
    if (cached) {
      return cached;
    }

    const requestFn = async () => {
      const response = await this.makeRequest(API_CONFIG.endpoints.dynamicHSCodes, {
        method: 'POST',
        body: JSON.stringify(requestParams)
      });

      const data = await response.json();
      
      if (!data.success || !data.data?.matching_hs_codes) {
        throw new Error(ERROR_MESSAGES.apiUnavailable);
      }

      return this.processHSCodeResponse(data.data);
    };

    try {
      const executeRequest = () => this.withRetry(requestFn);
      
      const result = debounced 
        ? await this.debounce(`hsCode_${cacheKey}`, executeRequest, DEBOUNCE_CONFIG.aiAnalysis)
        : await executeRequest();
      
      this.setCachedResponse(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Dynamic HS code detection failed:', error);
      throw new Error(ERROR_MESSAGES.apiUnavailable);
    }
  }

  /**
   * Process HS code response and group by chapter
   */
  processHSCodeResponse(data) {
    const hsCodesByChapter = {};
    
    data.matching_hs_codes.forEach(hsCode => {
      const chapter = hsCode.chapter;
      if (!hsCodesByChapter[chapter]) {
        hsCodesByChapter[chapter] = [];
      }
      hsCodesByChapter[chapter].push({
        ...hsCode,
        isDynamicHSCode: true,
        type: 'specific_code'
      });
    });
    
    return {
      hsCodesByChapter,
      chapters: Object.keys(hsCodesByChapter),
      totalCodes: data.matching_hs_codes.length
    };
  }

  /**
   * Analyze product with AI
   */
  async analyzeProductWithAI(productDescription, businessType, selectedCategory, debounced = true) {
    const validatedDescription = this.validateProductDescription(productDescription);
    
    const requestParams = {
      productDescription: validatedDescription,
      businessType: businessType || 'general',
      selectedCategory
    };
    
    const cacheKey = this.generateCacheKey('aiAnalysis', requestParams);
    
    // Check cache first
    const cached = this.getCachedResponse(cacheKey, 600000); // 10 minute cache
    if (cached) {
      return cached;
    }

    const requestFn = async () => {
      const response = await this.makeRequest(API_CONFIG.endpoints.aiCategoryAnalysis, {
        method: 'POST',
        body: JSON.stringify(requestParams)
      });

      const data = await response.json();
      
      if (!data.success || !data.suggestions) {
        throw new Error(ERROR_MESSAGES.apiUnavailable);
      }

      return data.suggestions;
    };

    try {
      const executeRequest = () => this.withRetry(requestFn);
      
      const result = debounced 
        ? await this.debounce(`ai_${cacheKey}`, executeRequest, DEBOUNCE_CONFIG.categorySelection)
        : await executeRequest();
      
      this.setCachedResponse(cacheKey, result);
      return result;
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error(ERROR_MESSAGES.apiUnavailable);
    }
  }

  /**
   * Submit user-provided HS code
   */
  async submitUserHSCode(hsCode, productDescription, businessType) {
    const validatedHSCode = this.validateHSCode(hsCode);
    const validatedDescription = this.validateProductDescription(productDescription);

    const requestParams = {
      hs_code: validatedHSCode,
      product_description: validatedDescription,
      business_type: businessType,
      user_confidence: CONFIDENCE_CONFIG.userProvidedConfidence
    };

    const requestFn = async () => {
      const response = await this.makeRequest(API_CONFIG.endpoints.userContributedHSCode, {
        method: 'POST',
        body: JSON.stringify(requestParams)
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(ERROR_MESSAGES.saveHSCodeError);
      }

      return { success: true, hsCode: validatedHSCode };
    };

    try {
      return await this.withRetry(requestFn);
    } catch (error) {
      console.error('Failed to submit HS code:', error);
      throw new Error(ERROR_MESSAGES.saveHSCodeError);
    }
  }

  /**
   * Trigger complete USMCA workflow
   */
  async triggerUSMCAWorkflow(hsCode, productDescription, businessType, additionalParams = {}) {
    const validatedHSCode = this.validateHSCode(hsCode);
    const validatedDescription = this.validateProductDescription(productDescription);

    const requestParams = {
      action: 'trusted_complete_workflow',
      data: {
        company_name: additionalParams.companyName || process.env.NEXT_PUBLIC_DEFAULT_COMPANY_NAME || 'User Company',
        business_type: businessType,
        supplier_country: additionalParams.supplierCountry || process.env.NEXT_PUBLIC_DEFAULT_SUPPLIER_COUNTRY || 'CN',
        trade_volume: additionalParams.tradeVolume || parseInt(process.env.NEXT_PUBLIC_DEFAULT_TRADE_VOLUME || '1000000'),
        product_description: validatedDescription,
        user_provided_hs_code: validatedHSCode,
        component_origins: additionalParams.componentOrigins || [
          { origin_country: 'CN', value_percentage: 60 },
          { origin_country: 'MX', value_percentage: 40 }
        ],
        manufacturing_location: additionalParams.manufacturingLocation || process.env.NEXT_PUBLIC_DEFAULT_MANUFACTURING_LOCATION || 'MX',
        ...additionalParams
      }
    };

    const requestFn = async () => {
      const response = await this.makeRequest(API_CONFIG.endpoints.trustedComplianceWorkflow, {
        method: 'POST',
        body: JSON.stringify(requestParams)
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || ERROR_MESSAGES.workflowError);
      }

      return data;
    };

    try {
      return await this.withRetry(requestFn);
    } catch (error) {
      console.error('USMCA workflow failed:', error);
      throw new Error(ERROR_MESSAGES.workflowError);
    }
  }

  /**
   * Cleanup method with debounce timer cleanup
   */
  cleanup() {
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    // Call parent cleanup
    super.cleanup();
  }
}

// Export singleton instance
export const classificationApiService = new ClassificationApiService();

export default classificationApiService;