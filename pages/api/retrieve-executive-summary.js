/**
 * GET /api/retrieve-executive-summary
 * Retrieve a saved executive summary from database instead of regenerating
 *
 * Query params:
 * - workflow_session_id: Retrieve summary for specific workflow
 * - latest: If true, get most recent summary for user
 *
 * Benefits:
 * - Avoid $0.02 regeneration cost
 * - Ensure all pages show identical analysis
 * - Enable email/SMS sending without regeneration
 * - Create audit trail of what user saw
 */

import { createClient } from '@supabase/supabase-js';
import { protectedApiHandler } from '../../lib/api/apiHandler';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;
    const { workflow_session_id, latest, summary_id } = req.query;

    try {
      let query = supabase
        .from('executive_summaries')
        .select('*')
        .eq('user_id', userId);

      // === CASE 1: Get specific summary by ID ===
      if (summary_id) {
        query = query.eq('id', summary_id);
      }
      // === CASE 2: Get summary for specific workflow ===
      else if (workflow_session_id) {
        query = query.eq('workflow_session_id', workflow_session_id);
      }
      // === CASE 3: Get latest summary ===
      else if (latest === 'true') {
        query = query.order('created_at', { ascending: false }).limit(1);
      } else {
        return res.status(400).json({
          error: 'Must specify workflow_session_id, summary_id, or latest=true'
        });
      }

      const { data: summaries, error } = await query;

      if (error) {
        console.error('Database query error:', error);
        return res.status(500).json({
          error: 'Failed to retrieve summary',
          details: error.message
        });
      }

      const summary = summaries?.[0];

      if (!summary) {
        return res.status(404).json({
          error: 'No summary found',
          hint: 'Generate a summary first by calling /api/executive-trade-alert'
        });
      }

      // === CHECK EXPIRATION ===
      if (summary.expires_at && new Date(summary.expires_at) < new Date()) {
        console.log(`⚠️ Summary expired: ${summary.id}`);
        return res.status(410).json({
          error: 'Summary expired',
          message: 'This summary was generated over 90 days ago. Tariff data has changed.',
          expires_at: summary.expires_at,
          hint: 'Run a fresh analysis to get current rates'
        });
      }

      console.log(`✅ Retrieved executive summary: ${summary.id}`);

      return res.status(200).json({
        success: true,
        summary: {
          id: summary.id,
          user_id: summary.user_id,
          workflow_session_id: summary.workflow_session_id,

          // Context
          company_name: summary.company_name,
          company_country: summary.company_country,
          product_description: summary.product_description,
          hs_code: summary.hs_code,
          destination_country: summary.destination_country,
          annual_trade_volume: summary.annual_trade_volume,

          // USMCA Analysis
          usmca_qualified: summary.usmca_qualified,
          regional_content_percentage: summary.regional_content_percentage,
          threshold_applied: summary.threshold_applied,
          gap_percentage: summary.gap_percentage,
          qualification_rule: summary.qualification_rule,

          // Financial Impact
          annual_tariff_burden: summary.annual_tariff_burden,
          potential_annual_savings: summary.potential_annual_savings,
          savings_percentage: summary.savings_percentage,
          monthly_tariff_burden: summary.monthly_tariff_burden,
          tariff_as_percent_of_volume: summary.tariff_as_percent_of_volume,

          // Strategic Content (the rich data users pay for)
          headline: summary.headline,
          situation_brief: summary.situation_brief,
          executive_summary: summary.executive_summary,
          financial_snapshot: summary.financial_snapshot,
          strategic_roadmap: summary.strategic_roadmap,
          action_this_week: summary.action_this_week,
          recommendations: summary.recommendations,

          // Components
          component_breakdown: summary.component_breakdown,
          critical_components: summary.critical_components,

          // AI Metadata
          ai_confidence: summary.ai_confidence,
          generation_timestamp: summary.generation_timestamp,
          ai_model_used: summary.ai_model_used,
          ai_cost_cents: summary.ai_cost_cents,

          // Timestamps
          created_at: summary.created_at,
          expires_at: summary.expires_at
        }
      });

    } catch (error) {
      console.error('❌ Retrieval error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve summary',
        message: error.message
      });
    }
  }
});
