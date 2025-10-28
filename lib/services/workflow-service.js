/**
 * WORKFLOW SERVICE - Service layer for USMCA workflow operations
 * Integrates with trust microservices architecture
 * Zero hardcoded values - all configuration driven
 */

import { TRUST_ENDPOINTS, TRUST_CONFIG } from '../../config/trust-config.js';
import { SYSTEM_CONFIG } from '../../config/system-config.js';
import { logInfo, logError } from '../utils/production-logger.js';
import { logDevIssue, DevIssue } from '../utils/logDevIssue.js';
import { MANUFACTURING_HUBS, USMCA_COUNTRIES } from '../../config/country-classifications.js';

class WorkflowService {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_BASE_URL || '';
    this.timeout = TRUST_CONFIG.trustMetrics.maxResponseTimeMs;
  }

  /**
   * Load dropdown options with fallback to simple API
   */
  async loadDropdownOptions() {
    try {
      console.log('🔄 [DROPDOWN] Loading dropdown options from database...');
      console.log('🔄 [DROPDOWN] baseURL:', this.baseURL || '(empty - will use relative path)');

      logInfo('Loading dropdown options with database-driven fallback');

      // Try database-driven endpoint first (NOTE: fetch doesn't support timeout parameter in browser)
      const dbUrl = `${this.baseURL}/api/database-driven-dropdown-options?category=all`;
      console.log('🔄 [DROPDOWN] Fetching from:', dbUrl);

      let response = await fetch(dbUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('🔄 [DROPDOWN] Database API response status:', response.status);

      if (!response.ok) {
        console.warn(`⚠️ [DROPDOWN] Database API failed (${response.status}), trying fallback API...`);
        logInfo('Database-driven options failed, falling back to simple API');

        const simpleUrl = `${this.baseURL}/api/simple-dropdown-options`;
        console.log('🔄 [DROPDOWN] Fetching fallback from:', simpleUrl);

        response = await fetch(simpleUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        console.log('🔄 [DROPDOWN] Fallback API response status:', response.status);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch dropdown options: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [DROPDOWN] API response received:', {
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : 'N/A',
        businessTypesCount: result.data?.businessTypes?.length || result.businessTypes?.length || 0
      });

      const normalized = this.normalizeDropdownData(result);
      console.log('✅ [DROPDOWN] After normalization:', {
        businessTypesCount: normalized.businessTypes?.length || 0,
        businessTypes: normalized.businessTypes?.map(bt => bt.label)
      });

      return normalized;

    } catch (error) {
      console.error('❌ [DROPDOWN] Error loading dropdown options:', error);

      await logDevIssue({
        type: 'api_error',
        severity: 'high',
        component: 'dropdown_service',
        message: 'Failed to load dropdown options from database API',
        data: {
          error: error.message,
          stack: error.stack,
          endpoints_tried: [
            '/api/database-driven-dropdown-options',
            '/api/simple-dropdown-options'
          ],
          baseURL: this.baseURL || '(empty)',
          fallback: 'using default dropdown options (4 items)'
        }
      });
      logError('Failed to load dropdown options', { error: error.message });

      console.warn('⚠️ [DROPDOWN] Using hardcoded fallback (4 options only)');
      return this.getDefaultDropdownOptions();
    }
  }

  /**
   * Normalize dropdown data from different API formats
   */
  normalizeDropdownData(result) {
    let data;
    
    // Handle different response formats
    if (result.data && typeof result.data === 'object') {
      // Database-driven API format
      data = result.data;
      
      // Map database API field names to UI expected names
      if (data.business_types && !data.businessTypes) {
        data.businessTypes = data.business_types;
      }
      if (data.trade_volumes && !data.importVolumes) {
        data.importVolumes = data.trade_volumes;
      }
      if (data.usmca_countries && !data.usmcaCountries) {
        data.usmcaCountries = data.usmca_countries;
      }
    } else {
      // Simple API format
      data = result;
    }
    
    // Ensure required arrays exist
    data.businessTypes = Array.isArray(data.businessTypes) ? data.businessTypes : [];
    data.countries = Array.isArray(data.countries) ? data.countries : [];
    data.usmcaCountries = Array.isArray(data.usmcaCountries) ? data.usmcaCountries : [];
    data.importVolumes = Array.isArray(data.importVolumes) ? data.importVolumes : this.getDefaultImportVolumes();
    
    // Deduplicate business types
    data.businessTypes = this.deduplicateBusinessTypes(data.businessTypes);
    
    return data;
  }

  /**
   * Deduplicate business types keeping highest threshold
   */
  deduplicateBusinessTypes(businessTypes) {
    const businessTypeMap = new Map();
    
    businessTypes.forEach(type => {
      const existing = businessTypeMap.get(type.label);
      const currentThreshold = parseFloat(type.description.match(/(\d+(?:\.\d+)?)%/)?.[1] || 0);
      const existingThreshold = existing ? parseFloat(existing.description.match(/(\d+(?:\.\d+)?)%/)?.[1] || 0) : 0;
      
      if (!existing || currentThreshold > existingThreshold) {
        businessTypeMap.set(type.label, type);
      }
    });
    
    return Array.from(businessTypeMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Get default import volumes if API fails
   */
  getDefaultImportVolumes() {
    return [
      { value: 'Under $500K', label: 'Under $500K annually' },
      { value: '$500K - $1M', label: '$500K - $1M annually' },
      { value: '$1M - $5M', label: '$1M - $5M annually' },
      { value: '$5M+', label: '$5M+ annually' }
    ];
  }

  /**
   * Get default dropdown options for fallback
   * CONFIG-DRIVEN: Uses country-classifications.js and system-config.js
   * No hardcoded business data
   */
  getDefaultDropdownOptions() {
    // Create reverse mapping: code -> name
    const codeToName = {};
    Object.entries(SYSTEM_CONFIG.countries.codeMappings).forEach(([name, code]) => {
      codeToName[code] = name;
    });

    // Build country list from config (USMCA + Manufacturing Hubs)
    const countryCodes = [...new Set([...USMCA_COUNTRIES, ...MANUFACTURING_HUBS])];
    const countries = countryCodes.map(code => ({
      value: code,
      label: codeToName[code] || code // Fallback to code if name not in mapping
    })).sort((a, b) => a.label.localeCompare(b.label));

    return {
      businessTypes: [
        { value: 'electronics', label: 'Electronics & Technology' },
        { value: 'automotive', label: 'Automotive & Transportation' },
        { value: 'textiles', label: 'Textiles & Apparel' },
        { value: 'machinery', label: 'Machinery & Equipment' }
      ],
      countries,
      usmcaCountries: USMCA_COUNTRIES.map(code => ({
        value: code,
        label: codeToName[code] || code
      })),
      importVolumes: this.getDefaultImportVolumes()
    };
  }

  /**
   * Process complete USMCA workflow using trust microservices
   */
  async processCompleteWorkflow(formData) {
    const startTime = Date.now();

    console.log('🌐 ========== WORKFLOW SERVICE: API REQUEST ==========');
    console.log('📤 Data being sent to API:', {
      company_name: formData.company_name,
      business_type: formData.business_type,  // Business role: Importer/Exporter/etc
      industry_sector: formData.industry_sector,  // Industry classification for HS codes
      trade_volume: formData.trade_volume,
      product_description: formData.product_description,
      manufacturing_location: formData.manufacturing_location,
      supplier_country: formData.supplier_country,
      destination_country: formData.destination_country,

      // Company details for certificate
      company_address: formData.company_address,
      tax_id: formData.tax_id,
      contact_person: formData.contact_person,
      contact_email: formData.contact_email,
      contact_phone: formData.contact_phone,

      // Component data
      component_origins_count: formData.component_origins?.length,
      component_origins: formData.component_origins
    });
    console.log('⚠️ CERTIFICATE FIELDS CHECK:', {
      has_company_address: !!formData.company_address,
      has_tax_id: !!formData.tax_id,
      has_contact_person: !!formData.contact_person,
      has_contact_email: !!formData.contact_email,
      has_contact_phone: !!formData.contact_phone
    });

    try {
      logInfo('Starting complete USMCA workflow', {
        company: formData.company_name,
        business_type: formData.business_type
      });

      // Clear any cached results to ensure fresh data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('usmca_workflow_results');
        localStorage.removeItem('triangleUserData');
        console.log('🧹 Cleared cached workflow data for fresh results');
      }

      // Use AI-powered USMCA analysis endpoint (pure AI approach)
      logInfo('Using AI-powered USMCA analysis - flexible for trade policy changes');
      const response = await fetch(`${this.baseURL}/api/ai-usmca-complete-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // ✅ CRITICAL: Send session cookie for authenticated endpoint
        body: JSON.stringify(formData),
        timeout: 60000 // 60 second timeout for AI analysis
      });

      if (!response.ok) {
        throw new Error(`Workflow processing failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const processingTime = Date.now() - startTime;

      console.log('📥 ========== AI ANALYSIS RESPONSE RECEIVED ==========');
      console.log('AI Analysis Response:', {
        success: result.success,
        method: result.method,
        has_company: !!result.company,
        has_product: !!result.product,
        has_usmca: !!result.usmca,
        has_savings: !!result.savings,
        has_recommendations: !!result.recommendations,
        recommendation_count: result.recommendations?.length,
        usmca_qualified: result.usmca?.qualified,
        usmca_threshold: result.usmca?.threshold_applied,
        north_american_content: result.usmca?.north_american_content,
        ai_confidence: result.trust?.confidence_score
      });
      console.log('========== END AI RESPONSE ==========');

      // Save the ACTUAL AI results to localStorage for results page
      if (result.success) {
        console.log('💾 Saving AI analysis results to localStorage for results page...');

        const workflowData = {
          company: result.company,
          product: result.product,
          usmca: result.usmca,
          savings: result.savings,
          certificate: result.certificate,
          component_origins: result.component_origins || formData.component_origins,
          recommendations: result.recommendations,
          trust: result.trust
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('usmca_workflow_results', JSON.stringify(workflowData));
          console.log('✅ AI analysis saved to localStorage - AI confidence:', result.trust?.confidence_score + '%');
        }
      }

      if (result.success) {
        logInfo('Workflow processing completed successfully', { 
          processing_time: processingTime,
          trust_enabled: !!result.trust_indicators
        });
        
        return {
          ...result,
          processing_metadata: {
            processing_time_ms: processingTime,
            endpoint_used: response.url.includes('trust') ? 'trust_microservices' : 'fallback',
            trust_features_enabled: !!result.trust_indicators
          }
        };
      } else {
        throw new Error(result.error || 'Workflow processing failed');
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;

      await logDevIssue({
        type: 'api_error',
        severity: 'critical',
        component: 'database_service',
        message: 'Complete workflow processing failed',
        data: {
          error: error.message,
          stack: error.stack,
          processing_time: processingTime,
          company_name: formData.company_name,
          business_type: formData.business_type,
          endpoint: '/api/ai-usmca-complete-analysis'
        }
      });

      logError('Workflow processing failed', {
        error: error.message,
        processing_time: processingTime,
        formData: formData.company_name
      });

      throw new Error(`Workflow processing failed: ${error.message}`);
    }
  }

  /**
   * Classify product using AI-enhanced classification API
   * @param {string} productDescription - Product description for classification
   * @param {string} industrySector - Industry sector for HS code context (e.g., "Automotive", "Electronics")
   */
  async classifyProduct(productDescription, industrySector = 'General Manufacturing') {
    try {
      logInfo('Starting product classification', {
        description: productDescription?.substring(0, 50),
        industry_sector: industrySector
      });

      // Use our working classification API
      const response = await fetch(`${this.baseURL}/api/ai-classification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_description: productDescription,
          business_type: industrySector  // API still uses business_type parameter name
        }),
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Classification failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.results?.length > 0) {
        // Return the best match from the results
        const bestMatch = result.results[0];
        
        logInfo('Classification completed successfully', { 
          hs_code: bestMatch.hs_code,
          confidence: bestMatch.confidence,
          total_matches: result.results.length 
        });
        
        return {
          success: true,
          classification: {
            hs_code: bestMatch.hs_code,
            description: bestMatch.description || bestMatch.product_description,
            confidence: bestMatch.confidence,
            tariff_rates: {
              mfn_rate: bestMatch.mfn_rate || bestMatch.mfn_tariff_rate,
              usmca_rate: bestMatch.usmca_rate || bestMatch.usmca_tariff_rate
            },
            savings_percent: bestMatch.savings_percent
          },
          alternatives: result.results.slice(1, 5), // Include up to 4 alternatives
          method: result.method || 'ai_enhanced',
          total_matches: result.total_matches
        };
      } else {
        throw new Error('No classification results returned');
      }

    } catch (error) {
      await logDevIssue({
        type: 'api_error',
        severity: 'high',
        component: 'database_service',
        message: 'Product classification API failed',
        data: {
          error: error.message,
          stack: error.stack,
          productDescription: productDescription?.substring(0, 100),
          industrySector,
          endpoint: '/api/ai-classification'
        }
      });

      logError('Product classification failed', {
        error: error.message,
        description: productDescription?.substring(0, 50)
      });

      throw new Error(`Classification failed: ${error.message}`);
    }
  }

  /**
   * Validate form data before processing
   */
  validateFormData(formData) {
    const errors = [];

    if (!formData.company_name || formData.company_name.length < 2) {
      errors.push('Company name must be at least 2 characters');
    }

    if (!formData.business_type) {
      errors.push('Business type (role) is required');
    }

    if (!formData.industry_sector) {
      errors.push('Industry sector is required');
    }

    if (!formData.product_description || formData.product_description.length < 10) {
      errors.push('Product description must be at least 10 characters');
    }

    if (!formData.manufacturing_location) {
      errors.push('Manufacturing/Assembly location is required');
    }

    if (!formData.trade_volume) {
      errors.push('Trade volume is required');
    }

    if (!formData.component_origins || formData.component_origins.length === 0) {
      errors.push('At least one component origin is required');
    } else {
      const totalPercentage = formData.component_origins.reduce(
        (sum, comp) => sum + parseFloat(comp.value_percentage || 0), 0
      );
      
      if (Math.abs(totalPercentage - 100) > 0.1) {
        errors.push(`Component origins must total 100%, currently ${totalPercentage.toFixed(1)}%`);
      }

      formData.component_origins.forEach((comp, index) => {
        if (!comp.description || comp.description.length < 3) {
          errors.push(`Component ${index + 1} requires a description (minimum 3 characters)`);
        }
        if (!comp.origin_country) {
          errors.push(`Component ${index + 1} requires a country`);
        }
        if (!comp.value_percentage || comp.value_percentage <= 0) {
          errors.push(`Component ${index + 1} requires a value percentage greater than 0`);
        }
        // HS codes are optional - AI will classify during analysis if not provided
        // No HS code validation needed for hybrid approach
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get country code from country name
   */
  getCountryCode(countryName) {
    // Use system config for country code mappings
    const codes = SYSTEM_CONFIG.countries.codeMappings;
    
    return codes[countryName] || countryName.substring(0, 2).toUpperCase();
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();
export default workflowService;
// Test export for debugging
export function testDropdownLoading() {
  return new WorkflowService().loadDropdownOptions();
}
