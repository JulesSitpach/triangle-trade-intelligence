/**
 * RSS MONITORING SERVICE
 * Efficient government feed monitoring without aggressive polling
 * Replaces interval-based API polling with RSS feed subscriptions
 */

import { serverDatabaseService } from '../database/supabase-client.js';
import { logInfo, logError, logWarn } from '../utils/production-logger.js';
import { SYSTEM_CONFIG } from '../../config/system-config.js';
import { crisisAlertService } from './crisis-alert-service.js';

export class RSSMonitorService {
  constructor() {
    this.db = serverDatabaseService;
    this.crisisAlertService = crisisAlertService;
    
    // Government RSS feeds - comprehensive USMCA coverage
    this.feeds = {
      // 🇺🇸 UNITED STATES - CRITICAL USMCA FEEDS
      cbp_rulings_cross: {
        url: 'https://rulings.cbp.gov/rulings/rss',
        description: 'CBP Rulings Online Search System (CROSS) - Classification & Tariff Rulings',
        priority: 'critical',
        country: 'US',
        keywords: ['ruling', 'classification', 'tariff', 'hs code', 'origin', 'usmca', 'nafta']
      },
      cbp_news: {
        url: 'https://www.cbp.gov/newsroom/national-media-release/feed',
        description: 'CBP Press Releases & Announcements',
        priority: 'high',
        country: 'US',
        keywords: ['tariff', 'duty', 'trade', 'customs', 'section 301', 'usmca']
      },
      usitc_tariff_news: {
        url: 'https://www.usitc.gov/press_room/news_release/news_release.xml',
        description: 'USITC International Trade Commission - Tariff Affairs News',
        priority: 'critical',
        country: 'US',
        keywords: ['tariff', 'antidumping', 'countervailing', 'trade', 'investigation', 'remedy']
      },
      federal_register_cbp: {
        url: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[agencies][]=u-s-customs-and-border-protection&conditions[type][]=rule',
        description: 'Federal Register - CBP Rules & Regulations',
        priority: 'critical',
        country: 'US',
        keywords: ['rule', 'regulation', 'tariff', 'customs', 'classification', 'origin']
      },
      ita_trade_news: {
        url: 'https://www.trade.gov/rss.xml',
        description: 'International Trade Administration (ITA) Newsroom',
        priority: 'high',
        country: 'US',
        keywords: ['trade', 'agreement', 'usmca', 'mexico', 'canada', 'tariff']
      },

      // 🇨🇦 CANADA - CRITICAL USMCA FEEDS
      cbsa_news: {
        url: 'https://www.cbsa-asfc.gc.ca/news-nouvelles/rss-eng.xml',
        description: 'CBSA Canada Border Services Agency News',
        priority: 'critical',
        country: 'CA',
        keywords: ['tariff', 'duty', 'customs', 'trade', 'usmca', 'classification', 'origin']
      },
      canada_gazette_part2: {
        url: 'https://www.gazette.gc.ca/rss/part2-e.xml',
        description: 'Canada Gazette Part II - Regulations (customs, tariffs, trade measures)',
        priority: 'critical',
        country: 'CA',
        keywords: ['regulation', 'tariff', 'customs', 'trade', 'duty', 'classification']
      },
      global_affairs_canada: {
        url: 'https://www.international.gc.ca/rss/newsroom.xml',
        description: 'Global Affairs Canada - Trade News',
        priority: 'high',
        country: 'CA',
        keywords: ['trade', 'agreement', 'usmca', 'tariff', 'negotiation', 'dispute']
      },

      // 🇲🇽 MEXICO - CRITICAL USMCA FEEDS
      dof_official: {
        url: 'https://www.dof.gob.mx/rss.php',
        description: 'Diario Oficial de la Federación (DOF) - Official Gazette',
        priority: 'critical',
        country: 'MX',
        keywords: ['arancel', 'tarifa', 'comercio', 'tlcan', 'tmec', 'clasificación', 'origen']
      },
      secretaria_economia: {
        url: 'https://www.gob.mx/se/prensa/rss',
        description: 'Secretaría de Economía - Press Releases',
        priority: 'high',
        country: 'MX',
        keywords: ['comercio', 'arancel', 'tlcan', 'tmec', 'estados unidos', 'canada']
      },

      // 🌍 INTERNATIONAL - SUPPORTING FEEDS
      wto_news: {
        url: 'https://www.wto.org/english/news_e/news_e.rss',
        description: 'WTO News Releases',
        priority: 'medium',
        country: 'INT',
        keywords: ['trade', 'dispute', 'tariff', 'agreement', 'nafta', 'usmca']
      },
      eu_trade: {
        url: 'https://policy.trade.ec.europa.eu/rss_en',
        description: 'EU Trade Directorate (DG TRADE) News',
        priority: 'medium',
        country: 'EU',
        keywords: ['trade', 'agreement', 'tariff', 'dispute', 'north america']
      },

      // 🔥 LEGACY FEEDS (keeping for backward compatibility)
      federal_register_tariff: {
        url: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[term]=tariff',
        description: 'Federal Register Tariff Updates (Legacy)',
        priority: 'high',
        country: 'US',
        keywords: ['tariff', 'duty', 'rate', 'schedule', 'modification']
      },
      ustr_press: {
        url: 'https://ustr.gov/about-us/policy-offices/press-office/press-releases/feed',
        description: 'USTR Press Releases (Legacy)',
        priority: 'high',
        country: 'US',
        keywords: ['trade', 'agreement', 'negotiation', 'dispute', 'tariff', 'usmca']
      }
    };
    
    // Track last check times to avoid duplicate processing
    this.lastChecked = new Map();
    this.isRunning = false;
    
    // Configuration-driven intervals (much more reasonable than aggressive polling)
    this.checkInterval = parseInt(process.env.RSS_CHECK_INTERVAL_HOURS) || 4; // Default 4 hours
    this.emergencyInterval = parseInt(process.env.RSS_EMERGENCY_CHECK_MINUTES) || 30; // 30 minutes for critical feeds
  }

  /**
   * Start RSS monitoring service (replaces aggressive polling)
   */
  async startRSSMonitoring() {
    if (this.isRunning) {
      logInfo('RSS monitoring service already running');
      return { success: true, message: 'Already running' };
    }

    try {
      this.isRunning = true;
      logInfo('Starting RSS-based monitoring service', {
        feeds: Object.keys(this.feeds).length,
        checkInterval: `${this.checkInterval} hours`,
        emergencyInterval: `${this.emergencyInterval} minutes`
      });

      // Initialize feed tracking
      await this.initializeFeedTracking();
      
      // Start regular RSS checks (every 4 hours - very reasonable)
      this.startRegularRSSChecks();
      
      // Start emergency RSS checks for critical feeds (every 30 minutes)
      this.startEmergencyRSSChecks();
      
      // Initial feed check
      await this.checkAllFeeds();
      
      return { 
        success: true, 
        message: 'RSS monitoring started successfully',
        interval: `${this.checkInterval} hours`,
        feeds: Object.keys(this.feeds).length
      };
      
    } catch (error) {
      logError('Failed to start RSS monitoring', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Initialize feed tracking in database
   */
  async initializeFeedTracking() {
    try {
      // Create RSS feed tracking table if not exists
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS rss_feed_tracking (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          feed_key TEXT UNIQUE NOT NULL,
          feed_url TEXT NOT NULL,
          feed_description TEXT,
          last_checked TIMESTAMP WITH TIME ZONE,
          last_item_date TIMESTAMP WITH TIME ZONE,
          items_processed INTEGER DEFAULT 0,
          errors_count INTEGER DEFAULT 0,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS rss_processed_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          feed_key TEXT NOT NULL,
          item_guid TEXT NOT NULL,
          item_title TEXT,
          item_date TIMESTAMP WITH TIME ZONE,
          item_url TEXT,
          content_snippet TEXT,
          is_relevant BOOLEAN DEFAULT false,
          tariff_related BOOLEAN DEFAULT false,
          alert_generated BOOLEAN DEFAULT false,
          processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(feed_key, item_guid)
        );
      `;

      await this.db.client.rpc('execute_sql', { sql: createTableSQL });
      
      // Initialize feed tracking records
      for (const [key, feed] of Object.entries(this.feeds)) {
        await this.db.client
          .from('rss_feed_tracking')
          .upsert({
            feed_key: key,
            feed_url: feed.url,
            feed_description: feed.description,
            last_checked: new Date().toISOString(),
            status: 'active'
          }, {
            onConflict: 'feed_key'
          });
      }
      
      logInfo('RSS feed tracking initialized', { 
        feeds: Object.keys(this.feeds).length 
      });
      
    } catch (error) {
      logError('Failed to initialize feed tracking', error);
      throw error;
    }
  }

  /**
   * Start regular RSS checks (every 4 hours - reasonable for government feeds)
   */
  startRegularRSSChecks() {
    const intervalMs = this.checkInterval * 60 * 60 * 1000;
    
    setInterval(async () => {
      try {
        logInfo('Starting regular RSS feed check');
        await this.checkAllFeeds();
      } catch (error) {
        logError('Regular RSS check failed', error);
      }
    }, intervalMs);
    
    logInfo(`Regular RSS checks scheduled every ${this.checkInterval} hours`);
  }

  /**
   * Start emergency RSS checks for critical USMCA feeds (every 30 minutes)
   */
  startEmergencyRSSChecks() {
    const intervalMs = this.emergencyInterval * 60 * 1000;
    
    setInterval(async () => {
      try {
        // Prioritize USMCA-specific critical feeds
        const usmcaCriticalFeeds = Object.entries(this.feeds)
          .filter(([key, feed]) => {
            return feed.priority === 'critical' && 
                   ['US', 'CA', 'MX'].includes(feed.country) &&
                   (feed.keywords.includes('usmca') || 
                    feed.keywords.includes('nafta') || 
                    feed.keywords.includes('tlcan') || 
                    feed.keywords.includes('tmec'));
          })
          .map(([key, feed]) => key);
          
        if (usmcaCriticalFeeds.length > 0) {
          logInfo('Starting emergency RSS check for USMCA critical feeds', { 
            feeds: usmcaCriticalFeeds,
            description: 'CBP CROSS, Canada Gazette Part II, DOF Mexico'
          });
          await this.checkSpecificFeeds(usmcaCriticalFeeds);
        }
      } catch (error) {
        logError('Emergency USMCA RSS check failed', error);
      }
    }, intervalMs);
    
    logInfo(`Emergency RSS checks scheduled every ${this.emergencyInterval} minutes for USMCA critical feeds`);
  }

  /**
   * Check all RSS feeds for updates
   */
  async checkAllFeeds() {
    const startTime = Date.now();
    const results = [];
    
    for (const [feedKey, feedConfig] of Object.entries(this.feeds)) {
      try {
        const result = await this.checkSingleFeed(feedKey, feedConfig);
        results.push(result);
      } catch (error) {
        logError(`Failed to check feed ${feedKey}`, error);
        results.push({
          feedKey,
          success: false,
          error: error.message
        });
      }
    }
    
    const processingTime = Date.now() - startTime;
    const newItems = results.reduce((sum, r) => sum + (r.newItems || 0), 0);
    const relevantItems = results.reduce((sum, r) => sum + (r.relevantItems || 0), 0);
    
    logInfo('RSS feed check completed', {
      feeds_checked: results.length,
      successful_feeds: results.filter(r => r.success).length,
      new_items: newItems,
      relevant_items: relevantItems,
      processing_time_ms: processingTime
    });
    
    return {
      success: true,
      results,
      summary: {
        feeds_checked: results.length,
        new_items: newItems,
        relevant_items: relevantItems,
        processing_time_ms: processingTime
      }
    };
  }

  /**
   * Check specific feeds (for emergency checks)
   */
  async checkSpecificFeeds(feedKeys) {
    const results = [];
    
    for (const feedKey of feedKeys) {
      if (this.feeds[feedKey]) {
        try {
          const result = await this.checkSingleFeed(feedKey, this.feeds[feedKey]);
          results.push(result);
        } catch (error) {
          logError(`Failed to check specific feed ${feedKey}`, error);
        }
      }
    }
    
    return results;
  }

  /**
   * Check single RSS feed for new items
   */
  async checkSingleFeed(feedKey, feedConfig) {
    const startTime = Date.now();
    
    try {
      // Use native fetch instead of external RSS parser to reduce dependencies
      const response = await fetch(feedConfig.url, {
        headers: {
          'User-Agent': 'Triangle Intelligence USMCA Compliance Platform/1.0 (Trade Monitoring)'
        },
        timeout: 30000 // 30 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const xmlText = await response.text();
      const feed = await this.parseRSSXML(xmlText);
      
      // Get last check time for this feed
      const { data: tracking } = await this.db.client
        .from('rss_feed_tracking')
        .select('last_item_date')
        .eq('feed_key', feedKey)
        .single();
      
      const lastItemDate = tracking?.last_item_date ? new Date(tracking.last_item_date) : new Date(0);
      
      // Filter for new items only
      const newItems = feed.items.filter(item => {
        const itemDate = new Date(item.pubDate || item.date || 0);
        return itemDate > lastItemDate;
      });
      
      let relevantItems = 0;
      let alertsGenerated = 0;
      
      if (newItems.length > 0) {
        // Process new items for tariff relevance AND crisis detection
        for (const item of newItems) {
          const isRelevant = await this.analyzeItemRelevance(item, feedConfig.keywords);
          
          if (isRelevant) {
            relevantItems++;
            
            // Store processed item
            await this.storeProcessedItem(feedKey, item, isRelevant);
            
            // ✅ NEW: Check for crisis scenarios and generate personalized alerts
            const crisisResult = await this.crisisAlertService.processRSSItem(feedKey, item);
            if (crisisResult.crisisDetected) {
              alertsGenerated += crisisResult.alertsGenerated || 0;
              logInfo('Crisis alerts generated from RSS item', {
                feedKey,
                crisisLevel: crisisResult.crisisLevel,
                affectedUsers: crisisResult.affectedUsers,
                alertsGenerated: crisisResult.alertsGenerated
              });
            }
            
            // Generate standard customer alerts if relevant (legacy system)
            const standardAlertGenerated = await this.generateAlertForItem(feedKey, item, feedConfig);
            if (standardAlertGenerated) alertsGenerated++;
          }
        }
        
        // Update feed tracking
        const latestItemDate = Math.max(...newItems.map(item => 
          new Date(item.pubDate || item.date || 0).getTime()
        ));
        
        await this.updateFeedTracking(feedKey, new Date(latestItemDate), newItems.length);
      }
      
      const processingTime = Date.now() - startTime;
      
      logInfo(`RSS feed ${feedKey} checked successfully`, {
        new_items: newItems.length,
        relevant_items: relevantItems,
        alerts_generated: alertsGenerated,
        processing_time_ms: processingTime
      });
      
      return {
        feedKey,
        success: true,
        newItems: newItems.length,
        relevantItems,
        alertsGenerated,
        processingTimeMs: processingTime
      };
      
    } catch (error) {
      logError(`RSS feed check failed for ${feedKey}`, error);
      
      // Update error count
      await this.updateFeedErrorCount(feedKey);
      
      return {
        feedKey,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse RSS XML (simple parser without external dependencies)
   */
  async parseRSSXML(xmlText) {
    // Simple RSS parsing - could be enhanced with proper XML parser
    const items = [];
    
    // Extract items using regex (basic approach)
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
    
    for (const itemMatch of itemMatches) {
      const item = {
        title: this.extractXMLTag(itemMatch, 'title'),
        description: this.extractXMLTag(itemMatch, 'description'),
        link: this.extractXMLTag(itemMatch, 'link'),
        pubDate: this.extractXMLTag(itemMatch, 'pubDate'),
        guid: this.extractXMLTag(itemMatch, 'guid')
      };
      
      items.push(item);
    }
    
    return { items };
  }

  /**
   * Extract XML tag content (helper method)
   */
  extractXMLTag(xml, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim().replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : '';
  }

  /**
   * Analyze item relevance for tariff/trade content
   */
  async analyzeItemRelevance(item, keywords) {
    const content = `${item.title} ${item.description}`.toLowerCase();
    
    // Check for tariff-specific keywords
    const tariffKeywords = [
      'tariff', 'duty', 'trade', 'customs', 'section 301',
      'antidumping', 'countervailing', 'quota', 'embargo', 
      'suspension', 'hs code', 'classification', 'origin',
      'usmca', 'nafta', 'china', 'mexico', 'canada'
    ];
    
    // Combine feed-specific keywords with general tariff keywords
    const allKeywords = [...new Set([...keywords, ...tariffKeywords])];
    
    // Check if content contains relevant keywords
    const relevantKeywordCount = allKeywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    ).length;
    
    // Consider relevant if multiple keywords match
    return relevantKeywordCount >= 2;
  }

  /**
   * Store processed RSS item in database
   */
  async storeProcessedItem(feedKey, item, isRelevant) {
    try {
      await this.db.client
        .from('rss_processed_items')
        .upsert({
          feed_key: feedKey,
          item_guid: item.guid || item.link || `${feedKey}_${Date.now()}`,
          item_title: item.title,
          item_date: new Date(item.pubDate || new Date()).toISOString(),
          item_url: item.link,
          content_snippet: item.description?.substring(0, 500),
          is_relevant: isRelevant,
          tariff_related: isRelevant,
          processed_at: new Date().toISOString()
        }, {
          onConflict: 'feed_key,item_guid'
        });
    } catch (error) {
      logError('Failed to store processed item', error);
    }
  }

  /**
   * Generate customer alert for relevant item
   */
  async generateAlertForItem(feedKey, item, feedConfig) {
    try {
      // This would integrate with existing customer alert system
      logInfo('Relevant tariff item found', {
        feed: feedKey,
        title: item.title,
        date: item.pubDate,
        priority: feedConfig.priority
      });
      
      // TODO: Integration with Triangle Intelligence alert system
      // await this.customerAlertService.createAlertFromRSSItem(item, feedConfig);
      
      return true;
    } catch (error) {
      logError('Failed to generate alert for item', error);
      return false;
    }
  }

  /**
   * Update feed tracking information
   */
  async updateFeedTracking(feedKey, lastItemDate, itemsProcessed) {
    try {
      await this.db.client
        .from('rss_feed_tracking')
        .update({
          last_checked: new Date().toISOString(),
          last_item_date: lastItemDate.toISOString(),
          items_processed: itemsProcessed
        })
        .eq('feed_key', feedKey);
    } catch (error) {
      logError('Failed to update feed tracking', error);
    }
  }

  /**
   * Update feed error count
   */
  async updateFeedErrorCount(feedKey) {
    try {
      await this.db.client.rpc('increment_feed_error_count', { 
        p_feed_key: feedKey 
      });
    } catch (error) {
      logError('Failed to update feed error count', error);
    }
  }

  /**
   * Get RSS monitoring status
   */
  getMonitoringStatus() {
    return {
      running: this.isRunning,
      feeds: Object.keys(this.feeds).length,
      checkInterval: `${this.checkInterval} hours`,
      emergencyInterval: `${this.emergencyInterval} minutes`,
      feeds_configured: Object.entries(this.feeds).map(([key, feed]) => ({
        key,
        description: feed.description,
        priority: feed.priority,
        url: feed.url
      }))
    };
  }

  /**
   * Stop RSS monitoring service
   */
  stopRSSMonitoring() {
    this.isRunning = false;
    logInfo('RSS monitoring service stopped');
  }
}

// Export singleton instance
export const rssMonitorService = new RSSMonitorService();

export default RSSMonitorService;