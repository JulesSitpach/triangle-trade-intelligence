/**
 * TARIFF SAVINGS VALIDATION UTILITIES
 * Prevents unrealistic tariff savings claims and provides business logic validation
 */

import { SYSTEM_CONFIG } from '../../config/system-config.js';

/**
 * Validate and cap tariff savings percentage to realistic levels
 * @param {number} rawSavingsPercent - Uncapped savings percentage
 * @param {string} context - Context for logging (e.g., 'usmca-qualification', 'ai-classification')
 * @returns {object} - Validated savings with warnings/flags
 */
export function validateTariffSavings(rawSavingsPercent, context = 'unknown') {
  const config = SYSTEM_CONFIG.tariff;
  const cappedSavings = Math.min(config.maxSavingsPercentage, Math.max(0, rawSavingsPercent));

  const result = {
    savings_percentage: cappedSavings,
    raw_calculation: rawSavingsPercent,
    was_capped: rawSavingsPercent > config.maxSavingsPercentage,
    requires_validation: cappedSavings > config.requireValidationAbove,
    confidence_level: getSavingsConfidenceLevel(cappedSavings, config),
    warnings: []
  };

  // Add business logic warnings
  if (rawSavingsPercent > config.maxSavingsPercentage) {
    result.warnings.push(`Savings claim of ${rawSavingsPercent.toFixed(1)}% capped at ${config.maxSavingsPercentage}% - unrealistic claim`);
  }

  if (cappedSavings > config.extremeSavingsThreshold) {
    result.warnings.push(`High savings claim (${cappedSavings.toFixed(1)}%) - manual validation recommended`);
  }

  if (cappedSavings > config.highSavingsThreshold) {
    result.warnings.push('Above average savings - verify tariff data accuracy');
  }

  // Log extreme cases for monitoring
  if (result.was_capped) {
    console.warn(`🚨 Capped unrealistic savings claim in ${context}: ${rawSavingsPercent.toFixed(1)}% → ${cappedSavings.toFixed(1)}%`);
  }

  return result;
}

/**
 * Determine confidence level for savings calculation
 */
function getSavingsConfidenceLevel(savingsPercent, config) {
  if (savingsPercent <= 15) return 'high';
  if (savingsPercent <= config.highSavingsThreshold) return 'medium';
  if (savingsPercent <= config.extremeSavingsThreshold) return 'low';
  return 'very_low';
}

/**
 * Validate Mexico processing cost assumptions
 */
export function validateMexicoProcessingCost(tradeValue, context = 'unknown') {
  const config = SYSTEM_CONFIG.tariff;
  const processingCost = tradeValue * (config.mexicoProcessingCostPercent / 100);

  return {
    processing_cost: processingCost,
    percentage_used: config.mexicoProcessingCostPercent,
    trade_value: tradeValue,
    validation_needed: tradeValue > 1000000, // Flag large transactions
    disclaimer: 'Processing costs estimated - actual costs may vary by logistics provider'
  };
}

/**
 * Create realistic tariff savings with proper business logic
 */
export function calculateRealisticSavings(mfnRate, usmcaRate, context = 'unknown') {
  const rawSavings = Math.max(0, mfnRate - usmcaRate);
  const validation = validateTariffSavings(rawSavings, context);

  return {
    mfn_rate: mfnRate,
    usmca_rate: usmcaRate,
    ...validation
  };
}