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
  maxTokens: 3000
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workflow_data, user_id } = req.body;

    if (!workflow_data) {
      return res.status(400).json({ error: 'Missing workflow_data' });
    }

    // ✅ SUBSCRIPTION TIER ENFORCEMENT (per spec lines 327-349)
    if (user_id) {
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('subscription_tier, analyses_this_month, analyses_reset_date')
        .eq('user_id', user_id)
        .single();

      if (profileError) {
        console.warn('⚠️ Could not fetch user profile for tier check:', profileError.message);
      } else if (userProfile) {
        // Define tier limits (per specification)
        const TIER_LIMITS = {
          'Trial': 0,
          'Starter': 2,
          'Professional': 5,
          'Premium': 500  // ✅ FIXED: Was Infinity, now 500 to prevent AI cost abuse
        };

        const userTier = userProfile.subscription_tier || 'Trial';
        const currentUsage = userProfile.analyses_this_month || 0;
        const monthlyLimit = TIER_LIMITS[userTier] || 0;

        // Check if user has exceeded their limit
        if (currentUsage >= monthlyLimit) {
          console.log(`🚫 User ${user_id} (${userTier}) exceeded monthly limit: ${currentUsage}/${monthlyLimit}`);
          return res.status(403).json({
            success: false,
            error: 'Monthly analysis limit reached',
            tier: userTier,
            limit: monthlyLimit,
            current_usage: currentUsage,
            message: `You've used ${currentUsage} of ${monthlyLimit === Infinity ? 'unlimited' : monthlyLimit} analyses this month. Upgrade to ${userTier === 'Trial' ? 'Starter' : userTier === 'Starter' ? 'Professional' : 'Premium'} for more analyses.`,
            upgrade_required: true
          });
        }

        // Increment usage counter
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            analyses_this_month: currentUsage + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id);

        if (updateError) {
          console.error('⚠️ Failed to increment analyses counter:', updateError.message);
        } else {
          console.log(`✅ User ${user_id} (${userTier}): ${currentUsage + 1}/${monthlyLimit} analyses used`);
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

    // STEP 2: Match real alerts to user's components
    const userComponentOrigins = (components).map(c =>
      (c.origin_country || c.country || '').toUpperCase()
    );

    const userComponentHS = (components).map(c =>
      (c.hs_code || '').replace(/\./g, '')
    );

    const matchedAlerts = (realAlerts || []).filter(alert => {
      const countryMatch = alert.affected_countries?.some(country =>
        userComponentOrigins.includes(country.toUpperCase())
      );

      const hsMatch = alert.affected_hs_codes?.some(code => {
        const normalizedAlertCode = code.replace(/\./g, '').substring(0, 6);
        return userComponentHS.some(compHS =>
          compHS.startsWith(normalizedAlertCode)
        );
      });

      return countryMatch || hsMatch;
    });

    console.log(`📊 Portfolio briefing for ${companyName}: ${matchedAlerts.length} real alerts matched`);

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

        return {
          ...alert,
          impactScore,
          severity: impactScore > 20 ? 'CRITICAL' : impactScore > 10 ? 'HIGH' : 'MEDIUM'
        };
      })
      .sort((a, b) => b.impactScore - a.impactScore);

    const alertContext = rankedAlerts.length > 0
      ? `REAL POLICY ALERTS AFFECTING THIS USER (${rankedAlerts.length} matched, ranked by impact):

${rankedAlerts.map((a, idx) =>
  `[${idx + 1}] ${a.severity} - ${a.title}
  Impact: ${a.impactScore.toFixed(1)}% of your portfolio affected
  Details: ${a.description}
  Affected: ${(a.affected_countries || []).join(', ')} | HS Codes: ${(a.affected_hs_codes || []).join(', ')}
  Source: ${a.detection_source || 'Federal Register / USTR / Government Announcement'}
  Announced: ${a.announcement_date || new Date(a.created_at).toLocaleDateString()}`
).join('\n\n')}`
      : `NO REAL POLICY ALERTS YET:
We are monitoring 12+ government sources (USTR, Federal Register, Mexico labor ministry, Canada ISAC)
for announcements affecting HS codes: ${userComponentHS.join(', ')}
and countries: ${[...new Set(userComponentOrigins)].join(', ')}

Use forward-looking language: "potential", "expected", "could face", "we are tracking for"`;

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

    // STEP 5: Build the AI prompt - Strategic advisor tone
    const aiPrompt = `ROLE:
You are a Trade Compliance Director analyzing ${companyName}'s supply chain for USMCA 2026 renegotiation exposure. Write a strategic briefing for the operations team.

TONE:
- Professional peer-to-peer (not teaching basics)
- Evidence-based (cite their specific numbers)
- Strategic advisor (implications, not instructions)
- Assumes they understand trade terms (RVC, HS codes, rules of origin)

${companyName}'s COMPONENT PORTFOLIO:
${components.map(c => {
  const percentage = c.percentage || (totalVolume > 0 ? (c.annual_volume / totalVolume * 100).toFixed(1) : 0);
  const volatilityTier = VolatilityManager.getVolatilityTier(c.hs_code, c.origin_country || c.country, destination);
  const volatilityNote = volatilityTier.tier <= 2 ? `\n  ⚠️ VOLATILE TARIFF: ${volatilityTier.reason}` : '';
  return `- ${c.component_type || c.description} from ${c.origin_country || c.country} (${percentage}% of costs)
  HS Code: ${c.hs_code || 'Not classified'}
  ${c.annual_volume > 0 ? `Annual Value: $${c.annual_volume.toLocaleString()}` : ''}${volatilityNote}`;
}).join('\n')}

${hasVolatileComponents ? `\n⚠️ TARIFF RATE VOLATILITY WARNING:
${volatileComponents.length} components have VOLATILE tariff rates (change frequently with policy announcements):
${volatileComponents.map(c => `- ${c.component_type || c.description} (${c.origin_country || c.country}): ${c.volatility.reason}`).join('\n')}

These rates are subject to:
${[...new Set(volatileComponents.flatMap(c => c.volatility.policies))].map(p => `- ${p}`).join('\n')}

IMPORTANT: Database tariff rates for these components may be STALE. Platform forces fresh AI research for volatile combinations.
` : ''}

${matchedAlerts.length > 0 ? `ACTIVE POLICY ALERTS (${matchedAlerts.length} affecting your supply chain):
${rankedAlerts.map((a, idx) =>
  `[${idx + 1}] ${a.title}
  Impact: Affects ${a.impactScore.toFixed(0)}% of your trade volume
  Countries: ${(a.affected_countries || []).join(', ')}
  HS Codes: ${(a.affected_hs_codes || []).join(', ') || 'General policy (all HS codes)'}
  ${a.description}`
).join('\n\n')}` : `MONITORING STATUS:
No active policy changes detected. Tracking USTR, Federal Register, and Mexico labor ministry for announcements affecting:
- Your HS Codes: ${userComponentHS.join(', ')}
- Your Source Countries: ${[...new Set(userComponentOrigins)].join(', ')}`}

You are writing a strategic briefing for a business owner preparing for USMCA 2026 renegotiation. Write in narrative prose - tell the story of their supply chain position.

Return a JSON object with these EXACT fields:

{
  "business_overview": "Write 3-4 sentences painting their supply chain picture. State percentages by country, give context on what 2026 means for them. Example: 'Your electronics assembly relies on a three-country supply chain: 55% from Mexico (power supplies, housing, connectors), 35% from China (microprocessors), and 10% from Canada (PCBs). This creates an interesting position heading into the USMCA 2026 renegotiation. Your Mexico concentration gives you a strong USMCA foundation, but your Chinese microprocessor sourcing sits in the crosshairs of cumulation rule discussions.'",

  "component_analysis": "Write 2-3 flowing paragraphs analyzing their components as a narrative (NOT listing components one by one). Group components by strategic significance. ${matchedAlerts.length > 0 ? 'Weave alert context naturally into the narrative (e.g., \"Two recent alerts signal this pressure: [titles]\"). Don\'t just say \"Alert detected.\"' : 'Focus on 2026 renegotiation context and what rule changes would mean.'} Example: 'The microprocessor component presents your most significant strategic uncertainty. Chinese semiconductor sourcing works beautifully today under current cumulation rules, but 2026 renegotiation will likely revisit whether non-USMCA content can flow through North American assembly. Your Mexico-sourced components—power supplies and housing representing 50% of costs—anchor your USMCA qualification. They're well-positioned for any agreement strengthening, though they do concentrate your supply chain in a single country.'",

  "strategic_trade_offs": "Write 2-3 paragraphs presenting genuine strategic choices with no obvious answer. Frame as 'choosing between futures.' Example: 'You're essentially choosing between two futures. Continue with Chinese microprocessors and accept 2026 rule uncertainty, or begin qualifying alternative suppliers—knowing that transition takes 12-18 months and increases component costs. There's no obviously correct answer because the actual 2026 rules haven't been proposed yet. Your Mexico concentration (55%) provides USMCA strength but creates single-country exposure. Geographic diversification would reduce this risk, but your current suppliers have established quality and logistics. The timing matters—qualification of alternative suppliers requires substantial lead time.'",

  "monitoring_plan": "Write 2-3 paragraphs describing what you're tracking and WHY it matters to them. Connect monitoring to their specific components.${hasVolatileComponents ? ' CRITICAL: Emphasize that volatile components require MORE FREQUENT monitoring (daily for Tier 1, weekly for Tier 2) because tariff rates change with executive proclamations. Explain which components need daily checks vs quarterly checks.' : ''} Example: 'We're tracking the USMCA Joint Commission meeting schedule and any published negotiating texts, particularly proposals affecting cumulation rules for electronics components. For your microprocessor sourcing, we're watching USTR statements on non-party content thresholds. On the Mexico side, we're monitoring the Diario Oficial for labor ministry updates affecting your power supply and housing suppliers. The next major intelligence point comes when the Joint Commission publishes 2026 renegotiation proposals, expected Q1 2026. That's when uncertainty around cumulation rules begins resolving into actual policy language.'"
}

${hasVolatileComponents ? `\nMONITORING FREQUENCY GUIDANCE:
Your portfolio contains ${volatileComponents.length} components with volatile tariff rates requiring enhanced monitoring:

DAILY CHECKS (Super Volatile - Tier 1):
${volatileComponents.filter(c => c.volatility.tier === 1).map(c => `- ${c.component_type || c.description} (${c.origin_country || c.country}): ${c.volatility.policies.join(', ')}`).join('\n') || 'None'}

WEEKLY CHECKS (Volatile - Tier 2):
${volatileComponents.filter(c => c.volatility.tier === 2).map(c => `- ${c.component_type || c.description} (${c.origin_country || c.country}): ${c.volatility.policies.join(', ')}`).join('\n') || 'None'}

QUARTERLY CHECKS (Stable - Tier 3):
All other components with standard MFN or USMCA rates

WEAVE THIS INTO YOUR MONITORING PLAN - explain why some components need daily checks while others are quarterly.
` : ''}

CRITICAL RULES:
1. WRITE NARRATIVE PROSE - Tell a story, don't list facts
2. NEVER INVENT NUMBERS - Use ONLY percentages from component data above. If you say "60% from Mexico" but their data shows 30% + 20% + 5% = 55%, YOU FAILED.
3. CALCULATE ACCURATELY - Add up component percentages by country to get country concentration. Show your math.
4. WEAVE ALERTS NATURALLY - Don't say "Alert detected:" 5 times, work them into the narrative
5. READABLE LANGUAGE - "works beautifully today" not "current cumulation methodology allows"
6. REAL TRADE-OFFS - Present genuine strategic choices with no obvious answer
7. NO POLITICAL REFERENCES - Don't mention "Trump administration" or specific politicians. Say "US-Canada trade tensions" or "policy discussions"
8. MONITORING WITH MILESTONES - Structure monitoring around Q1 2026 proposals, Mid-2026 findings, Q3-Q4 implementation
9. BE SPECIFIC - Use their HS codes and percentages, explain context

IF YOU MAKE UP A STATISTIC NOT IN THE DATA, YOU HAVE FAILED.

Return valid JSON only:`;

    console.log('🤖 Calling AI to generate portfolio briefing...');
    console.log('📋 Prompt length:', aiPrompt.length, 'characters');
    console.log('📊 Components in prompt:', components.length);

    // STEP 6: Call AI using BaseAgent (with automatic 2-tier fallback)
    const aiResponse = await portfolioAgent.execute(aiPrompt, {
      temperature: 0.7,
      format: 'json'  // ✅ Structured JSON prevents hallucinations
    });

    console.log('✅ AI response received');

    // Parse JSON response
    let briefingData = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;

    // ✅ UNWRAP if AI returned {success: true, data: {...}} wrapper
    if (briefingData.success && briefingData.data) {
      briefingData = briefingData.data;
    }

    console.log('📊 Portfolio briefing generated:', {
      has_business_overview: !!briefingData.business_overview,
      has_component_analysis: !!briefingData.component_analysis,
      has_strategic_trade_offs: !!briefingData.strategic_trade_offs,
      has_monitoring_plan: !!briefingData.monitoring_plan
    });

    // Return structured briefing
    return res.status(200).json({
      success: true,
      briefing: briefingData,  // ✅ Structured JSON object
      company: companyName,
      portfolio_value: totalVolume,
      real_alerts_matched: matchedAlerts.length,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Portfolio briefing generation failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
