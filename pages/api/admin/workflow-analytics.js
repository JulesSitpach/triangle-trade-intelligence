/**
 * ADMIN API: Workflow Analytics
 * GET /api/admin/workflow-analytics - Returns workflow completion statistics
 * Provides data for the analytics dashboard workflow metrics
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
    // TODO: Add admin authentication check
    
    // Get timeframe from query params (default to 30 days)
    const { timeframe = '30days' } = req.query;
    const daysBack = getDaysFromTimeframe(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Query workflow completions
    const { data: workflows, error: workflowsError } = await supabase
      .from('workflow_completions')
      .select('*')
      .gte('completed_at', startDate.toISOString());

    if (workflowsError && workflowsError.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      console.error('Error fetching workflows:', workflowsError);
      return res.status(500).json({ error: 'Failed to fetch workflow data' });
    }

    // Query certificates generated
    const { data: certificates, error: certificatesError } = await supabase
      .from('certificates_generated')
      .select('*')
      .gte('generated_at', startDate.toISOString());

    if (certificatesError && certificatesError.code !== 'PGRST116') {
      console.error('Error fetching certificates:', certificatesError);
      return res.status(500).json({ error: 'Failed to fetch certificate data' });
    }

    // If tables don't exist yet, return empty state
    const workflowData = workflows || [];
    const certificateData = certificates || [];

    // Calculate workflow analytics
    const analytics = calculateWorkflowAnalytics(workflowData, certificateData, daysBack);

    return res.status(200).json({
      ...analytics,
      timeframe,
      date_range: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      data_status: {
        workflows_table_exists: workflows !== null,
        certificates_table_exists: certificates !== null,
        total_records: workflowData.length + certificateData.length
      }
    });

  } catch (error) {
    console.error('Workflow analytics API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Calculate comprehensive workflow analytics
 */
function calculateWorkflowAnalytics(workflows, certificates, daysBack) {
  const totalWorkflows = workflows.length;
  const certificatesGenerated = certificates.length;
  
  // Calculate completion rate
  const completionRate = totalWorkflows > 0 ? 
    ((certificatesGenerated / totalWorkflows) * 100) : 0;

  // Calculate average workflow completion time
  const workflowsWithTime = workflows.filter(w => w.completion_time_seconds);
  const avgCompletionTime = workflowsWithTime.length > 0 ?
    workflowsWithTime.reduce((sum, w) => sum + w.completion_time_seconds, 0) / workflowsWithTime.length :
    0;

  // Calculate total savings
  const totalSavings = workflows.reduce((sum, w) => sum + (w.savings_amount || 0), 0);

  // Calculate daily trends
  const dailyTrends = calculateDailyTrends(workflows, certificates, daysBack);

  // Calculate workflow types distribution
  const workflowTypes = calculateWorkflowTypes(workflows);

  // Calculate user engagement
  const uniqueUsers = new Set(workflows.map(w => w.user_id)).size;
  const avgWorkflowsPerUser = uniqueUsers > 0 ? totalWorkflows / uniqueUsers : 0;

  // Calculate success metrics
  const successfulWorkflows = workflows.filter(w => w.certificate_generated).length;
  const successRate = totalWorkflows > 0 ? (successfulWorkflows / totalWorkflows) * 100 : 0;

  return {
    // Core metrics
    total_workflows: totalWorkflows,
    workflow_completions: totalWorkflows, // For backwards compatibility
    certificates_generated: certificatesGenerated,
    completion_rate: Math.round(completionRate * 10) / 10,
    
    // Performance metrics
    avg_completion_time_minutes: Math.round((avgCompletionTime / 60) * 10) / 10,
    success_rate: Math.round(successRate * 10) / 10,
    
    // Financial metrics
    total_savings_generated: totalSavings,
    avg_savings_per_workflow: totalWorkflows > 0 ? 
      Math.round((totalSavings / totalWorkflows) * 100) / 100 : 0,
    
    // Engagement metrics
    unique_users: uniqueUsers,
    avg_workflows_per_user: Math.round(avgWorkflowsPerUser * 10) / 10,
    
    // Trends and breakdowns
    daily_trends: dailyTrends,
    workflow_types: workflowTypes,
    
    // Period comparison
    period_summary: {
      days_analyzed: daysBack,
      daily_average_workflows: Math.round((totalWorkflows / daysBack) * 10) / 10,
      daily_average_certificates: Math.round((certificatesGenerated / daysBack) * 10) / 10
    }
  };
}

/**
 * Calculate daily workflow trends
 */
function calculateDailyTrends(workflows, certificates, daysBack) {
  const trends = [];
  
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayWorkflows = workflows.filter(w => 
      w.completed_at.split('T')[0] === dateStr
    );
    
    const dayCertificates = certificates.filter(c => 
      c.generated_at.split('T')[0] === dateStr
    );
    
    trends.push({
      date: dateStr,
      workflows: dayWorkflows.length,
      certificates: dayCertificates.length,
      completion_rate: dayWorkflows.length > 0 ? 
        ((dayCertificates.length / dayWorkflows.length) * 100) : 0,
      savings: dayWorkflows.reduce((sum, w) => sum + (w.savings_amount || 0), 0)
    });
  }
  
  return trends;
}

/**
 * Calculate workflow type distribution
 */
function calculateWorkflowTypes(workflows) {
  const types = {};
  
  workflows.forEach(workflow => {
    const type = workflow.workflow_type || 'usmca_compliance';
    types[type] = (types[type] || 0) + 1;
  });
  
  return Object.entries(types).map(([type, count]) => ({
    type,
    count,
    percentage: workflows.length > 0 ? 
      Math.round((count / workflows.length) * 1000) / 10 : 0
  }));
}

/**
 * Convert timeframe string to days
 */
function getDaysFromTimeframe(timeframe) {
  switch (timeframe) {
    case '7days': return 7;
    case '30days': return 30;
    case '90days': return 90;
    case '1year': return 365;
    default: return 30;
  }
}