/**
 * Admin AI Research Assistant API
 * Searches genius database + provides contextual help for service delivery
 */

import { createClient } from '@supabase/supabase-js';
import { withAdmin } from '../../../lib/middleware/auth-middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, serviceRequest, conversationHistory } = req.body;

  if (!question || !serviceRequest) {
    return res.status(400).json({ error: 'Question and service request required' });
  }

  try {
    console.log('🤖 AI Assistant query:', question);
    console.log('📋 Context:', serviceRequest.service_type, '-', serviceRequest.client_company);

    // Extract service context
    const subscriberData = serviceRequest.subscriber_data || {};
    const serviceType = serviceRequest.service_type?.toLowerCase() || '';

    // STEP 1: Search genius database for relevant intelligence
    const dbResults = await searchGeniusDatabase(question, subscriberData, serviceType);

    // STEP 2: Build context-rich prompt with genius DB results
    const prompt = buildAIAssistantPrompt(question, serviceRequest, dbResults, conversationHistory);

    // STEP 3: Call AI with full context
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://triangle-trade-intelligence.vercel.app',
        'X-Title': 'Triangle Trade Intelligence - Admin AI Assistant'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4.5', // Fast + cheap for chat
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const assistantResponse = aiResult.choices[0].message.content;

    // Return response with sources
    return res.status(200).json({
      success: true,
      response: assistantResponse,
      sources: dbResults.sources,
      dbHits: dbResults.totalHits
    });

  } catch (error) {
    console.error('❌ AI Assistant error:', error);
    return res.status(500).json({
      success: false,
      error: 'AI assistant failed',
      details: error.message
    });
  }
}

/**
 * Search genius database for relevant intelligence
 */
async function searchGeniusDatabase(question, subscriberData, serviceType) {
  const results = {
    suppliers: [],
    crisisAlerts: [],
    usmcaRules: [],
    classifications: [],
    sources: [],
    totalHits: 0
  };

  try {
    const questionLower = question.toLowerCase();
    const hsCode = subscriberData.hs_code || extractHSCode(question);
    const productCategory = subscriberData.product_description || '';
    const industry = subscriberData.industry_sector || '';

    // Search suppliers if question mentions suppliers or Mexico
    if (questionLower.includes('supplier') || questionLower.includes('mexico') || serviceType.includes('supplier')) {
      const { data: suppliers } = await supabase
        .from('ai_supplier_intelligence')
        .select('*')
        .or(`country.eq.MX,country.eq.CA,country.eq.US`)
        .eq('usmca_compliant', true)
        .order('reliability_score', { ascending: false })
        .limit(5);

      if (suppliers && suppliers.length > 0) {
        results.suppliers = suppliers;
        results.sources.push(`${suppliers.length} USMCA-compliant suppliers from genius database`);
        results.totalHits += suppliers.length;
      }
    }

    // Search crisis alerts if question mentions tariff/crisis/alert
    if (questionLower.includes('crisis') || questionLower.includes('tariff') || questionLower.includes('alert') || hsCode) {
      const crisisQuery = supabase
        .from('ai_crisis_intelligence')
        .select('*')
        .eq('resolution_status', 'active')
        .order('severity', { ascending: false })
        .limit(5);

      if (hsCode) {
        crisisQuery.contains('affected_hs_codes', [hsCode]);
      }

      const { data: crises } = await crisisQuery;

      if (crises && crises.length > 0) {
        results.crisisAlerts = crises;
        results.sources.push(`${crises.length} active crisis alerts from genius database`);
        results.totalHits += crises.length;
      }
    }

    // Search USMCA qualification rules
    if (questionLower.includes('usmca') || questionLower.includes('threshold') || questionLower.includes('qualify')) {
      const { data: usmcaRules } = await supabase
        .from('ai_usmca_qualifications')
        .select('*')
        .or(`product_category.ilike.%${productCategory}%,industry_sector.eq.${industry}`)
        .limit(3);

      if (usmcaRules && usmcaRules.length > 0) {
        results.usmcaRules = usmcaRules;
        results.sources.push(`${usmcaRules.length} USMCA qualification rules from genius database`);
        results.totalHits += usmcaRules.length;
      }
    }

    // Search HS classifications for tariff rates
    if (hsCode || questionLower.includes('tariff') || questionLower.includes('rate')) {
      const classQuery = supabase
        .from('ai_classifications')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(5);

      if (hsCode) {
        classQuery.eq('hs_code', hsCode);
      }

      const { data: classifications } = await classQuery;

      if (classifications && classifications.length > 0) {
        results.classifications = classifications;
        results.sources.push(`${classifications.length} HS classifications with current tariff rates`);
        results.totalHits += classifications.length;
      }
    }

  } catch (error) {
    console.error('Database search error:', error);
  }

  return results;
}

/**
 * Build comprehensive prompt with genius DB context
 */
function buildAIAssistantPrompt(question, serviceRequest, dbResults, conversationHistory) {
  const subscriberData = serviceRequest.subscriber_data || {};

  let prompt = `You are an expert trade compliance assistant helping Cristina and Jorge deliver professional services.

**SERVICE CONTEXT:**
- Service Type: ${serviceRequest.service_type}
- Client: ${serviceRequest.client_company}
- Status: ${serviceRequest.status}
- Product: ${subscriberData.product_description || 'Not specified'}
- Industry: ${subscriberData.industry_sector || 'Not specified'}
- Current USMCA Status: ${subscriberData.qualification_status || 'Unknown'}

**CLIENT WORKFLOW DATA:**
${JSON.stringify(subscriberData, null, 2)}

**GENIUS DATABASE RESULTS (${dbResults.totalHits} hits):**
`;

  // Add supplier intelligence
  if (dbResults.suppliers.length > 0) {
    prompt += `\n**MEXICO SUPPLIERS (USMCA-Compliant):**\n`;
    dbResults.suppliers.forEach((s, i) => {
      prompt += `${i + 1}. ${s.supplier_name} (${s.country})
   - Industry: ${s.industry_sector}
   - Products: ${s.products_offered?.join(', ') || 'Various'}
   - Reliability: ${s.reliability_score}/100
   - Lead Time: ${s.lead_time_days} days
   - Cost: ${s.cost_competitiveness}
   - Last Updated: ${s.last_updated}
`;
    });
  }

  // Add crisis alerts
  if (dbResults.crisisAlerts.length > 0) {
    prompt += `\n**ACTIVE CRISIS ALERTS:**\n`;
    dbResults.crisisAlerts.forEach((c, i) => {
      prompt += `${i + 1}. ${c.crisis_type} - Severity: ${c.severity}
   - Impact: ${c.impact_summary}
   - Affected: ${c.affected_countries?.join(', ')}
   - Effective: ${c.effective_date}
   - Mitigation: ${c.mitigation_strategies?.join('; ')}
`;
    });
  }

  // Add USMCA rules
  if (dbResults.usmcaRules.length > 0) {
    prompt += `\n**USMCA QUALIFICATION RULES:**\n`;
    dbResults.usmcaRules.forEach((u, i) => {
      prompt += `${i + 1}. ${u.product_category} - Threshold: ${u.required_threshold}%
   - Source: ${u.threshold_source}
   - Reasoning: ${u.threshold_reasoning}
   - Documentation: ${u.documentation_required?.join(', ')}
`;
    });
  }

  // Add tariff classifications
  if (dbResults.classifications.length > 0) {
    prompt += `\n**CURRENT TARIFF RATES (Oct 2025):**\n`;
    dbResults.classifications.forEach((c, i) => {
      prompt += `${i + 1}. HS ${c.hs_code}: ${c.component_description}
   - MFN Rate: ${c.mfn_rate}%
   - USMCA Rate: ${c.usmca_rate}%
   - Savings: ${c.mfn_rate - c.usmca_rate}%
   - Policy: ${c.policy_adjustments?.join(', ') || 'Standard'}
   - Updated: ${c.last_updated}
`;
    });
  }

  // Add conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    prompt += `\n**CONVERSATION HISTORY:**\n`;
    conversationHistory.forEach(msg => {
      prompt += `${msg.role}: ${msg.content}\n`;
    });
  }

  prompt += `\n**ADMIN QUESTION:** ${question}

**YOUR TASK:**
1. Answer the admin's question using the genius database results above
2. Be specific - reference exact suppliers, policies, or data from the database
3. If drafting analysis, use the client's actual workflow data
4. If recommending suppliers, explain WHY they're a good fit (reliability, cost, USMCA compliance)
5. If discussing tariffs, cite the exact rates from Oct 2025 data
6. Keep responses concise but actionable (2-3 paragraphs max)
7. Format nicely with markdown (bullets, bold, etc.)

Respond professionally as their expert trade compliance assistant:`;

  return prompt;
}

/**
 * Extract HS code from question text
 */
function extractHSCode(text) {
  const hsMatch = text.match(/\b\d{4}[\.\s]?\d{2}[\.\s]?\d{2,4}\b/);
  return hsMatch ? hsMatch[0].replace(/[\.\s]/g, '') : null;
}

export default withAdmin(handler);
