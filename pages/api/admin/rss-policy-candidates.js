/**
 * GET /api/admin/rss-policy-candidates
 * Fetch high-score RSS items that may indicate tariff policy changes
 * Used by TariffPolicyUpdatesManager component
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
    console.log('📰 Fetching high-score RSS items for policy update candidates...');

    // Query RSS feed activities with high crisis scores (≥5)
    // These are likely to be significant policy announcements
    const { data: rssItems, error } = await supabase
      .from('rss_feed_activities')
      .select(`
        id,
        item_guid,
        title,
        link,
        description,
        content,
        pub_date,
        crisis_keywords_detected,
        crisis_score,
        feed_id,
        created_at,
        rss_feeds:feed_id (
          name,
          category
        )
      `)
      .gte('crisis_score', 5) // High-score items only (realistic threshold based on actual data)
      .order('pub_date', { ascending: false })
      .order('crisis_score', { ascending: false })
      .limit(50); // Last 50 high-score items

    if (error) {
      throw error;
    }

    // Check which items already have policy updates created
    const itemIds = rssItems.map(item => item.id);

    const { data: existingPolicies } = await supabase
      .from('tariff_policy_updates')
      .select('source_rss_item_id')
      .in('source_rss_item_id', itemIds);

    const existingItemIds = new Set(
      existingPolicies?.map(p => p.source_rss_item_id).filter(Boolean) || []
    );

    // Format items for frontend with feed_name included
    const formattedItems = rssItems
      .filter(item => !existingItemIds.has(item.id)) // Exclude items with existing policies
      .map(item => ({
        id: item.id,
        title: item.title,
        link: item.link,
        description: item.description,
        content: item.content,
        pub_date: item.pub_date,
        crisis_keywords_detected: item.crisis_keywords_detected,
        crisis_score: item.crisis_score,
        feed_name: item.rss_feeds?.name || 'Unknown Feed',
        feed_category: item.rss_feeds?.category || 'unknown',
        created_at: item.created_at
      }));

    console.log(`✅ Found ${formattedItems.length} RSS policy candidates (${rssItems.length} total high-score items, ${existingItemIds.size} already have policies)`);

    return res.status(200).json({
      success: true,
      items: formattedItems,
      total_high_score: rssItems.length,
      already_processed: existingItemIds.size,
      remaining_candidates: formattedItems.length
    });
  } catch (error) {
    console.error('❌ Error fetching RSS policy candidates:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch RSS policy candidates',
      error: error.message
    });
  }
}
