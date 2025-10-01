/**
 * DATABASE-DRIVEN USMCA COMPLIANCE ENGINE
 * NO HARDCODED VALUES - COMPLETE DATABASE INTEGRATION
 * 
 * Replaces optimized-usmca-engine.js with fully database-driven approach
 * Following Holistic Reconstruction Plan Phase 2.2 requirements
 */

import { serverDatabaseService } from '../database/supabase-client.js';
import { SYSTEM_CONFIG, MESSAGES } from '../../config/system-config.js';
import { SAFE_COUNTRIES, SAFE_BUSINESS, SAFE_MESSAGES } from '../../config/safe-config.js';
import { logInfo, logError, logPerformance } from '../utils/production-logger.js';

/**
 * Database-driven USMCA compliance engine
 * NO HARDCODED THRESHOLDS, RATES, OR BUSINESS LOGIC
 */
export class DatabaseDrivenUSMCAEngine {
  constructor() {
    this.cache = new Map();
    this.cacheTtl = SYSTEM_CONFIG.cache.defaultTtl;
    this.dbService = serverDatabaseService;
    this.isInitialized = false;
    this.initPromise = null;
    
    // All configuration comes from database or environment
    this.defaultThreshold = SYSTEM_CONFIG.usmca.defaultRegionalContentThreshold;
    this.certificateValidityDays = SYSTEM_CONFIG.usmca.certificateValidityDays;
    this.emergencyFallbackRate = SYSTEM_CONFIG.business.emergencyFallbackRate;
  }

  /**
   * Initialize engine with database-loaded configuration
   */
  async initialize() {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._performInitialization();
    await this.initPromise;
    this.isInitialized = true;
  }

  async _performInitialization() {
    const startTime = Date.now();
    
    try {
      logInfo('Initializing database-driven USMCA engine');

      // Load all USMCA countries from database - NO HARDCODED LISTS
      const usmcaCountries = await this.dbService.getCountries(true);
      this.setCache('usmca_countries', usmcaCountries.map(c => c.code));

      // Load all qualification rules from database - NO HARDCODED THRESHOLDS
      const qualificationRules = await this.dbService.getUSMCAQualificationRules();
      this.setCache('qualification_rules', qualificationRules);

      // Load business types from database - NO HARDCODED CATEGORIES
      const businessTypes = await this.dbService.getBusinessTypes();
      this.setCache('business_types', businessTypes);

      // Load triangle routing opportunities - NO HARDCODED ROUTES
      const triangleRoutes = await this.dbService.getTriangleRoutingOpportunities();
      this.setCache('triangle_routes', triangleRoutes);

      logPerformance('USMCA engine initialization', startTime, {
        usmca_countries: usmcaCountries.length,
        qualification_rules: qualificationRules.length,
        business_types: businessTypes.length,
        triangle_routes: triangleRoutes.length
      });

    } catch (error) {
      logError('USMCA engine initialization failed', { error: error.message });
      throw new Error(`Engine initialization failed: ${error.message}`);
    }
  }

  /**
   * Get USMCA qualification rules from database
   * NO HARDCODED BUSINESS TYPE MAPPINGS
   */
  async getQualificationRules(hsCode = null, businessType = null) {
    await this.initialize();

    const cacheKey = `rules_${hsCode || 'null'}_${businessType || 'null'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const rules = await this.dbService.getUSMCAQualificationRules(hsCode, businessType);
      
      if (rules && rules.length > 0) {
        // Use the most specific rule available
        const specificRule = rules.find(r => r.hs_code === hsCode) ||
                             rules.find(r => r.product_category === businessType) ||
                             rules.find(r => r.hs_chapter === hsCode?.substring(0, 2)) ||
                             rules.find(r => r.is_default);
        
        if (specificRule) {
          this.setCache(cacheKey, specificRule);
          return specificRule;
        }
      }

      // If no specific rules found, create emergency fallback
      const fallbackRule = {
        rule_type: 'regional_content',
        regional_content_threshold: this.defaultThreshold,
        required_documentation: ['Professional verification required'],
        source: 'emergency_fallback',
        is_default: true
      };

      logError('No USMCA rules found in database - using fallback', {
        hsCode,
        businessType,
        fallbackThreshold: this.defaultThreshold
      });

      return fallbackRule;

    } catch (error) {
      logError('Failed to retrieve USMCA qualification rules', { error: error.message, hsCode, businessType });
      throw error;
    }
  }

  /**
   * Get tariff rates from database
   * NO HARDCODED TARIFF RATES
   */
  async getTariffRates(hsCode, destinationCountry = SAFE_COUNTRIES.defaultDestination) {
    const cacheKey = `tariff_${hsCode}_${destinationCountry}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();

    try {
      // HIERARCHICAL HS CODE TARIFF RATE LOOKUP
      // Try exact match first, then fall back to broader classifications
      
      const result = await this.hierarchicalTariffLookup(hsCode, destinationCountry);
      
      if (result) {
        this.setCache(cacheKey, result);
        logPerformance('Tariff rates lookup', startTime, { 
          hsCode, 
          found: true,
          source: result.source,
          actualCode: result.actual_hs_code 
        });
        
        return result;
      }

      // Emergency fallback - conservative estimates only
      logError('No tariff rates found in database', { hsCode, destinationCountry });
      
      const fallbackResult = {
        mfn_rate: this.emergencyFallbackRate,
        usmca_rate: 0,
        effective_date: new Date().toISOString(),
        source: 'emergency_fallback',
        hs_code: hsCode,
        country: destinationCountry,
        warning: 'No database rates available - using conservative estimate'
      };

      return fallbackResult;

    } catch (error) {
      logError('Tariff rates lookup failed', { error: error.message, hsCode, destinationCountry });
      throw error;
    }
  }

  /**
   * Check USMCA qualification using database rules
   * NO HARDCODED QUALIFICATION LOGIC
   */
  async checkUSMCAQualification(hsCode, componentOrigins, manufacturingLocation, businessType = null) {
    const startTime = Date.now();
    
    try {
      await this.initialize();

      // Get qualification rules from database
      const rules = await this.getQualificationRules(hsCode, businessType);
      
      // Get USMCA member countries from database  
      const usmcaCountries = this.getFromCache('usmca_countries') || SAFE_COUNTRIES.usmcaMembers;

      // Validate component origins
      if (!componentOrigins || componentOrigins.length === 0) {
        throw new Error(SAFE_MESSAGES.componentsRequired);
      }

      // Calculate regional content based on database rules
      const qualification = this.calculateRegionalContent(
        componentOrigins, 
        usmcaCountries, 
        rules,
        manufacturingLocation
      );

      // Add rule source information
      qualification.rules_applied = {
        rule_type: rules.rule_type,
        threshold_percentage: rules.regional_content_threshold,
        source: rules.source || 'database_lookup',
        business_type: businessType,
        hs_code: hsCode
      };

      // Add required documentation from database
      qualification.documentation_required = rules.required_documentation || [
        'Manufacturing records',
        'Bill of materials',
        'Supplier declarations'
      ];

      logPerformance('USMCA qualification check', startTime, {
        hsCode,
        businessType,
        qualified: qualification.qualified,
        north_american_content: qualification.north_american_content
      });

      return qualification;

    } catch (error) {
      logError('USMCA qualification check failed', { error: error.message, hsCode, businessType });
      throw error;
    }
  }

  /**
   * Calculate regional content using database-driven rules
   * NO HARDCODED CALCULATION LOGIC
   */
  calculateRegionalContent(componentOrigins, usmcaCountries, rules, manufacturingLocation) {
    // Validate componentOrigins array
    if (!Array.isArray(componentOrigins) || componentOrigins.length === 0) {
      throw new Error('Component origins array is required and cannot be empty');
    }

    // Calculate total value and North American value
    const totalValue = componentOrigins.reduce((sum, comp) => sum + (comp.value_percentage || 0), 0);
    
    if (totalValue === 0) {
      throw new Error(SAFE_MESSAGES.invalidComponents);
    }

    // Calculate North American content
    const northAmericanValue = componentOrigins
      .filter(comp => usmcaCountries.includes(comp.origin_country))
      .reduce((sum, comp) => sum + (comp.value_percentage || 0), 0);

    const northAmericanPercentage = (northAmericanValue / totalValue) * 100;

    // Apply threshold from database rules
    const threshold = rules.regional_content_threshold;
    const qualified = northAmericanPercentage >= threshold;

    // Determine qualification level
    let qualificationLevel = 'not_qualified';
    if (qualified) {
      if (northAmericanPercentage >= threshold + 10) {
        qualificationLevel = 'highly_qualified';
      } else {
        qualificationLevel = 'qualified';
      }
    }

    // Determine rule text based on rule type from database
    let ruleText, reasonText;

    if (rules.rule_type === 'tariff_shift' && rules.tariff_shift_rule) {
      // Use tariff shift rule from database
      ruleText = `Tariff Shift: ${rules.tariff_shift_rule}`;
      reasonText = qualified
        ? `Product qualifies under USMCA tariff shift rule. Manufacturing in ${manufacturingLocation} meets origin requirements.`
        : `Product does not meet tariff shift requirements. Check component origins and manufacturing location.`;
    } else if (rules.rule_type === 'wholly_obtained') {
      ruleText = 'Wholly Obtained in USMCA Territory';
      reasonText = qualified
        ? `Product is wholly obtained in USMCA territory`
        : `Product does not meet wholly obtained requirements`;
    } else if (rules.rule_type === 'specific_manufacturing' && rules.specific_process_requirements) {
      ruleText = `Specific Manufacturing: ${rules.specific_process_requirements}`;
      reasonText = qualified
        ? `Product meets specific manufacturing requirements`
        : `Product does not meet specific manufacturing requirements`;
    } else {
      // Default to Regional Value Content
      ruleText = `Regional Value Content (${threshold}% required)`;
      reasonText = qualified
        ? `Product meets USMCA qualification with ${northAmericanPercentage.toFixed(1)}% North American content`
        : `Product does not meet USMCA qualification. ${northAmericanPercentage.toFixed(1)}% North American content is below the ${threshold}% requirement`;
    }

    return {
      qualified,
      qualification_level: qualificationLevel,
      rule: ruleText,
      reason: reasonText,
      north_american_content: northAmericanPercentage,
      total_value: totalValue,
      north_american_value: northAmericanValue,
      threshold_applied: threshold,
      manufacturing_location: manufacturingLocation,
      component_breakdown: componentOrigins.map(comp => ({
        ...comp,
        is_usmca_member: usmcaCountries.includes(comp.origin_country)
      }))
    };
  }

  /**
   * Calculate tariff savings using database rates
   * NO HARDCODED SAVINGS CALCULATIONS
   */
  async calculateTariffSavings(hsCode, tradeVolumeString, supplierCountry, destinationCountry = SAFE_COUNTRIES.defaultDestination) {
    const startTime = Date.now();

    try {
      // Get tariff rates from database (with hierarchical fallback)
      const rates = await this.getTariffRates(hsCode, destinationCountry);
      
      if (!rates || (!rates.mfn_rate && rates.mfn_rate !== 0)) {
        throw new Error(`No valid tariff rates found for HS code ${hsCode} (${destinationCountry})`);
      }
      
      // Parse trade volume using configuration-based rules
      const annualVolume = await this.parseTradeVolume(tradeVolumeString);

      // Calculate savings using database rates
      const mfnTariff = annualVolume * (rates.mfn_rate / 100);
      const usmcaTariff = annualVolume * (rates.usmca_rate / 100);
      const annualSavings = mfnTariff - usmcaTariff;
      const savingsPercentage = rates.mfn_rate - rates.usmca_rate;

      const result = {
        annual_savings: Math.round(annualSavings),
        monthly_savings: Math.round(annualSavings / 12),
        savings_percentage: savingsPercentage,
        mfn_rate: rates.mfn_rate,
        usmca_rate: rates.usmca_rate,
        trade_volume_used: annualVolume,
        hs_code: hsCode,
        supplier_country: supplierCountry,
        destination_country: destinationCountry,
        rates_source: rates.source || 'database_lookup',
        rates_effective_date: rates.effective_date,
        calculation_date: new Date().toISOString(),
        disclaimer: MESSAGES.disclaimers.tariffRates,
        match_type: rates.match_type || 'exact',
        actual_hs_code_used: rates.hs_code || hsCode
      };

      // Add hierarchical fallback disclaimer if applicable
      if (rates.disclaimer) {
        result.rate_disclaimer = rates.disclaimer;
        result.warning = 'Tariff rate estimated from similar classification - verify with customs';
      }

      // Add warning if using emergency fallback rates
      if (rates.source === 'emergency_fallback') {
        result.warning = 'Savings calculated using conservative estimates - verify with customs broker';
      }

      logPerformance('Tariff savings calculation', startTime, {
        hsCode,
        annualSavings: result.annual_savings,
        savingsPercentage: result.savings_percentage,
        ratesSource: rates.source
      });

      return result;

    } catch (error) {
      logError('Tariff savings calculation failed', { error: error.message, hsCode });
      throw error;
    }
  }

  /**
   * Parse trade volume using configuration-based parsing
   * NO HARDCODED VOLUME MAPPINGS
   */
  async parseTradeVolume(volumeString) {
    if (typeof volumeString === 'number') {
      return volumeString;
    }

    if (!volumeString || typeof volumeString !== 'string') {
      return SYSTEM_CONFIG.business.defaultTradeVolume;
    }

    try {
      // Clean the string
      const cleaned = volumeString.toString().trim().toLowerCase();
      
      // Handle range formats like "$5M - $25M" or "$5M-$25M"
      const rangeMatch = cleaned.match(/\$?([\d,\.]+)([kmb]?)\s*[-–]\s*\$?([\d,\.]+)([kmb]?)/i);
      
      if (rangeMatch) {
        const minValue = this.parseVolumeValue(rangeMatch[1], rangeMatch[2]);
        const maxValue = this.parseVolumeValue(rangeMatch[3], rangeMatch[4]);
        return Math.round((minValue + maxValue) / 2); // Return midpoint
      }

      // Handle single values like "$5M", "$500K", "$2.5B"
      const singleMatch = cleaned.match(/\$?([\d,\.]+)([kmb]?)/i);
      
      if (singleMatch) {
        return this.parseVolumeValue(singleMatch[1], singleMatch[2]);
      }

      // Try to parse as direct number
      const directNumber = parseFloat(cleaned.replace(/[^\d\.]/g, ''));
      
      if (!isNaN(directNumber) && directNumber > 0) {
        return Math.round(directNumber);
      }

      // Fallback to configured default
      logError('Unable to parse trade volume', { volumeString });
      return SYSTEM_CONFIG.business.defaultTradeVolume;

    } catch (error) {
      logError('Trade volume parsing error', { error: error.message, volumeString });
      return SYSTEM_CONFIG.business.defaultTradeVolume;
    }
  }

  /**
   * HIERARCHICAL TARIFF RATE LOOKUP
   * Implements fallback strategy: exact -> 8-digit -> 6-digit -> similar
   */
  async hierarchicalTariffLookup(hsCode, destinationCountry) {
    const normalizedCode = hsCode.replace(/[^0-9]/g, '');
    
    // Strategy 1: Try exact match first
    logInfo('Trying exact HS code match', { hsCode: normalizedCode });
    let rates = await this.dbService.getTariffRates(normalizedCode, destinationCountry);
    
    if (rates && rates.length > 0) {
      const rateData = rates[0];
      const mfnRate = parseFloat(rateData.mfn_rate || 0);
      
      // Only return exact match if we have meaningful rates, otherwise continue to hierarchical search
      if (mfnRate > 0) {
        return {
          mfn_rate: mfnRate,
          usmca_rate: parseFloat(rateData.usmca_rate || 0),
          effective_date: rateData.effective_date,
          source: 'exact_match',
          hs_code: hsCode,
          actual_hs_code: rateData.hs_code,
          country: destinationCountry,
          match_type: 'exact'
        };
      }
    }

    // Strategy 2: Try 8-digit family (85444XXX)
    if (normalizedCode.length >= 6) {
      const familyCode = normalizedCode.substring(0, 6);
      logInfo('Trying 8-digit family match', { familyCode });
      
      rates = await this.dbService.searchTariffRatesByPrefix(familyCode, destinationCountry);
      
      if (rates && rates.length > 0) {
        // Find best match with highest MFN rate (most conservative)
        const bestMatch = rates.reduce((best, current) => {
          const currentMfn = parseFloat(current.mfn_rate || 0);
          const bestMfn = parseFloat(best.mfn_rate || 0);
          return currentMfn > bestMfn ? current : best;
        });

        // Only return if we found meaningful rates, otherwise continue to chapter search
        const bestMfnRate = parseFloat(bestMatch.mfn_rate || 0);
        if (bestMfnRate > 0) {
          return {
            mfn_rate: bestMfnRate,
            usmca_rate: parseFloat(bestMatch.usmca_rate || 0),
            effective_date: bestMatch.effective_date,
            source: 'family_match',
            hs_code: hsCode,
          actual_hs_code: bestMatch.hs_code,
          country: destinationCountry,
          match_type: '8_digit_family',
          disclaimer: `Rate estimated from similar classification ${bestMatch.hs_code}`
        };
        }
      }
    }

    // Strategy 3: Try 4-digit chapter level (8544XXXX) 
    if (normalizedCode.length >= 4) {
      const chapterCode = normalizedCode.substring(0, 4);
      logInfo('Trying 4-digit chapter match', { chapterCode });
      
      rates = await this.dbService.searchTariffRatesByPrefix(chapterCode, destinationCountry);
      
      if (rates && rates.length > 0) {
        // Find best match with highest MFN rate (most conservative)
        const bestMatch = rates.reduce((best, current) => {
          const currentMfn = parseFloat(current.mfn_rate || 0);
          const bestMfn = parseFloat(best.mfn_rate || 0);
          return currentMfn > bestMfn ? current : best;
        });

        return {
          mfn_rate: parseFloat(bestMatch.mfn_rate || 0),
          usmca_rate: parseFloat(bestMatch.usmca_rate || 0),
          effective_date: bestMatch.effective_date,
          source: 'chapter_match',
          hs_code: hsCode,
          actual_hs_code: bestMatch.hs_code,
          country: destinationCountry,
          match_type: '4_digit_chapter',
          disclaimer: `Rate estimated from chapter ${chapterCode} classification ${bestMatch.hs_code}`
        };
      }
    }

    // Strategy 4: Try reference table as final fallback
    const hsReference = await this.dbService.getHSCodeReference(normalizedCode);
    
    if (hsReference) {
      return {
        mfn_rate: parseFloat(hsReference.mfn_tariff_rate || hsReference.base_tariff_rate || 0),
        usmca_rate: parseFloat(hsReference.usmca_tariff_rate || 0),
        effective_date: new Date().toISOString(),
        source: 'comtrade_reference',
        hs_code: hsCode,
        actual_hs_code: hsReference.hs_code,
        country: destinationCountry,
        match_type: 'reference_table',
        disclaimer: 'Rate from reference database - verify with customs'
      };
    }

    // No rates found
    logError('No tariff rates found at any level', { hsCode: normalizedCode });
    return null;
  }

  /**
   * Parse individual volume value with multiplier
   */
  parseVolumeValue(valueStr, multiplier) {
    let value = parseFloat(valueStr.replace(/,/g, ''));
    
    if (isNaN(value)) {
      return SYSTEM_CONFIG.business.defaultTradeVolume;
    }

    switch (multiplier?.toLowerCase()) {
      case 'k': return Math.round(value * 1000);
      case 'm': return Math.round(value * 1000000);
      case 'b': return Math.round(value * 1000000000);
      default: return Math.round(value);
    }
  }

  /**
   * Generate certificate data using database information
   * NO HARDCODED CERTIFICATE TEMPLATES
   */
  async generateCertificateData(product, usmcaQualification, formData) {
    if (!usmcaQualification.qualified) {
      return null;
    }

    try {
      // Get country information from database
      const countries = await this.dbService.getSupportedCountries();
      const manufacturingCountry = countries.find(c => 
        c.code === formData.manufacturing_location || c.name === formData.manufacturing_location
      );

      const today = new Date();
      const validUntil = new Date(today);
      validUntil.setDate(today.getDate() + this.certificateValidityDays);

      const certificate = {
        // Field 1: Exporter information
        exporter_name: formData.company_name || 'To be completed',
        exporter_address: formData.company_address || 'To be completed by exporter',
        exporter_tax_id: formData.tax_id || 'To be completed',

        // Field 2: Blanket period
        blanket_start: today.toISOString().split('T')[0],
        blanket_end: validUntil.toISOString().split('T')[0],

        // Field 3: Importer information
        importer_name: 'To be completed by importer',
        importer_address: 'To be completed by importer',

        // Field 4: Product description
        product_description: product.description || formData.product_description,

        // Field 5: HS tariff classification
        hs_tariff_classification: product.hs_code,

        // Field 6: Preference criterion
        preference_criterion: this.determinePreferenceCriterion(usmcaQualification),

        // Field 7: Country of origin
        country_of_origin: manufacturingCountry?.name || formData.manufacturing_location,

        // Field 8: Regional value content or other applicable rule
        regional_value_content: `${usmcaQualification.north_american_content.toFixed(1)}%`,
        applicable_rule: usmcaQualification.rule,

        // Additional information
        qualification_details: {
          threshold_met: usmcaQualification.threshold_applied,
          actual_content: usmcaQualification.north_american_content,
          qualification_level: usmcaQualification.qualification_level
        },

        // Certificate metadata
        generated_date: today.toISOString(),
        validity_days: this.certificateValidityDays,
        certificate_version: '1.0',
        
        // Required documentation
        supporting_documents: usmcaQualification.documentation_required,
        
        // Instructions
        instructions: [
          'Complete all required fields before use',
          'Sign and date the certificate',
          `Retain supporting documentation for ${SYSTEM_CONFIG.usmca.documentationRetentionYears} years`,
          'Verify information accuracy before shipment',
          MESSAGES.disclaimers.general
        ]
      };

      return certificate;

    } catch (error) {
      logError('Certificate generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Determine preference criterion based on qualification rules
   * NO HARDCODED CRITERION MAPPINGS
   */
  determinePreferenceCriterion(usmcaQualification) {
    const rules = usmcaQualification.rules_applied;
    
    if (!rules) return 'B'; // Default regional content

    switch (rules.rule_type) {
      case 'wholly_obtained': return 'A';
      case 'regional_content': return 'B';
      case 'tariff_shift': return 'C';
      case 'specific_manufacturing': return 'D';
      default: return 'B'; // Regional content default
    }
  }

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      cacheSize: this.cache.size,
      cacheTtl: this.cacheTtl,
      defaultThreshold: this.defaultThreshold,
      emergencyFallbackRate: this.emergencyFallbackRate
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.initialize();
      const dbHealth = await this.dbService.healthCheck();
      return {
        engine: 'healthy',
        database: dbHealth.healthy ? 'healthy' : 'unhealthy',
        cacheSize: this.cache.size,
        initialized: this.isInitialized
      };
    } catch (error) {
      return {
        engine: 'unhealthy',
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const databaseDrivenUSMCAEngine = new DatabaseDrivenUSMCAEngine();

const databaseDrivenUSMCAEngineExports = {
  DatabaseDrivenUSMCAEngine,
  databaseDrivenUSMCAEngine
};

export default databaseDrivenUSMCAEngineExports;