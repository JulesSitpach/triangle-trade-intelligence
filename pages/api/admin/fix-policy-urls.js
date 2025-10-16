/**
 * POST /api/admin/fix-policy-urls
 * One-time fix for broken source URLs in tariff_policy_updates
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('🔧 Fixing broken source URLs in tariff_policy_updates...');

    const updates = [
      {
        title: 'Section 301 China Tariff Increase',
        source_url: 'https://ustr.gov/about-us/policy-offices/press-office/press-releases',
        source_feed_name: 'USTR Press Releases'
      },
      {
        title: 'Chinese Ship Port Fee Increase',
        source_url: 'https://www.trade.gov/press-releases',
        source_feed_name: 'Commerce ITA Press Releases'
      },
      {
        title: 'Vietnam/Thailand Transshipment Investigation',
        source_url: 'https://www.usitc.gov/press_room/news_release',
        source_feed_name: 'USITC Press Releases'
      },
      {
        title: 'EU Energy Crisis Manufacturing Impact',
        source_url: 'https://www.federalregister.gov/agencies/customs-and-border-protection',
        source_feed_name: 'Federal Register CBP'
      }
    ];

    const results = [];

    for (const update of updates) {
      const { data, error } = await supabase
        .from('tariff_policy_updates')
        .update({
          source_url: update.source_url,
          source_feed_name: update.source_feed_name,
          admin_notes: 'Seeded example policy. Source URL points to working press releases page. Replace with specific announcement when RSS monitoring detects real policy.',
          updated_at: new Date().toISOString()
        })
        .eq('title', update.title)
        .select();

      if (error) {
        console.error(`❌ Failed to update ${update.title}:`, error);
        results.push({ title: update.title, success: false, error: error.message });
      } else {
        console.log(`✅ Updated ${update.title}`);
        results.push({ title: update.title, success: true });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return res.status(200).json({
      success: true,
      message: `Fixed ${successCount} URLs, ${failCount} failed`,
      results: results
    });

  } catch (error) {
    console.error('❌ Error fixing URLs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fix URLs',
      error: error.message
    });
  }
}
