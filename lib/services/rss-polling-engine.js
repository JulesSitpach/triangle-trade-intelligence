/**
 * RSS Polling Engine for Crisis Monitoring
 * Fetches RSS feeds, parses content, detects crisis keywords, and generates alerts
 * Core component for Triangle Trade Intelligence crisis response positioning
 */

import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import resendAlertService from './resend-alert-service.js';

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
    this.emailService = resendAlertService;
  }

  /**
   * Start continuous RSS polling for all active feeds
   *
   * ⚠️ LOCAL DEVELOPMENT ONLY - NOT USED IN PRODUCTION
   *
   * Production uses Vercel Cron (every 4 hours) via /api/cron/rss-polling
   * This method is ONLY for local testing and manual polling scripts
   *
   * Default: 60 minutes for local testing (not 5 - too aggressive!)
   */
  async startPolling(intervalMinutes = 60) {  // Changed from 5 to 60 for safety
    if (this.isPolling) {
      console.log('⚠️ RSS polling already running');
      return;
    }

    console.log('🚀 Starting RSS Crisis Monitoring Engine (LOCAL DEV MODE)...');
    this.isPolling = true;

    // Initial poll
    await this.pollAllFeeds();

    // Set up continuous polling
    this.pollInterval = setInterval(async () => {
      await this.pollAllFeeds();
    }, intervalMinutes * 60 * 1000);

    console.log(`✅ RSS polling started (every ${intervalMinutes} minutes - LOCAL DEV ONLY)`);
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
   * COST TRACKING: Monitors AI usage for cost optimization
   */
  async pollAllFeeds(useAI = false) {
    try {
      console.log('📡 Polling RSS feeds for crisis intelligence...');
      console.log(`   AI Mode: ${useAI ? '🤖 ENABLED (daily batch)' : '🔍 KEYWORDS ONLY (cost optimized)'}`);

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

      // Track AI usage
      this.aiCallCount = 0;
      this.keywordOnlyCount = 0;

      // Poll each feed
      const results = await Promise.allSettled(
        feeds.map(feed => this.pollSingleFeed(feed, useAI))
      );

      // Summary
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`📊 Poll complete: ${successful} successful, ${failed} failed`);
      console.log(`💰 Cost optimization: ${this.keywordOnlyCount} keyword-only, ${this.aiCallCount} AI calls`);
      console.log(`   Estimated cost: ~$${(this.aiCallCount * 0.0001).toFixed(4)} (Haiku: $0.0001/call)`);

      return {
        successful,
        failed,
        total: feeds.length,
        aiCalls: this.aiCallCount,
        keywordOnly: this.keywordOnlyCount
      };

    } catch (error) {
      console.error('❌ Error in pollAllFeeds:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Poll a single RSS feed
   */
  async pollSingleFeed(feed, useAI = false) {
    const startTime = Date.now();

    try {
      console.log(`📰 Polling: ${feed.name} (${feed.category})`);

      // Fetch RSS content - try direct first
      let rssData;
      let fetchMethod = 'direct';

      try {
        rssData = await this.parser.parseURL(feed.url);
        fetchMethod = 'direct';
      } catch (directError) {
        // ✅ NETWORK FIX: If direct fetch fails (network restrictions), use proxy
        console.log(`  🔄 Direct fetch failed, trying proxy for ${feed.name}`);

        try {
          const proxyResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/rss-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              feedUrl: feed.url,
              feedName: feed.name
            })
          });

          if (!proxyResponse.ok) {
            throw new Error(`Proxy returned ${proxyResponse.status}`);
          }

          const proxyData = await proxyResponse.json();

          if (!proxyData.success) {
            throw new Error(proxyData.error || 'Proxy fetch failed');
          }

          // Use proxy data
          rssData = {
            items: proxyData.items || [],
            title: proxyData.feedName
          };
          fetchMethod = 'proxy';
          console.log(`  ✅ Proxy fetch succeeded for ${feed.name}`);

        } catch (proxyError) {
          console.error(`  ❌ Both direct and proxy failed for ${feed.name}:`, {
            directError: directError.message,
            proxyError: proxyError.message
          });
          throw new Error(`Network blocked and proxy failed: ${directError.message}`);
        }
      }

      const responseTime = Date.now() - startTime;

      // Process items with AI flag
      const newItems = await this.processRSSItems(feed, rssData.items || [], useAI);

      // Record successful activity
      await this.recordFeedActivity(feed.id, 'success', {
        response_time_ms: responseTime,
        items_found: rssData.items?.length || 0,
        new_items: newItems.length,
        title: rssData.title,
        fetch_method: fetchMethod  // ✅ Track if proxy was used
      });

      // Update feed last check
      await this.updateFeedStatus(feed.id, true, responseTime);

      console.log(`  ✅ ${feed.name}: ${newItems.length} new items, ${responseTime}ms (${fetchMethod})`);

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
  async processRSSItems(feed, items, useAI = false) {
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

        // Detect crisis keywords (AI flag for batch or high-priority)
        const crisisDetection = await this.detectCrisisKeywords(
          content,
          feed.keywords,
          feed.exclusion_keywords,
          item.title,
          useAI
        );

        // Track AI usage
        if (crisisDetection.usedAI) {
          this.aiCallCount++;
        } else {
          this.keywordOnlyCount++;
        }

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
   * Detect crisis keywords using keyword scoring FIRST, AI only for high-priority
   * COST OPTIMIZATION: AI analysis only for high keyword scores or daily batch
   */
  async detectCrisisKeywords(content, keywords, exclusionKeywords = [], itemTitle = '', useAI = false) {
    try {
      // STEP 1: Always do keyword-based scoring first (free, instant)
      const keywordResult = this.keywordBasedScoring(content, keywords, exclusionKeywords);

      // STEP 2: Only use AI for high-priority items or if explicitly requested
      // AI triggers:
      // - useAI flag is true (daily batch analysis)
      // - OR keyword score >= 8 (high-impact keywords like "china", "tariff", "trade war")
      const shouldUseAI = useAI || keywordResult.score >= 8;

      if (shouldUseAI) {
        console.log(`   🤖 AI analysis triggered (keyword score: ${keywordResult.score})`);
        const aiAnalysis = await this.analyzeRSSItemWithAI(itemTitle, content.description);

        // If AI analysis succeeds, use it
        if (aiAnalysis.success) {
          return {
            hasCrisisKeywords: aiAnalysis.score >= 3,
            matchedKeywords: aiAnalysis.keywords,
            score: aiAnalysis.score,
            reason: aiAnalysis.reasoning,
            affectedCountries: aiAnalysis.affected_countries || [],
            affectedIndustries: aiAnalysis.affected_industries || [],
            usedAI: true
          };
        }
      }

      // STEP 3: Use keyword-based result (no AI cost incurred)
      return {
        ...keywordResult,
        usedAI: false
      };

    } catch (error) {
      console.error('❌ Error in crisis detection:', error.message);
      // Fallback to keyword-based scoring
      return {
        ...this.keywordBasedScoring(content, keywords, exclusionKeywords),
        usedAI: false
      };
    }
  }

  /**
   * AI-powered RSS item analysis using Claude via OpenRouter
   * CONTEXT-AWARE: Focused on Triangle Trade Intelligence user alerts
   */
  async analyzeRSSItemWithAI(title, description) {
    try {
      const prompt = `You are a trade policy analyst for Triangle Trade Intelligence, a Mexico-focused trade compliance platform. Our users are North American importers/exporters who need actionable alerts about trade policy changes.

OUR VALUE PROPOSITION:
- Mexico triangle routing (Canada→Mexico→US) as USMCA advantage
- AI-powered USMCA certificate generation and compliance
- Crisis response positioning (tariff changes, supply chain disruptions)
- Target users: Electronics, automotive, textiles, manufacturing SMBs

RSS ITEM TO ANALYZE:
Title: ${title}
Description: ${description}

CRISIS SCORING (1-10):
1-2: Not relevant (stock market, earnings, historical, opinion pieces)
3-4: Minor mention, no immediate user action needed
5-6: Notable development, worth monitoring for future
7-8: Significant policy change, users should review their trade strategy
9-10: CRITICAL/URGENT - immediate action required (e.g., "Trump announces 100% tariff effective immediately")

ALERT GENERATION FOCUS:
- Score HIGH (7-10) if: China tariff increases, port fees, Section 301, USMCA changes, Mexico routing opportunities
- Score LOW (1-2) if: Stock market news, earnings reports, general economic indicators
- Think: "Would our SMB importers need to change their sourcing/routing strategy because of this?"

KEYWORDS: List specific trade terms (e.g., "tariff", "china", "section 301", "usmca", "port fees", "mexico routing")

AFFECTED COUNTRIES: Use ISO codes (CN=China, MX=Mexico, CA=Canada, US=United States, VN=Vietnam)

AFFECTED INDUSTRIES: Be specific (electronics, automotive, textiles, semiconductors, steel, aluminum)

REASONING: One sentence explaining why this matters to our users (SMB importers using or considering Mexico routing)

EXAMPLES OF HIGH SCORES:
- "US imposes $50/ton port fees on Chinese vessels" → Score 9 (immediate shipping cost impact)
- "Section 301 tariffs increased to 100% on Chinese electronics" → Score 10 (critical sourcing change needed)
- "USMCA regional content threshold increased to 75%" → Score 8 (compliance review needed)

EXAMPLES OF LOW SCORES:
- "China GDP growth slows to 4.5%" → Score 2 (general economic news)
- "Tesla stock drops 5% on earnings miss" → Score 1 (not trade policy)
- "Opinion: Trade war could escalate" → Score 2 (opinion piece, not actionable)

Return ONLY valid JSON in this exact format:
{
  "score": 8,
  "keywords": ["port fees", "china", "shipping", "cost increase"],
  "affected_countries": ["CN", "US"],
  "affected_industries": ["electronics", "automotive", "manufacturing"],
  "reasoning": "New port fees directly increase shipping costs for importers using Chinese vessels, Mexico routing avoids these fees"
}`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "anthropic/claude-haiku-4.5",
          messages: [{
            role: "user",
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse AI response (extract JSON from markdown code blocks if present)
      let analysisResult;
      try {
        // Try to extract JSON from markdown code block
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[1]);
        } else {
          // Try parsing directly
          analysisResult = JSON.parse(aiResponse);
        }
      } catch (parseError) {
        console.error('❌ Failed to parse AI response:', aiResponse);
        throw new Error('Invalid JSON from AI');
      }

      return {
        success: true,
        score: analysisResult.score || 0,
        keywords: analysisResult.keywords || [],
        affected_countries: analysisResult.affected_countries || [],
        affected_industries: analysisResult.affected_industries || [],
        reasoning: analysisResult.reasoning || 'AI analysis completed'
      };

    } catch (error) {
      console.error('❌ AI analysis error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Keyword-based crisis scoring (primary filtering method)
   * OPTIMIZED: High weights for actionable trade policy keywords
   */
  keywordBasedScoring(content, keywords, exclusionKeywords = []) {
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

    // Check for crisis keywords with weighted scoring
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);

        // WEIGHTED SCORING based on actionability for SMB importers
        const keywordLower = keyword.toLowerCase();

        // CRITICAL IMPACT (4 points) - immediate action needed
        if ([
          'section 301', 'port fees', 'port fee', 'shipping fees',
          'trump tariff', 'emergency tariff', 'immediate tariff',
          'retaliatory tariff', 'reciprocal tariff'
        ].includes(keywordLower)) {
          score += 4;
        }
        // HIGH IMPACT (3 points) - requires strategic review
        else if ([
          'china', 'tariff', 'trade war', 'usmca',
          'electronics', 'automotive', 'semiconductor', 'semiconductors',
          'steel', 'aluminum', 'section 232',
          'antidumping', 'countervailing'
        ].includes(keywordLower)) {
          score += 3;
        }
        // MEDIUM IMPACT (2 points) - notable for routing strategy
        else if ([
          'mexico', 'shipping', 'supply chain', 'manufacturing',
          'canada', 'vietnam', 'customs', 'import', 'export',
          'nafta', 'free trade agreement'
        ].includes(keywordLower)) {
          score += 2;
        }
        // STANDARD (1 point) - general trade relevance
        else {
          score += 1;
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

      // Determine alert type based on keywords (must match CHECK constraint)
      const alertType = this.determineAlertType(activity.title, activity.description, crisisDetection.matchedKeywords);

      // Create crisis alert - MATCH ACTUAL DATABASE SCHEMA
      const { data: alert, error: insertError } = await this.supabase
        .from('crisis_alerts')
        .insert({
          alert_type: alertType,  // ✅ Must be one of: tariff_change, trade_disruption, policy_update, crisis_escalation, market_volatility
          source_type: 'rss_feed',
          source_id: feed.id,
          title: activity.title,
          description: activity.description,
          severity_level: severity,
          is_active: true,
          requires_action: severity === 'critical',  // ✅ Correct column name
          affected_hs_codes: this.extractHSCodes(activity.title, activity.description),
          affected_countries: this.extractCountries(activity.title, activity.description),
          confidence_score: Math.min(crisisDetection.score / 10, 1.0)  // ✅ Convert 0-10 scale to 0-1 decimal
        })
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Failed to save crisis alert to database:`, insertError.message);
        throw insertError; // Let outer catch block handle it
      }

      console.log(`🚨 CRISIS ALERT: ${severity.toUpperCase()} - ${activity.title.substring(0, 50)}...`);

      // Send email notifications to affected users
      if (alert && (severity === 'critical' || severity === 'high')) {
        try {
          console.log(`📧 Sending email notifications for ${severity} alert...`);

          // Get users who should receive this alert
          const affectedUsers = await this.emailService.getAffectedUsers(alert, this.supabase);

          if (affectedUsers && affectedUsers.length > 0) {
            console.log(`   Found ${affectedUsers.length} affected users`);

            // Send batch email notifications
            const emailResults = await this.emailService.sendBatchAlerts(alert, affectedUsers);

            const successCount = emailResults.filter(r => r.success).length;
            const failCount = emailResults.filter(r => !r.success).length;

            console.log(`   ✅ Emails sent: ${successCount} successful, ${failCount} failed`);
          } else {
            console.log(`   ⚠️  No affected users found for this alert`);
          }
        } catch (emailError) {
          console.error(`   ❌ Error sending email notifications:`, emailError.message);
          // Don't throw - alert was created successfully, email failure is non-critical
        }
      }

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

  /**
   * Determine alert type based on content (must match database CHECK constraint)
   * Allowed values: tariff_change, trade_disruption, policy_update, crisis_escalation, market_volatility
   */
  determineAlertType(title, description, matchedKeywords) {
    const text = `${title} ${description}`.toLowerCase();
    const keywords = (matchedKeywords || []).map(k => k.toLowerCase());

    // Priority 1: Tariff changes
    if (keywords.some(k => ['tariff', 'duty', 'tax', 'rate'].includes(k)) ||
        text.includes('tariff') || text.includes('duty rate')) {
      return 'tariff_change';
    }

    // Priority 2: Trade disruptions (strikes, port issues, supply chain)
    if (keywords.some(k => ['strike', 'port', 'supply chain', 'disruption'].includes(k)) ||
        text.includes('port strike') || text.includes('supply chain')) {
      return 'trade_disruption';
    }

    // Priority 3: Crisis escalation (trade wars, sanctions)
    if (keywords.some(k => ['crisis', 'trade war', 'sanction', 'embargo'].includes(k)) ||
        text.includes('trade war') || text.includes('sanction')) {
      return 'crisis_escalation';
    }

    // Priority 4: Market volatility (price changes, commodity fluctuations)
    if (keywords.some(k => ['price', 'volatility', 'surge', 'drop'].includes(k)) ||
        text.includes('price surge') || text.includes('market volatility')) {
      return 'market_volatility';
    }

    // Default: Policy updates (USMCA, regulatory changes, federal register)
    return 'policy_update';
  }

  /**
   * Extract HS codes from title and description
   */
  extractHSCodes(title, description) {
    const text = `${title} ${description}`.toUpperCase();
    const hsCodes = [];

    // Match HS codes (4-10 digits, optionally with dots: 7326, 73.26, 7326.90, etc.)
    const hsPattern = /\b(\d{2}\.?\d{2}\.?\d{0,2}\.?\d{0,4})\b/g;
    const matches = text.match(hsPattern);

    if (matches) {
      matches.forEach(match => {
        const cleaned = match.replace(/\./g, '');
        if (cleaned.length >= 4 && cleaned.length <= 10) {
          hsCodes.push(cleaned);
        }
      });
    }

    return [...new Set(hsCodes)]; // Remove duplicates
  }

  /**
   * Extract country codes from title and description
   */
  extractCountries(title, description) {
    const text = `${title} ${description}`;
    const countries = [];

    const countryMap = {
      'china': 'CN',
      'chinese': 'CN',
      'mexico': 'MX',
      'mexican': 'MX',
      'canada': 'CA',
      'canadian': 'CA',
      'united states': 'US',
      'u.s.': 'US',
      'usa': 'US',
      'vietnam': 'VN',
      'vietnamese': 'VN',
      'india': 'IN',
      'indian': 'IN',
      'japan': 'JP',
      'japanese': 'JP',
      'korea': 'KR',
      'korean': 'KR',
      'taiwan': 'TW',
      'thailand': 'TH',
      'germany': 'DE',
      'france': 'FR',
      'italy': 'IT',
      'spain': 'ES',
      'brazil': 'BR',
      'argentina': 'AR'
    };

    for (const [keyword, code] of Object.entries(countryMap)) {
      if (text.toLowerCase().includes(keyword)) {
        countries.push(code);
      }
    }

    return [...new Set(countries)]; // Remove duplicates
  }
}

export default RSSPollingEngine;