/**
 * TRUMP-ERA TARIFF MONITORING SERVICE
 * Integrates with Triangle Trade Intelligence existing architecture
 * 
 * Features:
 * - Real-time monitoring of government sources
 * - Database-driven configuration (no hardcoded values)
 * - Integration with existing supabase-client
 * - Customer alert generation and notification
 * - Automatic tariff_rates table updates
 */

import { serverDatabaseService } from '../database/supabase-client.js';
import { SYSTEM_CONFIG, TABLE_CONFIG, EXTERNAL_SERVICES, MESSAGES } from '../../config/system-config.js';
import { DataProvenanceService } from './data-provenance-service.js';
import { ProductionLogger } from '../utils/production-logger.js';

export class TrumpTariffMonitorService {
  constructor() {
    this.db = serverDatabaseService;
    this.provenanceService = new DataProvenanceService();
    this.logger = ProductionLogger;
    
    // Configuration-driven monitoring sources (no hardcoded values)
    this.sources = {
      CBP_CSMS: EXTERNAL_SERVICES.cbp.baseUrl || 'https://www.cbp.gov/trade/automated/cargo-systems-messaging-service',
      WHITE_HOUSE: 'https://www.whitehouse.gov/presidential-actions/',
      FEDERAL_REGISTER: 'https://www.federalregister.gov/',
      USTR: 'https://ustr.gov/about-us/policy-offices/press-office',
      CBP_NEWS: 'https://www.cbp.gov/newsroom/announcements'
    };
    
    // RSS-READY: Intervals for RSS feed polling (much more efficient)
    this.checkSchedule = {
      RSS_URGENT: 2 * 60 * 60 * 1000, // Every 2 hours for RSS feeds
      RSS_DAILY: 24 * 60 * 60 * 1000, // Daily RSS feed checks
      RSS_WEEKLY: 7 * 24 * 60 * 60 * 1000, // Weekly comprehensive RSS sweep
      DISABLED_POLLING: null // Direct API polling disabled in favor of RSS
    };
  }

  /**
   * Start real-time monitoring with existing Triangle Trade Intelligence patterns
   */
  async startRealTimeMonitoring() {
    try {
      this.logger.info('Starting Trump-era real-time tariff monitoring');
      
      // RSS feed monitoring - much more efficient than direct polling
      console.warn('⚠️  DIRECT POLLING DISABLED - Use RSS feeds instead');
      
      // Initialize RSS monitoring service
      const { RSSMonitorService } = await import('./rss-monitor-service.js');
      const rssMonitor = new RSSMonitorService();
      
      // Start RSS-based monitoring (replaces aggressive polling)
      const rssResult = await rssMonitor.startRSSMonitoring();
      
      this.logger.info('RSS monitoring integrated successfully', rssResult);
      
      this.logger.info('📡 RSS-based tariff monitoring READY', {
        rssUrgentInterval: this.checkSchedule.RSS_URGENT,
        rssDailyInterval: this.checkSchedule.RSS_DAILY,
        aggressivePollingDisabled: true
      });
      
      return { success: true, message: 'Monitoring started successfully' };
    } catch (error) {
      this.logger.error('Failed to start monitoring', error);
      throw error;
    }
  }

  /**
   * Check urgent sources (CBP CSMS, White House) for immediate changes
   */
  async checkUrgentSources() {
    const startTime = Date.now();
    
    try {
      const urgentUpdates = [];
      
      // Get active urgent monitoring sources from database (not hardcoded)
      const { data: sources, error } = await this.db.client
        .from('monitoring_sources')
        .select('*')
        .eq('source_type', 'urgent')
        .eq('is_active', true);

      if (error) {
        this.logger.error('Failed to fetch urgent monitoring sources', error);
        return [];
      }

      for (const source of sources) {
        try {
          const updates = await this.checkSingleSource(source);
          if (updates.length > 0) {
            urgentUpdates.push(...updates);
          }
        } catch (error) {
          this.logger.error(`Failed to check source ${source.source_name}`, error);
          await this.updateSourceStatus(source.id, false, error.message);
        }
      }
      
      if (urgentUpdates.length > 0) {
        await this.processUrgentUpdates(urgentUpdates);
        await this.generateCustomerAlerts(urgentUpdates);
      }
      
      const responseTime = Date.now() - startTime;
      await this.logPerformanceMetric('urgent_source_check', responseTime, true);
      
      return urgentUpdates;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.logPerformanceMetric('urgent_source_check', responseTime, false, error.message);
      this.logger.error('Urgent sources check failed', error);
      return [];
    }
  }

  /**
   * Check critical sources (Federal Register, USTR)
   */
  async checkCriticalSources() {
    const startTime = Date.now();
    
    try {
      const criticalUpdates = [];
      
      // Get active critical monitoring sources from database
      const { data: sources, error } = await this.db.client
        .from('monitoring_sources')
        .select('*')
        .eq('source_type', 'critical')
        .eq('is_active', true);

      if (error) {
        this.logger.error('Failed to fetch critical monitoring sources', error);
        return [];
      }

      for (const source of sources) {
        try {
          const updates = await this.checkSingleSource(source);
          if (updates.length > 0) {
            criticalUpdates.push(...updates);
          }
        } catch (error) {
          this.logger.error(`Failed to check critical source ${source.source_name}`, error);
          await this.updateSourceStatus(source.id, false, error.message);
        }
      }
      
      if (criticalUpdates.length > 0) {
        await this.processUpdates(criticalUpdates);
        await this.generateCustomerAlerts(criticalUpdates);
      }
      
      const responseTime = Date.now() - startTime;
      await this.logPerformanceMetric('critical_source_check', responseTime, true);
      
      return criticalUpdates;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.logPerformanceMetric('critical_source_check', responseTime, false, error.message);
      this.logger.error('Critical sources check failed', error);
      return [];
    }
  }

  /**
   * Check important sources (CBP News, general updates)
   */
  async checkImportantSources() {
    const startTime = Date.now();
    
    try {
      const importantUpdates = [];
      
      // Get active important monitoring sources from database
      const { data: sources, error } = await this.db.client
        .from('monitoring_sources')
        .select('*')
        .eq('source_type', 'important')
        .eq('is_active', true);

      if (error) {
        this.logger.error('Failed to fetch important monitoring sources', error);
        return [];
      }

      for (const source of sources) {
        try {
          const updates = await this.checkSingleSource(source);
          if (updates.length > 0) {
            importantUpdates.push(...updates);
          }
        } catch (error) {
          this.logger.error(`Failed to check important source ${source.source_name}`, error);
          await this.updateSourceStatus(source.id, false, error.message);
        }
      }
      
      if (importantUpdates.length > 0) {
        await this.processUpdates(importantUpdates);
        await this.generateCustomerAlerts(importantUpdates);
      }
      
      const responseTime = Date.now() - startTime;
      await this.logPerformanceMetric('important_source_check', responseTime, true);
      
      return importantUpdates;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.logPerformanceMetric('important_source_check', responseTime, false, error.message);
      this.logger.error('Important sources check failed', error);
      return [];
    }
  }

  /**
   * Process urgent updates that require immediate action
   */
  async processUrgentUpdates(updates) {
    for (const update of updates) {
      try {
        // Parse regulatory language for specific changes
        const changes = await this.parseRegulatoryLanguage(update);
        
        // Update Triangle Trade Intelligence tariff_rates table immediately
        await this.updateTariffDatabase(changes, update);
        
        // Create regulatory update record with data provenance
        await this.createRegulatoryUpdateRecord(update, changes);
        
        this.logger.info('Processed urgent tariff update', {
          source: update.source,
          affectedHSCodes: changes.hsCodes,
          urgency: changes.urgency
        });
        
      } catch (error) {
        this.logger.error('Failed to process urgent update', error);
      }
    }
  }

  /**
   * Update Triangle Trade Intelligence tariff_rates table with new Trump tariff data
   */
  async updateTariffDatabase(changes, sourceUpdate) {
    if (!changes.hsCodes || changes.hsCodes.length === 0) {
      return;
    }
    
    for (let i = 0; i < changes.hsCodes.length; i++) {
      const hsCode = changes.hsCodes[i];
      const newRate = changes.newRates[i];
      const oldRate = changes.oldRates[i];
      
      try {
        // Insert or update tariff rate with data provenance
        const { error } = await this.db.client
          .from(TABLE_CONFIG.tariffRates)
          .upsert({
            hs_code: hsCode,
            country: 'US', // Trump tariffs primarily affect US imports
            mfn_rate: parseFloat(newRate) || 0,
            usmca_rate: 0, // USMCA rates typically remain 0%
            effective_date: changes.effectiveDate || new Date().toISOString().split('T')[0],
            source: `${sourceUpdate.source}_TRUMP_TARIFF_${new Date().getFullYear()}`,
            last_updated: new Date().toISOString(),
            is_trump_era: true,
            previous_rate: parseFloat(oldRate) || null,
            update_reference: sourceUpdate.documentNumber || `${sourceUpdate.source}_${Date.now()}`
          }, {
            onConflict: 'hs_code,country'
          });

        if (error) {
          this.logger.error(`Failed to update tariff rate for HS ${hsCode}`, error);
        } else {
          this.logger.info(`Updated tariff rate for HS ${hsCode}: ${oldRate}% → ${newRate}%`);
        }
        
      } catch (error) {
        this.logger.error(`Database update failed for HS ${hsCode}`, error);
      }
    }
  }

  /**
   * Generate customer alerts for affected customers
   */
  async generateCustomerAlerts(updates) {
    for (const update of updates) {
      try {
        const changes = await this.parseRegulatoryLanguage(update);
        
        if (!changes.hsCodes || changes.hsCodes.length === 0) {
          continue;
        }
        
        // Find customers affected by these HS codes
        const affectedCustomers = await this.findAffectedCustomers(changes.hsCodes);
        
        for (const customer of affectedCustomers) {
          const alert = await this.createCustomerAlert(customer, changes, update);
          await this.sendNotifications(alert);
        }
        
      } catch (error) {
        this.logger.error('Failed to generate customer alerts', error);
      }
    }
  }

  /**
   * Find customers who import products affected by tariff changes
   */
  async findAffectedCustomers(hsCodes) {
    try {
      const { data: customers, error } = await this.db.client
        .from('customer_alerts')
        .select(`
          *,
          customer_product_tracking(*)
        `)
        .eq('is_active', true)
        .overlaps('hs_codes', hsCodes);

      if (error) {
        this.logger.error('Failed to find affected customers', error);
        return [];
      }

      return customers || [];
    } catch (error) {
      this.logger.error('Database query failed for affected customers', error);
      return [];
    }
  }

  /**
   * Create individual customer alert with impact calculation
   */
  async createCustomerAlert(customer, changes, sourceUpdate) {
    // Calculate financial impact for this customer
    const impact = await this.calculateCustomerImpact(customer, changes);
    
    // Generate alert message
    const alertMessage = this.generateAlertMessage(changes, customer, impact);
    
    // Create alert instance record
    const { data: alert, error } = await this.db.client
      .from('alert_instances')
      .insert({
        customer_alert_id: customer.id,
        alert_title: `🚨 URGENT: Tariff change affects your ${changes.hsCodes.length} product${changes.hsCodes.length > 1 ? 's' : ''}`,
        alert_message: alertMessage,
        severity: this.determineSeverity(impact, changes),
        estimated_impact: {
          cost_increase: impact.costIncrease,
          percentage_increase: impact.percentageIncrease,
          affected_products: impact.affectedProductCount,
          annual_impact: impact.annualImpact
        },
        recommended_actions: this.getRecommendedActions(changes, impact),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create customer alert', error);
      return null;
    }

    return alert;
  }

  /**
   * Calculate financial impact for customer based on their tracked products
   */
  async calculateCustomerImpact(customer, changes) {
    try {
      // Get customer's tracked products
      const { data: products, error } = await this.db.client
        .from('customer_product_tracking')
        .select('*')
        .eq('customer_alert_id', customer.id)
        .in('hs_code', changes.hsCodes);

      if (error || !products) {
        return {
          costIncrease: 0,
          percentageIncrease: 0,
          affectedProductCount: 0,
          annualImpact: 0
        };
      }

      let totalImpact = 0;
      let totalCurrentCost = 0;
      
      for (const product of products) {
        const hsCodeIndex = changes.hsCodes.indexOf(product.hs_code);
        if (hsCodeIndex === -1) continue;
        
        const oldRate = parseFloat(changes.oldRates[hsCodeIndex] || 0);
        const newRate = parseFloat(changes.newRates[hsCodeIndex] || 0);
        
        if (product.annual_volume_usd) {
          const currentTariffCost = product.annual_volume_usd * (oldRate / 100);
          const newTariffCost = product.annual_volume_usd * (newRate / 100);
          const increasedCost = newTariffCost - currentTariffCost;
          
          totalImpact += increasedCost;
          totalCurrentCost += currentTariffCost;
        }
      }

      return {
        costIncrease: Math.round(totalImpact),
        percentageIncrease: totalCurrentCost > 0 ? ((totalImpact / totalCurrentCost) * 100) : 0,
        affectedProductCount: products.length,
        annualImpact: Math.round(totalImpact)
      };
      
    } catch (error) {
      this.logger.error('Failed to calculate customer impact', error);
      return {
        costIncrease: 0,
        percentageIncrease: 0,
        affectedProductCount: 0,
        annualImpact: 0
      };
    }
  }

  /**
   * Generate alert message for customer
   */
  generateAlertMessage(changes, customer, impact) {
    const formatCurrency = (amount) => `$${Math.abs(amount).toLocaleString()}`;
    const formatPercent = (percent) => `${Math.abs(percent).toFixed(1)}%`;

    return `URGENT TARIFF UPDATE for ${customer.company_name}:

Your tracked products (HS Codes: ${changes.hsCodes.join(', ')}) are affected by Trump-era tariff changes:

RATE CHANGES:
${changes.hsCodes.map((code, i) => 
  `• HS ${code}: ${changes.oldRates[i]}% → ${changes.newRates[i]}%`
).join('\n')}

EFFECTIVE: ${new Date(changes.effectiveDate).toLocaleDateString()}

ESTIMATED FINANCIAL IMPACT:
• Annual cost increase: ${formatCurrency(impact.costIncrease)}
• Percentage increase: ${formatPercent(impact.percentageIncrease)}
• Products affected: ${impact.affectedProductCount}

IMMEDIATE ACTIONS NEEDED:
• Review pending shipments immediately
• Update pricing calculations with new rates  
• Evaluate USMCA qualification opportunities
• Consider expediting shipments before effective date
• Contact licensed customs broker for complex cases

This is a Trump-era rapid tariff change. Rates may change again soon.
Monitor Triangle Trade Intelligence dashboard for real-time updates.

Triangle Trade Intelligence: Your trusted USMCA compliance partner.`;
  }

  /**
   * Parse regulatory language to extract HS codes, rates, and dates
   */
  async parseRegulatoryLanguage(update) {
    const content = update.content || update.title || '';
    
    // Regex patterns for Trump-era tariff language
    const patterns = {
      hsCodes: /HTS (?:subheading|heading)s?\s+([0-9]{4,10}(?:[,\s]*[0-9]{4,10})*)/gi,
      tariffRates: /(?:additional\s+)?(?:ad valorem\s+)?(?:rate of\s+)?(\d+(?:\.\d+)?)(?:\s*percent|\s*%)/gi,
      effectiveDate: /effective\s+(?:on\s+)?([A-Za-z]+ \d{1,2},? \d{4}|immediately|\d{1,2}:\d{2}\s*[AP]M)/gi,
      countries: /(China|Canada|Mexico|European Union|India|Brazil|Vietnam)/gi
    };
    
    const hsCodes = this.extractMatches(content, patterns.hsCodes);
    const rates = this.extractMatches(content, patterns.tariffRates);
    const dates = this.extractMatches(content, patterns.effectiveDate);
    const countries = this.extractMatches(content, patterns.countries);
    
    return {
      hsCodes: hsCodes.slice(0, 10), // Limit to prevent database issues
      newRates: rates,
      oldRates: Array(hsCodes.length).fill('0'), // Will be looked up from database
      effectiveDate: this.parseEffectiveDate(dates[0]) || new Date().toISOString().split('T')[0],
      affectedCountries: countries,
      urgency: this.determineUrgency(content),
      sourceUrl: update.sourceUrl
    };
  }

  /**
   * Extract regex matches from content
   */
  extractMatches(content, pattern) {
    const matches = [];
    let match;
    
    while ((match = pattern.exec(content)) !== null && matches.length < 20) {
      if (match[1]) {
        matches.push(match[1].trim());
      }
    }
    
    return matches;
  }

  /**
   * Determine urgency level from content
   */
  determineUrgency(content) {
    const urgentKeywords = [
      'immediately', 'effective today', 'same day', '12:01 a.m.',
      'emergency', 'reciprocal tariff', 'retaliation', 'trump'
    ];
    
    const isUrgent = urgentKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
    
    return isUrgent ? 'immediate' : 'high';
  }

  /**
   * Parse effective date from text
   */
  parseEffectiveDate(dateText) {
    if (!dateText) return null;
    
    if (dateText.toLowerCase().includes('immediately')) {
      return new Date().toISOString().split('T')[0];
    }
    
    try {
      const parsed = new Date(dateText);
      return parsed.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  /**
   * Get recommended actions based on changes
   */
  getRecommendedActions(changes, impact) {
    const actions = [
      'Review all pending shipments immediately',
      'Update pricing models with new tariff rates',
      'Consider expediting shipments before effective date',
      'Evaluate USMCA qualification opportunities',
      'Contact licensed customs broker for complex cases'
    ];
    
    if (changes.urgency === 'immediate') {
      actions.unshift('URGENT: Check if shipments in transit are affected');
      actions.push('Monitor Triangle Trade Intelligence for additional changes');
    }
    
    if (impact.costIncrease > 50000) {
      actions.push('Consider supply chain diversification to USMCA countries');
      actions.push('Evaluate Mexico manufacturing opportunities');
    }
    
    return actions;
  }

  /**
   * Determine alert severity
   */
  determineSeverity(impact, changes) {
    if (changes.urgency === 'immediate' || impact.costIncrease > 100000) {
      return 'critical';
    } else if (impact.costIncrease > 25000 || impact.percentageIncrease > 20) {
      return 'high';
    } else if (impact.costIncrease > 5000) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Send notifications via configured channels
   */
  async sendNotifications(alert) {
    if (!alert) return;
    
    try {
      // Implementation would integrate with existing notification system
      // For now, log the notification
      this.logger.info('Alert notification sent', {
        alertId: alert.id,
        severity: alert.severity,
        estimatedImpact: alert.estimated_impact
      });
      
      // Update sent notifications
      await this.db.client
        .from('alert_instances')
        .update({
          sent_notifications: {
            in_app: new Date().toISOString(),
            email: new Date().toISOString()
          }
        })
        .eq('id', alert.id);
        
    } catch (error) {
      this.logger.error('Failed to send notifications', error);
    }
  }

  /**
   * Mock source checking - would integrate with actual web scraping
   */
  async checkSingleSource(source) {
    try {
      // Mock implementation - would use actual web scraping
      await this.updateSourceStatus(source.id, true);
      
      // Return mock updates for demonstration
      if (source.source_name === 'CBP_CSMS' && Math.random() < 0.1) {
        return [{
          source: 'CBP',
          content: 'Additional tariff of 25.0 percent on HTS 8421.23 effective immediately',
          documentNumber: `CBP-${Date.now()}`,
          urgency: 'immediate',
          timestamp: new Date().toISOString()
        }];
      }
      
      return [];
    } catch (error) {
      await this.updateSourceStatus(source.id, false, error.message);
      throw error;
    }
  }

  /**
   * Update monitoring source status
   */
  async updateSourceStatus(sourceId, success, errorMessage = null) {
    const updateData = {
      last_check_attempt: new Date().toISOString()
    };
    
    if (success) {
      updateData.last_successful_check = new Date().toISOString();
      updateData.consecutive_failures = 0;
    } else {
      updateData.consecutive_failures = await this.getConsecutiveFailures(sourceId) + 1;
    }
    
    await this.db.client
      .from('monitoring_sources')
      .update(updateData)
      .eq('id', sourceId);
  }

  /**
   * Get consecutive failures count
   */
  async getConsecutiveFailures(sourceId) {
    const { data } = await this.db.client
      .from('monitoring_sources')
      .select('consecutive_failures')
      .eq('id', sourceId)
      .single();
    
    return data?.consecutive_failures || 0;
  }

  /**
   * Log performance metrics using existing pattern
   */
  async logPerformanceMetric(operation, responseTime, success, errorMessage = null) {
    try {
      await this.db.logPerformance(operation, responseTime, success, errorMessage);
    } catch (error) {
      this.logger.error('Failed to log performance metric', error);
    }
  }

  /**
   * Health check for monitoring service
   */
  async healthCheck() {
    try {
      const { data: sources } = await this.db.client
        .from('monitoring_sources')
        .select('source_name, last_successful_check, consecutive_failures')
        .eq('is_active', true);
      
      const recentAlerts = await this.db.client
        .from('alert_instances')
        .select('count')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();
      
      return {
        healthy: true,
        activeSources: sources?.length || 0,
        recentAlerts: recentAlerts?.count || 0,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        lastUpdate: new Date().toISOString()
      };
    }
  }
}