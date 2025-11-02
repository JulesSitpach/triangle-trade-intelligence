/**
 * GENERATE PORTFOLIO BRIEFING
 * Strategic analysis of user's supply chain against USMCA 2026 renegotiation
 * Integrates real policy alerts if detected, uses forward-looking language if not
 *
 * This is NOT template generation. This is real portfolio analysis enriched with
 * any actual policy announcements detected by RSS monitoring.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workflow_data, user_id } = req.body;

    if (!workflow_data) {
      return res.status(400).json({ error: 'Missing workflow_data' });
    }

    const companyName = workflow_data.company?.name || 'Your Company';
    const components = workflow_data.components || [];
    const rvc = workflow_data.usmca?.regional_content_percentage || 0;
    const qualificationStatus = workflow_data.usmca?.qualification_status;
    const totalVolume = components.reduce((sum, c) => sum + (c.annual_volume || 0), 0);

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

    // STEP 3: Build portfolio analysis for AI prompt
    const componentSummary = components.map(c => {
      const percentage = totalVolume > 0 ? (c.annual_volume / totalVolume * 100).toFixed(1) : 0;
      const matchingAlert = matchedAlerts.find(a =>
        a.affected_countries?.includes((c.origin_country || c.country || '').toUpperCase()) ||
        a.affected_hs_codes?.some(code => (c.hs_code || '').replace(/\./g, '').includes(code.replace(/\./g, '').substring(0, 6)))
      );

      return `- ${c.component_type || c.description} (${c.origin_country || c.country}, HS ${c.hs_code}, $${(c.annual_volume || 0).toLocaleString()}, ${percentage}% of costs)${
        matchingAlert ? ` [REAL ALERT: ${matchingAlert.title}]` : ''
      }`;
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

    // STEP 5: Build the AI prompt
    const aiPrompt = `You are a Trade Compliance Director at a global supply chain consultancy.

You are analyzing ${companyName}'s supply chain positioning ahead of the USMCA 2026 renegotiation review.

COMPANY PROFILE:
- Annual Import Volume: $${totalVolume.toLocaleString()}
- Current USMCA RVC: ${rvc.toFixed(1)}%
- USMCA Status: ${qualificationStatus || 'UNKNOWN'}
- Component Count: ${components.length}
- Origin Countries: ${[...new Set(userComponentOrigins)].join(', ')}

COMPONENT PORTFOLIO:
${componentSummary}

USMCA 2026 RENEGOTIATION CONTEXT:
The USMCA trade agreement enters formal review in 2026. Key uncertainty areas:
- Rules of Origin requirements could increase (RVC thresholds may go up)
- Labor provisions could expand (all three countries pressuring)
- Sector-specific rules under review (automotive, textiles, agriculture)
- Key dates: Q1 2026 (negotiation proposals), July 1, 2026 (formal review begins)

${alertContext}

YOUR TASK - GENERATE A STRUCTURED PORTFOLIO BRIEFING (JSON FORMAT):

Return a JSON object with these sections (NOT narrative text):

{
  "briefing_type": "PORTFOLIO_INTELLIGENCE_BRIEFING",
  "company": "${companyName}",
  "generated_at": "${new Date().toISOString()}",
  "situation_summary": "2-3 sentence executive summary: What's changing for this portfolio?",
  "critical_alerts": [
    {
      "alert_title": "The policy name/change",
      "severity": "CRITICAL|HIGH|MEDIUM",
      "impact_on_portfolio": "X% of your trade volume affected",
      "affected_components": ["Component 1", "Component 2"],
      "announcement_date": "YYYY-MM-DD",
      "effective_date": "YYYY-MM-DD",
      "why_it_matters": "Specific impact on your business",
      "action_required": "What your company should do THIS WEEK"
    }
  ],
  "portfolio_at_risk": {
    "total_volume_affected_pct": XX,
    "vulnerable_components": ["list of at-risk components"],
    "vulnerable_countries": ["list of at-risk sourcing countries"],
    "vulnerable_hs_codes": ["list of affected product categories"]
  },
  "immediate_actions": [
    "Action 1 (do this week)",
    "Action 2 (do this month)",
    "Action 3 (strategic consideration)"
  ],
  "timeline": {
    "week_1": "What changes immediately",
    "month_1": "Next 30 days milestones",
    "q2_2026": "USMCA renegotiation window",
    "ongoing": "What to monitor continuously"
  },
  "what_were_monitoring": {
    "tracking_these_hs_codes": ${JSON.stringify(userComponentHS)},
    "tracking_these_countries": ${JSON.stringify([...new Set(userComponentOrigins)])},
    "monitoring_sources": "USTR, Federal Register, Mexico labor ministry, Canada ISAC",
    "update_frequency": "Real-time alerts pushed to email (daily digest)"
  },
  "strategic_note": "Professional insight about their portfolio positioning for 2026 USMCA review"
}

CRITICAL REQUIREMENTS:
- CHERRY-PICK only the 2-3 most critical alerts (not all ${rankedAlerts.length} alerts)
${matchedAlerts.length > 0 ? '- Use definitive language for real alerts: "announced December 3", "effective January 15"\n- Reference actual policy sources (government announcements, not speculation)' : '- Use forward-looking language: "potential", "expected", "we are tracking"\n- Base on USMCA 2026 renegotiation risks and industry trends'}
- Reference their actual numbers: ${totalVolume.toLocaleString()} annual volume, ${rvc.toFixed(1)}% RVC, ${components.length} components
- Format ALL output as valid JSON (no markdown, no narrative text)
- Ensure action items are specific and timely
- Be honest about confidence levels

TONE: Professional trade compliance director. Data-driven. Consulting-grade.`;

    console.log('🤖 Calling AI to generate portfolio briefing...');

    // STEP 6: Call AI (with 2-tier fallback)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://triangle-trade-intelligence.vercel.app',
        'X-Title': 'Triangle Trade Intelligence'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
        messages: [{ role: 'user', content: aiPrompt }],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.warn('⚠️ OpenRouter failed, trying Anthropic direct...');

      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 2000,
          messages: [{ role: 'user', content: aiPrompt }]
        })
      });

      if (!anthropicResponse.ok) {
        throw new Error('Both OpenRouter and Anthropic failed');
      }

      const anthropicData = await anthropicResponse.json();
      const briefingText = anthropicData.content[0]?.text || 'Unable to generate briefing';

      try {
        // Parse JSON response from AI
        const briefingJson = JSON.parse(briefingText);
        return res.status(200).json({
          success: true,
          briefing: briefingJson,
          company: companyName,
          portfolio_value: totalVolume,
          rvc: rvc,
          real_alerts_matched: matchedAlerts.length,
          generated_at: new Date().toISOString()
        });
      } catch (parseError) {
        console.error('Failed to parse Anthropic JSON response:', parseError);
        return res.status(500).json({
          success: false,
          error: 'AI response was not valid JSON',
          raw_response: briefingText.substring(0, 500)
        });
      }
    }

    const data = await response.json();
    const briefingText = data.choices[0]?.message?.content || 'Unable to generate briefing';

    try {
      // Parse JSON response from AI
      const briefingJson = JSON.parse(briefingText);
      return res.status(200).json({
        success: true,
        briefing: briefingJson,
        company: companyName,
        portfolio_value: totalVolume,
        rvc: rvc,
        real_alerts_matched: matchedAlerts.length,
        generated_at: new Date().toISOString()
      });
    } catch (parseError) {
      console.error('Failed to parse OpenRouter JSON response:', parseError);
      return res.status(500).json({
        success: false,
        error: 'AI response was not valid JSON',
        raw_response: briefingText.substring(0, 500)
      });
    }

  } catch (error) {
    console.error('❌ Portfolio briefing generation failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
