/**
 * Platform Leads API
 * Database-driven lead generation from workflow completions
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
    // Query workflow completions to generate leads
    let { data: workflows, error: workflowsError } = await supabase
      .from('workflow_completions')
      .select(`
        id,
        company_name,
        user_email,
        business_type,
        trade_volume,
        completion_count,
        last_activity,
        created_at
      `)
      .order('last_activity', { ascending: false })
      .limit(50);

    // If no workflow data, return empty leads
    if (workflowsError || !workflows || workflows.length === 0) {
      console.log('Platform leads table empty, returning empty data');

      return res.status(200).json({
        leads: [],
        summary: {
          total_leads: 0,
          hot_leads: 0,
          warm_leads: 0,
          cold_leads: 0,
          total_trade_volume: 0,
          avg_lead_score: 0
        },
        data_status: {
          source: 'database_empty',
          reason: 'no_workflow_completions',
          last_updated: new Date().toISOString(),
          record_count: 0
        }
      });
    }

    // Process real workflow data into leads
    const leads = workflows.map(workflow => {
      const leadScore = calculateLeadScore(workflow);
      const interestLevel = getInterestLevel(leadScore);
      const status = getLeadStatus(leadScore);

      return {
        id: workflow.id,
        company: workflow.company_name,
        lastActivity: `${workflow.completion_count} workflow${workflow.completion_count > 1 ? 's' : ''} completed`,
        leadScore: leadScore,
        interestLevel: interestLevel,
        lastAccess: formatTimeAgo(workflow.last_activity),
        status: status,
        email: workflow.user_email,
        tradeVolume: workflow.trade_volume || 0,
        businessType: workflow.business_type
      };
    });

    // Calculate summary statistics
    const summary = {
      total_leads: leads.length,
      hot_leads: leads.filter(l => l.status === 'Hot Lead').length,
      warm_leads: leads.filter(l => l.status === 'Warm Lead').length,
      cold_leads: leads.filter(l => l.status === 'Cold Lead').length,
      total_trade_volume: leads.reduce((sum, l) => sum + (l.tradeVolume || 0), 0),
      avg_lead_score: Math.round(leads.reduce((sum, l) => sum + l.leadScore, 0) / leads.length)
    };

    return res.status(200).json({
      leads: leads,
      summary: summary,
      data_status: {
        source: 'database',
        last_updated: new Date().toISOString(),
        record_count: leads.length
      }
    });

  } catch (error) {
    console.error('Platform leads API error:', error);

    return res.status(200).json({
      leads: [],
      summary: {
        total_leads: 0,
        hot_leads: 0,
        warm_leads: 0,
        cold_leads: 0,
        total_trade_volume: 0,
        avg_lead_score: 0
      },
      data_status: {
        source: 'database_error',
        reason: 'connection_failed',
        error: error.message,
        last_updated: new Date().toISOString(),
        record_count: 0
      }
    });
  }
}

// Helper functions for lead scoring
function calculateLeadScore(workflow) {
  let score = 0;

  // Base score from completion count
  score += Math.min(workflow.completion_count * 15, 60);

  // Trade volume bonus
  if (workflow.trade_volume) {
    if (workflow.trade_volume >= 1000000) score += 25;
    else if (workflow.trade_volume >= 500000) score += 15;
    else if (workflow.trade_volume >= 100000) score += 10;
  }

  // Recent activity bonus
  const daysSinceActivity = (new Date() - new Date(workflow.last_activity)) / (1000 * 60 * 60 * 24);
  if (daysSinceActivity <= 1) score += 15;
  else if (daysSinceActivity <= 7) score += 10;
  else if (daysSinceActivity <= 30) score += 5;

  return Math.min(Math.max(score, 0), 100);
}

function getInterestLevel(score) {
  if (score >= 75) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
}

function getLeadStatus(score) {
  if (score >= 75) return 'Hot Lead';
  if (score >= 50) return 'Warm Lead';
  return 'Cold Lead';
}

function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 1) return 'Less than 1 hour ago';
  if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
  return `${Math.floor(diffInHours / 168)} weeks ago`;
}