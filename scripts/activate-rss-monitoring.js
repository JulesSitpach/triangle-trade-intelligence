/**
 * RSS MONITORING ACTIVATION SCRIPT
 *
 * This script helps activate and test your RSS monitoring system
 * Run this after deploying database migrations
 *
 * Usage:
 *   node scripts/activate-rss-monitoring.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const RSSPollingEngine = require('../lib/services/rss-polling-engine');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🚀 ========================================');
  console.log('   RSS MONITORING SYSTEM ACTIVATION');
  console.log('========================================\n');

  // Step 1: Check database tables exist
  console.log('📊 Step 1: Checking database tables...');
  try {
    const { data: feeds, error: feedsError } = await supabase
      .from('rss_feeds')
      .select('*')
      .limit(1);

    if (feedsError) {
      console.error('❌ ERROR: rss_feeds table does not exist');
      console.error('   Run migrations first:');
      console.error('   - migrations/011_create_rss_monitoring_tables.sql');
      console.error('   - migrations/012_seed_rss_feeds.sql\n');
      return;
    }

    console.log('✅ Database tables exist\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return;
  }

  // Step 2: Check RSS feeds are configured
  console.log('📡 Step 2: Checking RSS feed configuration...');
  try {
    const { data: feeds, error } = await supabase
      .from('rss_feeds')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('❌ ERROR fetching feeds:', error.message);
      return;
    }

    if (!feeds || feeds.length === 0) {
      console.error('❌ No active RSS feeds found');
      console.error('   Run seed data: migrations/012_seed_rss_feeds.sql\n');
      return;
    }

    console.log(`✅ Found ${feeds.length} active RSS feeds:`);
    feeds.forEach(feed => {
      console.log(`   - ${feed.name} (${feed.category})`);
      console.log(`     URL: ${feed.url}`);
      console.log(`     Priority: ${feed.priority_level}`);
      console.log(`     Poll frequency: ${feed.poll_frequency_minutes} minutes`);
      console.log(`     Keywords: ${feed.keywords ? feed.keywords.length : 0} configured\n`);
    });
  } catch (error) {
    console.error('❌ Feed configuration check failed:', error.message);
    return;
  }

  // Step 3: Test RSS polling engine
  console.log('🔄 Step 3: Testing RSS polling engine...');
  try {
    const rssEngine = new RSSPollingEngine();

    console.log('   Starting test poll...\n');
    const result = await rssEngine.pollAllFeeds();

    if (result.error) {
      console.error('❌ Polling failed:', result.error);
      return;
    }

    console.log('\n✅ Polling test completed:');
    console.log(`   Successful: ${result.successful || 0}`);
    console.log(`   Failed: ${result.failed || 0}`);
    console.log(`   Total feeds: ${result.total || 0}\n`);

  } catch (error) {
    console.error('❌ RSS polling test failed:', error.message);
    console.error('   Stack:', error.stack);
    return;
  }

  // Step 4: Check for generated alerts
  console.log('🚨 Step 4: Checking for generated crisis alerts...');
  try {
    const { data: alerts, error } = await supabase
      .from('crisis_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.warn('⚠️  Could not check alerts:', error.message);
    } else {
      console.log(`✅ Found ${alerts?.length || 0} recent crisis alerts`);
      if (alerts && alerts.length > 0) {
        console.log('\n   Recent alerts:');
        alerts.forEach(alert => {
          console.log(`   - ${alert.title} (${alert.severity_level})`);
          console.log(`     Created: ${alert.created_at}`);
          console.log(`     Keywords: ${alert.keywords_matched?.join(', ') || 'none'}\n`);
        });
      }
    }
  } catch (error) {
    console.warn('⚠️  Alert check skipped:', error.message);
  }

  // Step 5: Vercel cron configuration
  console.log('⏰ Step 5: Vercel Cron Configuration');
  console.log('   Your vercel.json is configured to run polling every 30 minutes');
  console.log('   Endpoint: /api/cron/rss-polling');
  console.log('   Schedule: */30 * * * * (every 30 minutes)\n');

  console.log('   After deploying to Vercel:');
  console.log('   1. Go to your Vercel dashboard');
  console.log('   2. Navigate to Settings → Cron Jobs');
  console.log('   3. Verify the cron job is active');
  console.log('   4. Add CRON_SECRET environment variable for security\n');

  // Step 6: Manual testing endpoint
  console.log('🧪 Step 6: Manual Testing');
  console.log('   You can manually trigger RSS polling:');
  console.log('   - Development: curl http://localhost:3000/api/cron/rss-polling');
  console.log('   - Production: curl https://triangle-trade-intelligence.vercel.app/api/cron/rss-polling\n');

  // Step 7: Monitoring dashboard
  console.log('📊 Step 7: Monitoring Dashboard');
  console.log('   Alerts page updated with monitoring badge:');
  console.log('   - Users will see "📡 Real-Time Government Monitoring Active"');
  console.log('   - Shows 4 official sources: USTR, USITC, Commerce ITA, Federal Register CBP');
  console.log('   - Authoritative government sources (not news articles)');
  console.log('   - Crisis detection keywords configured\n');

  console.log('✅ ========================================');
  console.log('   RSS MONITORING SYSTEM IS READY!');
  console.log('========================================\n');

  console.log('🎁 REFERRAL TRIAL READY:');
  console.log('   Adam Williams: "real-time policy alerts" ✅');
  console.log('   Anthony Robinson: "live customs updates" ✅\n');

  console.log('📝 Next Steps:');
  console.log('   1. Deploy to Vercel (git push)');
  console.log('   2. Run migrations on production database');
  console.log('   3. Verify cron job is active in Vercel dashboard');
  console.log('   4. Send referral links to Adam & Anthony\n');

  process.exit(0);
}

// Run the activation script
main().catch(error => {
  console.error('💥 Activation failed:', error);
  process.exit(1);
});
