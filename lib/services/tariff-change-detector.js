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
import { BaseAgent } from '../agents/base-agent.js';
import { queueEmail } from '../utils/emailQueue.js';

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
    let alertsCreated = 0;
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
          alerts_created: 0,
          duration_ms: Date.now() - startTime,
          errors: []
        };
      }

      console.log(`📰 Found ${recentItems.length} recent RSS items to analyze`);

      // 2. For each item, detect if it's a policy announcement
      for (const item of recentItems) {
        try {
          const policyData = await this.parseItemWithAI(item);

          if (policyData && policyData.is_policy_announcement) {
            alertsCreated++;

            // 3. Create crisis alert directly from announcement
            await this.createCrisisAlert(item, policyData);

            // Mark item as processed
            await this.supabase
              .from('rss_feed_activities')
              .update({ parsed_tariff_data: policyData })
              .eq('id', item.id);

            console.log(`  ✅ Alert created for: ${policyData.summary}`);
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
      console.log(`✅ RSS policy detection complete:`, {
        items_analyzed: recentItems.length,
        alerts_created: alertsCreated,
        duration_ms: duration,
        errors_count: errors.length
      });

      return {
        alerts_created: alertsCreated,
        duration_ms: duration,
        errors: errors.length > 0 ? errors : null
      };

    } catch (error) {
      console.error('❌ Tariff change detector failed:', error.message);
      throw error;
    }
  }

  /**
   * Use AI to detect policy announcements (simpler - no exact rates required)
   * Just flag what happened, let portfolio briefing evaluate relevance
   */
  async parseItemWithAI(item) {
    try {
      console.log(`🤖 [AI DETECT] "${item.title}"`);

      // Build context from RSS item
      const prompt = `
You are a trade policy analyst. Analyze this headline for trade policy announcements.

HEADLINE:
Title: ${item.title}
Source: ${item.source_url}
Description: ${item.description?.substring(0, 1000)}

TASK: Determine if this is a trade policy announcement and what it affects.

RESPOND WITH JSON:
{
  "is_policy_announcement": boolean,
  "announcement_type": "tariff_increase|tariff_decrease|policy_change|compliance_change|labor|rvc|cumulation|other",
  "affected_countries": ["CN", "MX", "CA"],  // Extract from headline
  "affected_hs_codes": ["8542.31.00"],  // Only if explicitly mentioned in headline
  "summary": "What happened in 1 sentence",
  "confidence": 0.0-1.0
}

If NOT a trade policy announcement, return: {"is_policy_announcement": false}
`;

      // Use BaseAgent's execute method
      const result = await this.agent.execute(prompt, { temperature: 0.3 });

      // Parse AI response
      let policyData = result || {};

      if (typeof result === 'string') {
        try {
          policyData = JSON.parse(result);
        } catch {
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            policyData = JSON.parse(jsonMatch[0]);
          }
        }
      }

      return policyData?.is_policy_announcement ? policyData : {};

    } catch (error) {
      console.error(`⚠️ AI parse error for "${item.title}":`, error.message);
      return {};
    }
  }

  /**
   * Create crisis alert directly from policy announcement
   * No rate extraction needed - just flag what happened
   */
  async createCrisisAlert(rssItem, policyData) {
    try {
      const severityMap = {
        'tariff_increase': 'high',
        'tariff_decrease': 'medium',
        'policy_change': 'medium',
        'compliance_change': 'medium',
        'labor': 'high',
        'rvc': 'high',
        'cumulation': 'medium',
        'other': 'low'
      };

      const { error } = await this.supabase
        .from('crisis_alerts')
        .insert({
          alert_type: policyData.announcement_type,
          title: rssItem.title,
          description: policyData.summary,
          severity: severityMap[policyData.announcement_type] || 'medium',
          affected_hs_codes: policyData.affected_hs_codes || [],
          affected_countries: policyData.affected_countries || [],
          relevant_industries: [],  // Let portfolio briefing figure this out
          is_active: true,
          agreement_type: 'policy_announcement',
          confidence_score: policyData.confidence || 0.7,
          detection_source: 'rss_polling',
          source_url: rssItem.source_url
        });

      if (error) throw error;

      console.log(`  🚨 Crisis alert created: ${rssItem.title}`);

    } catch (error) {
      console.error(`  ❌ Failed to create crisis alert:`, error.message);
    }
  }

  /**
   * ✅ CHANGED: Log tariff changes AND create crisis alerts
   * Daily digest cron job (8 AM UTC) will bundle all changes and send 1 email per user
   * Crisis alerts appear in UI immediately for visibility
   */
  async logChangesForDigest(changes) {
    console.log(`📊 [DIGEST] Logging ${changes.length} tariff changes for daily digest...`);

    let affectedUsers = new Set();

    for (const change of changes) {
      try {
        // ========== 3-TIER MATCHING STRATEGY TO FIND AFFECTED USERS ==========

        // TIER 1: Match by HS code (specific product match)
        const { data: hsCodeWorkflows } = await this.supabase
          .from('workflow_sessions')
          .select('user_id, id, company_name, business_type, supplier_country, destination_country, component_origins')
          .or(`hs_code.eq.${change.hs_code},component_origins.cs.${JSON.stringify([{hs_code: change.hs_code}])}`);

        // TIER 2: Match by industry (broad tariff affecting entire sector)
        // Get industry from change metadata or infer from HS code chapter
        const hsChapter = change.hs_code?.substring(0, 2);
        const industryMap = {
          '84': 'machinery',
          '85': 'electronics',
          '87': 'automotive',
          '72': 'steel',
          '76': 'aluminum',
          '61': 'textiles',
          '62': 'textiles'
        };
        const affectedIndustry = industryMap[hsChapter];

        const { data: industryWorkflows } = await this.supabase
          .from('workflow_sessions')
          .select('user_id, id, company_name, business_type, supplier_country, destination_country')
          .eq('business_type', affectedIndustry);

        // TIER 3: Match by country (origin or destination)
        // If Section 301 → Match China suppliers
        // If Section 232 → Match steel/aluminum from any country
        let countryWorkflows = [];
        if (change.type === 'section_301') {
          // Section 301 primarily affects China-origin goods
          const { data: chinaWorkflows } = await this.supabase
            .from('workflow_sessions')
            .select('user_id, id, company_name, business_type, supplier_country, destination_country')
            .or('supplier_country.eq.CN,supplier_country.eq.China');

          countryWorkflows = chinaWorkflows || [];
        } else if (change.type === 'section_232') {
          // Section 232 affects all steel/aluminum imports
          const { data: allImports } = await this.supabase
            .from('workflow_sessions')
            .select('user_id, id, company_name, business_type, supplier_country, destination_country')
            .in('business_type', ['steel', 'aluminum', 'metals']);

          countryWorkflows = allImports || [];
        }

        // Combine all matches (deduplicate by workflow ID)
        const allMatches = [
          ...(hsCodeWorkflows || []),
          ...(industryWorkflows || []),
          ...(countryWorkflows || [])
        ];

        const uniqueWorkflows = Array.from(
          new Map(allMatches.map(w => [w.id, w])).values()
        );

        if (uniqueWorkflows.length === 0) {
          console.log(`  ℹ️ No affected users found for ${change.hs_code}`);
          continue;
        }

        console.log(`  📊 Found ${uniqueWorkflows.length} affected workflows:`);
        console.log(`     - HS code matches: ${hsCodeWorkflows?.length || 0}`);
        console.log(`     - Industry matches (${affectedIndustry}): ${industryWorkflows?.length || 0}`);
        console.log(`     - Country matches: ${countryWorkflows.length}`);

        // Get unique users from matched workflows
        const uniqueUsers = [...new Set(uniqueWorkflows.map(w => w.user_id))];

        // ✅ Add all affected users to set
        uniqueUsers.forEach(userId => affectedUsers.add(userId));

        // ✅ 1. Create crisis alert (visible in UI immediately)
        const severityMap = {
          'section_301': 'high',
          'section_232': 'high',
          'tariff_increase': 'medium',
          'tariff_change': 'medium'
        };

        const alertTitle = `${change.type === 'section_301' ? 'Section 301' : 'Section 232'} Rate Change: ${change.hs_code}`;
        const alertDescription = `Tariff rate updated from ${change.old_rate}% to ${change.new_rate}% effective ${change.effective_date}. This affects ${uniqueWorkflows.length} of your workflows.`;

        const { error: alertError } = await this.supabase
          .from('crisis_alerts')
          .insert({
            alert_type: change.type,
            title: alertTitle,
            description: alertDescription,
            severity: severityMap[change.type] || 'medium',
            affected_hs_codes: [change.hs_code],
            affected_countries: [], // HS code changes affect all countries
            impact_percentage: Math.abs(change.new_rate - change.old_rate),
            relevant_industries: affectedIndustry ? [affectedIndustry] : [],
            is_active: true,
            agreement_type: 'tariff_change',
            confidence_score: change.confidence || 0.95,
            detection_source: 'rss_polling'
          });

        if (alertError) {
          console.error(`  ❌ Failed to create crisis alert for ${change.hs_code}:`, alertError.message);
        } else {
          console.log(`  🚨 Crisis alert created for ${change.hs_code}`);
        }

        // ✅ 2. Log this change for daily digest bundle
        const { error: logError } = await this.supabase
          .from('tariff_changes_log')
          .insert({
            change_type: change.type,
            hs_code: change.hs_code,
            old_rate: change.old_rate,
            new_rate: change.new_rate,
            effective_date: change.effective_date,
            confidence: change.confidence,
            affected_user_count: uniqueUsers.length,
            source: 'rss',
            is_processed: false
          });

        if (logError) {
          console.error(`  ❌ Failed to log tariff change ${change.hs_code}:`, logError.message);
        } else {
          console.log(`  📝 Logged ${change.hs_code}: affects ${uniqueUsers.length} users (will be in daily digest)`);
        }

      } catch (error) {
        console.error(`⚠️ Error finding affected users for ${change.hs_code}:`, error.message);
      }
    }

    return affectedUsers.size;  // Return count of unique affected users
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

      const htmlBody = `<html><body><pre style="font-family: monospace; white-space: pre-wrap; word-wrap: break-word;">${emailBody}</pre></body></html>`;

      // ✅ FIXED: Use queueEmail instead of direct Resend API call
      // This ensures reliable delivery with retry logic, queue management, and monitoring
      const result = await queueEmail({
        to: email,
        subject: `🚨 Tariff Rate Update: ${change.type === 'section_301' ? 'Section 301' : 'Section 232'} - ${change.hs_code}`,
        html: htmlBody,
        text: emailBody,
        emailType: 'tariff_rate_alert',
        priority: 1,  // Highest priority - tariff alerts are time-sensitive
        metadata: {
          change_type: change.type,
          hs_code: change.hs_code,
          old_rate: change.old_rate,
          new_rate: change.new_rate,
          affected_workflows: workflows.length,
          confidence: change.confidence
        }
      });

      if (result.success) {
        console.log(`  ✉️ Alert queued for ${email} (emailId: ${result.emailId})`);
      } else {
        console.error(`  ❌ Failed to queue alert for ${email}:`, result.error);
      }

    } catch (error) {
      console.error(`Failed to queue alert for ${email}:`, error.message);
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
