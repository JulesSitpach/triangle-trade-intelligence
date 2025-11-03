/**
 * Repair Script: Fix 1,905 Empty RSS Items
 *
 * Problem: 81% of rss_feed_activities have NULL content/description
 * Root Cause: Parser silently failed to extract content from RSS2JSON proxy
 *
 * Solution: Re-fetch and re-parse all items with empty content
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class RSSRepairEngine {
  constructor() {
    this.repaired = 0;
    this.failed = 0;
    this.skipped = 0;
  }

  /**
   * Main repair function
   */
  async repairAllEmptyItems() {
    console.log('🔧 Starting RSS Content Repair...');
    console.log('   Querying database for items with NULL content...\n');

    // Query all items where BOTH description AND link are NULL
    const { data: emptyItems, error: queryError } = await supabase
      .from('rss_feed_activities')
      .select(`
        id,
        feed_id,
        item_guid,
        title,
        link,
        description,
        content,
        pub_date,
        rss_feeds (
          name,
          url
        )
      `)
      .or('description.is.null,link.is.null')
      .order('pub_date', { ascending: false });

    if (queryError) {
      console.error('❌ Database query failed:', queryError.message);
      return;
    }

    console.log(`📊 Found ${emptyItems.length} items with missing content\n`);

    // Group by feed for efficient batch processing
    const itemsByFeed = this.groupByFeed(emptyItems);

    console.log(`📂 Grouped into ${Object.keys(itemsByFeed).length} feeds\n`);

    // Process each feed
    for (const [feedUrl, items] of Object.entries(itemsByFeed)) {
      await this.repairFeedItems(feedUrl, items);
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 REPAIR SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Repaired: ${this.repaired} items`);
    console.log(`❌ Failed: ${this.failed} items`);
    console.log(`⏭️  Skipped: ${this.skipped} items (link still missing)`);
    console.log(`📈 Success Rate: ${((this.repaired / emptyItems.length) * 100).toFixed(1)}%`);
  }

  /**
   * Group items by feed URL for batch processing
   */
  groupByFeed(items) {
    const grouped = {};

    for (const item of items) {
      const feedUrl = item.rss_feeds?.url;
      if (!feedUrl) continue;

      if (!grouped[feedUrl]) {
        grouped[feedUrl] = [];
      }

      grouped[feedUrl].push(item);
    }

    return grouped;
  }

  /**
   * Repair all items from a single feed
   */
  async repairFeedItems(feedUrl, items) {
    const feedName = items[0]?.rss_feeds?.name || 'Unknown Feed';

    console.log(`\n📰 Processing: ${feedName} (${items.length} items)`);
    console.log(`   Feed URL: ${feedUrl}`);

    try {
      // Fetch fresh RSS data
      const freshData = await this.fetchFeedViaProxy(feedUrl, feedName);

      if (!freshData.success) {
        console.error(`   ❌ Failed to fetch feed: ${freshData.error}`);
        this.failed += items.length;
        return;
      }

      console.log(`   ✅ Fetched ${freshData.items.length} fresh items`);

      // Match and repair each item
      for (const dbItem of items) {
        await this.repairSingleItem(dbItem, freshData.items);
      }

    } catch (error) {
      console.error(`   ❌ Error processing feed: ${error.message}`);
      this.failed += items.length;
    }
  }

  /**
   * Fetch RSS feed via proxy
   */
  async fetchFeedViaProxy(feedUrl, feedName) {
    try {
      const response = await fetch('http://localhost:3001/api/rss-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedUrl, feedName })
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`
        };
      }

      const data = await response.json();
      return data;

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Repair a single database item by matching with fresh RSS data
   */
  async repairSingleItem(dbItem, freshItems) {
    // Try to match by title first (most reliable)
    let matchedItem = freshItems.find(fresh =>
      fresh.title === dbItem.title
    );

    // If no match by title, try by GUID
    if (!matchedItem && dbItem.item_guid) {
      matchedItem = freshItems.find(fresh =>
        fresh.guid === dbItem.item_guid
      );
    }

    // If still no match, skip
    if (!matchedItem) {
      console.log(`   ⏭️  No match found for: ${dbItem.title?.substring(0, 50)}`);
      this.skipped++;
      return;
    }

    // Extract content
    const content = this.extractContent(matchedItem);

    // Validate content exists
    if (!content.description && !content.fullContent && !matchedItem.link) {
      console.log(`   ⚠️  Matched but still no content: ${dbItem.title?.substring(0, 50)}`);
      this.failed++;
      return;
    }

    // Update database
    const { error: updateError } = await supabase
      .from('rss_feed_activities')
      .update({
        description: content.description || null,
        content: content.fullContent || null,
        link: matchedItem.link || dbItem.link, // Update link if available
        status: (content.description || content.fullContent) ? 'success' : 'incomplete'
      })
      .eq('id', dbItem.id);

    if (updateError) {
      console.error(`   ❌ Update failed for item ${dbItem.id}:`, updateError.message);
      this.failed++;
    } else {
      console.log(`   ✅ Repaired: ${dbItem.title?.substring(0, 50)}`);
      this.repaired++;
    }
  }

  /**
   * Extract content from RSS item (same logic as RSS polling engine)
   */
  extractContent(item) {
    const description = item.description || item.summary || item.content || '';
    const fullContent = item.content || item.description || item.summary || '';

    // Clean HTML tags
    const cleanDescription = description.replace(/<[^>]*>/g, '').trim();
    const cleanContent = fullContent.replace(/<[^>]*>/g, '').trim();

    return {
      description: cleanDescription.substring(0, 500),
      fullContent: cleanContent.substring(0, 2000)
    };
  }
}

// Run repair
const repair = new RSSRepairEngine();
repair.repairAllEmptyItems()
  .then(() => {
    console.log('\n✅ Repair complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Repair failed:', error);
    process.exit(1);
  });
