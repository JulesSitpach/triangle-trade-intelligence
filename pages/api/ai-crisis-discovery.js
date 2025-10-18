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

  const { clientRequirements, saveToDatabase = false, emergencyLevel = 'high' } = req.body;

  if (!clientRequirements) {
    return res.status(400).json({ error: 'Crisis situation details are required' });
  }

  async function callAnthropicWithRetry(prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const message = await anthropic.messages.create({
          model: 'anthropic/claude-haiku-4.5',
          max_tokens: 3000,
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
    const prompt = `You are Cristina Rodriguez, crisis response specialist for trade compliance emergencies.

CRISIS SITUATION ASSESSMENT:
Company: ${clientRequirements.company_name || 'Client Company'}
Crisis Type: ${clientRequirements.crisis_type || clientRequirements.service_type || 'Trade compliance crisis'}
Urgency: ${clientRequirements.urgency || emergencyLevel}
Description: ${clientRequirements.crisis_description || clientRequirements.requirements || 'Emergency trade situation'}
Timeline: ${clientRequirements.timeline || 'Immediate response required'}
Impact: ${clientRequirements.business_impact || 'Business operations at risk'}

Your task: Develop immediate crisis response strategy and action plan.

RESPONSE FRAMEWORK:
1. Crisis Assessment & Severity Analysis
2. Immediate Risk Mitigation Actions
3. Regulatory Compliance Requirements
4. Emergency Contact Strategy
5. Timeline and Escalation Plan
6. Recovery and Prevention Measures

Generate 3-5 IMMEDIATE ACTION ITEMS in this format:

[
  {
    "action_type": "immediate_response|regulatory_contact|documentation|escalation",
    "description": "Specific action to take",
    "priority": "critical|high|medium",
    "timeline": "immediate|24hours|this_week",
    "responsible_party": "client|cristina|customs_authority|legal",
    "expected_outcome": "What this action will achieve",
    "next_step": "Follow-up action required"
  }
]

Focus on:
- Immediate damage control
- Regulatory compliance restoration
- Communication with authorities
- Documentation and evidence gathering
- Prevention of future incidents

Provide realistic, actionable crisis response steps that Cristina can execute immediately.`;

    console.log('🚨 Generating crisis response strategy...');
    const response = await callAnthropicWithRetry(prompt);
    const aiContent = response.content[0].text;

    // Extract JSON from response
    let actionItems = [];
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        actionItems = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      // Fallback action items if JSON parsing fails
      actionItems = [
        {
          action_type: "immediate_response",
          description: "Contact customs authorities to report the crisis situation",
          priority: "critical",
          timeline: "immediate",
          responsible_party: "cristina",
          expected_outcome: "Official notification and initial guidance received",
          next_step: "Document all communications and follow authority instructions"
        },
        {
          action_type: "documentation",
          description: "Gather all relevant trade documentation and evidence",
          priority: "high",
          timeline: "24hours",
          responsible_party: "client",
          expected_outcome: "Complete documentation package ready for review",
          next_step: "Submit documentation to authorities as directed"
        },
        {
          action_type: "regulatory_contact",
          description: "Engage legal counsel specialized in trade compliance",
          priority: "high",
          timeline: "immediate",
          responsible_party: "client",
          expected_outcome: "Legal representation secured and strategy developed",
          next_step: "Coordinate response strategy with all parties"
        }
      ];
    }

    const crisisResponseData = {
      success: true,
      crisis_type: clientRequirements.crisis_type || 'Trade compliance crisis',
      severity_level: emergencyLevel,
      action_items: actionItems,
      response_strategy: aiContent,
      generated_at: new Date().toISOString(),
      estimated_resolution_time: "24-72 hours",
      cristina_availability: "24/7 emergency response activated"
    };

    // Save to database if requested
    if (saveToDatabase) {
      try {
        const { data, error } = await supabase
          .from('service_requests')
          .insert({
            service_type: 'crisis_response',
            company_name: clientRequirements.company_name,
            status: 'crisis_response_active',
            urgency: 'critical',
            service_details: clientRequirements,
            crisis_response_data: crisisResponseData,
            created_at: new Date().toISOString(),
            assigned_to: 'Cristina'
          });

        if (error) {
          console.error('Database save error:', error);
        } else {
          console.log('✅ Crisis response saved to database');
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    return res.status(200).json(crisisResponseData);

  } catch (error) {
    console.error('Crisis response error:', error);
    return res.status(500).json({
      error: 'Failed to generate crisis response strategy',
      message: error.message
    });
  }
}