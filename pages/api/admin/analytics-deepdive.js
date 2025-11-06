/**
 * Admin API - Deep Dive Analytics
 * Detailed product/marketing insights for optimization
 *
 * Metrics:
 * - Feature adoption rates (what's being used)
 * - Cohort retention (product stickiness)
 * - Geographic distribution (user sources)
 * - Policy trigger correlation (news → usage spikes)
 * - Conversion funnel breakdown (where we lose users)
 */

import { protectedApiHandler, sendSuccess } from '../../../lib/api/apiHandler.js';
import { ApiError } from '../../../lib/api/errorHandler.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  GET: async (req, res) => {
    // Check admin access
    if (!req.user?.is_admin && req.user?.role !== 'admin') {
      throw new ApiError('Admin access required', 403);
    }

    // === FEATURE ADOPTION RATES ===
    // Check both top-level fields AND workflow_data (data structure varies)
    const { data: completions } = await supabase
      .from('workflow_completions')
      .select('workflow_data, certificate_generated, qualification_status, savings_amount, hs_code');

    const featureUsage = {
      'Certificate Generation': 0,
      'USMCA Analysis': 0,
      'Component Classification': 0,
      'Tariff Calculation': 0,
      'Policy Alerts': 0
    };

    const totalWorkflows = completions?.length || 0;

    (completions || []).forEach(c => {
      const data = c.workflow_data || {};

      // Certificate Generation - check both top-level and nested
      if (c.certificate_generated === true || data.certificate_generated === true) {
        featureUsage['Certificate Generation']++;
      }

      // USMCA Analysis - check qualification status
      if (c.qualification_status || data.qualification_status || data.usmca?.qualified) {
        featureUsage['USMCA Analysis']++;
      }

      // Component Classification - check for HS code or component data
      if (c.hs_code || data.components?.length > 0 || data.component_origins?.length > 0) {
        featureUsage['Component Classification']++;
      }

      // Tariff Calculation - check for savings data
      if (c.savings_amount || data.savings?.annual_savings || data.savings_amount) {
        featureUsage['Tariff Calculation']++;
      }

      // Policy Alerts - assume all workflows get alerts
      featureUsage['Policy Alerts']++;
    });

    const featureAdoption = {};
    Object.entries(featureUsage).forEach(([feature, count]) => {
      featureAdoption[feature] = totalWorkflows > 0
        ? ((count / totalWorkflows) * 100).toFixed(1)
        : 0;
    });

    // === CERTIFICATE ADOPTION DEEP DIVE ===
    // Analysis → Certificate → Payment funnel with time deltas and tier split
    const { data: completionsWithTiming } = await supabase
      .from('workflow_completions')
      .select('id, user_id, completed_at, certificate_generated, created_at')
      .order('completed_at', { ascending: false });

    // Get user subscription tiers
    const { data: usersByTier } = await supabase
      .from('user_profiles')
      .select('id, subscription_tier');

    const userTierMap = {};
    (usersByTier || []).forEach(u => {
      userTierMap[u.id] = u.subscription_tier;
    });

    // Calculate certificate adoption metrics
    let totalAnalyses = 0;
    let certificatesGenerated = 0;
    let certificatesByTier = {
      Trial: { analyses: 0, certificates: 0 },
      Starter: { analyses: 0, certificates: 0 },
      Professional: { analyses: 0, certificates: 0 },
      Premium: { analyses: 0, certificates: 0 }
    };
    let timeDeltasMinutes = [];

    (completionsWithTiming || []).forEach(c => {
      totalAnalyses++;
      const userTier = userTierMap[c.user_id] || 'Trial';

      certificatesByTier[userTier].analyses++;

      if (c.certificate_generated === true) {
        certificatesGenerated++;
        certificatesByTier[userTier].certificates++;

        // Calculate time delta between workflow completion and certificate generation
        if (c.completed_at && c.created_at) {
          const completedTime = new Date(c.completed_at);
          const createdTime = new Date(c.created_at);
          const deltaMinutes = Math.round((completedTime - createdTime) / 1000 / 60);
          if (deltaMinutes >= 0 && deltaMinutes < 10080) { // Filter out invalid deltas (>1 week)
            timeDeltasMinutes.push(deltaMinutes);
          }
        }
      }
    });

    // Calculate average time to certificate
    const avgTimeToCertificate = timeDeltasMinutes.length > 0
      ? Math.round(timeDeltasMinutes.reduce((sum, t) => sum + t, 0) / timeDeltasMinutes.length)
      : null;

    // Calculate median time to certificate
    const medianTimeToCertificate = timeDeltasMinutes.length > 0
      ? timeDeltasMinutes.sort((a, b) => a - b)[Math.floor(timeDeltasMinutes.length / 2)]
      : null;

    // Calculate conversion rates by tier
    const tierConversionRates = {};
    Object.entries(certificatesByTier).forEach(([tier, stats]) => {
      tierConversionRates[tier] = {
        analyses: stats.analyses,
        certificates: stats.certificates,
        conversion_rate: stats.analyses > 0
          ? ((stats.certificates / stats.analyses) * 100).toFixed(1)
          : '0.0'
      };
    });

    // Overall certificate adoption rate
    const certificateAdoptionRate = totalAnalyses > 0
      ? ((certificatesGenerated / totalAnalyses) * 100).toFixed(1)
      : 0;

    const certificateAdoptionAnalysis = {
      overall_rate: parseFloat(certificateAdoptionRate),
      total_analyses: totalAnalyses,
      certificates_generated: certificatesGenerated,
      certificates_not_generated: totalAnalyses - certificatesGenerated,
      avg_time_to_certificate_minutes: avgTimeToCertificate,
      median_time_to_certificate_minutes: medianTimeToCertificate,
      conversion_by_tier: tierConversionRates,
      insight: certificateAdoptionRate < 50
        ? 'CRITICAL: Less than 50% of analyses result in certificate generation. This is a major drop-off point.'
        : 'Certificate adoption is healthy.'
    };

    // === COHORT RETENTION ===
    // Get users by signup month and track their activity
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, created_at')
      .order('created_at', { ascending: true });

    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    // Group users into cohorts by signup month
    const cohorts = {};
    (users || []).forEach(user => {
      const signupDate = new Date(user.created_at);
      if (signupDate >= threeMonthsAgo) {
        const cohortMonth = `${signupDate.getFullYear()}-${String(signupDate.getMonth() + 1).padStart(2, '0')}`;
        if (!cohorts[cohortMonth]) {
          cohorts[cohortMonth] = [];
        }
        cohorts[cohortMonth].push(user.id);
      }
    });

    // Calculate retention for each cohort (simplified - % who completed workflow in each subsequent week)
    const cohortRetention = {
      weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      cohorts: []
    };

    for (const [month, userIds] of Object.entries(cohorts).slice(-3)) {
      const cohortStartDate = new Date(month + '-01');
      const retentionRates = [];

      for (let week = 0; week < 4; week++) {
        const weekStart = new Date(cohortStartDate);
        weekStart.setDate(weekStart.getDate() + (week * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const { data: activeUsers } = await supabase
          .from('workflow_completions')
          .select('user_id')
          .in('user_id', userIds)
          .gte('completed_at', weekStart.toISOString())
          .lt('completed_at', weekEnd.toISOString());

        const activeCount = new Set((activeUsers || []).map(u => u.user_id)).size;
        const retentionRate = ((activeCount / userIds.length) * 100).toFixed(1);
        retentionRates.push(parseFloat(retentionRate));
      }

      cohortRetention.cohorts.push({
        name: month,
        retention_rates: retentionRates
      });
    }

    // === POLICY TRIGGER CORRELATION ===
    // Get crisis alerts and check if usage spiked after them
    const { data: alerts } = await supabase
      .from('crisis_alerts')
      .select('title, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const policyTriggers = await Promise.all((alerts || []).map(async (alert) => {
      const alertDate = new Date(alert.created_at);
      const beforeDate = new Date(alertDate);
      beforeDate.setDate(beforeDate.getDate() - 7);
      const afterDate = new Date(alertDate);
      afterDate.setDate(afterDate.getDate() + 7);

      // Count workflows before and after alert
      const { count: beforeCount } = await supabase
        .from('workflow_completions')
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', beforeDate.toISOString())
        .lt('completed_at', alertDate.toISOString());

      const { count: afterCount } = await supabase
        .from('workflow_completions')
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', alertDate.toISOString())
        .lt('completed_at', afterDate.toISOString());

      // Count new signups in week after alert
      const { count: newSignups } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', alertDate.toISOString())
        .lt('created_at', afterDate.toISOString());

      const spikePercent = beforeCount > 0
        ? (((afterCount - beforeCount) / beforeCount) * 100).toFixed(0)
        : 0;

      return {
        event: alert.title,
        date: alertDate.toISOString().split('T')[0],
        spike_percent: parseInt(spikePercent),
        new_signups: newSignups || 0
      };
    }));

    // === CONVERSION FUNNEL BREAKDOWN ===
    // Show ALL user activity (not just new signups in last 30 days)
    const { data: allUsers } = await supabase
      .from('user_profiles')
      .select('id, subscription_tier, created_at');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Stage 1: All active users (completed workflow in last 30 days)
    const { data: recentCompletions } = await supabase
      .from('workflow_completions')
      .select('user_id, certificate_generated')
      .gte('completed_at', thirtyDaysAgo.toISOString());

    const activeUserIds = [...new Set((recentCompletions || []).map(c => c.user_id))];
    const activeUserCount = activeUserIds.length;

    // Stage 2: Active users who are on Trial tier
    const trialUsers = (allUsers || []).filter(u =>
      activeUserIds.includes(u.id) && u.subscription_tier === 'Trial'
    );
    const trialUserCount = trialUsers.length;

    // Stage 3: Active users who generated certificate (last 30 days)
    const certificateUserIds = new Set(
      (recentCompletions || [])
        .filter(c => c.certificate_generated === true)
        .map(c => c.user_id)
    );
    const certificateCount = certificateUserIds.size;

    // Stage 4: Active users who are on paid tiers
    const paidUsers = (allUsers || []).filter(u =>
      activeUserIds.includes(u.id) &&
      ['Starter', 'Professional', 'Premium'].includes(u.subscription_tier)
    );
    const paidCount = paidUsers.length;

    const funnelStages = [
      { name: 'Active Users (30d)', count: activeUserCount, percent: 100 },
      {
        name: 'Trial Users',
        count: trialUserCount,
        percent: activeUserCount > 0 ? (trialUserCount / activeUserCount) * 100 : 0
      },
      {
        name: 'Generated Certificate',
        count: certificateCount,
        percent: activeUserCount > 0 ? (certificateCount / activeUserCount) * 100 : 0
      },
      {
        name: 'Paid Subscribers',
        count: paidCount,
        percent: activeUserCount > 0 ? (paidCount / activeUserCount) * 100 : 0
      }
    ];

    return sendSuccess(res, {
      analytics: {
        feature_adoption: featureAdoption,
        certificate_adoption_analysis: certificateAdoptionAnalysis,
        cohort_retention: cohortRetention,
        policy_triggers: policyTriggers,
        funnel_stages: funnelStages
      }
    }, 'Deep dive analytics retrieved successfully');
  }
});
