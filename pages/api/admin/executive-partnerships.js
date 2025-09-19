/**
 * Executive Partnership Opportunities API
 * Track Canadian executives with significant Mexico operations
 * DATABASE-FIRST IMPLEMENTATION - NO HARDCODED DATA
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
    // Query real database for Canadian executives in Mexico
    const { data: executives, error: execError } = await supabase
      .from('canadian_executives_mexico')
      .select('*')
      .order('investment_value_usd', { ascending: false });

    if (execError) {
      console.error('Database error fetching executives:', execError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch executive data from database'
      });
    }

    // Generate partnership matches from database data
    const partnership_matches = [];
    if (executives?.length > 0) {
      // Create dynamic partnership matches based on executive data
      executives.slice(0, 3).forEach((exec, index) => {
        partnership_matches.push({
          id: `match_${String(index + 1).padStart(3, '0')}`,
          canadian_executive: `${exec.executive_name} (${exec.company})`,
          mexican_partner: exec.mexican_partner || 'TBD',
          opportunity: exec.primary_project || 'Strategic partnership',
          estimated_value: exec.investment_value_usd ? `$${(exec.investment_value_usd / 1000000000).toFixed(1)}B` : 'TBD',
          triangle_benefit: exec.triangle_routing_opportunities?.[0] || 'Regional market access',
          timeline: '6-12 months',
          probability: exec.partnership_potential === 'critical' ? 'high' : exec.partnership_potential
        });
      });
    }

    // Calculate summary from database data
    const totalInvestment = executives?.reduce((sum, exec) => sum + (exec.investment_value_usd || 0), 0) || 0;
    const highPotentialPartnerships = executives?.filter(e => e.partnership_potential === 'high' || e.partnership_potential === 'critical').length || 0;
    const activeOperations = executives?.filter(e => e.contact_status?.includes('active')).length || 0;
    const sectorsRepresented = executives ? [...new Set(executives.flatMap(e => e.sectors || []))] : [];

    res.status(200).json({
      success: true,
      executives: executives || [],
      partnership_matches,
      summary: {
        total_executives: executives?.length || 0,
        high_potential_partnerships: highPotentialPartnerships,
        total_mexico_investment: totalInvestment > 0 ? `$${(totalInvestment / 1000000000).toFixed(1)}B` : '$0',
        active_operations: activeOperations
      },
      sectors_represented: sectorsRepresented,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Executive partnerships API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load executive partnership data'
    });
  }
}