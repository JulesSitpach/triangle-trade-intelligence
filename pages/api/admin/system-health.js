/**
 * Admin API - System Health Monitoring
 * Operational dashboard showing platform health metrics
 *
 * CRITICAL TIER (always show):
 * - Database status
 * - AI services status (OpenRouter + Anthropic)
 * - API response time
 * - Error rate
 *
 * OPERATIONAL ALERTS (actionable):
 * - OpenRouter API quota/rate limits
 * - Certificate generation failures
 * - Authentication failures
 * - Workflow session timeouts
 * - Recent errors by endpoint (top 5)
 * - Failed AI classifications
 * - Tariff data freshness
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

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // === DATABASE STATUS ===
    let databaseHealthy = false;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      databaseHealthy = !error;
    } catch (err) {
      databaseHealthy = false;
    }

    // === AI SERVICES STATUS ===
    // Check for recent successful AI calls (last hour)
    const { data: recentCompletions } = await supabase
      .from('workflow_completions')
      .select('completed_at')
      .gte('completed_at', oneHourAgo.toISOString())
      .limit(1);

    const aiHealthy = (recentCompletions || []).length > 0;

    // === API RESPONSE TIME ===
    // Calculate average completion time from recent workflows
    const { data: recentWorkflows } = await supabase
      .from('workflow_completions')
      .select('completion_time_seconds')
      .gte('completed_at', oneDayAgo.toISOString())
      .not('completion_time_seconds', 'is', null);

    const avgResponseTime = recentWorkflows && recentWorkflows.length > 0
      ? Math.round((recentWorkflows.reduce((sum, w) => sum + (w.completion_time_seconds || 0), 0) / recentWorkflows.length) * 1000)
      : 0;

    // === ERROR RATE ===
    const { count: totalRequests } = await supabase
      .from('workflow_completions')
      .select('*', { count: 'exact', head: true })
      .gte('completed_at', oneDayAgo.toISOString());

    const { count: failedRequests } = await supabase
      .from('dev_issues')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo.toISOString())
      .eq('resolved', false);

    const errorRate = totalRequests > 0
      ? ((failedRequests / totalRequests) * 100)
      : 0;

    // === CERTIFICATE GENERATION FAILURES ===
    const { data: certificateIssues } = await supabase
      .from('dev_issues')
      .select('*')
      .eq('component', 'certificate_generation')
      .gte('created_at', oneHourAgo.toISOString())
      .eq('resolved', false);

    const certificateFailuresLastHour = (certificateIssues || []).length;

    // === AUTHENTICATION FAILURES ===
    const { data: authIssues } = await supabase
      .from('dev_issues')
      .select('*')
      .eq('component', 'authentication')
      .gte('created_at', oneDayAgo.toISOString())
      .eq('resolved', false);

    const authFailuresLast24h = (authIssues || []).length;

    // === WORKFLOW SESSION TIMEOUTS ===
    const { count: timedOutSessions } = await supabase
      .from('workflow_sessions')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', new Date().toISOString())
      .is('completed_at', null);

    // === RECENT ERRORS BY ENDPOINT (Top 5) ===
    const { data: recentErrors } = await supabase
      .from('dev_issues')
      .select('component, message, severity, occurrence_count, created_at')
      .gte('created_at', oneDayAgo.toISOString())
      .eq('resolved', false)
      .order('occurrence_count', { ascending: false })
      .limit(5);

    const topErrors = (recentErrors || []).map(e => ({
      endpoint: e.component,
      error: e.message,
      severity: e.severity,
      count: e.occurrence_count,
      last_seen: e.created_at
    }));

    // === FAILED AI CLASSIFICATIONS ===
    const { data: classificationFailures } = await supabase
      .from('dev_issues')
      .select('*')
      .or('component.eq.classification_agent,component.eq.tariff_lookup')
      .gte('created_at', oneDayAgo.toISOString())
      .eq('resolved', false);

    const failedClassificationsLast24h = (classificationFailures || []).length;

    // === TARIFF DATA FRESHNESS ===
    const { data: recentTariffCache } = await supabase
      .from('tariff_rates_cache')
      .select('cached_at')
      .order('cached_at', { ascending: false })
      .limit(1);

    const lastTariffUpdate = recentTariffCache && recentTariffCache.length > 0
      ? new Date(recentTariffCache[0].cached_at)
      : null;

    const tariffDataAgeHours = lastTariffUpdate
      ? Math.round((new Date() - lastTariffUpdate) / 1000 / 60 / 60)
      : null;

    const tariffDataStale = tariffDataAgeHours && tariffDataAgeHours > 168; // 1 week

    // === SUPABASE CONNECTION POOL ===
    // Approximate active connections by recent workflow sessions
    const { count: activeSessions } = await supabase
      .from('workflow_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo.toISOString());

    // === SLOWEST ENDPOINTS ===
    const { data: slowWorkflows } = await supabase
      .from('workflow_completions')
      .select('completion_time_seconds, hs_code')
      .gte('completed_at', oneDayAgo.toISOString())
      .not('completion_time_seconds', 'is', null)
      .order('completion_time_seconds', { ascending: false })
      .limit(5);

    const slowestEndpoints = (slowWorkflows || []).map(w => ({
      type: 'USMCA Analysis',
      response_time_seconds: w.completion_time_seconds,
      hs_code: w.hs_code
    }));

    // === CACHE HIT RATE ===
    // Calculate how many tariff lookups hit cache vs AI
    const { count: totalLookups } = await supabase
      .from('tariff_rates_cache')
      .select('*', { count: 'exact', head: true })
      .gte('cached_at', oneDayAgo.toISOString());

    const { count: aiLookups } = await supabase
      .from('tariff_rates_cache')
      .select('*', { count: 'exact', head: true })
      .gte('cached_at', oneDayAgo.toISOString())
      .eq('rate_source', 'ai_fallback');

    const cacheHitRate = totalLookups > 0
      ? (((totalLookups - aiLookups) / totalLookups) * 100)
      : 0;

    // === OPENROUTER API QUOTA (ESTIMATED) ===
    // Estimate quota usage by counting AI calls in last 24h
    // OpenRouter typical quota: 1000 requests/day for free tier
    const estimatedQuotaUsage = aiLookups || 0;
    const estimatedQuotaPercent = (estimatedQuotaUsage / 1000) * 100;
    const quotaHealthy = estimatedQuotaPercent < 80;

    return sendSuccess(res, {
      health: {
        // CRITICAL TIER
        database_healthy: databaseHealthy,
        ai_healthy: aiHealthy,
        avg_response_time: avgResponseTime,
        error_rate: errorRate,

        // OPERATIONAL ALERTS
        openrouter_quota: {
          estimated_usage: estimatedQuotaUsage,
          estimated_percent: Math.round(estimatedQuotaPercent),
          healthy: quotaHealthy,
          warning: estimatedQuotaPercent >= 80 ? 'Approaching quota limit' : null
        },
        certificate_generation: {
          failures_last_hour: certificateFailuresLastHour,
          healthy: certificateFailuresLastHour === 0
        },
        authentication: {
          failures_last_24h: authFailuresLast24h,
          healthy: authFailuresLast24h < 5
        },
        workflow_sessions: {
          timed_out: timedOutSessions || 0,
          active_last_hour: activeSessions || 0
        },
        top_errors: topErrors,
        ai_classifications: {
          failed_last_24h: failedClassificationsLast24h,
          healthy: failedClassificationsLast24h < 10
        },
        tariff_data_freshness: {
          last_update: lastTariffUpdate,
          age_hours: tariffDataAgeHours,
          stale: tariffDataStale,
          warning: tariffDataStale ? 'Tariff data is over 1 week old' : null
        },
        slowest_endpoints: slowestEndpoints,
        cache_performance: {
          hit_rate: Math.round(cacheHitRate),
          total_lookups: totalLookups,
          ai_lookups: aiLookups,
          cost_indicator: aiLookups > 100 ? 'HIGH' : aiLookups > 50 ? 'MEDIUM' : 'LOW'
        }
      }
    }, 'System health retrieved successfully');
  }
});
