/**
 * MEXICO TRADE ALERTS API
 * Real-time alerts for Mexico trade opportunities and issues
 * Practical notifications that drive action
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
    // Query Mexico-related alerts from database
    let { data: alerts, error: alertsError } = await supabase
      .from('mexico_trade_alerts')
      .select('*')
      .eq('mexico_focus', true)
      .order('date', { ascending: false });

    // If no alerts table or no data, return empty alerts
    if (alertsError || !alerts || alerts.length === 0) {
      console.log('Mexico alerts table empty, returning empty data');

      return res.status(200).json({
        alerts: [],
        alert_summary: {
          total_alerts: 0,
          high_priority: 0,
          opportunities: 0,
          disruptions: 0,
          regulatory: 0,
          total_impact: 0,
          needs_immediate_action: 0
        },
        data_status: {
          source: 'database_empty',
          reason: 'no_mexico_trade_alerts',
          last_updated: new Date().toISOString(),
          record_count: 0
        }
      });
    }

    // Calculate alert summary
    const alertSummary = {
      total_alerts: alerts.length,
      high_priority: alerts.filter(a => a.priority === 'high').length,
      opportunities: alerts.filter(a => a.type === 'opportunity').length,
      disruptions: alerts.filter(a => a.type === 'disruption').length,
      regulatory: alerts.filter(a => a.type === 'regulatory').length,
      total_impact: alerts.reduce((sum, alert) => sum + (alert.estimated_value || 0), 0),
      needs_immediate_action: alerts.filter(a => a.priority === 'high' || a.needs_handoff).length
    };

    // Group alerts by client
    const clientAlerts = {};
    alerts.forEach(alert => {
      if (alert.affected_clients) {
        alert.affected_clients.forEach(client => {
          if (!clientAlerts[client]) {
            clientAlerts[client] = [];
          }
          clientAlerts[client].push(alert);
        });
      }
    });

    const response = {
      success: true,
      data: {
        alerts: alerts,
        summary: alertSummary,
        client_alerts: clientAlerts,
        action_items: alerts
          .filter(alert => alert.priority === 'high' || alert.needs_handoff)
          .map(alert => ({
            alert_id: alert.id,
            action: alert.action_required,
            priority: alert.priority,
            needs_handoff: alert.needs_handoff || false,
            affected_clients: alert.affected_clients
          }))
      },
      timestamp: new Date().toISOString(),
      mexico_focus: true
    };

    console.log('Returning Mexico trade alerts for simple dashboard');
    res.status(200).json(response);

  } catch (error) {
    console.error('Mexico alerts API error:', error);
    res.status(500).json({
      error: 'Failed to load Mexico trade alerts',
      details: error.message
    });
  }
}