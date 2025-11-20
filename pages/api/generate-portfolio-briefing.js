/**
 * GENERATE PORTFOLIO BRIEFING
 * Strategic analysis of user's supply chain against USMCA 2026 renegotiation
 * Integrates real policy alerts if detected, uses forward-looking language if not
 *
 * This is NOT template generation. This is real portfolio analysis enriched with
 * any actual policy announcements detected by RSS monitoring.
 */

import { createClient } from '@supabase/supabase-js';
import { BaseAgent } from '../../lib/agents/base-agent.js';
import { VolatilityManager } from '../../lib/tariff/volatility-manager.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Use BaseAgent with claude-haiku-4.5 (consistent across project)
const portfolioAgent = new BaseAgent({
  name: 'PortfolioBriefing',
  model: 'anthropic/claude-haiku-4.5',
  maxTokens: 3500  // Increased from 3000 to prevent truncation of monitoring streams
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workflow_data, user_id, allow_ai_select_alerts, selected_alert_ids } = req.body;

    if (!workflow_data) {
      return res.status(400).json({ error: 'Missing workflow_data' });
    }

    // ✅ NEW (Nov 8): Alert selection mode
    // If user unchecks AI but doesn't select any alerts, fall back to AI auto-select
    const isManualAlertSelection = allow_ai_select_alerts === false && selected_alert_ids && selected_alert_ids.length > 0;
    const useAIAutoSelect = allow_ai_select_alerts !== false || !selected_alert_ids || selected_alert_ids.length === 0;
    console.log('🎯 Alert selection mode:', {
      allow_ai_select_alerts,
      manual_mode: isManualAlertSelection,
      selected_count: selected_alert_ids?.length || 0,
      final_mode: useAIAutoSelect ? 'AI_AUTO_SELECT' : 'MANUAL_SELECTION'
    });

    // ✅ SUBSCRIPTION TIER ENFORCEMENT - Portfolio Briefing Limits
    if (user_id) {
      const { data: userProfile, error: profileError} = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('user_id', user_id)
        .single();

      if (profileError) {
        console.warn('⚠️ Could not fetch user profile for tier check:', profileError.message);
      } else if (userProfile) {
        // Portfolio Briefing limits (realistic usage - retention driver)
        const BRIEFING_LIMITS = {
          'Trial': 0,           // 0 portfolio briefings (retention driver - paid feature only)
          'Starter': 30,        // 30 briefings per month (2x workflows - weekly alert checks)
          'Professional': 150,  // 150 briefings per month (1.5x workflows - checks every few days)
          'Premium': 750        // 750 briefings per month (1.5x workflows - daily checks + headroom)
        };

        const userTier = userProfile.subscription_tier || 'Trial';
        const monthlyLimit = BRIEFING_LIMITS[userTier] || 0;

        // Get current month's usage from monthly_usage_tracking
        const now = new Date();
        const month_year = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const { data: usageRecord } = await supabase
          .from('monthly_usage_tracking')
          .select('briefing_count')
          .eq('user_id', user_id)
          .eq('month_year', month_year)
          .single();

        const currentUsage = usageRecord?.briefing_count || 0;

        // Check if user has exceeded their limit
        if (currentUsage >= monthlyLimit) {
          console.log(`🚫 User ${user_id} (${userTier}) exceeded briefing limit: ${currentUsage}/${monthlyLimit}`);
          return res.status(403).json({
            success: false,
            error: 'Monthly briefing limit reached',
            tier: userTier,
            limit: monthlyLimit,
            current_usage: currentUsage,
            message: `You've used ${currentUsage} of ${monthlyLimit} portfolio briefings this month. Upgrade to ${userTier === 'Trial' ? 'Starter ($99/mo)' : userTier === 'Starter' ? 'Professional ($299/mo)' : 'Premium ($599/mo)'} for more briefings.`,
            upgrade_required: true
          });
        }

        // Increment briefing counter in monthly_usage_tracking
        const { error: updateError } = await supabase.rpc('increment_briefing_count', {
          p_user_id: user_id,
          p_month_year: month_year
        });

        if (updateError) {
          console.error('⚠️ Failed to increment briefing counter:', updateError.message);
        } else {
          console.log(`✅ User ${user_id} (${userTier}): ${currentUsage + 1}/${monthlyLimit} briefings used`);
        }
      }
    }

    const companyName = workflow_data.company?.name || 'Your Company';
    const components = workflow_data.components || [];

    console.log('📊 Components received by API:', components.map(c => ({
      type: c.component_type || c.description,
      annual_volume: c.annual_volume,
      percentage: c.percentage,
      origin: c.origin_country || c.country
    })));

    const totalVolume = components.reduce((sum, c) => sum + (c.annual_volume || 0), 0);

    console.log(`💰 Total volume calculated: $${totalVolume}`);

    // STEP 1: Get REAL policy alerts (if any exist in crisis_alerts)
    const { data: realAlerts, error: alertError } = await supabase
      .from('crisis_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (alertError) {
      console.error('⚠️ Failed to fetch real alerts:', alertError);
    }

    // STEP 2: Match real alerts to user's components OR use manually selected alerts
    const userComponentOrigins = (components).map(c =>
      (c.origin_country || c.country || '').toUpperCase()
    );

    const userComponentHS = (components).map(c =>
      (c.hs_code || '').replace(/\./g, '')
    );

    let matchedAlerts;

    if (isManualAlertSelection) {
      // ✅ MANUAL MODE: Use only user-selected alerts
      matchedAlerts = (realAlerts || []).filter(alert =>
        selected_alert_ids.includes(alert.id)
      );
      console.log(`📊 Portfolio briefing for ${companyName}: ${matchedAlerts.length} alerts manually selected by user`);
    } else {
      // ✅ AI AUTO-SELECT MODE: Match alerts to components automatically
      // ✅ FIXED (Nov 18, 2025): Use AND logic when alert has both filters (prevents false positives)
      matchedAlerts = (realAlerts || []).filter(alert => {
        const hasCountryFilter = alert.affected_countries && alert.affected_countries.length > 0;
        const hasHSFilter = alert.affected_hs_codes && alert.affected_hs_codes.length > 0;

        const countryMatch = hasCountryFilter &&
          alert.affected_countries.some(country =>
            userComponentOrigins.includes(country.toUpperCase())
          );

        const hsMatch = hasHSFilter &&
          alert.affected_hs_codes.some(code => {
            const normalizedAlertCode = code.replace(/\./g, '').substring(0, 6);
            return userComponentHS.some(compHS =>
              compHS.startsWith(normalizedAlertCode)
            );
          });

        // Smart matching logic:
        // - If alert has BOTH country AND HS codes → Require BOTH match (AND logic)
        // - If alert has ONLY country → Match on country
        // - If alert has ONLY HS codes → Match on HS codes
        // - If alert has NEITHER → Don't match (invalid alert)
        if (hasCountryFilter && hasHSFilter) {
          return countryMatch && hsMatch;  // ✅ AND logic (precision)
        } else if (hasCountryFilter) {
          return countryMatch;  // Blanket country alert
        } else if (hasHSFilter) {
          return hsMatch;  // HS-specific alert (no country filter)
        } else {
          return false;  // Invalid alert (no filters)
        }
      });
      console.log(`📊 Portfolio briefing for ${companyName}: ${matchedAlerts.length} alerts auto-matched by AI`);
    }

    // ✅ NEW (Nov 18, 2025): Add confidence scoring to matched alerts
    // Helps users assess reliability of alert matches
    matchedAlerts = matchedAlerts.map(alert => {
      const hasCountryFilter = alert.affected_countries && alert.affected_countries.length > 0;
      const hasHSFilter = alert.affected_hs_codes && alert.affected_hs_codes.length > 0;

      // Calculate how many components match this alert
      const countryMatches = components.filter(c =>
        hasCountryFilter && alert.affected_countries.includes((c.origin_country || c.country || '').toUpperCase())
      ).length;

      const hsMatches = components.filter(c => {
        if (!hasHSFilter) return false;
        return alert.affected_hs_codes.some(code => {
          const normalizedAlertCode = code.replace(/\./g, '').substring(0, 6);
          const compHS = (c.hs_code || '').replace(/\./g, '').substring(0, 6);
          return compHS.startsWith(normalizedAlertCode);
        });
      }).length;

      // Determine confidence level
      let confidence_level, confidence_reason;

      if (hasCountryFilter && hasHSFilter && countryMatches > 0 && hsMatches > 0) {
        confidence_level = 'HIGH';
        confidence_reason = `Specific match: ${countryMatches} component(s) from affected country + ${hsMatches} matching HS code(s)`;
      } else if (hasCountryFilter && !hasHSFilter && countryMatches > 0) {
        confidence_level = 'MEDIUM';
        confidence_reason = `Blanket country alert: ${countryMatches} component(s) from ${alert.affected_countries.join(', ')}`;
      } else if (!hasCountryFilter && hasHSFilter && hsMatches > 0) {
        confidence_level = 'MEDIUM';
        confidence_reason = `Product-specific: ${hsMatches} component(s) with matching HS codes`;
      } else if (alert.affected_industries && alert.affected_industries.length > 0) {
        confidence_level = 'LOW';
        confidence_reason = `Industry-based inference: ${alert.affected_industries.join(', ')}`;
      } else {
        confidence_level = 'LOW';
        confidence_reason = 'Generic alert with no specific filters';
      }

      return {
        ...alert,
        confidence_level,
        confidence_reason,
        component_matches: {
          country: countryMatches,
          hs_code: hsMatches
        }
      };
    });

    console.log(`🎯 Confidence distribution: HIGH=${matchedAlerts.filter(a => a.confidence_level === 'HIGH').length}, MEDIUM=${matchedAlerts.filter(a => a.confidence_level === 'MEDIUM').length}, LOW=${matchedAlerts.filter(a => a.confidence_level === 'LOW').length}`);

    // STEP 3: Build portfolio analysis for AI prompt (with volatility detection)
    const destination = workflow_data.company?.destination_country || 'US';
    const componentSummary = components.map(c => {
      const percentage = totalVolume > 0 ? (c.annual_volume / totalVolume * 100).toFixed(1) : 0;
      const matchingAlert = matchedAlerts.find(a =>
        a.affected_countries?.includes((c.origin_country || c.country || '').toUpperCase()) ||
        a.affected_hs_codes?.some(code => (c.hs_code || '').replace(/\./g, '').includes(code.replace(/\./g, '').substring(0, 6)))
      );

      // ✅ NEW: Check tariff rate volatility for this component
      const volatilityTier = VolatilityManager.getVolatilityTier(
        c.hs_code,
        c.origin_country || c.country,
        destination
      );

      const volatilityFlag = volatilityTier.tier <= 2 ? ` [${volatilityTier.volatility.toUpperCase()}: ${volatilityTier.reason}]` : '';

      return `- ${c.component_type || c.description} (${c.origin_country || c.country}, HS ${c.hs_code}, $${(c.annual_volume || 0).toLocaleString()}, ${percentage}% of costs)${
        matchingAlert ? ` [REAL ALERT: ${matchingAlert.title}]` : ''
      }${volatilityFlag}`;
    }).join('\n');

    // STEP 4: Rank matched alerts by severity and component impact
    // ✅ ENHANCED (Nov 20): Multi-factor scoring for strategic importance
    const rankedAlerts = matchedAlerts
      .map(alert => {
        // Calculate impact severity based on affected components
        const impactScore = components.reduce((score, comp) => {
          let componentScore = 0;

          // Check if alert affects this component
          const countryMatch = alert.affected_countries?.includes((comp.origin_country || comp.country || '').toUpperCase());
          const hsMatch = alert.affected_hs_codes?.some(code =>
            (comp.hs_code || '').replace(/\./g, '').substring(0, 6) === code.replace(/\./g, '').substring(0, 6)
          );

          if (countryMatch || hsMatch) {
            // Weight by component's percentage of trade volume
            componentScore = (comp.annual_volume || 0) / totalVolume * 100;
          }

          return score + componentScore;
        }, 0);

        // ✅ NEW (Nov 20): Strategic importance scoring
        let strategicScore = impactScore; // Base: financial impact
        const title = (alert.title || '').toLowerCase();

        // CRITICAL: USMCA 2026 renegotiation affects ALL users (existential threat)
        if (title.includes('usmca') && (title.includes('2026') || title.includes('renegotiation'))) {
          strategicScore += 50; // Massive boost (affects entire business model)
        }

        // HIGH: Section 301/232 tariff changes (immediate cost impact)
        if (title.includes('section 301') || title.includes('section 232')) {
          strategicScore += 25;
        }

        // HIGH: Labor/compliance issues at named suppliers (supply chain disruption)
        if ((title.includes('workers') && title.includes('rights')) || title.includes('yazaki') || title.includes('thyssenkrupp')) {
          strategicScore += 20;
        }

        // MEDIUM: General policy announcements
        if (title.includes('trade representative') || title.includes('sme dialogue')) {
          strategicScore += 10;
        }

        return {
          ...alert,
          impactScore,
          strategicScore, // New: combined importance
          severity: impactScore > 20 ? 'CRITICAL' : impactScore > 10 ? 'HIGH' : 'MEDIUM'
        };
      })
      .sort((a, b) => b.strategicScore - a.strategicScore); // ✅ Sort by strategic importance, not just financial

    // STEP 4.5: AI Strategic Filtering - "Helps user decide whether to ship/change sourcing"
    // ✅ SKIP (Nov 20): If user manually selected alerts, use their selection (already in rankedAlerts)
    let strategicAlerts = rankedAlerts;

    if (isManualAlertSelection) {
      console.log(`👤 User manually selected ${rankedAlerts.length} alerts - skipping AI filter, using user choices`);
      strategicAlerts = rankedAlerts.slice(0, 3); // Still limit to 3 max
    } else if (rankedAlerts.length > 0) {
      console.log(`🤖 AI filtering ${rankedAlerts.length} alerts for strategic relevance...`);

      const filterPrompt = `You are a trade intelligence analyst. Review these policy alerts and SELECT ONLY those that help business owners decide:
- Should I ship this product this week/month?
- Should I change sourcing countries?
- Should I qualify new suppliers?
- Should I lock in pricing now or wait?
- Should I delay shipments or accelerate orders?

COMPANY: ${companyName}
COMPONENTS: ${components.map(c => `${c.component_type} from ${c.origin_country || c.country}`).join(', ')}
DESTINATION: ${destination}

INCLUDE ONLY:
✅ Tariff rate changes (Section 301, Section 232, MFN adjustments)
✅ Trade agreement developments (USMCA 2026, new trade deals)
✅ Legislative/executive actions affecting duties
✅ CBP rulings or customs guidance changes
✅ Nearshoring incentives or sourcing shifts
✅ Trade negotiations signaling policy direction

EXCLUDE:
❌ Earnings reports (company profits, quarterly results)
❌ Logistics pricing (freight rates, diesel prices, shipping costs)
❌ Airline/carrier operations (fleet purchases, terminal expansions)
❌ General business news (warehouse automation, technology trends)
❌ Non-trade topics (gaming, immigration, patents, postal)

ALERTS TO REVIEW:
${rankedAlerts.map((a, idx) => `
[${idx + 1}] ${a.severity} - ${a.title}
Impact: ${a.impactScore.toFixed(1)}% of portfolio
Confidence: ${a.confidence_level} (${a.confidence_reason})
Description: ${a.description}
Countries: ${(a.affected_countries || []).join(', ')}
HS Codes: ${(a.affected_hs_codes || []).join(', ') || 'blanket alert'}
`).join('\n')}

TASK: Return ONLY the alert numbers (e.g., "1, 3, 7") that help sourcing/shipping decisions. Be strict - when in doubt, exclude.

Response format: Just numbers separated by commas (e.g., "1, 3, 5") or "NONE" if no alerts qualify.`;

      try {
        const filterResponse = await portfolioAgent.execute(filterPrompt);
        const selectedText = (filterResponse.text || '').trim().toUpperCase();

        if (selectedText && selectedText !== 'NONE') {
          const selectedIndices = selectedText
            .split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n) && n > 0 && n <= rankedAlerts.length);

          if (selectedIndices.length > 0) {
            strategicAlerts = selectedIndices.map(idx => rankedAlerts[idx - 1]);
            console.log(`✅ AI filtered: ${strategicAlerts.length}/${rankedAlerts.length} strategic alerts`);

            // ✅ NEW (Nov 20): Limit to top 3 most important alerts for focused analysis
            if (strategicAlerts.length > 3) {
              console.log(`📊 Limiting to top 3 most strategic alerts (was ${strategicAlerts.length})`);
              strategicAlerts = strategicAlerts.slice(0, 3);
            }
          } else {
            console.log('⚠️ AI returned no valid indices, using top 3 ranked alerts');
            strategicAlerts = rankedAlerts.slice(0, 3); // Fallback: top 3 by strategic score
          }
        } else {
          console.log('🤖 AI found no strategic alerts, using forward-looking language only');
          strategicAlerts = [];
        }
      } catch (filterError) {
        console.error('❌ AI strategic filtering failed, using top 3 ranked alerts:', filterError);
        // Fallback: use top 3 ranked alerts (already sorted by strategicScore)
        strategicAlerts = rankedAlerts.slice(0, 3);
      }
    }

    // ✅ FIX (Nov 7): Build alert context with component matching (NO DUPLICATION)
    const alertContext = strategicAlerts.length > 0
      ? `STRATEGIC POLICY ALERTS (${strategicAlerts.length} alerts):

${strategicAlerts.map((a, idx) => {
  const affectedComps = components.filter(comp => {
    const countryMatch = a.affected_countries?.includes((comp.origin_country || comp.country || '').toUpperCase());
    const hsMatch = a.affected_hs_codes?.some(code =>
      (comp.hs_code || '').replace(/\./g, '').substring(0, 6) === code.replace(/\./g, '').substring(0, 6)
    );
    return countryMatch || hsMatch;
  });
  const affectedNames = affectedComps.map(c => c.component_type || c.description).join(', ');

  return `[${idx + 1}] ${a.severity.toUpperCase()} - ${a.title}
  Confidence: ${a.confidence_level} (${a.confidence_reason})
  Affects: ${affectedNames || 'supply chain'} (${a.impactScore.toFixed(1)}% of portfolio)
  ${a.description}`;
}).join('\n\n')}`
      : `NO ACTIVE ALERTS - Use forward-looking language: "potential", "expected", "monitoring for"`;

    // Detect volatile components for monitoring emphasis
    const volatileComponents = components.map(c => {
      const volatilityTier = VolatilityManager.getVolatilityTier(
        c.hs_code,
        c.origin_country || c.country,
        destination
      );
      return { ...c, volatility: volatilityTier };
    }).filter(c => c.volatility.tier <= 2); // Only Tier 1 (super volatile) and Tier 2 (volatile)

    const hasVolatileComponents = volatileComponents.length > 0;

    // ✅ OPTIMIZED (Nov 7): Streamlined prompt - removed redundancy, kept narrative quality
    const aiPrompt = `You are a Trade Compliance Director writing a strategic briefing for ${companyName}'s operations team about USMCA 2026 renegotiation exposure.

COMPONENTS (${components.length} total):
${components.map(c => {
  const pct = c.percentage || (totalVolume > 0 ? (c.annual_volume / totalVolume * 100).toFixed(1) : 0);
  const vol = VolatilityManager.getVolatilityTier(c.hs_code, c.origin_country || c.country, destination);
  const section301 = c.section_301 ? ` | Section 301: ${(c.section_301 * 100).toFixed(1)}%` : '';
  return `• ${c.component_type || c.description} (${c.origin_country || c.country}) - ${pct}% | HS: ${c.hs_code}${section301}${vol.tier <= 2 ? ` ⚠️ ${vol.reason}` : ''}`;
}).join('\n')}

${alertContext}

Write an expressive, narrative briefing - tell their supply chain STORY with personality and strategic insight.

Write your analysis in MARKDOWN format with these REQUIRED sections:

# Executive Advisory: ${companyName}

## USMCA 2026 Renegotiation Exposure Analysis
Write 2-3 paragraphs analyzing how the USMCA 2026 renegotiation could affect THIS company's supply chain. Focus on:
- Their specific component origins and how cumulation rules might change
- RVC threshold risks for their product mix
- Timeline considerations (Q1 2026 negotiations, mid-2026 decisions)
- Strategic positioning vs waiting

Example: "Your supply chain sits at a critical inflection point. The 65% Mexican content gives you strong USMCA footing today, but Q1 2026 cumulation rule proposals could change that calculus. If negotiators tighten sourcing requirements or exclude certain non-USMCA inputs, your 15% Chinese components become a strategic liability. The 20-month window before final rules publish is your decision gate - act now or wait for clarity?"

## Active Alerts Affecting Your Supply Chain
${strategicAlerts.length > 0
  ? `List ${strategicAlerts.length} alerts as bullets with severity labels (CRITICAL, HIGH, MEDIUM). Make each line compelling - show WHY it matters to them. Example: "CRITICAL: US-China truce creates 90-day window - your Chinese PLC sourcing saves $400K if you ship before Feb 15"`
  : `Write 2-3 monitoring bullets framed as opportunities/risks. Example: "MONITORING: USMCA 2026 hearing Q1 - cumulation rules affecting your Chinese components will be debated"`}

## Your Situation
Write 2-3 **narrative paragraphs** painting their supply chain story. Use exact percentages by country (calculate from data - don't invent!). ${matchedAlerts.length > 0 ? 'Weave alerts naturally into narrative.' : 'Focus on current positioning and what makes their supply chain unique.'}

Example: "Your hydraulic press sits at the intersection of three supply chains. Mexican steel (32%) gives solid USMCA footing, but Chinese PLC (22%) creates $1.2M Section 301 exposure. German hydraulics (18%) diversify risk but complicate origin rules."

## Critical Decision Gates
Present 2-3 strategic CHOICES with no obvious answer. Frame as "choosing between futures" - show trade-offs, not recommendations. Make them THINK.

Example: "Path A: Keep Chinese PLC, accept $1.2M burden, wait for 2026 clarity. Path B: Qualify Mexican alternatives now (12-18mo transition, higher costs) but eliminate Section 301 and strengthen USMCA. No obvious answer until Q1 2026 proposals publish."

## What We're Monitoring
Describe 2-3 intelligence streams and WHY they matter. Structure around Q1/Mid/Q3-Q4 2026 milestones.${hasVolatileComponents ? ` CRITICAL: ${volatileComponents.length} components need enhanced monitoring - explain daily vs weekly vs quarterly frequency and why.` : ''}

Example: "Three streams: (1) USMCA Joint Commission schedule - Q1 2026 cumulation proposals signal Chinese PLC strategy. (2) USTR Section 301 cycles - historically spike March/April. (3) Mexico Diario Oficial for labor compliance. Next major gate: Q1 2026 negotiating text."

---

RULES: Narrative prose with personality. NEVER invent numbers - use ONLY component data. Weave alerts naturally. Readable language ("works beautifully" not "current methodology allows"). Present real trade-offs. Avoid political names. Use their HS codes, exact percentages. Structure around Q1/Mid/Q3-Q4 2026.

🚨 CRITICAL: When mentioning Section 301 tariffs, use the SPECIFIC rate from component data (e.g., "Section 301 tariffs of 25%"), NOT vague ranges like "15-25%". If a component has Section 301 data, cite the exact percentage.

**Return ONLY markdown. NO JSON. NO code fences.**`;

    console.log('🤖 Calling AI to generate portfolio briefing...');
    console.log('📋 Prompt length:', aiPrompt.length, 'characters');
    console.log('📊 Components in prompt:', components.length);

    // STEP 6: Call AI using BaseAgent (with automatic 2-tier fallback)
    const aiResponse = await portfolioAgent.execute(aiPrompt, {
      temperature: 0.8  // ✅ Higher temp for expressive narrative writing
    });

    console.log('✅ AI response received');
    console.log('🔍 AI response structure:', {
      type: typeof aiResponse,
      has_data: !!aiResponse?.data,
      has_text: !!aiResponse?.text,
      has_content: !!aiResponse?.content,
      keys: aiResponse ? Object.keys(aiResponse) : []
    });

    // ✅ FIX (Nov 7): BaseAgent returns { success, data } format
    // The 'data' field contains the parsed response (raw markdown in this case)
    const markdownBriefing = typeof aiResponse === 'string'
      ? aiResponse
      : aiResponse.data?.raw || aiResponse.data || aiResponse.text || aiResponse.content || '';

    console.log('📊 Portfolio briefing generated:', {
      markdown_length: markdownBriefing.length,
      has_alerts_section: markdownBriefing.includes('## Active Alerts'),
      has_situation_section: markdownBriefing.includes('## Your Situation'),
      has_decision_gates: markdownBriefing.includes('## Critical Decision Gates'),
      has_monitoring_section: markdownBriefing.includes('## What We\'re Monitoring')
    });

    // 💾 SAVE BRIEFING TO DATABASE (avoids costly AI regeneration)
    try {
      const { data: savedBriefing, error: saveError } = await supabase
        .from('portfolio_briefings')
        .insert({
          user_id: user_id,
          workflow_session_id: workflow_data.session_id || null,
          company_name: companyName,
          briefing_markdown: markdownBriefing,
          portfolio_value: totalVolume,
          real_alerts_matched: matchedAlerts.length,
          strategic_alerts: strategicAlerts,
          generated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (saveError) {
        console.error('⚠️ Failed to save briefing to database:', saveError);
        // Non-blocking: briefing still returned to user even if save fails
      } else {
        console.log(`✅ Portfolio briefing saved to database (ID: ${savedBriefing.id})`);
      }
    } catch (saveException) {
      console.error('⚠️ Exception saving briefing:', saveException);
      // Non-blocking: don't fail the request
    }

    // Return markdown briefing
    return res.status(200).json({
      success: true,
      briefing: markdownBriefing,  // ✅ Raw markdown text for display
      company: companyName,
      portfolio_value: totalVolume,
      real_alerts_matched: matchedAlerts.length,
      strategic_alerts: strategicAlerts, // ✅ Return AI-filtered alerts for reuse in USMCA 2026 section
      generated_at: new Date().toISOString(),
      legal_notice: "⚠️ DISCLAIMER: This analysis is for informational purposes only and does not constitute legal, financial, tax, or compliance advice. All data is provided 'as-is' without warranties. You must independently verify all tariff rates, policy impacts, and regulatory requirements with licensed professionals before making business decisions. Actual results may vary significantly. This platform expressly disclaims all liability for losses, damages, or penalties arising from reliance on this information. You assume sole responsibility for all sourcing and compliance decisions."
    });

  } catch (error) {
    console.error('❌ Portfolio briefing generation failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
