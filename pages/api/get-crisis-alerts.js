/**
 * GET CRISIS ALERTS - ALERTS PAGE (Strategic View)
 *
 * PURPOSE: Long-term strategic planning and supply chain monitoring
 * SCOPE: ALL active alerts (all severity levels)
 * USE CASE: Alerts dashboard showing comprehensive risk landscape
 *
 * DISTINCTION from PolicyTimeline (Results Page):
 * - PolicyTimeline: Shows ONLY critical/high alerts for SPECIFIC workflow
 * - This endpoint: Shows ALL active alerts for strategic planning
 */

import { createClient } from '@supabase/supabase-js';

// ✅ FIX (Nov 12): Decode HTML entities from RSS feed titles/descriptions
// RSS feeds often contain &#8216; ('), &#8217; ('), &#8220; ("), &#8221; ("), etc.
function decodeHTMLEntities(text) {
  if (!text) return text;

  const entities = {
    '&#8216;': "'", // left single quote
    '&#8217;': "'", // right single quote
    '&#8220;': '"', // left double quote
    '&#8221;': '"', // right double quote
    '&#8211;': '-', // en dash
    '&#8212;': '-', // em dash
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' '
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  return decoded;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // ✅ STRATEGIC VIEW: Fetch ALL active crisis alerts (all severity levels)
    // This is for the Alerts Dashboard - comprehensive supply chain monitoring
    const { data: alerts, error: alertError } = await supabase
      .from('crisis_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100); // More alerts for strategic planning

    if (alertError) {
      console.error('❌ Error fetching crisis alerts:', alertError);
      return res.status(500).json({ error: 'Failed to fetch alerts' });
    }

    // ✅ AGE-BASED FILTERING (Nov 17): Prevent alert clutter
    // CRITICAL/HIGH: 30 days, MEDIUM: 14 days, LOW: 7 days
    const now = new Date();
    const ageFilteredAlerts = (alerts || []).filter(alert => {
      const alertAge = (now - new Date(alert.created_at)) / (1000 * 60 * 60 * 24); // days
      const severity = (alert.severity || alert.severity_level || '').toUpperCase();

      if (severity === 'CRITICAL' || severity === 'HIGH') {
        return alertAge <= 30; // Keep for 30 days
      } else if (severity === 'MEDIUM') {
        return alertAge <= 14; // Keep for 14 days
      } else {
        return alertAge <= 7; // LOW/unknown: 7 days
      }
    });

    console.log(`📅 Age-filtered alerts: ${alerts?.length || 0} → ${ageFilteredAlerts.length} (removed ${(alerts?.length || 0) - ageFilteredAlerts.length} old alerts)`);

    // ✅ FIX (Nov 8): Map to ACTUAL crisis_alerts schema
    // Schema from migrations/011_create_rss_monitoring_tables.sql
    // ✅ SCHEMA COMPATIBILITY (Nov 8): Handle both old (severity) and new (severity_level) schemas
    const formattedAlerts = ageFilteredAlerts.map(alert => {
      // Normalize severity field (database has 'severity', not 'severity_level')
      const normalizedSeverity = alert.severity_level || alert.severity;

      return {
        id: alert.id,
        // ✅ FIX (Nov 12): Decode HTML entities (&#8216; → ', &#8217; → ')
        title: decodeHTMLEntities(alert.title),
        description: decodeHTMLEntities(alert.description || alert.business_impact),

        // ✅ SCHEMA COMPATIBILITY: Support both old and new field names
        severity: normalizedSeverity,
        severity_level: normalizedSeverity,

      // ✅ ACTUAL SCHEMA (verified Nov 8): Database has these columns
      alert_type: alert.alert_type,
      detection_source: alert.detection_source, // Database field name

      // ✅ ACTUAL SCHEMA: These columns exist in database
      affected_hs_codes: alert.affected_hs_codes || [],
      affected_countries: alert.affected_countries || [], // EXISTS in database
      relevant_industries: alert.relevant_industries || [], // Database has 'relevant_industries' NOT 'affected_industries'

      // ✅ ACTUAL SCHEMA: These exist
      source_url: alert.source_url,
      created_at: alert.created_at,
      impact_percentage: alert.impact_percentage,
      confidence_score: alert.confidence_score,

      // ⚠️ LEGACY FIELDS (columns don't exist, provide sensible defaults for backwards compatibility)
      affected_industries: alert.relevant_industries || [], // Map to relevant_industries for backwards compat
      source_type: alert.detection_source, // Map detection_source for backwards compat
      keywords_matched: [], // Column doesn't exist
      crisis_score: 0, // Column doesn't exist
      business_impact: alert.description, // Column doesn't exist, use description
      agreement_type: alert.agreement_type || 'tariff_change',

      // Urgency derived from severity
      urgency: normalizedSeverity === 'critical' ? 'high' :
               normalizedSeverity === 'high' ? 'high' :
               normalizedSeverity === 'medium' ? 'medium' : 'low'
    };
    });

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
