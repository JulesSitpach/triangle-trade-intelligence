/**
 * SUBSCRIPTION TIER LIMITS - SINGLE SOURCE OF TRUTH
 *
 * This file defines ALL subscription limits across the entire platform.
 * ALL endpoints and components MUST import from this file.
 *
 * DO NOT duplicate these limits anywhere else in the codebase.
 * If limits change, update ONLY this file.
 *
 * Last Updated: November 5, 2025
 * Verified Against: pages/pricing.js (pricing page promises)
 */

/**
 * Monthly Analysis Limits by Tier
 *
 * Used by:
 * - pages/api/ai-usmca-complete-analysis.js (workflow analysis)
 * - pages/api/agents/classification.js (HS code searches)
 * - pages/api/check-usage-limit.js (usage checking)
 * - pages/api/dashboard-data.js (dashboard display)
 * - lib/middleware/subscription-guard.js (API enforcement)
 */
export const ANALYSIS_LIMITS = {
  'Trial': 1,           // Free trial: 1 workflow analysis
  'Starter': 15,        // $99/month: 15 workflow analyses
  'Professional': 100,  // $299/month: 100 workflow analyses
  'Premium': 500,       // $599/month: 500 workflow analyses
  'Enterprise': 9999    // Custom pricing: unlimited (not available to new users)
};

/**
 * Executive Summary Limits by Tier
 *
 * Used by:
 * - pages/api/executive-trade-alert.js (summary generation)
 * - pages/api/dashboard-data.js (dashboard display)
 */
export const EXECUTIVE_SUMMARY_LIMITS = {
  'Trial': 1,           // 1 executive summary (matches workflows)
  'Starter': 15,        // 15 executive summaries per month
  'Professional': 100,  // 100 executive summaries per month
  'Premium': 500,       // 500 executive summaries per month
  'Enterprise': 9999    // Unlimited
};

/**
 * Portfolio Briefing Limits by Tier
 *
 * Used by:
 * - pages/api/generate-portfolio-briefing.js (briefing generation)
 * - pages/api/dashboard-data.js (dashboard display)
 */
export const PORTFOLIO_BRIEFING_LIMITS = {
  'Trial': 0,           // Not available for trial users
  'Starter': 30,        // 30 portfolio briefings per month
  'Professional': 150,  // 150 portfolio briefings per month
  'Premium': 750,       // 750 portfolio briefings per month
  'Enterprise': 9999    // Unlimited
};

/**
 * Component Limits by Tier (per workflow)
 *
 * Used by:
 * - components/workflow/ComponentOriginsStepEnhanced.js (component adding)
 * - pages/api/check-usage-limit.js (usage checking)
 */
export const COMPONENT_LIMITS = {
  'Trial': 3,           // 3 components per workflow
  'Free': 3,            // Legacy tier (same as Trial)
  'Starter': 10,        // 10 components per workflow
  'Professional': 15,   // 15 components per workflow
  'Premium': 20,        // 20 components per workflow
  'Enterprise': 50      // 50 components per workflow
};

/**
 * Complete Tier Configuration
 * Combines all limits for easy reference
 */
export const TIER_LIMITS = {
  'Trial': {
    display_name: 'Free Trial',
    analyses_per_month: ANALYSIS_LIMITS['Trial'],
    executive_summaries_per_month: EXECUTIVE_SUMMARY_LIMITS['Trial'],
    portfolio_briefings_per_month: PORTFOLIO_BRIEFING_LIMITS['Trial'],
    max_components: COMPONENT_LIMITS['Trial'],
    price_monthly: 0,
  },
  'Starter': {
    display_name: 'Starter',
    analyses_per_month: ANALYSIS_LIMITS['Starter'],
    executive_summaries_per_month: EXECUTIVE_SUMMARY_LIMITS['Starter'],
    portfolio_briefings_per_month: PORTFOLIO_BRIEFING_LIMITS['Starter'],
    max_components: COMPONENT_LIMITS['Starter'],
    price_monthly: 99,
  },
  'Professional': {
    display_name: 'Professional',
    analyses_per_month: ANALYSIS_LIMITS['Professional'],
    executive_summaries_per_month: EXECUTIVE_SUMMARY_LIMITS['Professional'],
    portfolio_briefings_per_month: PORTFOLIO_BRIEFING_LIMITS['Professional'],
    max_components: COMPONENT_LIMITS['Professional'],
    price_monthly: 299,
  },
  'Premium': {
    display_name: 'Premium',
    analyses_per_month: ANALYSIS_LIMITS['Premium'],
    executive_summaries_per_month: EXECUTIVE_SUMMARY_LIMITS['Premium'],
    portfolio_briefings_per_month: PORTFOLIO_BRIEFING_LIMITS['Premium'],
    max_components: COMPONENT_LIMITS['Premium'],
    price_monthly: 599,
  },
  'Enterprise': {
    display_name: 'Enterprise',
    analyses_per_month: ANALYSIS_LIMITS['Enterprise'],
    executive_summaries_per_month: EXECUTIVE_SUMMARY_LIMITS['Enterprise'],
    portfolio_briefings_per_month: PORTFOLIO_BRIEFING_LIMITS['Enterprise'],
    max_components: COMPONENT_LIMITS['Enterprise'],
    price_monthly: null, // Custom pricing
  },
};

/**
 * Get analysis limit for a specific tier
 * @param {string} tier - Subscription tier name
 * @returns {number} Analysis limit
 */
export function getAnalysisLimit(tier) {
  return ANALYSIS_LIMITS[tier] || ANALYSIS_LIMITS['Trial'];
}

/**
 * Get executive summary limit for a specific tier
 * @param {string} tier - Subscription tier name
 * @returns {number} Executive summary limit
 */
export function getExecutiveSummaryLimit(tier) {
  return EXECUTIVE_SUMMARY_LIMITS[tier] || EXECUTIVE_SUMMARY_LIMITS['Trial'];
}

/**
 * Get portfolio briefing limit for a specific tier
 * @param {string} tier - Subscription tier name
 * @returns {number} Portfolio briefing limit
 */
export function getPortfolioBriefingLimit(tier) {
  return PORTFOLIO_BRIEFING_LIMITS[tier] || PORTFOLIO_BRIEFING_LIMITS['Trial'];
}

/**
 * Get component limit for a specific tier
 * @param {string} tier - Subscription tier name
 * @returns {number} Component limit
 */
export function getComponentLimit(tier) {
  return COMPONENT_LIMITS[tier] || COMPONENT_LIMITS['Trial'];
}

/**
 * Get all limits for a specific tier
 * @param {string} tier - Subscription tier name
 * @returns {object} Complete tier configuration
 */
export function getTierLimits(tier) {
  return TIER_LIMITS[tier] || TIER_LIMITS['Trial'];
}
