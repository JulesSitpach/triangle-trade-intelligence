/**
 * DEALS API - Real Deal Tracking
 * Provides actual deal data for simple dashboard
 * Database-driven deal management for Mexico Trade Bridge
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Query deals from database
    let { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('*')
      .order('value', { ascending: false });

    // If no deals table or no data, return empty data
    if (dealsError || !deals || deals.length === 0) {
      console.log('Deals table empty, returning empty data');

      return res.status(200).json({
        deals: [],
        insights: {
          total_value: 0,
          avg_savings: 0,
          deals_needing_attention: 0,
          high_priority: 0,
          mexico_focused: 0,
          handoff_required: 0
        },
        data_status: {
          source: 'database_empty',
          reason: 'no_deals',
          last_updated: new Date().toISOString(),
          record_count: 0
        }
      });
    }

    // Calculate insights
    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
    const avgSavings = deals.reduce((sum, deal) => sum + deal.savings_percent, 0) / deals.length;

    // Identify deals needing attention
    const today = new Date();
    const dealsNeedingAttention = deals.filter(deal => {
      const lastContact = new Date(deal.last_contact);
      const daysSince = Math.floor((today - lastContact) / (1000 * 60 * 60 * 24));

      return daysSince > 7 ||
             (deal.status === 'Proposal Sent' && daysSince > 3) ||
             deal.needs_handoff;
    });

    const response = {
      success: true,
      data: {
        deals: deals,
        summary: {
          total_deals: deals.length,
          total_value: totalValue,
          average_savings: Math.round(avgSavings * 10) / 10,
          needs_attention: dealsNeedingAttention.length,
          mexico_focused: deals.filter(d => d.mexico_focus).length
        },
        action_items: dealsNeedingAttention.map(deal => ({
          deal_id: deal.id,
          client: deal.client,
          action: deal.next_action,
          priority: deal.priority,
          days_since_contact: Math.floor((today - new Date(deal.last_contact)) / (1000 * 60 * 60 * 24))
        }))
      },
      timestamp: new Date().toISOString()
    };

    console.log('Returning real deals data for simple dashboard');
    res.status(200).json(response);

  } catch (error) {
    console.error('Deals API error:', error);
    res.status(500).json({
      error: 'Failed to load deals data',
      details: error.message
    });
  }
}