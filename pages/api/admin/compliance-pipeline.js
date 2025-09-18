/**
 * ADMIN API: Compliance Pipeline Management
 * GET /api/admin/compliance-pipeline - Returns compliance service opportunities for Cristina
 * Database-driven broker revenue pipeline
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
    // Query users who need compliance services
    let { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        company_name,
        user_email,
        industry,
        trade_volume,
        workflow_completions,
        certificates_generated,
        total_savings,
        last_login,
        created_at
      `)
      .gte('workflow_completions', 1) // Only users with platform activity
      .order('certificates_generated', { ascending: false });

    // If no user data, return empty pipeline
    if (usersError || !users || users.length === 0) {
      console.log('Compliance pipeline table empty, returning empty data');

      return res.status(200).json({
        pipeline: [],
        summary: {
          total_opportunities: 0,
          total_revenue_potential: 0,
          critical_priority: 0,
          ready_for_service: 0
        },
        data_status: {
          source: 'database_empty',
          reason: 'no_user_profiles',
          last_updated: new Date().toISOString(),
          record_count: 0
        }
      });
    }

    // Convert users to compliance pipeline opportunities
    const pipeline = users.map(user => {
      const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
      const certificates = user.certificates_generated || 0;
      const completions = user.workflow_completions || 0;
      const lastLogin = user.last_login ? new Date(user.last_login) : null;
      const daysSinceLogin = lastLogin ? Math.floor((new Date() - lastLogin) / (1000 * 60 * 60 * 24)) : 999;

      // Determine compliance service needed
      let requestType = 'Initial Consultation';
      let estimatedValue = 1500;
      let priority = 'Low';
      let status = 'Prospect Identified';
      let timeline = '2-4 weeks';

      if (certificates > 0 && tradeVolume > 1000000) {
        requestType = 'Full USMCA Certification';
        estimatedValue = Math.floor(tradeVolume * 0.025); // 2.5% of trade volume
        priority = 'Critical';
        status = 'Ready for Service';
        timeline = '24-48 hours';
      } else if (certificates > 0) {
        requestType = 'Certificate Validation';
        estimatedValue = 15000;
        priority = 'High';
        status = daysSinceLogin <= 7 ? 'Ready for Service' : 'Qualification Required';
        timeline = '3-5 business days';
      } else if (completions >= 3) {
        requestType = 'Compliance Assessment';
        estimatedValue = 8500;
        priority = completions >= 5 ? 'High' : 'Medium';
        status = 'Qualification Required';
        timeline = '1-2 weeks';
      } else if (completions >= 1) {
        requestType = 'Documentation Review';
        estimatedValue = 3500;
        priority = daysSinceLogin <= 3 ? 'Medium' : 'Low';
        status = 'Initial Assessment';
        timeline = '1-2 weeks';
      }

      // Adjust priority based on trade volume and activity
      if (tradeVolume > 5000000) priority = 'Critical';
      else if (tradeVolume > 2000000 && priority !== 'Critical') priority = 'High';

      if (daysSinceLogin <= 1 && priority === 'Low') priority = 'Medium';

      const contactReason = `${user.company_name || 'This company'} ${getContactReasonText(requestType)}`;

      return {
        id: user.id,
        company: user.company_name || 'Unknown Company',
        requestType: requestType,
        priority: priority,
        estimatedValue: estimatedValue,
        status: status,
        timeline: timeline,
        contactReason: contactReason,
        email: user.user_email,
        tradeVolume: tradeVolume,
        lastActivity: lastLogin
      };
    });

    // Sort by priority and estimated value
    const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    pipeline.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.estimatedValue - a.estimatedValue;
    });

    // Calculate summary metrics
    const totalOpportunities = pipeline.length;
    const totalRevenuePotential = pipeline.reduce((sum, p) => sum + p.estimatedValue, 0);
    const criticalPriority = pipeline.filter(p => p.priority === 'Critical').length;
    const readyForService = pipeline.filter(p => p.status === 'Ready for Service').length;
    const avgDealSize = totalOpportunities > 0 ? (totalRevenuePotential / totalOpportunities) : 0;

    return res.status(200).json({
      pipeline: pipeline,
      summary: {
        total_opportunities: totalOpportunities,
        total_revenue_potential: totalRevenuePotential,
        critical_priority: criticalPriority,
        ready_for_service: readyForService,
        avg_deal_size: Math.round(avgDealSize)
      },
      data_status: {
        source: 'database',
        table_exists: true,
        record_count: totalOpportunities
      }
    });

  } catch (error) {
    console.error('Compliance pipeline API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

function getContactReasonText(requestType) {
  switch(requestType) {
    case 'Full USMCA Certification':
      return 'needs licensed broker for USMCA certification and customs clearance';
    case 'Certificate Validation':
      return 'requires professional validation of their USMCA certificates';
    case 'Compliance Assessment':
      return 'needs comprehensive compliance review for their trade operations';
    case 'Documentation Review':
      return 'requires broker review of their customs documentation';
    default:
      return 'would benefit from initial compliance consultation';
  }
}