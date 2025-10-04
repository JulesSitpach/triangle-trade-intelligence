/**
 * RSS Polling Engine for Crisis Monitoring
 * Fetches RSS feeds, parses content, detects crisis keywords, and generates alerts
 * Core component for Triangle Trade Intelligence crisis response positioning
 */

const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');

class RSSPollingEngine {
  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      customFields: {
        item: ['pubDate', 'content', 'summary', 'description']
      }
    });
    
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    this.isPolling = false;
    this.pollInterval = null;
  }

  /**
   * Start continuous RSS polling for all active feeds
   */
  async startPolling(intervalMinutes = 5) {
    if (this.isPolling) {
      console.log('⚠️ RSS polling already running');
      return;
    }

    console.log('🚀 Starting RSS Crisis Monitoring Engine...');
    this.isPolling = true;

    // Initial poll
    await this.pollAllFeeds();

    // Set up continuous polling
    this.pollInterval = setInterval(async () => {
      await this.pollAllFeeds();
    }, intervalMinutes * 60 * 1000);

    console.log(`✅ RSS polling started (every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop RSS polling
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    console.log('🛑 RSS polling stopped');
  }

  /**
   * Poll all active RSS feeds
   */
  async pollAllFeeds() {
    try {
      console.log('📡 Polling RSS feeds for crisis intelligence...');

      // Get all active feeds
      const { data: feeds, error } = await this.supabase
        .from('rss_feeds')
        .select('*')
        .eq('is_active', true)
        .order('priority_level', { ascending: true });

      if (error) {
        console.error('❌ Error fetching feeds:', error.message);
        return;
      }

      if (!feeds || feeds.length === 0) {
        console.log('⚠️ No active RSS feeds found');
        return;
      }

      console.log(`🔍 Found ${feeds.length} active feeds to poll`);

      // Poll each feed
      const results = await Promise.allSettled(
        feeds.map(feed => this.pollSingleFeed(feed))
      );

      // Summary
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`📊 Poll complete: ${successful} successful, ${failed} failed`);

      return { successful, failed, total: feeds.length };

    } catch (error) {
      console.error('❌ Error in pollAllFeeds:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Poll a single RSS feed
   */
  async pollSingleFeed(feed) {
    const startTime = Date.now();
    
    try {
      console.log(`📰 Polling: ${feed.name} (${feed.category})`);

      // Fetch RSS content
      const rssData = await this.parser.parseURL(feed.url);
      const responseTime = Date.now() - startTime;

      // Process items
      const newItems = await this.processRSSItems(feed, rssData.items || []);

      // Record successful activity
      await this.recordFeedActivity(feed.id, 'success', {
        response_time_ms: responseTime,
        items_found: rssData.items?.length || 0,
        new_items: newItems.length,
        title: rssData.title
      });

      // Update feed last check
      await this.updateFeedStatus(feed.id, true, responseTime);

      console.log(`  ✅ ${feed.name}: ${newItems.length} new items, ${responseTime}ms`);

      return {
        feed: feed.name,
        success: true,
        newItems: newItems.length,
        responseTime
      };

    } catch (error) {
      console.log(`  ❌ ${feed.name}: ${error.message}`);

      // Record failed activity
      await this.recordFeedActivity(feed.id, 'error', {
        error_message: error.message,
        response_time_ms: Date.now() - startTime
      });

      // Update feed failure count
      await this.updateFeedStatus(feed.id, false);

      return {
        feed: feed.name,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process RSS items for crisis detection
   */
  async processRSSItems(feed, items) {
    const newItems = [];

    for (const item of items) {
      try {
        // Check if item already exists
        const { data: existing } = await this.supabase
          .from('rss_feed_activities')
          .select('id')
          .eq('feed_id', feed.id)
          .eq('item_guid', item.guid || item.link)
          .single();

        if (existing) {
          continue; // Skip existing items
        }

        // Extract and clean content
        const content = this.extractContent(item);
        
        // Detect crisis keywords
        const crisisDetection = this.detectCrisisKeywords(content, feed.keywords, feed.exclusion_keywords);

        // Store item if it has crisis relevance or is from high-priority feed
        if (crisisDetection.hasCrisisKeywords || feed.priority_level === 'high') {
          
          // Store RSS item
          const { data: newActivity } = await this.supabase
            .from('rss_feed_activities')
            .insert({
              feed_id: feed.id,
              item_guid: item.guid || item.link,
              title: item.title,
              link: item.link,
              description: content.description,
              content: content.fullContent,
              pub_date: item.pubDate ? new Date(item.pubDate) : new Date(),
              crisis_keywords_detected: crisisDetection.matchedKeywords,
              crisis_score: crisisDetection.score,
              status: 'success'
            })
            .select()
            .single();

          newItems.push(newActivity);

          // Generate crisis alert if high crisis score
          if (crisisDetection.score >= 3) {
            await this.generateCrisisAlert(feed, newActivity, crisisDetection);
          }
        }

      } catch (error) {
        console.warn(`⚠️ Error processing item from ${feed.name}:`, error.message);
      }
    }

    return newItems;
  }

  /**
   * Extract content from RSS item
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

  /**
   * Detect crisis keywords in content
   */
  detectCrisisKeywords(content, keywords, exclusionKeywords = []) {
    const text = `${content.description} ${content.fullContent}`.toLowerCase();
    const matchedKeywords = [];
    let score = 0;

    // Check for exclusion keywords first
    for (const exclude of exclusionKeywords) {
      if (text.includes(exclude.toLowerCase())) {
        return {
          hasCrisisKeywords: false,
          matchedKeywords: [],
          score: 0,
          reason: `Excluded by keyword: ${exclude}`
        };
      }
    }

    // Check for crisis keywords
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        
        // Weight different types of keywords
        if (['china', 'tariff', 'trade war', 'crisis'].includes(keyword.toLowerCase())) {
          score += 2; // High impact keywords
        } else {
          score += 1; // Standard keywords
        }
      }
    }

    return {
      hasCrisisKeywords: matchedKeywords.length > 0,
      matchedKeywords,
      score,
      reason: matchedKeywords.length > 0 ? `Matched: ${matchedKeywords.join(', ')}` : 'No keywords matched'
    };
  }

  /**
   * Generate crisis alert for high-score items
   */
  async generateCrisisAlert(feed, activity, crisisDetection) {
    try {
      // Determine severity based on keywords and feed priority
      let severity = 'medium';
      if (crisisDetection.score >= 5 || feed.priority_level === 'high') {
        severity = 'high';
      }
      if (crisisDetection.matchedKeywords.some(k => ['china', 'trade war', 'crisis'].includes(k.toLowerCase()))) {
        severity = 'critical';
      }

      // Create crisis alert
      const { data: alert } = await this.supabase
        .from('crisis_alerts')
        .insert({
          source_type: 'rss_feed',
          source_id: feed.id,
          title: `Crisis Alert: ${activity.title}`,
          description: activity.description,
          severity_level: severity,
          keywords_matched: crisisDetection.matchedKeywords,
          crisis_score: crisisDetection.score,
          source_url: activity.link,
          feed_category: feed.category,
          is_active: true,
          requires_attention: severity === 'critical',
          business_impact: this.assessBusinessImpact(crisisDetection.matchedKeywords),
          recommended_actions: this.generateRecommendedActions(crisisDetection.matchedKeywords, feed.category)
        })
        .select()
        .single();

      console.log(`🚨 CRISIS ALERT: ${severity.toUpperCase()} - ${activity.title.substring(0, 50)}...`);
      
      return alert;

    } catch (error) {
      console.error('❌ Error generating crisis alert:', error.message);
      return null;
    }
  }

  /**
   * Assess business impact of crisis keywords
   */
  assessBusinessImpact(keywords) {
    const impacts = [];
    
    if (keywords.some(k => ['china', 'chinese'].includes(k.toLowerCase()))) {
      impacts.push('China supplier risk - Mexico triangle routing opportunity');
    }
    if (keywords.some(k => ['tariff', 'tariffs'].includes(k.toLowerCase()))) {
      impacts.push('Tariff changes - USMCA qualification review needed');
    }
    if (keywords.some(k => ['mexico', 'mexican'].includes(k.toLowerCase()))) {
      impacts.push('Mexico trade opportunity - Enhanced triangle routing potential');
    }
    if (keywords.some(k => ['trade war', 'dispute'].includes(k.toLowerCase()))) {
      impacts.push('Trade conflict - Supply chain diversification critical');
    }

    return impacts.length > 0 ? impacts.join('; ') : 'General trade policy impact';
  }

  /**
   * Generate recommended actions for crisis
   */
  generateRecommendedActions(keywords, category) {
    const actions = [];

    if (keywords.some(k => ['china', 'chinese'].includes(k.toLowerCase()))) {
      actions.push('1. Review China supplier dependencies');
      actions.push('2. Activate Mexico triangle routing analysis');
      actions.push('3. Contact Triangle Trade Intelligence for crisis response');
    }

    if (keywords.some(k => ['tariff', 'tariffs'].includes(k.toLowerCase()))) {
      actions.push('1. Recalculate USMCA qualification status');
      actions.push('2. Analyze tariff impact on current shipments');
      actions.push('3. Explore Mexico routing alternatives');
    }

    if (category === 'government') {
      actions.push('1. Monitor for implementation timeline');
      actions.push('2. Prepare compliance documentation');
    }

    return actions.length > 0 ? actions.join('; ') : 'Monitor situation and assess supply chain impact';
  }

  /**
   * Record feed activity in database
   */
  async recordFeedActivity(feedId, status, metadata = {}) {
    try {
      await this.supabase
        .from('rss_feed_activities')
        .insert({
          feed_id: feedId,
          status,
          ...metadata
        });
    } catch (error) {
      console.warn('⚠️ Error recording feed activity:', error.message);
    }
  }

  /**
   * Update feed status and timestamps
   */
  async updateFeedStatus(feedId, success, responseTime = null) {
    try {
      const updateData = {
        last_check_at: new Date().toISOString()
      };

      if (success) {
        updateData.last_success_at = new Date().toISOString();
        updateData.failure_count = 0;
      } else {
        // Increment failure count
        const { data: feed } = await this.supabase
          .from('rss_feeds')
          .select('failure_count')
          .eq('id', feedId)
          .single();

        updateData.failure_count = (feed?.failure_count || 0) + 1;
      }

      await this.supabase
        .from('rss_feeds')
        .update(updateData)
        .eq('id', feedId);

    } catch (error) {
      console.warn('⚠️ Error updating feed status:', error.message);
    }
  }

  /**
   * Get polling status
   */
  getStatus() {
    return {
      isPolling: this.isPolling,
      hasInterval: !!this.pollInterval,
      uptime: this.isPolling ? 'Running' : 'Stopped'
    };
  }
}

module.exports = RSSPollingEngine;