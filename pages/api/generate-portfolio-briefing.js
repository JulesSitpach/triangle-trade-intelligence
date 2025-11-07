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

    // STEP 4.5: AI Strategic Filtering - "Helps user decide whether to ship/change sourcing"
    let strategicAlerts = rankedAlerts;

    if (rankedAlerts.length > 0) {
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
Description: ${a.description}
Countries: ${(a.affected_countries || []).join(', ')}
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
          } else {
            console.log('⚠️ AI returned no valid indices, using all ranked alerts');
          }
        } else {
          console.log('🤖 AI found no strategic alerts, using forward-looking language only');
          strategicAlerts = [];
        }
      } catch (filterError) {
        console.error('❌ AI strategic filtering failed, using all ranked alerts:', filterError);
        // Fallback: use all ranked alerts
      }
    }

    const alertContext = strategicAlerts.length > 0
      ? `STRATEGIC POLICY ALERTS (${strategicAlerts.length} of ${rankedAlerts.length} total alerts affect business decisions):

${strategicAlerts.map((a, idx) => {
  // Find which components this alert affects
  const affectedComps = components.filter(comp => {
    const countryMatch = a.affected_countries?.includes((comp.origin_country || comp.country || '').toUpperCase());
    const hsMatch = a.affected_hs_codes?.some(code =>
      (comp.hs_code || '').replace(/\./g, '').substring(0, 6) === code.replace(/\./g, '').substring(0, 6)
    );
    return countryMatch || hsMatch;
  });
  const affectedNames = affectedComps.map(c => c.component_type || c.description).join(', ');

  return `[${idx + 1}] ${a.severity} - ${a.title}
  WHY RELEVANT: Affects sourcing decisions for ${affectedNames || 'your supply chain'}
  Impact: ${a.impactScore.toFixed(1)}% of portfolio value
  Details: ${a.description}
  Countries: ${(a.affected_countries || []).join(', ')} | HS Codes: ${(a.affected_hs_codes || []).join(', ') || 'Policy-level (all products)'}
  Source: ${a.detection_source || 'Federal Register / USTR / Government Announcement'}
  Announced: ${a.announcement_date || new Date(a.created_at).toLocaleDateString()}`;
}).join('\n\n')}`
      : rankedAlerts.length > 0
      ? `ALERTS REVIEWED BUT FILTERED OUT (${rankedAlerts.length} operational/earnings reports, not strategic):
Use forward-looking language: "potential", "expected", "could face", "we are monitoring for"`
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

You are writing a strategic briefing for a business owner preparing for USMCA 2026 renegotiation. Write as an expressive trade intelligence analyst - tell the STORY of their supply chain position with personality and insight.

${alertContext}

Write your analysis in MARKDOWN format with these sections (you can add more if needed):

# Executive Advisory: ${companyName}

## Active Alerts Affecting Your Supply Chain
${strategicAlerts.length > 0 ? `List the ${strategicAlerts.length} strategic alerts as bullets with emoji severity indicators (🔴 CRITICAL, 🟠 HIGH, 🟡 MEDIUM). Each alert should be one compelling line that makes the business owner understand WHY it matters to them.

Example:
- 🔴 US-China Trade Truce (Nov 5) creates 90-day rate reduction window - your Chinese PLC sourcing could save $400K if you ship before Feb 15
- 🟠 Section 301 rates historically spike Q1 2026 - pattern suggests locking pricing NOW before March announcements
- 🟡 Mexico Section 232 exemptions under review - your steel frame sourcing (32% of costs) at risk if exemption expires June 2026` : `Write 2-3 bullets about what you're MONITORING (even with no active alerts), framed as opportunities/risks:

Example:
- 🔵 USMCA 2026 renegotiation hearing scheduled Q1 - cumulation rules affecting your Chinese components will be debated
- 🟢 Mexico nearshoring momentum - your existing Mexican suppliers (55% of costs) position you ahead of competitors scrambling to relocate`}

## Your Situation
Write 2-3 **flowing narrative paragraphs** painting their supply chain picture. State exact percentages by country (CALCULATE from component data - don't guess!). Give context on what 2026 means for THEM specifically. ${matchedAlerts.length > 0 ? 'Weave matched alerts naturally into this narrative - don\'t just list them, CONNECT them to the user\'s components.' : 'Focus on 2026 renegotiation context and what rule changes would mean for their specific components.'}

Example style:
"Your hydraulic press manufacturing sits at an interesting intersection of three supply chains. Mexican steel framing and welding (32% of product costs) gives you solid USMCA footing, but your Chinese PLC touchscreen control system (22% of costs) creates Section 301 exposure worth $1.2M annually. The German hydraulic pump (18%) rounds out a geographically diversified supply base - smart for resilience, but complex for rules of origin.

Two recent policy developments put this configuration under pressure: [weave alerts here naturally]. What worked brilliantly in 2024 may need rethinking as 2026 approaches."

## Critical Decision Gates
Write 2-3 paragraphs presenting genuine strategic CHOICES with no obvious answer. Frame as "choosing between futures." Present trade-offs, not recommendations. Make the business owner THINK.

Example:
"You're essentially choosing between two futures. Path A: Continue with Chinese PLC sourcing, accept $1.2M annual Section 301 burden, and wait for 2026 rule clarity. This works if cumulation rules stay favorable OR if Chinese suppliers remain price-competitive despite tariffs. Path B: Begin qualifying Mexican PLC alternatives now - 12-18 month transition, potentially higher component costs, but eliminates Section 301 exposure and strengthens USMCA qualification.

There's no obviously correct answer because Q1 2026 negotiating proposals haven't been published yet. Your Mexican steel concentration (32%) provides USMCA strength but creates single-country exposure. Geographic diversification would reduce risk, but your current suppliers have proven quality and established logistics."

## What We're Monitoring
Write 2-3 paragraphs describing what you're tracking and WHY it matters to their specific components. Structure around calendar milestones (Q1 2026 proposals, Mid-2026 findings, etc.).

${hasVolatileComponents ? `CRITICAL: This portfolio contains ${volatileComponents.length} components with VOLATILE tariff rates. Explain which components need daily/weekly checks vs quarterly checks and WHY:

DAILY MONITORING REQUIRED:
${volatileComponents.filter(c => c.volatility.tier === 1).map(c => `- ${c.component_type || c.description} (${c.origin_country || c.country}): ${c.volatility.reason}`).join('\n') || 'None'}

WEEKLY MONITORING REQUIRED:
${volatileComponents.filter(c => c.volatility.tier === 2).map(c => `- ${c.component_type || c.description} (${c.origin_country || c.country}): ${c.volatility.reason}`).join('\n') || 'None'}

Weave this into your monitoring narrative - explain that some rates change with executive proclamations (weekly checks) while others are stable (quarterly sufficient).` : ''}

Example:
"We're tracking three intelligence streams for you. First, the USMCA Joint Commission meeting schedule - Q1 2026 is when cumulation rule proposals get published. That's the signal for whether your Chinese PLC strategy needs revision. Second, USTR Section 301 review cycles - historically these spike in March/April, so we're watching for February announcements. Third, Mexico's Diario Oficial for labor compliance updates affecting your steel suppliers.

The next major decision point: Q1 2026 when we see actual negotiating text. That's when 'potential' becomes 'proposed' and strategic uncertainty starts resolving into policy language you can plan around."

---

**Return ONLY the markdown above. Do NOT wrap in JSON. Do NOT add code fences. Just pure markdown text.**

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
