/**
 * TARIFF CHANGE DETECTOR
 * =====================
 * Monitors RSS feeds for tariff policy announcements
 * Uses AI to parse documents and extract new Section 301/232 rates
 * Updates database with detected changes
 * Alerts users when rates affecting their products change
 *
 * This is the INTELLIGENCE LAYER that makes real-time Trump tariff tracking work
 */

import { createClient } from '@supabase/supabase-js';
import BaseAgent from '../agents/base-agent.js';

class TariffChangeDetector {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.agent = new BaseAgent();
  }

  /**
   * MAIN WORKFLOW: Detect tariff changes from RSS feeds
   * Called by cron job after RSS feeds are polled
   */
  async detectChangesFromRecentFeeds() {
    console.log('🔍 [TARIFF DETECTOR] Analyzing recent RSS feed items for policy changes...');

    const startTime = Date.now();
    let changesDetected = 0;
    let usersAlerted = 0;
    const errors = [];

    try {
      // 1. Get recent RSS items (last 24 hours)
      const { data: recentItems, error: feedError } = await this.supabase
        .from('rss_feed_activities')
        .select('id, feed_id, title, description, pub_date, source_url')
        .gt('pub_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .is('parsed_tariff_data', null)  // Not yet processed
        .limit(50);

      if (feedError) throw feedError;

      if (!recentItems || recentItems.length === 0) {
        console.log('📡 No new RSS items to analyze');
        return {
          changes_detected: 0,
          users_alerted: 0,
          duration_ms: Date.now() - startTime,
          errors: []
        };
      }

      console.log(`📰 Found ${recentItems.length} recent RSS items to analyze`);

      // 2. For each item, use AI to detect tariff changes
      for (const item of recentItems) {
        try {
          const tariffData = await this.parseItemWithAI(item);

          if (tariffData && Object.keys(tariffData).length > 0) {
            // 3. Compare with current database to detect changes
            const changes = await this.detectChanges(tariffData);

            if (changes.length > 0) {
              changesDetected++;

              // 4. Update database with new rates
              await this.updateTariffRates(changes);

              // 5. Alert affected users
              const alertedCount = await this.alertAffectedUsers(changes);
              usersAlerted += alertedCount;

              // Mark item as processed
              await this.supabase
                .from('rss_feed_activities')
                .update({ parsed_tariff_data: tariffData })
                .eq('id', item.id);
            }
          }
        } catch (err) {
          console.error(`❌ Error processing RSS item "${item.title}":`, err.message);
          errors.push({
            item_id: item.id,
            item_title: item.title,
            error: err.message
          });
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Tariff change detection complete:`, {
        items_analyzed: recentItems.length,
        changes_detected: changesDetected,
        users_alerted: usersAlerted,
        duration_ms: duration,
        errors_count: errors.length
      });

      return {
        changes_detected: changesDetected,
        users_alerted: usersAlerted,
        duration_ms: duration,
        errors: errors.length > 0 ? errors : null
      };

    } catch (error) {
      console.error('❌ Tariff change detector failed:', error.message);
      throw error;
    }
  }

  /**
   * Use AI to parse RSS item and extract tariff changes
   * Handles PDFs, HTML, and plain text announcements
   */
  async parseItemWithAI(item) {
    try {
      console.log(`🤖 [AI PARSE] "${item.title}"`);

      // Build context from RSS item
      const context = `
You are a trade policy expert analyzing tariff announcements.

ANNOUNCEMENT:
Title: ${item.title}
Source: ${item.source_url}
Description: ${item.description?.substring(0, 2000)}

TASK:
Extract any tariff policy changes mentioned:
1. Which HS codes (10-digit) are affected?
2. What are the new Section 301 or Section 232 rates (as percentages)?
3. What is the effective date?
4. Are these increases or decreases?

RESPONSE FORMAT (JSON):
{
  "has_tariff_changes": boolean,
  "section_301_changes": [
    { "hs_code": "8542.31.00", "new_rate": 25, "previous_rate": 25, "effective_date": "2025-10-26" }
  ],
  "section_232_changes": [
    { "hs_code": "7208.90.30", "new_rate": 25, "previous_rate": 0, "effective_date": "2025-10-26" }
  ],
  "confidence": 0.95,
  "summary": "Brief explanation of changes"
}

If no tariff changes detected, return: {"has_tariff_changes": false}
`;

      const result = await this.agent.analyze(context);

      // Parse AI response
      let tariffData = {};
      try {
        tariffData = JSON.parse(result);
      } catch {
        // If not JSON, try to extract JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          tariffData = JSON.parse(jsonMatch[0]);
        }
      }

      return tariffData?.has_tariff_changes ? tariffData : {};

    } catch (error) {
      console.error(`⚠️ AI parse error for "${item.title}":`, error.message);
      return {};
    }
  }

  /**
   * Detect changes by comparing AI-parsed rates with current database
   */
  async detectChanges(tariffData) {
    const changes = [];

    if (tariffData.section_301_changes?.length > 0) {
      for (const change of tariffData.section_301_changes) {
        // Get current rate from database
        const { data: current } = await this.supabase
          .from('tariff_rates_cache')
          .select('section_301')
          .eq('hs_code', change.hs_code)
          .single();

        const currentRate = current?.section_301 || 0;

        // Only log as change if rate actually differs
        if (currentRate !== change.new_rate) {
          changes.push({
            type: 'section_301',
            hs_code: change.hs_code,
            old_rate: currentRate,
            new_rate: change.new_rate,
            effective_date: change.effective_date,
            confidence: tariffData.confidence
          });
        }
      }
    }

    if (tariffData.section_232_changes?.length > 0) {
      for (const change of tariffData.section_232_changes) {
        // Get current rate from database
        const { data: current } = await this.supabase
          .from('tariff_rates_cache')
          .select('section_232')
          .eq('hs_code', change.hs_code)
          .single();

        const currentRate = current?.section_232 || 0;

        if (currentRate !== change.new_rate) {
          changes.push({
            type: 'section_232',
            hs_code: change.hs_code,
            old_rate: currentRate,
            new_rate: change.new_rate,
            effective_date: change.effective_date,
            confidence: tariffData.confidence
          });
        }
      }
    }

    return changes;
  }

  /**
   * Update database with detected tariff rate changes
   */
  async updateTariffRates(changes) {
    console.log(`💾 [UPDATE] Updating ${changes.length} tariff rates in database...`);

    for (const change of changes) {
      try {
        const updateData = {
          [change.type]: change.new_rate,
          last_updated: new Date().toISOString().split('T')[0],
          data_source: 'AI-detected from RSS feeds',
          verified: false,  // Flag for manual verification
          confidence: change.confidence
        };

        const { error } = await this.supabase
          .from('tariff_rates_cache')
          .update(updateData)
          .eq('hs_code', change.hs_code);

        if (error) throw error;

        console.log(`  ✅ ${change.type} ${change.hs_code}: ${change.old_rate}% → ${change.new_rate}%`);

        // Log the change for audit trail
        await this.logTariffChange(change);

      } catch (error) {
        console.error(`  ❌ Failed to update ${change.hs_code}:`, error.message);
      }
    }
  }

  /**
   * Find users affected by tariff changes and send alerts
   */
  async alertAffectedUsers(changes) {
    console.log(`📧 [ALERTS] Checking for affected users...`);

    let alertCount = 0;

    for (const change of changes) {
      try {
        // Find users with products using this HS code
        const { data: workflows } = await this.supabase
          .from('workflow_sessions')
          .select('user_id, id, company_name')
          .contains('enrichment_data', {
            component_origins: [{ hs_code: change.hs_code }]
          });

        if (!workflows || workflows.length === 0) continue;

        // Get unique users
        const uniqueUsers = [...new Set(workflows.map(w => w.user_id))];

        for (const userId of uniqueUsers) {
          try {
            // Get user email
            const { data: user } = await this.supabase
              .auth.admin.getUserById(userId);

            if (user?.email) {
              // Send alert email
              await this.sendTariffChangeAlert(user.email, change, workflows);
              alertCount++;
              console.log(`  ✉️ Alerted ${user.email} about ${change.hs_code}`);
            }
          } catch (err) {
            console.error(`  ⚠️ Could not alert user ${userId}:`, err.message);
          }
        }

      } catch (error) {
        console.error(`⚠️ Error finding affected users for ${change.hs_code}:`, error.message);
      }
    }

    return alertCount;
  }

  /**
   * Send tariff change alert email to user
   */
  async sendTariffChangeAlert(email, change, workflows) {
    try {
      const impact = change.new_rate - change.old_rate;
      const impactDir = impact > 0 ? '📈 INCREASED' : '📉 DECREASED';

      const emailBody = `
Hello,

A tariff rate change affecting your products has been detected:

📊 TARIFF UPDATE
━━━━━━━━━━━━━━━━
Policy Type: ${change.type === 'section_301' ? 'Section 301 (China Tariffs)' : 'Section 232 (Steel/Aluminum)'}
HS Code: ${change.hs_code}
Rate Change: ${change.old_rate}% → ${change.new_rate}% ${impactDir}
Effective Date: ${change.effective_date}
Confidence: ${(change.confidence * 100).toFixed(0)}%

🚨 ACTION REQUIRED
━━━━━━━━━━━━━━━━
Your product workflows may need recalculation:
${workflows.slice(0, 3).map(w => `• ${w.company_name} workflow`).join('\n')}

📋 Next Steps:
1. Log into Triangle Trade Intelligence
2. Review affected workflows
3. Recalculate USMCA analysis for updated tariff rates
4. Verify certificate impacts

Questions? Contact: support@triangle-trade-intelligence.com

---
Triangle Trade Intelligence
Real-time tariff monitoring for USMCA compliance
`;

      // Use Resend to send email (assumes Resend service exists)
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'alerts@triangle-trade-intelligence.com',
          to: email,
          subject: `🚨 Tariff Rate Update: ${change.type === 'section_301' ? 'Section 301' : 'Section 232'} - ${change.hs_code}`,
          html: `<pre>${emailBody}</pre>`
        })
      });

      if (!response.ok) {
        console.error(`Resend API error: ${response.status}`);
      }

    } catch (error) {
      console.error(`Failed to send alert to ${email}:`, error.message);
    }
  }

  /**
   * Log tariff changes for audit trail
   */
  async logTariffChange(change) {
    try {
      await this.supabase
        .from('tariff_sync_log')
        .insert({
          sync_type: 'ai_detected_change',
          hs_codes_updated: 1,
          source: 'AI analysis of RSS feeds',
          status: 'success',
          policy_changes: {
            type: change.type,
            hs_code: change.hs_code,
            old_rate: change.old_rate,
            new_rate: change.new_rate,
            change_amount: change.new_rate - change.old_rate,
            effective_date: change.effective_date,
            confidence: change.confidence,
            detected_at: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Failed to log tariff change:', error.message);
    }
  }
}

export default new TariffChangeDetector();
