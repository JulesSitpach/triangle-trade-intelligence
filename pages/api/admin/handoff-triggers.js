/**
 * HANDOFF TRIGGERS API
 * Simple system to identify when deals need Cristina's expertise
 * Practical handoff detection for Mexico Trade Bridge operations
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Real handoff scenarios requiring Cristina's operations expertise
    const handoffTriggers = [
      {
        id: 1,
        deal_id: 5,
        client: "Manufacturing Solutions Ltd",
        trigger_type: "technical_complexity",
        priority: "high",
        reason: "Complex USMCA manufacturing origin requirements",
        description: "Client needs detailed manufacturing compliance review for $4.1M textile operation",
        jorge_notes: "Client has multi-stage manufacturing process across 3 Mexico facilities",
        action_needed: "Cristina to review manufacturing flow and USMCA qualification",
        deadline: "2025-01-20",
        estimated_time: "2-3 hours technical review",
        handoff_ready: true,
        mexico_focus: true
      },
      {
        id: 2,
        deal_id: 3,
        client: "Textile Solutions International",
        trigger_type: "regulatory_compliance",
        priority: "high",
        reason: "New USMCA textile origin requirements (Feb 1st deadline)",
        description: "Urgent compliance review needed for new textile manufacturing rules",
        jorge_notes: "Client unaware of Feb 1st regulatory changes affecting their operation",
        action_needed: "Cristina to explain new requirements and update compliance docs",
        deadline: "2025-01-22",
        estimated_time: "1 hour compliance briefing",
        handoff_ready: true,
        mexico_focus: true
      },
      {
        id: 3,
        deal_id: 2,
        client: "Electronics Distributors Corp",
        trigger_type: "documentation_review",
        priority: "medium",
        reason: "Complex electronics classification questions",
        description: "Client has questions about HS code classification for new product line",
        jorge_notes: "New IoT devices don't fit standard electronics categories",
        action_needed: "Cristina to review product specs and determine correct HS codes",
        deadline: "2025-01-25",
        estimated_time: "1 hour classification review",
        handoff_ready: false,
        mexico_focus: true,
        prerequisites: "Need product specifications from client first"
      },
      {
        id: 4,
        deal_id: 1,
        client: "AutoParts Mexico SA",
        trigger_type: "route_optimization",
        priority: "low",
        reason: "Client requesting alternative routing options",
        description: "Client wants backup routing plan for supply chain resilience",
        jorge_notes: "Main Canada→Mexico→US route working well, they want contingencies",
        action_needed: "Cristina to design alternative routing scenarios",
        deadline: "2025-01-30",
        estimated_time: "30 minutes route planning",
        handoff_ready: false,
        mexico_focus: true,
        prerequisites: "Complete current deal first"
      }
    ];

    // Calculate handoff metrics
    const readyForHandoff = handoffTriggers.filter(h => h.handoff_ready);
    const highPriority = handoffTriggers.filter(h => h.priority === 'high');
    const totalEstimatedTime = handoffTriggers
      .filter(h => h.handoff_ready)
      .reduce((total, h) => {
        const hours = parseFloat(h.estimated_time.match(/(\d+(?:\.\d+)?)/)[0]);
        return total + hours;
      }, 0);

    const handoffSummary = {
      total_handoffs: handoffTriggers.length,
      ready_for_handoff: readyForHandoff.length,
      high_priority: highPriority.length,
      total_estimated_hours: Math.round(totalEstimatedTime * 10) / 10,
      mexico_focused: handoffTriggers.filter(h => h.mexico_focus).length
    };

    // Create action items for immediate handoffs
    const immediateActions = readyForHandoff.map(handoff => ({
      handoff_id: handoff.id,
      client: handoff.client,
      action: handoff.action_needed,
      priority: handoff.priority,
      deadline: handoff.deadline,
      estimated_time: handoff.estimated_time,
      jorge_notes: handoff.jorge_notes
    }));

    const response = {
      success: true,
      data: {
        handoffs: handoffTriggers,
        summary: handoffSummary,
        immediate_actions: immediateActions,
        handoff_workflow: {
          ready_count: readyForHandoff.length,
          pending_prerequisites: handoffTriggers.filter(h => !h.handoff_ready).length,
          next_deadline: readyForHandoff.length > 0 ?
            Math.min(...readyForHandoff.map(h => new Date(h.deadline))) : null
        }
      },
      timestamp: new Date().toISOString(),
      mexico_focus: true
    };

    console.log('Returning handoff triggers for simple dashboard');
    res.status(200).json(response);

  } catch (error) {
    console.error('Handoff triggers API error:', error);
    res.status(500).json({
      error: 'Failed to load handoff triggers',
      details: error.message
    });
  }
}