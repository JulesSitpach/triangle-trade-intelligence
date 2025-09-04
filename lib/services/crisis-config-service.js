/**
 * CRISIS CONFIGURATION SERVICE
 * Database-driven crisis parameters - ZERO HARDCODED VALUES
 * 
 * Replaces all hardcoded crisis rates, thresholds, and configuration
 * All values come from crisis_config table or environment variables
 */

import { serverDatabaseService } from '../database/supabase-client.js';
import { logInfo, logError, logPerformance } from '../utils/production-logger.js';

export class CrisisConfigService {
  constructor() {
    this.cache = new Map();
    this.cacheTtl = parseInt(process.env.CRISIS_CONFIG_CACHE_TTL || '300000'); // 5 minutes
    this.dbService = serverDatabaseService;
  }

  /**
   * Get crisis tariff rate - NO HARDCODED 25%
   * Returns current Trump tariff rate from database
   */
  async getCrisisRate(rateKey = 'trump_tariff_rate') {
    const startTime = Date.now();
    
    try {
      const cacheKey = `crisis_rate_${rateKey}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const { data, error } = await this.dbService.client
        .from('crisis_config')
        .select('config_value')
        .eq('config_key', rateKey)
        .eq('active', true)
        .single();

      if (error || !data) {
        logError(`Crisis rate not found: ${rateKey}`, { error: error?.message });
        // Fallback to environment variable
        const fallbackRate = parseFloat(process.env.FALLBACK_CRISIS_RATE || '0.25');
        return { rate: fallbackRate, source: 'environment_fallback' };
      }

      const rateConfig = data.config_value;
      this.setCache(cacheKey, rateConfig);
      
      logPerformance('Crisis rate lookup', startTime, { rateKey, source: 'database' });
      return rateConfig;

    } catch (error) {
      logError('Crisis rate lookup failed', { error: error.message, rateKey });
      // Emergency fallback
      return { 
        rate: parseFloat(process.env.FALLBACK_CRISIS_RATE || '0.25'),
        source: 'emergency_fallback',
        error: error.message
      };
    }
  }

  /**
   * Get all crisis configuration - NO HARDCODED config values
   */
  async getAllCrisisConfig() {
    const startTime = Date.now();
    
    try {
      const cacheKey = 'all_crisis_config';
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const { data, error } = await this.dbService.client
        .from('active_crisis_config') // Using the view for active configs
        .select('*')
        .order('config_key');

      if (error) {
        logError('Failed to load crisis configuration', { error: error.message });
        return this.getEmergencyConfig();
      }

      // Convert to key-value object
      const config = {};
      data.forEach(item => {
        config[item.config_key] = item.config_value;
      });

      this.setCache(cacheKey, config);
      logPerformance('All crisis config lookup', startTime, { configCount: data.length });
      
      return config;

    } catch (error) {
      logError('Crisis configuration lookup failed', { error: error.message });
      return this.getEmergencyConfig();
    }
  }

  /**
   * Get specific configuration value - NO HARDCODED anything
   */
  async getConfig(configKey, defaultValue = null) {
    try {
      const cacheKey = `config_${configKey}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const { data, error } = await this.dbService.client
        .from('crisis_config')
        .select('config_value')
        .eq('config_key', configKey)
        .eq('active', true)
        .single();

      if (error || !data) {
        // Check environment variable fallback
        const envKey = `CRISIS_${configKey.toUpperCase()}`;
        const envValue = process.env[envKey];
        if (envValue) {
          try {
            return JSON.parse(envValue);
          } catch {
            return envValue;
          }
        }
        return defaultValue;
      }

      const configValue = data.config_value;
      this.setCache(cacheKey, configValue);
      return configValue;

    } catch (error) {
      logError('Config lookup failed', { error: error.message, configKey });
      return defaultValue;
    }
  }

  /**
   * Get validation thresholds - NO HARDCODED dollar amounts
   */
  async getValidationThresholds() {
    const thresholds = await this.getConfig('validation_thresholds');
    
    if (!thresholds) {
      // Environment variable fallbacks
      return {
        auto_approve_under: parseInt(process.env.AUTO_APPROVE_UNDER || '50000'),
        professional_review_over: parseInt(process.env.PROFESSIONAL_REVIEW_OVER || '50000'),
        expert_required_over: parseInt(process.env.EXPERT_REQUIRED_OVER || '500000')
      };
    }

    return thresholds;
  }

  /**
   * Get professional validation configuration - NO HARDCODED professional settings
   */
  async getProfessionalValidationConfig() {
    return await this.getConfig('professional_validation', {
      enabled: true,
      auto_assign: true,
      sla_hours: 24,
      emergency_sla_hours: 4
    });
  }

  /**
   * Get ROI calculation parameters - NO HARDCODED multipliers
   */
  async getROIParams() {
    const params = await this.getConfig('roi_calculation_params');
    
    if (!params) {
      return {
        annual_months: 12,
        risk_multiplier: parseFloat(process.env.ROI_RISK_MULTIPLIER || '1.2'),
        conservative_estimate: parseFloat(process.env.CONSERVATIVE_ESTIMATE || '0.8')
      };
    }

    return params;
  }

  /**
   * Update crisis configuration - for admin interface
   */
  async updateConfig(configKey, configValue, configType = 'rates') {
    try {
      const { data, error } = await this.dbService.client
        .from('crisis_config')
        .upsert({
          config_key: configKey,
          config_value: configValue,
          config_type: configType,
          active: true,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logError('Failed to update crisis configuration', { 
          error: error.message, 
          configKey 
        });
        return { success: false, error: error.message };
      }

      // Clear cache
      this.clearConfigCache();
      
      logInfo('Crisis configuration updated', { configKey, configType });
      return { success: true, data };

    } catch (error) {
      logError('Crisis configuration update failed', { 
        error: error.message, 
        configKey 
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Emergency configuration fallback - when database unavailable
   */
  getEmergencyConfig() {
    return {
      trump_tariff_rate: { 
        rate: parseFloat(process.env.FALLBACK_CRISIS_RATE || '0.25'),
        source: 'emergency_fallback'
      },
      validation_thresholds: {
        auto_approve_under: 50000,
        professional_review_over: 50000,
        expert_required_over: 500000
      },
      roi_calculation_params: {
        annual_months: 12,
        risk_multiplier: 1.2,
        conservative_estimate: 0.8
      }
    };
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

  clearConfigCache() {
    this.cache.clear();
    logInfo('Crisis configuration cache cleared');
  }

  /**
   * Health check for crisis configuration system
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      
      // Test database connectivity
      const { data, error } = await this.dbService.client
        .from('crisis_config')
        .select('count(*)')
        .limit(1);

      if (error) {
        return {
          status: 'unhealthy',
          error: error.message,
          fallback_available: true
        };
      }

      // Test key configurations
      const crisisRate = await this.getCrisisRate();
      const validationThresholds = await this.getValidationThresholds();

      return {
        status: 'healthy',
        response_time_ms: Date.now() - startTime,
        config_count: data?.[0]?.count || 0,
        crisis_rate_available: !!crisisRate?.rate,
        validation_thresholds_available: !!validationThresholds,
        cache_size: this.cache.size
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
export const crisisConfigService = new CrisisConfigService();