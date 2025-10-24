/**
 * POST /api/executive-trade-alert
 * Generate ONE executive-ready trade alert summary
 * Flexible for any industry, any company, any tariff situation
 * Written as a broker who knows their business
 *
 * Input:
 * - user_profile: Company details, components, trade volume, industry
 * - workflow_intelligence: detailed_analysis, strategic_insights, savings_analysis from USMCA workflow
 * - raw_alerts: The 5 personalized policy alerts (for context)
 *
 * Output:
 * - ONE executive summary alert (no boxes, no repetition)
 * - CEO-ready, broker voice (knowledgeable, personal, cares about their business)
 * - Clear roadmap, financial impact, action items
 * - Email trigger configuration
 */

import { DevIssue } from '../../lib/utils/logDevIssue.js';
import { parseTradeVolume } from '../../lib/utils/parseTradeVolume.js';
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
    const { user_profile, workflow_intelligence, raw_alerts, user_id, workflow_session_id } = req.body;

    // === VALIDATION ===
    if (!user_profile || !workflow_intelligence || !raw_alerts) {
      await DevIssue.missingData('executive_trade_alert_api', 'required fields', {
        endpoint: '/api/executive-trade-alert',
        has_user_profile: !!user_profile,
        has_workflow_intelligence: !!workflow_intelligence,
        has_raw_alerts: !!raw_alerts
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: user_profile, workflow_intelligence, raw_alerts'
      });
    }

    console.log(`🎯 Generating executive trade alert for ${user_profile.companyName}`);

    // Generate the executive summary using AI
    const executiveAlert = await generateExecutiveAlert(user_profile, workflow_intelligence, raw_alerts);

    // === SAVE TO DATABASE ===
    // Extract data needed for executive_summaries table
    const usmcaData = workflow_intelligence?.usmca || {};
    const savingsData = workflow_intelligence?.savings || {};
    const componentBreakdown = usmcaData.component_breakdown || [];

    // Calculate gap
    const currentContent = usmcaData.north_american_content || 0;
    const thresholdApplied = usmcaData.threshold_applied || 65;
    const gapPercentage = currentContent - thresholdApplied;

    // Extract critical components (non-USMCA)
    const criticalComponents = componentBreakdown
      .filter(c => !c.is_usmca_member)
      .sort((a, b) => (b.value_percentage || 0) - (a.value_percentage || 0))
      .slice(0, 3);

    // Expires in 90 days (USMCA data becomes stale after that)
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const summaryData = {
      user_id,
      workflow_session_id,
      company_name: user_profile.companyName || 'Unknown',
      company_country: user_profile.companyCountry,
      product_description: user_profile.productDescription,
      hs_code: user_profile.hsCode,
      destination_country: user_profile.destinationCountry,
      annual_trade_volume: parseTradeVolume(user_profile.tradeVolume) || 0,

      // USMCA Analysis
      usmca_qualified: usmcaData.qualified || false,
      regional_content_percentage: currentContent,
      threshold_applied: thresholdApplied,
      gap_percentage: gapPercentage,
      qualification_rule: usmcaData.qualification_rule || `RVC ${thresholdApplied}%`,

      // Financial Impact
      annual_tariff_burden: savingsData.annual_burden || 0,
      potential_annual_savings: savingsData.annual_savings || 0,
      savings_percentage: savingsData.savings_percentage || 0,
      monthly_tariff_burden: (savingsData.annual_burden || 0) / 12,
      tariff_as_percent_of_volume: ((savingsData.annual_burden || 0) / (parseFloat(user_profile.tradeVolume) || 1)) * 100,

      // Strategic Content
      headline: executiveAlert.headline,
      situation_brief: executiveAlert.situation_brief,
      executive_summary: executiveAlert.executive_summary,
      financial_snapshot: executiveAlert.financial_snapshot,
      strategic_roadmap: executiveAlert.strategic_roadmap,
      action_this_week: executiveAlert.action_this_week || [],
      recommendations: executiveAlert.what_impacts_them || [],

      // Components
      component_breakdown: componentBreakdown,
      critical_components: criticalComponents,

      // AI Metadata
      ai_confidence: workflow_intelligence?.confidence_score || 0.85,
      generation_timestamp: new Date().toISOString(),
      ai_model_used: 'anthropic/claude-sonnet-4.5',
      ai_cost_cents: 2, // Typical cost for Sonnet response

      expires_at: expiresAt
    };

    // Save to database
    let savedSummary = null;
    try {
      const { data: inserted, error: dbError } = await supabase
        .from('executive_summaries')
        .insert([summaryData])
        .select('id')
        .single();

      if (dbError) {
        console.error('❌ Database save error:', dbError);
        // Don't fail the API if database save fails - still return the alert
        await DevIssue.apiError('executive_trade_alert_api', 'database_save', dbError, {
          company: user_profile.companyName,
          user_id
        });
      } else {
        savedSummary = inserted;
        console.log(`✅ Executive summary saved to database: ${inserted.id}`);
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError.message);
      // Continue without saving - don't block API response
    }

    return res.status(200).json({
      success: true,
      alert: executiveAlert,
      summary_id: savedSummary?.id || null,
      message: savedSummary ? 'Summary saved to database' : 'Summary generated (database save failed)'
    });

  } catch (error) {
    console.error('❌ Error generating executive trade alert:', error);
    await DevIssue.apiError('executive_trade_alert_api', '/api/executive-trade-alert', error, {
      company: req.body?.user_profile?.companyName || 'unknown'
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to generate executive trade alert',
      error: error.message
    });
  }
}

/**
 * Generate ONE executive alert using AI
 * Not hardcoded - flexibile for any industry, any situation
 */
async function generateExecutiveAlert(userProfile, workflowIntelligence, rawAlerts) {
  try {
    // Extract key metrics from workflow intelligence (actual database structure)
    // workflowIntelligence comes from workflow_data JSONB in database
    const usmcaData = workflowIntelligence?.usmca || {};
    const savingsData = workflowIntelligence?.savings || {};
    const componentBreakdown = usmcaData.component_breakdown || [];

    // Determine most critical components from actual database data
    const components = userProfile.componentOrigins || componentBreakdown || [];

    // Find non-USMCA components (those with non-USMCA member origins)
    const nonQualifyingComponents = componentBreakdown.filter(c =>
      !c.is_usmca_member
    ).sort((a, b) => (b.value_percentage || 0) - (a.value_percentage || 0));

    const mostCriticalComponent = nonQualifyingComponents[0];

    // Use actual database values - NOT hardcoded
    const potentialSavings = savingsData.annual_savings || 0; // From database
    const annualBurden = savingsData.annual_savings || 0; // What they could save
    const thresholdApplied = usmcaData.threshold_applied || null; // From database
    const currentContent = usmcaData.north_american_content || 0; // From database
    const isQualified = usmcaData.qualified || false; // From database

    // Build component context for AI
    const componentContext = components.map(c => {
      const percentage = c.percentage || c.value_percentage || 0;
      const origin = c.origin_country || c.country;
      const hsCode = c.hs_code || 'unclassified';
      const qualifies = c.qualifies ? 'QUALIFIES' : 'DOES NOT QUALIFY';
      return `- ${c.component_type || c.description} (${percentage}%, ${origin}, HS ${hsCode}): ${qualifies}`;
    }).join('\n');

    // Extract alert titles and policies for context
    const alertContext = rawAlerts.map(a =>
      `- ${a.title}: ${a.affected_countries?.join(', ') || 'global'} | Category: ${a.category || 'unknown'}`
    ).join('\n');

    // Build industry context from components
    const industries = extractIndustriesFromComponents(components);

    // Create the AI prompt for executive alert
    const prompt = `You are an experienced customs broker who has worked with ${userProfile.companyName} for years.
You understand their business, their margins, their supply chain complexity.
You've analyzed their trade data and found something critical they need to know.

=== BUSINESS CONTEXT ===
Company: ${userProfile.companyName}
Business Type: ${userProfile.businessType}
Industry: ${industries.join(', ')}
Annual Trade Volume: $${(userProfile.tradeVolume || 0).toLocaleString()}
Location: ${userProfile.companyCountry}
Product: ${userProfile.productDescription}
Destination Market: ${userProfile.supplierCountry || 'Multiple'}

=== COMPONENT BREAKDOWN ===
${componentContext}

=== QUALIFICATION STATUS ===
USMCA Qualified: ${isQualified ? 'YES' : 'NO'}
Threshold Required: ${thresholdApplied !== null ? thresholdApplied : 'Not determined'}%
Current Content: ${currentContent}%
Gap: ${thresholdApplied !== null ? (currentContent - thresholdApplied) : 'Not determined'}%

=== FINANCIAL IMPACT ===
Potential Annual Savings: $${potentialSavings.toLocaleString()}
This is real money from optimizing your supply chain to meet USMCA requirements.

=== MOST CRITICAL ISSUE ===
${mostCriticalComponent ? `
The biggest barrier: ${mostCriticalComponent.description}
- Origin: ${mostCriticalComponent.origin_country}
- Percentage of Product: ${mostCriticalComponent.value_percentage}%
- Annual Value at Risk: $${((userProfile.tradeVolume || 0) * (mostCriticalComponent.value_percentage || 0) / 100).toLocaleString()}
- Status: Non-USMCA member origin (costing them money in tariffs)
` : 'Multiple components need attention'}

=== YOUR SITUATION ===
Company: ${userProfile.companyName}
Annual Trade Volume: $${(userProfile.tradeVolume || 0).toLocaleString()}
Industry: ${industries.join(', ')}
Current USMCA Status: ${isQualified ? 'QUALIFIED - Good news!' : 'NOT QUALIFIED - Opportunity to optimize'}

=== POLICY ALERTS AFFECTING THEM ===
${alertContext}

=== YOUR TASK ===
Write ONE executive trade alert as if you're calling this company's CEO personally.
You've found something that could save them $${potentialSavings.toLocaleString()}/year (based on their actual USMCA analysis).
You care about getting it right. You understand their business constraints.

**Broker Tone Requirements:**
- Be direct about what's broken (not corporate jargon)
- Show the math clearly - they need to trust your numbers
- Make SPECIFIC recommendations based on THEIR industry (not generic "find suppliers")
- Explain WHY each phase matters for THEIR business
- End with concrete actions they can take THIS WEEK (not vague advice)
- Write as someone who knows them personally and wants them to succeed

**Critical: Do NOT hardcode:**
- Supplier names (generate based on their industry and component origin)
- Timelines (base on their component complexity, not generic 3-6 months)
- Industry advice (use their actual industries: ${industries.join(', ')})
- Policy names (reference the specific policies affecting them from the alerts above)

Return valid JSON:
{
  "id": "executive-summary-UNIQUE_ID",
  "headline": "Specific to their situation (e.g., 'Fix Your Microprocessor Sourcing' NOT 'Tariff Alert')",
  "situation_brief": "1-2 sentences: what's happening and why it matters to THEIR business",
  "executive_summary": {
    "problem": "What's broken (direct, no corporate speak)",
    "root_cause": "Why this is happening (shows you understand their supply chain)",
    "impact": "What this costs them annually ($number)",
    "opportunity": "What they could save/gain",
    "urgency": "Why this matters NOW (not eventually)"
  },
  "financial_snapshot": {
    "current_burden": ${potentialSavings},
    "potential_savings": ${potentialSavings},
    "payback_period": "Human-readable timeframe",
    "confidence": "HIGH/MEDIUM - why you're confident in this number",
    "math_shown": "Show ONE key calculation so they can verify you know what you're talking about"
  },
  "strategic_roadmap": [
    {
      "phase": 1,
      "title": "Specific action (not generic 'fix accounting')",
      "why_matters": "Explain specifically how this helps THEIR business",
      "timeline": "Realistic for their situation",
      "actions": ["Concrete step 1", "Concrete step 2"],
      "owned_by": "Who in their organization (finance, supply chain, engineering)",
      "impact": "Specific benefit to THEIR business"
    },
    {
      "phase": 2,
      "title": "Based on their second-biggest problem",
      "why_matters": "...",
      "timeline": "...",
      "actions": ["..."],
      "owned_by": "...",
      "impact": "..."
    },
    {
      "phase": 3,
      "title": "Solves their primary qualification gap",
      "why_matters": "...",
      "timeline": "...",
      "actions": ["..."],
      "owned_by": "...",
      "impact": "..."
    }
  ],
  "action_this_week": [
    "Specific action 1 they can take TODAY",
    "Specific action 2",
    "Specific action 3"
  ],
  "what_impacts_them": [
    "Policy 1 and why (e.g., Section 301 on their actual HS codes)",
    "Policy 2 and why",
    "Policy 3 and why"
  ],
  "broker_notes": "Personal note from you as their broker - shows you care and understand them",
  "email_trigger_config": {
    "should_email": true,
    "email_subject": "Urgent subject line - specific to their situation",
    "email_body_snippet": "Key 1-2 sentences for email",
    "trigger_level": "URGENT/HIGH/MEDIUM - how critical is this",
    "trigger_conditions": ["Condition 1 - when to email", "Condition 2"],
    "frequency": "EMAIL_IMMEDIATELY or WEEKLY_DIGEST"
  }
}`;

    // Call OpenRouter with the flexible prompt
    console.log('🎯 TIER 1: Trying OpenRouter...');
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
        temperature: 0.3 // Slight creativity but stays accurate
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`OpenRouter failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      console.error('❌ Empty AI response:', data);
      throw new Error('Empty response from AI');
    }

    // Parse AI response
    let executiveAlert;
    try {
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        executiveAlert = JSON.parse(jsonMatch[1]);
      } else {
        executiveAlert = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', aiResponse.substring(0, 500));
      throw new Error('Invalid JSON from AI');
    }

    console.log(`✅ Executive alert generated: ${executiveAlert.headline}`);
    return executiveAlert;

  } catch (error) {
    console.error('❌ Executive alert generation error:', error.message);
    throw error;
  }
}

/**
 * Extract industries from component HS codes
 * Flexible for any industry - not hardcoded
 */
function extractIndustriesFromComponents(components) {
  const industries = new Set();

  components.forEach(comp => {
    const hsCode = comp.hs_code || '';
    if (!hsCode) return;

    const chapter = parseInt(hsCode.substring(0, 2));

    // Standard HS chapter-to-industry mapping (flexible, not hardcoded)
    const industryMap = {
      // Chapter ranges: [industry name]
      '1-5': 'Agriculture',
      '6-15': 'Animal Products',
      '16-24': 'Food & Beverages',
      '25-27': 'Minerals & Energy',
      '28-38': 'Chemicals',
      '39-40': 'Plastics & Rubber',
      '41-43': 'Hides & Skins',
      '44-49': 'Wood & Paper',
      '50-63': 'Textiles',
      '64-67': 'Footwear & Headwear',
      '68-71': 'Stone, Ceramics, Glass',
      '72-83': 'Metals',
      '84-85': 'Machinery & Electrical',
      '86-89': 'Automotive & Transportation',
      '90-97': 'Optical, Medical, Instruments'
    };

    // Find matching range
    Object.entries(industryMap).forEach(([range, industry]) => {
      const [min, max] = range.split('-').map(Number);
      if (chapter >= min && chapter <= max) {
        industries.add(industry);
      }
    });
  });

  return Array.from(industries).length > 0 ? Array.from(industries) : ['General Manufacturing'];
}
