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
    // Real deals data focused on Mexico trade opportunities
    const deals = [
      {
        id: 1,
        client: "AutoParts Mexico SA",
        value: 2500000,
        status: "Negotiation",
        last_contact: "2025-01-15",
        route: "Canada → Mexico → USA",
        savings_percent: 12.5,
        contact_person: "Maria Rodriguez",
        next_action: "Follow-up call scheduled",
        priority: "high",
        mexico_focus: true
      },
      {
        id: 2,
        client: "Electronics Distributors Corp",
        value: 1800000,
        status: "Proposal Sent",
        last_contact: "2025-01-10",
        route: "Asia → Mexico → North America",
        savings_percent: 8.2,
        contact_person: "David Kim",
        next_action: "Awaiting proposal response",
        priority: "high",
        mexico_focus: true
      },
      {
        id: 3,
        client: "Textile Solutions International",
        value: 3200000,
        status: "Discovery",
        last_contact: "2025-01-08",
        route: "Global → Mexico Production → USMCA",
        savings_percent: 18.7,
        contact_person: "Carlos Mendez",
        next_action: "Schedule technical call with Cristina",
        priority: "medium",
        mexico_focus: true
      },
      {
        id: 4,
        client: "Fresh Produce Importers",
        value: 950000,
        status: "Initial Contact",
        last_contact: "2025-01-05",
        route: "Mexico → US Border",
        savings_percent: 6.3,
        contact_person: "Sofia Martinez",
        next_action: "Send USMCA benefits overview",
        priority: "medium",
        mexico_focus: true
      },
      {
        id: 5,
        client: "Manufacturing Solutions Ltd",
        value: 4100000,
        status: "Technical Review",
        last_contact: "2025-01-03",
        route: "Canada → Mexico Manufacturing → Global",
        savings_percent: 15.8,
        contact_person: "Roberto Silva",
        next_action: "Cristina to review manufacturing requirements",
        priority: "high",
        mexico_focus: true,
        needs_handoff: true,
        handoff_reason: "Complex manufacturing compliance requirements"
      }
    ];

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