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

    // STEP 4: Build alert context for AI prompt
    const alertContext = matchedAlerts.length > 0
      ? `REAL POLICY ALERTS AFFECTING THIS USER (${matchedAlerts.length}):
${matchedAlerts.map(a =>
  `- ${a.title}
  Announcement Date: ${a.announcement_date || a.created_at}
  Affected: ${(a.affected_countries || []).join(', ')} | HS Codes: ${(a.affected_hs_codes || []).join(', ')}
  Impact: ${a.description}
  Source: ${a.detection_source || 'Federal Register / USTR / Government Announcement'}
  Deadline: ${a.deadline || 'See source for timeline'}`
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

YOUR TASK - WRITE A 4-SECTION STRATEGIC BRIEFING:

1. **BOTTOM LINE FOR LEADERSHIP** (2-3 sentences)
   - What's the biggest risk/opportunity for this company right now?
${matchedAlerts.length > 0 ? '   - Reference the real policy announcement(s) that triggered this' : '   - Base on USMCA 2026 renegotiation landscape'}

2. **COMPONENT RISK BREAKDOWN** (For each component with risk)
   - Which components are vulnerable and why?
${matchedAlerts.length > 0 ? '   - If a real alert matched: cite the announcement, source, and deadline\n   - Use definitive language: "announced", "effective", "confirmed"' : '   - Use forward-looking language: "potential", "could face", "we are tracking"'}

3. **STRATEGIC CONSIDERATIONS** (3-4 bullet points)
   - What are the trade-offs for this company?
   - Should they diversify, nearshore, increase eligible content, or wait?
${matchedAlerts.length > 0 ? '   - Factor in the real alerts when recommending actions' : '   - Base on their portfolio structure and 2026 renegotiation risks'}

4. **WHAT WE'RE MONITORING** (For ongoing intelligence)
   - What specific announcements/dates matter for THIS company?
   - Which HS codes, countries, or sectors are you tracking?
${matchedAlerts.length > 0 ? '   - Note: Real alert(s) detected. Now tracking implementation timelines.' : '   - Currently no active policy announcements. Monitoring continues.'}

---

TONE: Professional trade compliance director. Data-driven. Honest about uncertainties.
LENGTH: 800-1000 words total
LANGUAGE:
${matchedAlerts.length > 0 ? '- Use definitive language for real alerts: "announced December 3", "effective January 15"' : '- Use conditional language for potential risks: "could face", "expected to", "we anticipate"'}
- Reference their actual numbers and components
- Cite sources for any real policy announcements`;

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
      const briefing = anthropicData.content[0]?.text || 'Unable to generate briefing';

      return res.status(200).json({
        success: true,
        briefing,
        company: companyName,
        portfolio_value: totalVolume,
        rvc: rvc,
        real_alerts_matched: matchedAlerts.length,
        generated_at: new Date().toISOString()
      });
    }

    const data = await response.json();
    const briefing = data.choices[0]?.message?.content || 'Unable to generate briefing';

    return res.status(200).json({
      success: true,
      briefing,
      company: companyName,
      portfolio_value: totalVolume,
      rvc: rvc,
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
