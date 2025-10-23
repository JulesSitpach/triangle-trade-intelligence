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

  if (!request || service_type !== 'hs_classification') {
    return res.status(400).json({ error: 'Valid HS classification request data required' });
  }

  async function callAnthropicWithRetry(prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const message = await anthropic.messages.create({
          model: 'anthropic/claude-haiku-4.5',
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
    const prompt = `You are Cristina Rodriguez, a trade compliance expert and HS code classification expert.

Generate a professional HS Code Classification Report for this client request:

CLIENT INFORMATION:
- Company: ${request.clientName || request.company_name || 'Client Company'}
- Product: ${request.displayTitle || request.service_details?.goals || 'Product requiring HS classification'}
- Status: ${request.displayStatus || request.status || 'pending'}
- Timeline: ${request.displayTimeline || request.target_completion || 'Standard delivery'}
- Current HS Code: ${request.hs_code || 'To be determined'}

CLASSIFICATION REQUIREMENTS:
Based on the client's product description, generate a comprehensive HS Code Classification Report that includes:

1. Classification Status and Assigned HS Code
2. Product Analysis and Technical Characteristics
3. Classification Methodology and Rationale
4. General Rules for Interpretation Applied
5. Tariff Analysis and Duty Implications
6. Classification Risk Assessment
7. Implementation Strategy
8. Documentation Requirements
9. Expert Recommendations and Next Steps

IMPORTANT GUIDELINES:
- Assign a realistic 10-digit HS code based on the product description
- Use proper classification methodology (GRI, chapter notes, explanatory notes)
- Provide genuine tariff analysis with realistic duty rates
- Include classification confidence level and risk assessment
- Base recommendations on actual customs requirements
- Reference relevant WCO guidelines and precedents where applicable

Format the response as a professional classification report in markdown format suitable for client delivery. Include:
- Professional header with classification ID
- Detailed product analysis and classification rationale
- Cristina's expert validation and confidence assessment
- Clear implementation instructions for the client

The report should demonstrate expert knowledge of HS classification rules and provide genuine value for customs compliance.`;

    console.log('🤖 Generating HS classification report with AI...');
    const response = await callAnthropicWithRetry(prompt);
    const reportContent = response.content[0].text;

    // Generate classification metadata
    const classificationId = `HSC-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

    // ✅ FAIL LOUDLY: Extract HS code from AI response or user input
    // NO KEYWORD MATCHING, NO HARDCODED DEFAULTS
    let assignedHSCode = request.hs_code;  // If user provided it explicitly

    // If no user-provided HS code, try to extract from AI response
    if (!assignedHSCode) {
      // Look for HS code pattern in AI response (10 digits or similar format)
      const hsCodePatterns = [
        /Assigned\s+HS\s+Code[:\s]+(\d{4}\.\d{2}\.\d{2})/i,
        /HS\s+Code[:\s]+(\d{4}\.\d{2}\.\d{2})/i,
        /Classification\s+Code[:\s]+(\d{4}\.\d{2}\.\d{2})/i,
        /^(\d{4}\.\d{2}\.\d{2})$/m  // Standalone HS code
      ];

      for (const pattern of hsCodePatterns) {
        const match = reportContent.match(pattern);
        if (match) {
          assignedHSCode = match[1];
          console.log(`✅ Extracted HS Code from AI response: ${assignedHSCode}`);
          break;
        }
      }
    }

    // ✅ FAIL LOUDLY: If AI couldn't determine HS code, return error
    if (!assignedHSCode) {
      console.error('❌ AI failed to determine HS code and user did not provide one');
      return res.status(400).json({
        success: false,
        error: 'HS Code Classification Failed',
        message: 'The AI could not determine a valid HS code for this product. This product may require manual expert review due to complexity or insufficient product description. Please provide the HS code directly or provide more detailed product specifications.',
        suggestion: 'Contact a trade compliance expert or provide additional product details (dimensions, materials, manufacturing process, intended use)',
        request_id: request.id
      });
    }

    const classificationData = {
      deliverable_type: 'HS Code Classification Report',
      classification_id: classificationId,
      assigned_hs_code: assignedHSCode,  // ✅ AI-determined or user-provided, never hardcoded
      billable_value: pricing?.price || 200,
      content: reportContent,
      generated_at: new Date().toISOString(),
      classification_status: 'COMPLETED',
      confidence_level: 'HIGH',
      products_classified: 1,
      pricing_info: pricing
    };

    // Save to database if requested
    if (request.id) {
      try {
        const { error: updateError } = await supabase
          .from('service_requests')
          .update({
            status: 'classification_completed',
            hs_code: classificationData.assigned_hs_code,
            classification_data: classificationData,
            updated_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (updateError) {
          console.error('Database update error:', updateError);
        } else {
          console.log('✅ Classification data saved to database');
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    return res.status(200).json(classificationData);

  } catch (error) {
    console.error('HS classification error:', error);
    return res.status(500).json({
      error: 'Failed to generate HS classification report',
      message: error.message
    });
  }
}