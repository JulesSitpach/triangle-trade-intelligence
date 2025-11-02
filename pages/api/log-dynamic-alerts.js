/**
 * LOG DYNAMIC ALERTS
 * Captures user-specific alerts in database for RSS monitoring/audit trail
 * Called after dynamic alerts are generated
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, company_name, dynamic_alerts, portfolio_data } = req.body;

    if (!user_id || !dynamic_alerts || !Array.isArray(dynamic_alerts)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Log each alert to the database for monitoring/audit trail
    const alertLogs = dynamic_alerts.map(alert => ({
      user_id,
      company_name,
      alert_id: alert.id,
      alert_type: alert.type,
      alert_title: alert.title,
      alert_description: alert.description,
      component_affected: alert.component,
      impact_percentage: alert.impact_percentage,
      impact_value: alert.impact_value,
      exposure_estimate: alert.exposure_estimate || alert.exposure_low,
      urgency: alert.urgency,
      severity: alert.severity,
      timeline: alert.timeline,
      days_until: alert.days_until,
      action_recommended: alert.action,
      affected_countries: alert.affected_countries?.join(','),
      affected_hs_codes: alert.affected_hs_codes?.join(','),
      portfolio_rvc: portfolio_data?.rvc,
      portfolio_total_value: portfolio_data?.total_volume,
      portfolio_component_count: portfolio_data?.component_count,
      source: 'dynamic_generation',
      generated_at: new Date().toISOString()
    }));

    // Bulk insert to database
    const { data, error } = await supabase
      .from('user_alert_logs')
      .insert(alertLogs);

    if (error) {
      console.error('❌ Failed to log alerts:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    console.log(`✅ Logged ${alertLogs.length} dynamic alerts for ${company_name}`);

    // Also create summary of this alert generation session
    const { data: sessionData, error: sessionError } = await supabase
      .from('alert_generation_sessions')
      .insert({
        user_id,
        company_name,
        total_alerts_generated: alertLogs.length,
        high_urgency_count: alertLogs.filter(a => a.urgency === 'HIGH').length,
        medium_urgency_count: alertLogs.filter(a => a.urgency === 'MEDIUM').length,
        low_urgency_count: alertLogs.filter(a => a.urgency === 'LOW').length,
        alert_types: [...new Set(alertLogs.map(a => a.alert_type))].join(','),
        portfolio_snapshot: JSON.stringify(portfolio_data),
        generated_at: new Date().toISOString()
      });

    if (sessionError) {
      console.warn('⚠️ Failed to log session:', sessionError);
    }

    return res.status(200).json({
      success: true,
      alerts_logged: alertLogs.length,
      session_logged: !sessionError,
      message: `Logged ${alertLogs.length} dynamic alerts for monitoring system`
    });

  } catch (error) {
    console.error('❌ Alert logging failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
