/**
 * FILTER STRATEGIC ALERTS FOR USMCA 2026 SECTION (Alerts Dashboard)
 *
 * PURPOSE: Provide policy landscape awareness and forward-looking signals
 * DIFFERENT FROM: Portfolio briefing filter (which focuses on immediate actions)
 *
 * OBJECTIVES:
 * 1. Policy Landscape Awareness - What's the current trade environment?
 * 2. Forward-Looking Signals - What might affect USMCA 2026 renegotiation?
 * 3. Geopolitical Context - What trade shifts are happening globally?
 * 4. Email-Worthy Intelligence - What should users be notified about?
 *
 * Filters out: Earnings reports, logistics pricing, carrier operations, non-trade news
 */

import { BaseAgent } from '../../lib/agents/base-agent.js';

const strategicFilterAgent = new BaseAgent({
  name: 'StrategicAlertFilter',
  model: 'anthropic/claude-haiku-4.5',
  maxTokens: 2000
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { alerts, user_profile } = req.body;

    if (!alerts || !Array.isArray(alerts)) {
      return res.status(400).json({ error: 'Missing alerts array' });
    }

    console.log(`🤖 AI filtering ${alerts.length} alerts for strategic relevance...`);

    const userCountries = (user_profile?.componentOrigins || [])
      .map(c => c.origin_country || c.country)
      .filter(Boolean)
      .join(', ');

    const userIndustry = user_profile?.industry_sector || 'manufacturing';

    const prompt = `You are a trade policy intelligence analyst providing CONTEXT and AWARENESS for USMCA certificate holders preparing for the 2026 renegotiation.

USER'S SUPPLY CHAIN CONTEXT:
- Component origins: ${userCountries}
- Industry: ${userIndustry}
- Certificate type: USMCA (US/Canada/Mexico trade)

YOUR OBJECTIVES:
1. 📊 POLICY LANDSCAPE AWARENESS - What's the current trade environment?
2. 🔮 FORWARD-LOOKING SIGNALS - What might affect USMCA 2026 renegotiation?
3. 🌍 GEOPOLITICAL CONTEXT - What trade shifts are happening globally?
4. 📧 EMAIL-WORTHY INTELLIGENCE - What should users be notified about?

INCLUDE ONLY alerts that help users answer:
✅ "What's changing in US/Canada/Mexico trade relations?"
✅ "Are there signals about USMCA 2026 renegotiation priorities?"
✅ "What alternative sourcing regions are emerging (nearshoring, friendshoring)?"
✅ "What legislative/executive trade actions are happening?"
✅ "Are there policy shifts that could affect my certificate validity?"
✅ "Should I be preparing for rule changes in the next 12-24 months?"

INCLUDE:
✅ Trade policy announcements (tariff changes, trade agreements, Section 301/232)
✅ USMCA 2026 renegotiation developments or related discussions
✅ Legislative/executive actions affecting North American trade
✅ Trade negotiations signaling policy direction (USTR travel, bilateral talks)
✅ Nearshoring/reshoring trends tied to trade policy
✅ CBP guidance affecting certificate compliance
✅ Major supply chain realignments driven by trade policy

EXCLUDE (not strategic context):
❌ Earnings reports (company profits, quarterly results, financial performance)
❌ Logistics pricing (freight rates, diesel prices, shipping costs, capacity trends)
❌ Carrier operations (airline fleet orders, terminal expansions, warehouse automation)
❌ Individual business decisions (single company expansions, technology adoption)
❌ Non-trade regulatory topics (patents, immigration, gaming, postal, FDA)
❌ General market news without trade policy implications

ALERTS TO REVIEW:
${alerts.map((a, idx) => `
[${idx + 1}] Title: ${a.title}
Severity: ${a.severity}
Description: ${a.description}
Countries: ${(a.affected_countries || []).join(', ') || 'UNSPECIFIED'}
`).join('\n')}

TASK: Return ONLY the alert numbers (e.g., "1, 3, 7") that provide strategic trade policy CONTEXT for USMCA 2026 preparation. Be strict - when in doubt, exclude.

Your response should be ONLY the numbers separated by commas (e.g., "1, 3, 5, 7") or "NONE" if no alerts qualify.`;

    const aiResponse = await strategicFilterAgent.execute(prompt);

    console.log(`🤖 AI strategic filter response:`, aiResponse);

    // Parse AI response - handle different response formats
    const responseText = aiResponse.text || aiResponse.content || aiResponse.response || '';
    const selectedText = responseText.trim().toUpperCase();

    console.log(`🤖 Parsed response text: "${selectedText}"`);

    if (selectedText === 'NONE' || selectedText === '') {
      return res.status(200).json({
        success: true,
        strategic_alerts: [],
        total_reviewed: alerts.length,
        total_selected: 0
      });
    }

    // Parse numbers from response (e.g., "1, 3, 7" → [1, 3, 7])
    const selectedIndices = selectedText
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n > 0 && n <= alerts.length);

    const strategicAlerts = selectedIndices.map(idx => alerts[idx - 1]); // Convert 1-based to 0-based

    console.log(`✅ AI selected ${strategicAlerts.length}/${alerts.length} strategic alerts`);

    return res.status(200).json({
      success: true,
      strategic_alerts: strategicAlerts,
      total_reviewed: alerts.length,
      total_selected: strategicAlerts.length,
      ai_reasoning: aiResponse.text
    });

  } catch (error) {
    console.error('❌ Strategic alert filtering failed:', error);

    // Graceful fallback: return all alerts if AI fails
    return res.status(200).json({
      success: true,
      strategic_alerts: req.body.alerts,
      total_reviewed: req.body.alerts?.length || 0,
      total_selected: req.body.alerts?.length || 0,
      fallback: true,
      error: error.message
    });
  }
}
