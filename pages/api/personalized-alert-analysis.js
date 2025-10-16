/**
 * POST /api/personalized-alert-analysis
 * Analyze tariff policy alerts with user's specific business context
 * Returns personalized impact assessment with dollar amounts and recommendations
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { policy_alert, user_profile } = req.body;

    if (!policy_alert || !user_profile) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: policy_alert and user_profile'
      });
    }

    console.log(`🎯 Personalizing alert "${policy_alert.title}" for ${user_profile.companyName}`);

    // Call AI to analyze impact on THIS SPECIFIC USER
    const personalizedAnalysis = await analyzeImpactForUser(policy_alert, user_profile);

    return res.status(200).json({
      success: true,
      analysis: personalizedAnalysis
    });

  } catch (error) {
    console.error('❌ Error in personalized alert analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze alert impact',
      error: error.message
    });
  }
}

/**
 * Analyze policy alert impact using AI with full business context
 */
async function analyzeImpactForUser(policy_alert, user_profile) {
  try {
    // Build component context from user's workflow data
    const componentContext = user_profile.componentOrigins?.map(c => {
      return `- ${c.component_type || c.description}: ${c.percentage}% from ${c.origin_country || c.country} (HS ${c.hs_code || 'unknown'})`;
    }).join('\n') || 'No component data available';

    // Calculate total trade volume for impact estimates
    const tradeVolume = user_profile.annualTradeVolume ||
                       user_profile.trade_volume ||
                       'unknown';

    const prompt = `You are a trade policy analyst providing PERSONALIZED impact analysis for a specific company.

=== USER BUSINESS CONTEXT ===
Company: ${user_profile.companyName}
Business Type: ${user_profile.businessType}
Product: ${user_profile.productDescription}
Annual Trade Volume: $${tradeVolume}
USMCA Status: ${user_profile.qualificationStatus || 'Unknown'}

Component Breakdown:
${componentContext}

=== POLICY ALERT ===
Title: ${policy_alert.title}
Description: ${policy_alert.description}
Category: ${policy_alert.category}
Severity: ${policy_alert.severity}
Affected Countries: ${policy_alert.affected_countries?.join(', ') || 'Unknown'}
Affected HS Codes: ${policy_alert.affected_hs_codes?.join(', ') || 'Not specified'}
Tariff Adjustment: ${policy_alert.tariff_adjustment || 'Not specified'}

=== ANALYSIS REQUIRED ===

Provide a PERSONALIZED impact assessment for THIS SPECIFIC COMPANY:

1. **Relevance Score (1-10)**: How relevant is this to THEIR business specifically?
   - 10: Direct impact on their components/routes
   - 7-9: Significant impact on their supply chain
   - 4-6: Indirect impact, worth monitoring
   - 1-3: Not relevant to their specific trade

2. **Affected Components**: Which of THEIR components are affected? Be specific.

3. **Dollar Impact Estimate**: Rough estimate based on their trade volume and affected components.
   - Example: "~$500K/year increase on Chinese microcontrollers"
   - If cannot estimate, say "Cannot estimate without more data"

4. **Concise Explanation** (1-2 sentences): Why this matters to THEM specifically.
   - Example: "This tariff increase affects 40% of your supply chain (Chinese microcontrollers), adding approximately $500K-$1M annually to your component costs."
   - Focus on THEIR specific components, percentages, and origins

5. **Action Items** (2-3 specific recommendations):
   - Example: "1. Contact Triangle Crisis Navigator for immediate sourcing alternatives"
   - Example: "2. Evaluate Mexico-based microcontroller suppliers to avoid China tariffs"
   - Example: "3. Reassess USMCA qualification path (currently 35% NA, need 65%)"

6. **Urgency Level**:
   - URGENT: Requires immediate action (days)
   - HIGH: Address within 2-4 weeks
   - MEDIUM: Plan for next quarter
   - LOW: Monitor for now

Return ONLY valid JSON in this exact format:
{
  "relevance_score": 8,
  "affected_components": [
    {
      "component": "Microcontrollers",
      "percentage": 40,
      "origin": "CN",
      "hs_code": "8542.31.00",
      "impact": "Direct tariff increase from 0% to 100%"
    }
  ],
  "dollar_impact": {
    "estimate": "$500K-$1M annually",
    "confidence": "medium",
    "explanation": "Based on 40% of $2.5M trade volume affected by 100% tariff"
  },
  "explanation": "This tariff increase directly affects 40% of your supply chain (Chinese microcontrollers), potentially doubling your component costs for these parts.",
  "action_items": [
    "Contact Triangle Crisis Navigator team for immediate sourcing alternatives",
    "Evaluate Mexico-based microcontroller suppliers to avoid China tariffs",
    "Reassess USMCA qualification strategy (currently 35% NA content, need 65%)"
  ],
  "urgency": "URGENT",
  "reasoning": "Immediate policy change affecting large portion of your supply chain with significant cost impact"
}

IMPORTANT:
- Be SPECIFIC to their components, percentages, and trade routes
- Provide DOLLAR ESTIMATES when possible (even rough ones)
- Focus on ACTIONABLE insights, not generic advice
- If the policy does NOT affect them, say so clearly (low relevance score)
- Keep explanation concise (1-2 sentences max)`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4.5", // Sonnet 4.5 for professional alert summaries (user-facing)
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.3 // Slight creativity for professional writing while staying accurate
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse AI response (extract JSON from markdown code blocks if present)
    let analysis;
    try {
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        analysis = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', aiResponse);
      throw new Error('Invalid JSON from AI');
    }

    console.log(`✅ Personalized analysis complete: Relevance ${analysis.relevance_score}/10, Urgency: ${analysis.urgency}`);

    return {
      success: true,
      relevance_score: analysis.relevance_score || 0,
      affected_components: analysis.affected_components || [],
      dollar_impact: analysis.dollar_impact || { estimate: 'Unknown', confidence: 'low' },
      explanation: analysis.explanation || 'No specific impact identified',
      action_items: analysis.action_items || [],
      urgency: analysis.urgency || 'LOW',
      reasoning: analysis.reasoning || '',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ AI analysis error:', error.message);
    return {
      success: false,
      error: error.message,
      relevance_score: 0,
      explanation: 'Unable to analyze impact - please review manually'
    };
  }
}
