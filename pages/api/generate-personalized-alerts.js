/**
 * POST /api/generate-personalized-alerts
 * Generate RELEVANT policy alerts based on user's actual components
 * No more generic China/Vietnam alerts for users with US/MX/CA components!
 *
 * Uses AI to monitor:
 * - USMCA policy changes affecting user's specific components
 * - Origin country trade policies (US cotton, MX textiles, CA materials)
 * - Industry-specific regulations (automotive, textiles, etc.)
 * - Mexico supplier opportunities (for admin team)
 */

import { createClient } from '@supabase/supabase-js';
import { DevIssue } from '../../lib/utils/logDevIssue.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { user_profile } = req.body;

    if (!user_profile) {
      await DevIssue.missingData('generate_alerts_api', 'user_profile', {
        endpoint: '/api/generate-personalized-alerts'
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required field: user_profile'
      });
    }

    console.log(`🎯 Generating personalized alerts for ${user_profile.companyName}`);

    // Generate alerts based on user's actual components
    const personalizedAlerts = await generateAlertsForComponents(user_profile);

    return res.status(200).json({
      success: true,
      alerts: personalizedAlerts,
      count: personalizedAlerts.length
    });

  } catch (error) {
    console.error('❌ Error generating personalized alerts:', error);
    await DevIssue.apiError('generate_alerts_api', '/api/generate-personalized-alerts', error, {
      company: req.body?.user_profile?.companyName || 'unknown'
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to generate personalized alerts',
      error: error.message
    });
  }
}

/**
 * Generate relevant alerts based on user's actual components and business profile
 */
async function generateAlertsForComponents(userProfile) {
  const components = userProfile.componentOrigins || [];

  if (components.length === 0) {
    console.log('⚠️ No components found - cannot generate personalized alerts');
    return [];
  }

  // Extract unique origin countries and HS codes from user's components
  const originCountries = [...new Set(components.map(c => c.origin_country || c.country))].filter(Boolean);
  const hsCodes = [...new Set(components.map(c => c.hs_code))].filter(Boolean);
  const industries = getIndustriesFromHSCodes(hsCodes);

  console.log(`📊 User trade profile: ${originCountries.join(', ')} origins | ${industries.join(', ')} industries`);

  // Build component context for AI
  const componentContext = components.map(c => {
    const mfn = c.mfn_rate || c.base_mfn_rate || 0;
    const usmca = c.usmca_rate || 0;
    const savings = mfn - usmca;
    return `- ${c.component_type || c.description}: ${c.percentage || c.value_percentage}% from ${c.origin_country || c.country} (HS ${c.hs_code}) | MFN ${mfn}% → USMCA ${usmca}% (saves ${savings}%)`;
  }).join('\n');

  // Call AI to generate RELEVANT alerts
  const prompt = `You are a trade policy monitoring system generating RELEVANT alerts for a specific company.

=== USER BUSINESS PROFILE ===
Company: ${userProfile.companyName}
Business Type: ${userProfile.businessType}
Product: ${userProfile.productDescription}
Annual Trade Volume: $${userProfile.tradeVolume || 'unknown'}
USMCA Status: ${userProfile.qualificationStatus || 'Unknown'}

Component Sourcing:
${componentContext}

Origin Countries: ${originCountries.join(', ')}
Industries: ${industries.join(', ')}

=== ALERT GENERATION TASK ===

Generate 3-5 RELEVANT policy alerts that could affect THIS SPECIFIC BUSINESS.

**Focus on:**
1. **USMCA Policy Changes** - Rule changes affecting their qualifying components
2. **Origin Country Policies** - Trade policies from countries they source from (${originCountries.join(', ')})
3. **Industry Regulations** - Sector-specific rules (${industries.join(', ')})
4. **Mexico Opportunities** - Supplier alternatives in Mexico (admin use case for finding Mexican suppliers)
5. **Compliance Deadlines** - Upcoming filing requirements, certification renewals

**DO NOT generate alerts about:**
- Countries they don't source from (e.g., China alerts for US/MX/CA sourcing)
- Industries they're not in
- Generic trade news without specific impact

**Alert Format:**
- **Title**: Specific and actionable (e.g., "USMCA Textile Yarn-Forward Rule Clarification" not "Section 301 Update")
- **Relevance**: HIGH (8-10/10) - only generate alerts that directly affect their components
- **Urgency**: Realistic timeframe (not everything is URGENT)
- **Mexico Angle**: Include Mexico supplier opportunities when relevant

Return ONLY valid JSON array:
[
  {
    "id": "alert-1",
    "title": "Specific alert title",
    "description": "2-3 sentence explanation of what's changing and why it matters to THIS company",
    "severity": "CRITICAL/HIGH/MEDIUM/LOW",
    "category": "USMCA Policy/Origin Country/Industry Regulation/Mexico Opportunity/Compliance",
    "affected_countries": ["List of countries from their sourcing"],
    "affected_hs_codes": ["List of HS codes from their components"],
    "effective_date": "YYYY-MM-DD or relative timeline",
    "relevance_score": 9,
    "urgency": "URGENT/HIGH/MEDIUM/LOW",
    "mexico_opportunity": "Optional: How Mexico sourcing could help",
    "action_required": "Specific action they should take",
    "source_context": "What policy/regulation this relates to"
  }
]

**Example for this user (US/MX/CA textiles):**
{
  "title": "USMCA Textile Yarn-Forward Rule Under Review",
  "description": "USMCA partners reviewing yarn-forward requirements for Chapter 52 textiles (cotton). Your US cotton fabric (45% of product, HS 5209.42.00) could face stricter origin verification. No immediate changes, but monitor Q1 2026 review.",
  "severity": "MEDIUM",
  "category": "USMCA Policy",
  "affected_countries": ["US", "MX", "CA"],
  "affected_hs_codes": ["5209.42.00"],
  "effective_date": "2026-Q1 (review period)",
  "relevance_score": 9,
  "urgency": "MEDIUM",
  "mexico_opportunity": "Consider sourcing cotton fabric from Mexico to simplify USMCA compliance and build all-Mexico supply chain for automotive OEMs",
  "action_required": "Review supplier certifications for US cotton; evaluate Mexico cotton fabric suppliers",
  "source_context": "USMCA Article 4.2 - Textiles and Apparel, periodic review clause"
}`;

  // 🎯 TIER 1: Try OpenRouter
  console.log('🎯 TIER 1: Trying OpenRouter...');
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
        temperature: 0.4 // Slight creativity for realistic scenarios
      })
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (aiResponse) {
        console.log('✅ OpenRouter SUCCESS');
        return parseAlertsResponse(aiResponse);
      }
    }

    console.log('⚠️ OpenRouter failed, trying Tier 2...');
  } catch (error) {
    console.error('❌ OpenRouter error:', error.message);
  }

  // 🎯 TIER 2: Fallback to Anthropic Direct
  console.log('🎯 TIER 2: Trying Anthropic Direct...');
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{
          role: "user",
          content: prompt
        }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.content[0]?.text;

      if (aiResponse) {
        console.log('✅ Anthropic Direct SUCCESS');
        return parseAlertsResponse(aiResponse);
      }
    }
  } catch (error) {
    console.error('❌ Anthropic Direct error:', error.message);
  }

  // 🎯 TIER 3: Graceful fallback - return empty array
  console.log('⚠️ All AI providers failed - returning empty alerts');
  return [];
}

/**
 * Parse AI response to extract alerts array
 */
function parseAlertsResponse(aiResponse) {
  try {
    // Try to extract JSON array from response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const alerts = JSON.parse(jsonMatch[0]);
      console.log(`✅ Parsed ${alerts.length} personalized alerts`);
      return alerts;
    }

    // Try parsing as code block
    const codeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      const alerts = JSON.parse(codeBlockMatch[1]);
      console.log(`✅ Parsed ${alerts.length} personalized alerts from code block`);
      return alerts;
    }

    console.warn('⚠️ Could not parse AI response as JSON array');
    return [];
  } catch (error) {
    console.error('❌ Failed to parse alerts response:', error);
    return [];
  }
}

/**
 * Determine industries from HS codes
 */
function getIndustriesFromHSCodes(hsCodes) {
  const industries = new Set();

  hsCodes.forEach(hsCode => {
    if (!hsCode) return;

    const chapter = parseInt(hsCode.substring(0, 2));

    // Chapter-based industry mapping
    if (chapter >= 50 && chapter <= 63) industries.add('Textiles');
    if (chapter >= 84 && chapter <= 85) industries.add('Electronics');
    if (chapter >= 86 && chapter <= 89) industries.add('Automotive/Transportation');
    if (chapter >= 39 && chapter <= 40) industries.add('Plastics/Rubber');
    if (chapter >= 72 && chapter <= 83) industries.add('Metals');
    if (chapter >= 28 && chapter <= 38) industries.add('Chemicals');
  });

  return Array.from(industries);
}
