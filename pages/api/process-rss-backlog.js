/**
 * PROCESS RSS BACKLOG - One-time processor
 * Converts 2,306 unprocessed RSS items to crisis_alerts
 */

import { createClient } from '@supabase/supabase-js';
import { BaseAgent } from '../../lib/agents/base-agent.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const agent = new BaseAgent();

export default async function handler(req, res) {
  const limit = parseInt(req.query.limit) || 100;
  const startTime = Date.now();
  let processed = 0;
  let alertsCreated = 0;

  try {
    console.log(`🔄 Processing ${limit} unprocessed RSS items...`);

    const { data: items, error: fetchError } = await supabase
      .from('rss_feed_activities')
      .select('id, title, description, pub_date, source_url')
      .is('parsed_tariff_data', null)
      .order('pub_date', { ascending: false })
      .limit(limit);

    if (fetchError) throw fetchError;
    if (!items || items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No unprocessed items',
        processed: 0,
        alerts: 0
      });
    }

    console.log(`📰 Processing ${items.length} items...`);

    for (const item of items) {
      try {
        processed++;

        // Simple AI detection
        const policyText = `${item.title} ${item.description || ''}`.toLowerCase();

        // Check for trade keywords
        const hasTradeKeywords =
          policyText.includes('tariff') ||
          policyText.includes('trade') ||
          policyText.includes('section 301') ||
          policyText.includes('section 232') ||
          policyText.includes('usmca') ||
          policyText.includes('duty') ||
          policyText.includes('customs') ||
          policyText.includes('import') ||
          policyText.includes('export');

        if (!hasTradeKeywords) {
          // Mark as processed even if not policy
          await supabase
            .from('rss_feed_activities')
            .update({ parsed_tariff_data: { is_policy: false } })
            .eq('id', item.id);
          continue;
        }

        // Extract countries (simple pattern matching)
        const countries = [];
        if (policyText.includes('china') || policyText.includes('chinese')) countries.push('CN');
        if (policyText.includes('mexico') || policyText.includes('mexican')) countries.push('MX');
        if (policyText.includes('canada') || policyText.includes('canadian')) countries.push('CA');
        if (policyText.includes('vietnam')) countries.push('VN');
        if (policyText.includes('india')) countries.push('IN');
        if (policyText.includes('steel')) countries.push('STEEL_RELATED');

        // Determine severity
        let severity = 'medium';
        if (policyText.includes('section 301') || policyText.includes('section 232')) severity = 'high';
        if (policyText.includes('increase') || policyText.includes('emergency')) severity = 'high';
        if (policyText.includes('suspend') || policyText.includes('ban')) severity = 'critical';

        // Create alert
        const { error: insertError } = await supabase
          .from('crisis_alerts')
          .insert({
            alert_type: severity === 'critical' ? 'emergency_tariff' : 'tariff_announcement',
            title: item.title,
            description: item.description ? item.description.substring(0, 500) : 'Policy announcement detected from RSS feed',
            severity,
            affected_hs_codes: [],
            affected_countries: countries.length > 0 ? countries : [],
            relevant_industries: [],
            is_active: true,
            agreement_type: 'tariff_policy',
            confidence_score: 0.8,
            detection_source: 'rss_polling',
            source_url: item.source_url,
            created_at: new Date().toISOString()
          });

        if (!insertError) {
          alertsCreated++;
          console.log(`  ✅ [${processed}/${items.length}] Alert: ${item.title.substring(0, 50)}`);
        }

        // Mark as processed
        await supabase
          .from('rss_feed_activities')
          .update({ parsed_tariff_data: { is_policy: hasTradeKeywords, processed: true } })
          .eq('id', item.id);

      } catch (err) {
        console.error(`  ⚠️ Item error:`, err.message);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Complete! Processed ${processed} items, created ${alertsCreated} alerts in ${duration}ms`);

    return res.status(200).json({
      success: true,
      processed,
      alerts: alertsCreated,
      duration_ms: duration
    });

  } catch (error) {
    console.error('❌ Failed:', error.message);
    return res.status(500).json({ error: error.message, processed, alerts: alertsCreated });
  }
}
