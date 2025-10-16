/**
 * GET /api/tariff-policy-alerts
 * Fetch active tariff policy updates for user-facing alerts page
 * Shows REAL Trump tariff changes, not educational fluff
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('📰 Fetching active tariff policy alerts for users...');

    // Query active, approved policies (what users should see)
    const { data: policies, error } = await supabase
      .from('tariff_policy_updates')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'approved')
      .order('priority', { ascending: true }) // Priority 1 first
      .order('effective_date', { ascending: false }); // Most recent first

    if (error) {
      throw error;
    }

    console.log(`✅ Found ${policies?.length || 0} active policy alerts for users`);

    // Format policies for user-friendly display
    const alerts = (policies || []).map(policy => ({
      id: policy.id,
      title: policy.title,
      description: policy.description,
      severity: mapPriorityToSeverity(policy.priority),
      category: formatPolicyType(policy.policy_type),
      effective_date: policy.effective_date,
      affected_countries: policy.affected_countries || [],
      affected_hs_codes: policy.affected_hs_codes || [],
      tariff_adjustment: policy.tariff_adjustment,
      adjustment_percentage: policy.adjustment_percentage,
      impact_summary: policy.prompt_text, // User-friendly impact description
      source_url: policy.source_url,
      source_feed: policy.source_feed_name,
      last_updated: policy.updated_at
    }));

    return res.status(200).json({
      success: true,
      alerts: alerts,
      count: alerts.length,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching policy alerts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch policy alerts',
      error: error.message
    });
  }
}

/**
 * Map admin priority (1-10) to user-friendly severity
 */
function mapPriorityToSeverity(priority) {
  if (priority <= 3) return 'CRITICAL';
  if (priority <= 6) return 'HIGH';
  if (priority <= 8) return 'MEDIUM';
  return 'LOW';
}

/**
 * Format policy type for user display
 */
function formatPolicyType(policyType) {
  const typeMap = {
    'section_301': 'Section 301 Tariff',
    'port_fees': 'Port Fee Increase',
    'bilateral_deal': 'Trade Agreement Change',
    'investigation': 'Trade Investigation',
    'antidumping': 'Antidumping Duty',
    'countervailing': 'Countervailing Duty',
    'hts_classification': 'HS Code Change',
    'usmca_ruling': 'USMCA Policy Update',
    'other': 'Trade Policy Change'
  };

  return typeMap[policyType] || 'Policy Update';
}
