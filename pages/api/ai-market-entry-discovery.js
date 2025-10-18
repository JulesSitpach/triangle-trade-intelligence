import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { DevIssue } from '../../lib/utils/logDevIssue.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientRequirements, saveToDatabase = false } = req.body;

  if (!clientRequirements) {
    return res.status(400).json({ error: 'Market entry requirements are required' });
  }

  // ========== LOG MISSING OPTIONAL FIELDS (for admin review) ==========
  const missingOptionalFields = [];

  if (!clientRequirements.target_market) missingOptionalFields.push('target_market');
  if (!clientRequirements.product_description) missingOptionalFields.push('product_description');
  if (!clientRequirements.industry) missingOptionalFields.push('industry');
  if (!clientRequirements.budget) missingOptionalFields.push('budget');
  if (!clientRequirements.timeline) missingOptionalFields.push('timeline');
  if (!clientRequirements.entry_strategy) missingOptionalFields.push('entry_strategy');

  if (missingOptionalFields.length > 0) {
    // Log to admin dashboard (non-blocking)
    await DevIssue.missingData('market_entry_discovery', missingOptionalFields.join(', '), {
      service_type: 'Pathfinder Market Entry',
      workflow_step: 'ai_market_analysis',
      impact: 'AI market entry recommendations quality may be reduced due to missing context',
      missing_fields: missingOptionalFields
    });
    console.log(`⚠️  Missing optional fields: ${missingOptionalFields.join(', ')} - AI quality may be reduced`);
  }

  async function callAnthropicWithRetry(prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const message = await anthropic.messages.create({
          model: 'anthropic/claude-haiku-4.5',
          max_tokens: 2500,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });
        return message;
      } catch (error) {
        if (error.status === 529 && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Attempt ${attempt} failed with 529. Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw error;
      }
    }
  }

  try {
    const prompt = `You are Jorge Martinez, Latin America market entry specialist.

MARKET ENTRY ANALYSIS:
Target Market: ${clientRequirements.target_market || 'Latin American market'}
Product/Service: ${clientRequirements.product_description || 'Business offering'}
Industry: ${clientRequirements.industry || 'General business'}
Budget: ${clientRequirements.budget || 'Standard budget'}
Timeline: ${clientRequirements.timeline || '6-12 months'}
Entry Strategy: ${clientRequirements.entry_strategy || 'Direct market entry'}

Your task: Identify REAL market opportunities and strategic partnerships in Latin America.

MARKET ENTRY FRAMEWORK:
1. Market Opportunity Assessment
2. Regulatory Requirements Analysis
3. Strategic Partnership Identification
4. Distribution Channel Mapping
5. Competitive Landscape Review
6. Entry Strategy Recommendations

Generate 4-6 MARKET ENTRY OPPORTUNITIES in this format:

[
  {
    "opportunity_type": "distributor|partner|direct_sales|joint_venture|licensing",
    "market_focus": "Specific country or region",
    "partner_profile": "Type of partner or opportunity",
    "market_size": "Estimated market potential",
    "entry_barriers": "low|medium|high",
    "success_probability": "1-10 rating",
    "investment_required": "Estimated investment level",
    "next_step": "Specific research or contact action"
  }
]

Focus on:
- Real market opportunities in Latin America
- Actual regulatory requirements and barriers
- Specific partnership types and structures
- Realistic timeline and investment estimates
- Actionable next steps for market entry
- Jorge's network and expertise areas

Provide realistic market entry strategies that Jorge can execute with his Latin America expertise.`;

    console.log('🌎 Analyzing market entry opportunities...');
    const response = await callAnthropicWithRetry(prompt);
    const aiContent = response.content[0].text;

    // Extract JSON from response
    let opportunities = [];
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        opportunities = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.log('JSON parse error, using fallback opportunities');
      opportunities = [
        {
          opportunity_type: "distributor",
          market_focus: clientRequirements.target_market || "Mexico and Central America",
          partner_profile: "Established regional distributors with " + (clientRequirements.industry || "general business") + " expertise",
          market_size: "Market analysis required based on specific product/service",
          entry_barriers: "medium",
          success_probability: "7",
          investment_required: "Moderate - distribution setup and marketing",
          next_step: "Jorge to identify and contact potential distributor partners"
        }
      ];
    }

    const marketEntryData = {
      success: true,
      service_type: 'market_entry',
      opportunities_identified: opportunities.length,
      market_opportunities: opportunities,
      analysis: aiContent,
      generated_at: new Date().toISOString(),
      jorge_next_steps: "Validate opportunities and initiate partner contact process"
    };

    // Save to database if requested
    if (saveToDatabase) {
      try {
        const { data, error } = await supabase
          .from('service_requests')
          .insert({
            service_type: 'market_entry',
            company_name: clientRequirements.company_name,
            status: 'market_research_active',
            service_details: clientRequirements,
            market_entry_data: marketEntryData,
            created_at: new Date().toISOString(),
            assigned_to: 'Jorge'
          });

        if (error) {
          console.error('Database save error:', error);
        } else {
          console.log('✅ Market entry analysis saved to database');
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    return res.status(200).json(marketEntryData);

  } catch (error) {
    console.error('Market entry discovery error:', error);
    return res.status(500).json({
      error: 'Failed to analyze market entry opportunities',
      message: error.message
    });
  }
}