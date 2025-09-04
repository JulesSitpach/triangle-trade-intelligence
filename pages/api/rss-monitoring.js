/**
 * RSS MONITORING API ENDPOINT
 * Efficient government feed monitoring without aggressive polling
 */

import { RSSMonitorService } from '../../lib/services/rss-monitor-service.js';
import { ProductionLogger } from '../../lib/utils/production-logger.js';

const logger = ProductionLogger;

export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    const rssMonitor = new RSSMonitorService();
    
    if (req.method === 'POST') {
      return await handlePost(req, res, rssMonitor);
    } else if (req.method === 'GET') {
      return await handleGet(req, res, rssMonitor);
    } else {
      return res.status(405).json({ 
        success: false, 
        error: 'Method not allowed',
        supportedMethods: ['GET', 'POST']
      });
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('RSS monitoring API error', error, { responseTime });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle POST requests - Control RSS monitoring
 */
async function handlePost(req, res, rssMonitor) {
  const { action, data } = req.body;
  
  if (!action) {
    return res.status(400).json({
      success: false,
      error: 'Action parameter required',
      supportedActions: [
        'start_monitoring',
        'stop_monitoring',
        'check_feeds_now',
        'get_recent_items',
        'test_single_feed'
      ]
    });
  }
  
  try {
    switch (action) {
      case 'start_monitoring':
        const startResult = await rssMonitor.startRSSMonitoring();
        logger.info('RSS monitoring started via API');
        return res.json({
          success: true,
          message: 'RSS monitoring started successfully',
          ...startResult,
          timestamp: new Date().toISOString()
        });
        
      case 'stop_monitoring':
        rssMonitor.stopRSSMonitoring();
        return res.json({
          success: true,
          message: 'RSS monitoring stopped',
          timestamp: new Date().toISOString()
        });
        
      case 'check_feeds_now':
        const checkResult = await rssMonitor.checkAllFeeds();
        logger.info('Manual RSS feed check completed', { 
          newItems: checkResult.summary.new_items,
          relevantItems: checkResult.summary.relevant_items 
        });
        return res.json({
          success: true,
          message: 'RSS feed check completed',
          ...checkResult,
          timestamp: new Date().toISOString()
        });
        
      case 'get_recent_items':
        const recentItems = await getRecentRSSItems(data?.days || 7, data?.relevantOnly);
        return res.json({
          success: true,
          items: recentItems,
          count: recentItems.length,
          period: `${data?.days || 7} days`,
          relevantOnly: data?.relevantOnly || false,
          timestamp: new Date().toISOString()
        });
        
      case 'test_single_feed':
        if (!data?.feedKey) {
          return res.status(400).json({
            success: false,
            error: 'feedKey required for single feed test'
          });
        }
        
        const testResult = await rssMonitor.checkSpecificFeeds([data.feedKey]);
        return res.json({
          success: true,
          message: `Feed ${data.feedKey} tested successfully`,
          result: testResult[0] || null,
          timestamp: new Date().toISOString()
        });
        
      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported action: ${action}`,
          supportedActions: [
            'start_monitoring',
            'stop_monitoring', 
            'check_feeds_now',
            'get_recent_items',
            'test_single_feed'
          ]
        });
    }
  } catch (error) {
    logger.error(`Failed to handle RSS action: ${action}`, error);
    return res.status(500).json({
      success: false,
      error: `Failed to execute action: ${action}`,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle GET requests - Get RSS monitoring status
 */
async function handleGet(req, res, rssMonitor) {
  const { include_recent_items, days } = req.query;
  
  try {
    // Get RSS monitoring status
    const status = rssMonitor.getMonitoringStatus();
    
    // Get feed statistics
    const feedStats = await getFeedStatistics();
    
    // Get recent items if requested
    let recentItems = null;
    if (include_recent_items === 'true') {
      recentItems = await getRecentRSSItems(parseInt(days) || 3, true); // Only relevant items
    }
    
    return res.json({
      success: true,
      monitoring: status,
      statistics: feedStats,
      recentItems: recentItems ? {
        count: recentItems.length,
        items: recentItems.slice(0, 10), // Limit to 10 most recent
        period: `${days || 3} days`
      } : null,
      rssApproachBenefits: {
        description: 'RSS feeds eliminate aggressive polling while providing real-time updates',
        efficiency: 'Checks only when new content is published',
        resourceUsage: 'Minimal - no constant API calls',
        reliability: 'Government agencies push updates via RSS immediately',
        costEffective: 'No API rate limits or premium tiers'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to get RSS monitoring status', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve RSS monitoring status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get recent RSS items from database
 */
async function getRecentRSSItems(days = 7, relevantOnly = false) {
  try {
    const rssMonitor = new RSSMonitorService();
    
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    let query = rssMonitor.db.client
      .from('rss_processed_items')
      .select('*')
      .gte('item_date', cutoffDate)
      .order('item_date', { ascending: false })
      .limit(50);
    
    if (relevantOnly) {
      query = query.eq('is_relevant', true);
    }
    
    const { data: items, error } = await query;
    
    if (error) {
      logger.error('Failed to fetch recent RSS items', error);
      return [];
    }
    
    return items || [];
  } catch (error) {
    logger.error('Error fetching recent RSS items', error);
    return [];
  }
}

/**
 * Get RSS feed statistics
 */
async function getFeedStatistics() {
  try {
    const rssMonitor = new RSSMonitorService();
    
    // Get feed tracking statistics
    const { data: trackingStats } = await rssMonitor.db.client
      .from('rss_feed_tracking')
      .select('*');
    
    // Get processed items statistics (last 30 days)
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: itemStats } = await rssMonitor.db.client
      .from('rss_processed_items')
      .select('feed_key, is_relevant')
      .gte('processed_at', cutoffDate);
    
    // Calculate statistics
    const totalFeeds = trackingStats?.length || 0;
    const activeFeeds = trackingStats?.filter(f => f.status === 'active').length || 0;
    const totalItems = itemStats?.length || 0;
    const relevantItems = itemStats?.filter(i => i.is_relevant).length || 0;
    const relevanceRate = totalItems > 0 ? ((relevantItems / totalItems) * 100).toFixed(1) : '0.0';
    
    // Feed-specific statistics
    const feedBreakdown = trackingStats?.map(feed => ({
      feedKey: feed.feed_key,
      description: feed.feed_description,
      lastChecked: feed.last_checked,
      itemsProcessed: feed.items_processed,
      errorsCount: feed.errors_count,
      status: feed.status
    })) || [];
    
    return {
      totalFeeds,
      activeFeeds,
      totalItems: totalItems,
      relevantItems: relevantItems,
      relevanceRate: `${relevanceRate}%`,
      period: 'Last 30 days',
      feedBreakdown,
      efficiency: {
        description: 'RSS monitoring replaces aggressive polling',
        benefit: 'Government feeds update when content is published, not on polling schedule',
        resourceSaving: 'Eliminates unnecessary API calls when no new content exists'
      }
    };
  } catch (error) {
    logger.error('Error fetching RSS feed statistics', error);
    return {
      totalFeeds: 0,
      activeFeeds: 0,
      totalItems: 0,
      relevantItems: 0,
      relevanceRate: '0.0%',
      error: 'Statistics temporarily unavailable'
    };
  }
}