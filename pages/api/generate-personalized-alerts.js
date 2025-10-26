/**
 * GENERATE PERSONALIZED ALERTS API
 * Filters static policy alerts by user's specific products
 *
 * Instead of showing all 5 educational alerts, only show the ones relevant
 * to the user's industry, sourcing geography, and product characteristics.
 */

import { EDUCATIONAL_ALERTS } from '../../config/educational-alerts.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_profile } = req.body;

    if (!user_profile) {
      return res.status(400).json({ error: 'Missing user_profile', success: false });
    }

    // ✅ TIER-GATING: Personalized alerts are PAID-ONLY feature
    // Free/Trial users get generic educational alerts only (in static config)
    // Personalized filtering based on their products is premium feature
    const subscriptionTier = user_profile?.subscription_tier || 'Trial';
    const isPaidTier = subscriptionTier && ['Premium', 'Professional', 'Enterprise'].includes(subscriptionTier);

    if (!isPaidTier) {
      // Return empty alerts for free users - they should not see personalized content
      // Instead show generic message to upgrade
      return res.status(403).json({
        success: false,
        error: 'UPGRADE_REQUIRED',
        code: 'PERSONALIZED_ALERTS_REQUIRE_PAID_SUBSCRIPTION',
        alerts: [],
        message: 'Personalized alerts are available only with a paid subscription',
        upgrade_message: 'Upgrade to Professional tier to receive alerts tailored to your specific products, suppliers, and destinations',
        required_tier: 'Professional',
        current_tier: subscriptionTier,
        upgrade_url: '/pricing'
      });
    }

    // ========== STEP 1: Score each educational alert for relevance ==========

    const scoredAlerts = EDUCATIONAL_ALERTS.map(alert => {
      let relevance_score = 0;
      let reason_relevant = [];

      // Industry match
      if (alert.industries && alert.industries.length > 0) {
        if (alert.industries.includes(user_profile.industry_sector)) {
          relevance_score += 40;
          reason_relevant.push('matches your industry');
        }
      }

      // Geography match (sourcing)
      if (alert.geography_focus) {
        if (alert.geography_focus.includes(user_profile.supplier_country)) {
          relevance_score += 30;
          reason_relevant.push('affects your suppliers');
        }
      }

      // Product type match
      if (alert.product_categories) {
        const hasMatchingProducts = (user_profile.component_origins || []).some(c =>
          alert.product_categories.includes(c.category) ||
          alert.product_categories.some(cat => c.hs_code?.startsWith(cat.split('*')[0]))
        );

        if (hasMatchingProducts) {
          relevance_score += 30;
          reason_relevant.push('directly affects your products');
        }
      }

      // Destination match (trade flow)
      if (alert.destination_impact && alert.destination_impact.includes(user_profile.destination_country)) {
        relevance_score += 20;
        reason_relevant.push('affects your trade flow');
      }

      return {
        ...alert,
        relevance_score,
        reason_relevant,
        is_relevant: relevance_score >= 40
      };
    });

    // ========== STEP 2: Filter to only relevant alerts ==========

    const relevantAlerts = scoredAlerts
      .filter(a => a.is_relevant)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 3) // Return top 3 most relevant
      .map(a => ({
        theme: a.theme,
        headline: a.headline,
        situation: a.situation,
        financial_impact: a.financial_impact,
        strategic_roadmap: a.strategic_roadmap,
        actions: a.actions,
        relevance_score: a.relevance_score,
        reason_relevant: a.reason_relevant.join(', ')
      }));

    // ========== STEP 3: Fallback to at least one alert if none are relevant ==========

    const returnable_alerts = relevantAlerts.length > 0
      ? relevantAlerts
      : [
          {
            theme: 'General Trade Compliance',
            headline: '📋 Keeping Current with Trade Policy',
            situation: 'Trade policy changes frequently and can affect your supply chain',
            financial_impact: 'Potential cost volatility depending on changes',
            strategic_roadmap: [
              {
                phase: 'Stay Informed',
                actions: ['Monitor USTR announcements', 'Review tariff schedules regularly', 'Subscribe to trade policy alerts']
              }
            ],
            actions: ['Subscribe to tariff alerts on this platform', 'Review your current USMCA qualification monthly'],
            reason_relevant: 'applies to all trade operations'
          }
        ];

    return res.status(200).json({
      success: true,
      alerts: returnable_alerts,
      total_available: EDUCATIONAL_ALERTS.length,
      matched: returnable_alerts.length,
      user_profile: {
        industry: user_profile.industry_sector,
        suppliers: user_profile.supplier_country,
        destination: user_profile.destination_country
      }
    });

  } catch (error) {
    console.error('❌ Alert generation failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
