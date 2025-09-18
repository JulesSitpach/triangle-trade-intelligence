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
    // Query handoff triggers from database
    let { data: handoffTriggers, error: handoffError } = await supabase
      .from('handoff_triggers')
      .select('*')
      .order('priority', { ascending: false });

    // If no handoff_triggers table or no data, return empty data
    if (handoffError || !handoffTriggers || handoffTriggers.length === 0) {
      console.log('Handoff triggers table empty, returning empty data');

      return res.status(200).json({
        handoff_triggers: [],
        handoff_summary: {
          total_handoffs: 0,
          ready_for_handoff: 0,
          high_priority: 0,
          total_estimated_hours: 0,
          mexico_focused: 0,
          urgent_deadline: 0
        },
        data_status: {
          source: 'database_empty',
          reason: 'no_handoff_triggers',
          last_updated: new Date().toISOString(),
          record_count: 0
        }
      });
    }

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