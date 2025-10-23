/**
 * High Value Opportunities API
 * Database-driven Mexico trade opportunities tracking
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
    // Query high-value opportunities from database
    const { data: opportunities, error: opportunitiesError } = await supabase
      .from('high_value_opportunities')
      .select('*')
      .order('potential_value', { ascending: false });

    const { data: dealPipeline, error: pipelineError } = await supabase
      .from('deal_pipeline')
      .select('*')
      .order('created_at', { ascending: false });

    // If tables are empty, return empty structure
    if (!opportunities || opportunities.length === 0) {
      console.log('High value opportunities tables empty, returning empty data');

      return res.status(200).json({
        success: true,
        data: {
          mexico_focused: [],
          quarter_pipeline: [],
          big_deals: [],
          priority_clients: []
        },
        data_status: {
          source: 'database_empty',
          reason: 'no_opportunities',
          last_updated: new Date().toISOString(),
          record_count: 0
        },
        timestamp: new Date().toISOString()
      });
    }

    // Process real database data
    const mexicoOpportunities = opportunities.filter(opp =>
      opp.mexico_focus === true ||
      opp.route?.includes('Mexico') ||
      opp.opportunity_type?.includes('mexico')
    );

    const quarterPipeline = dealPipeline?.filter(deal => {
      const closeDate = new Date(deal.estimated_close);
      const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
      const dealQuarter = Math.floor(closeDate.getMonth() / 3) + 1;
      return dealQuarter === currentQuarter;
    }) || [];

    const bigDeals = opportunities.filter(opp => opp.potential_value >= 1000000);

    const priorityClients = opportunities
      .filter(opp => opp.probability >= 70)
      .sort((a, b) => b.potential_value - a.potential_value)
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      data: {
        mexico_focused: mexicoOpportunities,
        quarter_pipeline: quarterPipeline,
        big_deals: bigDeals,
        priority_clients: priorityClients
      },
      data_status: {
        source: 'database',
        last_updated: new Date().toISOString(),
        record_count: opportunities.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('High value opportunities API error:', error);

    // Return empty data on database error
    return res.status(200).json({
      success: true,
      data: {
        mexico_focused: [],
        quarter_pipeline: [],
        big_deals: [],
        priority_clients: []
      },
      data_status: {
        source: 'database_error',
        reason: 'connection_failed',
        error: error.message,
        last_updated: new Date().toISOString(),
        record_count: 0
      },
      timestamp: new Date().toISOString()
    });
  }
}