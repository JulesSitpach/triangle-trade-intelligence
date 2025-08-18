/**
 * Trade Alert Monitor - Core Detection System
 * Monitors free government RSS feeds for trade disruptions
 * Manual processing first, automation later with paying customers
 */

import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

const parser = new Parser();

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mrwitpgbcaxgnirqtavt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * FREE Government RSS Feeds - No API Key Required
 * Updated with working feeds as of August 2025
 */
export const governmentFeeds = {
  // US Trade Representative - Primary source for tariff announcements (WORKING)
  ustr: {
    name: 'US Trade Representative',
    url: 'https://ustr.gov/rss.xml',
    keywords: ['tariff', 'duty', 'China', 'Mexico', 'Canada', 'investigation', '301', '232', 'trade war'],
    priority: 'HIGH'
  },
  
  // White House - Trump administration announcements
  whitehouse: {
    name: 'White House Press Releases',
    url: 'https://www.whitehouse.gov/feed/',
    keywords: ['Trump', 'tariff', 'Canada', 'Mexico', 'trade deal', 'USMCA', 'NAFTA', 'China'],
    priority: 'CRITICAL'
  },
  
  // US Customs and Border Protection - Policy changes
  cbp: {
    name: 'US Customs & Border Protection',
    url: 'https://www.cbp.gov/newsroom/feeds/all-news-releases',
    keywords: ['tariff', 'duty', 'trade', 'import', 'Canada', 'Mexico'],
    priority: 'HIGH'
  },
  
  // Commerce Department - Trade investigations and decisions
  commerce: {
    name: 'Commerce Department News',
    url: 'https://www.commerce.gov/news/all-news/feed',
    keywords: ['trade', 'tariff', 'antidumping', 'countervailing', 'China', 'investigation'],
    priority: 'HIGH'
  }
  
  // NOTE: Other feeds currently returning 403/404 errors
  // Will add more working feeds as they become available
  // For MVP, these provide high-quality trade policy announcements
};

/**
 * Alert Detection Keywords
 */
const alertKeywords = {
  // TRUMP CRISIS SPECIFIC KEYWORDS
  trumpCrisis: ['Trump', 'President Trump', 'threatens', 'considers', 'reviewing', 'renegotiate', 'terminate', 'withdraw'],
  
  // Canada-specific crisis keywords
  canadaCrisis: ['Canada', 'Canadian', 'Trudeau', 'bilateral', 'neighbor', 'border', 'lumber', 'energy'],
  
  // Immediate action keywords
  immediate: ['effective immediately', 'emergency', 'suspended', 'banned', 'blocked', 'urgent', 'breaking'],
  
  // Escalation keywords
  escalation: ['retaliation', 'response', 'counter', 'escalate', 'warning', 'threat', 'considers action'],
  
  // Tariff-related
  tariffs: ['tariff', 'duty', 'rate', 'percent', '%', 'antidumping', 'countervailing', 'levy', 'impose'],
  
  // Timeline keywords
  deadlines: ['effective', 'deadline', 'expires', 'beginning', 'starting', 'ending', 'days', 'weeks', 'months'],
  
  // Country keywords (your main trade partners)
  countries: ['China', 'India', 'Vietnam', 'Taiwan', 'Mexico', 'Canada', 'European Union', 'EU', 'North Korea'],
  
  // Product categories matching your database
  products: ['electronic', 'solar', 'panel', 'automotive', 'textile', 'medical', 'steel', 'aluminum', 'lumber', 'energy'],
  
  // USMCA/NAFTA keywords
  tradeAgreements: ['USMCA', 'NAFTA', 'trade agreement', 'trade deal', 'renegotiation', 'withdrawal'],
  
  // Mexico alternative keywords (for opportunity detection)
  mexicoAlternatives: ['Mexico', 'Mexican', 'maquiladora', 'manufacturing', 'alternative', 'nearshoring', 'supply chain']
};

/**
 * Fetch and parse RSS feed
 */
export async function fetchFeed(feedKey) {
  const feed = governmentFeeds[feedKey];
  
  try {
    console.log(`📡 Fetching ${feed.name} RSS feed...`);
    const parsedFeed = await parser.parseURL(feed.url);
    
    return {
      source: feedKey,
      sourceName: feed.name,
      title: parsedFeed.title,
      items: parsedFeed.items || [],
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Failed to fetch ${feed.name}:`, error.message);
    return null;
  }
}

/**
 * Analyze feed item for trade alerts
 */
export function analyzeItem(item, source) {
  const text = `${item.title} ${item.contentSnippet || item.content || ''}`.toLowerCase();
  
  const alert = {
    source: source.source,
    sourceName: source.sourceName,
    title: item.title,
    link: item.link,
    pubDate: item.pubDate || item.isoDate,
    content: item.contentSnippet || item.content || '',
    
    // Detection results
    detected: {
      tariffs: [],
      countries: [],
      products: [],
      deadlines: [],
      urgencyKeywords: []
    },
    
    // Scoring
    relevanceScore: 0,
    urgencyScore: 0
  };
  
  // Check for tariff keywords
  alertKeywords.tariffs.forEach(keyword => {
    if (text.includes(keyword)) {
      alert.detected.tariffs.push(keyword);
      alert.relevanceScore += 10;
    }
  });
  
  // Check for countries
  alertKeywords.countries.forEach(country => {
    if (text.includes(country.toLowerCase())) {
      alert.detected.countries.push(country);
      alert.relevanceScore += 15;
    }
  });
  
  // Check for products
  alertKeywords.products.forEach(product => {
    if (text.includes(product)) {
      alert.detected.products.push(product);
      alert.relevanceScore += 8;
    }
  });
  
  // Check for urgency
  alertKeywords.immediate.forEach(keyword => {
    if (text.includes(keyword)) {
      alert.detected.urgencyKeywords.push(keyword);
      alert.urgencyScore += 20;
    }
  });
  
  // Extract percentages (potential tariff rates)
  const percentages = text.match(/\d+\.?\d*\s*%/g);
  if (percentages) {
    alert.detected.tariffRates = percentages;
    alert.relevanceScore += 20;
  }
  
  // Extract dates
  const dates = extractDates(text);
  if (dates.length > 0) {
    alert.detected.deadlines = dates;
    alert.urgencyScore += 10;
  }
  
  // Extract HS codes
  const hsCodes = extractHSCodes(text);
  if (hsCodes.length > 0) {
    alert.detected.hsCodes = hsCodes;
    alert.relevanceScore += 25;
  }
  
  // Only return if relevant
  if (alert.relevanceScore > 20) {
    return alert;
  }
  
  return null;
}

/**
 * Extract dates from text
 */
function extractDates(text) {
  const dates = [];
  
  // Match patterns like "August 14", "September 1, 2025"
  const monthDatePattern = /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?/gi;
  const matches = text.match(monthDatePattern);
  
  if (matches) {
    dates.push(...matches);
  }
  
  // Match patterns like "08/14/2025", "8-14-25"
  const numericPattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g;
  const numericMatches = text.match(numericPattern);
  
  if (numericMatches) {
    dates.push(...numericMatches);
  }
  
  return dates;
}

/**
 * Extract HS codes from text
 */
function extractHSCodes(text) {
  const codes = [];
  
  // Match patterns like "HS 8542", "8517.12", "chapters 84-85"
  const hsPattern = /(?:hs\s*)?(\d{4}(?:\.\d{2})?(?:\.\d{2})?)|chapters?\s+(\d{2})\s*-\s*(\d{2})/gi;
  const matches = text.matchAll(hsPattern);
  
  for (const match of matches) {
    if (match[1]) {
      codes.push(match[1]);
    }
    if (match[2] && match[3]) {
      codes.push(`Chapters ${match[2]}-${match[3]}`);
    }
  }
  
  return codes;
}

/**
 * Match alert to your trade flows database
 */
export async function matchToDatabase(alert) {
  if (!alert.detected.hsCodes || alert.detected.hsCodes.length === 0) {
    return null;
  }
  
  const matches = [];
  
  for (const hsCode of alert.detected.hsCodes) {
    // Clean HS code
    const cleanCode = hsCode.replace(/[^\d]/g, '').substring(0, 6);
    
    // Query your trade flows
    const { data, error } = await supabase
      .from('trade_flows')
      .select('*')
      .like('hs_code', `${cleanCode}%`)
      .limit(10);
    
    if (data && data.length > 0) {
      matches.push({
        hsCode: cleanCode,
        tradeFlows: data,
        totalValue: data.reduce((sum, flow) => sum + (flow.trade_value || 0), 0),
        affectedRoutes: data.length
      });
    }
  }
  
  return matches.length > 0 ? matches : null;
}

/**
 * Generate triangle routing solutions
 */
export async function generateSolutions(alert, databaseMatches) {
  const solutions = [];
  
  for (const match of databaseMatches) {
    // Find alternative routes through Mexico/Canada
    const mexicoRoute = {
      type: 'triangle_routing',
      route: `${alert.detected.countries[0] || 'Origin'} → Mexico → USA`,
      description: 'USMCA triangle routing via Mexico manufacturing',
      hsCode: match.hsCode,
      estimatedSavings: calculateSavings(match.totalValue, alert.detected.tariffRates),
      urgency: alert.urgencyScore > 30 ? 'HIGH' : 'MEDIUM',
      implementation: 'Contact Mexican manufacturing partners'
    };
    
    const canadaRoute = {
      type: 'triangle_routing',
      route: `${alert.detected.countries[0] || 'Origin'} → Canada → USA`,
      description: 'USMCA triangle routing via Canada distribution',
      hsCode: match.hsCode,
      estimatedSavings: calculateSavings(match.totalValue, alert.detected.tariffRates),
      urgency: alert.urgencyScore > 30 ? 'HIGH' : 'MEDIUM',
      implementation: 'Establish Canadian import entity'
    };
    
    solutions.push(mexicoRoute, canadaRoute);
  }
  
  return solutions;
}

/**
 * Calculate potential savings
 */
function calculateSavings(tradeValue, tariffRates) {
  if (!tariffRates || tariffRates.length === 0) {
    return 0;
  }
  
  // Extract percentage from first rate
  const rateStr = tariffRates[0];
  const rate = parseFloat(rateStr.replace('%', '')) / 100;
  
  return Math.round(tradeValue * rate);
}

/**
 * Main monitoring function (manual for now)
 */
export async function checkAllFeeds() {
  console.log('🚀 Starting Trade Alert Detection...\n');
  
  const allAlerts = [];
  
  for (const feedKey of Object.keys(governmentFeeds)) {
    const feedData = await fetchFeed(feedKey);
    
    if (feedData && feedData.items) {
      console.log(`\n📰 Analyzing ${feedData.items.length} items from ${feedData.sourceName}...`);
      
      for (const item of feedData.items.slice(0, 10)) { // Check latest 10 items
        const alert = analyzeItem(item, feedData);
        
        if (alert) {
          // Match to database
          const dbMatches = await matchToDatabase(alert);
          
          if (dbMatches) {
            alert.databaseMatches = dbMatches;
            alert.solutions = await generateSolutions(alert, dbMatches);
          }
          
          allAlerts.push(alert);
          
          console.log(`\n🔔 ALERT DETECTED: ${alert.title}`);
          console.log(`   Relevance: ${alert.relevanceScore} | Urgency: ${alert.urgencyScore}`);
          console.log(`   Countries: ${alert.detected.countries.join(', ') || 'None'}`);
          console.log(`   Products: ${alert.detected.products.join(', ') || 'None'}`);
          console.log(`   HS Codes: ${alert.detected.hsCodes?.join(', ') || 'None'}`);
          console.log(`   Tariff Rates: ${alert.detected.tariffRates?.join(', ') || 'None'}`);
          
          if (alert.solutions && alert.solutions.length > 0) {
            console.log(`   💡 SOLUTIONS GENERATED: ${alert.solutions.length} triangle routes available`);
          }
        }
      }
    }
  }
  
  console.log(`\n✅ Detection complete. Found ${allAlerts.length} relevant alerts.`);
  
  return allAlerts;
}

// Export for use in API routes
export default {
  governmentFeeds,
  fetchFeed,
  analyzeItem,
  matchToDatabase,
  generateSolutions,
  checkAllFeeds
};