/**
 * RSS Monitoring Diagnostic API
 * Check if RSS feeds are being polled and alerts are being created
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
    // Check RSS feeds status
    const { data: feeds, error: feedsError } = await supabase
      .from('rss_feeds')
      .select('*')
      .order('last_checked_at', { ascending: false });

    // Check RSS items fetched
    const { data: items, error: itemsError } = await supabase
      .from('rss_feed_items')
      .select('feed_id, published_at, title')
      .order('published_at', { ascending: false })
      .limit(10);

    // Check crisis alerts created
    const { data: crisisAlerts, error: alertsError } = await supabase
      .from('crisis_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Count items per feed
    const { data: itemCounts } = await supabase
      .from('rss_feed_items')
      .select('feed_id');

    const countsMap = {};
    (itemCounts || []).forEach(item => {
      countsMap[item.feed_id] = (countsMap[item.feed_id] || 0) + 1;
    });

    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      feeds: {
        total: feeds?.length || 0,
        active: feeds?.filter(f => f.is_active).length || 0,
        last_checked: feeds?.[0]?.last_checked_at || 'Never',
        details: feeds?.map(f => ({
          name: f.name,
          category: f.category,
          is_active: f.is_active,
          last_checked_at: f.last_checked_at,
          total_items_processed: f.total_items_processed,
          items_in_db: countsMap[f.id] || 0
        }))
      },
      items: {
        total_fetched: itemCounts?.length || 0,
        recent_items: items?.map(i => ({
          title: i.title,
          published_at: i.published_at
        })) || []
      },
      crisis_alerts: {
        total: crisisAlerts?.length || 0,
        recent: crisisAlerts?.map(a => ({
          title: a.title,
          severity: a.severity,
          source_type: a.source_type,
          created_at: a.created_at
        })) || []
      },
      errors: {
        feeds: feedsError?.message || null,
        items: itemsError?.message || null,
        alerts: alertsError?.message || null
      }
    });

  } catch (error) {
    console.error('RSS diagnostic error:', error);
    return res.status(500).json({
      error: 'Diagnostic failed',
      details: error.message
    });
  }
}
