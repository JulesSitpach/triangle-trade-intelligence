/**
 * Populate Crisis Monitoring RSS Feeds
 * This script populates the rss_feeds table with real trade policy monitoring sources
 * Critical for Triangle Intelligence crisis response positioning
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CRISIS_MONITORING_FEEDS = [
  {
    name: 'US Trade Representative',
    url: 'https://ustr.gov/about-us/policy-offices/press-office/press-releases/rss.xml',
    category: 'government',
    priority_level: 'high',
    check_frequency_minutes: 15,
    keywords: ['tariff', 'trade', 'USMCA', 'China', 'Mexico', 'Canada', 'trade war', 'negotiation'],
    exclusion_keywords: ['sports', 'entertainment'],
    alert_threshold: 1,
    notification_enabled: true,
    max_failures_allowed: 3,
    is_active: true
  },
  {
    name: 'CBP Trade News',
    url: 'https://www.cbp.gov/newsroom/national-media-release/rss',
    category: 'customs',
    priority_level: 'high',
    check_frequency_minutes: 15,
    keywords: ['customs', 'border', 'trade', 'import', 'export', 'classification', 'HS code'],
    exclusion_keywords: ['drugs', 'immigration'],
    alert_threshold: 1,
    notification_enabled: true,
    max_failures_allowed: 3,
    is_active: true
  },
  {
    name: 'Commerce Department Trade',
    url: 'https://www.commerce.gov/tags/trade/feed',
    category: 'government',
    priority_level: 'medium',
    check_frequency_minutes: 30,
    keywords: ['commerce', 'trade', 'international', 'tariff', 'export', 'manufacturing'],
    exclusion_keywords: ['weather', 'census'],
    alert_threshold: 1,
    notification_enabled: true,
    max_failures_allowed: 3,
    is_active: true
  },
  {
    name: 'Reuters Trade News',
    url: 'https://feeds.reuters.com/reuters/businessNews',
    category: 'news',
    priority_level: 'medium',
    check_frequency_minutes: 30,
    keywords: ['trade war', 'tariff', 'import', 'export', 'customs', 'China trade', 'Mexico trade'],
    exclusion_keywords: ['sports', 'entertainment', 'weather'],
    alert_threshold: 2,
    notification_enabled: true,
    max_failures_allowed: 5,
    is_active: true
  },
  {
    name: 'Bloomberg Trade & Economics',
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    category: 'financial',
    priority_level: 'medium',
    check_frequency_minutes: 45,
    keywords: ['trade', 'tariff', 'import', 'market', 'supply chain', 'manufacturing'],
    exclusion_keywords: ['cryptocurrency', 'stocks'],
    alert_threshold: 2,
    notification_enabled: true,
    max_failures_allowed: 5,
    is_active: true
  },
  {
    name: 'World Trade Organization',
    url: 'https://www.wto.org/english/news_e/news_e.rss',
    category: 'international',
    priority_level: 'medium',
    check_frequency_minutes: 60,
    keywords: ['trade dispute', 'WTO', 'multilateral', 'tariff', 'agreement'],
    exclusion_keywords: ['conference', 'meeting'],
    alert_threshold: 1,
    notification_enabled: true,
    max_failures_allowed: 3,
    is_active: true
  },
  {
    name: 'Mexico Economy Ministry',
    url: 'https://www.gob.mx/se/rss',
    category: 'mexico_government',
    priority_level: 'high',
    check_frequency_minutes: 20,
    keywords: ['comercio', 'aranceles', 'TMEC', 'exportación', 'importación', 'Estados Unidos'],
    exclusion_keywords: ['turismo', 'cultura'],
    alert_threshold: 1,
    notification_enabled: true,
    max_failures_allowed: 3,
    is_active: true
  },
  {
    name: 'Canada Global Affairs Trade',
    url: 'https://www.canada.ca/en/global-affairs/news.rss',
    category: 'canada_government',
    priority_level: 'medium',
    check_frequency_minutes: 30,
    keywords: ['trade', 'CUSMA', 'USMCA', 'export', 'business', 'economic'],
    exclusion_keywords: ['consular', 'diplomatic'],
    alert_threshold: 1,
    notification_enabled: true,
    max_failures_allowed: 3,
    is_active: true
  }
];

async function populateCrisisFeeds() {
  console.log('🚨 POPULATING CRISIS MONITORING RSS FEEDS');
  console.log('=========================================');
  console.log('Setting up Triangle Intelligence crisis response monitoring...\n');

  try {
    // Clear existing feeds to avoid duplicates
    console.log('🧹 Clearing existing RSS feeds...');
    const { error: deleteError } = await supabase
      .from('rss_feeds')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn('⚠️ Warning clearing feeds:', deleteError.message);
    }

    // Insert crisis monitoring feeds
    console.log('📡 Inserting crisis monitoring RSS feeds...');
    
    let successCount = 0;
    let errorCount = 0;

    for (const feed of CRISIS_MONITORING_FEEDS) {
      try {
        const { data, error } = await supabase
          .from('rss_feeds')
          .insert(feed)
          .select()
          .single();

        if (error) {
          console.error(`❌ Failed to insert ${feed.name}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ ${feed.name} (${feed.category}) - Priority: ${feed.priority_level}`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error inserting ${feed.name}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 INSERTION SUMMARY:');
    console.log(`✅ Successfully inserted: ${successCount} feeds`);
    console.log(`❌ Failed insertions: ${errorCount} feeds`);

    // Verify feeds were inserted
    console.log('\n🔍 Verifying RSS feeds in database...');
    const { data: verifyFeeds, error: verifyError } = await supabase
      .from('rss_feeds')
      .select('id, name, category, is_active, priority_level')
      .order('priority_level', { ascending: true });

    if (verifyError) {
      console.error('❌ Failed to verify feeds:', verifyError.message);
      return false;
    }

    console.log(`📊 Total feeds in database: ${verifyFeeds.length}`);
    
    verifyFeeds.forEach(feed => {
      console.log(`   • ${feed.name} (${feed.category}) - ${feed.is_active ? '🟢 Active' : '🔴 Inactive'}`);
    });

    // Test one feed to ensure the system works
    console.log('\n🧪 Testing RSS feed API after population...');
    
    const response = await fetch('http://localhost:3000/api/admin/rss-feeds');
    const apiData = await response.json();
    
    console.log(`📡 API Response: ${apiData.rss_feeds?.length || 0} feeds returned`);
    console.log(`🎯 Active feeds: ${apiData.summary?.active || 0}`);
    console.log(`📊 Overall health: ${apiData.summary?.overall_health_percentage || 0}%`);

    if (apiData.rss_feeds && apiData.rss_feeds.length > 0) {
      console.log('\n🎉 RSS FEEDS POPULATION: SUCCESS');
      console.log('✅ Crisis monitoring system is now operational');
      console.log('✅ Triangle Intelligence positioned for crisis intelligence leadership');
      
      return {
        success: true,
        feedsPopulated: successCount,
        activeFeedsAPI: apiData.summary?.active || 0,
        totalFeedsAPI: apiData.rss_feeds?.length || 0
      };
    } else {
      console.log('\n⚠️ RSS FEEDS POPULATION: PARTIAL SUCCESS');
      console.log('✅ Database populated but API returning empty results');
      
      return {
        success: false,
        feedsPopulated: successCount,
        apiIssue: true
      };
    }

  } catch (error) {
    console.error('\n❌ RSS FEEDS POPULATION: FAILED');
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

populateCrisisFeeds().then(result => {
  if (result.success) {
    console.log(`\n🚀 READY FOR PHASE 5: Crisis alerts system is now ${result.activeFeedsAPI > 0 ? 'OPERATIONAL' : 'POPULATED'}`);
    console.log('🎯 Next step: Implement RSS feed polling and alert generation');
  } else {
    console.log('\n🛠️ NEEDS ATTENTION: Crisis monitoring setup requires debugging');
  }
}).catch(console.error);