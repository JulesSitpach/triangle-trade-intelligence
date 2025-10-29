/**
 * ALERT PUSH SERVICE
 * Pushes policy change alerts to paying users' dashboard_notifications table
 *
 * Flow:
 * 1. Policy change detected (RSS polling)
 * 2. Database updated (tariff_intelligence_master)
 * 3. Find affected users (workflow_sessions with matching HS codes)
 * 4. Calculate financial impact per user
 * 5. Create alerts for PAID users only (free users see upgrade prompt)
 * 6. Users see alerts on /trade-risk-alternatives page
 *
 * Oct 28, 2025 - Self-Learning Database Enhancement
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Find users affected by a policy change
 * @param {Object} policyChange - Parsed policy change from RSS
 * @returns {Array} Array of affected users with financial impact
 */
export async function findAffectedUsers(policyChange) {
  const { hs_codes_affected, old_rate, new_rate } = policyChange;

  console.log(`🔍 [AFFECTED-USERS] Searching for users with HS codes:`, hs_codes_affected);

  // Query workflow_sessions for users with affected HS codes
  const { data: workflows, error } = await supabase
    .from('workflow_sessions')
    .select(`
      id,
      user_id,
      company_name,
      components,
      enrichment_data,
      destination_country
    `)
    .not('components', 'is', null);

  if (error) {
    console.error('❌ [AFFECTED-USERS] Database error:', error);
    throw error;
  }

  console.log(`📊 [AFFECTED-USERS] Found ${workflows?.length || 0} total workflows`);

  // Filter workflows that contain affected HS codes
  const affectedUsers = [];

  for (const workflow of workflows || []) {
    const components = workflow.components || [];

    // Check if any component matches affected HS codes
    const affectedComponents = components.filter(comp => {
      const hsCode = normalizeHSCode(comp.hs_code);
      return hs_codes_affected.some(affectedCode => {
        const normalizedAffected = normalizeHSCode(affectedCode);
        return hsCode.startsWith(normalizedAffected.substring(0, 6)); // Match first 6 digits
      });
    });

    if (affectedComponents.length === 0) {
      continue; // No affected components in this workflow
    }

    // Get user profile for subscription tier
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, email_alerts_enabled')
      .eq('user_id', workflow.user_id)
      .single();

    // Calculate financial impact
    const financialImpact = calculateFinancialImpact(
      affectedComponents,
      workflow.enrichment_data,
      old_rate,
      new_rate
    );

    affectedUsers.push({
      user_id: workflow.user_id,
      workflow_id: workflow.id,
      company_name: workflow.company_name,
      destination_country: workflow.destination_country,
      subscription_tier: profile?.subscription_tier || 'free',
      email_alerts_enabled: profile?.email_alerts_enabled || false,
      affected_components: affectedComponents,
      old_cost: financialImpact.old_cost,
      new_cost: financialImpact.new_cost,
      cost_increase: financialImpact.cost_increase,
      trade_volume: financialImpact.trade_volume
    });
  }

  console.log(`✅ [AFFECTED-USERS] Found ${affectedUsers.length} affected users`);
  console.log(`   Paid users: ${affectedUsers.filter(u => isPaidUser(u.subscription_tier)).length}`);
  console.log(`   Free users: ${affectedUsers.filter(u => !isPaidUser(u.subscription_tier)).length}`);

  return affectedUsers;
}

/**
 * Calculate financial impact of policy change on user's components
 */
function calculateFinancialImpact(affectedComponents, enrichmentData, oldRate, newRate) {
  // Get trade volume from enrichment data or estimate from components
  const tradeVolume = enrichmentData?.trade_volume ||
                      affectedComponents.reduce((sum, c) => sum + (c.value || 0), 0);

  // Calculate old tariff cost
  const oldCost = affectedComponents.reduce((sum, comp) => {
    const componentValue = (comp.value_percentage / 100) * tradeVolume;
    return sum + (componentValue * oldRate);
  }, 0);

  // Calculate new tariff cost
  const newCost = affectedComponents.reduce((sum, comp) => {
    const componentValue = (comp.value_percentage / 100) * tradeVolume;
    return sum + (componentValue * newRate);
  }, 0);

  return {
    old_cost: Math.round(oldCost),
    new_cost: Math.round(newCost),
    cost_increase: Math.round(newCost - oldCost),
    trade_volume: Math.round(tradeVolume)
  };
}

/**
 * Push policy change alerts to paying users' dashboard_notifications
 * FREE users: Don't get alerts (see upgrade prompt on alerts page)
 * PAID users: Full alert with financial impact + what-if scenarios
 */
export async function pushPolicyChangeAlert(policyChange, affectedUsers) {
  const {
    policy_type,
    hs_codes_affected,
    old_rate,
    new_rate,
    effective_date,
    announcement_source,
    announcement_url
  } = policyChange;

  console.log(`🔔 [ALERT-PUSH] Creating alerts for ${affectedUsers.length} affected users...`);

  const alertsCreated = [];
  const alertsSkipped = { free: 0, duplicate: 0, error: 0 };

  for (const user of affectedUsers) {
    const {
      user_id,
      subscription_tier,
      company_name,
      destination_country,
      affected_components,
      old_cost,
      new_cost,
      cost_increase,
      trade_volume
    } = user;

    // ✅ TIER GATING: Only paid users get detailed alerts
    if (!isPaidUser(subscription_tier)) {
      console.log(`⏭️  [ALERT-PUSH] Skipping free user ${user_id} (${subscription_tier})`);
      alertsSkipped.free++;
      continue;
    }

    // Check for duplicate alerts (same policy + user in last 7 days)
    const { data: existingAlerts } = await supabase
      .from('dashboard_notifications')
      .select('id')
      .eq('user_id', user_id)
      .eq('policy_type', policy_type)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (existingAlerts && existingAlerts.length > 0) {
      console.log(`⏭️  [ALERT-PUSH] Skipping duplicate alert for user ${user_id}`);
      alertsSkipped.duplicate++;
      continue;
    }

    // Calculate Mexico sourcing savings (what-if scenario)
    // If user switches to Mexico, eliminates Section 301 (USMCA qualified)
    const mexicoSavings = policy_type === 'section_301' ? new_cost : 0;

    // Determine severity based on cost increase
    const severity = cost_increase > 100000 ? 'critical' :
                     cost_increase > 50000 ? 'high' :
                     cost_increase > 10000 ? 'medium' : 'low';

    // Build alert message
    const title = `${formatPolicyName(policy_type)} Tariffs Increased`;
    const message = `Your annual tariff cost increased from ${formatCurrency(old_cost)} → ${formatCurrency(new_cost)} (+${formatCurrency(cost_increase)})`;

    // Create alert object
    const alert = {
      user_id,
      alert_type: 'policy_change',
      severity,
      title,
      message,

      // Financial impact
      cost_impact: cost_increase,
      old_cost,
      new_cost,

      // Policy details
      policy_type,
      hs_codes_affected,
      old_rate,
      new_rate,
      effective_date,

      // What-if scenario
      mexico_sourcing_savings: mexicoSavings,

      // Additional context
      affected_components_count: affected_components.length,
      company_name,
      destination_country,
      trade_volume,
      announcement_source,
      announcement_url,

      // Metadata
      is_read: false,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
    };

    // Insert into dashboard_notifications
    const { data, error: insertError } = await supabase
      .from('dashboard_notifications')
      .insert(alert)
      .select();

    if (insertError) {
      console.error(`❌ [ALERT-PUSH] Failed to create alert for user ${user_id}:`, insertError.message);
      alertsSkipped.error++;
    } else {
      console.log(`✅ [ALERT-PUSH] Created ${severity} alert for ${company_name}: +${formatCurrency(cost_increase)}`);
      alertsCreated.push(data[0]);
    }
  }

  // Summary statistics
  const summary = {
    total_alerts_created: alertsCreated.length,
    severity_breakdown: {
      critical: alertsCreated.filter(a => a.severity === 'critical').length,
      high: alertsCreated.filter(a => a.severity === 'high').length,
      medium: alertsCreated.filter(a => a.severity === 'medium').length,
      low: alertsCreated.filter(a => a.severity === 'low').length
    },
    skipped: alertsSkipped,
    total_cost_increase: alertsCreated.reduce((sum, a) => sum + (a.cost_impact || 0), 0)
  };

  console.log(`🔔 [ALERT-PUSH] Summary:`, {
    created: summary.total_alerts_created,
    skipped_free: alertsSkipped.free,
    skipped_duplicate: alertsSkipped.duplicate,
    skipped_error: alertsSkipped.error,
    total_cost_increase: formatCurrency(summary.total_cost_increase)
  });

  return summary;
}

/**
 * Check if user is on a paid subscription tier
 */
function isPaidUser(subscriptionTier) {
  const paidTiers = ['starter', 'professional', 'enterprise', 'trial'];
  return paidTiers.includes(subscriptionTier?.toLowerCase());
}

/**
 * Normalize HS code to 8-digit format for comparison
 */
function normalizeHSCode(hsCode) {
  if (!hsCode) return '';
  // Remove all non-digits and pad to 8 digits
  const digits = hsCode.replace(/\D/g, '');
  return digits.substring(0, 8).padEnd(8, '0');
}

/**
 * Format policy type for display
 */
function formatPolicyName(policyType) {
  return {
    'section_301': 'Section 301',
    'section_232': 'Section 232',
    'mfn_rate': 'MFN',
    'column_2': 'Column 2'
  }[policyType] || policyType;
}

/**
 * Format currency for display
 */
function formatCurrency(amount) {
  if (!amount) return '$0';
  return `$${Math.round(amount).toLocaleString()}`;
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId, userId) {
  const { error } = await supabase
    .from('dashboard_notifications')
    .update({ is_read: true })
    .eq('id', alertId)
    .eq('user_id', userId);

  if (error) {
    console.error('❌ [ALERT-PUSH] Failed to mark alert as read:', error);
    return false;
  }

  return true;
}

/**
 * Delete expired alerts (older than 90 days)
 */
export async function cleanupExpiredAlerts() {
  const { data, error } = await supabase
    .from('dashboard_notifications')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('❌ [ALERT-PUSH] Failed to cleanup expired alerts:', error);
    return 0;
  }

  console.log(`🧹 [ALERT-PUSH] Cleaned up ${data?.length || 0} expired alerts`);
  return data?.length || 0;
}
