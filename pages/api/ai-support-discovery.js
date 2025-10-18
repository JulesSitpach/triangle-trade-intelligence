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
    return res.status(400).json({ error: 'Client support requirements are required' });
  }

  // ========== LOG MISSING OPTIONAL FIELDS (for admin review) ==========
  const missingOptionalFields = [];

  if (!clientRequirements.company_name) missingOptionalFields.push('company_name');
  if (!clientRequirements.industry) missingOptionalFields.push('industry');
  if (!clientRequirements.support_type) missingOptionalFields.push('support_type');
  if (!clientRequirements.current_challenges) missingOptionalFields.push('current_challenges');
  if (!clientRequirements.trade_volume) missingOptionalFields.push('trade_volume');
  if (!clientRequirements.goals) missingOptionalFields.push('goals');

  if (missingOptionalFields.length > 0) {
    // Log to admin dashboard (non-blocking)
    await DevIssue.missingData('support_discovery', missingOptionalFields.join(', '), {
      service_type: 'Crisis Navigator',
      workflow_step: 'ai_support_planning',
      impact: 'AI support recommendations quality may be reduced due to missing context',
      missing_fields: missingOptionalFields
    });
    console.log(`⚠️  Missing optional fields: ${missingOptionalFields.join(', ')} - AI quality may be reduced`);
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
    const prompt = `You are Cristina Rodriguez, trade compliance specialist providing monthly support services.

CLIENT SUPPORT SETUP:
Company: ${clientRequirements.company_name || 'Client Company'}
Industry: ${clientRequirements.industry || 'Trade/Import business'}
Support Type: ${clientRequirements.support_type || 'Monthly compliance support'}
Current Challenges: ${clientRequirements.current_challenges || 'General compliance management'}
Trade Volume: ${clientRequirements.trade_volume || 'Standard volume'}
Compliance Goals: ${clientRequirements.goals || 'Maintain compliance and optimize operations'}

Your task: Design a monthly support plan with specific deliverables and check-in schedule.

SUPPORT PLAN FRAMEWORK:
1. Monthly Compliance Review Schedule
2. Proactive Monitoring Areas
3. Documentation Management
4. Regulatory Update Tracking
5. Crisis Prevention Measures
6. Performance Metrics & KPIs

Generate 4-6 MONTHLY DELIVERABLES in this format:

[
  {
    "deliverable_type": "compliance_review|documentation_audit|regulatory_update|training|crisis_prevention",
    "description": "Specific monthly deliverable",
    "frequency": "weekly|monthly|quarterly|as_needed",
    "estimated_hours": "Number of hours per month",
    "client_involvement": "high|medium|low",
    "expected_outcome": "What client will achieve",
    "success_metric": "How to measure success"
  }
]

Focus on:
- Proactive compliance management
- Regular documentation reviews
- Regulatory change monitoring
- Staff training and education
- Performance tracking and reporting
- Crisis prevention and preparedness

Provide realistic, valuable monthly support services that justify the subscription cost.`;

    console.log('📞 Generating monthly support plan...');
    const response = await callAnthropicWithRetry(prompt);
    const aiContent = response.content[0].text;

    // Extract JSON from response
    let deliverables = [];
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        deliverables = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      // Fallback deliverables if JSON parsing fails
      deliverables = [
        {
          deliverable_type: "compliance_review",
          description: "Monthly compliance audit and risk assessment",
          frequency: "monthly",
          estimated_hours: "4-6 hours",
          client_involvement: "medium",
          expected_outcome: "Identify and address compliance gaps before they become issues",
          success_metric: "Zero compliance violations and improved audit scores"
        },
        {
          deliverable_type: "regulatory_update",
          description: "Trade regulation changes summary and impact analysis",
          frequency: "monthly",
          estimated_hours: "2-3 hours",
          client_involvement: "low",
          expected_outcome: "Stay current with regulatory changes affecting business",
          success_metric: "Proactive compliance with new regulations"
        },
        {
          deliverable_type: "documentation_audit",
          description: "Review and optimize trade documentation processes",
          frequency: "monthly",
          estimated_hours: "3-4 hours",
          client_involvement: "high",
          expected_outcome: "Streamlined documentation with reduced errors",
          success_metric: "Faster processing times and fewer documentation issues"
        },
        {
          deliverable_type: "training",
          description: "Staff training on compliance best practices",
          frequency: "monthly",
          estimated_hours: "2 hours",
          client_involvement: "high",
          expected_outcome: "Improved staff compliance knowledge and capabilities",
          success_metric: "Reduced compliance errors and improved team confidence"
        }
      ];
    }

    const supportPlanData = {
      success: true,
      support_type: 'monthly_compliance_support',
      monthly_deliverables: deliverables,
      support_plan: aiContent,
      subscription_value: "$99/month",
      setup_date: new Date().toISOString(),
      next_review_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cristina_contact: "Direct line for monthly support clients",
      total_monthly_hours: deliverables.reduce((total, item) => {
        const hours = item.estimated_hours.match(/(\d+)/);
        return total + (hours ? parseInt(hours[1]) : 2);
      }, 0)
    };

    // Save to database if requested
    if (saveToDatabase) {
      try {
        const { data, error } = await supabase
          .from('service_requests')
          .insert({
            service_type: 'monthly_support',
            company_name: clientRequirements.company_name,
            status: 'support_active',
            urgency: 'standard',
            service_details: clientRequirements,
            support_plan_data: supportPlanData,
            created_at: new Date().toISOString(),
            assigned_to: 'Cristina'
          });

        if (error) {
          console.error('Database save error:', error);
        } else {
          console.log('✅ Monthly support plan saved to database');
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    return res.status(200).json(supportPlanData);

  } catch (error) {
    console.error('Support plan error:', error);
    return res.status(500).json({
      error: 'Failed to generate monthly support plan',
      message: error.message
    });
  }
}