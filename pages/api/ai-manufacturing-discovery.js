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
    return res.status(400).json({ error: 'Manufacturing feasibility requirements are required' });
  }

  // ========== LOG MISSING OPTIONAL FIELDS (for admin review) ==========
  const missingOptionalFields = [];

  if (!clientRequirements.product_description) missingOptionalFields.push('product_description');
  if (!clientRequirements.industry) missingOptionalFields.push('industry');
  if (!clientRequirements.volume) missingOptionalFields.push('volume');
  if (!clientRequirements.quality_standards) missingOptionalFields.push('quality_standards');
  if (!clientRequirements.budget) missingOptionalFields.push('budget');
  if (!clientRequirements.timeline) missingOptionalFields.push('timeline');

  if (missingOptionalFields.length > 0) {
    // Log to admin dashboard (non-blocking)
    await DevIssue.missingData('manufacturing_discovery', missingOptionalFields.join(', '), {
      service_type: 'Manufacturing Feasibility',
      workflow_step: 'ai_facility_search',
      impact: 'AI manufacturing recommendations quality may be reduced due to missing context',
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
    const prompt = `You are Jorge Martinez, manufacturing feasibility specialist for Mexico operations.

MANUFACTURING FEASIBILITY ANALYSIS:
Product: ${clientRequirements.product_description || 'Manufacturing project'}
Industry: ${clientRequirements.industry || 'Manufacturing'}
Volume: ${clientRequirements.volume || 'Standard production volume'}
Quality Requirements: ${clientRequirements.quality_standards || 'Commercial standards'}
Budget: ${clientRequirements.budget || 'Standard budget'}
Timeline: ${clientRequirements.timeline || 'Standard timeline'}

Your task: Find REAL Mexican manufacturing facilities and assess feasibility.

FEASIBILITY FRAMEWORK:
1. Manufacturing Capability Assessment
2. Production Capacity Analysis
3. Quality Control Systems
4. Cost Structure Evaluation
5. Timeline and Logistics
6. Risk Assessment and Mitigation

Generate 4-6 MANUFACTURING FACILITY RECOMMENDATIONS in this format:

[
  {
    "facility_name": "Actual facility name OR [Search: specific terms]",
    "location": "Specific Mexican city/state",
    "specialization": "Manufacturing specialty area",
    "capacity": "Production capacity details",
    "quality_certifications": "ISO, certifications, standards",
    "cost_competitiveness": "high|medium|low",
    "feasibility_score": "1-10 rating",
    "next_step": "Contact method or verification approach"
  }
]

Focus on:
- Real manufacturing facilities in Mexico
- Actual production capabilities
- Quality certification levels
- Cost competitiveness analysis
- Realistic feasibility assessment
- Specific contact/verification methods

Provide realistic manufacturing options that Jorge can verify and contact.`;

    console.log('🏭 Discovering manufacturing facilities...');
    const response = await callAnthropicWithRetry(prompt);
    const aiContent = response.content[0].text;

    // Extract JSON from response
    let facilities = [];
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        facilities = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.log('JSON parse error, using fallback facilities');
      facilities = [
        {
          facility_name: "[Search: Mexico contract manufacturing + " + (clientRequirements.industry || "general manufacturing") + "]",
          location: "Various locations - Tijuana, Juarez, Guadalajara",
          specialization: clientRequirements.industry || "General manufacturing",
          capacity: "To be verified based on specific requirements",
          quality_certifications: "ISO 9001, industry-specific certifications",
          cost_competitiveness: "high",
          feasibility_score: "7-8",
          next_step: "Jorge to research specific facilities in target industry"
        }
      ];
    }

    const feasibilityData = {
      success: true,
      service_type: 'manufacturing_feasibility',
      facilities_identified: facilities.length,
      manufacturing_facilities: facilities,
      analysis: aiContent,
      generated_at: new Date().toISOString(),
      jorge_next_steps: "Contact facilities for detailed capability assessment"
    };

    // Save to database if requested
    if (saveToDatabase) {
      try {
        const { data, error } = await supabase
          .from('service_requests')
          .insert({
            service_type: 'manufacturing_feasibility',
            company_name: clientRequirements.company_name,
            status: 'facility_research_active',
            service_details: clientRequirements,
            manufacturing_data: feasibilityData,
            created_at: new Date().toISOString(),
            assigned_to: 'Jorge'
          });

        if (error) {
          console.error('Database save error:', error);
        } else {
          console.log('✅ Manufacturing feasibility saved to database');
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    return res.status(200).json(feasibilityData);

  } catch (error) {
    console.error('Manufacturing discovery error:', error);
    return res.status(500).json({
      error: 'Failed to analyze manufacturing feasibility',
      message: error.message
    });
  }
}