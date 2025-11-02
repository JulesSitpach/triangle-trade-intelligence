/**
 * GENERATE PERSONALIZED ALERTS API
 * Queries real-time crisis_alerts database and filters by user's specific products
 *
 * NEW (Nov 1, 2025): Replaced static EDUCATIONAL_ALERTS config with crisis_alerts database query
 * RSS monitoring populates crisis_alerts table → this endpoint filters by relevance
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_profile } = req.body;

    if (!user_profile) {
      return res.status(400).json({ error: 'Missing user_profile', success: false });
    }

    // ✅ Get subscription tier from database (if authenticated) OR from profile (fallback)
    // Don't use tier-gating - ALL users see real alerts matching their components
    // Tier-gating was blocking Premium users who don't have subscription_tier in their profile object
    let subscriptionTier = user_profile?.subscription_tier || 'Premium'; // Default to Premium for all users

    // Try to get tier from authenticated user's profile in database if available
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split('Bearer ')[1];
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (user && !authError) {
          const { data: dbProfile } = await supabase
            .from('user_profiles')
            .select('subscription_tier')
            .eq('user_id', user.id)
            .single();

          if (dbProfile?.subscription_tier) {
            subscriptionTier = dbProfile.subscription_tier;
          }
        }
      }
    } catch (e) {
      // Fallback to profile provided in request if db lookup fails
      console.warn('⚠️ Could not fetch subscription tier from database, using profile data');
    }

    console.log(`✅ User subscription tier: ${subscriptionTier}`);

    // ========== STEP 1: Query crisis_alerts database ==========

    const { data: crisisAlerts, error: dbError } = await supabase
      .from('crisis_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('❌ Database query failed:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch alerts from database',
        details: dbError.message
      });
    }

    if (!crisisAlerts || crisisAlerts.length === 0) {
      console.log('ℹ️ No active alerts in database');
      return res.status(200).json({
        success: true,
        alerts: [],
        total_available: 0,
        matched: 0,
        message: 'No active alerts at this time'
      });
    }

    console.log(`📊 Found ${crisisAlerts.length} active alerts in database`);

    // ========== STEP 2: Score each alert for relevance to user's profile ==========

    const scoredAlerts = crisisAlerts.map(alert => {
      let relevance_score = 0;
      let reason_relevant = [];

      // INDUSTRY MATCH (+40 points)
      // Check if user's industry is in the alert's relevant_industries array
      if (alert.relevant_industries && alert.relevant_industries.length > 0) {
        const userIndustry = user_profile.industry_sector?.toLowerCase();
        const industryMatch = alert.relevant_industries.some(ind =>
          ind.toLowerCase() === userIndustry
        );

        if (industryMatch) {
          relevance_score += 40;
          reason_relevant.push('matches your industry');
        }
      }

      // GEOGRAPHY MATCH - ORIGIN (+30 points)
      // Check if user's component origins match the alert's affected_countries
      if (alert.affected_countries && alert.affected_countries.length > 0) {
        const componentOrigins = (user_profile.component_origins || []).map(c =>
          c.origin_country?.toUpperCase()
        );

        const originMatch = alert.affected_countries.some(country =>
          componentOrigins.includes(country.toUpperCase())
        );

        if (originMatch) {
          relevance_score += 30;
          reason_relevant.push('affects your supplier countries');
        }
      }

      // PRODUCT MATCH - HS CODE (+30 points)
      // Check if user's component HS codes match the alert's affected_hs_codes
      if (alert.affected_hs_codes && alert.affected_hs_codes.length > 0) {
        const componentHsCodes = (user_profile.component_origins || []).map(c => {
          // Normalize HS codes: remove dots and periods
          const hsCode = (c.hs_code || '').replace(/[.\s]/g, '');
          return hsCode;
        });

        const hsCodeMatch = alert.affected_hs_codes.some(alertHs => {
          const normalizedAlertHs = alertHs.replace(/[.\s]/g, '');
          // Match if component HS code starts with alert HS code (6-digit, 8-digit, 10-digit)
          return componentHsCodes.some(compHs =>
            compHs.startsWith(normalizedAlertHs) || normalizedAlertHs.startsWith(compHs)
          );
        });

        if (hsCodeMatch) {
          relevance_score += 30;
          reason_relevant.push('directly affects your products');
        }
      }

      // DESTINATION MATCH (+20 points)
      // Check if alert affects the user's destination country (for import tariffs)
      if (alert.affected_countries && alert.affected_countries.length > 0) {
        const destinationMatch = alert.affected_countries.some(country =>
          country.toUpperCase() === user_profile.destination_country?.toUpperCase()
        );

        if (destinationMatch) {
          relevance_score += 20;
          reason_relevant.push('affects your import destination');
        }
      }

      return {
        id: alert.id,
        alert_type: alert.alert_type,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        affected_hs_codes: alert.affected_hs_codes,
        affected_countries: alert.affected_countries,
        relevant_industries: alert.relevant_industries,
        impact_percentage: alert.impact_percentage,
        source_url: alert.source_url,
        created_at: alert.created_at,
        relevance_score,
        reason_relevant,
        is_relevant: relevance_score >= 40
      };
    });

    // ========== STEP 3: Filter to only relevant alerts (score >= 40) ==========

    const relevantAlerts = scoredAlerts
      .filter(a => a.is_relevant)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 3); // Return top 3 most relevant

    console.log(`✅ Matched ${relevantAlerts.length} relevant alerts for user (out of ${crisisAlerts.length} total)`);
    console.log('🔍 DEBUG: Alert scoring for user', {
      user_industry: user_profile.industry_sector,
      user_origins: (user_profile.component_origins || []).map(c => c.origin_country),
      alert_scores: scoredAlerts.map(a => ({
        title: a.title,
        score: a.relevance_score,
        is_relevant: a.is_relevant,
        reasons: a.reason_relevant,
        affected_countries: a.affected_countries,
        affected_hs_codes: a.affected_hs_codes
      }))
    });

    // ========== STEP 4: Return results ==========

    return res.status(200).json({
      success: true,
      alerts: relevantAlerts.map(a => ({
        id: a.id,
        alert_type: a.alert_type,
        title: a.title,
        description: a.description,
        severity: a.severity,
        affected_hs_codes: a.affected_hs_codes,
        affected_countries: a.affected_countries,
        relevant_industries: a.relevant_industries,
        impact_percentage: a.impact_percentage,
        source_url: a.source_url,
        created_at: a.created_at,
        relevance_score: a.relevance_score,
        reason_relevant: a.reason_relevant.join(', ')
      })),
      total_available: crisisAlerts.length,
      matched: relevantAlerts.length,
      user_profile: {
        industry: user_profile.industry_sector,
        component_origins: (user_profile.component_origins || []).map(c => c.origin_country),
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
