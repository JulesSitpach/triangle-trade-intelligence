/**
 * Apply Migration 021: Add Al Jazeera RSS Feed
 * Run with: node scripts/apply-migration-021.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('🚀 Applying Migration 021: Add Al Jazeera RSS Feed\n');

    // Insert Al Jazeera feed
    const { data, error } = await supabase
      .from('rss_feeds')
      .insert({
        name: 'Al Jazeera - International Trade',
        url: 'https://www.aljazeera.com/xml/rss/all.xml',
        category: 'news',
        description: 'Al Jazeera international coverage of global trade, tariffs, and economic policy',
        is_active: true,
        priority_level: 'medium',
        poll_frequency_minutes: 60,
        keywords: [
          // US Trade Policy
          'us trade', 'us tariff', 'trump tariff', 'biden trade',
          'section 301', 'trade war', 'trade dispute',

          // International trade agreements
          'trade agreement', 'free trade', 'tariff', 'tariffs',
          'customs', 'import', 'export', 'trade policy',

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
          'latin america trade', 'africa trade'
        ],
        exclusion_keywords: [
          // Exclude non-trade content
          'sports', 'football', 'soccer', 'cricket',
          'entertainment', 'celebrity', 'film', 'music',

          // Exclude internal politics
          'election campaign', 'political rally',
          'domestic policy',

          // Exclude unrelated conflicts
          'civil war',
          'terrorism', 'extremist',

          // Exclude social issues
          'human rights',
          'religious', 'cultural festival',

          // Exclude regional news not affecting trade
          'local government', 'municipal',
          'education reform', 'school',

          // Financial markets
          'stock market', 'stock exchange',
          'ipo', 'earnings report',
          'cryptocurrency', 'bitcoin'
        ]
      })
      .select();

    if (error) {
      // Check if it's a duplicate URL error
      if (error.code === '23505') {
        console.log('ℹ️  Al Jazeera feed already exists, updating...');

        // Update existing feed
        const { data: updateData, error: updateError } = await supabase
          .from('rss_feeds')
          .update({
            keywords: [
              'us trade', 'us tariff', 'trump tariff', 'biden trade',
              'section 301', 'trade war', 'trade dispute',
              'trade agreement', 'free trade', 'tariff', 'tariffs',
              'customs', 'import', 'export', 'trade policy',
              'china trade', 'mexico trade', 'canada trade',
              'usmca', 'nafta', 'vietnam trade',
              'european union', 'middle east trade',
              'supply chain', 'shipping', 'port', 'logistics',
              'freight', 'container shipping', 'maritime',
              'manufacturing', 'semiconductor', 'electronics',
              'automotive', 'steel', 'aluminum', 'oil',
              'trade sanctions', 'embargo', 'blockade',
              'suez canal', 'strait of hormuz', 'red sea',
              'oil price', 'crude oil', 'natural gas',
              'commodity', 'raw material', 'rare earth',
              'economic sanctions', 'trade ban', 'export control',
              'import restriction', 'protectionism',
              'international business', 'multinational',
              'cross-border trade', 'trade route',
              'asia pacific', 'middle east economy',
              'latin america trade', 'africa trade'
            ],
            exclusion_keywords: [
              'sports', 'football', 'soccer', 'cricket',
              'entertainment', 'celebrity', 'film', 'music',
              'election campaign', 'political rally',
              'domestic policy', 'civil war',
              'terrorism', 'extremist', 'human rights',
              'religious', 'cultural festival',
              'local government', 'municipal',
              'education reform', 'school',
              'stock market', 'stock exchange',
              'ipo', 'earnings report',
              'cryptocurrency', 'bitcoin'
            ],
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('url', 'https://www.aljazeera.com/xml/rss/all.xml')
          .select();

        if (updateError) {
          throw updateError;
        }

        console.log('✅ Al Jazeera feed updated successfully');
      } else {
        throw error;
      }
    } else {
      console.log('✅ Al Jazeera feed added successfully');
    }

    // Get total active feed count
    const { data: feeds, error: countError } = await supabase
      .from('rss_feeds')
      .select('name, category, priority_level')
      .eq('is_active', true)
      .order('priority_level', { ascending: true });

    if (!countError && feeds) {
      console.log('\n📡 Active RSS Feeds:');
      feeds.forEach((feed, index) => {
        console.log(`   ${index + 1}. ${feed.name} (${feed.category} - ${feed.priority_level})`);
      });
      console.log(`\n✅ Total active feeds: ${feeds.length}`);
    }

    console.log('\n🌍 Geographic Coverage:');
    console.log('   North America: USTR, USITC, Commerce, CBP');
    console.log('   Europe: Financial Times');
    console.log('   Global: Al Jazeera (Middle East, Asia-Pacific, Latin America)');

    console.log('\n✅ Migration 021 completed successfully!\n');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
