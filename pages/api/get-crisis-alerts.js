/**
 * GET CRISIS ALERTS
 * Fetches active crisis alerts from database
 * Used by RealTimeMonitoringDashboard to display detected tariff changes
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // ✅ Crisis alerts are public data - all users can see active alerts
    // No authentication required, but we log who's accessing for analytics

    // Fetch all active crisis alerts
    const { data: alerts, error: alertError } = await supabase
      .from('crisis_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (alertError) {
      console.error('❌ Error fetching crisis alerts:', alertError);
      return res.status(500).json({ error: 'Failed to fetch alerts' });
    }

    // Transform alerts to match expected format
    const formattedAlerts = (alerts || []).map(alert => ({
      id: alert.id,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      alert_type: alert.alert_type,
      affected_hs_codes: alert.affected_hs_codes || [],
      affected_countries: alert.affected_countries || [],
      relevant_industries: alert.relevant_industries || [],
      impact_percentage: alert.impact_percentage,
      source_url: alert.source_url,
      created_at: alert.created_at,
      agreement_type: alert.agreement_type || 'tariff_change',
      confidence_score: alert.confidence_score || 0.95,
      detection_source: alert.detection_source || 'manual',
      urgency: alert.severity === 'critical' ? 'high' :
               alert.severity === 'high' ? 'high' :
               alert.severity === 'medium' ? 'medium' : 'low'
    }));

    return res.status(200).json({
      success: true,
      alerts: formattedAlerts,
      count: formattedAlerts.length,
      message: `Found ${formattedAlerts.length} active crisis alerts`
    });

  } catch (error) {
    console.error('❌ Error in get-crisis-alerts:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
