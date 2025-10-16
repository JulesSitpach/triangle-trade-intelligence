/**
 * Update Al Jazeera RSS Feed - Add "economy" keyword
 * Run with: node scripts/update-aljazeera-keywords.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateKeywords() {
  try {
    console.log('🔄 Updating Al Jazeera RSS feed keywords...\n');

    // Get current feed
    const { data: currentFeed, error: fetchError } = await supabase
      .from('rss_feeds')
      .select('keywords')
      .eq('url', 'https://www.aljazeera.com/xml/rss/all.xml')
      .single();

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📋 Current keywords: ${currentFeed.keywords.length} total`);

    // Add "economy" keyword to the list
    const updatedKeywords = [
      // US Trade Policy
      'us trade', 'us tariff', 'trump tariff', 'biden trade',
      'section 301', 'trade war', 'trade dispute',

      // International trade agreements
      'trade agreement', 'free trade', 'tariff', 'tariffs',
      'customs', 'import', 'export', 'trade policy',

      // Economy keyword (NEW)
      'economy', 'economic', 'economics',

      // Countries and regions
      'china trade', 'mexico trade', 'canada trade',
      'usmca', 'nafta', 'vietnam trade',
      'european union', 'middle east trade',

      // Supply chain and logistics
      'supply chain', 'shipping', 'port', 'logistics',
      'freight', 'container shipping', 'maritime',

      // Economic impact
      'manufacturing', 'semiconductor', 'electronics',
      'automotive', 'steel', 'aluminum', 'oil',

      // Trade disruptions
      'trade sanctions', 'embargo', 'blockade',
      'suez canal', 'strait of hormuz', 'red sea',

      // Energy and commodities
      'oil price', 'crude oil', 'natural gas',
      'commodity', 'raw material', 'rare earth',

      // Geopolitical events affecting trade
      'economic sanctions', 'trade ban', 'export control',
      'import restriction', 'protectionism',

      // Business and economics
      'international business', 'multinational',
      'cross-border trade', 'trade route',

      // Regional trade developments
      'asia pacific', 'middle east economy',
      'latin america trade', 'africa trade',

      // Port fees (NEW - based on recent article)
      'port fees', 'port fee', 'shipping fees'
    ];

    // Update feed
    const { data, error } = await supabase
      .from('rss_feeds')
      .update({
        keywords: updatedKeywords,
        updated_at: new Date().toISOString()
      })
      .eq('url', 'https://www.aljazeera.com/xml/rss/all.xml')
      .select();

    if (error) {
      throw error;
    }

    console.log(`✅ Keywords updated: ${updatedKeywords.length} total`);
    console.log('\n📝 New keywords added:');
    console.log('   - economy, economic, economics');
    console.log('   - port fees, port fee, shipping fees');
    console.log('\n💡 Reason: Economy section has high-quality trade policy coverage');
    console.log('   Example: https://www.aljazeera.com/economy/2025/10/15/us-china-impose-port-fees-is-a-return-to-all-out-trade-war-imminent');

    console.log('\n✅ Update completed successfully!\n');

  } catch (error) {
    console.error('❌ Error updating keywords:', error);
    process.exit(1);
  }
}

updateKeywords();
