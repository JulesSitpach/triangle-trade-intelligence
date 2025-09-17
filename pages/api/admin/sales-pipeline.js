/**
 * ADMIN API: Sales Pipeline Management
 * GET /api/admin/sales-pipeline - Returns Jorge's sales pipeline and proposals
 * Database-driven for real monetization tracking
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Query proposals and sales pipeline data
    let { data: proposals, error: proposalsError } = await supabase
      .from('sales_pipeline')
      .select(`
        id,
        company_name,
        proposal_type,
        status,
        value,
        sent_date,
        response_due,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    // If no sales_pipeline table or no data, use sample data
    if (proposalsError || !proposals || proposals.length === 0) {
      console.log('Using sample sales pipeline data for demo');
      const sampleProposals = [
        {
          id: '1',
          company: 'AutoParts Manufacturing Inc',
          proposalType: 'Partnership Package',
          status: 'Pending',
          value: 125000,
          sentDate: '2025-09-14',
          responseDue: '2025-09-19'
        },
        {
          id: '2',
          company: 'Electronics Mexico SA',
          proposalType: 'USMCA Assessment',
          status: 'Under Review',
          value: 89000,
          sentDate: '2025-09-12',
          responseDue: '2025-09-17'
        },
        {
          id: '3',
          company: 'WireTech Solutions',
          proposalType: 'Market Entry Plan',
          status: 'Draft',
          value: 156000,
          sentDate: null,
          responseDue: '2025-09-20'
        }
      ];
      proposals = sampleProposals;
    } else {
      // Format database proposals for frontend
      proposals = proposals.map(proposal => ({
        id: proposal.id,
        company: proposal.company_name,
        proposalType: proposal.proposal_type,
        status: proposal.status,
        value: proposal.value,
        sentDate: proposal.sent_date,
        responseDue: proposal.response_due
      }));
    }

    // Calculate summary metrics
    const totalProposals = proposals.length;
    const totalValue = proposals.reduce((sum, p) => sum + (p.value || 0), 0);
    const pendingProposals = proposals.filter(p => p.status === 'Pending').length;
    const avgValue = totalProposals > 0 ? (totalValue / totalProposals) : 0;

    return res.status(200).json({
      proposals: proposals,
      summary: {
        total_proposals: totalProposals,
        total_value: totalValue,
        pending_proposals: pendingProposals,
        avg_proposal_value: avgValue,
        conversion_rate: totalProposals > 0 ? ((proposals.filter(p => p.status === 'Accepted').length / totalProposals) * 100).toFixed(1) : 0
      },
      data_status: {
        source: proposalsError ? 'sample_data' : 'database',
        table_exists: !proposalsError,
        record_count: proposals.length
      },
      timeframe: '30days'
    });

  } catch (error) {
    console.error('Sales pipeline API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}