/**
 * ADMIN API: Platform Leads Management
 * GET /api/admin/platform-leads - Returns qualified leads from platform usage
 * Converts workflow_completions into sales leads for Jorge
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

    // If no workflow data, use sample leads
    if (workflowsError || !workflows || workflows.length === 0) {
      console.log('Using sample platform leads data for demo');
      const sampleLeads = [
        {
          id: '1',
          company: 'NorthTech Industries',
          platformActivity: '15 classifications completed',
          leadScore: 85,
          interestLevel: 'High',
          lastActivity: '2 hours ago',
          status: 'Hot Lead',
          email: 'contact@northtech.com',
          tradeVolume: 2500000
        },
        {
          id: '2',
          company: 'SouthMfg Corporation',
          platformActivity: '8 USMCA assessments',
          leadScore: 72,
          interestLevel: 'Medium',
          lastActivity: '1 day ago',
          status: 'Warm Lead',
          email: 'info@southmfg.com',
          tradeVolume: 1800000
        },
        {
          id: '3',
          company: 'EastAuto Components',
          platformActivity: '3 workflow completions',
          leadScore: 45,
          interestLevel: 'Low',
          lastActivity: '5 days ago',
          status: 'Cold Lead',
          email: 'procurement@eastauto.com',
          tradeVolume: 650000
        }
      ];

      return res.status(200).json({
        leads: sampleLeads,
        summary: {
          total_leads: sampleLeads.length,
          hot_leads: sampleLeads.filter(l => l.status === 'Hot Lead').length,
          warm_leads: sampleLeads.filter(l => l.status === 'Warm Lead').length,
          cold_leads: sampleLeads.filter(l => l.status === 'Cold Lead').length,
          avg_lead_score: 67.3
        },
        data_status: {
          source: 'sample_data',
          table_exists: false,
          record_count: sampleLeads.length
        }
      });
    }

    // Convert workflow completions to sales leads
    const leads = workflows.map(workflow => {
      const completionCount = workflow.completion_count || 1;
      const tradeVolume = parseFloat(workflow.trade_volume?.replace(/[$,]/g, '') || '0');
      const lastActivity = workflow.last_activity ? new Date(workflow.last_activity) : new Date(workflow.created_at);
      const daysSinceActivity = Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24));

      // Calculate lead score based on activity
      let leadScore = 20; // Base score
      if (completionCount >= 5) leadScore += 40;
      else if (completionCount >= 3) leadScore += 30;
      else if (completionCount >= 2) leadScore += 20;

      if (tradeVolume > 5000000) leadScore += 25;
      else if (tradeVolume > 1000000) leadScore += 15;
      else if (tradeVolume > 500000) leadScore += 10;

      if (daysSinceActivity <= 1) leadScore += 15;
      else if (daysSinceActivity <= 7) leadScore += 10;
      else if (daysSinceActivity <= 30) leadScore += 5;

      leadScore = Math.min(leadScore, 100);

      // Determine status and interest level
      let status = 'Cold Lead';
      let interestLevel = 'Low';

      if (leadScore >= 80) {
        status = 'Hot Lead';
        interestLevel = 'High';
      } else if (leadScore >= 60) {
        status = 'Warm Lead';
        interestLevel = 'Medium';
      }

      // Format activity description
      const activityDescription = `${completionCount} workflow${completionCount > 1 ? 's' : ''} completed`;

      // Format last activity time
      let lastActivityText = '';
      if (daysSinceActivity === 0) {
        lastActivityText = 'Today';
      } else if (daysSinceActivity === 1) {
        lastActivityText = '1 day ago';
      } else if (daysSinceActivity <= 7) {
        lastActivityText = `${daysSinceActivity} days ago`;
      } else {
        lastActivityText = lastActivity.toLocaleDateString();
      }

      return {
        id: workflow.id,
        company: workflow.company_name || 'Unknown Company',
        platformActivity: activityDescription,
        leadScore: leadScore,
        interestLevel: interestLevel,
        lastActivity: lastActivityText,
        status: status,
        email: workflow.user_email,
        tradeVolume: tradeVolume
      };
    });

    // Calculate summary metrics
    const totalLeads = leads.length;
    const hotLeads = leads.filter(l => l.status === 'Hot Lead').length;
    const warmLeads = leads.filter(l => l.status === 'Warm Lead').length;
    const coldLeads = leads.filter(l => l.status === 'Cold Lead').length;
    const avgLeadScore = totalLeads > 0 ? (leads.reduce((sum, l) => sum + l.leadScore, 0) / totalLeads).toFixed(1) : 0;

    return res.status(200).json({
      leads: leads,
      summary: {
        total_leads: totalLeads,
        hot_leads: hotLeads,
        warm_leads: warmLeads,
        cold_leads: coldLeads,
        avg_lead_score: parseFloat(avgLeadScore)
      },
      data_status: {
        source: 'database',
        table_exists: true,
        record_count: totalLeads
      }
    });

  } catch (error) {
    console.error('Platform leads API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}