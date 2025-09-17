/**
 * ADMIN API: Daily Activity Analytics
 * GET /api/admin/daily-activity - Returns historical daily activity data
 * Provides data for analytics dashboard activity trends
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
    
    // Get timeframe from query params
    const { timeframe = '30days', limit = 30 } = req.query;
    const daysBack = Math.min(getDaysFromTimeframe(timeframe), parseInt(limit));

    // Try to get pre-aggregated daily analytics first
    const { data: dailyAnalytics, error: analyticsError } = await supabase
      .from('daily_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(daysBack);

    if (analyticsError && analyticsError.code !== 'PGRST116') {
      console.error('Error fetching daily analytics:', analyticsError);
      return res.status(500).json({ error: 'Failed to fetch daily analytics' });
    }

    // If we have pre-aggregated data, use it
    if (dailyAnalytics && dailyAnalytics.length > 0) {
      const processedData = processDailyAnalytics(dailyAnalytics);
      return res.status(200).json({
        daily_activity: processedData.daily_activity,
        summary: processedData.summary,
        data_source: 'aggregated',
        total_days: processedData.daily_activity.length,
        timeframe,
        date_range: {
          start: processedData.daily_activity[processedData.daily_activity.length - 1]?.date,
          end: processedData.daily_activity[0]?.date
        }
      });
    }

    // If no pre-aggregated data, calculate from raw data
    const calculatedData = await calculateDailyActivityFromRaw(daysBack);
    
    return res.status(200).json({
      daily_activity: calculatedData.daily_activity,
      summary: calculatedData.summary,
      data_source: 'calculated',
      total_days: calculatedData.daily_activity.length,
      timeframe,
      date_range: {
        start: calculatedData.daily_activity[calculatedData.daily_activity.length - 1]?.date || null,
        end: calculatedData.daily_activity[0]?.date || null
      }
    });

  } catch (error) {
    console.error('Daily activity API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Process pre-aggregated daily analytics data
 */
function processDailyAnalytics(dailyAnalytics) {
  const dailyActivity = dailyAnalytics.map(day => ({
    date: day.date,
    workflows: day.total_workflows || 0,
    users: day.active_users || 0,
    certificates: day.certificates_generated || 0,
    new_users: day.new_users || 0,
    revenue: day.total_revenue || 0,
    savings: day.total_savings_generated || 0,
    api_calls: day.total_api_calls || 0,
    avg_response_time: day.avg_api_response_time_ms || 0,
    error_count: day.failed_api_calls || 0
  }));

  const summary = calculateSummary(dailyActivity);

  return { daily_activity: dailyActivity, summary };
}

/**
 * Calculate daily activity from raw workflow and certificate data
 */
async function calculateDailyActivityFromRaw(daysBack) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Get workflow completions for the period
  const { data: workflows } = await supabase
    .from('workflow_completions')
    .select('completed_at, savings_amount, user_id')
    .gte('completed_at', startDate.toISOString());

  // Get certificates for the period
  const { data: certificates } = await supabase
    .from('certificates_generated')
    .select('generated_at, savings_amount')
    .gte('generated_at', startDate.toISOString());

  // Get user profiles for user count (approximate)
  const { data: users } = await supabase
    .from('user_profiles')
    .select('created_at, last_login')
    .gte('created_at', startDate.toISOString());

  const workflowData = workflows || [];
  const certificateData = certificates || [];
  const userData = users || [];

  // Generate daily activity data
  const dailyActivity = [];
  
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Workflows for this day
    const dayWorkflows = workflowData.filter(w => 
      w.completed_at && w.completed_at.split('T')[0] === dateStr
    );
    
    // Certificates for this day
    const dayCertificates = certificateData.filter(c => 
      c.generated_at && c.generated_at.split('T')[0] === dateStr
    );
    
    // New users for this day
    const dayNewUsers = userData.filter(u => 
      u.created_at && u.created_at.split('T')[0] === dateStr
    );
    
    // Active users (users who had activity this day)
    const uniqueUserIds = new Set(dayWorkflows.map(w => w.user_id).filter(Boolean));
    
    // Calculate savings
    const workflowSavings = dayWorkflows.reduce((sum, w) => sum + (w.savings_amount || 0), 0);
    const certificateSavings = dayCertificates.reduce((sum, c) => sum + (c.savings_amount || 0), 0);
    
    dailyActivity.push({
      date: dateStr,
      workflows: dayWorkflows.length,
      users: uniqueUserIds.size,
      certificates: dayCertificates.length,
      new_users: dayNewUsers.length,
      revenue: 0, // Would need subscription data
      savings: Math.max(workflowSavings, certificateSavings),
      api_calls: 0, // Would need performance logs
      avg_response_time: 0,
      error_count: 0
    });
  }

  const summary = calculateSummary(dailyActivity);

  return { daily_activity: dailyActivity, summary };
}

/**
 * Calculate summary statistics from daily activity
 */
function calculateSummary(dailyActivity) {
  if (dailyActivity.length === 0) {
    return {
      total_workflows: 0,
      total_users: 0,
      total_certificates: 0,
      total_new_users: 0,
      total_revenue: 0,
      total_savings: 0,
      avg_daily_workflows: 0,
      avg_daily_users: 0,
      peak_day: null,
      growth_trend: 0
    };
  }

  const totals = dailyActivity.reduce((acc, day) => ({
    workflows: acc.workflows + day.workflows,
    users: acc.users + day.users,
    certificates: acc.certificates + day.certificates,
    new_users: acc.new_users + day.new_users,
    revenue: acc.revenue + day.revenue,
    savings: acc.savings + day.savings
  }), { workflows: 0, users: 0, certificates: 0, new_users: 0, revenue: 0, savings: 0 });

  const avgDailyWorkflows = totals.workflows / dailyActivity.length;
  const avgDailyUsers = totals.users / dailyActivity.length;

  // Find peak activity day
  const peakDay = dailyActivity.reduce((peak, day) => {
    const dayActivity = day.workflows + day.certificates + day.users;
    const peakActivity = peak.workflows + peak.certificates + peak.users;
    return dayActivity > peakActivity ? day : peak;
  }, dailyActivity[0]);

  // Calculate growth trend (comparing first half to second half)
  const halfPoint = Math.floor(dailyActivity.length / 2);
  const firstHalf = dailyActivity.slice(0, halfPoint);
  const secondHalf = dailyActivity.slice(halfPoint);
  
  const firstHalfAvg = firstHalf.length > 0 ? 
    firstHalf.reduce((sum, day) => sum + day.workflows, 0) / firstHalf.length : 0;
  const secondHalfAvg = secondHalf.length > 0 ?
    secondHalf.reduce((sum, day) => sum + day.workflows, 0) / secondHalf.length : 0;
  
  const growthTrend = firstHalfAvg > 0 ? 
    ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

  return {
    total_workflows: totals.workflows,
    total_users: Math.max(...dailyActivity.map(d => d.users)), // Rough estimate of unique users
    total_certificates: totals.certificates,
    total_new_users: totals.new_users,
    total_revenue: totals.revenue,
    total_savings: totals.savings,
    avg_daily_workflows: Math.round(avgDailyWorkflows * 100) / 100,
    avg_daily_users: Math.round(avgDailyUsers * 100) / 100,
    peak_day: {
      date: peakDay.date,
      workflows: peakDay.workflows,
      total_activity: peakDay.workflows + peakDay.certificates + peakDay.users
    },
    growth_trend: Math.round(growthTrend * 100) / 100,
    
    // Additional insights
    most_active_day_of_week: getMostActiveDayOfWeek(dailyActivity),
    activity_consistency: calculateActivityConsistency(dailyActivity),
    recent_activity_score: calculateRecentActivityScore(dailyActivity)
  };
}

/**
 * Determine the most active day of the week
 */
function getMostActiveDayOfWeek(dailyActivity) {
  const dayOfWeekActivity = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  dailyActivity.forEach(day => {
    const dayOfWeek = new Date(day.date).getDay();
    dayOfWeekActivity[dayOfWeek] += day.workflows + day.certificates;
  });
  
  const mostActiveDayIndex = Object.keys(dayOfWeekActivity).reduce((a, b) => 
    dayOfWeekActivity[a] > dayOfWeekActivity[b] ? a : b
  );
  
  return dayNames[mostActiveDayIndex];
}

/**
 * Calculate activity consistency (lower variance = higher consistency)
 */
function calculateActivityConsistency(dailyActivity) {
  if (dailyActivity.length < 2) return 100;
  
  const activities = dailyActivity.map(d => d.workflows + d.certificates);
  const avg = activities.reduce((sum, a) => sum + a, 0) / activities.length;
  const variance = activities.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / activities.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to consistency score (0-100, higher is more consistent)
  const coefficient = avg > 0 ? stdDev / avg : 0;
  return Math.max(0, Math.round((1 - Math.min(1, coefficient)) * 100));
}

/**
 * Calculate recent activity score (emphasis on last 7 days)
 */
function calculateRecentActivityScore(dailyActivity) {
  if (dailyActivity.length === 0) return 0;
  
  const recentDays = dailyActivity.slice(0, Math.min(7, dailyActivity.length));
  const recentActivity = recentDays.reduce((sum, day) => sum + day.workflows + day.certificates, 0);
  const avgRecentActivity = recentActivity / recentDays.length;
  
  // Score based on activity level (0-100)
  return Math.min(100, Math.round(avgRecentActivity * 10));
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