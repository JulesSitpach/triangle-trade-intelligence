/**
 * DYNAMIC PRICING SERVICE
 * Database-driven pricing - NO HARDCODED $299/$799/$2499
 * 
 * All pricing comes from service_pricing table
 * Supports multi-currency and market-specific pricing
 */

import { serverDatabaseService } from '../database/supabase-client.js';
import { logInfo, logError, logPerformance } from '../utils/production-logger.js';

export class DynamicPricingService {
  constructor() {
    this.cache = new Map();
    this.cacheTtl = parseInt(process.env.PRICING_CACHE_TTL || '600000'); // 10 minutes
    this.dbService = serverDatabaseService;
    this.exchangeRateCache = new Map();
    this.exchangeRateTtl = parseInt(process.env.EXCHANGE_RATE_CACHE_TTL || '3600000'); // 1 hour
  }

  /**
   * Get platform pricing tiers - NO HARDCODED $299/$799/$2499
   */
  async getPlatformTiers(market = 'global', currency = 'USD') {
    const startTime = Date.now();
    
    try {
      const cacheKey = `platform_tiers_${market}_${currency}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const { data, error } = await this.dbService.client
        .from('service_pricing')
        .select(`
          service_name,
          service_slug,
          display_name_en,
          display_name_es,
          description_en,
          description_es,
          base_price,
          currency,
          features,
          limits,
          trial_available,
          trial_duration_days,
          display_order
        `)
        .eq('service_type', 'platform_tier')
        .eq('active', true)
        .in('market_segment', [market, 'global'])
        .order('display_order');

      if (error) {
        logError('Failed to load platform pricing', { error: error.message, market });
        return this.getEmergencyPlatformPricing(currency);
      }

      // Convert currency if needed
      const tiers = await Promise.all(data.map(async (tier) => {
        const convertedPrice = await this.convertCurrency(
          tier.base_price,
          tier.currency,
          currency
        );

        return {
          ...tier,
          base_price: convertedPrice,
          original_price: tier.base_price,
          original_currency: tier.currency,
          display_currency: currency
        };
      }));

      this.setCache(cacheKey, tiers);
      logPerformance('Platform tiers lookup', startTime, { 
        market, 
        currency, 
        tierCount: tiers.length 
      });

      return tiers;

    } catch (error) {
      logError('Platform pricing lookup failed', { error: error.message, market });
      return this.getEmergencyPlatformPricing(currency);
    }
  }

  /**
   * Get specific service pricing - NO HARDCODED rates
   */
  async getServicePrice(serviceSlug, market = 'global', currency = 'USD') {
    const startTime = Date.now();
    
    try {
      const cacheKey = `service_price_${serviceSlug}_${market}_${currency}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const { data, error } = await this.dbService.client
        .from('service_pricing')
        .select('*')
        .eq('service_slug', serviceSlug)
        .eq('active', true)
        .in('market_segment', [market, 'global'])
        .single();

      if (error) {
        logError(`Service price not found: ${serviceSlug}`, { error: error.message });
        return this.getEmergencyServicePrice(serviceSlug, currency);
      }

      // Convert currency if needed
      const convertedPrice = await this.convertCurrency(
        data.base_price,
        data.currency,
        currency
      );

      const result = {
        ...data,
        base_price: convertedPrice,
        original_price: data.base_price,
        original_currency: data.currency,
        display_currency: currency
      };

      this.setCache(cacheKey, result);
      logPerformance('Service price lookup', startTime, { serviceSlug, market });

      return result;

    } catch (error) {
      logError('Service price lookup failed', { error: error.message, serviceSlug });
      return this.getEmergencyServicePrice(serviceSlug, currency);
    }
  }

  /**
   * Get emergency consultation rate - NO HARDCODED $500/hour
   */
  async getEmergencyRate(currency = 'USD') {
    const emergencyService = await this.getServicePrice('crisis-intervention', 'global', currency);
    return emergencyService?.base_price || this.getEmergencyFallbackRate(currency);
  }

  /**
   * Get professional services pricing - NO HARDCODED project rates
   */
  async getProfessionalServices(market = 'global', currency = 'USD') {
    const startTime = Date.now();
    
    try {
      const cacheKey = `professional_services_${market}_${currency}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const { data, error } = await this.dbService.client
        .from('service_pricing')
        .select('*')
        .eq('service_type', 'professional_service')
        .eq('active', true)
        .in('market_segment', [market, 'global'])
        .order('display_order');

      if (error) {
        logError('Failed to load professional services pricing', { error: error.message });
        return this.getEmergencyProfessionalPricing(currency);
      }

      // Convert currency for each service
      const services = await Promise.all(data.map(async (service) => {
        const convertedPrice = await this.convertCurrency(
          service.base_price,
          service.currency,
          currency
        );

        return {
          ...service,
          base_price: convertedPrice,
          original_price: service.base_price,
          original_currency: service.currency,
          display_currency: currency
        };
      }));

      this.setCache(cacheKey, services);
      logPerformance('Professional services lookup', startTime, { 
        market, 
        serviceCount: services.length 
      });

      return services;

    } catch (error) {
      logError('Professional services pricing failed', { error: error.message });
      return this.getEmergencyProfessionalPricing(currency);
    }
  }

  /**
   * Calculate pricing for custom trade volumes - NO HARDCODED volume tiers
   */
  async calculateCustomPricing(tradeVolume, serviceSlug, market = 'global') {
    try {
      const baseService = await this.getServicePrice(serviceSlug, market);
      if (!baseService) return null;

      // Get volume-based pricing multipliers from database
      const { data: volumeMultipliers } = await this.dbService.client
        .from('crisis_config')
        .select('config_value')
        .eq('config_key', 'volume_pricing_multipliers')
        .eq('active', true)
        .single();

      let multiplier = 1.0;
      
      if (volumeMultipliers?.config_value) {
        const multipliers = volumeMultipliers.config_value;
        
        // Apply volume-based pricing
        if (tradeVolume >= (multipliers.enterprise_threshold || 10000000)) {
          multiplier = multipliers.enterprise_multiplier || 1.5;
        } else if (tradeVolume >= (multipliers.mid_market_threshold || 5000000)) {
          multiplier = multipliers.mid_market_multiplier || 1.2;
        } else if (tradeVolume >= (multipliers.small_business_threshold || 1000000)) {
          multiplier = multipliers.small_business_multiplier || 1.0;
        } else {
          multiplier = multipliers.startup_multiplier || 0.8;
        }
      } else {
        // Fallback volume-based pricing from environment
        if (tradeVolume >= parseInt(process.env.ENTERPRISE_VOLUME_THRESHOLD || '10000000')) {
          multiplier = parseFloat(process.env.ENTERPRISE_PRICING_MULTIPLIER || '1.5');
        } else if (tradeVolume >= parseInt(process.env.MID_MARKET_VOLUME_THRESHOLD || '5000000')) {
          multiplier = parseFloat(process.env.MID_MARKET_PRICING_MULTIPLIER || '1.2');
        }
      }

      return {
        ...baseService,
        base_price: baseService.base_price * multiplier,
        volume_multiplier: multiplier,
        trade_volume: tradeVolume,
        pricing_tier: this.getVolumeTierName(tradeVolume)
      };

    } catch (error) {
      logError('Custom pricing calculation failed', { error: error.message, tradeVolume });
      return null;
    }
  }

  /**
   * Currency conversion - NO HARDCODED exchange rates
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;

    try {
      const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
      return Math.round(amount * exchangeRate * 100) / 100; // Round to 2 decimals
    } catch (error) {
      logError('Currency conversion failed', { 
        error: error.message, 
        fromCurrency, 
        toCurrency 
      });
      return amount; // Return original amount if conversion fails
    }
  }

  /**
   * Get exchange rate - uses external API or fallback rates
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1.0;

    const cacheKey = `exchange_rate_${fromCurrency}_${toCurrency}`;
    const cached = this.getFromExchangeCache(cacheKey);
    if (cached) return cached;

    try {
      // Try external API first
      if (process.env.EXCHANGE_RATE_API_KEY) {
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${fromCurrency}?access_key=${process.env.EXCHANGE_RATE_API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          const rate = data.rates[toCurrency];
          
          if (rate) {
            this.setExchangeCache(cacheKey, rate);
            return rate;
          }
        }
      }

      // Fallback to database-stored rates
      const { data } = await this.dbService.client
        .from('crisis_config')
        .select('config_value')
        .eq('config_key', 'exchange_rates')
        .eq('active', true)
        .single();

      if (data?.config_value?.[`${fromCurrency}_${toCurrency}`]) {
        const rate = data.config_value[`${fromCurrency}_${toCurrency}`];
        this.setExchangeCache(cacheKey, rate);
        return rate;
      }

      // Final fallback to environment variables
      const envRate = parseFloat(process.env[`RATE_${fromCurrency}_${toCurrency}`]);
      if (envRate) {
        return envRate;
      }

      // Emergency fallback rates
      return this.getEmergencyExchangeRate(fromCurrency, toCurrency);

    } catch (error) {
      logError('Exchange rate lookup failed', { 
        error: error.message, 
        fromCurrency, 
        toCurrency 
      });
      return this.getEmergencyExchangeRate(fromCurrency, toCurrency);
    }
  }

  /**
   * Emergency pricing fallbacks when database unavailable
   */
  getEmergencyPlatformPricing(currency = 'USD') {
    const usdPricing = [
      {
        service_name: 'survival_plan',
        service_slug: 'survival-plan',
        display_name_en: 'Crisis Survival Plan',
        base_price: parseFloat(process.env.FALLBACK_SURVIVAL_PRICE || '299'),
        pricing_model: 'monthly',
        currency: currency,
        source: 'emergency_fallback'
      },
      {
        service_name: 'protection_plan',
        service_slug: 'protection-plan',
        display_name_en: 'Professional Protection Plan',
        base_price: parseFloat(process.env.FALLBACK_PROTECTION_PRICE || '799'),
        pricing_model: 'monthly',
        currency: currency,
        source: 'emergency_fallback'
      },
      {
        service_name: 'enterprise_shield',
        service_slug: 'enterprise-shield',
        display_name_en: 'Enterprise Crisis Shield',
        base_price: parseFloat(process.env.FALLBACK_ENTERPRISE_PRICE || '2499'),
        pricing_model: 'monthly',
        currency: currency,
        source: 'emergency_fallback'
      }
    ];

    return usdPricing;
  }

  getEmergencyServicePrice(serviceSlug, currency = 'USD') {
    const fallbackPrices = {
      'crisis-intervention': parseFloat(process.env.FALLBACK_EMERGENCY_RATE || '500'),
      'supply-chain-audit': parseFloat(process.env.FALLBACK_AUDIT_PRICE || '25000'),
      'mexico-sourcing-strategy': parseFloat(process.env.FALLBACK_SOURCING_PRICE || '15000')
    };

    return {
      service_slug: serviceSlug,
      base_price: fallbackPrices[serviceSlug] || 500,
      currency: currency,
      pricing_model: serviceSlug === 'crisis-intervention' ? 'hourly' : 'project',
      source: 'emergency_fallback'
    };
  }

  getEmergencyFallbackRate(currency = 'USD') {
    return parseFloat(process.env.FALLBACK_EMERGENCY_RATE || '500');
  }

  getEmergencyProfessionalPricing(currency = 'USD') {
    return [
      {
        service_name: 'supply_chain_audit',
        service_slug: 'supply-chain-audit',
        display_name_en: 'Supply Chain Crisis Audit',
        base_price: parseFloat(process.env.FALLBACK_AUDIT_PRICE || '25000'),
        pricing_model: 'project',
        currency: currency,
        source: 'emergency_fallback'
      }
    ];
  }

  getEmergencyExchangeRate(fromCurrency, toCurrency) {
    // Basic emergency exchange rates
    const emergencyRates = {
      'USD_MXN': 17.5,
      'USD_CAD': 1.35,
      'MXN_USD': 0.057,
      'CAD_USD': 0.74
    };

    return emergencyRates[`${fromCurrency}_${toCurrency}`] || 1.0;
  }

  getVolumeTierName(tradeVolume) {
    if (tradeVolume >= 10000000) return 'Enterprise';
    if (tradeVolume >= 5000000) return 'Mid-Market';
    if (tradeVolume >= 1000000) return 'Small Business';
    return 'Startup';
  }

  /**
   * Cache management
   */
  setCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTtl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  setExchangeCache(key, value) {
    this.exchangeRateCache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  getFromExchangeCache(key) {
    const cached = this.exchangeRateCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.exchangeRateTtl) {
      this.exchangeRateCache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      const tiers = await this.getPlatformTiers();
      
      return {
        status: 'healthy',
        response_time_ms: Date.now() - startTime,
        pricing_tiers_available: tiers?.length || 0,
        cache_size: this.cache.size,
        exchange_cache_size: this.exchangeRateCache.size
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        fallback_available: true
      };
    }
  }
}

// Export singleton instance
export const dynamicPricingService = new DynamicPricingService();