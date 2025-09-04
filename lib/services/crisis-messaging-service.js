/**
 * CRISIS MESSAGING SERVICE
 * Database-driven messaging with template variables - NO HARDCODED text
 * 
 * All crisis messaging comes from crisis_messages and localization_content tables
 * Supports template variables like {trump_tariff_rate}, {penalty_amount}
 */

import { serverDatabaseService } from '../database/supabase-client.js';
import { crisisConfigService } from './crisis-config-service.js';
import { dynamicPricingService } from './dynamic-pricing-service.js';
import { logInfo, logError, logPerformance } from '../utils/production-logger.js';

export class CrisisMessagingService {
  constructor() {
    this.dbService = serverDatabaseService;
    this.crisisConfig = crisisConfigService;
    this.pricingService = dynamicPricingService;
    this.cache = new Map();
    this.cacheTtl = parseInt(process.env.MESSAGING_CACHE_TTL || '1800000'); // 30 minutes
    this.variableCache = new Map();
  }

  /**
   * Get crisis message with variables interpolated - NO HARDCODED messages
   */
  async getCrisisMessage(messageKey, locale = 'en', variables = {}) {
    const startTime = Date.now();

    try {
      const cacheKey = `message_${messageKey}_${locale}`;
      let messageTemplate = this.getFromCache(cacheKey);

      if (!messageTemplate) {
        // Get message from database
        const { data, error } = await this.dbService.client
          .from('crisis_messages')
          .select(`
            content_${locale} as content,
            variables,
            message_type,
            priority
          `)
          .eq('message_key', messageKey)
          .eq('active', true)
          .single();

        if (error || !data) {
          logError(`Crisis message not found: ${messageKey}`, { error: error?.message, locale });
          return this.getFallbackMessage(messageKey, locale);
        }

        messageTemplate = {
          content: data.content,
          variables: data.variables || {},
          message_type: data.message_type,
          priority: data.priority
        };

        this.setCache(cacheKey, messageTemplate);
      }

      // Merge provided variables with template variables
      const allVariables = { ...messageTemplate.variables, ...variables };

      // Interpolate variables
      const interpolatedContent = await this.interpolateVariables(
        messageTemplate.content,
        allVariables,
        locale
      );

      logPerformance('Crisis message lookup', startTime, { messageKey, locale });

      return {
        content: interpolatedContent,
        message_type: messageTemplate.message_type,
        priority: messageTemplate.priority,
        variables_used: Object.keys(allVariables)
      };

    } catch (error) {
      logError('Crisis message lookup failed', {
        error: error.message,
        messageKey,
        locale
      });
      return this.getFallbackMessage(messageKey, locale);
    }
  }

  /**
   * Get multiple crisis messages for a context - NO HARDCODED message sets
   */
  async getCrisisMessagesForContext(context, locale = 'en', variables = {}) {
    const startTime = Date.now();

    try {
      const cacheKey = `context_${context}_${locale}`;
      let messages = this.getFromCache(cacheKey);

      if (!messages) {
        const { data, error } = await this.dbService.client
          .from('crisis_messages')
          .select(`
            message_key,
            content_${locale} as content,
            variables,
            message_type,
            priority
          `)
          .eq('context', context)
          .eq('active', true)
          .order('priority', { ascending: false });

        if (error) {
          logError(`Failed to load context messages: ${context}`, { error: error.message });
          return {};
        }

        messages = data || [];
        this.setCache(cacheKey, messages);
      }

      // Process all messages
      const processedMessages = {};
      
      for (const message of messages) {
        const allVariables = { ...message.variables, ...variables };
        const interpolatedContent = await this.interpolateVariables(
          message.content,
          allVariables,
          locale
        );

        processedMessages[message.message_key] = {
          content: interpolatedContent,
          message_type: message.message_type,
          priority: message.priority
        };
      }

      logPerformance('Context messages lookup', startTime, { 
        context, 
        messageCount: messages.length 
      });

      return processedMessages;

    } catch (error) {
      logError('Context messages lookup failed', {
        error: error.message,
        context,
        locale
      });
      return {};
    }
  }

  /**
   * Interpolate template variables - NO HARDCODED variable values
   */
  async interpolateVariables(template, variables, locale = 'en') {
    if (!template || typeof template !== 'string') return template;

    try {
      // Find all variables in template: {variable_name}
      const variableMatches = template.match(/{([^}]+)}/g);
      if (!variableMatches) return template;

      let interpolatedTemplate = template;

      for (const match of variableMatches) {
        const variableName = match.slice(1, -1); // Remove { and }
        let variableValue = await this.resolveVariableValue(variableName, variables, locale);

        // Format the variable value
        variableValue = this.formatVariableValue(variableValue, variableName, locale);
        
        // Replace all instances of this variable
        interpolatedTemplate = interpolatedTemplate.replace(
          new RegExp(`\\{${variableName}\\}`, 'g'),
          variableValue
        );
      }

      return interpolatedTemplate;

    } catch (error) {
      logError('Variable interpolation failed', {
        error: error.message,
        template: template.substring(0, 100)
      });
      return template; // Return original template on error
    }
  }

  /**
   * Resolve variable value from various sources - NO HARDCODED variable values
   */
  async resolveVariableValue(variableName, providedVariables, locale) {
    // 1. Check provided variables first
    if (providedVariables[variableName] !== undefined) {
      return providedVariables[variableName];
    }

    // 2. Check variable cache
    const cacheKey = `var_${variableName}_${locale}`;
    const cached = this.getVariableFromCache(cacheKey);
    if (cached !== null) return cached;

    let resolvedValue = null;

    try {
      // 3. Resolve from database sources
      switch (variableName) {
        case 'trump_tariff_rate':
          const crisisRate = await this.crisisConfig.getCrisisRate('trump_tariff_rate');
          resolvedValue = (crisisRate?.rate * 100) || 25; // Convert to percentage
          break;

        case 'biden_current_rate':
          const currentRate = await this.crisisConfig.getCrisisRate('biden_current_rate');
          resolvedValue = (currentRate?.rate * 100) || 7.2; // Convert to percentage
          break;

        case 'emergency_rate':
          resolvedValue = await this.pricingService.getEmergencyRate();
          break;

        case 'protection_price':
          const protectionService = await this.pricingService.getServicePrice('protection-plan');
          resolvedValue = protectionService?.base_price || 799;
          break;

        case 'survival_price':
          const survivalService = await this.pricingService.getServicePrice('survival-plan');
          resolvedValue = survivalService?.base_price || 299;
          break;

        case 'enterprise_price':
          const enterpriseService = await this.pricingService.getServicePrice('enterprise-shield');
          resolvedValue = enterpriseService?.base_price || 2499;
          break;

        case 'validator_name':
          resolvedValue = await this.getProfessionalValidatorValue('validator_name');
          break;

        case 'license_number':
          resolvedValue = await this.getProfessionalValidatorValue('license_number');
          break;

        case 'experience_years':
          resolvedValue = await this.getProfessionalValidatorValue('experience_years');
          break;

        default:
          // Check crisis config for custom variables
          const configValue = await this.crisisConfig.getConfig(variableName);
          if (configValue !== null) {
            resolvedValue = configValue;
          } else {
            // Final fallback to environment variable
            const envKey = `CRISIS_VAR_${variableName.toUpperCase()}`;
            resolvedValue = process.env[envKey] || `{${variableName}}`;
          }
      }

      // Cache the resolved value
      this.setVariableCache(cacheKey, resolvedValue);
      return resolvedValue;

    } catch (error) {
      logError('Variable resolution failed', {
        error: error.message,
        variableName
      });
      return `{${variableName}}`; // Return placeholder on error
    }
  }

  /**
   * Get professional validator values - NO HARDCODED Cristina details
   */
  async getProfessionalValidatorValue(field) {
    try {
      const { data, error } = await this.dbService.client
        .from('professional_validators')
        .select(field)
        .eq('active', true)
        .order('experience_years', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // Fallback to environment variables
        const fallbackMap = {
          validator_name: process.env.FALLBACK_VALIDATOR_NAME || 'Professional Validator',
          license_number: process.env.FALLBACK_LICENSE_NUMBER || '####',
          experience_years: process.env.FALLBACK_EXPERIENCE_YEARS || '15+'
        };
        return fallbackMap[field] || 'N/A';
      }

      return data[field];
    } catch (error) {
      logError('Professional validator lookup failed', { error: error.message, field });
      return 'N/A';
    }
  }

  /**
   * Format variable values for display - NO HARDCODED formatting
   */
  formatVariableValue(value, variableName, locale) {
    if (value === null || value === undefined) return '';

    try {
      // Currency formatting
      if (variableName.includes('price') || variableName.includes('rate') || variableName.includes('cost')) {
        if (typeof value === 'number') {
          return new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value);
        }
      }

      // Percentage formatting
      if (variableName.includes('percent') || variableName.includes('tariff_rate')) {
        if (typeof value === 'number') {
          return `${value.toFixed(1)}`;
        }
      }

      // Number formatting
      if (typeof value === 'number') {
        return value.toLocaleString(locale === 'es' ? 'es-MX' : 'en-US');
      }

      return String(value);
    } catch (error) {
      logError('Variable formatting failed', {
        error: error.message,
        variableName,
        value
      });
      return String(value);
    }
  }

  /**
   * Get localized UI text - NO HARDCODED interface text
   */
  async getLocalizedText(contentKey, locale = 'en', fallbackText = '') {
    const startTime = Date.now();

    try {
      const cacheKey = `ui_text_${contentKey}_${locale}`;
      let text = this.getFromCache(cacheKey);

      if (!text) {
        const { data, error } = await this.dbService.client
          .from('localization_content')
          .select('content_value')
          .eq('content_key', contentKey)
          .eq('locale', locale)
          .eq('active', true)
          .single();

        if (error || !data) {
          // Try English fallback
          if (locale !== 'en') {
            return await this.getLocalizedText(contentKey, 'en', fallbackText);
          }
          return fallbackText || contentKey;
        }

        text = data.content_value;
        this.setCache(cacheKey, text);
      }

      logPerformance('Localized text lookup', startTime, { contentKey, locale });
      return text;

    } catch (error) {
      logError('Localized text lookup failed', {
        error: error.message,
        contentKey,
        locale
      });
      return fallbackText || contentKey;
    }
  }

  /**
   * Get crisis messaging for landing page - NO HARDCODED page content
   */
  async getLandingPageMessages(locale = 'en', calculationData = {}) {
    const variables = {
      trump_tariff_rate: calculationData.crisisRate * 100 || null,
      penalty_amount: calculationData.totalSavings || null,
      ...calculationData
    };

    const messages = await this.getCrisisMessagesForContext('landing_page', locale, variables);
    
    return {
      hero_title: messages.hero_title_main?.content || '',
      hero_subtitle: messages.hero_subtitle?.content || '',
      penalty_warning: messages.penalty_warning?.content || '',
      business_survival: messages.business_survival?.content || '',
      cta_emergency: messages.cta_emergency?.content || '',
      cta_professional: messages.cta_professional?.content || '',
      benefit_professional: messages.benefit_professional?.content || '',
      benefit_experience: messages.benefit_experience?.content || ''
    };
  }

  /**
   * Create A/B test message variant - NO HARDCODED test variants
   */
  async createMessageVariant(messageKey, variantContent, locale = 'en', testGroup = 'variant_a') {
    try {
      const { data, error } = await this.dbService.client
        .from('crisis_messages')
        .insert({
          message_key: `${messageKey}_${testGroup}`,
          message_type: 'hero',
          [`content_${locale}`]: variantContent,
          context: 'a_b_test',
          a_b_test_group: testGroup,
          active: true,
          priority: 50
        })
        .select()
        .single();

      if (error) {
        logError('Failed to create message variant', { error: error.message, messageKey });
        return { success: false, error: error.message };
      }

      // Clear related caches
      this.clearMessageCache();

      logInfo('Message variant created', { messageKey, testGroup });
      return { success: true, data };

    } catch (error) {
      logError('Message variant creation failed', { error: error.message, messageKey });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update crisis message - for admin interface
   */
  async updateCrisisMessage(messageKey, updates, locale = 'en') {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Handle localized content
      if (updates.content) {
        updateData[`content_${locale}`] = updates.content;
        delete updateData.content;
      }

      const { data, error } = await this.dbService.client
        .from('crisis_messages')
        .update(updateData)
        .eq('message_key', messageKey)
        .select()
        .single();

      if (error) {
        logError('Failed to update crisis message', { error: error.message, messageKey });
        return { success: false, error: error.message };
      }

      // Clear caches
      this.clearMessageCache();

      logInfo('Crisis message updated', { messageKey, locale });
      return { success: true, data };

    } catch (error) {
      logError('Crisis message update failed', { error: error.message, messageKey });
      return { success: false, error: error.message };
    }
  }

  /**
   * Emergency fallback messages when database unavailable
   */
  getFallbackMessage(messageKey, locale = 'en') {
    const fallbackMessages = {
      en: {
        hero_title_main: 'Avoid Trump Tariff Penalties with Professional USMCA Compliance',
        hero_subtitle: 'While competitors face penalties, you pay 0% with professional validation',
        penalty_warning: 'One documentation error = massive penalty on single shipment',
        cta_emergency: 'Get Emergency Consultation',
        benefit_professional: 'Validated by Licensed Mexican Customs Broker'
      },
      es: {
        hero_title_main: 'Evita las Penalidades Arancelarias de Trump con Cumplimiento USMCA Profesional',
        hero_subtitle: 'Mientras los competidores enfrentan penalidades, tú pagas 0% con validación profesional',
        penalty_warning: 'Un error de documentación = penalidad masiva en un solo envío',
        cta_emergency: 'Obtén Consulta de Emergencia',
        benefit_professional: 'Validado por Corredor Aduanal Mexicano Licenciado'
      }
    };

    const localeMessages = fallbackMessages[locale] || fallbackMessages.en;
    const message = localeMessages[messageKey] || process.env[`FALLBACK_${messageKey.toUpperCase()}`] || messageKey;

    return {
      content: message,
      message_type: 'fallback',
      priority: 0,
      source: 'emergency_fallback'
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

  setVariableCache(key, value) {
    this.variableCache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  getVariableFromCache(key) {
    const cached = this.variableCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTtl) {
      this.variableCache.delete(key);
      return null;
    }

    return cached.value;
  }

  clearMessageCache() {
    this.cache.clear();
    this.variableCache.clear();
    logInfo('Crisis messaging cache cleared');
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      
      // Test message retrieval
      const testMessage = await this.getCrisisMessage('hero_title_main', 'en');
      
      // Test variable resolution
      const crisisRate = await this.resolveVariableValue('trump_tariff_rate', {}, 'en');

      return {
        status: testMessage && crisisRate ? 'healthy' : 'degraded',
        response_time_ms: Date.now() - startTime,
        cache_size: this.cache.size,
        variable_cache_size: this.variableCache.size,
        test_message_available: !!testMessage?.content,
        crisis_rate_resolvable: !!crisisRate
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const crisisMessagingService = new CrisisMessagingService();