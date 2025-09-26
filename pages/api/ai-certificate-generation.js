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

  const { request, pricing, service_type } = req.body;

  if (!request || service_type !== 'usmca_certificate') {
    return res.status(400).json({ error: 'Valid certificate request data required' });
  }

  async function callAnthropicWithRetry(prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const message = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 4000,
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
    const prompt = `You are Cristina Rodriguez, a licensed customs broker specializing in USMCA certificates.

Generate a professional USMCA Certificate of Origin report for this client request:

CLIENT INFORMATION:
- Company: ${request.clientName || request.company_name || 'Client Company'}
- Product: ${request.displayTitle || request.service_details?.goals || 'Product requiring USMCA certification'}
- Status: ${request.displayStatus || request.status || 'pending'}
- Timeline: ${request.displayTimeline || request.target_completion || 'Standard delivery'}

CERTIFICATE REQUIREMENTS:
Based on the client's product and requirements, generate a comprehensive USMCA Certificate of Origin that includes:

1. Certificate Status and Details
2. Product Information and HS Code Classification
3. USMCA Compliance Analysis (Regional Value Content)
4. Component Origin Breakdown
5. Tariff Benefits Analysis
6. Supporting Documentation Requirements
7. Certificate Deliverables and Usage Instructions
8. Expert Recommendations

IMPORTANT: Base all information on the actual client request data provided. Use realistic compliance percentages, proper HS codes for the product type, and accurate USMCA requirements.

Format the response as a professional report in markdown format suitable for client delivery. Include:
- Professional header with certificate number
- Detailed compliance analysis
- Cristina's expert validation and recommendations
- Clear next steps for the client

The report should demonstrate expert knowledge of USMCA rules and provide genuine value to the client.`;

    console.log('🤖 Generating USMCA certificate with AI...');
    const response = await callAnthropicWithRetry(prompt);
    const reportContent = response.content[0].text;

    // Generate certificate metadata
    const certificateId = `USMCA-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 4);

    const certificateData = {
      deliverable_type: 'USMCA Certificate of Origin',
      certificate_number: certificateId,
      billable_value: pricing?.price || 200,
      content: reportContent,
      generated_at: new Date().toISOString(),
      qualification_status: 'APPROVED',
      expiration_date: expirationDate.toISOString(),
      pricing_info: pricing
    };

    // Save to database if requested
    if (request.id) {
      try {
        const { error: updateError } = await supabase
          .from('service_requests')
          .update({
            status: 'certificate_generated',
            certificate_data: certificateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (updateError) {
          console.error('Database update error:', updateError);
        } else {
          console.log('✅ Certificate data saved to database');
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    return res.status(200).json(certificateData);

  } catch (error) {
    console.error('Certificate generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate USMCA certificate',
      message: error.message
    });
  }
}