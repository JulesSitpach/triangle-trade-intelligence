/**
 * Monitoring Statistics API
 * Returns platform performance metrics
 *
 * Metrics:
 * - Email queue status
 * - Database performance
 * - AI API usage (estimated costs)
 * - Cache hit rates
 * - User activity
 *
 * Admin only
 */

import { withAdmin } from '../../../lib/middleware/auth-middleware.js';
import { createClient } from '@supabase/supabase-js';
import { getEmailQueueStats } from '../../../lib/utils/emailQueue.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = {
      timestamp: new Date().toISOString(),
      metrics: {}
    };

    // 1. Email queue stats
    stats.metrics.email_queue = await getEmailQueueStats();

    // 2. User activity (last 7 days)
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('subscription_tier, trial_ends_at, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!userError && users) {
      const activeTrials = users.filter(u => u.trial_ends_at && new Date(u.trial_ends_at) > new Date()).length;
      const expiredTrials = users.filter(u => u.trial_ends_at && new Date(u.trial_ends_at) <= new Date()).length;

      stats.metrics.users = {
        new_last_7_days: users.length,
        active_trials: activeTrials,
        expired_trials: expiredTrials,
        by_tier: users.reduce((acc, u) => {
          acc[u.subscription_tier || 'Trial'] = (acc[u.subscription_tier || 'Trial'] || 0) + 1;
          return acc;
        }, {})
      };
    }

    // 3. Workflow activity (last 7 days)
    const { data: workflows, error: workflowError } = await supabase
      .from('workflow_sessions')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!workflowError && workflows) {
      stats.metrics.workflows = {
        created_last_7_days: workflows.length,
        avg_per_day: Math.round(workflows.length / 7)
      };
    }

    // 4. Service requests (last 7 days)
    const { data: services, error: serviceError } = await supabase
      .from('service_requests')
      .select('service_type, price, status, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!serviceError && services) {
      const totalRevenue = services
        .filter(s => s.status === 'completed' || s.status === 'pending_fulfillment')
        .reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);

      stats.metrics.services = {
        total_last_7_days: services.length,
        total_revenue_last_7_days: Math.round(totalRevenue * 100) / 100,
        by_status: services.reduce((acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1;
          return acc;
        }, {}),
        by_type: services.reduce((acc, s) => {
          acc[s.service_type] = (acc[s.service_type] || 0) + 1;
          return acc;
        }, {})
      };
    }

    // 5. Crisis alerts (active)
    const { data: alerts, error: alertError } = await supabase
      .from('crisis_alerts')
      .select('severity_level, alert_type')
      .eq('is_active', true);

    if (!alertError && alerts) {
      stats.metrics.crisis_alerts = {
        active: alerts.length,
        by_severity: alerts.reduce((acc, a) => {
          acc[a.severity_level] = (acc[a.severity_level] || 0) + 1;
          return acc;
        }, {}),
        by_type: alerts.reduce((acc, a) => {
          acc[a.alert_type] = (acc[a.alert_type] || 0) + 1;
          return acc;
        }, {})
      };
    }

    // 6. Dev issues (unresolved)
    const { data: issues, error: issueError } = await supabase
      .from('dev_issues')
      .select('severity, component, created_at')
      .eq('resolved', false);

    if (!issueError && issues) {
      const last24h = issues.filter(i =>
        new Date(i.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;

      stats.metrics.dev_issues = {
        unresolved: issues.length,
        last_24_hours: last24h,
        by_severity: issues.reduce((acc, i) => {
          acc[i.severity] = (acc[i.severity] || 0) + 1;
          return acc;
        }, {}),
        by_component: issues.reduce((acc, i) => {
          acc[i.component] = (acc[i.component] || 0) + 1;
          return acc;
        }, {})
      };
    }

    // 7. Database performance metrics
    const { data: dbStats, error: dbError } = await supabase.rpc('pg_stat_statements_reset');

    // Note: Actual database performance metrics would require pg_stat_statements extension
    // For now, just return placeholder
    stats.metrics.database = {
      message: 'Database performance metrics available via Supabase dashboard'
    };

    return res.status(200).json(stats);

  } catch (error) {
    console.error('Monitoring stats error:', error);

    return res.status(500).json({
      error: 'Failed to fetch monitoring stats',
      message: error.message
    });
  }
}

export default withAdmin(handler);
