/**
 * USMCA RENEGOTIATION TRACKER
 * ===========================
 * Monitors for USMCA treaty announcements, negotiation rounds, and updates
 * Creates crisis alerts for significant agreement changes
 * Tracks phases: announcement → negotiation → proposed → signed → effective → sunset
 */

import { createClient } from '@supabase/supabase-js';
import { BaseAgent } from '../agents/base-agent.js';

class USMCARenegotiationTracker {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.agent = new BaseAgent();
  }

  /**
   * Process USMCA-related RSS items and create renegotiation alerts
   */
  async detectUSMCARenegotiations(rssItems) {
    console.log(`🤖 [USMCA] Analyzing ${rssItems.length} items for USMCA renegotiations...`);

    const startTime = Date.now();
    let renegotiationsDetected = 0;
    const errors = [];

    try {
      for (const item of rssItems) {
        try {
          // Check if item is about USMCA, NAFTA, or trade agreement renegotiations
          const isUSMCARelated = this.isUSMCARelated(item);

          if (!isUSMCARelated) {
            continue;
          }

          console.log(`📜 Analyzing USMCA-related item: "${item.title}"`);

          // Use AI to extract renegotiation details
          const renegotiationData = await this.parseUSMCAAnnouncementWithAI(item);

          if (renegotiationData && renegotiationData.is_usmca_relevant) {
            // Check if this is a new or update to existing renegotiation
            const existingAlert = await this.findExistingRenegotiation(
              renegotiationData.agreement_type,
              renegotiationData.phase
            );

            if (!existingAlert || this.isSignificantUpdate(renegotiationData, existingAlert)) {
              // Create or update crisis alert
              await this.createUSMCAAlert(renegotiationData, item);
              renegotiationsDetected++;

              // Find affected users
              await this.notifyAffectedUsers(renegotiationData);
            }
          }
        } catch (err) {
          console.error(`❌ Error processing USMCA item "${item.title}":`, err.message);
          errors.push({
            item_title: item.title,
            error: err.message
          });
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ USMCA renegotiation detection complete:`, {
        renegotiations_detected: renegotiationsDetected,
        duration_ms: duration,
        errors_count: errors.length
      });

      return {
        renegotiations_detected: renegotiationsDetected,
        duration_ms: duration,
        errors: errors.length > 0 ? errors : null
      };

    } catch (error) {
      console.error('❌ USMCA renegotiation tracker failed:', error.message);
      throw error;
    }
  }

  /**
   * Quick check if RSS item might be about USMCA
   */
  isUSMCARelated(item) {
    const keywords = [
      'USMCA',
      'NAFTA',
      'renegotiat',
      'trade agreement',
      'tariff negotiat',
      'Mexico tariff',
      'Canada tariff',
      'rules of origin',
      'originating good',
      'trade pact',
      'commercial agreement'
    ];

    const searchText = `${item.title} ${item.description}`.toLowerCase();
    return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
  }

  /**
   * Use AI to extract USMCA renegotiation details
   */
  async parseUSMCAAnnouncementWithAI(item) {
    try {
      const prompt = `
You are a trade policy expert analyzing announcements about USMCA, NAFTA, or trade agreement updates.

ANNOUNCEMENT:
Title: ${item.title}
Source: ${item.source_url}
Description: ${item.description?.substring(0, 2000)}

TASK:
1. Is this about USMCA/NAFTA renegotiations or updates? (yes/no)
2. If yes, what is the current phase? (announcement, negotiation_round_1-3, proposed, signed, effective, sunset)
3. Which articles/chapters are affected? (e.g., Rules of Origin, Automotive, Agriculture)
4. What is the expected timeline/implementation date?
5. What is the strategic impact for importers/manufacturers?

RESPONSE FORMAT (JSON):
{
  "is_usmca_relevant": boolean,
  "agreement_type": "USMCA" or "CPTPP" or "other_agreement",
  "phase": "announcement|negotiation_round_1|negotiation_round_2|negotiation_round_3|proposed|signed|effective|sunset",
  "affected_articles": ["Rules of Origin", "Automotive", "Digital Trade"],
  "expected_timeline": "2025-12-31" (if known),
  "summary": "Brief description of what changed or is being proposed",
  "strategic_impact": "How this affects US/Canada/Mexico trade relationships and importers",
  "affected_industries": ["automotive", "agriculture", "textiles"],
  "confidence": 0.95
}

If not USMCA-related, return: {"is_usmca_relevant": false}
`;

      const result = await this.agent.execute(prompt, { temperature: 0.2 });

      let renegotiationData = result || {};

      // Fallback parsing if needed
      if (typeof result === 'string') {
        try {
          renegotiationData = JSON.parse(result);
        } catch {
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            renegotiationData = JSON.parse(jsonMatch[0]);
          }
        }
      }

      return renegotiationData?.is_usmca_relevant ? renegotiationData : {};

    } catch (error) {
      console.error(`⚠️ AI parse error for USMCA item:`, error.message);
      return {};
    }
  }

  /**
   * Check if this renegotiation already exists in database
   */
  async findExistingRenegotiation(agreementType, phase) {
    const { data } = await this.supabase
      .from('crisis_alerts')
      .select('*')
      .eq('agreement_type', agreementType)
      .eq('renegotiation_phase', phase)
      .eq('is_active', true)
      .single();

    return data;
  }

  /**
   * Check if this is a significant update (new phase, date change, etc.)
   */
  isSignificantUpdate(newData, existingData) {
    // It's significant if:
    // 1. Phase has progressed
    // 2. Timeline has changed
    // 3. New articles are affected

    if (newData.phase !== existingData.renegotiation_phase) {
      return true; // Phase changed
    }

    if (newData.expected_timeline &&
        newData.expected_timeline !== existingData.expected_timeline) {
      return true; // Timeline changed
    }

    const newArticles = JSON.stringify(newData.affected_articles?.sort());
    const existingArticles = JSON.stringify(existingData.affected_provisions?.sort());

    if (newArticles !== existingArticles) {
      return true; // Affected articles changed
    }

    return false;
  }

  /**
   * Create crisis alert for USMCA renegotiation
   */
  async createUSMCAAlert(renegotiationData, sourceItem) {
    console.log(`🚨 Creating USMCA alert for phase: ${renegotiationData.phase}`);

    const phaseLabels = {
      'announcement': '📢 Announced',
      'negotiation_round_1': '🔄 Round 1 Negotiation',
      'negotiation_round_2': '🔄 Round 2 Negotiation',
      'negotiation_round_3': '🔄 Round 3 Negotiation',
      'proposed': '📋 Proposed',
      'signed': '✅ Signed',
      'effective': '🔔 Now Effective',
      'sunset': '⏰ Sunset Notice'
    };

    const severityMap = {
      'announcement': 'medium',
      'negotiation_round_1': 'medium',
      'negotiation_round_2': 'medium',
      'negotiation_round_3': 'high',
      'proposed': 'high',
      'signed': 'high',
      'effective': 'critical',
      'sunset': 'critical'
    };

    const title = `${renegotiationData.agreement_type} ${phaseLabels[renegotiationData.phase] || 'Update'}`;
    const affectedArticles = (renegotiationData.affected_articles || []).join(', ');

    const description = `
${renegotiationData.summary}

Affected Articles: ${affectedArticles || 'Not specified'}
Strategic Impact: ${renegotiationData.strategic_impact}
${renegotiationData.expected_timeline ? `Expected Timeline: ${renegotiationData.expected_timeline}` : ''}
    `.trim();

    const { error: alertError } = await this.supabase
      .from('crisis_alerts')
      .insert({
        alert_type: 'usmca_renegotiation',
        title: title,
        description: description,
        severity: severityMap[renegotiationData.phase] || 'high',
        affected_hs_codes: [], // USMCA changes affect broad categories
        affected_countries: ['US', 'CA', 'MX'],
        impact_percentage: 0, // Renegotiations are strategic, not tariff-rate specific
        relevant_industries: renegotiationData.affected_industries || [],
        source_url: sourceItem.source_url,
        is_active: true,
        agreement_type: renegotiationData.agreement_type,
        renegotiation_phase: renegotiationData.phase,
        expected_timeline: renegotiationData.expected_timeline
          ? new Date(renegotiationData.expected_timeline)
          : null,
        affected_provisions: renegotiationData.affected_articles || [],
        strategic_impact: renegotiationData.strategic_impact,
        confidence_score: renegotiationData.confidence || 0.95,
        detection_source: 'rss_polling'
      });

    if (alertError) {
      console.error(`❌ Failed to create USMCA alert:`, alertError.message);
    } else {
      console.log(`✅ USMCA alert created for phase: ${renegotiationData.phase}`);
    }
  }

  /**
   * Notify users affected by USMCA renegotiation
   * (All users with USMCA workflows are affected since it's an agreement-wide change)
   */
  async notifyAffectedUsers(renegotiationData) {
    try {
      // Find all users with active USMCA workflows (any user with workflow_completions)
      const { data: workflows } = await this.supabase
        .from('workflow_completions')
        .select('user_id')
        .eq('agreement_type', 'USMCA');

      if (!workflows || workflows.length === 0) {
        console.log('  ℹ️ No users with USMCA workflows found');
        return;
      }

      const uniqueUserIds = [...new Set(workflows.map(w => w.user_id))];
      console.log(`  📧 Notifying ${uniqueUserIds.length} users about ${renegotiationData.agreement_type} update`);

      // Note: Email notification is handled separately by daily digest system
      // This just logs that users should be notified

    } catch (error) {
      console.error('⚠️ Error notifying users about USMCA update:', error.message);
    }
  }
}

export default new USMCARenegotiationTracker();
