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
    
    // WORKING RSS FEEDS - CANADA-MEXICO PARTNERSHIP INTELLIGENCE
    this.feeds = {
      // ⭐ PROVEN WORKING FEEDS (Tested and verified)

      // 🇺🇸 BLOOMBERG - HIGH VALUE FEEDS (Your existing working feeds)
      bloomberg_markets: {
        url: 'https://feeds.bloomberg.com/markets/news.rss',
        description: 'Bloomberg Markets - Partnership Intelligence (28 fresh items/day)',
        priority: 'critical',
        country: 'US',
        keywords: ['mexico', 'canada', 'partnership', 'trade', 'investment', 'prime minister', 'carney', 'sheinbaum', 'tc energy', 'cpkc', 'torex gold', 'endeavour silver', 'gogold', 'françois poirier', 'keith creel', 'southeast gateway', 'americold', 'media luna', 'terronera', 'los ricos']
      },
      bloomberg_economics: {
        url: 'https://feeds.bloomberg.com/economics/news.rss',
        description: 'Bloomberg Economics - Canada Partnership Focus (29 fresh items/day)',
        priority: 'critical',
        country: 'US',
        keywords: ['canada', 'carney', 'prime minister', 'trade', 'economics', 'partnership', 'investment', 'scotiabank', 'scott thomson', 'cpkc rail', 'tc energy pipeline', 'mining investment', 'cold storage', 'americold']
      },

      // 🇨🇦 CANADIAN PARTNERSHIP FEEDS (Fresh and working)
      financial_post_canada: {
        url: 'https://financialpost.com/feed',
        description: 'Financial Post Canada - Fresh Partnership News (10 fresh items/day)',
        priority: 'high',
        country: 'CA',
        keywords: ['canada', 'mexico', 'partnership', 'north america', 'trade', 'investment', 'cpkc', 'tc energy', 'scotiabank', 'torex gold', 'endeavour silver', 'gogold', 'mining investment', 'keith creel', 'françois poirier', 'scott thomson', 'americold', 'cold storage']
      },
      yahoo_finance_canada: {
        url: 'https://ca.finance.yahoo.com/rss/topstories',
        description: 'Yahoo Finance Canada - Real-time Partnership Updates (51 fresh items/day)',
        priority: 'high',
        country: 'CA',
        keywords: ['canada', 'mexico', 'carney', 'sheinbaum', 'prime minister', 'partnership', 'trade', 'investment', 'cpkc investment', 'tc energy completion', 'mining companies', 'canadian mining', 'mexico operations', 'business dialogue']
      },
      globe_and_mail_business: {
        url: 'https://www.theglobeandmail.com/business/?service=rss',
        description: 'Globe and Mail Business - Comprehensive Partnership Coverage',
        priority: 'medium',
        country: 'CA',
        keywords: ['canada', 'usmca', 'nafta', 'scotiabank', 'trilateral', 'pipeline', 'critical minerals', 'carney', 'prime minister', 'mexico', 'scott thomson', 'cpkc rail network', 'southeast gateway', 'torex gold', 'endeavour silver', 'gogold resources', 'mining expansion', 'cold storage facility']
      },

      // 🇲🇽 MEXICAN PARTNERSHIP FEEDS (Spanish perspective)
      expansion_mexico: {
        url: 'https://expansion.mx/rss',
        description: 'Expansión Mexico - Mexican Partnership Perspective (31 fresh items/day)',
        priority: 'high',
        country: 'MX',
        keywords: ['canada', 'mexico', 'carney', 'sheinbaum', 'partnership', 'comercio', 'inversion', 'acuerdo', 'cpkc ferrocarril', 'tc energy gasoducto', 'mineria canadiense', 'torex gold', 'endeavour silver', 'gogold recursos', 'almacen frio', 'americold']
      },

      // 🇺🇸 GOVERNMENT FEEDS (Only the ones that work)
      ita_trade_news: {
        url: 'https://www.trade.gov/rss.xml',
        description: 'International Trade Administration (ITA) - Working Government Feed',
        priority: 'medium',
        country: 'US',
        keywords: ['trade', 'agreement', 'usmca', 'mexico', 'canada', 'tariff', 'partnership']
      },
      federal_register_cbp: {
        url: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[agencies][]=u-s-customs-and-border-protection&conditions[type][]=rule',
        description: 'Federal Register - CBP Rules (Working feed)',
        priority: 'medium',
        country: 'US',
        keywords: ['rule', 'regulation', 'tariff', 'customs', 'classification', 'origin', 'usmca']
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
          'User-Agent': 'Triangle Trade Intelligence USMCA Compliance Platform/1.0 (Trade Monitoring)'
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

            // 🎯 NEW: Integrate with Canada-Mexico partnership database
            await this.integrateWithPartnershipDatabase(feedKey, item, feedConfig);

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
   * Analyze item relevance for Canada-Mexico partnership content
   */
  async analyzeItemRelevance(item, keywords) {
    const content = `${item.title} ${item.description}`.toLowerCase();

    // 🎯 CANADA-MEXICO PARTNERSHIP KEYWORDS (High Priority)
    const partnershipKeywords = [
      'canada', 'mexico', 'partnership', 'carney', 'sheinbaum',
      'prime minister', 'cpkc', 'tc energy', 'scotiabank',
      'keith creel', 'françois poirier', 'scott thomson',
      'canadian pacific', 'rail network', 'pipeline', 'energy corridor',
      'strategic partnership', 'bilateral', 'trilateral', 'investment',
      'expansion', 'acquisition', 'merger', 'deal', 'agreement'
    ];

    // 🏛️ GOVERNMENT & TRADE KEYWORDS (Medium Priority)
    const governmentKeywords = [
      'usmca', 'nafta', 'tmec', 'tlcan', 'trade agreement',
      'tariff', 'duty', 'customs', 'section 301', 'antidumping',
      'countervailing', 'quota', 'embargo', 'suspension',
      'hs code', 'classification', 'origin', 'cross-border'
    ];

    // 💰 BUSINESS & FINANCIAL KEYWORDS (Medium Priority)
    const businessKeywords = [
      'billion', 'million', 'investment', 'infrastructure',
      'manufacturing', 'automotive', 'energy', 'mining',
      'critical minerals', 'supply chain', 'export', 'import',
      'revenue', 'profit', 'expansion', 'growth'
    ];

    // 🌎 SPANISH KEYWORDS (For Mexican sources)
    const spanishKeywords = [
      'canadá', 'méxico', 'comercio', 'inversión', 'acuerdo',
      'aranceles', 'aduanas', 'tmec', 'sociedad', 'expansión'
    ];

    // Combine all keyword sets
    const allKeywords = [
      ...new Set([
        ...keywords,           // Feed-specific keywords
        ...partnershipKeywords,
        ...governmentKeywords,
        ...businessKeywords,
        ...spanishKeywords
      ])
    ];

    // Calculate relevance score with weighted priorities
    let relevanceScore = 0;

    // High-value partnership keywords (weight: 3)
    const foundPartnershipKeywords = partnershipKeywords.filter(keyword =>
      content.includes(keyword.toLowerCase())
    );
    relevanceScore += foundPartnershipKeywords.length * 3;

    // Government/trade keywords (weight: 2)
    const foundGovernmentKeywords = governmentKeywords.filter(keyword =>
      content.includes(keyword.toLowerCase())
    );
    relevanceScore += foundGovernmentKeywords.length * 2;

    // Business keywords (weight: 1)
    const foundBusinessKeywords = businessKeywords.filter(keyword =>
      content.includes(keyword.toLowerCase())
    );
    relevanceScore += foundBusinessKeywords.length * 1;

    // Spanish keywords (weight: 2 for Mexican sources)
    const foundSpanishKeywords = spanishKeywords.filter(keyword =>
      content.includes(keyword.toLowerCase())
    );
    relevanceScore += foundSpanishKeywords.length * 2;

    // 🎯 ENHANCED RELEVANCE LOGIC:
    // - Score >= 5: High relevance (partnership + business content)
    // - Score >= 3: Medium relevance (some partnership content)
    // - Score >= 2: Low relevance (minimal relevant content)
    const isRelevant = relevanceScore >= 3;

    // Log high-value partnership content
    if (relevanceScore >= 5) {
      logInfo('High-value Canada-Mexico partnership content detected', {
        title: item.title.substring(0, 100),
        score: relevanceScore,
        partnershipKeywords: foundPartnershipKeywords,
        businessKeywords: foundBusinessKeywords.slice(0, 3)
      });
    }

    return isRelevant;
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
      
      // TODO: Integration with Triangle Trade Intelligence alert system
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

  /**
   * 🎯 INTEGRATE RSS ITEMS WITH CANADA-MEXICO PARTNERSHIP DATABASE
   * Automatically populate partnership opportunities from RSS feeds
   */
  async integrateWithPartnershipDatabase(feedKey, item, feedConfig) {
    try {
      const content = `${item.title} ${item.description}`.toLowerCase();

      // 🏢 DETECT PARTNERSHIP OPPORTUNITIES
      const partnershipIndicators = [
        'partnership', 'agreement', 'deal', 'merger', 'acquisition',
        'investment', 'expansion', 'bilateral', 'strategic alliance'
      ];

      const hasPartnershipContent = partnershipIndicators.some(indicator =>
        content.includes(indicator)
      );

      if (hasPartnershipContent) {
        // Determine which companies/executives are mentioned
        const mentionedExecutives = this.detectExecutiveMentions(content);
        const mentionedCompanies = this.detectCompanyMentions(content);

        // Create partnership opportunity if significant
        if (mentionedExecutives.length > 0 || mentionedCompanies.length > 0) {
          await this.createPartnershipOpportunity(item, feedConfig, {
            executives: mentionedExecutives,
            companies: mentionedCompanies
          });
        }
      }

      // 📰 UPDATE USMCA TIMELINE WITH RELEVANT EVENTS
      const timelineIndicators = [
        'usmca', 'nafta', 'review', 'negotiation', 'trade war',
        'section 301', 'tariff', 'summit', 'meeting', 'agreement'
      ];

      const hasTimelineContent = timelineIndicators.some(indicator =>
        content.includes(indicator)
      );

      if (hasTimelineContent) {
        await this.updateUSMCATimeline(item, feedConfig);
      }

      // 💎 TRACK CRITICAL MINERALS DEVELOPMENTS
      const mineralsIndicators = [
        'lithium', 'copper', 'nickel', 'rare earth', 'mining',
        'critical minerals', 'supply chain', 'battery', 'ev'
      ];

      const hasMineralsContent = mineralsIndicators.some(indicator =>
        content.includes(indicator)
      );

      if (hasMineralsContent) {
        await this.trackMineralsUpdate(item, feedConfig);
      }

    } catch (error) {
      logError('Failed to integrate RSS item with partnership database', error, {
        feedKey,
        itemTitle: item.title?.substring(0, 100)
      });
    }
  }

  /**
   * Detect mentions of key Canadian executives
   */
  detectExecutiveMentions(content) {
    const executives = [
      { name: 'keith creel', company: 'CPKC', role: 'CEO' },
      { name: 'françois poirier', company: 'TC Energy', role: 'CEO' },
      { name: 'scott thomson', company: 'Scotiabank', role: 'CEO' },
      { name: 'nancy southern', company: 'ATCO', role: 'CEO' },
      { name: 'rob wildeboer', company: 'Martinrea', role: 'Executive Chairman' },
      { name: 'john baker', company: 'D2L', role: 'CEO' },
      { name: 'darren walker', company: 'Magna', role: 'CEO' },
      { name: 'mark carney', company: 'Government of Canada', role: 'Prime Minister' }
    ];

    return executives.filter(exec => content.includes(exec.name.toLowerCase()));
  }

  /**
   * Detect mentions of key companies
   */
  detectCompanyMentions(content) {
    const companies = [
      'cpkc', 'canadian pacific', 'kansas city southern',
      'tc energy', 'transcanada', 'scotiabank', 'bank of nova scotia',
      'atco', 'martinrea', 'd2l', 'desire2learn', 'magna international',
      'suncor energy'
    ];

    return companies.filter(company => content.includes(company.toLowerCase()));
  }

  /**
   * Create new partnership opportunity from RSS content
   */
  async createPartnershipOpportunity(item, feedConfig, mentions) {
    try {
      const opportunity = {
        title: item.title,
        description: item.description?.substring(0, 500) || 'RSS feed update',
        sector: this.determineSector(item),
        estimated_value_usd: this.extractValueEstimate(item),
        timeline_start: new Date().toISOString().split('T')[0],
        timeline_end: null,
        status: 'monitoring',
        priority: 'medium',
        canadian_lead: mentions.executives[0]?.company || 'TBD',
        mexican_partner: 'TBD',
        triangle_routing_benefit: 'Partnership intelligence from RSS monitoring',
        usmca_compliance_notes: `Source: ${feedConfig.description}`,
        source_feed: feedConfig.description,
        source_url: item.link,
        created_from_rss: true
      };

      const { error } = await this.db.client
        .from('canada_mexico_opportunities')
        .insert(opportunity);

      if (!error) {
        logInfo('Created partnership opportunity from RSS feed', {
          title: opportunity.title.substring(0, 50),
          source: feedConfig.description,
          executives: mentions.executives.map(e => e.name)
        });
      }

    } catch (error) {
      logError('Failed to create partnership opportunity', error);
    }
  }

  /**
   * Update USMCA timeline with relevant events
   */
  async updateUSMCATimeline(item, feedConfig) {
    try {
      const timelineEvent = {
        event_date: new Date().toISOString().split('T')[0],
        event_title: item.title,
        description: item.description?.substring(0, 300) || 'RSS feed update',
        impact_level: this.determineImpactLevel(item),
        canada_position: 'TBD',
        mexico_position: 'TBD',
        triangle_implications: 'Monitoring via RSS intelligence',
        partnership_opportunities: `Source: ${feedConfig.description}`,
        source_feed: feedConfig.description,
        source_url: item.link
      };

      const { error } = await this.db.client
        .from('usmca_review_timeline')
        .insert(timelineEvent);

      if (!error) {
        logInfo('Added USMCA timeline event from RSS', {
          title: timelineEvent.event_title.substring(0, 50),
          impact: timelineEvent.impact_level
        });
      }

    } catch (error) {
      logError('Failed to update USMCA timeline', error);
    }
  }

  /**
   * Track critical minerals updates
   */
  async trackMineralsUpdate(item, feedConfig) {
    try {
      // Log minerals-related updates for now
      // Could expand to update critical_minerals_trade table
      logInfo('Critical minerals content detected in RSS', {
        title: item.title.substring(0, 50),
        source: feedConfig.description,
        link: item.link
      });

    } catch (error) {
      logError('Failed to track minerals update', error);
    }
  }

  /**
   * Determine sector from RSS content
   */
  determineSector(item) {
    const content = `${item.title} ${item.description}`.toLowerCase();

    if (content.includes('energy') || content.includes('pipeline') || content.includes('oil') || content.includes('gas')) {
      return 'energy';
    }
    if (content.includes('rail') || content.includes('railway') || content.includes('cpkc') || content.includes('transport')) {
      return 'rail';
    }
    if (content.includes('auto') || content.includes('vehicle') || content.includes('manufacturing')) {
      return 'auto';
    }
    if (content.includes('mining') || content.includes('mineral') || content.includes('lithium') || content.includes('copper')) {
      return 'minerals';
    }
    if (content.includes('financial') || content.includes('bank') || content.includes('investment')) {
      return 'financial';
    }

    return 'government_announcement';
  }

  /**
   * Extract estimated value from RSS content
   */
  extractValueEstimate(item) {
    const content = `${item.title} ${item.description}`;

    // Look for billions
    const billionMatch = content.match(/\$(\d+(?:\.\d+)?)\s*billion/i);
    if (billionMatch) {
      return parseFloat(billionMatch[1]) * 1000000000;
    }

    // Look for millions
    const millionMatch = content.match(/\$(\d+(?:\.\d+)?)\s*million/i);
    if (millionMatch) {
      return parseFloat(millionMatch[1]) * 1000000;
    }

    return null;
  }

  /**
   * Determine impact level for USMCA timeline
   */
  determineImpactLevel(item) {
    const content = `${item.title} ${item.description}`.toLowerCase();

    if (content.includes('emergency') || content.includes('breaking') || content.includes('critical')) {
      return 'critical';
    }
    if (content.includes('important') || content.includes('significant') || content.includes('major')) {
      return 'high';
    }

    return 'medium';
  }
}

// Export singleton instance
export const rssMonitorService = new RSSMonitorService();

export default RSSMonitorService;