/**
 * Verify Al Jazeera RSS Feed Configuration
 * Run with: node scripts/verify-aljazeera-feed.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyFeed() {
  try {
    console.log('🔍 Verifying Al Jazeera RSS feed configuration...\n');

    // Get feed
    const { data: feed, error } = await supabase
      .from('rss_feeds')
      .select('*')
      .eq('url', 'https://www.aljazeera.com/xml/rss/all.xml')
      .single();

    if (error) {
      throw error;
    }

    console.log('📰 Feed Details:');
    console.log(`   Name: ${feed.name}`);
    console.log(`   Category: ${feed.category}`);
    console.log(`   Priority: ${feed.priority_level}`);
    console.log(`   Poll Frequency: ${feed.poll_frequency_minutes} minutes`);
    console.log(`   Active: ${feed.is_active ? '✅' : '❌'}`);
    console.log(`   Total Keywords: ${feed.keywords.length}`);
    console.log(`   Total Exclusions: ${feed.exclusion_keywords.length}`);

    // Check for key keywords
    console.log('\n🔑 Key Keywords Verification:');
    const keyKeywords = [
      'economy', 'economic', 'economics',
      'port fees', 'port fee', 'shipping fees',
      'trade war', 'tariff', 'china trade',
      'shipping', 'supply chain', 'usmca'
    ];

    keyKeywords.forEach(keyword => {
      const hasKeyword = feed.keywords.includes(keyword);
      console.log(`   ${hasKeyword ? '✅' : '❌'} ${keyword}`);
    });

    console.log('\n📊 Sample Keywords:');
    console.log(`   First 10: ${feed.keywords.slice(0, 10).join(', ')}`);

    console.log('\n🚫 Sample Exclusions:');
    console.log(`   First 10: ${feed.exclusion_keywords.slice(0, 10).join(', ')}`);

    console.log('\n✅ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error verifying feed:', error);
    process.exit(1);
  }
}

verifyFeed();
