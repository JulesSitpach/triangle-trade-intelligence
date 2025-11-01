require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAlerts() {
  // Check crisis_alerts table
  const { data: alerts, error } = await supabase
    .from('crisis_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`\nTotal Alerts in Database: ${alerts.length}\n`);

  alerts.forEach(a => {
    console.log(`Alert: ${a.title}`);
    console.log(`  Created: ${a.created_at}`);
    console.log(`  HS Codes: ${a.affected_hs_codes || 'NULL (blanket)'}`);
    console.log(`  Countries: ${a.affected_countries}`);
    console.log(`  Industries: ${a.relevant_industries || 'NULL (all)'}`);
    console.log(`  Severity: ${a.severity}`);
    console.log('');
  });

  // Check RSS monitoring
  const { data: rssStats, error: rssError } = await supabase
    .from('rss_feed_monitoring')
    .select('*')
    .order('last_checked', { ascending: false })
    .limit(5);

  if (!rssError && rssStats) {
    console.log(`\nRSS Monitoring Status (last 5 checks):\n`);
    rssStats.forEach(r => {
      console.log(`Feed: ${r.feed_url}`);
      console.log(`  Last Checked: ${r.last_checked}`);
      console.log(`  Total Items: ${r.total_items_found}`);
      console.log(`  New Alerts: ${r.new_alerts_generated}`);
      console.log('');
    });
  }
}

checkAlerts();
