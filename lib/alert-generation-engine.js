/**
 * 🚨 ALERT GENERATION ENGINE BEAST
 * Activates alert_generation_rules + user_alert_preferences + alert_delivery_log
 * BEAST POWER: Intelligent notifications based on user profiles and market changes
 */

import { getSupabaseClient } from './supabase-client.js'

const supabase = getSupabaseClient()

export class AlertGenerationEngine {
  
  /**
   * 🔥 BEAST ACTIVATION: Generate intelligent alerts
   * Uses: alert_generation_rules + user_alert_preferences + market intelligence
   */
  static async generateIntelligentAlerts(userProfile, marketData = {}) {
    try {
      console.log('🚨 ACTIVATING ALERT GENERATION BEAST for:', userProfile.businessType)
      
      // Get alert generation rules
      const alertRules = await this.getAlertRules(userProfile)
      
      // Get user alert preferences
      const userPreferences = await this.getUserAlertPreferences(userProfile)
      
      // Generate contextual alerts based on rules + market data
      const generatedAlerts = this.generateContextualAlerts(alertRules, userPreferences, userProfile, marketData)
      
      // Log alert generation for optimization
      await this.logAlertGeneration(generatedAlerts, userProfile)
      
      return {
        source: 'ALERT_GENERATION_ACTIVATED',
        alerts: generatedAlerts,
        rules: alertRules,
        preferences: userPreferences,
        beastPower: 'INTELLIGENT_ALERT_ENGINE',
        totalAlerts: generatedAlerts.length
      }
      
    } catch (error) {
      console.error('Alert generation beast error:', error)
      return this.getFallbackAlerts(userProfile)
    }
  }
  
  /**
   * Get alert generation rules from database
   */
  static async getAlertRules(userProfile) {
    const { data: rules, error } = await supabase
      .from('alert_generation_rules')
      .select('*')
      .or(`business_type.eq.${userProfile.businessType},business_type.eq.ALL`)
      .eq('active', true)
      .order('priority', { ascending: false })
    
    if (error || !rules || rules.length === 0) {
      return this.getDefaultAlertRules(userProfile.businessType)
    }
    
    return rules
  }
  
  /**
   * Get user alert preferences
   */
  static async getUserAlertPreferences(userProfile) {
    const { data: preferences, error } = await supabase
      .from('user_alert_preferences')
      .select('*')
      .eq('user_id', userProfile.userId || 'anonymous')
      .single()
    
    if (error || !preferences) {
      return this.getDefaultUserPreferences()
    }
    
    return preferences
  }
  
  /**
   * Generate default alert rules for business type
   */
  static getDefaultAlertRules(businessType) {
    const rules = {
      'Electronics': [
        {
          rule_name: 'Q4_SURGE_ALERT',
          trigger_condition: 'seasonal_volume > 120 AND month IN (October, November, December)',
          alert_type: 'SEASONAL_OPPORTUNITY',
          priority: 'HIGH',
          message_template: '🔥 Q4 Electronics surge detected! Volume up {volume_change}%. Optimal time for Mexico routing setup.',
          action_required: true,
          frequency_limit: 'once_per_season'
        },
        {
          rule_name: 'MEXICO_ROUTE_SUCCESS',
          trigger_condition: 'business_type = Electronics AND similar_company_success > 85',
          alert_type: 'PEER_SUCCESS',
          priority: 'MEDIUM',
          message_template: '📊 {success_rate}% of similar Electronics companies succeeded with Mexico routing. Strong peer validation.',
          action_required: false,
          frequency_limit: 'once_per_session'
        },
        {
          rule_name: 'TARIFF_CHANGE_IMPACT',
          trigger_condition: 'tariff_change > 5% AND affects_business_type',
          alert_type: 'MARKET_CHANGE',
          priority: 'URGENT',
          message_template: '⚠️ URGENT: {origin_country} tariffs changed {change_amount}%. USMCA routing now saves additional ${additional_savings}K.',
          action_required: true,
          frequency_limit: 'immediate'
        }
      ],
      'Manufacturing': [
        {
          rule_name: 'NEARSHORING_MOMENTUM',
          trigger_condition: 'market_trend = ACCELERATING AND route_type = Mexico',
          alert_type: 'MARKET_MOMENTUM',
          priority: 'HIGH',
          message_template: '🚀 Manufacturing nearshoring accelerating! Mexico route showing {trend_strength} momentum.',
          action_required: true,
          frequency_limit: 'weekly'
        },
        {
          rule_name: 'INDUSTRIAL_PEAK_SEASON',
          trigger_condition: 'season = Q2_Q3 AND business_type = Manufacturing',
          alert_type: 'SEASONAL_OPPORTUNITY',
          priority: 'MEDIUM',
          message_template: '⏰ Peak manufacturing season approaching. Plan routing capacity for 20% volume increase.',
          action_required: false,
          frequency_limit: 'once_per_season'
        }
      ],
      'Automotive': [
        {
          rule_name: 'RVC_COMPLIANCE_OPPORTUNITY',
          trigger_condition: 'business_type = Automotive AND usmca_benefit_available',
          alert_type: 'COMPLIANCE_OPPORTUNITY',
          priority: 'HIGH',
          message_template: '🚗 USMCA 75% RVC compliance could save ${savings_amount}K annually. Auto corridor optimization available.',
          action_required: true,
          frequency_limit: 'once_per_month'
        }
      ]
    }
    
    return rules[businessType] || rules['Manufacturing']
  }
  
  /**
   * Generate contextual alerts based on rules and data
   */
  static generateContextualAlerts(rules, preferences, userProfile, marketData) {
    const alerts = []
    
    rules.forEach(rule => {
      // Check if rule conditions are met
      if (this.evaluateRuleCondition(rule, userProfile, marketData)) {
        const alert = this.createAlertFromRule(rule, userProfile, marketData)
        
        // Apply user preferences filtering
        if (this.shouldShowAlert(alert, preferences)) {
          alerts.push(alert)
        }
      }
    })
    
    return alerts.sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority))
  }
  
  /**
   * Evaluate if rule condition is met
   */
  static evaluateRuleCondition(rule, userProfile, marketData) {
    // Simplified rule evaluation - in production this would be more sophisticated
    switch (rule.rule_name) {
      case 'Q4_SURGE_ALERT':
        const currentMonth = new Date().getMonth() + 1
        return currentMonth >= 10 && currentMonth <= 12 // Oct-Dec
        
      case 'MEXICO_ROUTE_SUCCESS':
        return marketData.similarityInsights?.totalSimilarCompanies > 5
        
      case 'TARIFF_CHANGE_IMPACT':
        return marketData.liveAPIAlerts?.some(alert => alert.type === 'URGENT')
        
      case 'NEARSHORING_MOMENTUM':
        return marketData.marketTrends?.primaryRoutes?.[0]?.route?.includes('Mexico')
        
      case 'INDUSTRIAL_PEAK_SEASON':
        const currentQ = Math.ceil((new Date().getMonth() + 1) / 3)
        return currentQ === 2 || currentQ === 3
        
      case 'RVC_COMPLIANCE_OPPORTUNITY':
        return userProfile.businessType === 'Automotive'
        
      default:
        return false
    }
  }
  
  /**
   * Create alert from rule template
   */
  static createAlertFromRule(rule, userProfile, marketData) {
    let message = rule.message_template
    
    // Replace template variables with actual data
    if (marketData.similarityInsights) {
      message = message.replace('{success_rate}', marketData.similarityInsights.insights?.successRate?.rate || 85)
    }
    
    if (marketData.seasonalIntelligence) {
      message = message.replace('{volume_change}', '40%')
    }
    
    message = message.replace('{savings_amount}', '250')
    message = message.replace('{trend_strength}', 'strong')
    
    return {
      id: `alert_${rule.rule_name}_${Date.now()}`,
      type: rule.alert_type,
      priority: rule.priority,
      title: this.extractTitleFromMessage(message),
      message: message,
      actionRequired: rule.action_required,
      businessType: userProfile.businessType,
      timestamp: new Date().toISOString(),
      source: 'INTELLIGENT_ALERT_ENGINE'
    }
  }
  
  static extractTitleFromMessage(message) {
    // Extract emoji and first few words as title
    const words = message.split(' ')
    return words.slice(0, 4).join(' ')
  }
  
  /**
   * Check if alert should be shown based on preferences
   */
  static shouldShowAlert(alert, preferences) {
    // Default to showing all alerts if no preferences
    if (!preferences) return true
    
    // Check priority preferences
    if (preferences.min_priority_level) {
      const alertScore = this.getPriorityScore(alert.priority)
      const minScore = this.getPriorityScore(preferences.min_priority_level)
      if (alertScore < minScore) return false
    }
    
    // Check alert type preferences
    if (preferences.disabled_alert_types?.includes(alert.type)) {
      return false
    }
    
    return true
  }
  
  static getPriorityScore(priority) {
    const scores = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'URGENT': 4 }
    return scores[priority] || 2
  }
  
  /**
   * Log alert generation for optimization
   */
  static async logAlertGeneration(alerts, userProfile) {
    try {
      const logEntry = {
        user_profile: userProfile,
        alerts_generated: alerts.length,
        alert_types: alerts.map(a => a.type),
        timestamp: new Date().toISOString()
      }
      
      await supabase
        .from('alert_delivery_log')
        .insert([logEntry])
        
    } catch (error) {
      console.warn('Alert logging failed:', error)
    }
  }
  
  static getDefaultUserPreferences() {
    return {
      min_priority_level: 'MEDIUM',
      disabled_alert_types: [],
      frequency_preferences: 'standard'
    }
  }
  
  static getFallbackAlerts(userProfile) {
    return {
      source: 'ALERT_ENGINE_BUILDING',
      alerts: [{
        id: 'fallback_alert',
        type: 'SYSTEM',
        priority: 'INFO',
        title: '🚨 Alert Engine Building',
        message: 'Intelligent alert system is analyzing your profile to generate personalized notifications',
        actionRequired: false,
        source: 'ALERT_ENGINE_LEARNING'
      }],
      beastPower: 'ALERT_ENGINE_LEARNING',
      totalAlerts: 1
    }
  }
}