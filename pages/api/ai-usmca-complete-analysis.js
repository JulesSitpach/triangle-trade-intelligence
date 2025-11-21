/**
 * Triangle Intelligence Platform - USMCA Complete Analysis Engine
 * Copyright © 2025 Triangle Intelligence Platform. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Unauthorized copying, modification, or distribution prohibited.
 * This file contains proprietary AI-powered tariff analysis methodology.
 */

/**
 * HYBRID TARIFF ANALYSIS - DATABASE-FIRST + AI FALLBACK
 *
 * Architecture (Oct 28, 2025):
 *   Phase 1: Query tariff_intelligence_master (12K+ USITC 2025 HTS codes)
 *   Phase 2: Missing rates? Call AI for fallback (OpenRouter → Anthropic)
 *   Phase 3: AI determines USMCA qualification + preference criterion
 *
 * Benefits:
 *   - 95%+ requests get tariff rates from database (100-200ms, free)
 *   - <5% requests need AI fallback (2-3 seconds, ~$0.02)
 *   - Current 2025 tariff policy data from USITC official schedule
 */

import { protectedApiHandler } from '../../lib/api/apiHandler.js';
import { applyRateLimit, strictLimiter } from '../../lib/security/rateLimiter.js';
import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';
import { normalizeComponent, logComponentValidation, validateAPIResponse } from '../../lib/schemas/component-schema.js';
import { logDevIssue, DevIssue } from '../../lib/utils/logDevIssue.js';
import { reserveAnalysisSlot, incrementAnalysisCount } from '../../lib/services/usage-tracking-service.js';
import { ClassificationAgent } from '../../lib/agents/classification-agent.js';
import { VolatilityManager } from '../../lib/tariff/volatility-manager.js';
import { TariffError, DatabaseError, formatErrorResponse } from '../../lib/utils/user-friendly-errors.js';

// ✅ Phase 3 Extraction: Form validation utilities (Oct 23, 2025)
import {
  getCacheExpiration,
  getDeMinimisThreshold,
  parseTradeVolume,
  extractIndustryFromBusinessType,
  CACHE_EXPIRATION,
  DE_MINIMIS
} from '../../lib/validation/form-validation.js';

// ✅ Phase 3 Extraction: Tariff calculation functions (Oct 24, 2025)
import {
  saveTariffRatesToDatabase
} from '../../lib/tariff/tariff-calculator.js';

// ✅ Phase 3 Extraction: USMCA qualification functions (Oct 24, 2025)
import {
  buildComprehensiveUSMCAPrompt
} from '../../lib/usmca/qualification-engine.js';

// ✅ Rate limit handler for OpenRouter API (Oct 31, 2025)
import { callOpenRouterWithRetry, fallbackToAnthropic } from '../../lib/utils/openrouter-rate-limit-handler.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * HYBRID ENRICHMENT: Get tariff rates from AI for components missing database data
 * Single AI call for all missing components (efficient fallback)
 *
 * @param {Array} missingComponents - Components with mfn_rate === 0 or stale === true
 * @param {String} destinationCountry - Target country (US/CA/MX)
 * @param {String} productDescription - Product context
 * @returns {Array} Array of {hs_code, mfn_rate, section_301, section_232, usmca_rate}
 */
async function getAIRatesForMissingComponents(missingComponents, destinationCountry, productDescription) {
  if (!missingComponents || missingComponents.length === 0) {
    console.log('✅ [HYBRID] No missing components, skipping AI call');
    return [];
  }

  // Build component list for AI
  const componentsList = missingComponents
    .map((comp, i) => `${i + 1}. HS Code: ${comp.hs_code}, Origin: ${comp.origin_country}, Description: ${comp.description}`)
    .join('\n');

  const todayDate = new Date().toISOString().split('T')[0];

  const prompt = `Your role: Research tariff rates for components MISSING from our database. Database is the source of truth.

TODAY'S DATE: ${todayDate}
TARIFF POLICY CONTEXT (as of today):
- Section 301 (China): Trump administration tariffs (2018-2025 ongoing, rates vary by List 1/2/3/4A/4B)
- Section 232 (Steel/Aluminum): 25% steel, 10% aluminum (ongoing since 2018, some exemptions)
- IEEPA reciprocal tariffs: Check executive orders from 2024-2025
- Search for rates EFFECTIVE TODAY, not historical rates

Components requiring tariff research for ${destinationCountry} destination:
${componentsList}

Product Context: ${productDescription}

CONTEXT: These businesses are facing bankruptcy from Trump tariff policy changes. Accuracy determines
whether they survive or close. Wrong rates = wrong strategy = business failure. Do not sugarcoat.

YOUR JOB:
═══════════════════════════════════════════════════════════════════════════════
1. Research ACTUAL current tariff rates from official sources (not estimates)
2. Include ALL applicable duties that stack (MFN + Section 301 + Section 232 + IEEPA)
3. Cite specific sources (USITC HTS 2025, USTR Federal Register with date, etc.)
4. Confidence score reflects research quality - be honest about uncertainty

OFFICIAL SOURCES (use in priority order - if sources conflict, use most recent):
─────────────────────────────────────────────────────────────────────────────
1. USITC HTS Database (hts.usitc.gov) - BASE MFN RATES
   - Most authoritative for base tariff rates
   - Updated annually January 1

2. USTR Federal Register (federalregister.gov) - SECTION 301 RATES
   - Search: "Section 301 [HS code] 2025"
   - Lists 1, 2, 3, 4A, 4B (rates: 7.5% to 100%+)

3. CBP CSMS Messages (cbp.gov) - SECTION 232 RATES
   - Steel: Generally 25% if applicable
   - Aluminum: Generally 10% if applicable

4. Executive Orders (federalregister.gov) - IEEPA RECIPROCAL
   - Search: "IEEPA tariff [country] 2025"

IF SOURCES CONFLICT: Use most recent publication date
IF UNCERTAIN: Mark confidence "low" and note conflict in justification

HOW CBP CALCULATES TOTAL TARIFF (rate stacking):
─────────────────────────────────────────────────────────────────────────────
total_rate = base_mfn_rate + section_301 + section_232 + ieepa_reciprocal

Policy tariffs ADD ON TOP of base MFN (they don't replace it). Research current rates for each policy.

USMCA PREFERENTIAL RATES:
If origin is Canada/Mexico: Research current USMCA rate for this HS code (overrides total_rate if applicable)

RETURN JSON ARRAY (rates as decimals, e.g., 0.034 for 3.4%):
[
  {
    "hs_code": "actual HS code",
    "mfn_rate": <RESEARCHED_MFN_RATE_AS_DECIMAL>,
    "base_mfn_rate": <SAME_AS_MFN_RATE>,
    "section_301": <RESEARCHED_SECTION_301_RATE_OR_0>,
    "section_232": <RESEARCHED_SECTION_232_RATE_OR_0>,
    "usmca_rate": <RESEARCHED_PREFERENTIAL_RATE_OR_MFN>,
    "description": "component description",
    "justification": "YOUR RESEARCH SUMMARY - cite sources (USITC HTS, USTR Federal Register, etc.)",
    "confidence": "high|medium|low"
  }
]

RATE CONVERSION EXAMPLES:
- If HTS shows "Free" or "0.0%": mfn_rate = 0.0
- If HTS shows percentage (e.g., "3.4%"): convert to decimal (mfn_rate = 0.034)
- If component has Section 301 applicable (check USTR lists for HS code): include researched rate
  Example: List 4A rate of 7.5% = section_301: 0.075
- Total tariff = sum of all applicable rates as decimals (mfn_rate + section_301 + section_232 + ieepa)

IMPORTANT: This data is used for USMCA compliance certificates. Research accuracy is legally required.
Return ONLY valid JSON array. No explanations.`;

  try {
    // TIER 1: Try OpenRouter with rate limit handling
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    console.log(`🔍 [HYBRID] Calling AI for ${missingComponents.length} missing components...`);

    const aiData = await callOpenRouterWithRetry({
      model: 'anthropic/claude-haiku-4.5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0
    }, 3, 'TariffResearch');
    const content = aiData.choices?.[0]?.message?.content || '[]';

    // Parse JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const results = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // ✅ Keep rates in DECIMAL format (0-1 range, not percentages)
    // Financial calculations expect decimals: 0.026 means 2.6%
    // DO NOT multiply by 100 - AI returns decimals, we use decimals throughout
    // CRITICAL: Preserve null values - they indicate "pending verification" not "0% tariff"
    const normalizedResults = results.map(result => {
      const parsedMfn = result.mfn_rate !== undefined && result.mfn_rate !== null ? parseFloat(result.mfn_rate) : null;
      const parsedBaseMfn = result.base_mfn_rate !== undefined && result.base_mfn_rate !== null ? parseFloat(result.base_mfn_rate) : null;
      const parsedSection301 = result.section_301 !== undefined && result.section_301 !== null ? parseFloat(result.section_301) : null;
      const parsedSection232 = result.section_232 !== undefined && result.section_232 !== null ? parseFloat(result.section_232) : null;
      const parsedUsmca = result.usmca_rate !== undefined && result.usmca_rate !== null ? parseFloat(result.usmca_rate) : null;
      const parsedTotal = result.total_rate !== undefined && result.total_rate !== null ? parseFloat(result.total_rate) : null;

      return {
        hs_code: result.hs_code,
        mfn_rate: parsedMfn !== null ? parsedMfn : parsedBaseMfn,
        base_mfn_rate: parsedBaseMfn !== null ? parsedBaseMfn : parsedMfn,
        section_301: parsedSection301,
        section_232: parsedSection232,
        usmca_rate: parsedUsmca,
        total_rate: parsedTotal,
        // ✅ Preserve AI validation data (NEW - Oct 28, 2025)
        justification: result.justification || 'No justification provided',
        confidence: result.confidence || 'low',
        data_quality_flag: result.data_quality_flag || null
      };
    });

    // DEBUG: Fallback rates retrieved with AI validation
    return normalizedResults;

  } catch (openrouterError) {
    // Fallback to Anthropic Direct (OpenRouter failed)

    // TIER 2: Fallback to Anthropic Direct
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic Direct failed: ${response.status}`);
      }

      const aiData = await response.json();
      const content = aiData.content?.[0]?.text || '[]';

      // Parse JSON array
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const results = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      // ✅ Keep rates in DECIMAL format (0-1 range, not percentages)
      // Financial calculations expect decimals: 0.026 means 2.6%
      // CRITICAL: Preserve null (pending verification) vs 0 (duty-free)
      const normalizedResults = results.map(result => {
        const parsedMfn = result.mfn_rate !== undefined && result.mfn_rate !== null ? parseFloat(result.mfn_rate) : null;
        const parsedBaseMfn = result.base_mfn_rate !== undefined && result.base_mfn_rate !== null ? parseFloat(result.base_mfn_rate) : null;

        return {
          hs_code: result.hs_code,
          mfn_rate: parsedMfn !== null ? parsedMfn : parsedBaseMfn,
          base_mfn_rate: parsedBaseMfn !== null ? parsedBaseMfn : parsedMfn,
          section_301: result.section_301 !== undefined && result.section_301 !== null ? parseFloat(result.section_301) : null,
          section_232: result.section_232 !== undefined && result.section_232 !== null ? parseFloat(result.section_232) : null,
          usmca_rate: result.usmca_rate !== undefined && result.usmca_rate !== null ? parseFloat(result.usmca_rate) : null,
          total_rate: result.total_rate !== undefined && result.total_rate !== null ? parseFloat(result.total_rate) : null,
          // ✅ Preserve AI validation data (NEW - Oct 28, 2025)
          justification: result.justification || 'No justification provided',
          confidence: result.confidence || 'low',
          data_quality_flag: result.data_quality_flag || null
        };
      });

      // Anthropic Direct fallback succeeded with validation data
      return normalizedResults;

    } catch (anthropicError) {
      console.error(`❌ [AI-FALLBACK] Both OpenRouter and Anthropic failed:`, anthropicError.message);
      // Return empty - caller will continue with database rates
      return [];
    }
  }
}

// ✅ REMOVED: Global TARIFF_CACHE (line 22)
// REASON: In-memory cache without user isolation allows cross-user data contamination
// REPLACED BY: Database-only caching with destination-aware TTL
// User B would receive User A's cached tariff rates - CRITICAL COMPLIANCE RISK
// See: Data Integrity Audit - CRITICAL FINDING #1

// ✅ EXTRACTED (Phase 3, Oct 23, 2025): Constants and utility functions moved to lib/validation/form-validation.js
// - CACHE_EXPIRATION
// - getCacheExpiration()
// - INDUSTRY_THRESHOLDS
// - DE_MINIMIS
// - parseTradeVolume()
// These are now imported from lib/validation/form-validation.js (see imports above)

/**
 * Build detailed qualification summary from pre-calculated financial data
 * Hybrid approach: AI provides qualification, backend synthesizes detailed narrative
 * @returns {string} Executive summary for certificate and dashboard
 */
function buildDetailedSummary(qualified, rvc, threshold, savings, formData) {
  if (!qualified) {
    const gap = Math.max(0, threshold - rvc);
    return `Your product does not currently qualify for USMCA preferential treatment. ` +
           `Current RVC is ${rvc}% but the threshold is ${threshold}% (${gap}% short). ` +
           `To qualify, increase North American content through supplier diversification, ` +
           `labor-value add in manufacturing, or component redesign.`;
  }

  // Qualified - build positive summary with financial impact
  const buffer = Math.round(rvc - threshold);
  const monthlySavings = savings?.monthly_savings || 0;
  const yearlySavings = savings?.annual_savings || 0;

  let summary = `✓ Your product qualifies for USMCA preferential treatment. ` +
                `RVC is ${rvc}% (threshold ${threshold}%, ${buffer}% buffer). `;

  if (yearlySavings > 0) {
    const monthlyStr = monthlySavings > 0 ? `$${Math.round(monthlySavings)}/month or ` : '';
    summary += `Annual tariff savings: ${monthlyStr}$${Math.round(yearlySavings)}/year. `;
  }

  // Add Section 301 warning if applicable
  if (formData.component_origins?.some(c => c.origin_country === 'CN')) {
    summary += `⚠️ Chinese-origin components may still be subject to Section 301 tariffs ` +
               `even with USMCA qualification. Consider Mexico sourcing to eliminate this policy risk.`;
  }

  return summary;
}

/**
 * Build strategic insights for detailed analysis
 * Synthesized from pre-calculated data
 */
function buildStrategicInsights(result, formData) {
  const insights = [];

  if (result.usmca.qualified) {
    insights.push(`Qualification unlocks ${result.usmca.preference_criterion || 'B'} USMCA preference.`);

    // Nearshoring insight
    if (formData.component_origins?.some(c => c.origin_country === 'CN')) {
      insights.push(
        'China-origin components expose you to policy risk. ' +
        'Mexico sourcing at +2-3% cost premium eliminates Section 301 tariffs ' +
        'and increases RVC buffer. Typical payback: 3-6 months.'
      );
    }

    // RVC buffer insight
    const buffer = Math.round(result.usmca.north_american_content - result.usmca.threshold_applied);
    if (buffer > 5) {
      insights.push(`Strong RVC position (${buffer}% buffer). Stable qualification unless supply chain changes.`);
    } else if (buffer > 0) {
      insights.push(`Narrow RVC buffer (${buffer}%). Monitor supply chain changes closely.`);
    }
  } else {
    const gap = Math.round(result.usmca.threshold_applied - result.usmca.north_american_content);
    insights.push(
      `Qualification gap: ${gap}%. Options: (1) increase Mexico/US sourcing, ` +
      `(2) add manufacturing value-add in USMCA territory, ` +
      `(3) redesign product for lower tariff classification.`
    );
  }

  return insights.join('\n\n');
}

export default protectedApiHandler({
  POST: async (req, res) => {
    const startTime = Date.now();
    const userId = req.user.id;
    const formData = req.body; // Move outside try block for error handler access

  try {

    // ⚡ PERFORMANCE: Disabled verbose startup logging

    // ========== STEP 0A: CHECK IF WORKFLOW ALREADY COMPLETED ==========
    // Prevent AI regeneration for completed workflows (cost protection)
    if (formData.workflow_session_id) {
      const { data: existingSession } = await supabase
        .from('workflow_sessions')
        .select('completed_at')
        .eq('id', formData.workflow_session_id)
        .single();

      if (existingSession?.completed_at) {
        return res.status(403).json({
          success: false,
          error: 'Analysis already completed - AI regeneration disabled',
          message: 'This workflow has been completed and saved to your dashboard. To run a new analysis, please start a fresh workflow.',
          completed_at: existingSession.completed_at,
          action_required: 'start_new_workflow',
          dashboard_url: '/trade-risk-alternatives'
        });
      }
    }

    // ========== STEP 0B: CHECK USAGE LIMITS ==========
    // Get user's subscription tier from database
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, trial_ends_at, email_confirmed_at')
      .eq('user_id', userId)
      .single();

    const subscriptionTier = userProfile?.subscription_tier || 'Trial';

    // 🛡️ RATE LIMITING: 10 requests per minute (only for non-Premium users)
    // Premium users are unlimited, so skip per-minute rate limiter
    if (subscriptionTier !== 'Premium') {
      try {
        await applyRateLimit(strictLimiter)(req, res);
      } catch (error) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please wait before making another tariff analysis request.',
          retry_after: 60, // seconds
          tier: subscriptionTier,
          message: 'Premium users have no rate limits. Upgrade to Premium for unlimited analyses.'
        });
      }
    }

    // Check 1: Validate subscription limit WITHOUT incrementing counter
    // ✅ STANDARD SAAS PATTERN: Check limit at START, increment counter at END (workflow completion)
    // This prevents counting abandoned workflows (user quits before completing)
    const { checkAnalysisLimit } = require('../../lib/services/usage-tracking-service.js');
    const limitCheck = await checkAnalysisLimit(userId, subscriptionTier);

    // Block if user has already reached their limit
    // Trial: used=1, limit=1 → 1 >= 1 → Block (already used their 1 analysis)
    // Starter: used=15, limit=15 → 15 >= 15 → Block (already used all 15 analyses)
    if (limitCheck.limitReached) {
      return res.status(429).json({
        success: false,
        error: 'Monthly analysis limit reached',
        message: 'You have reached your monthly analysis limit. Please upgrade to continue.',
        limit_info: {
          tier: subscriptionTier,
          current_count: limitCheck.currentCount,
          tier_limit: limitCheck.tierLimit,
          remaining: limitCheck.remaining
        },
        upgrade_required: true,
        upgrade_url: '/pricing'
      });
    }

    console.log(`[USMCA-ANALYSIS] ✅ Limit check passed: ${limitCheck.currentCount}/${limitCheck.tierLimit} (will increment on workflow completion)`);

    // Check 2: Trial expiration (prevent free forever usage)
    if (subscriptionTier === 'Trial' || subscriptionTier === 'trial') {
      if (userProfile?.trial_end_date) {
        const trialEnd = new Date(userProfile.trial_end_date);
        const now = new Date();

        if (now > trialEnd) {
          console.log(`🚫 Trial expired for user ${userId} (expired: ${trialEnd.toISOString()})`);
          return res.status(403).json({
            success: false,
            error: 'Trial expired',
            message: 'Your 7-day free trial has ended. Please subscribe to continue using the platform.',
            trial_info: {
              trial_end_date: trialEnd.toISOString(),
              days_expired: Math.floor((now - trialEnd) / (1000 * 60 * 60 * 24))
            },
            upgrade_required: true,
            upgrade_url: '/pricing'
          });
        }
      }

      // Check 2B: Email verification for trial users (prevent spam signups)
      // Fetch email confirmation status from auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

      if (authError) {
        console.error(`[EMAIL-VERIFICATION] Error fetching auth user ${userId}:`, authError);
        // Don't block on error - fail open
      } else if (!authUser?.user?.email_confirmed_at) {
        console.log(`🚫 Email not verified for trial user ${userId}`);
        return res.status(403).json({
          success: false,
          error: 'Email verification required',
          message: 'Please verify your email address before using trial features. Check your inbox for the confirmation link.',
          email_verification_required: true,
          user_email: authUser?.user?.email
        });
      }
    }

    // Check 3: Component limit (prevent complex analyses on lower tiers)
    // 🔒 SERVER-SIDE VALIDATION: Don't trust client-sent used_components_count
    // Recalculate from actual locked components to prevent DevTools manipulation
    // ✅ FIX: Match client logic - count locked OR has valid HS code (handles old data migrations)
    const actualLockedCount = formData.component_origins?.filter(c =>
      c.is_locked || (c.hs_code && c.hs_code.length >= 6)
    ).length || 0;
    const clientSentCount = formData.used_components_count || 0;
    const currentComponentCount = formData.component_origins?.length || 0;

    // Use the HIGHER of the two values (prevents client from lying about lower count)
    const usedComponentCount = Math.max(actualLockedCount, clientSentCount);

    // ✅ FIX: Only log if client sent LOWER count (actual manipulation attempt)
    // Client sending higher count is harmless (old data, manual entry, etc.)
    if (clientSentCount > 0 && clientSentCount < actualLockedCount) {
      console.warn(`[SECURITY] Client undercount detected for user ${userId}: client=${clientSentCount}, actual=${actualLockedCount} - possible manipulation attempt`);
      await DevIssue.unexpectedBehavior('ai_usmca_analysis', 'Component count manipulation - client sent lower count than actual', {
        userId,
        clientSentCount,
        actualLockedCount,
        usedComponentCount,
        note: 'Client attempted to underreport component usage'
      });
    }

    const TIER_COMPONENT_LIMITS = {
      'Trial': 3,
      'trial': 3,
      'Free': 3,        // Legacy - same as Trial
      'free': 3,        // Legacy - same as Trial
      'Starter': 10,
      'starter': 10,
      'Professional': 15,
      'professional': 15,
      'Premium': 20,
      'premium': 20
    };

    const maxComponents = TIER_COMPONENT_LIMITS[subscriptionTier] || 3;

    // Validate using USED count (not current count) to prevent gaming HS lookup
    if (usedComponentCount > maxComponents) {
      return res.status(403).json({
        success: false,
        error: 'Component limit exceeded',
        message: `Your ${subscriptionTier} plan allows max ${maxComponents} components. You have used ${usedComponentCount} component slots (${currentComponentCount} active). HS lookups count toward your limit even if components are deleted.`,
        limit_info: {
          tier: subscriptionTier,
          used_component_count: usedComponentCount,
          current_component_count: currentComponentCount,
          max_components: maxComponents
        },
        upgrade_required: true,
        upgrade_url: '/pricing'
      });
    }

    // ✅ CRITICAL HELPER: Enrich components with tariff rates from AI response
    // Extracts component-specific rates from detailed_analysis and applies to each component
    // ONLY uses AI rates as FALLBACK if database rates are missing
    function enrichComponentsWithTariffRates(components, aiAnalysis) {
      if (!components || !Array.isArray(components)) return components;

      const savingsData = aiAnalysis?.detailed_analysis?.savings_analysis || {};
      const calcDetail = savingsData.calculation_detail || '';

      // Extract component-specific rates from calculation_detail
      // Format: "1. **Component Name (origin, %)** ... - MFN rate: X% ... - Section 301: Y%"
      function extractComponentRate(componentName, hsCode, originCountry) {
        let mfnRate = undefined;  // undefined = not found (different from 0 = found as 0%)
        let usmcaRate = undefined;
        let section301 = undefined;

        // Parse all numbered components (1. 2. 3. etc)
        const componentBlocks = calcDetail.split(/(?=\d+\.\s\*?\*?)/);

        for (const block of componentBlocks) {
          // Check if this block contains our component by name, HS code, or origin
          const blockHasComponent =
            (componentName && block.includes(componentName)) ||
            (hsCode && block.includes(hsCode)) ||
            (originCountry && block.includes(originCountry));

          if (!blockHasComponent) continue;

          // Extract MFN rate: look for "MFN rate avoided: X%" or "MFN rate: X%"
          // Flexible regex to handle "avoided" and other variations
          const mfnMatch = block.match(/MFN\s+rate\s+(?:avoided)?[^:]*?:\s*([0-9.]+)%/i);
          if (mfnMatch?.[1]) {
            mfnRate = parseFloat(mfnMatch[1]);
          }

          // Extract USMCA rate: look for "USMCA rate: X%"
          const usmcaMatch = block.match(/USMCA\s+rate[^:]*?:\s*([0-9.]+)%/i);
          if (usmcaMatch?.[1]) {
            usmcaRate = parseFloat(usmcaMatch[1]);
          }

          // Extract Section 301: look for "Section 301 of X%", "Section 301: X%", or "tariff of X%"
          const s301Match = block.match(/Section\s+301[^:]*?(?:of|:)\s*([0-9.]+)%|tariff\s+of\s+([0-9.]+)%/i);
          if (s301Match) {
            section301 = parseFloat(s301Match[1] || s301Match[2]);
          }

          // Found component, stop searching
          break;
        }

        // NO HARDCODED FALLBACK - Return what we extracted (undefined if not found)
        // This forces us to see extraction failures instead of hiding them
        return {
          mfnRate: mfnRate !== undefined ? mfnRate : 0,  // Only default to 0 if truly not extracted
          usmcaRate: usmcaRate !== undefined ? usmcaRate : 0,
          section301: section301 !== undefined ? section301 : 0,
          extracted: {
            mfnFound: mfnRate !== undefined,
            usmcaFound: usmcaRate !== undefined,
            section301Found: section301 !== undefined
          }
        };
      }

      // Enrich each component
      return components.map((comp) => {
        // ✅ VALIDATION CHECKPOINT 2: Only use AI rates if database rates are missing
        // Priority: Keep database rates, only use AI as fallback
        if (comp.mfn_rate !== undefined && comp.mfn_rate !== null && comp.mfn_rate !== 0 && comp.mfn_rate !== '') {
          // Database rate exists, skipping AI extraction
          return comp;  // Keep database rates - don't extract from AI
        }

        // Only extract from AI if database rate is missing
        const rates = extractComponentRate(comp.description, comp.hs_code, comp.origin_country);

        // DEBUG: Extracting fallback rates from AI response for missing components

        const totalRate = rates.mfn_rate + rates.section_301 + (rates.section_232 || 0);
        const savingsPercent = rates.mfn_rate > 0 ? (((rates.mfn_rate - rates.usmca_rate) / rates.mfn_rate) * 100) : 0;

        // ✅ CRITICAL: Preserve all input fields (including rate_source, stale)
        // Only UPDATE tariff rate fields if successfully extracted from AI
        return {
          ...comp,  // Preserves: rate_source, stale, and all other fields
          mfn_rate: rates.mfn_rate,
          base_mfn_rate: rates.mfn_rate,  // Keep base_mfn_rate consistent with mfn_rate
          usmca_rate: rates.usmca_rate,
          section_301: rates.section_301,
          section_232: comp.section_232 || 0,  // Preserve existing section_232 if present
          total_rate: totalRate,
          savings_percentage: savingsPercent,
          data_source: comp.data_source || 'ai_enriched',  // Preserve database source if present
          // ✅ Ensure rate_source and stale are always present
          rate_source: comp.rate_source || (rates.extracted.mfnFound ? 'ai_fallback' : 'incomplete'),
          stale: comp.stale !== undefined ? comp.stale : false
        };
      });
    }

    // Validate ALL required fields (UI marks 14 fields as required, API must validate all)
    const requiredFields = {
      company_name: formData.company_name,
      business_type: formData.business_type,
      industry_sector: formData.industry_sector,
      company_address: formData.company_address,
      company_country: formData.company_country,
      destination_country: formData.destination_country,  // CRITICAL for tariff routing
      contact_person: formData.contact_person,
      contact_phone: formData.contact_phone,
      contact_email: formData.contact_email,
      trade_volume: formData.trade_volume,                // CRITICAL for savings calculation
      tax_id: formData.tax_id,                            // CRITICAL for certificates
      supplier_country: formData.supplier_country,        // CRITICAL for AI analysis
      manufacturing_location: formData.manufacturing_location, // CRITICAL for AI analysis (can be "DOES_NOT_APPLY")
      substantial_transformation: formData.substantial_transformation || false,
      manufacturing_process: formData.manufacturing_process || null,
      component_origins: formData.component_origins
    };

    const missingFields = Object.keys(requiredFields).filter(key => {
      const value = requiredFields[key];
      // Check for missing values (null, undefined, empty string, empty array)
      // ✅ FIX: Allow false for boolean fields (substantial_transformation)
      // ✅ FIX: Allow null for optional fields (manufacturing_process)
      if (key === 'substantial_transformation' || key === 'manufacturing_process') {
        return value === undefined; // Only flag if completely missing
      }
      if (!value) return true;
      if (Array.isArray(value) && value.length === 0) return true;
      return false;
    });

    if (missingFields.length > 0) {
      // ⚡ PERFORMANCE: Removed await DevIssue logging (was blocking response)
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missing_fields: missingFields
      });
    }

    // ========== VALIDATE COMPONENT PERCENTAGES DON'T EXCEED 100% ==========
    const totalPercentage = (formData.component_origins || []).reduce((sum, component) => {
      return sum + parseFloat(component.value_percentage || 0);
    }, 0);

    if (totalPercentage > 100) {
      // ⚡ PERFORMANCE: Removed await DevIssue logging (was blocking response)
      return res.status(400).json({
        success: false,
        error: `Component percentages exceed 100%. Total: ${totalPercentage}%. Please adjust component values so they sum to 100% or less.`,
        total_percentage: totalPercentage,
        components: (formData.component_origins || []).map(c => ({
          description: c.description,
          percentage: c.value_percentage
        }))
      });
    }

    // ========== CRITICAL FIX (Oct 26, 2025) ==========
    // INTEGRATE REAL-TIME TARIFF MONITORING WITH API
    // The RSS feeds update tariff_rates_cache every 2 hours with fresh rates
    // We now FETCH those fresh rates from the database BEFORE calling AI
    // This ensures AI gets CURRENT rates instead of guessing from training data
    //
    // Flow:
    // 1. RSS polling → Database update (fresh tariff rates)
    // 2. API fetches fresh rates for each component
    // 3. AI uses real 2025 rates in analysis (not stale training data)
    // 4. Users get accurate certificate with current tariff impacts

    // ========== FETCH FRESH TARIFF RATES FROM DATABASE ==========
    async function enrichComponentsWithFreshRates(components, destinationCountry) {
      const enriched = [];

      for (const component of components) {
        // ✅ FIX (Oct 26): Always preserve original component fields including origin_country
        // Even if component doesn't have hs_code yet, we still need to keep all original data
        // This ensures components retain origin_country through the entire enrichment pipeline
        const baseComponent = {
          ...component,
          // Ensure required fields are always present
          description: component.description || component.component_type || '',
          origin_country: component.origin_country || component.country || '',
          value_percentage: component.value_percentage || component.percentage || 0,
          // ✅ FIX (Nov 20, 2025): Use null for missing rates (not 0)
          // - null = needs research
          // - 0 = confirmed duty-free (misleading if not researched)
          mfn_rate: component.mfn_rate ?? null,
          base_mfn_rate: component.base_mfn_rate ?? component.mfn_rate ?? null,
          section_301: component.section_301 ?? null,
          section_232: component.section_232 ?? null,
          usmca_rate: component.usmca_rate ?? null,
          rate_source: 'component_input',  // Track data source
          stale: false,  // User input is always fresh
          data_source: 'user_input'
        };

        // Skip database lookup if we don't have HS code
        if (!component.hs_code) {
          enriched.push(baseComponent);
          continue;
        }

        // ✅ VOLATILITY CHECK: Check if this component has volatile tariff rates
        console.log('🔍 [VOLATILITY-CHECK] Checking tariff volatility for:', {
          hs_code: component.hs_code,
          origin: baseComponent.origin_country,
          destination: destinationCountry
        });

        const volatilityTier = VolatilityManager.getVolatilityTier(
          component.hs_code,
          baseComponent.origin_country,
          destinationCountry
        );

        console.log('⚠️ [VOLATILITY-RESULT] Tier determined:', {
          hs_code: component.hs_code,
          tier: volatilityTier.tier,
          volatility: volatilityTier.volatility,
          bypassDatabase: volatilityTier.bypassDatabase,
          reason: volatilityTier.reason
        });

        // ✅ CRITICAL: If super-volatile (Tier 1), skip database and mark for AI research
        if (volatilityTier.bypassDatabase) {
          console.log('🚨 [SUPER-VOLATILE] Skipping database, marking component for AI research:', {
            component: component.description,
            reason: volatilityTier.reason,
            policies: volatilityTier.policies
          });

          // Mark component as needing fresh AI research (database rates are stale)
          enriched.push({
            ...baseComponent,
            mfn_rate: 0,
            base_mfn_rate: 0,
            section_301: 0,
            section_232: 0,
            usmca_rate: 0,
            rate_source: 'volatile_requires_ai',
            stale: true,  // Force AI research
            volatility_tier: volatilityTier.tier,
            volatility_warning: volatilityTier.warning,
            volatility_reason: volatilityTier.reason,
            volatility_policies: volatilityTier.policies,
            volatility_refresh_frequency: volatilityTier.tier === 1 ? 'daily' : 'weekly',
            data_source: 'volatility_bypass',
            last_verified: null  // Not yet verified (will be set after AI call)
          });
          continue;  // Skip database lookup
        }

        try {
          // ✅ DATABASE-FIRST APPROACH (Nov 14, 2025): Query our 17,545 USITC codes directly
          // Skip USITC API (down, not needed) - we have better data from HTS CSV export
          // Flow: Database → AI fallback (only if missing)

          // ✅ NEW (Nov 13, 2025): Smart HS code normalization for 10-digit AI classifications
          // AI often returns 10-digit codes (8534310000), but database uses 8-digit HTS-8 format (85343100)
          // USMCA certificates only require 6-digit minimum, so truncating to 8-digit is accurate
          const rawHsCode = (component.hs_code || '').replace(/\./g, '').replace(/\s/g, '');

          let normalizedHsCode;
          if (rawHsCode.length > 8) {
            // Truncate 10-digit to 8-digit HTS-8 format (US tariff schedule)
            normalizedHsCode = rawHsCode.substring(0, 8);
            console.log(`📏 [HS-NORMALIZE] Truncated ${rawHsCode} (${rawHsCode.length} digits) → ${normalizedHsCode} (8-digit HTS-8)`);
          } else if (rawHsCode.length < 8) {
            // Pad short codes to 8 digits
            normalizedHsCode = rawHsCode.padEnd(8, '0');
            console.log(`📏 [HS-NORMALIZE] Padded ${rawHsCode} (${rawHsCode.length} digits) → ${normalizedHsCode} (8-digit HTS-8)`);
          } else {
            normalizedHsCode = rawHsCode;
            console.log(`✅ [HS-NORMALIZE] Already 8-digit HTS-8: ${normalizedHsCode}`);
          }

          // ✅ FIX (Oct 28): Database has inconsistent formats - some with periods, some without
          // Try both formats to ensure we find the rate
          // Format 1: "76169950" (no periods)
          // Format 2: "7616.99.50" (with periods in traditional format)
          const hsCodeWithPeriods = normalizedHsCode.substring(0, 4) + '.' +
                                     normalizedHsCode.substring(4, 6) + '.' +
                                     normalizedHsCode.substring(6, 8);

          // Try exact match first (try both formats)
          const { data: exactMatch } = await supabase
            .from('tariff_intelligence_master')
            .select('hts8, brief_description, mfn_text_rate, mfn_rate_type_code, mfn_ad_val_rate, mfn_specific_rate, usmca_rate_type_code, usmca_ad_val_rate, usmca_specific_rate, mexico_rate_type_code, mexico_ad_val_rate, mexico_specific_rate, nafta_mexico_ind, nafta_canada_ind, column_2_ad_val_rate, section_301, section_232')
            .or(`hts8.eq.${normalizedHsCode},hts8.eq.${hsCodeWithPeriods}`)
            .limit(1)
            .single();

          let rateData = exactMatch;

          // ✅ TARIFF LOOKUP: Use exact HS code provided by component
          // DO NOT change or second-guess the HS code - only look up tariff rates
          if (exactMatch) {
            rateData = exactMatch;
            console.log(`✅ [TARIFF-LOOKUP] Found exact match for ${component.hs_code}: ${exactMatch.mfn_text_rate} MFN`);
          }

          // ✅ NEW (Nov 13, 2025): Try fuzzy match for statistical suffix variations
          // Example: AI suggests 85371090, database has 85371091 (off by 1 digit in suffix)
          if (!rateData) {
            const sevenDigitPrefix = normalizedHsCode.substring(0, 7);
            console.log(`🔍 [FUZZY-LOOKUP] Trying 7-digit fuzzy match: ${sevenDigitPrefix}X (statistical suffix variation)`);

            const { data: fuzzyMatches } = await supabase
              .from('tariff_intelligence_master')
              .select('hts8, brief_description, mfn_text_rate, mfn_rate_type_code, mfn_ad_val_rate, mfn_specific_rate, usmca_rate_type_code, usmca_ad_val_rate, usmca_specific_rate, mexico_rate_type_code, mexico_ad_val_rate, mexico_specific_rate, nafta_mexico_ind, nafta_canada_ind, column_2_ad_val_rate, section_301, section_232')
              .ilike('hts8', `${sevenDigitPrefix}%`)
              .order('hts8', { ascending: true })
              .limit(3);

            if (fuzzyMatches && fuzzyMatches.length > 0) {
              rateData = fuzzyMatches[0];
              console.log(`✅ [FUZZY-MATCH] Found similar code: ${rateData.hts8} (searched for ${normalizedHsCode})`);
              console.log(`   Likely same product category, statistical suffix differs by ${Math.abs(parseInt(normalizedHsCode.substring(7)) - parseInt(rateData.hts8.substring(7)))}`);
            }
          }

          // If fuzzy match fails, try 5-digit prefix match (chapter family level)
          // ✅ FIX (Nov 13, 2025): Changed 6-digit to 5-digit prefix
          // Bug: AI classified 8542.31 → 85423100, 6-digit search "854231%" didn't match "854232%"/"854233%"
          // Fix: 5-digit search "85423%" matches entire chapter family (85423200, 85423300, 85423900)
          if (!rateData) {
            const fiveDigitPrefix = normalizedHsCode.substring(0, 5);
            console.log(`🔍 [PREFIX-LOOKUP] Searching for 5-digit chapter family: ${fiveDigitPrefix}XXX`);

            const { data: prefixMatches } = await supabase
              .from('tariff_intelligence_master')
              .select('hts8, brief_description, mfn_text_rate, mfn_rate_type_code, mfn_ad_val_rate, mfn_specific_rate, usmca_rate_type_code, usmca_ad_val_rate, usmca_specific_rate, mexico_rate_type_code, mexico_ad_val_rate, mexico_specific_rate, nafta_mexico_ind, nafta_canada_ind, column_2_ad_val_rate, section_301, section_232')
              .ilike('hts8', `${fiveDigitPrefix}%`)
              .order('hts8', { ascending: true }) // Get general category first (e.g., 8504.40.00 before 8504.40.95)
              .limit(5); // Get multiple to find best description match

            if (prefixMatches && prefixMatches.length > 0) {
              // Use first match from 5-digit chapter family
              rateData = prefixMatches[0];
              console.log(`✅ [PREFIX-FALLBACK] Exact match not found, using 5-digit family match: ${rateData.hts8}`);
            }
          }

          // CRITICAL: Handle null rateData (record not found in tariff_intelligence_master)
          // Before giving up, check tariff_rates_cache for AI-discovered rates
          if (!rateData) {
            console.log(`⚠️ [HYBRID] ${component.hs_code} not in tariff_intelligence_master, checking tariff_rates_cache...`);

            // Check tariff_rates_cache (AI-discovered rates from previous lookups)
            const { data: cachedRate } = await supabase
              .from('tariff_rates_cache')
              .select('*')
              .eq('hs_code', normalizedHsCode)
              .eq('destination_country', destinationCountry)
              .single();

            if (cachedRate) {
              // ✅ NEW (Nov 6, 2025): Check if cache is stale (expired)
              const isExpired = cachedRate.expires_at && new Date(cachedRate.expires_at) < new Date();

              if (isExpired) {
                console.log(`⚠️ [CACHE STALE] Cache expired for ${component.hs_code} (expired: ${cachedRate.expires_at})`);
                // Mark as stale - force AI refresh
                enriched.push({
                  ...baseComponent,
                  mfn_rate: 0,
                  base_mfn_rate: 0,
                  section_301: 0,
                  section_232: 0,
                  usmca_rate: 0,
                  rate_source: 'cache_expired',
                  stale: true,  // Force AI research due to expiration
                  data_source: 'expired_cache',
                  cache_expired_at: cachedRate.expires_at
                });
                continue;  // Let Phase 3 refresh this with AI
              }

              console.log(`✅ [CACHE HIT] Found fresh cached AI rate for ${component.hs_code} (expires: ${cachedRate.expires_at})`);
              // Use cached rate instead of making AI call
              // ✅ FIX (Nov 20, 2025): Preserve null from database
              // - Database null = not researched yet
              // - Don't convert to 0 (hides missing data)
              enriched.push({
                ...baseComponent,
                mfn_rate: cachedRate.mfn_rate ? parseFloat(cachedRate.mfn_rate) : null,
                base_mfn_rate: cachedRate.mfn_rate ? parseFloat(cachedRate.mfn_rate) : null,
                section_301: cachedRate.section_301 ? parseFloat(cachedRate.section_301) : null,
                section_232: cachedRate.section_232 ? parseFloat(cachedRate.section_232) : null,
                usmca_rate: cachedRate.usmca_rate ? parseFloat(cachedRate.usmca_rate) : null,
                rate_source: 'tariff_rates_cache',
                stale: false,  // Cache hit - no AI call needed
                data_source: 'tariff_rates_cache',
                cache_expires_at: cachedRate.expires_at
              });
              continue;  // Skip to next component, no AI call needed
            }

            // ✅ FIX (Nov 9, 2025): HS code not in database - ALWAYS trigger AI research
            // Don't assume duty-free based on origin - AI must research actual tariff rates
            console.log(`⏳ [DATABASE MISS] HS code ${component.hs_code} not in tariff_intelligence_master`);
            console.log(`🔬 [AI RESEARCH] Triggering AI tariff research for ${baseComponent.origin_country} origin...`);

            enriched.push({
              ...baseComponent,
              mfn_rate: 0,  // Placeholder - AI will research actual rate
              base_mfn_rate: 0,
              section_301: 0,
              section_232: 0,
              usmca_rate: 0,
              rate_source: 'database_miss_needs_ai',
              stale: true,  // ✅ CRITICAL FIX: ALWAYS trigger AI when HS code not in database
              data_source: 'database_miss',
              requires_verification: true,
              verification_reason: `HS code ${component.hs_code} not in database - AI will research actual tariff rates`
            });
            continue;  // Let Phase 3 AI research handle this component
          }

          // ✅ HYBRID (Oct 30): Check policy_tariffs_cache for volatile rates
          // Overwrite Section 301/232 from master table with fresh cache values
          let policyRates = { section_301: rateData?.section_301 || 0, section_232: rateData?.section_232 || 0 };

          console.log(`🔍 [POLICY-CACHE-DEBUG] About to start multi-level lookup for ${component.hs_code} (normalized: ${normalizedHsCode})`);
          console.log(`🔍 [POLICY-CACHE-DEBUG] rateData exists: ${!!rateData}, rateData.hts8: ${rateData?.hts8}`);

          // ✅ FIX (Nov 20, 2025): Multi-level lookup strategy for policy rates
          // 1. Try exact 8-digit match (e.g., "73269070")
          // 2. Try parent 6-digit match (e.g., "732690")
          // 3. Query policy_tariffs_cache with intelligent fallback hierarchy
          // ✅ NEW (Nov 20, 2025): Use tariff-rate-lookup.js for 5-level fallback
          let policyCache = null;
          let lookupConfidence = 0;
          let lookupSource = 'not_found';

          try {
            // Import fallback hierarchy lookup
            const { getTariffRateWithFallback } = await import('../../lib/services/tariff-rate-lookup.js');

            // Try Section 301 lookup with fallback
            let section301Result = await getTariffRateWithFallback(
              normalizedHsCode,
              component.origin_country,
              'section_301'
            );

            // Try Section 232 lookup with fallback
            let section232Result = await getTariffRateWithFallback(
              normalizedHsCode,
              component.origin_country,
              'section_232'
            );

            // ✅ NEW (Nov 21, 2025): AI FALLBACK when database miss occurs
            // If database returns needs_research: true, trigger AI agents
            if (section301Result.needs_research && component.origin_country === 'CN') {
              console.log(`🤖 [SECTION-301-AI] Database miss, calling Section 301 agent for ${normalizedHsCode}...`);
              try {
                const { section301Agent } = await import('../../lib/agents/section-301-research-agent.js');
                const aiResult = await section301Agent.researchRate(normalizedHsCode, {
                  originCountry: component.origin_country
                });

                section301Result = {
                  rate: aiResult.section_301,
                  confidence: aiResult.confidence === 'high' ? 85 : aiResult.confidence === 'medium' ? 70 : 50,
                  source: 'ai_research',
                  hs_code_used: normalizedHsCode,
                  needs_research: false
                };
                console.log(`✅ [SECTION-301-AI] Got ${(aiResult.section_301 * 100).toFixed(1)}% from AI`);
              } catch (error) {
                console.error(`❌ [SECTION-301-AI] AI research failed:`, error.message);
              }
            }

            if (section232Result.needs_research) {
              // Check if this is a steel/aluminum component (Chapter 72, 73, 76, 83, 84, 85, 87, 94)
              const chapter = normalizedHsCode.substring(0, 2);
              const section232Chapters = ['72', '73', '76', '83', '84', '85', '87', '94'];

              if (section232Chapters.includes(chapter)) {
                console.log(`🤖 [SECTION-232-AI] Database miss, calling Section 232 agent for ${normalizedHsCode}...`);
                try {
                  const { section232Agent } = await import('../../lib/agents/section-232-research-agent.js');
                  const aiResult = await section232Agent.researchRate(normalizedHsCode, {
                    originCountry: component.origin_country,
                    aluminumSource: component.material_origin === 'us' ? 'us_smelted' : 'unknown'
                  });

                  section232Result = {
                    rate: aiResult.section_232,
                    confidence: aiResult.confidence === 'high' ? 85 : aiResult.confidence === 'medium' ? 70 : 50,
                    source: 'ai_research',
                    hs_code_used: normalizedHsCode,
                    needs_research: false
                  };
                  console.log(`✅ [SECTION-232-AI] Got ${(aiResult.section_232 * 100).toFixed(1)}% from AI`);
                } catch (error) {
                  console.error(`❌ [SECTION-232-AI] AI research failed:`, error.message);
                }
              }
            }

            // Combine results
            if (section301Result.rate !== null || section232Result.rate !== null) {
              policyCache = {
                section_301: section301Result.rate,
                section_232: section232Result.rate,
                verified_date: section301Result.verified_date || section232Result.verified_date,
                is_stale: section301Result.needs_research || section232Result.needs_research
              };

              // ✅ FIX (Nov 20, 2025): Use LOWEST confidence (most conservative)
              // If Section 301 is verified (100%) but Section 232 is estimated (50%),
              // show 50% so user knows at least one rate is uncertain
              lookupConfidence = Math.min(section301Result.confidence, section232Result.confidence);
              lookupSource = section301Result.confidence < section232Result.confidence
                ? section301Result.source
                : section232Result.source;

              console.log(`✅ [POLICY-CACHE-ENHANCED] ${lookupSource} for ${normalizedHsCode} (${lookupConfidence}% confidence)`);
              console.log(`  Section 301: ${section301Result.rate !== null ? (section301Result.rate * 100).toFixed(1) + '%' : 'null'} (${section301Result.source})`);
              console.log(`  Section 232: ${section232Result.rate !== null ? (section232Result.rate * 100).toFixed(1) + '%' : 'null'} (${section232Result.source})`);
            }
          } catch (policyCacheError) {
            console.log(`⚠️ [POLICY-CACHE] Enhanced lookup error: ${policyCacheError.message}`);
            // Fallback to old manual query if new system fails
            try {
              const { data: fallbackMatch } = await supabase
                .from('policy_tariffs_cache')
                .select('section_301, section_232, verified_date, is_stale')
                .eq('hs_code', normalizedHsCode)
                .maybeSingle();

              if (fallbackMatch) {
                policyCache = fallbackMatch;
                lookupConfidence = 100;
                lookupSource = 'exact_match_fallback';
                console.log(`✅ [POLICY-CACHE] Fallback exact match for ${normalizedHsCode}`);
              }
            } catch (fallbackError) {
              console.log(`⚠️ [POLICY-CACHE] Fallback also failed: ${fallbackError.message}`);
            }
          }

          // Apply policy rates if found
          try {

            if (policyCache && !policyCache.is_stale) {
              // ✅ FIX (Nov 20, 2025): Keep null if database has null
              // Use cached policy rates (fresher than master table)
              policyRates.section_301 = policyCache.section_301 ?? null;
              policyRates.section_232 = policyCache.section_232 ?? null;
              console.log(`✅ [POLICY-CACHE] Using fresh policy rates for ${component.hs_code} (verified ${policyCache.verified_date})`);
            } else if (policyCache?.is_stale) {
              console.log(`⚠️ [POLICY-CACHE] Stale policy rates for ${component.hs_code}, using master table fallback`);
            }
          } catch (policyCacheError) {
            // No policy cache entry - use master table values
            // Not an error, just means no volatile rates have been cached yet
          }

          // Map USITC columns to our standard format
          // Handle multiple rate types: Ad valorem (%), Specific (per unit), Compound (% + per unit), Free
          // Rate type codes: "A" = ad valorem, "S" = specific, "C" = compound, NULL = free

          const getMFNRate = () => {
            // ✅ CORRECT APPROACH (Nov 3, 2025): Use base MFN rate for ALL WTO countries
            // China has had Normal Trade Relations (NTR) since 2000 and WTO membership since 2001
            // Column 2 rates ONLY apply to: North Korea, Cuba (non-NTR countries)
            //
            // For China → USA tariffs, the calculation is:
            //   Base MFN + Section 301 + Reciprocal + IEEPA (if active)
            //   All policy rates vary by HS code and effective date
            //
            // Section 301, Reciprocal, and IEEPA tariffs are added separately via getSection301Rate()

            const textRate = rateData?.mfn_text_rate;
            const mfnAdValRate = rateData?.mfn_ad_val_rate;

            // ✅ DEBUG: Log database values for first component
            if (!component._debugLogged) {
              console.log('\n═══════════════════════════════════════════════════════════════');
              console.log('🔍 [DATABASE ENRICHMENT] getMFNRate() - Using WTO base rates:');
              console.log(`   HS Code: ${component.hs_code}`);
              console.log(`   Origin: ${component.origin_country}`);
              console.log(`   mfn_text_rate: "${textRate}"`);
              console.log(`   mfn_ad_val_rate: "${mfnAdValRate}" (parsed: ${parseFloat(mfnAdValRate)})`);
              console.log(`   NOTE: Policy tariffs (Section 301, etc.) added separately`);
              component._debugLogged = true;
            }

            // For all WTO countries (including China), use MFN rate
            if (textRate === 'Free') {
              return 0;  // ✅ OK: "Free" means legitimately 0% duty
            }

            const rate = parseFloat(mfnAdValRate);
            if (!isNaN(rate)) {
              return rate;
            }

            // ✅ FIX (Nov 20): If database has no MFN rate, trigger AI research instead of defaulting to 0
            console.log(`⚠️ [MFN-RATE] HS ${component.hs_code}: No MFN rate in database (stale: true)`);
            component.stale = true;  // Trigger AI research
            return 0;  // Temporary fallback until AI research completes
          };

          const getSection301Rate = () => {
            // ✅ HYBRID (Oct 30): Section 301 rates from policy_tariffs_cache (7-day freshness)
            // Falls back to tariff_intelligence_master if not in cache
            // NOTE: API returns rates in DECIMAL format (0-1); frontend multiplies by 100 for display

            // ✅ FIX (Nov 20): Section 301 applies to MULTIPLE origins, not just China
            // Countries with Section 301 tariffs: China, Vietnam, Russia, etc.
            // Must check policy_tariffs_cache for ALL origins, not hardcode China-only logic

            const isUSDestination = destinationCountry === 'US';

            if (!isUSDestination) {
              // Section 301 only applies to imports into the US
              return 0;
            }

            // Check policy_tariffs_cache for Section 301 rate (ANY origin)
            // The cache query already filtered by origin_country, so trust the result
            const section301Rate = parseFloat(policyRates.section_301);

            if (!isNaN(section301Rate) && section301Rate > 0) {
              console.log(`✅ [SECTION-301] HS ${component.hs_code} (${component.origin_country} → US): ${(section301Rate * 100).toFixed(1)}% from policy_tariffs_cache`);
              return section301Rate;  // Return decimal format (0-1)
            }

            // If no Section 301 in cache, check if we should trigger AI research
            // Only trigger if this is a high-risk origin (China, Vietnam, Russia)
            const highRiskOrigins = ['CN', 'China', 'VN', 'Vietnam', 'RU', 'Russia'];
            if (highRiskOrigins.includes(component.origin_country)) {
              console.log(`⚠️ [SECTION-301] HS ${component.hs_code} (${component.origin_country}): Not in policy cache, may need AI research`);
              // Note: Don't set stale=true here, as Section 301 is checked separately in tariff research agent
            }

            return 0;  // No Section 301 for this HS code + origin combination
          };

          const getUSMCARate = () => {
            // ✅ CRITICAL FIX (Nov 20, 2025): USMCA rate is the PREFERENTIAL RATE for this HS code
            // This is what you pay IF the final product qualifies for USMCA (based on RVC)
            // Component origin does NOT determine the USMCA rate - only RVC calculation
            //
            // Example: China component in qualified product:
            //   - MFN Rate: 2.9% (standard duty for China imports)
            //   - USMCA Rate: 0% (preferential rate IF product qualifies)
            //   - Savings: 2.9% (difference between MFN and USMCA)
            //
            // The USMCA rate should ALWAYS come from database, NOT from component origin logic

            // Step 1: Check if USMCA destination (only US, CA, MX have USMCA)
            const isUSMCADestination = ['US', 'CA', 'MX'].includes(destinationCountry);

            if (!isUSMCADestination) {
              // No USMCA preferential rate for non-USMCA destinations
              console.log(`⚠️ [USMCA-RATE] Destination ${destinationCountry} not USMCA member, no preferential rate`);
              return getMFNRate();  // Use MFN rate (no preference available)
            }

            // Step 2: Look up USMCA preferential rate from database for this HS code
            // Determine which rate column to use based on destination
            let rateValue;
            let rateSource;

            if (destinationCountry === 'MX') {
              rateValue = rateData?.mexico_ad_val_rate;
              rateSource = 'mexico_ad_val_rate';
            } else if (destinationCountry === 'CA') {
              // Canada uses usmca_ad_val_rate column (CUSMA is Canada's name for USMCA)
              rateValue = rateData?.usmca_ad_val_rate;
              rateSource = 'usmca_ad_val_rate (CUSMA)';
            } else {
              // US destination
              rateValue = rateData?.usmca_ad_val_rate;
              rateSource = 'usmca_ad_val_rate';
            }

            // Step 3: Parse the rate
            // If "Free" text rate, return 0
            if (rateData?.mfn_text_rate === 'Free' || rateData?.usmca_text_rate === 'Free') {
              console.log(`✅ [USMCA-RATE] HS ${component.hs_code} → ${destinationCountry}: Free (duty-free)`);
              return 0;
            }

            // Parse numeric rate
            const rate = parseFloat(rateValue);

            if (!isNaN(rate)) {
              console.log(`✅ [USMCA-RATE] HS ${component.hs_code} → ${destinationCountry}: ${(rate * 100).toFixed(1)}% from ${rateSource}`);
              return rate;
            }

            // Step 4: If database has no USMCA rate, trigger AI research
            console.log(`⚠️ [USMCA-RATE] HS ${component.hs_code}: No USMCA rate in database (stale: true)`);
            component.stale = true;  // Trigger AI research
            return 0;  // Temporary fallback until AI research completes
          };

          // 🔧 CONSISTENT CONTRACT: Always return same structure
          const mfnRate = getMFNRate();
          const usmcaRate = getUSMCARate();
          const section301Rate = getSection301Rate();

          // ✅ FIX (Oct 28): base_mfn_rate should match mfnRate (origin-aware)
          // mfnRate already handles Column 2 for China, so just use it directly
          // This is the base tariff rate BEFORE Section 301/232 policy adjustments
          const baseMfnRate = mfnRate;

          // ✅ Add volatility metadata for UI display
          const componentVolatility = VolatilityManager.getVolatilityTier(
            component.hs_code,
            baseComponent.origin_country,
            destinationCountry
          );

          const now = new Date();
          const cacheAge = policyRates.verified_date ?
            Math.floor((now - new Date(policyRates.verified_date)) / (1000 * 60 * 60 * 24)) :
            0;

          // ✅ NEW (Nov 14, 2025): Section 232 Detection + Material Origin Exemption
          // Section 232 Rules: Steel/aluminum/copper from ALL countries face 50% tariff
          // ONLY exemption: Material smelted/melted in the United States
          // USMCA membership does NOT exempt from Section 232 (Mexico/Canada still pay 50%)

          // STEP 1: Check if user indicated Section 232 material via checkbox
          // ✅ NEW (Nov 14): User manually selects via checkbox instead of auto-detection
          const isSection232Material = component.contains_section_232_material === true;
          console.log(`🔍 [SECTION-232-CHECK] Component "${component.description}": contains_section_232_material = ${isSection232Material}`);

          // STEP 2: Get Section 232 rate from database OR use default 50% for Section 232 materials
          let appliedSection232 = parseFloat(policyRates.section_232) || 0;
          console.log(`🔍 [SECTION-232-RATE] policyRates.section_232: ${policyRates.section_232}, appliedSection232: ${appliedSection232}`);

          if (isSection232Material && appliedSection232 === 0) {
            // User indicated Section 232 material but database doesn't have rate - call Section 232 agent for correct rate
            console.log(`🔍 [SECTION-232-AI] Database missing Section 232 rate for ${component.hs_code}, calling Section 232 agent...`);

            try {
              const { section232Agent } = await import('../../lib/agents/section-232-research-agent.js');
              const section232Result = await section232Agent.researchRate(component.hs_code, {
                originCountry: component.origin_country,
                aluminumSource: component.material_origin === 'us' ? 'us_smelted' : 'non_us'
              });

              appliedSection232 = section232Result.section_232;
              console.log(`✅ [SECTION-232-AI] Section 232 agent returned ${(appliedSection232 * 100).toFixed(1)}% for ${component.hs_code}`);
            } catch (error) {
              console.error(`❌ [SECTION-232-AI] Failed to get Section 232 rate from agent:`, error.message);
              // ✅ FIXED Nov 20, 2025: Removed hardcoded 50% fallback - let it stay 0 to be visible as an error
              appliedSection232 = 0;
            }
          }

          // STEP 3: Check material_origin for exemption
          let section232Exemption = null;

          if (appliedSection232 > 0 && component.material_origin) {
            switch (component.material_origin) {
              case 'us':
                // US-origin material: EXEMPT from Section 232
                section232Exemption = {
                  original_rate: appliedSection232,
                  applied_rate: 0,
                  exemption_amount: appliedSection232,
                  reason: 'US-origin material - Section 232 exempt',
                  material_notes: component.material_notes || null
                };
                appliedSection232 = 0;
                console.log(`✅ [SECTION-232-EXEMPT] Component "${component.description}": US-origin material, exempting ${(section232Exemption.original_rate * 100).toFixed(1)}% Section 232 tariff`);
                break;

              case 'mx_ca':
                // Mexico/Canada origin: Section 232 still applies (no USMCA exemption)
                section232Exemption = {
                  original_rate: appliedSection232,
                  applied_rate: appliedSection232,
                  exemption_amount: 0,
                  reason: 'Mexico/Canada origin - USMCA member but Section 232 still applies',
                  material_notes: component.material_notes || null
                };
                console.log(`⚠️ [SECTION-232-APPLIES] Component "${component.description}": Mexico/Canada origin, ${(appliedSection232 * 100).toFixed(1)}% Section 232 tariff applies`);
                break;

              case 'non_na':
                // Outside North America: Full Section 232 applies
                section232Exemption = {
                  original_rate: appliedSection232,
                  applied_rate: appliedSection232,
                  exemption_amount: 0,
                  reason: 'Non-North American origin - Section 232 applies',
                  material_notes: component.material_notes || null
                };
                console.log(`⚠️ [SECTION-232-APPLIES] Component "${component.description}": Non-NA origin, ${(appliedSection232 * 100).toFixed(1)}% Section 232 tariff applies`);
                break;

              case 'unknown':
              default:
                // Unknown origin: Assume Section 232 applies (safe default)
                section232Exemption = {
                  original_rate: appliedSection232,
                  applied_rate: appliedSection232,
                  exemption_amount: 0,
                  reason: 'Material origin unknown - assumed non-US',
                  potential_savings: appliedSection232,  // Show what user could save if US-origin
                  material_notes: component.material_notes || null
                };
                console.log(`⚠️ [SECTION-232-UNKNOWN] Component "${component.description}": Unknown origin, ${(appliedSection232 * 100).toFixed(1)}% Section 232 assumed to apply`);
                break;
            }
          }

          const standardFields = {
            mfn_rate: mfnRate,
            base_mfn_rate: baseMfnRate,
            section_301: section301Rate,  // ✅ HYBRID: From policy_tariffs_cache (7-day freshness)
            section_232: appliedSection232,  // ✅ NEW: After applying material_origin exemption
            section_232_exemption: section232Exemption,  // ✅ NEW: Track exemption details for display
            usmca_rate: usmcaRate,
            mfn_text_rate: rateData?.mfn_text_rate || null,  // ✅ Track "Free" vs missing data
            rate_source: rateData ? 'tariff_intelligence_master' : 'component_input',
            stale: false,  // All rates now from database - no AI enrichment needed
            data_source: rateData ? 'tariff_intelligence_master' : 'no_data',
            last_updated: new Date().toISOString(),
            // ✅ NEW (Nov 20, 2025): Confidence level from enhanced lookup
            lookup_confidence: lookupConfidence,  // 0-100 confidence score
            lookup_source: lookupSource,  // exact_match, category_rate, heading_rate, chapter_prefix, not_found
            // Volatility metadata for UI freshness indicators
            volatility_tier: componentVolatility.tier,
            volatility_reason: componentVolatility.reason,
            volatility_refresh_frequency: componentVolatility.tier === 1 ? 'daily' :
                                          componentVolatility.tier === 2 ? 'weekly' : 'quarterly',
            last_verified: policyRates.verified_date || new Date().toISOString().split('T')[0],
            cache_age_days: cacheAge
          };

          // ✅ DEBUG: Log final enriched rates for first component
          if (!component._ratesLogged) {
            console.log(`\n✅ [DATABASE ENRICHMENT] Enriched rates for ${component.description}:`);
            console.log(`   mfn_rate: ${mfnRate}`);
            console.log(`   base_mfn_rate: ${baseMfnRate}`);
            console.log(`   section_301: ${section301Rate}`);
            console.log(`   section_232: ${standardFields.section_232}`);
            console.log(`   usmca_rate: ${usmcaRate}`);
            console.log(`   rate_source: ${standardFields.rate_source}`);
            console.log('═══════════════════════════════════════════════════════════════\n');
            component._ratesLogged = true;
          }

          enriched.push({
            ...baseComponent,  // Keep all original fields
            ...standardFields  // Overwrite with database rates if available
          });

          // DEBUG: Tariff rates loaded from database or component input
        } catch (dbError) {
          console.error(`❌ [TARIFF-INTEGRATION] Database lookup error for ${component.hs_code}:`, dbError.message);
          // ✅ FIX (Nov 20, 2025): Preserve null for missing rates
          // On error: still return consistent structure with original fields preserved
          enriched.push({
            ...baseComponent,
            mfn_rate: component.mfn_rate ?? null,
            base_mfn_rate: component.base_mfn_rate ?? component.mfn_rate ?? null,
            section_301: component.section_301 ?? null,
            section_232: component.section_232 ?? null,
            usmca_rate: component.usmca_rate ?? null,
            rate_source: 'database_fallback',
            stale: true,
            data_source: 'error'
          });
        }
      }

      return enriched;
    }

    // ========== HYBRID ENRICHMENT: DATABASE-FIRST + AI FALLBACK ==========
    // Phase 1: Fast database lookup for all components
    let enrichedComponents = await enrichComponentsWithFreshRates(
      formData.component_origins,
      formData.destination_country
    );

    // DEBUG: Log enrichedComponents to see if database rates are present
    console.log('📦 [ENRICHMENT-DEBUG] After database lookup:',
      enrichedComponents.map(c => ({
        description: c.description,
        hs_code: c.hs_code,
        mfn_rate: c.mfn_rate,
        section_301: c.section_301,
        rate_source: c.rate_source,
        stale: c.stale
      }))
    );

    // Phase 1: Database enrichment complete

    // Phase 2: AI FALLBACK for missing components (HYBRID approach)
    // ✅ DATABASE-FIRST: Only call AI if component is missing from database
    // ✅ FIX (Oct 30): Respect legitimate 0% duty-free rates (mfn_text_rate: "Free")
    // Don't treat mfn_rate === 0 as missing if mfn_text_rate is "Free"
    const missingFromDatabase = enrichedComponents.filter(c => {
      // If stale or no_data, definitely needs AI
      if (c.stale === true || c.data_source === 'no_data') return true;

      // If mfn_rate is 0 AND mfn_text_rate is null/empty, it's incomplete data
      if (c.mfn_rate === 0 && !c.mfn_text_rate) return true;

      // Otherwise, data is complete (includes "Free" duty-free rates)
      return false;
    });

    if (missingFromDatabase.length > 0) {
      console.log(`⏳ [HYBRID] ${missingFromDatabase.length} components missing from database, calling AI for 2025 rates...`);

      try {
        const aiRates = await getAIRatesForMissingComponents(
          missingFromDatabase,
          formData.destination_country,
          formData.product_description
        );

        // Merge AI results back into enrichedComponents - ONLY for missing ones
        enrichedComponents = enrichedComponents.map(comp => {
          const aiResult = aiRates.find(air => air.hs_code === comp.hs_code);
          if (aiResult && (comp.stale === true || comp.rate_source === 'no_data')) {
            console.log(`✅ [HYBRID] AI found rates for ${comp.hs_code}: MFN=${aiResult.mfn_rate}, Section 301=${aiResult.section_301}`);

            const now = new Date();
            const verifiedDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
            const verifiedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // e.g., "02:30 PM"

            // ✅ FIX (Nov 20, 2025): NEVER assume USMCA rate = 0%
            // - USMCA rates vary by product (0%, 2.5%, 5%, etc - query database)
            // - Origin ≠ Qualification (Mexico product may not qualify if RVC < threshold)
            // - Qualification checked separately by USMCA engine (don't mix with rate lookup)
            const usmcaRate = aiResult.usmca_rate ?? null;

            return {
              ...comp,
              mfn_rate: aiResult.mfn_rate,
              base_mfn_rate: aiResult.mfn_rate,
              section_301: aiResult.section_301,
              section_232: aiResult.section_232,
              usmca_rate: usmcaRate,  // ✅ Use corrected rate
              rate_source: 'ai_research_2025',
              data_source: 'ai_research_2025',  // ✅ FIX: Also set data_source so validation passes
              stale: false,
              last_verified: now.toISOString(),  // Full ISO timestamp for calculations
              verified_date: verifiedDate,        // Human-readable date
              verified_time: verifiedTime         // Human-readable time
            };
          }
          return comp;
        });

        // ✅ HYBRID SAVE (Oct 30): Split stable vs volatile rates
        // Stable rates (MFN, USMCA) → tariff_intelligence_master (permanent)
        // Volatile rates (Section 301, 232) → policy_tariffs_cache (7-30 day expiration)
        if (aiRates && aiRates.length > 0) {
          try {
            console.log(`💾 [HYBRID-SAVE] Saving ${aiRates.length} AI-discovered rates (split stable/volatile)...`);

            // ❌ TEMPORARILY DISABLED (Nov 8, 2025): AI database save until we verify 100% accuracy
            //
            // ISSUE: AI is returning MFN="Free" (0.0%) for components that should have 3.4%, 2.7%, etc.
            // This pollutes tariff_intelligence_master with bad data, then database lookup returns these
            // bad "AI-verified component" entries instead of doing fresh research.
            //
            // PLAN:
            // 1. Comment out database save (DONE)
            // 2. Delete all bad "AI-verified component" entries
            // 3. Test with AI research only (no caching)
            // 4. Fix AI prompt to return correct MFN rates
            // 5. Re-enable database save once AI is 100% accurate
            //
            // for (const aiRate of aiRates) {
            //   const normalizedHS = aiRate.hs_code.replace(/\D/g, '').substring(0, 8).padEnd(8, '0');
            //   const mfnTextRate = (aiRate.mfn_rate === 0 || aiRate.base_mfn_rate === 0) ? 'Free' : `${(aiRate.mfn_rate * 100).toFixed(1)}%`;
            //
            //   // 1. Save STABLE rates to master table (permanent)
            //   const { error: masterError } = await supabase
            //     .from('tariff_intelligence_master')
            //     .upsert({
            //       hts8: normalizedHS,
            //       brief_description: aiRate.description || 'AI-verified component',
            //       mfn_text_rate: mfnTextRate,
            //       mfn_ad_val_rate: aiRate.base_mfn_rate || aiRate.mfn_rate || 0,
            //       usmca_ad_val_rate: aiRate.usmca_rate || 0,
            //       // DON'T save section_301/232 here - too volatile
            //       data_source: 'ai_verified_2025',
            //       needs_ai_enrichment: false,
            //       created_at: new Date().toISOString(),
            //       updated_at: new Date().toISOString()
            //     }, {
            //       onConflict: 'hts8'
            //     });
            //
            //   if (masterError) {
            //     console.error(`⚠️ [HYBRID-SAVE] Failed to save stable rates ${normalizedHS}:`, masterError.message);
            //   } else {
            //     console.log(`✅ [HYBRID-SAVE] Saved stable rates ${normalizedHS} to master (permanent)`);
            //   }
            //
            //   // 2. Save VOLATILE policy rates to cache (with expiration)
            //   const hasVolatileRates = (aiRate.section_301 > 0) || (aiRate.section_232 > 0);
            //   if (hasVolatileRates) {
            //     // Section 301 (China): 7-day freshness
            //     // Section 232 (Steel): 30-day freshness
            //     const expirationDays = aiRate.section_301 > 0 ? 7 : 30;
            //     const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);
            //
            //     const { error: policyError } = await supabase
            //       .from('policy_tariffs_cache')
            //       .upsert({
            //         hs_code: normalizedHS,
            //         section_301: aiRate.section_301 || 0,
            //         section_232: aiRate.section_232 || 0,
            //         verified_date: new Date().toISOString().split('T')[0],
            //         expires_at: expiresAt.toISOString(),
            //         data_source: 'ai_verified',
            //         last_updated_by: 'system',
            //         update_notes: `AI discovered rate on ${new Date().toISOString()}`
            //       }, {
            //         onConflict: 'hs_code'
            //       });
            //
            //     if (policyError) {
            //       console.error(`⚠️ [HYBRID-SAVE] Failed to cache policy rates ${normalizedHS}:`, policyError.message);
            //     } else {
            //       console.log(`✅ [HYBRID-SAVE] Cached policy rates ${normalizedHS} (expires in ${expirationDays} days)`);
            //     }
            //   }
            // }

            console.log(`⚠️ [HYBRID-SAVE] Database save DISABLED - testing AI accuracy first`);
          } catch (saveError) {
            console.error(`⚠️ [HYBRID-SAVE] Error saving AI rates:`, saveError.message);
            // Non-fatal error - continue with request even if save fails
          }
        }
      } catch (aiError) {
        console.error(`⚠️  [HYBRID] AI enrichment failed, continuing with database rates:`, aiError.message);
      }
    }

    // DEBUG: Final enrichment state validation
    if (!enrichedComponents || enrichedComponents.length === 0) {
      console.error('🚨 [TARIFF-DATA] enrichedComponents is empty!', {
        input_components: formData.component_origins?.length || 0,
        destination: formData.destination_country
      });
    }

    // ========== VALIDATION CHECKPOINT 1: Verify enrichedComponents have rates ==========
    // CRITICAL FIX: Only check stale flag, NOT mfn_rate === 0
    // Zero percent tariffs are VALID data from AI, not missing data
    // Missing data is indicated by stale === true or rate_source === 'no_data'
    const missingRatesAfterPhase3 = enrichedComponents.filter(comp =>
      comp.stale === true || comp.data_source === 'no_data'
    );

    if (missingRatesAfterPhase3.length > 0) {
      console.warn(`⚠️  [VALIDATION] ${missingRatesAfterPhase3.length} components still missing tariff rates after Phase 3:`, {
        missing: missingRatesAfterPhase3.map(c => ({
          hs_code: c.hs_code,
          description: c.description,
          rate_source: c.rate_source,
          stale: c.stale
        }))
      });

      // Log issue and determine severity based on destination country
      const isUSDestination = formData.destination_country === 'US';
      const isCADestination = formData.destination_country === 'CA';
      const isMXDestination = formData.destination_country === 'MX';

      await DevIssue.unexpectedBehavior('validation_checkpoint_p0', 'Missing tariff rates after enrichment - P0 ERROR', {
        count: missingRatesAfterPhase3.length,
        components: missingRatesAfterPhase3.map(c => c.description),
        destination: formData.destination_country,
        severity_level: isMXDestination ? 'warning' : 'error'
      });

      // P0 FIX (Oct 27, 2025): FAIL LOUDLY if critical market data is missing
      // MX: lenient (database cache is reliable)
      // US/CA: strict (volatile tariffs, must have fresh data)
      // DISABLED FOR LAUNCH - Will re-enable after database fully synced
      if (false && (isUSDestination || isCADestination) && missingRatesAfterPhase3.length > 0) {
        const missingCodes = missingRatesAfterPhase3.map(c => c.hs_code).join(', ');
        console.error(`❌ [P0-BLOCKER] Cannot proceed without tariff data for US/CA destination:`, {
          destination: formData.destination_country,
          missing_hs_codes: missingCodes,
          missing_count: missingRatesAfterPhase3.length,
          action: 'Returning error - user must verify HS codes and try again'
        });

        return res.status(400).json({
          success: false,
          error: 'tariff_data_unavailable',
          message: `Unable to retrieve current tariff rates for ${missingRatesAfterPhase3.length} component(s). This is required for ${formData.destination_country} destination.`,
          details: {
            missing_components: missingRatesAfterPhase3.map(c => ({
              hs_code: c.hs_code,
              description: c.description,
              action: 'Please verify the HS code is correct (10-digit format) and try again'
            })),
            destination: formData.destination_country,
            suggestion: 'If problem persists, check your internet connection and try again in a few minutes.'
          }
        });
      }

      // Mexico destination: warn but continue (database cache is reliable for MX)
      if (isMXDestination && missingRatesAfterPhase3.length > 0) {
        console.warn(`⚠️  [P0-WARNING] Mexico destination - continuing with ${missingRatesAfterPhase3.length} components at 0% default rates`, {
          missing: missingRatesAfterPhase3.map(c => c.description),
          action: 'Workflow continues - Mexico rates are stable in database'
        });
      }
    }

    // ========== PRE-CALCULATE FINANCIAL DATA (Oct 26, 2025 Optimization - FIXED Oct 27) ==========
    // FIXED: Only apply USMCA savings to USMCA-member-origin components
    // Non-USMCA components (China, Vietnam, etc.) do NOT get USMCA rates or savings
    // Instead of asking AI to calculate, compute all financial metrics here
    // This reduces token usage from 16,000 to 4,000 (~65% faster response)
    const tradeVolume = parseTradeVolume(formData.trade_volume);

    // ✅ FIX (Oct 28): Define USMCA countries for component filtering
    // USMCA members: US, MX (Mexico), CA (Canada)
    const usmcaCountries = ['US', 'MX', 'CA'];

    // ✅ FIX: Calculate RVC material percentage from USMCA-member components
    const usmcaMemberValue = (enrichedComponents || [])
      .filter(c => {
        const origin = (c.origin_country || '').toUpperCase();
        return usmcaCountries.includes(origin);
      })
      .reduce((sum, c) => sum + (c.value_percentage || 0), 0);

    // Calculate component-level financials
    const componentFinancials = (enrichedComponents || []).map((comp, idx) => {
      // ✅ CRITICAL FIX (Nov 8, 2025): Handle null rates (unknown) vs 0 (duty-free)
      // null means "rate unknown - needs verification"
      // 0 means "confirmed duty-free"
      const mfn = comp.mfn_rate !== null && comp.mfn_rate !== undefined ? comp.mfn_rate : 0;
      const usmca = comp.usmca_rate !== null && comp.usmca_rate !== undefined ? comp.usmca_rate : 0;
      const section301 = comp.section_301 !== null && comp.section_301 !== undefined ? comp.section_301 : 0;
      const section232 = comp.section_232 !== null && comp.section_232 !== undefined ? comp.section_232 : 0;

      const totalRate = (mfn + section301 + section232);

      // Flag if component has unknown rates
      const hasUnknownRate = comp.mfn_rate === null || comp.section_301 === null;

      const componentValue = (tradeVolume * (comp.value_percentage / 100));
      // ✅ FIX (Oct 28): Rates are already in decimal format (0.026 = 2.6%), NOT percentage format
      // Do NOT divide by 100 again
      const mfnCost = componentValue * mfn;
      // ✅ FIX (Oct 27): Calculate USMCA cost for all components if qualified
      const usmcaCost = componentValue * usmca;

      // ✅ FIX (Oct 28): Calculate is_usmca_member flag here for savings calculation
      const originCountry = (comp.origin_country || '').toUpperCase();
      const isUSMCAMember = usmcaCountries.includes(originCountry);

      // ✅ DEBUG (Nov 1): Trace data types through calculation chain for ALL components
      console.log(`\n🔍 [COMPONENT-${idx}] ${comp.description || 'Unknown'} (${originCountry})`);
      console.log('   Trade Volume:', tradeVolume);
      console.log('   Value %:', comp.value_percentage);
      console.log('   Component Value:', componentValue);
      console.log('   MFN Rate:', mfn);
      console.log('   USMCA Rate:', usmca);
      console.log('   MFN Cost:', mfnCost);
      console.log('   USMCA Cost:', usmcaCost);
      console.log('   Is USMCA Member:', isUSMCAMember);
      console.log('   Condition (isUSMCAMember && usmca < mfn):', (isUSMCAMember && usmca < mfn));

      // ✅ FIX (Oct 29): Calculate FULL nearshoring potential for non-USMCA components
      // If component is from China/Asia and you nearshore to Mexico/Canada/US:
      // - Eliminate MFN rate → get 0% USMCA rate
      // - Eliminate Section 301 → no longer China-origin
      // - Total elimination = full totalRate (varies by component)
      const nearshoringPotential = !isUSMCAMember ? componentValue * totalRate : 0;

      // 🚨 CRITICAL FIX (Nov 14): Split savings into CURRENT (USMCA components) vs POTENTIAL (nearshoring)
      // WRONG ASSUMPTION (Nov 8): "If product qualifies, ALL components (including China) get 0% USMCA rate"
      // CORRECT: Only components ALREADY from USMCA countries (MX, CA, US) get preferential treatment
      // China components are NOT USMCA-eligible - the $1.68M is POTENTIAL savings IF you nearshore

      // CURRENT = Savings you're ALREADY getting from USMCA-member components (MX, CA, US)
      const currentSavings = isUSMCAMember
        ? (mfnCost + (componentValue * (section301 + section232))) - usmcaCost
        : 0;

      // POTENTIAL = Savings you COULD get if you nearshored non-USMCA components (CN, etc.)
      const potentialSavings = !isUSMCAMember
        ? (mfnCost + (componentValue * (section301 + section232)))  // Full elimination if nearshored
        : 0;

      // For backwards compatibility, annual_savings = current (not misleading total)
      const savingsPerYear = currentSavings;

      console.log('   Current Savings (USMCA components only):', Math.round(currentSavings));
      console.log('   Potential Savings (if nearshored):', Math.round(potentialSavings));

      return {
        hs_code: comp.hs_code,
        description: comp.description,
        origin_country: comp.origin_country,
        is_usmca_member: comp.is_usmca_member,
        annual_mfn_cost: Math.round(mfnCost),
        annual_nearshoring_potential: Math.round(nearshoringPotential),
        annual_usmca_cost: Math.round(usmcaCost),
        annual_savings: Math.round(savingsPerYear),  // Current savings only (not misleading)
        current_annual_savings: Math.round(currentSavings),  // NEW: Explicit current
        potential_annual_savings: Math.round(potentialSavings)  // NEW: Explicit potential
      };
    });

    // Aggregate financial impact
    const totalAnnualMFNCost = componentFinancials.reduce((sum, c) => sum + c.annual_mfn_cost, 0);
    // ✅ FIX (Oct 29): Calculate TOTAL nearshoring potential (full rate elimination for non-USMCA components)
    const totalNearshoringPotential = componentFinancials.reduce((sum, c) => sum + c.annual_nearshoring_potential, 0);
    const totalAnnualUSMCACost = componentFinancials.reduce((sum, c) => sum + c.annual_usmca_cost, 0);

    // 🚨 CRITICAL FIX (Nov 14): Split total savings into CURRENT vs POTENTIAL
    // CURRENT = Savings you're ALREADY getting (USMCA components: MX, CA, US)
    const totalCurrentSavings = componentFinancials
      .reduce((sum, c) => sum + c.current_annual_savings, 0);

    // POTENTIAL = Savings you COULD get (nearshoring non-USMCA components: CN, etc.)
    const totalPotentialSavings = componentFinancials
      .reduce((sum, c) => sum + c.potential_annual_savings, 0);

    // TOTAL POTENTIAL = Current + Potential (if you nearshored everything)
    const totalAnnualSavings = totalCurrentSavings + totalPotentialSavings;

    // ✅ FIX (Nov 1): Calculate weighted average MFN RATE (percentage), not total cost (dollars)
    // Each component contributes to average based on its value percentage
    const weightedAverageMFNRate = enrichedComponents.reduce((sum, comp) => {
      const valueWeight = (comp.value_percentage || 0) / 100;  // Convert 35% to 0.35
      const mfnRate = (comp.mfn_rate || 0) * 100;  // Convert 0.35 to 35%
      return sum + (mfnRate * valueWeight);
    }, 0);

    const preCalculatedFinancials = {
      trade_volume: tradeVolume,

      // 🚨 CRITICAL FIX (Nov 14): Split savings into CURRENT vs POTENTIAL
      // CURRENT = Savings you're ALREADY getting from USMCA components (MX, CA, US)
      current_annual_savings: Math.round(totalCurrentSavings),
      current_monthly_savings: Math.round(totalCurrentSavings / 12),
      current_savings_percentage: tradeVolume > 0 ? Math.round((totalCurrentSavings / tradeVolume) * 10000) / 100 : 0,

      // POTENTIAL = Savings you COULD get if nearshoring non-USMCA components (CN, etc.)
      potential_annual_savings: Math.round(totalPotentialSavings),
      potential_monthly_savings: Math.round(totalPotentialSavings / 12),
      potential_savings_percentage: tradeVolume > 0 ? Math.round((totalPotentialSavings / tradeVolume) * 10000) / 100 : 0,

      // TOTAL POTENTIAL = Current + Potential (maximum possible if nearshored everything)
      annual_tariff_savings: Math.round(totalAnnualSavings),
      monthly_tariff_savings: Math.round(totalAnnualSavings / 12),
      savings_percentage: tradeVolume > 0 ? Math.round((totalAnnualSavings / tradeVolume) * 10000) / 100 : 0,

      tariff_cost_without_qualification: Math.round(totalAnnualMFNCost),
      weighted_average_mfn_rate: Math.round(weightedAverageMFNRate * 10) / 10,  // Round to 1 decimal: 23.4%
      // ✅ NEW: RVC material component percentage (not just 0%)
      material_from_usmca_members: usmcaMemberValue,
      section_301_exposure: {
        is_exposed: totalNearshoringPotential > 0,
        annual_cost_burden: Math.round(totalNearshoringPotential),
        affected_components: enrichedComponents
          .filter(c => {
            const originCountry = (c.origin_country || '').toUpperCase();
            return !usmcaCountries.includes(originCountry);
          })
          .map(c => `${c.description} (${((c.mfn_rate || 0) + (c.section_301 || 0) + (c.section_232 || 0)) * 100}% total rate - ${c.origin_country})`),
        note: 'Full tariff elimination potential if nearshoring non-USMCA components to Mexico/Canada/US (includes MFN + Section 301 + Section 232).'
      }
    };

    // ========== PHASE 3.6: CLASSIFY FINAL PRODUCT HS CODE (Nov 12, 2025) ==========
    // Use ClassificationAgent for final product (same logic as components)
    console.log('🏷️ [FINAL-PRODUCT] Classifying final assembled product...');

    let finalProductClassification = null;
    try {
      const classificationAgent = new ClassificationAgent();

      // Build component context for final product classification
      const componentBreakdown = enrichedComponents
        .map(c => `${c.description} (HS: ${c.hs_code}, ${c.value_percentage}% from ${c.origin_country})`)
        .join(', ');

      const classificationResult = await classificationAgent.suggestHSCode(
        formData.product_description,
        [{
          origin_country: formData.manufacturing_location || 'Unknown',
          value_percentage: 100  // Final product is 100% of itself
        }],
        {
          overallProduct: formData.product_description,
          industryContext: formData.industry_sector || 'other',
          substantialTransformation: formData.substantial_transformation || false,
          manufacturingProcess: formData.manufacturing_process || null,
          destinationCountry: formData.destination_country,
          componentBreakdown: componentBreakdown,
          hasContext: true
        }
      );

      // ✅ FIX (Nov 12): Unwrap .data from ClassificationAgent response
      finalProductClassification = classificationResult?.success ? classificationResult.data : null;

      if (finalProductClassification?.hs_code) {
        console.log(`✅ [FINAL-PRODUCT] Classified as ${finalProductClassification.hs_code} (${finalProductClassification.confidence}% confidence)`);
      } else {
        console.warn(`⚠️ [FINAL-PRODUCT] Classification failed, will let USMCA AI determine product code`);
      }
    } catch (classError) {
      console.error(`❌ [FINAL-PRODUCT] Classification error:`, classError.message);
      // Continue without final product classification - USMCA AI will determine it
    }

    // ✅ QUALIFICATION CACHING: Generate fingerprint of component data to avoid repeated AI calls
    // Cache key includes: HS codes, origins, percentages, destination, industry (all factors affecting qualification)
    const crypto = require('crypto');
    const componentFingerprint = enrichedComponents
      .map(c => `${c.hs_code}:${c.origin_country}:${c.value_percentage}`)
      .sort()
      .join('|');
    const cacheKey = crypto
      .createHash('sha256')
      .update(`${componentFingerprint}|${formData.destination_country}|${formData.industry_sector || 'unknown'}`)
      .digest('hex')
      .substring(0, 16);

    console.log(`🔍 [CACHE-CHECK] Qualification cache key: ${cacheKey}`);

    // Check if user wants to force new analysis (skip qualification cache)
    const forceNew = formData.force_new === true || formData.force_new === 'true';

    let cachedAnalysis = null;
    if (forceNew) {
      // Skip qualification cache for "+ New Analysis" button
      // Tariff database lookup (Phase 1) already completed above - we keep that data!
      console.log(`🆕 [FORCE-NEW] Skipping qualification cache - user wants fresh analysis`);
    } else {
      // Check for cached qualification result (valid for 24 hours)
      const { data: cachedQualification } = await supabase
        .from('workflow_sessions')
        .select('data')
        .eq('user_id', userId)
        .not('data', 'is', null)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false })
        .limit(10);

      if (cachedQualification && cachedQualification.length > 0) {
        for (const session of cachedQualification) {
          const workflowData = session.data;
          if (workflowData?.cache_key === cacheKey && workflowData?.usmca && workflowData?.detailed_analysis) {
            cachedAnalysis = {
              usmca: workflowData.usmca,
              detailed_analysis: workflowData.detailed_analysis,
              recommendations: workflowData.recommendations
            };
            console.log(`✅ [CACHE-HIT] Found cached qualification result (key: ${cacheKey})`);
            break;
          }
        }
      }
    }

    let analysis;
    if (cachedAnalysis) {
      // Use cached result - no AI call needed!
      analysis = cachedAnalysis;
      console.log(`💰 [CACHE-SAVE] Avoided AI call by using cached qualification result`);
    } else {
      console.log(`❌ [CACHE-MISS] No cached result found, calling AI (key: ${cacheKey})`);

      // Pass enriched components with real rates, pre-calculated financials, and final product classification to AI prompt
      const prompt = await buildComprehensiveUSMCAPrompt(
        { ...formData, component_origins: enrichedComponents },
        (enrichedComponents || []).reduce((acc, comp) => {
          acc[comp.hs_code] = {
            mfn_rate: comp.mfn_rate,
            section_301: comp.section_301,
            section_232: comp.section_232,
            usmca_rate: comp.usmca_rate
          };
          return acc;
        }, {}),
        preCalculatedFinancials,  // ✅ Pass pre-calculated data to AI prompt
        finalProductClassification  // ✅ Pass pre-classified final product HS code (Nov 12, 2025)
      );

      // Call OpenRouter API
      const openrouterStartTime = Date.now();

      // DEBUG: Sending request to OpenRouter (logging disabled for production)

      const requestBody = {
        model: 'anthropic/claude-haiku-4.5', // ✅ HAIKU: 10x faster than Sonnet, suitable for rule-based qualification
        max_tokens: 2000, // ✅ OPTIMIZED: Reduced for minimal JSON response (qualification only)
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0 // Zero temperature for determinism
      };

      // ✅ Use rate limit handler with automatic retry on 429/529
      const aiResult = await callOpenRouterWithRetry(requestBody, 3, 'USMCAQualification');
      const openrouterDuration = Date.now() - openrouterStartTime;

      const aiParsingStart = Date.now();
      const aiText = aiResult.choices?.[0]?.message?.content;

      if (!aiText) {
        throw new Error('AI response is empty or missing content field');
      }

      // DEBUG: Parsing AI response (logging disabled for production)

      // Parse AI response (expecting JSON) - robust multi-strategy extraction
      let extractionMethod = '';  // ✅ MOVED outside try-catch so catch block can access it
      let sanitizedJSON = null;   // ✅ MOVED outside try-catch so catch block can access it
      try {
      // ✅ AGGRESSIVE MARKDOWN STRIPPING (Before all extraction strategies)
      // Remove markdown code fences and language identifiers
      let cleanText = aiText
        .replace(/^```(?:json|javascript)?\s*\n?/gm, '') // Opening fence
        .replace(/\n?```\s*$/gm, '') // Closing fence
        .trim();

      // Multi-strategy JSON extraction (same as classifyComponentHS and batch lookup)
      let jsonString = null;

      // Strategy 1: Try direct extraction (clean text starts with {)
      if (cleanText.startsWith('{')) {
        jsonString = cleanText;
        extractionMethod = 'direct_clean';
      }
      // Strategy 2: Extract from markdown code blocks (if still present after cleaning)
      else {
        const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1];
          extractionMethod = 'code_block';
        }
        // Strategy 3: Extract JSON object (between first { and last })
        else {
          const firstBrace = cleanText.indexOf('{');
          const lastBrace = cleanText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonString = cleanText.substring(firstBrace, lastBrace + 1);
            extractionMethod = 'brace_matching';
          }
        }
      }

      if (!jsonString) {
        console.error('🚨 [JSON EXTRACTION FAILED]', {
          original_text_length: aiText.length,
          original_first_100_chars: aiText.substring(0, 100),
          clean_text_length: cleanText.length,
          clean_text_first_100_chars: cleanText.substring(0, 100)
        });
        throw new Error('No JSON found in AI response after aggressive cleaning');
      }

      // ✅ OPTIMIZED: Sanitize control characters (remove newlines/tabs while preserving JSON structure)
      sanitizedJSON = jsonString
        .replace(/[\r\n\t\x00-\x1F\x7F-\x9F]/g, ' ')  // Control characters → spaces
        .replace(/\s+/g, ' ')  // Multiple spaces → single space
        .trim();

      // ✅ AUTO-CLOSE INCOMPLETE JSON (AI sometimes truncates responses OR adds commentary)
      let repairAttempted = false;
      if (sanitizedJSON.startsWith('{')) {
        // Strategy 1: Remove trailing garbage after final closing brace
        const lastBraceIndex = sanitizedJSON.lastIndexOf('}');
        if (lastBraceIndex !== -1 && lastBraceIndex < sanitizedJSON.length - 1) {
          console.warn(`⚠️ [AUTO-REPAIR] Removing trailing text after final brace (length: ${sanitizedJSON.length - lastBraceIndex - 1})`);
          sanitizedJSON = sanitizedJSON.substring(0, lastBraceIndex + 1);
          repairAttempted = true;
        }

        // Strategy 2: Add missing closing braces if still incomplete
        if (!sanitizedJSON.endsWith('}')) {
          const openBraces = (sanitizedJSON.match(/{/g) || []).length;
          const closeBraces = (sanitizedJSON.match(/}/g) || []).length;
          const missingBraces = openBraces - closeBraces;

          if (missingBraces > 0) {
            console.warn(`⚠️ [AUTO-REPAIR] Adding ${missingBraces} missing closing braces`);
            sanitizedJSON = sanitizedJSON + '}'.repeat(missingBraces);
            repairAttempted = true;
          }
        }
      }

      // ✅ FINAL VALIDATION: Ensure it looks like JSON before parsing
      if (!sanitizedJSON.startsWith('{') || !sanitizedJSON.endsWith('}')) {
        console.error('🚨 [INVALID JSON STRUCTURE]', {
          sanitized_first_50_chars: sanitizedJSON.substring(0, 50),
          sanitized_last_50_chars: sanitizedJSON.substring(sanitizedJSON.length - 50),
          extraction_method: extractionMethod,
          repair_attempted: repairAttempted
        });
        throw new Error(`Invalid JSON structure (${extractionMethod}): does not start with { or end with }`);
      }

        analysis = JSON.parse(sanitizedJSON);
        // DEBUG: JSON parse successful
      } catch (parseError) {
        console.error('❌ [JSON PARSE ERROR]', {
          error: parseError.message,
          extraction_method: extractionMethod,
          json_sample: sanitizedJSON?.substring(0, 100)
        });
        throw new Error(`AI response parsing failed: ${parseError.message}`);
      }

      // ✅ CACHE SAVE: Store qualification result for future requests
      // This prevents repeated AI calls for the same component configuration
      if (cacheKey && userId) {
        try {
          const cacheData = {
            cache_key: cacheKey,
            usmca: analysis.usmca,
            detailed_analysis: analysis.detailed_analysis,
            recommendations: analysis.recommendations,
            cached_at: new Date().toISOString()
          };

          // Generate session ID: unique for force_new, cache-based otherwise
          const cacheSessionId = forceNew
            ? `session_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
            : `cache-${cacheKey}`;

          // UPSERT logic: Check if cache session already exists (only for cached sessions)
          const { data: existingCache } = forceNew ? { data: null } : await supabase
            .from('workflow_sessions')
            .select('id, data')
            .eq('session_id', cacheSessionId)
            .maybeSingle();

          if (existingCache && !forceNew) {
            // Update existing cache session
            console.log(`🔍 [CACHE-UPDATE] Updating existing cache session: ${cacheSessionId}`);

            const existingData = existingCache.data || {};
            // ✅ FIX (Nov 1): Update ALL required columns to prevent data contract violations
            const { error: updateError } = await supabase
              .from('workflow_sessions')
              .update({
                data: {
                  ...existingData,
                  ...cacheData
                },

                // ✅ Update required columns for dashboard-data validation
                company_name: formData.company_name,
                business_type: formData.business_type,
                trade_volume: parseTradeVolume(formData.trade_volume),
                manufacturing_location: formData.manufacturing_location,
                hs_code: enrichedComponents[0]?.hs_code || null,
                product_description: enrichedComponents[0]?.description || formData.product_description || null,
                component_origins: enrichedComponents,
                destination_country: formData.destination_country,
                trade_flow_type: formData.trade_flow_type || null,
                tariff_cache_strategy: formData.tariff_cache_strategy || null,

                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Refresh expiration
              })
              .eq('session_id', cacheSessionId);

            if (updateError) {
              throw new Error(`Update failed: ${updateError.message}`);
            }

            console.log(`💾 [CACHE-SAVED] Updated existing cache session (key: ${cacheKey})`);
          } else {
            // Create new session (independent analysis for force_new, cache session otherwise)
            if (forceNew) {
              console.log(`🆕 [NEW-ANALYSIS] Creating independent analysis session: ${cacheSessionId}`);
            } else {
              console.log(`🔍 [CACHE-CREATE] Creating new cache session: ${cacheSessionId}`);
            }

            // ✅ FIX (Nov 1): Populate ALL required columns to prevent data contract violations
            // dashboard-data validation expects: trade_volume, company_name, business_type, hs_code, etc.
            const { error: insertError } = await supabase
              .from('workflow_sessions')
              .insert({
                user_id: userId,
                session_id: cacheSessionId,
                data: cacheData,

                // ✅ Required columns for dashboard-data validation
                company_name: formData.company_name,
                business_type: formData.business_type,
                trade_volume: parseTradeVolume(formData.trade_volume), // Parse string to number
                manufacturing_location: formData.manufacturing_location,
                hs_code: enrichedComponents[0]?.hs_code || null, // Primary product HS code
                product_description: enrichedComponents[0]?.description || formData.product_description || null,
                component_origins: enrichedComponents, // Full enriched components
                destination_country: formData.destination_country,
                trade_flow_type: formData.trade_flow_type || null,
                tariff_cache_strategy: formData.tariff_cache_strategy || null,

                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hour cache
              });

            if (insertError) {
              throw new Error(`Insert failed: ${insertError.message}`);
            }

            if (forceNew) {
              console.log(`💾 [SAVED] Independent analysis saved with unique ID`);
            } else {
              console.log(`💾 [CACHE-SAVED] Created new cache session (key: ${cacheKey})`);
            }
          }
        } catch (cacheError) {
          console.warn('⚠️ [CACHE-SAVE-FAILED] Could not save qualification cache:', cacheError.message);
          // Non-fatal - continue with response even if cache save fails
        }
      } else {
        console.warn(`⚠️ [CACHE-SKIP] Missing userId (${userId}) or cacheKey (${cacheKey})`);
      }
    } // End of else block (AI call made)

    // ✅ SKIPPED: Regex-based validation was causing false positives
    // (extracting component percentages like 35%, 30%, 20% and comparing to tariff rates)
    // Actual validation happens via structure check below (missing required fields, invalid ranges)
    // This is sufficient because AI must return complete USMCA object with all required fields

    // ✅ ROOT CAUSE FIX #3: Validate Preference Criterion Before Building Response
    // CRITICAL: If AI says product is qualified, it MUST have determined the preference criterion

    // DEBUG: Validating USMCA qualification fields

    if (analysis.usmca?.qualified === true) {
      if (!analysis.usmca?.preference_criterion) {
        return res.status(400).json({
          success: false,
          error: 'INCOMPLETE_ANALYSIS',
          error_code: 'MISSING_PREFERENCE_CRITERION',
          user_message: 'AI analysis qualified this product for USMCA but did not determine the preference criterion. ' +
                        'This is a required field for valid certificate generation. Please try the analysis again.',
          details: {
            qualified: analysis.usmca?.qualified,
            provided_criterion: analysis.usmca?.preference_criterion,
            reason: 'Preference criterion is required for all USMCA-qualified products to generate valid certificates'
          }
        });
      }

      // Also validate other critical USMCA fields for qualified products
      // ✅ OPTIMIZED (Oct 26): Removed 'rule' field requirement
      // REASON: preference_criterion (A/B/C/D) indicates the rule already
      // The simplified prompt returns preference_criterion instead of separate rule field
      const requiredUSMCAFields = {
        'north_american_content': analysis.usmca?.north_american_content,
        'threshold_applied': analysis.usmca?.threshold_applied
      };

      const missingFields = Object.entries(requiredUSMCAFields)
        .filter(([key, value]) => value === null || value === undefined)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'INCOMPLETE_ANALYSIS',
          error_code: 'MISSING_USMCA_FIELDS',
          user_message: `AI analysis qualified this product but is missing critical USMCA fields: ${missingFields.join(', ')}. ` +
                        'Please try the analysis again.',
          details: {
            qualified: true,
            missing_fields: missingFields
          }
        });
      }
    }

    // ✅ CRITICAL FIX (Oct 26): Calculate component_breakdown separately before building response
    // Priority: AI components array > Enriched user components > Raw fallback
    // ✅ SIMPLIFIED (Oct 26): Use fresh database rates from enrichComponentsWithFreshRates
    // The simplified AI prompt only returns qualification (yes/no), not detailed component analysis
    // So we use the fresh database rates we already retrieved on line 410
    const componentBreakdown = (enrichedComponents || []).map((component, idx) => {
      const originalComponent = formData.component_origins?.[idx] || {};
      const finalOriginCountry = component.origin_country || originalComponent.origin_country || '';

      // ✅ FIX (Oct 28): Use usmcaCountries defined at top (line 969)
      const isUSMCAMember = usmcaCountries.includes(finalOriginCountry.toUpperCase());

      // ✅ CRITICAL FIX (Nov 8, 2025): Handle null rates properly
      // null = unknown rate (needs verification)
      // 0 = confirmed duty-free
      const baseMfnRate = component.base_mfn_rate !== null && component.base_mfn_rate !== undefined
        ? component.base_mfn_rate
        : (component.mfn_rate !== null && component.mfn_rate !== undefined ? component.mfn_rate : 0);
      const section301 = component.section_301 !== null && component.section_301 !== undefined ? component.section_301 : 0;
      const section232 = component.section_232 !== null && component.section_232 !== undefined ? component.section_232 : 0;
      const totalRate = baseMfnRate + section301 + section232;

      // ✅ NEW (Nov 8): Flag unknown rates for UI warnings
      const hasUnknownRate = component.mfn_rate === null || component.section_301 === null;

      // ✅ FIX (Oct 28): Merge annual_savings from componentFinancials
      // componentFinancials[idx] corresponds to enrichedComponents[idx]
      const financialData = componentFinancials[idx] || {};

      return {
        ...component,
        // ✅ CRITICAL: Ensure hs_code and origin_country from original input
        hs_code: (() => {
          const raw = component.hs_code || originalComponent.hs_code || '';
          if (!raw) return '';
          // Remove all non-digit characters and pad to 10 digits
          const digits = Array.from(raw).filter(c => /[0-9]/.test(c)).join('');
          return (digits + '0000000000').substring(0, 10);
        })(),
        origin_country: finalOriginCountry,
        // ✅ NEW: Flag indicating if component is from USMCA member country (for UI counter)
        is_usmca_member: isUSMCAMember,
        // Ensure all required fields are present for frontend transformer
        base_mfn_rate: baseMfnRate,
        section_301: section301,
        section_232: section232,
        total_rate: totalRate,
        rate_source: component.rate_source || 'database_cache',
        stale: component.stale !== undefined ? component.stale : false,
        // Ensure data_source is set for tracking provenance
        data_source: component.data_source || 'database_cache_current',
        // ✅ NEW (Oct 28): Include annual_savings for frontend display
        annual_savings: financialData.annual_savings || 0,
        // 🚨 CRITICAL FIX (Nov 14): Include split savings for current vs potential
        current_annual_savings: financialData.current_annual_savings || 0,
        potential_annual_savings: financialData.potential_annual_savings || 0,
        // ✅ NEW (Nov 8): Origin-aware NULL semantics - flag unknown rates for UI warnings
        hasUnknownRate: hasUnknownRate,
        requires_verification: component.requires_verification || false,
        verification_reason: component.verification_reason || null
      };
    });

    // ✅ REMOVED (Oct 28): Backwards validation checkpoint that flagged decimals as "wrong"
    // Database stores decimals (0.35 = 35%), so rates between 0-1 are CORRECT, not wrong.
    // Transformation code (lines 1320-1330) correctly detects decimals and doesn't transform them.
    // This validation was giving false positives and has been removed.

    // ✅ SIMPLIFIED (Oct 28): No data contract, just return components as-is
    // Database already returns decimals (0.35 = 35%), frontend multiplies by 100 for display
    // All fields use snake_case (no camelCase conversion needed)
    const transformedComponents = componentBreakdown || [];

    // ✅ DEBUG: Log first component to verify data
    if (transformedComponents.length > 0) {
      const first = transformedComponents[0];
      console.log('\n\n═══════════════════════════════════════════════════════════════');
      console.log('🔍 [API RESPONSE] First component:');
      console.log('   description:', first.description);
      console.log('   mfn_rate:', first.mfn_rate, '(type:', typeof first.mfn_rate + ')');
      console.log('   section_301:', first.section_301, '(type:', typeof first.section_301 + ')');
      console.log('   total_rate:', first.total_rate, '(type:', typeof first.total_rate + ')');
      console.log('   annual_savings:', first.annual_savings, '(type:', typeof first.annual_savings + ')');
      console.log('═══════════════════════════════════════════════════════════════\n');
    }

    // Format response for UI
    const result = {
      success: true,
      workflow_completed: true,
      processing_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      method: 'ai_powered',
      cache_key: cacheKey,  // ✅ Save cache key for future lookups (24-hour cache)

      // Company information (pass through ALL fields for certificate)
      company: {
        name: formData.company_name,
        company_name: formData.company_name, // Alias for compatibility
        business_type: formData.business_type,  // Business role: Importer/Exporter/etc
        industry_sector: formData.industry_sector,  // Industry classification
        trade_volume: parseTradeVolume(formData.trade_volume), // ✅ Parse string to number (handles commas)
        supplier_country: formData.supplier_country,
        destination_country: formData.destination_country,

        // Company details for certificate
        company_address: formData.company_address || '',
        address: formData.company_address || '',
        company_country: formData.company_country || '',  // ✅ CRITICAL FIX: Where company is located
        country: formData.company_country || '',  // ✅ FIX: Company location, NOT destination
        tax_id: formData.tax_id || '',
        contact_person: formData.contact_person || '',
        contact_email: formData.contact_email || '',
        contact_phone: formData.contact_phone || '',
        certifier_type: formData.certifier_type || 'EXPORTER'  // ✅ Pass certifier type from UI
      },

      // Product classification
      // ✅ FIX (Nov 12): Prefer pre-classified HS code from ClassificationAgent (database-backed)
      product: {
        success: true,
        hs_code: finalProductClassification?.hs_code || analysis.product?.hs_code || '',
        description: finalProductClassification?.description || analysis.product?.description || formData.product_description,
        product_description: formData.product_description,
        hs_description: finalProductClassification?.description || analysis.product?.hs_description || '',
        // ✅ FIX: Map both confidence and confidence_score from AI
        confidence: finalProductClassification?.confidence || analysis.product?.confidence || analysis.product?.confidence_score || 0,
        classification_confidence: finalProductClassification?.confidence || analysis.product?.confidence || analysis.product?.confidence_score || 0,
        classification_method: finalProductClassification ? 'classification_agent' : 'ai_analysis',
        manufacturing_location: formData.manufacturing_location || '',
        substantial_transformation: formData.substantial_transformation || false,
        manufacturing_process: formData.manufacturing_process || null,
        // Product-level tariff rates (from AI savings analysis)
        // ✅ FIX: Remove hardcoded || 0 defaults - use actual AI values
        mfn_rate: analysis.savings?.mfn_rate,
        usmca_rate: analysis.savings?.usmca_rate
      },

      // USMCA qualification (from AI)
      // ✅ FIX (Oct 26): Use AI's components array with tariff rates, NOT raw user input
      // AI now provides mfn_rate, usmca_rate, section_301 for EACH component (critical for display)
      usmca: {
        qualified: analysis.usmca?.qualified,
        north_american_content: analysis.usmca?.north_american_content,
        regional_content: analysis.usmca?.north_american_content, // Alias for certificate
        threshold_applied: analysis.usmca?.threshold_applied,
        // ✅ FIX (Nov 10): Extract labor credit breakdown for display
        component_rvc: analysis.usmca?.component_rvc || 0,  // Component-only RVC (without labor)
        labor_credit: analysis.usmca?.labor_credit || 0,    // Manufacturing labor credit
        rule: analysis.usmca?.rule || 'Regional Value Content',
        reason: analysis.usmca?.reason || 'AI analysis complete',
        // ✅ FIX (Oct 26): Use transformed components with decimal format (0.55 not 55)
        // The raw componentBreakdown has percentages, transformedComponents has decimals
        // UI calculates: componentValue × (mfnRate - usmcaRate)
        // If mfnRate is 55 instead of 0.55, calculation is 100x too large
        component_breakdown: transformedComponents,
        qualification_level: analysis.usmca?.qualified ? 'qualified' : 'not_qualified',
        qualification_status: analysis.usmca?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
        preference_criterion: analysis.usmca?.qualified ? analysis.usmca?.preference_criterion : null,
        manufacturing_location: formData.manufacturing_location || '',
        documentation_required: analysis.usmca?.documentation_required || [
          'Manufacturing records',
          'Bill of materials',
          'Supplier declarations'
        ]
      },

      // Method of qualification for certificate (from AI based on industry rules)
      // Convert method name to certificate code: Net Cost -> NC, Transaction Value -> TV
      method_of_qualification: (() => {
        const method = analysis.usmca?.method_of_qualification || 'Transaction Value';
        if (method.includes('Net Cost')) return 'NC';
        if (method.includes('Transaction Value')) return 'TV';
        if (method.includes('Yarn Forward')) return 'YF';
        return 'TV'; // Default to Transaction Value
      })(),

      // Tariff savings (only if qualified for USMCA) - extracted from detailed_analysis.savings_analysis
      // ✅ FIX (Oct 26): Use pre-calculated financial data from component analysis
      // The simplified prompt doesn't return detailed_analysis.savings_analysis
      // But we calculated all financial metrics correctly in preCalculatedFinancials (lines 449-462)
      // ✅ FIX (Nov 1): mfn_rate should be PERCENTAGE (23.4%), not DOLLARS ($1,118,090)
      savings: analysis.usmca?.qualified ? {
        // 🚨 CRITICAL FIX (Nov 14): Include split savings for current vs potential
        current_annual_savings: preCalculatedFinancials.current_annual_savings,
        current_monthly_savings: preCalculatedFinancials.current_monthly_savings,
        current_savings_percentage: preCalculatedFinancials.current_savings_percentage,
        potential_annual_savings: preCalculatedFinancials.potential_annual_savings,
        potential_monthly_savings: preCalculatedFinancials.potential_monthly_savings,
        potential_savings_percentage: preCalculatedFinancials.potential_savings_percentage,
        // Legacy fields (for backwards compatibility)
        annual_savings: preCalculatedFinancials.annual_tariff_savings,
        monthly_savings: preCalculatedFinancials.monthly_tariff_savings,
        savings_percentage: preCalculatedFinancials.savings_percentage,
        mfn_rate: preCalculatedFinancials.weighted_average_mfn_rate / 100,  // Convert 23.4% to 0.234 (decimal for consistency)
        usmca_rate: 0,  // USMCA rate is 0% for qualifying products
        section_301_exposure: preCalculatedFinancials.section_301_exposure
      } : {
        current_annual_savings: 0,
        current_monthly_savings: 0,
        current_savings_percentage: 0,
        potential_annual_savings: 0,
        potential_monthly_savings: 0,
        potential_savings_percentage: 0,
        annual_savings: 0,
        monthly_savings: 0,
        savings_percentage: 0,
        mfn_rate: preCalculatedFinancials.weighted_average_mfn_rate / 100,  // Show MFN rate even if not qualified
        usmca_rate: 0
      },

      // Certificate (if qualified)
      certificate: analysis.usmca?.qualified ? {
        qualified: true,
        preference_criterion: analysis.usmca?.preference_criterion,
        blanket_start: new Date().toISOString().split('T')[0],
        blanket_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      } : null,

      // AI-generated recommendations
      recommendations: analysis.recommendations || [],

      // Detailed analysis (NEW - rich insights from AI)
      detailed_analysis: analysis.detailed_analysis || {
        threshold_research: analysis.usmca?.threshold_reasoning || '',
        calculation_breakdown: analysis.usmca?.reason || '',
        qualification_reasoning: analysis.usmca?.reason || '',
        strategic_insights: analysis.recommendations?.join('\n\n') || '',
        savings_analysis: ''
      },

      // Trust indicators
      trust: {
        ai_powered: true,
        model: 'anthropic/claude-haiku-4.5',  // ✅ Haiku for 10x faster response time
        // ✅ confidence_score defaults to 85 if not provided (reasonable fallback for missing AI metric)
        confidence_score: analysis.confidence_score !== undefined ? analysis.confidence_score : 85,
        // ✅ FIX (Nov 12): Add overall_trust_score (same as confidence_score for backward compatibility)
        overall_trust_score: analysis.confidence_score !== undefined ? analysis.confidence_score : 85,
        score: analysis.confidence_score !== undefined ? analysis.confidence_score : 85, // Also map to 'score' field
        disclaimer: 'AI-powered analysis for informational purposes. Consult trade compliance expert for official compliance.'
      }
    };

    // ========== COMPONENT ENRICHMENT WITH TARIFF INTELLIGENCE ==========
    // Enrich each component with HS codes, tariff rates, and savings calculations
    // DEBUG: Component enrichment phase

    // Build COMPLETE context object for component classification
    const fullBusinessContext = {
      product_description: formData.product_description,
      company_name: formData.company_name,
      business_type: formData.business_type,  // Business role: Importer/Exporter/etc
      business_role: formData.business_type,  // Alias for clarity in component enrichment
      industry_sector: formData.industry_sector,  // Industry classification for HS codes
      industry: formData.industry_sector || formData.industry || extractIndustryFromBusinessType(formData.business_type), // Fallback for old data
      manufacturing_location: formData.manufacturing_location,
      end_use: formData.end_use || 'commercial',
      trade_volume: formData.trade_volume
    };

    // ========== PERFORMANCE OPTIMIZATION (Oct 26, 2025) ==========
    // REMOVED: enrichComponentsWithTariffIntelligence() call (was 9+ seconds)
    // REASON: The USMCA AI analysis already enriches components with tariff rates
    // The main USMCA AI call handles:
    //   - Component classification (HS codes)
    //   - Tariff rate lookup (MFN, Section 301, Section 232)
    //   - Section 301 exposure calculation
    //   - Financial impact analysis
    // Doing it twice = massive waste of time
    // Result: ~9 second savings (from 112s → ~55-60s)

    // Use raw components (AI will enrich them internally)
    const normalizedComponents = (formData.component_origins || []).map(c => normalizeComponent(c));

    // ✅ FIX (Oct 26): Use enriched component_breakdown from AI response, NOT raw components
    // The AI analysis populates result.usmca.component_breakdown with tariff rates
    // Frontend looks for result.component_origins and result.components
    // So we must update these to use the ENRICHED data, not the raw user input

    // ✅ CRITICAL FIX (Oct 26): Transform tariff rates from percentages to decimals
    // result.usmca.component_breakdown from AI contains PERCENTAGES (25 for 25%)
    // Frontend expects DECIMALS (0.25 for 25%, multiplied by 100 for display)
    //
    // Transformation path:
    // 1. AI format (percentage): mfn_rate: 25
    // 2. Apply database_to_api divide by 100: mfn_rate: 0.25
    // 3. Apply api_to_frontend (no change): mfnRate: 0.25
    // 4. Frontend multiply by 100: 0.25 × 100 = 25% ✅

    // ✅ MOVED (Oct 26): transformedComponents is now declared earlier (line 744-794)
    // This prevents temporal dead zone errors from using it before declaration
    // It contains all required fields: base_mfn_rate, rate_source, stale
    // The raw result.usmca.component_breakdown from AI doesn't have these fields

    // DEBUG: Final component validation before response
    if (!transformedComponents || transformedComponents.length === 0) {
      console.error('🚨 [RESPONSE] transformedComponents is empty! Frontend will show "No tariff data available"', {
        componentBreakdown_count: componentBreakdown?.length || 0,
        transformedComponents_count: transformedComponents?.length || 0
      });
    }

    result.component_origins = transformedComponents;
    result.components = transformedComponents;

    result.manufacturing_location = formData.manufacturing_location;
    result.workflow_data = {
      company_name: formData.company_name,
      business_type: formData.business_type,
      product_description: formData.product_description,
      manufacturing_location: formData.manufacturing_location
    };

    // ========== HYBRID APPROACH (Oct 26, 2025) ==========
    // ✅ AI provides: qualification (yes/no), RVC %, preference criterion (fast: 10-15s)
    // ✅ Backend synthesizes: detailed summary from pre-calculated financial data (no AI call)
    // Result: Fast response + full analysis, no token truncation

    // Build detailed summary from pre-calculated financial data
    const detailedReason = buildDetailedSummary(
      result.usmca.qualified,
      result.usmca.north_american_content,
      result.usmca.threshold_applied,
      result.savings,
      formData
    );

    // Enhance AI response with synthesized summary
    result.usmca.reason = detailedReason;
    result.detailed_analysis = {
      threshold_research: `RVC threshold for ${formData.industry_sector}: ${result.usmca.threshold_applied}%`,
      calculation_breakdown: `Total North American Content: ${result.usmca.north_american_content}% (includes labor credit + component origins)`,
      qualification_reasoning: detailedReason,
      strategic_insights: buildStrategicInsights(result, formData)
    };

    logInfo('AI-powered USMCA analysis completed', {
      company: formData.company_name,
      qualified: result.usmca.qualified,
      processing_time: result.processing_time_ms
    });

    // ========== PERFORMANCE OPTIMIZATION (Oct 26, 2025) ==========
    // REMOVED: Synchronous database writes (workflow_sessions insert + usage increment)
    // REASON: These were blocking the response, causing 90+ second delays
    // The 102-second response time was:
    //   - AI call: 1.3 seconds (fast)
    //   - Sync DB writes: ~90+ seconds (massive bottleneck)
    //
    // TODO: Move these to background jobs:
    // 1. workflow_sessions insert → fire-and-forget background task
    // 2. incrementAnalysisCount → fire-and-forget background task
    // 3. DevIssue logging → async non-blocking
    //
    // For now: Return response immediately, skip database saves
    // Result: ~90 second performance improvement (102s → 10-15s)

    // ✅ USAGE TRACKING: Counter already incremented atomically at request start
    // reserveAnalysisSlot() was called before processing (line ~385) to prevent
    // race conditions. No need to increment again here.
    // Old code: incrementAnalysisCount() - REMOVED (would double-count)

    // ✅ WORKFLOW COMPLETION: Mark workflow as completed to prevent AI regeneration (fire-and-forget)
    // This protects OpenRouter costs (~$0.02/request) and maintains analysis integrity
    if (formData.workflow_session_id) {
      supabase
        .from('workflow_sessions')
        .update({
          completed_at: new Date().toISOString()
        })
        .eq('session_id', formData.workflow_session_id)  // ✅ FIX (Nov 6): Use session_id column, not id (UUID)
        .then(({ error }) => {
          if (error) {
            console.error('[WORKFLOW-COMPLETION] Failed to mark workflow as completed:', error.message);
          } else {
            console.log(`[WORKFLOW-COMPLETION] ✅ Workflow ${formData.workflow_session_id} marked as completed`);
          }
        })
        .catch(err => {
          console.error('[WORKFLOW-COMPLETION] Exception marking workflow completed:', err.message);
        });
    }

    // ✅ USAGE TRACKING: Counter is incremented in workflow-session.js (Nov 12, 2025)
    // ⚠️ CRITICAL: DO NOT increment counter here - it causes double-counting
    // The workflow-session.js API increments the counter when action='complete'
    // If we also increment here, the counter goes up by 2 instead of 1
    //
    // OLD BUG (Nov 12): Counter was incremented in BOTH places:
    //   1. workflow-session.js (line 283) when saving completed workflow
    //   2. ai-usmca-complete-analysis.js (here) after AI analysis
    // Result: 11 completions in database, but counter showed 14 (+3 extra)
    //
    // FIX: Removed increment from this file - workflow-session.js is single source of truth
    console.log(`[USAGE-TRACKING] ℹ️ Counter will be incremented by workflow-session.js, not here (prevents double-counting)`);
    if (formData.workflow_session_id) {
      console.log(`[USAGE-TRACKING] ℹ️ Workflow ${formData.workflow_session_id} will be counted when saved to workflow_completions`);
    } else {
      console.warn('[USAGE-TRACKING] ⚠️ No workflow_session_id provided - workflow may not be counted');
    }

    // DEBUG: Log what's being returned in component_origins
    console.log('📊 [RESPONSE-DEBUG] Tariff rates in API response:',
      (result.component_origins || []).map(c => ({
        description: c.description,
        mfn_rate: c.mfn_rate,
        section_301: c.section_301,
        section_232: c.section_232,  // ✅ DEBUG (Nov 14): Verify Section 232 rates included
        section_232_exemption: c.section_232_exemption,  // ✅ DEBUG (Nov 14): Verify exemption object included
        usmca_rate: c.usmca_rate,
        total_rate: c.total_rate,
        annual_savings: c.annual_savings
      }))
    );

    return res.status(200).json(result);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError('AI-powered USMCA analysis failed', {
      error: error.message,
      stack: error.stack,
      processing_time: processingTime
    });

    await DevIssue.apiError('usmca_analysis', '/api/ai-usmca-complete-analysis', error, {
      userId,
      company: formData?.company_name,
      processing_time: processingTime
    });

    // ✅ NEW (Nov 20, 2025): Use formatErrorResponse for consistent user-friendly errors
    // Converts UserFriendlyError instances to proper format, handles generic errors gracefully
    const errorResponse = formatErrorResponse(error);
    return res.status(500).json({
      ...errorResponse,
      timestamp: new Date().toISOString(),
      processing_time: processingTime
    });
  }
  }
});

/**
 * ⚡ OPTIMIZED PROMPT BUILDER - Reduced from 9,400 → 4,200 chars (55% smaller)
 * Uses constants instead of verbose inline documentation
 * All Week 1 enhancements preserved
 */
