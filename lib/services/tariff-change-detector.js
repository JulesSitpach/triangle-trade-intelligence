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

            // 4. ✅ FIX (Nov 7): Log specific rate changes to tariff_changes_log
            if (policyData.rate_changes && policyData.rate_changes.length > 0) {
              for (const change of policyData.rate_changes) {
                try {
                  await this.supabase.from('tariff_changes_log').insert({
                    change_type: policyData.policy_type || 'tariff_update',
                    hs_code: change.hs_code,
                    old_rate: change.current_rate || 0,
                    new_rate: change.new_rate,
                    effective_date: policyData.effective_date || null,
                    confidence: policyData.confidence_score || 0.85,
                    source: item.source_url || item.title,
                    is_processed: false
                  });
                  console.log(`  📊 Logged rate change: ${change.hs_code} (${change.current_rate || 0} → ${change.new_rate})`);
                } catch (logError) {
                  console.warn(`  ⚠️ Failed to log rate change for ${change.hs_code}:`, logError.message);
                }
              }
            }

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
   * Extract HS codes using regex patterns (backup for AI)
   */
  extractHSCodesFromText(text) {
    if (!text) return [];

    const hsCodePatterns = [
      /(?:HS|HTS|HTSUS)\s*(?:code|chapter)?[\s:]*(\d{4}\.\d{2}\.\d{2})/gi,  // HS 8542.31.00
      /(?:classification|heading)\s*(\d{4}\.\d{2})/gi,                       // classification 8542.31
      /\b(\d{4})\.(\d{2})\.(\d{2})\b/g,                                      // 8542.31.00 (standalone)
      /\b(\d{4})\.(\d{2})\b/g,                                               // 8542.31 (4+2 digit)
      /\bchapter\s+(\d{2})\b/gi                                              // Chapter 85
    ];

    const found = new Set();

    for (const pattern of hsCodePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        // Normalize to 8-digit format
        if (match[1] && match[1].includes('.')) {
          found.add(match[1].replace(/\./g, ''));
        } else if (match[1]) {
          // Just a chapter number (e.g., "chapter 85")
          found.add(match[1].padEnd(8, '0'));
        }
      }
    }

    return Array.from(found).filter(code => code.length >= 4);
  }

  /**
   * Use AI to detect policy announcements (simpler - no exact rates required)
   * Just flag what happened, let portfolio briefing evaluate relevance
   * ✅ ENHANCED (Nov 18, 2025): Better HS code extraction with examples
   */
  async parseItemWithAI(item) {
    try {
      console.log(`🤖 [AI DETECT] "${item.title}"`);

      // Pre-extract HS codes with regex as hint for AI
      const extractedCodes = this.extractHSCodesFromText(
        `${item.title} ${item.description}`
      );

      // Build context from RSS item
      const prompt = `You are a STRICT trade policy analyst for Triangle Trade Intelligence. ONLY create alerts for articles with explicit trade/tariff keywords.

OUR VALUE PROPOSITION:
- Mexico triangle routing (Canada→Mexico→US) as USMCA advantage
- AI-powered USMCA certificate generation and compliance
- Target users: North American SMB manufacturers/importers doing cross-border trade

RSS ITEM TO ANALYZE:
Title: ${item.title}
Source: ${item.source_url}
Description: ${item.description?.substring(0, 1500)}
${extractedCodes.length > 0 ? `\n✅ HS CODES DETECTED (regex pre-scan): ${extractedCodes.join(', ')}` : ''}

HS CODE EXTRACTION INSTRUCTIONS (NEW - Nov 18, 2025):
Look for product classification patterns in the text:
- HS/HTS/HTSUS codes: "8542.31.00", "HS 8542.31", "HTSUS 8542.31.00"
- Product chapters: "Chapter 85" → extract as "85000000"
- Classifications: "classification 8542.31" → extract as "85423100"
- Industry mentions: "semiconductors" → infer "8542" chapter
${extractedCodes.length > 0 ? `- Regex found: ${extractedCodes.join(', ')} (verify these are relevant)` : ''}

If NO specific HS codes found BUT article mentions broad product categories (e.g., "steel", "aluminum", "semiconductors"):
- Leave affected_hs_codes: [] empty (blanket alert - applies to all products in that category)
- Set affected_industries: ["base metals"] or ["electronics"] etc.

KEYWORD-DRIVEN SCORING (STRICT):
✅ Score 5+ ONLY if article explicitly contains ONE OR MORE of these keywords:
- "tariff" OR "duty" OR "customs" (specific rate changes)
- "trade" (in context of international commerce, not "trade show")
- "import" OR "export" (cross-border movement)
- "USMCA" OR "CUSMA" OR "T-MEC" OR "NAFTA" (agreements)
- "Section 301" OR "Section 232" OR "anti-dumping" OR "countervailing" (trade remedies)
- "rules of origin" OR "regional value content" OR "RVC" (USMCA compliance)
- "Mexico" + ("manufacturing" OR "labor" OR "nearshoring" OR "supply chain")
- "Canada" + ("trade" OR "supply chain" OR "critical minerals")
- "China" + ("tariff" OR "trade" OR "import") (US trade actions)
- "port fees" OR "border delay" OR "customs procedure" (logistics costs)

❌ If NONE of these keywords present → AUTOMATIC Score 1 (SKIP - don't create alert)

CRITICAL AUTOMATIC REJECTIONS (Score 0):
If title/description contains: postal, disaster, healthcare, TRICARE, Medicare, patent, housing, committee, advisory, tip wage → Score 0 immediately

ALERT SEVERITY MAPPING:
- Score 9-10: CRITICAL (China Section 301 escalation, immediate USMCA threat, port crisis)
- Score 7-8: HIGH (Tariff changes affecting SMB sourcing, Mexico/Canada policy shifts)
- Score 5-6: MEDIUM (Monitoring interest, potential impact on supply chain)
- Score 1-4: SKIP (No alert created)

RESPOND WITH JSON:
{
  "score": 8,
  "is_policy_announcement": true,
  "announcement_type": "tariff_increase|tariff_decrease|policy_change|compliance_change|labor|rvc|cumulation|other",
  "policy_type": "section_301|section_232|antidumping|safeguard|tariff_update",
  "keywords": ["tariff", "china", "semiconductors"],
  "affected_countries": ["CN", "US"],
  "affected_hs_codes": ["8542.31.00"],
  "affected_industries": ["electronics"],
  "summary": "What happened in 1 sentence",
  "reasoning": "Why this matters for Triangle users",
  "confidence": 0.0-1.0,
  "effective_date": "2025-11-15" (if mentioned, else null),
  "rate_changes": [
    {
      "hs_code": "8542.31.00",
      "current_rate": 0.15,
      "new_rate": 0.25,
      "description": "Semiconductor chips"
    }
  ] (ONLY if article mentions SPECIFIC rates changing, else empty array)
}

RATE CHANGES RULES:
- ONLY include rate_changes if article explicitly states "X% to Y%" or "increase from A to B"
- If article just says "tariff increase" without numbers → rate_changes: []
- Each rate should be decimal (0.25 = 25%)
- If current_rate unknown, use 0

If score is 0-4, return: {"score": 1, "is_policy_announcement": false}
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

      // Only return if score is 5 or higher (spec requirement)
      const score = policyData?.score || 0;
      if (score >= 5 && policyData?.is_policy_announcement) {
        // ✅ NEW (Nov 18, 2025): Merge regex-extracted codes with AI-extracted codes
        const aiCodes = policyData.affected_hs_codes || [];
        const allCodes = new Set([...aiCodes, ...extractedCodes]);

        policyData.affected_hs_codes = Array.from(allCodes).filter(code =>
          code && code.length >= 4  // Valid HS codes are at least 4 digits
        );

        // Log extraction success
        if (extractedCodes.length > 0 || aiCodes.length > 0) {
          console.log(`  📋 HS codes found: ${policyData.affected_hs_codes.length} total (AI: ${aiCodes.length}, Regex: ${extractedCodes.length})`);
        }

        return policyData;
      }

      return {}; // Skip if score < 5

    } catch (error) {
      console.error(`⚠️ AI parse error for "${item.title}":`, error.message);
      return {};
    }
  }

  /**
   * Create crisis alert directly from policy announcement
   * Uses AI score to determine severity (per spec lines 172-176)
   */
  async createCrisisAlert(rssItem, policyData) {
    try {
      // Map AI score to severity (per specification)
      const score = policyData?.score || 5;
      let severity = 'medium';
      if (score >= 9) {
        severity = 'critical';
      } else if (score >= 7) {
        severity = 'high';
      } else if (score >= 5) {
        severity = 'medium';
      } else {
        severity = 'low';
      }

      // Fallback type-based severity if no score
      const severityMapFallback = {
        'tariff_increase': 'high',
        'tariff_decrease': 'medium',
        'policy_change': 'medium',
        'compliance_change': 'medium',
        'labor': 'high',
        'rvc': 'high',
        'cumulation': 'medium',
        'other': 'low'
      };

      // Use score-based severity, fallback to type-based
      const finalSeverity = score >= 5 ? severity : (severityMapFallback[policyData.announcement_type] || 'medium');

      const { error } = await this.supabase
        .from('crisis_alerts')
        .insert({
          alert_type: policyData.announcement_type,
          title: rssItem.title,
          description: policyData.summary,
          severity: finalSeverity,
          affected_hs_codes: policyData.affected_hs_codes || [],
          affected_countries: policyData.affected_countries || [],
          relevant_industries: policyData.affected_industries || [],
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
