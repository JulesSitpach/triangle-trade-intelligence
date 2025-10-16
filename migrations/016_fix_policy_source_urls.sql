-- Fix broken source URLs in tariff_policy_updates table
-- Replace 404 URLs with actual working government press release pages

UPDATE tariff_policy_updates
SET
  source_url = 'https://ustr.gov/about-us/policy-offices/press-office/press-releases',
  description = 'EXAMPLE POLICY: Section 301 tariffs on Chinese imports increased to 100%. This is a demonstration policy for testing - actual announcements will come from RSS monitoring.',
  admin_notes = 'Seeded example policy. Source URL points to USTR press releases page (working URL). Replace with specific announcement when RSS monitoring detects real policy.'
WHERE title = 'Section 301 China Tariff Increase';

UPDATE tariff_policy_updates
SET
  source_url = 'https://www.trade.gov/press-releases',
  description = 'EXAMPLE POLICY: Port fees increased by 3% for vessels from Chinese-flagged ships. This is a demonstration policy for testing - actual announcements will come from RSS monitoring.',
  admin_notes = 'Seeded example policy. Source URL points to ITA press releases page (working URL). Replace with specific announcement when RSS monitoring detects real policy.'
WHERE title = 'Chinese Ship Port Fee Increase';

UPDATE tariff_policy_updates
SET
  source_url = 'https://www.usitc.gov/press_room/news_release',
  description = 'EXAMPLE POLICY: Investigation into transshipment practices from Vietnam and Thailand with potential 25% tariffs. This is a demonstration policy for testing - actual announcements will come from RSS monitoring.',
  admin_notes = 'Seeded example policy. Source URL points to USITC press releases page (working URL). Replace with specific announcement when RSS monitoring detects real policy.'
WHERE title = 'Vietnam/Thailand Transshipment Investigation';

UPDATE tariff_policy_updates
SET
  source_url = 'https://www.federalregister.gov/agencies/customs-and-border-protection',
  description = 'EXAMPLE POLICY: EU energy crisis affecting manufacturing costs, potential 30% increase in component prices. This is a demonstration policy for testing - actual announcements will come from RSS monitoring.',
  admin_notes = 'Seeded example policy. Source URL points to Federal Register CBP page (working URL). Replace with specific announcement when RSS monitoring detects real policy.'
WHERE title = 'EU Energy Crisis Manufacturing Impact';

-- Also update the source_feed_name to match the actual RSS feeds we're monitoring
UPDATE tariff_policy_updates
SET source_feed_name = 'USTR Press Releases'
WHERE source_url LIKE '%ustr.gov%';

UPDATE tariff_policy_updates
SET source_feed_name = 'Commerce ITA Press Releases'
WHERE source_url LIKE '%trade.gov%';

UPDATE tariff_policy_updates
SET source_feed_name = 'USITC Press Releases'
WHERE source_url LIKE '%usitc.gov%';

UPDATE tariff_policy_updates
SET source_feed_name = 'Federal Register CBP'
WHERE source_url LIKE '%federalregister.gov%';
