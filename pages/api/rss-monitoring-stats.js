/**
 * RSS Monitoring Stats API
 * Returns REAL monitoring statistics from database (no hardcoded data)
 * Queries: rss_feeds, rss_feed_activities, crisis_alerts
 */

import { protectedApiHandler } from '../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;

    try {
      // 1. Get latest RSS polling activity (last scan)
      const { data: latestActivity, error: activityError } = await supabase
        .from('rss_feed_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (activityError && activityError.code !== 'PGRST116') {
        // PGRST116 = no rows found (acceptable for new installations)
        throw activityError;
      }

      // 2. Get active RSS feeds
      const { data: activeFeeds, error: feedsError } = await supabase
        .from('rss_feeds')
        .select('name, category, last_check_at, last_success_at')
        .eq('is_active', true);

      if (feedsError) throw feedsError;

      // 3. Get this month's activity stats
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyActivity, error: monthlyError } = await supabase
        .from('rss_feed_activities')
        .select('status, response_time_ms, items_found, new_items')
        .gte('created_at', firstDayOfMonth.toISOString());

      if (monthlyError) throw monthlyError;

      // Calculate monthly stats
      const totalScans = monthlyActivity?.length || 0;
      const successfulScans = monthlyActivity?.filter(a => a.status === 'success').length || 0;
      const totalItemsChecked = monthlyActivity?.reduce((sum, a) => sum + (a.items_found || 0), 0) || 0;
      const totalNewItems = monthlyActivity?.reduce((sum, a) => sum + (a.new_items || 0), 0) || 0;
      const avgResponseTime = successfulScans > 0
        ? Math.round(monthlyActivity.filter(a => a.status === 'success').reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / successfulScans)
        : 0;

      // 4. Get crisis alerts generated this month
      const { data: monthlyAlerts, error: alertsError } = await supabase
        .from('crisis_alerts')
        .select('id, title, severity, created_at')
        .gte('created_at', firstDayOfMonth.toISOString())
        .eq('is_active', true);

      if (alertsError) throw alertsError;

      // 5. Get user's HS codes count (from their workflows)
      const { data: userWorkflows, error: workflowError } = await supabase
        .from('workflow_sessions')
        .select('component_origins')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const htsCodesMonitored = userWorkflows?.component_origins?.length || 0;

      // 6. Build response with REAL data
      const response = {
        lastScan: latestActivity?.created_at || null,
        scanDurationMs: latestActivity?.response_time_ms || null,
        htsCodesMonitored: htsCodesMonitored,
        dataSourcesChecked: (activeFeeds || []).map(f => f.name),
        alertsGenerated: monthlyAlerts?.length || 0,
        thisMonth: {
          totalScans: totalScans,
          successfulScans: successfulScans,
          alertsSent: monthlyAlerts?.length || 0,
          policiesChecked: totalItemsChecked,
          newItemsDetected: totalNewItems,
          avgResponseTimeMs: avgResponseTime
        },
        activeSources: activeFeeds?.map(f => ({
          name: f.name,
          category: f.category,
          lastCheck: f.last_check_at,
          lastSuccess: f.last_success_at
        })) || []
      };

      return res.status(200).json(response);

    } catch (error) {
      console.error('❌ RSS monitoring stats failed:', error);
      return res.status(500).json({
        error: 'Failed to fetch RSS monitoring statistics',
        details: error.message
      });
    }
  }
});
