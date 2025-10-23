/**
 * AI Trade Intelligence Advisor
 * Provides conversational, strategic guidance based on user's complete component data
 * Tier-gated: Starter gets basic analysis, Professional gets optimization advice, Premium gets strategic guidance
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { user_profile, subscription_tier = 'Starter' } = req.body;

    if (!user_profile || !user_profile.componentOrigins) {
      return res.status(400).json({
        success: false,
        message: 'Missing user profile or component data'
      });
    }

    console.log(`🧠 Generating AI advisor insights for ${user_profile.companyName} (${subscription_tier} tier)`);

    // Build comprehensive context from component data
    const componentContext = buildComponentContext(user_profile);

    // Generate tier-appropriate advisory insights
    const advisorInsights = await generateAdvisoryInsights(
      user_profile,
      componentContext,
      subscription_tier
    );

    return res.status(200).json({
      success: true,
      advisor_insights: advisorInsights,
      tier: subscription_tier
    });

  } catch (error) {
    console.error('❌ AI Trade Advisor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate advisor insights',
      error: error.message
    });
  }
}

/**
 * Build comprehensive context from component data
 */
function buildComponentContext(profile) {
  const components = profile.componentOrigins || [];

  // Calculate risk metrics
  const totalComponents = components.length;
  const chineseComponents = components.filter(c => (c.origin_country || c.country) === 'CN');
  const chinaPercentage = chineseComponents.reduce((sum, c) => sum + (c.percentage || c.value_percentage || 0), 0);

  const lowConfidenceComponents = components.filter(c => c.ai_confidence && c.ai_confidence < 80);
  const highSavingsComponents = components.filter(c => c.savings_percentage && c.savings_percentage > 5);

  const mexicoComponents = components.filter(c => (c.origin_country || c.country) === 'MX');
  const mexicoPercentage = mexicoComponents.reduce((sum, c) => sum + (c.percentage || c.value_percentage || 0), 0);

  const usmcaComponents = components.filter(c => ['US', 'MX', 'CA'].includes(c.origin_country || c.country));
  const usmcaPercentage = usmcaComponents.reduce((sum, c) => sum + (c.percentage || c.value_percentage || 0), 0);

  // Calculate financial exposure
  const tradeVolume = profile.trade_volume || (() => {
    console.warn('⚠️ [FORM SCHEMA] Missing profile.trade_volume in ai-trade-advisor');
    return 0;
  })();
  const totalTariffExposure = components.reduce((sum, c) => {
    const componentValue = tradeVolume * ((c.percentage || c.value_percentage || 0) / 100);
    const tariffCost = componentValue * ((c.mfn_rate || 0) / 100);
    return sum + tariffCost;
  }, 0);

  const potentialSavings = components.reduce((sum, c) => {
    const componentValue = tradeVolume * ((c.percentage || c.value_percentage || 0) / 100);
    const savings = componentValue * ((c.savings_percentage || 0) / 100);
    return sum + savings;
  }, 0);

  return {
    total_components: totalComponents,
    china_exposure: {
      component_count: chineseComponents.length,
      percentage: chinaPercentage,
      components: chineseComponents.map(c => ({
        description: c.description || c.component_type,
        percentage: c.percentage || c.value_percentage,
        hs_code: c.hs_code,
        mfn_rate: c.mfn_rate
      }))
    },
    mexico_presence: {
      component_count: mexicoComponents.length,
      percentage: mexicoPercentage
    },
    usmca_content: {
      percentage: usmcaPercentage,
      threshold: profile.requiredThreshold || 65,
      qualified: profile.qualificationStatus === 'QUALIFIED'
    },
    quality_concerns: {
      low_confidence_count: lowConfidenceComponents.length,
      components: lowConfidenceComponents.map(c => ({
        description: c.description || c.component_type,
        confidence: c.ai_confidence,
        hs_code: c.hs_code
      }))
    },
    savings_opportunities: {
      total_potential: potentialSavings,
      high_impact_components: highSavingsComponents.map(c => ({
        description: c.description || c.component_type,
        savings_percentage: c.savings_percentage,
        current_rate: c.mfn_rate,
        usmca_rate: c.usmca_rate
      }))
    },
    financial_summary: {
      trade_volume: tradeVolume,
      total_tariff_exposure: totalTariffExposure,
      potential_savings: potentialSavings
    }
  };
}

/**
 * Generate conversational advisory insights based on tier
 */
async function generateAdvisoryInsights(profile, context, tier) {
  const prompt = buildAdvisoryPrompt(profile, context, tier);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4.5",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.7 // Slightly creative for natural advisory tone
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

    // Parse AI response
    let insights;
    try {
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[1]);
      } else {
        insights = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', aiResponse.substring(0, 500));
      throw new Error('Invalid JSON from AI');
    }

    return insights;

  } catch (error) {
    console.error('❌ AI advisor generation error:', error);
    throw error;
  }
}

/**
 * Build tier-appropriate prompt for advisory insights
 */
function buildAdvisoryPrompt(profile, context, tier) {
  const baseContext = `You are an experienced trade compliance advisor with 20+ years of expertise. You're having a conversation with ${profile.companyName}, providing strategic guidance on their ${profile.productDescription} supply chain.

=== THEIR CURRENT SITUATION ===
Company: ${profile.companyName}
Product: ${profile.productDescription}
Annual Trade Volume: ${formatCurrency(context.financial_summary.trade_volume)}
USMCA Status: ${profile.qualificationStatus} (${context.usmca_content.percentage}% North American content vs ${context.usmca_content.threshold}% required)

Current Tariff Exposure: ${formatCurrency(context.financial_summary.total_tariff_exposure)} annually
Potential USMCA Savings: ${formatCurrency(context.financial_summary.potential_savings)} annually

Supply Chain Composition:
- ${context.total_components} components analyzed
- ${context.china_exposure.percentage.toFixed(1)}% sourced from China (${context.china_exposure.component_count} components)
- ${context.mexico_presence.percentage.toFixed(1)}% sourced from Mexico (${context.mexico_presence.component_count} components)
- ${context.usmca_content.percentage.toFixed(1)}% total USMCA content

${context.quality_concerns.low_confidence_count > 0 ? `Quality Concerns:
- ${context.quality_concerns.low_confidence_count} components with AI confidence below 80%
${context.quality_concerns.components.map(c => `  • ${c.description}: ${c.confidence}% confidence on HS ${c.hs_code}`).join('\n')}
` : ''}

${context.china_exposure.components.length > 0 ? `Chinese Components Detail:
${context.china_exposure.components.map(c => `- ${c.description}: ${c.percentage}% of product, HS ${c.hs_code}, ${c.mfn_rate}% tariff`).join('\n')}
` : ''}`;

  // Tier-specific prompts
  const tierPrompts = {
    'Starter': `${baseContext}

=== YOUR TASK (STARTER TIER) ===
Provide a brief, encouraging overview of their situation. Focus on:
1. What they're doing well
2. 1-2 high-level opportunities they should explore
3. Why upgrading would give them deeper insights

Keep it conversational and advisory. No bullet points - speak naturally like you're on a call with them.

Return JSON:
{
  "greeting": "Brief, warm opening acknowledging their situation (2-3 sentences)",
  "current_position": "What they're doing well right now (2-3 sentences)",
  "high_level_opportunity": "One key opportunity to consider, explained conversationally (3-4 sentences)",
  "tier_limitation": "Friendly explanation of what deeper insights Premium tier would provide (2 sentences)",
  "closing": "Encouraging closing thought (1-2 sentences)"
}`,

    'Professional': `${baseContext}

=== YOUR TASK (PROFESSIONAL TIER) ===
Provide strategic guidance as their trusted trade advisor. Be conversational, not robotic.

Focus on:
1. Strategic position assessment (where they stand competitively)
2. Practical optimization opportunities with clear ROI
3. Implementation roadmap (what to tackle first and why)
4. Risk mitigation (what keeps you up at night about their supply chain)

Speak like you're advising a client over coffee, not writing a report. Use "you" and "your". Explain the "why" behind recommendations.

Return JSON:
{
  "strategic_assessment": "Conversational assessment of their competitive position and supply chain health (4-5 sentences). Start with the big picture, not details.",

  "immediate_priorities": "What they should focus on RIGHT NOW and why. One clear priority with reasoning (3-4 sentences). Not a list - a conversation about what matters most.",

  "optimization_opportunity": {
    "what": "The opportunity explained naturally (2-3 sentences)",
    "why_it_matters": "Business impact and urgency (2-3 sentences)",
    "how_to_approach": "Practical first steps (3-4 sentences, conversational)",
    "expected_outcome": "What success looks like (1-2 sentences)"
  },

  "risk_perspective": "What you'd be concerned about if this was your business. Honest, advisor-to-client (3-4 sentences)",

  "next_quarter_roadmap": "If you were running their supply chain, what would you tackle in the next 90 days and in what order. Conversational reasoning (4-5 sentences)"
}`,

    'Premium': `${baseContext}

=== YOUR TASK (PREMIUM TIER) ===
You're their dedicated trade strategist. Provide executive-level insights that justify the premium investment.

Deliver:
1. Competitive intelligence (how they compare to industry)
2. Strategic positioning advice (not just cost savings - market positioning)
3. Executive decision framework (when to act, when to wait)
4. Proactive risk management (what's coming before it hits)

Write like you're presenting to a CEO: strategic, insightful, forward-looking. This is white-glove advisory.

Return JSON:
{
  "executive_summary": "Bottom line: Where they stand and what it means for their business. CEO-level perspective (3-4 sentences)",

  "strategic_position": {
    "competitive_standing": "How their supply chain compares to industry benchmarks. Honest assessment (3-4 sentences)",
    "hidden_advantages": "What they're doing better than they realize (2-3 sentences)",
    "vulnerability_exposure": "What would happen if their top supplier had issues tomorrow. Real talk (3-4 sentences)"
  },

  "strategic_guidance": {
    "short_term_actions": "Next 30 days - what demands immediate attention and why (3-4 sentences)",
    "medium_term_positioning": "Next 6 months - how to strengthen their competitive position (4-5 sentences)",
    "long_term_strategy": "12+ months - where trade policy is heading and how to position ahead of it (4-5 sentences)"
  },

  "financial_perspective": {
    "current_exposure": "What they're spending that they don't need to (2-3 sentences)",
    "optimization_roi": "Specific dollar impact of recommended changes, with reasoning (3-4 sentences)",
    "investment_priorities": "Where to invest in supply chain vs where to optimize (3-4 sentences)"
  },

  "early_warning_insights": "What you're watching in trade policy and supply chains that could affect them in 3-6 months. Proactive intelligence (4-5 sentences)",

  "executive_recommendation": "If you had 15 minutes with their CEO, what would you tell them to do. Clear, actionable, strategic (3-4 sentences)"
}`,

    'Trial': `${baseContext}

=== YOUR TASK (FREE TRIAL) ===
Give them a taste of what AI-powered trade advisory can do, but leave them wanting more.

Return JSON:
{
  "welcome": "Warm welcome explaining what you're about to show them (2 sentences)",
  "snapshot": "High-level view of their supply chain in plain English (3-4 sentences)",
  "teaser_insight": "One genuinely useful insight that shows the value of AI analysis (2-3 sentences)",
  "upgrade_value": "What they'd get with a paid subscription, explained as value not features (2-3 sentences)"
}`
  };

  return tierPrompts[tier] || tierPrompts['Trial'];
}

function formatCurrency(amount) {
  if (!amount || amount === 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
