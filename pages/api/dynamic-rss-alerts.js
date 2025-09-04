/**
 * DYNAMIC RSS ALERTS API
 * Generates real-time alerts from actual RSS feeds matched to user's HS codes
 * Replaces hardcoded alerts with live government feed data
 */

import { RSSMonitorService } from '../../lib/services/rss-monitor-service.js';
import { serverDatabaseService } from '../../lib/database/supabase-client.js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';
import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Triangle Intelligence RSS Monitor/1.0'
  }
});

export default async function handler(req, res) {
  const startTime = Date.now();

  try {
    const { hsCode, companyName, includeHistory = false } = req.query;

    if (!hsCode) {
      return res.status(400).json({
        success: false,
        error: 'HS code is required',
        usage: '/api/dynamic-rss-alerts?hsCode=851712&companyName=YourCompany'
      });
    }

    // Initialize RSS monitor service
    const rssMonitor = new RSSMonitorService();
    
    // Get live alerts from RSS feeds
    const liveAlerts = await fetchLiveRSSAlerts(hsCode, companyName);
    
    // Get recent processed alerts from database if requested
    let historicalAlerts = [];
    if (includeHistory === 'true') {
      historicalAlerts = await getHistoricalAlerts(hsCode);
    }

    // Calculate potential impact
    const impactAnalysis = await calculateImpact(hsCode, liveAlerts);

    const responseTime = Date.now() - startTime;
    logInfo('Dynamic RSS alerts generated', { 
      hsCode, 
      alertCount: liveAlerts.length,
      responseTime 
    });

    return res.json({
      success: true,
      hsCode,
      companyName: companyName || 'Unknown Company',
      alerts: liveAlerts,
      historicalAlerts: includeHistory === 'true' ? historicalAlerts : undefined,
      impactAnalysis,
      metadata: {
        generatedAt: new Date().toISOString(),
        responseTimeMs: responseTime,
        isLiveData: true,
        sources: Object.keys(rssMonitor.feeds).length + ' government feeds'
      }
    });

  } catch (error) {
    logError('Dynamic RSS alerts error', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate dynamic alerts',
      message: error.message
    });
  }
}

/**
 * Fetch live alerts from RSS feeds matching the HS code
 */
async function fetchLiveRSSAlerts(hsCode, companyName) {
  const alerts = [];
  const rssMonitor = new RSSMonitorService();
  
  // Priority feeds to check for tariff/trade alerts
  const priorityFeeds = [
    'cbp_news',
    'usitc_tariff_news', 
    'federal_register_cbp',
    'cbsa_news',
    'dof_official'
  ];

  // HS code patterns for matching
  const hsChapter = hsCode.substring(0, 2);
  const hsHeading = hsCode.substring(0, 4);
  const hsSubheading = hsCode.substring(0, 6);
  
  // Keywords to search for in RSS items
  const searchKeywords = [
    hsCode,
    hsChapter,
    hsHeading,
    `chapter ${hsChapter}`,
    'tariff',
    'duty',
    'section 301',
    'antidumping',
    'countervailing',
    'trade remedy',
    'classification',
    'ruling'
  ];

  // Product-specific keywords based on HS chapter
  const productKeywords = getProductKeywords(hsChapter);
  searchKeywords.push(...productKeywords);

  for (const feedKey of priorityFeeds) {
    const feed = rssMonitor.feeds[feedKey];
    if (!feed) continue;

    try {
      // Fetch RSS feed
      const feedData = await parser.parseURL(feed.url);
      
      // Process each item for relevance
      for (const item of feedData.items.slice(0, 20)) { // Check recent 20 items
        const relevanceScore = calculateRelevance(item, searchKeywords, hsCode);
        
        if (relevanceScore > 0.3) { // 30% relevance threshold
          const alert = {
            id: generateAlertId(feedKey, item),
            title: item.title,
            description: item.contentSnippet || item.content || item.description,
            source: feed.description,
            sourceKey: feedKey,
            country: feed.country,
            link: item.link,
            pubDate: item.pubDate || item.isoDate,
            relevanceScore,
            hsCodeMatch: detectHSCodeMatch(item, hsCode),
            alertType: classifyAlertType(item),
            severity: calculateSeverity(item, relevanceScore),
            affectedProducts: extractAffectedProducts(item, hsCode),
            companyImpact: companyName ? assessCompanyImpact(item, companyName) : null
          };
          
          alerts.push(alert);
        }
      }
    } catch (error) {
      logError(`Failed to fetch feed ${feedKey}`, error);
      // Continue with other feeds
    }
  }

  // Sort by relevance and date
  alerts.sort((a, b) => {
    const scoreComp = b.relevanceScore - a.relevanceScore;
    if (Math.abs(scoreComp) > 0.1) return scoreComp;
    return new Date(b.pubDate) - new Date(a.pubDate);
  });

  return alerts.slice(0, 10); // Return top 10 most relevant alerts
}

/**
 * Calculate relevance score for an RSS item
 */
function calculateRelevance(item, keywords, hsCode) {
  let score = 0;
  const text = `${item.title} ${item.description || ''} ${item.content || ''}`.toLowerCase();
  
  // Check for exact HS code match
  if (text.includes(hsCode.toLowerCase())) {
    score += 0.5;
  }
  
  // Check for partial HS code matches
  const hsChapter = hsCode.substring(0, 2);
  const hsHeading = hsCode.substring(0, 4);
  
  if (text.includes(`chapter ${hsChapter}`)) {
    score += 0.3;
  }
  
  if (text.includes(hsHeading)) {
    score += 0.2;
  }
  
  // Check for keyword matches
  for (const keyword of keywords) {
    if (text.includes(keyword.toLowerCase())) {
      score += 0.1;
    }
  }
  
  // Boost for critical terms
  const criticalTerms = ['emergency', 'immediate', 'section 301', 'antidumping', 'countervailing'];
  for (const term of criticalTerms) {
    if (text.includes(term)) {
      score += 0.2;
    }
  }
  
  // Cap at 1.0
  return Math.min(score, 1.0);
}

/**
 * Get product-specific keywords based on HS chapter
 */
function getProductKeywords(hsChapter) {
  const chapterKeywords = {
    '85': ['electronic', 'electrical', 'semiconductor', 'circuit', 'component', 'telephone', 'smartphone'],
    '84': ['machinery', 'computer', 'equipment', 'mechanical'],
    '87': ['vehicle', 'automotive', 'automobile', 'car', 'truck'],
    '39': ['plastic', 'polymer', 'resin'],
    '72': ['steel', 'iron', 'metal'],
    '73': ['steel article', 'iron article', 'metal product'],
    '94': ['furniture', 'lighting', 'prefab'],
    '61': ['apparel', 'clothing', 'garment', 'knitted'],
    '62': ['apparel', 'clothing', 'garment', 'woven'],
    '64': ['footwear', 'shoe', 'boot'],
    '42': ['leather', 'handbag', 'luggage', 'wallet']
  };
  
  return chapterKeywords[hsChapter] || [];
}

/**
 * Detect if item specifically mentions the HS code
 */
function detectHSCodeMatch(item, hsCode) {
  const text = `${item.title} ${item.description || ''}`.toLowerCase();
  
  if (text.includes(hsCode.toLowerCase())) {
    return 'exact';
  }
  
  const hsChapter = hsCode.substring(0, 2);
  const hsHeading = hsCode.substring(0, 4);
  
  if (text.includes(hsHeading.toLowerCase())) {
    return 'heading';
  }
  
  if (text.includes(`chapter ${hsChapter}`)) {
    return 'chapter';
  }
  
  return 'related';
}

/**
 * Classify the type of alert
 */
function classifyAlertType(item) {
  const text = `${item.title} ${item.description || ''}`.toLowerCase();
  
  if (text.includes('section 301')) return 'section_301';
  if (text.includes('antidumping')) return 'antidumping';
  if (text.includes('countervailing')) return 'countervailing';
  if (text.includes('emergency')) return 'emergency';
  if (text.includes('ruling')) return 'ruling';
  if (text.includes('classification')) return 'classification';
  if (text.includes('usmca') || text.includes('nafta')) return 'trade_agreement';
  if (text.includes('tariff')) return 'tariff_change';
  
  return 'general_trade';
}

/**
 * Calculate alert severity
 */
function calculateSeverity(item, relevanceScore) {
  const text = `${item.title} ${item.description || ''}`.toLowerCase();
  
  if (text.includes('emergency') || text.includes('immediate')) {
    return 'critical';
  }
  
  if (text.includes('section 301') || text.includes('antidumping')) {
    return 'high';
  }
  
  if (relevanceScore > 0.7) {
    return 'high';
  }
  
  if (relevanceScore > 0.5) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Extract affected products from the alert
 */
function extractAffectedProducts(item, hsCode) {
  const text = `${item.title} ${item.description || ''}`;
  const products = [];
  
  // Extract HS codes mentioned in the text
  const hsCodePattern = /\b\d{4}(?:\.\d{2})?(?:\.\d{2})?\b/g;
  const matches = text.match(hsCodePattern);
  
  if (matches) {
    products.push(...matches.map(code => ({
      hsCode: code,
      isUserProduct: code === hsCode || code.startsWith(hsCode.substring(0, 4))
    })));
  }
  
  return products;
}

/**
 * Assess impact on specific company
 */
function assessCompanyImpact(item, companyName) {
  const text = `${item.title} ${item.description || ''}`.toLowerCase();
  const companyLower = companyName.toLowerCase();
  
  // Check if company is specifically mentioned
  if (text.includes(companyLower)) {
    return 'direct_mention';
  }
  
  // Check for industry-wide impacts
  if (text.includes('all importers') || text.includes('all exporters')) {
    return 'industry_wide';
  }
  
  return 'potential';
}

/**
 * Generate unique alert ID
 */
function generateAlertId(feedKey, item) {
  const date = new Date(item.pubDate || item.isoDate || Date.now());
  const titleHash = item.title.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '');
  return `${feedKey}_${date.getTime()}_${titleHash}`;
}

/**
 * Get historical alerts from database
 */
async function getHistoricalAlerts(hsCode) {
  try {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await serverDatabaseService.client
      .from('rss_processed_items')
      .select('*')
      .eq('is_relevant', true)
      .ilike('item_description', `%${hsCode}%`)
      .gte('item_date', cutoffDate)
      .order('item_date', { ascending: false })
      .limit(20);
    
    if (error) {
      logError('Failed to fetch historical alerts', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    logError('Error fetching historical alerts', error);
    return [];
  }
}

/**
 * Calculate potential impact of alerts
 */
async function calculateImpact(hsCode, alerts) {
  // Get current tariff rate for the HS code
  const { data: tariffData } = await serverDatabaseService.client
    .from('hs_master_rebuild')
    .select('mfn_rate, usmca_rate')
    .eq('hs_code', hsCode)
    .single();
  
  const currentRate = tariffData?.mfn_rate || 0;
  const usmcaRate = tariffData?.usmca_rate || 0;
  
  // Analyze alerts for potential rate changes
  let maxPotentialIncrease = 0;
  let hasSection301Risk = false;
  let hasAntidumpingRisk = false;
  
  for (const alert of alerts) {
    if (alert.alertType === 'section_301') {
      hasSection301Risk = true;
      maxPotentialIncrease = Math.max(maxPotentialIncrease, 25); // Section 301 typically 25%
    }
    
    if (alert.alertType === 'antidumping') {
      hasAntidumpingRisk = true;
      maxPotentialIncrease = Math.max(maxPotentialIncrease, 50); // AD can be very high
    }
    
    // Extract percentage from text
    const percentMatch = alert.description?.match(/(\d+(?:\.\d+)?)\s*%/);
    if (percentMatch) {
      const rate = parseFloat(percentMatch[1]);
      maxPotentialIncrease = Math.max(maxPotentialIncrease, rate);
    }
  }
  
  return {
    currentMFNRate: currentRate,
    currentUSMCARate: usmcaRate,
    maxPotentialIncrease,
    hasSection301Risk,
    hasAntidumpingRisk,
    riskLevel: maxPotentialIncrease > 20 ? 'high' : maxPotentialIncrease > 10 ? 'medium' : 'low',
    potentialCostIncrease: `${maxPotentialIncrease}%`,
    recommendedAction: maxPotentialIncrease > 15 ? 
      'Consider alternative sourcing or USMCA qualification' : 
      'Monitor situation closely'
  };
}