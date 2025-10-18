/**
 * USMCA Roadmap Generation API - Phase 1 Quick Win
 * After Cristina's validation, AI creates actionable implementation roadmap
 *
 * Input: Cristina's findings, AI analysis, client data
 * Output: 30/60/90 day implementation roadmap with specific actions
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { serviceRequestId, subscriberData, cristinaFindings, aiAnalysis } = req.body;

    if (!subscriberData || !cristinaFindings) {
      return res.status(400).json({ error: 'Subscriber data and Cristina findings are required' });
    }

    // Build roadmap generation prompt
    const roadmapPrompt = `You are a USMCA implementation strategist. Create a detailed 30/60/90 day implementation roadmap based on the professional analysis below.

CLIENT CONTEXT:
- Company: ${subscriberData.company_name}
- Product: ${subscriberData.product_description}
- Current USMCA Status: ${subscriberData.qualification_status}
- Trade Volume: $${subscriberData.trade_volume || 'Not specified'}
- North American Content: ${subscriberData.north_american_content || 0}%

CRISTINA'S PROFESSIONAL FINDINGS:
- Confidence Level: ${cristinaFindings.compliance_confidence_level || 'Standard review'}
- Risk Assessment: ${cristinaFindings.professional_recommendations || 'Standard monitoring'}
- Professional Guarantee: ${cristinaFindings.customs_broker_guarantee || 'Professional backing applied'}

AI COMPLIANCE ANALYSIS:
- Risk Score: ${aiAnalysis?.risk_score || 'Medium'}
- Compliance Risks: ${aiAnalysis?.compliance_risks?.join(', ') || 'Standard monitoring'}
- Recommendations: ${aiAnalysis?.recommendations?.join(', ') || 'Continue current practices'}

TASK: Create a specific, actionable implementation roadmap.

Return your roadmap in this JSON format:
{
  "executive_summary": "2-3 sentence overview of the implementation plan",
  "first_30_days": {
    "title": "Immediate Actions (Days 1-30)",
    "objectives": ["Primary objective", "Secondary objective"],
    "action_items": [
      {
        "action": "Specific action to take",
        "owner": "Jorge/Cristina/Client",
        "expected_outcome": "What this achieves",
        "priority": "HIGH/MEDIUM/LOW"
      }
    ]
  },
  "days_31_60": {
    "title": "Optimization Phase (Days 31-60)",
    "objectives": ["Primary objective"],
    "action_items": [
      {
        "action": "Specific action",
        "owner": "Owner",
        "expected_outcome": "Outcome",
        "priority": "PRIORITY"
      }
    ]
  },
  "days_61_90": {
    "title": "Monitoring & Refinement (Days 61-90)",
    "objectives": ["Primary objective"],
    "action_items": [
      {
        "action": "Specific action",
        "owner": "Owner",
        "expected_outcome": "Outcome",
        "priority": "PRIORITY"
      }
    ]
  },
  "cost_benefit_projection": {
    "implementation_cost_estimate": "Estimated cost to implement",
    "annual_savings_potential": "Annual tariff savings",
    "roi_timeline": "When client breaks even",
    "risk_mitigation_value": "Value of reduced compliance risk"
  },
  "success_metrics": [
    "Metric 1: How to measure success",
    "Metric 2: Another success indicator"
  ],
  "next_services_recommended": [
    "Service that would help this client next"
  ]
}

Be specific with dollar amounts, timelines, and actionable steps. Focus on what the client can actually DO.`;

    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://triangle-trade-intelligence.vercel.app',
        'X-Title': 'Triangle Trade Intelligence - USMCA Roadmap Generation'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4.5',
        messages: [
          {
            role: 'user',
            content: roadmapPrompt
          }
        ],
        temperature: 0.4,
        max_tokens: 2000
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API Error:', errorText);
      throw new Error(`OpenRouter API failed: ${openRouterResponse.status}`);
    }

    const aiResult = await openRouterResponse.json();
    const aiContent = aiResult.choices[0].message.content;

    // Parse AI response
    let roadmapResult;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        roadmapResult = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback roadmap
        roadmapResult = {
          executive_summary: "Implementation plan created based on professional analysis. Focus on compliance documentation and supplier coordination.",
          first_30_days: {
            title: "Immediate Actions (Days 1-30)",
            objectives: ["Organize compliance documentation"],
            action_items: [
              {
                action: "Compile all supplier certificates and component documentation",
                owner: "Client",
                expected_outcome: "Complete documentation package ready for audit",
                priority: "HIGH"
              }
            ]
          },
          days_31_60: {
            title: "Optimization Phase (Days 31-60)",
            objectives: ["Optimize supply chain"],
            action_items: [
              {
                action: "Review supplier relationships and USMCA qualification",
                owner: "Jorge",
                expected_outcome: "Identified optimization opportunities",
                priority: "MEDIUM"
              }
            ]
          },
          days_61_90: {
            title: "Monitoring & Refinement (Days 61-90)",
            objectives: ["Establish monitoring"],
            action_items: [
              {
                action: "Set up quarterly compliance review process",
                owner: "Cristina",
                expected_outcome: "Ongoing compliance maintained",
                priority: "MEDIUM"
              }
            ]
          },
          cost_benefit_projection: {
            implementation_cost_estimate: "$2,000-5,000",
            annual_savings_potential: `$${subscriberData.potential_usmca_savings || 50000}`,
            roi_timeline: "3-6 months",
            risk_mitigation_value: "Significant reduction in audit risk"
          },
          success_metrics: [
            "USMCA qualification maintained for 12 months",
            "Zero compliance issues in quarterly reviews"
          ],
          next_services_recommended: [
            "Supply Chain Resilience Audit",
            "Ongoing Compliance Monitoring"
          ]
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI roadmap:', parseError);
      roadmapResult = {
        executive_summary: "Roadmap generation encountered an issue. Manual review recommended.",
        error: "Parsing error",
        fallback: true
      };
    }

    // Add metadata
    roadmapResult.generated_timestamp = new Date().toISOString();
    roadmapResult.generated_by = 'AI (Claude Haiku) + Professional Validation';
    roadmapResult.service_request_id = serviceRequestId;

    return res.status(200).json({
      success: true,
      roadmap: roadmapResult
    });

  } catch (error) {
    console.error('Roadmap generation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      fallback_roadmap: {
        executive_summary: "Implementation roadmap could not be generated automatically. Professional manual review recommended.",
        error: true
      }
    });
  }
}
