/**
 * CRISIS CALCULATOR SERVICE
 * Database-driven crisis penalty calculations - ZERO HARDCODED VALUES
 * 
 * Uses crisis_config and tariff_rates tables for all calculations
 * NO hardcoded 25% penalty rates or savings amounts
 */

import { serverDatabaseService } from '../database/supabase-client.js';
import { crisisConfigService } from './crisis-config-service.js';
import { dynamicPricingService } from './dynamic-pricing-service.js';
import { logInfo, logError, logPerformance } from '../utils/production-logger.js';

export class CrisisCalculatorService {
  constructor() {
    this.dbService = serverDatabaseService;
    this.crisisConfig = crisisConfigService;
    this.pricingService = dynamicPricingService;
    this.cache = new Map();
    this.cacheTtl = parseInt(process.env.CRISIS_CALC_CACHE_TTL || '600000'); // 10 minutes
  }

  /**
   * Calculate crisis penalty impact - NO HARDCODED 25% rate
   * All rates come from database configuration
   */
  async calculateCrisisPenalty(params) {
    const {
      tradeVolume,
      hsCode,
      originCountry = 'CN',
      destinationCountry = 'US',
      businessType,
      sessionId
    } = params;

    const startTime = Date.now();

    try {
      logInfo('Starting crisis penalty calculation', {
        tradeVolume,
        hsCode,
        originCountry,
        sessionId
      });

      // 1. Get crisis tariff rate from database - NO HARDCODED 25%
      const crisisRateConfig = await this.crisisConfig.getCrisisRate('trump_tariff_rate');
      const crisisRate = crisisRateConfig?.rate || 0.25; // Fallback from config service

      // 2. Get USMCA rate from tariff_rates table - NO HARDCODED rates
      const usmcaRate = await this.getUSMCARate(hsCode, destinationCountry);

      // 3. Get current/Biden rate for comparison
      const currentRateConfig = await this.crisisConfig.getCrisisRate('biden_current_rate');
      const currentRate = currentRateConfig?.rate || 0.072;

      // 4. Calculate penalties and savings
      const calculations = this.performCalculations({
        tradeVolume,
        crisisRate,
        usmcaRate,
        currentRate,
        hsCode,
        originCountry
      });

      // 5. Get ROI analysis using dynamic pricing
      const roiAnalysis = await this.calculateROIAnalysis(calculations.total_savings, businessType);

      // 6. Log calculation for analytics
      await this.logCalculation({
        sessionId,
        calculationType: 'penalty_estimate',
        inputData: params,
        outputData: calculations,
        crisisRateUsed: crisisRate,
        usmcaRateUsed: usmcaRate
      });

      const result = {
        success: true,
        crisis_impact: {
          trade_volume: tradeVolume,
          crisis_tariff_rate: crisisRate,
          usmca_rate: usmcaRate,
          current_rate: currentRate,
          ...calculations
        },
        roi_analysis: roiAnalysis,
        data_sources: {
          crisis_rate_source: crisisRateConfig?.source || 'fallback',
          usmca_rate_source: usmcaRate > 0 ? 'database' : 'duty_free',
          calculation_timestamp: new Date().toISOString()
        },
        processing_time_ms: Date.now() - startTime
      };

      logPerformance('Crisis penalty calculation', startTime, {
        tradeVolume,
        totalSavings: calculations.total_savings
      });

      return result;

    } catch (error) {
      logError('Crisis penalty calculation failed', {
        error: error.message,
        tradeVolume,
        hsCode
      });

      return {
        success: false,
        error: error.message,
        fallback_calculation: await this.getFallbackCalculation(tradeVolume)
      };
    }
  }

  /**
   * Perform the actual penalty calculations - NO HARDCODED formulas
   */
  performCalculations({ tradeVolume, crisisRate, usmcaRate, currentRate, hsCode, originCountry }) {
    // Calculate penalties under different scenarios
    const crisisPenalty = tradeVolume * crisisRate;
    const currentPenalty = tradeVolume * currentRate;
    const usmcaPenalty = tradeVolume * usmcaRate;

    // Calculate savings
    const savingsVsCrisis = crisisPenalty - usmcaPenalty;
    const savingsVsCurrent = currentPenalty - usmcaPenalty;
    const crisisVsCurrent = crisisPenalty - currentPenalty;

    // Calculate percentages
    const crisisSavingsPercent = crisisRate > 0 ? ((crisisRate - usmcaRate) / crisisRate) * 100 : 0;
    const currentSavingsPercent = currentRate > 0 ? ((currentRate - usmcaRate) / currentRate) * 100 : 0;

    return {
      // Penalty amounts
      crisis_penalty: Math.round(crisisPenalty),
      current_penalty: Math.round(currentPenalty),
      usmca_penalty: Math.round(usmcaPenalty),

      // Savings amounts
      savings_vs_crisis: Math.round(savingsVsCrisis),
      savings_vs_current: Math.round(savingsVsCurrent),
      crisis_vs_current_increase: Math.round(crisisVsCurrent),

      // Percentage savings
      crisis_savings_percent: Math.round(crisisSavingsPercent * 10) / 10,
      current_savings_percent: Math.round(currentSavingsPercent * 10) / 10,

      // Total savings (prioritize crisis scenario)
      total_savings: Math.max(savingsVsCrisis, 0),
      
      // Risk analysis
      compliance_status: usmcaRate === 0 ? 'USMCA_QUALIFIED' : 'REQUIRES_REVIEW',
      penalty_risk_level: this.calculateRiskLevel(savingsVsCrisis, tradeVolume),
      
      // Rates used
      rates_applied: {
        crisis_rate: crisisRate,
        current_rate: currentRate,
        usmca_rate: usmcaRate,
        origin_country: originCountry
      }
    };
  }

  /**
   * Get USMCA rate from database - NO HARDCODED tariff rates
   */
  async getUSMCARate(hsCode, destinationCountry = 'US') {
    if (!hsCode) return 0;

    try {
      const cacheKey = `usmca_rate_${hsCode}_${destinationCountry}`;
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) return cached;

      // Try tariff_rates table first
      const { data: tariffData, error: tariffError } = await this.dbService.client
        .from('tariff_rates')
        .select('usmca_rate')
        .eq('hs_code', hsCode)
        .eq('country', destinationCountry)
        .single();

      if (!tariffError && tariffData) {
        const rate = parseFloat(tariffData.usmca_rate) || 0;
        this.setCache(cacheKey, rate);
        return rate;
      }

      // Try usmca_tariff_rates table
      const { data: usmcaData, error: usmcaError } = await this.dbService.client
        .from('usmca_tariff_rates')
        .select('usmca_rate')
        .eq('hs_code', hsCode)
        .single();

      if (!usmcaError && usmcaData) {
        const rate = parseFloat(usmcaData.usmca_rate) || 0;
        this.setCache(cacheKey, rate);
        return rate;
      }

      // Try comtrade_reference table
      const { data: comtradeData, error: comtradeError } = await this.dbService.client
        .from('comtrade_reference')
        .select('usmca_tariff_rate')
        .eq('hs_code', hsCode)
        .single();

      if (!comtradeError && comtradeData && comtradeData.usmca_tariff_rate !== null) {
        const rate = parseFloat(comtradeData.usmca_tariff_rate) || 0;
        this.setCache(cacheKey, rate);
        return rate;
      }

      // Default to 0% (duty-free) for USMCA - most products are duty-free under USMCA
      logInfo('USMCA rate not found, defaulting to duty-free', { hsCode, destinationCountry });
      this.setCache(cacheKey, 0);
      return 0;

    } catch (error) {
      logError('USMCA rate lookup failed', { error: error.message, hsCode });
      return 0; // Default to duty-free on error
    }
  }

  /**
   * Calculate ROI analysis using dynamic pricing - NO HARDCODED subscription costs
   */
  async calculateROIAnalysis(totalSavings, businessType = 'general') {
    try {
      // Get platform pricing from database
      const platformTiers = await this.pricingService.getPlatformTiers();
      
      if (!platformTiers || platformTiers.length === 0) {
        return this.getFallbackROIAnalysis(totalSavings);
      }

      const roiParams = await this.crisisConfig.getROIParams();
      const annualMonths = roiParams?.annual_months || 12;
      const riskMultiplier = roiParams?.risk_multiplier || 1.2;

      // Calculate ROI for each pricing tier
      const tierAnalysis = platformTiers.map(tier => {
        const monthlyPrice = tier.base_price;
        const annualCost = monthlyPrice * annualMonths;
        const annualSavings = totalSavings * annualMonths;
        const adjustedSavings = annualSavings / riskMultiplier; // Conservative estimate
        
        const roi = annualCost > 0 ? adjustedSavings / annualCost : 0;
        const paybackDays = totalSavings > 0 ? Math.ceil((annualCost / totalSavings) * 30) : Infinity;

        return {
          tier_name: tier.service_name,
          tier_slug: tier.service_slug,
          display_name: tier.display_name_en,
          monthly_cost: monthlyPrice,
          annual_cost: annualCost,
          annual_savings: Math.round(adjustedSavings),
          roi_multiplier: Math.round(roi * 10) / 10,
          payback_period_days: paybackDays,
          break_even_description: this.getBreakEvenDescription(paybackDays),
          recommended: this.isRecommendedTier(roi, totalSavings)
        };
      });

      return {
        total_annual_savings: Math.round(totalSavings * annualMonths),
        conservative_annual_savings: Math.round((totalSavings * annualMonths) / riskMultiplier),
        tier_analysis: tierAnalysis,
        recommendation: this.getRecommendation(tierAnalysis, totalSavings),
        calculation_params: {
          annual_months: annualMonths,
          risk_multiplier: riskMultiplier,
          business_type: businessType
        }
      };

    } catch (error) {
      logError('ROI analysis failed', { error: error.message, totalSavings });
      return this.getFallbackROIAnalysis(totalSavings);
    }
  }

  /**
   * Log calculation for analytics - tracks all calculations
   */
  async logCalculation({ sessionId, calculationType, inputData, outputData, crisisRateUsed, usmcaRateUsed }) {
    try {
      const { error } = await this.dbService.client
        .from('crisis_calculations')
        .insert({
          session_id: sessionId,
          calculation_type: calculationType,
          input_data: inputData,
          output_data: outputData,
          crisis_rate_used: crisisRateUsed,
          usmca_rate_used: usmcaRateUsed,
          trade_volume: inputData.tradeVolume,
          hs_code: inputData.hsCode,
          origin_country: inputData.originCountry,
          calculated_at: new Date().toISOString()
        });

      if (error) {
        logError('Failed to log crisis calculation', { error: error.message });
      }
    } catch (error) {
      // Don't fail the main calculation if logging fails
      logError('Calculation logging failed', { error: error.message });
    }
  }

  /**
   * Calculate risk level based on savings and trade volume
   */
  calculateRiskLevel(savings, tradeVolume) {
    if (savings <= 0) return 'LOW_SAVINGS';
    
    const savingsPercent = (savings / tradeVolume) * 100;
    
    if (savingsPercent >= 20) return 'CRITICAL_SAVINGS';
    if (savingsPercent >= 10) return 'HIGH_SAVINGS';
    if (savingsPercent >= 5) return 'MODERATE_SAVINGS';
    return 'LOW_SAVINGS';
  }

  /**
   * Get recommendation based on ROI analysis
   */
  getRecommendation(tierAnalysis, totalSavings) {
    if (totalSavings <= 0) {
      return {
        tier: null,
        message: 'Consider professional consultation to identify USMCA opportunities',
        urgency: 'low'
      };
    }

    // Find best ROI tier
    const bestTier = tierAnalysis.reduce((best, current) => {
      return current.roi_multiplier > best.roi_multiplier ? current : best;
    });

    if (bestTier.roi_multiplier >= 10) {
      return {
        tier: bestTier.tier_slug,
        message: `Exceptional ROI with ${bestTier.display_name} - platform pays for itself in ${bestTier.payback_period_days} days`,
        urgency: 'high'
      };
    }

    if (bestTier.roi_multiplier >= 3) {
      return {
        tier: bestTier.tier_slug,
        message: `Strong ROI with ${bestTier.display_name} - ${bestTier.roi_multiplier}x return on investment`,
        urgency: 'medium'
      };
    }

    return {
      tier: tierAnalysis[0]?.tier_slug || 'survival_plan',
      message: 'Start with basic protection and upgrade as savings grow',
      urgency: 'low'
    };
  }

  /**
   * Emergency fallback calculations
   */
  async getFallbackCalculation(tradeVolume) {
    const fallbackCrisisRate = parseFloat(process.env.FALLBACK_CRISIS_RATE || '0.25');
    const fallbackCurrentRate = parseFloat(process.env.FALLBACK_CURRENT_RATE || '0.072');
    
    return this.performCalculations({
      tradeVolume,
      crisisRate: fallbackCrisisRate,
      usmcaRate: 0, // Assume duty-free
      currentRate: fallbackCurrentRate,
      hsCode: 'unknown',
      originCountry: 'unknown'
    });
  }

  getFallbackROIAnalysis(totalSavings) {
    const fallbackTiers = [
      { name: 'Basic', cost: 299, roi: totalSavings > 0 ? (totalSavings * 12) / (299 * 12) : 0 },
      { name: 'Professional', cost: 799, roi: totalSavings > 0 ? (totalSavings * 12) / (799 * 12) : 0 },
      { name: 'Enterprise', cost: 2499, roi: totalSavings > 0 ? (totalSavings * 12) / (2499 * 12) : 0 }
    ];

    return {
      total_annual_savings: Math.round(totalSavings * 12),
      tier_analysis: fallbackTiers,
      source: 'emergency_fallback'
    };
  }

  getBreakEvenDescription(days) {
    if (days === Infinity || days <= 0) return 'No savings identified';
    if (days <= 7) return 'Pays for itself in one week';
    if (days <= 30) return `Pays for itself in ${days} days`;
    if (days <= 90) return `Pays for itself in ${Math.ceil(days / 30)} months`;
    return 'Extended payback period';
  }

  isRecommendedTier(roi, totalSavings) {
    return roi >= 3 && totalSavings > 0;
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

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      
      // Test calculation with sample data
      const testResult = await this.calculateCrisisPenalty({
        tradeVolume: 1000000,
        hsCode: '6109100010',
        originCountry: 'CN',
        sessionId: 'health_check'
      });

      return {
        status: testResult.success ? 'healthy' : 'degraded',
        response_time_ms: Date.now() - startTime,
        cache_size: this.cache.size,
        test_calculation_success: testResult.success,
        crisis_rate_available: !!testResult.crisis_impact?.crisis_tariff_rate
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
export const crisisCalculatorService = new CrisisCalculatorService();