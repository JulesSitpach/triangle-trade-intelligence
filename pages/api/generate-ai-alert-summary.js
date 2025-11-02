/**
 * GENERATE AI ALERT SUMMARY
 * Creates strategic briefing based on user's ACTUAL alerts + component data
 * References only alerts relevant to THIS user, not generic templates
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
    const { workflow_data, dynamic_alerts, user_id } = req.body;

    if (!workflow_data || !dynamic_alerts) {
      return res.status(400).json({ error: 'Missing workflow_data or dynamic_alerts' });
    }

    const companyName = workflow_data.company?.name || 'Your Company';
    const components = workflow_data.components || [];
    const rvc = workflow_data.usmca?.regional_content_percentage || 0;
    const qualificationStatus = workflow_data.usmca?.qualification_status;
    const totalVolume = components.reduce((sum, c) => sum + (c.annual_volume || 0), 0);

    // Build component summary
    const componentSummary = components.map(c =>
      `- ${c.component_type} (${c.origin_country || c.country}, HS ${c.hs_code}, $${(c.annual_volume || 0).toLocaleString()}, ${c.percentage || 0}% of costs)`
    ).join('\n');

    // Build alert summary
    const alertSummary = dynamic_alerts.map(a =>
      `Alert: ${a.title}
Type: ${a.type}
Component: ${a.component}
Impact: ${a.impact_percentage || a.buffer_remaining || a.impact_value}
Timeline: ${a.timeline}
Action: ${a.action}`
    ).join('\n\n');

    // Build the AI prompt - references ONLY THIS user's data
    const aiPrompt = `You are a Trade Compliance Director analyzing ${companyName}'s supply chain and active policy threats.

COMPANY PROFILE:
- Total Annual Volume: $${totalVolume.toLocaleString()}
- Current RVC: ${rvc.toFixed(1)}%
- USMCA Status: ${qualificationStatus || 'UNKNOWN'}
- Components: ${components.length} components across ${new Set(components.map(c => c.origin_country || c.country)).size} countries

COMPONENT PORTFOLIO:
${componentSummary}

ACTIVE ALERTS FOR THIS USER (${dynamic_alerts.length} alerts):
${alertSummary}

YOUR TASK:
Write a strategic briefing (800-1200 words) that:

1. **BOTTOM LINE**: Summarize ${companyName}'s total exposure across these ${dynamic_alerts.length} active alerts. What's the biggest threat?

2. **COMPONENT RISKS**: Analyze which components face the most critical threats based on these alerts. Use actual dollar figures.

3. **STRATEGIC CONSIDERATIONS**: Based on THEIR specific portfolio mix and alerts, what are the trade-offs?
   - If China components dominate (cumulation threat), discuss alternative sourcing vs. cost
   - If Mexico components dominant (labor cost threat), discuss timing and price guarantees
   - If RVC is low (buffer threat), discuss which components to qualify first

4. **TIMELINE & URGENCY**: Which deadlines matter most for ${companyName}?
   - December 15, 2025 (Mexico labor enforcement)
   - January 15, 2026 (USTR cumulation announcement)
   - July 2026 (USMCA formal review)

5. **ACTION PRIORITY**: Recommend 3-5 immediate actions based on THEIR alerts (not generic advice)

6. **MONITORING FOCUS**: What should ${companyName} monitor closely based on these alerts?

Use their actual numbers. Reference their specific origins and HS codes.
Reference the exact alerts they're facing, not generic risks.
Tone: Trade Compliance Director briefing to operations team.
Style: Direct, actionable, data-driven.`;

    console.log('🤖 Generating AI summary for:', companyName);
    console.log('📋 Alert count:', dynamic_alerts.length);
    console.log('💼 RVC:', rvc);

    // Call AI endpoint (using BaseAgent pattern for 2-tier fallback)
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
        messages: [
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      console.warn('⚠️ OpenRouter failed, trying Anthropic direct...');

      // Fallback to Anthropic direct
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: aiPrompt
            }
          ]
        })
      });

      if (!anthropicResponse.ok) {
        throw new Error('Both OpenRouter and Anthropic failed');
      }

      const anthropicData = await anthropicResponse.json();
      const summary = anthropicData.content[0]?.text || 'Unable to generate summary';

      // Log the generated summary
      if (user_id) {
        try {
          await supabase.from('alert_summaries').insert({
            user_id,
            company_name: companyName,
            alert_count: dynamic_alerts.length,
            rvc_percentage: rvc,
            usmca_status: qualificationStatus,
            total_portfolio_value: totalVolume,
            summary_text: summary,
            alerts_included: dynamic_alerts.map(a => a.id),
            generated_at: new Date().toISOString()
          });
        } catch (dbError) {
          console.warn('⚠️ Failed to log summary to database:', dbError);
        }
      }

      return res.status(200).json({
        success: true,
        summary,
        company: companyName,
        alert_count: dynamic_alerts.length,
        rvc: rvc,
        portfolio_value: totalVolume
      });
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content || 'Unable to generate summary';

    // Log the generated summary
    if (user_id) {
      try {
        await supabase.from('alert_summaries').insert({
          user_id,
          company_name: companyName,
          alert_count: dynamic_alerts.length,
          rvc_percentage: rvc,
          usmca_status: qualificationStatus,
          total_portfolio_value: totalVolume,
          summary_text: summary,
          alerts_included: dynamic_alerts.map(a => a.id),
          generated_at: new Date().toISOString()
        });
      } catch (dbError) {
        console.warn('⚠️ Failed to log summary to database:', dbError);
      }
    }

    return res.status(200).json({
      success: true,
      summary,
      company: companyName,
      alert_count: dynamic_alerts.length,
      rvc: rvc,
      portfolio_value: totalVolume
    });

  } catch (error) {
    console.error('❌ AI summary generation failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
