import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

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
    return res.status(400).json({ error: 'Client requirements are required' });
  }

  async function callAnthropicWithRetry(prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const message = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 2000,
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
    const prompt = `You are an AI research assistant helping Jorge Martinez find REAL Mexican suppliers.

Your task: Search your knowledge for actual companies, not make up fake ones.

CLIENT REQUIREMENTS:
- Product/Service: ${clientRequirements.product_description || 'Not specified'}
- Quality Standards: ${clientRequirements.quality_standards || 'Not specified'}
- Volume: ${clientRequirements.volume || 'Not specified'}
- Industry: ${clientRequirements.industry || 'Not specified'}
- Timeline: ${clientRequirements.timeline || 'Not specified'}
- Additional: ${clientRequirements.requirements || 'Not specified'}

IMPORTANT INSTRUCTIONS:
1. Return 5-7 REAL supplier recommendations or specific search strategies
2. Include actual company names if you know them from your training data
3. Provide specific search terms for web research if you don't know companies
4. Include realistic contact discovery methods

For each recommendation:
- company_name: Actual company name OR "[Search: specific industry + location]"
- location: Specific Mexican city/state
- business_type: Specific industry category
- capabilities: What they can provide
- match_reason: Why they fit requirements
- next_step: "Verify contact info" or "Web search: [specific terms]" or "Trade directory lookup"

Format as JSON array with these exact fields:
[
  {
    "company_name": string,
    "location": string,
    "business_type": string,
    "capabilities": string,
    "match_reason": string,
    "next_step": string
  }
]

Respond ONLY with the JSON array.`;

    const message = await callAnthropicWithRetry(prompt);

    const responseText = message.content[0].text;

    let discoveries;
    try {
      discoveries = JSON.parse(responseText);
    } catch (parseError) {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        discoveries = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    if (saveToDatabase) {
      const suppliersToSave = discoveries.map(d => ({
        company_name: d.company_name,
        location: d.location,
        country_code: 'MX',
        product_categories: d.business_type ? [d.business_type] : null,
        verification_status: 'pending',
        status: 'pending_research',
        broker_notes: `AI Discovery: ${d.match_reason}. Next: ${d.next_step}`,
        created_by: 'ai_discovery'
      }));

      const { data: savedSuppliers, error: dbError } = await supabase
        .from('partner_suppliers')
        .insert(suppliersToSave)
        .select();

      if (dbError) {
        console.error('Database save error:', dbError);
      }

      res.status(200).json({
        success: true,
        suppliers: discoveries,
        totalFound: discoveries.length,
        savedToDatabase: !dbError,
        saved: savedSuppliers?.length || 0,
        message: 'AI discoveries saved for Jorge to verify and complete contact info'
      });
    } else {
      res.status(200).json({
        success: true,
        suppliers: discoveries,
        totalFound: discoveries.length,
        message: 'AI research complete - enable saveToDatabase to persist findings'
      });
    }

  } catch (error) {
    console.error('AI Supplier Discovery Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover suppliers',
      message: error.message
    });
  }
}