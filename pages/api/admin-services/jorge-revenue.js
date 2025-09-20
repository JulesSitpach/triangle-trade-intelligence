/**
 * Jorge's Revenue API - Real revenue tracking from database
 * Monthly targets, current performance, repeat clients
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
    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Query revenue data from service completions
    const { data: completedServices, error: serviceError } = await supabase
      .from('service_completions')
      .select('service_type, revenue_amount, client_id, completed_at')
      .eq('provider', 'Jorge')
      .gte('completed_at', startOfMonth.toISOString())
      .lte('completed_at', endOfMonth.toISOString());

    if (serviceError) {
      console.error('Service completions query error:', serviceError);
    }

    // Query recurring intelligence subscriptions
    const { data: intelligenceRevenue, error: intError } = await supabase
      .from('intelligence_subscriptions')
      .select('monthly_amount, client_id')
      .eq('provider', 'Jorge')
      .eq('subscription_status', 'active');

    if (intError) {
      console.error('Intelligence subscriptions query error:', intError);
    }

    // Calculate current month revenue
    let projectRevenue = 0;
    let intelligenceMonthlyRevenue = 0;
    const projectClients = new Set();
    const allClients = new Set();

    // Process completed projects
    if (completedServices) {
      completedServices.forEach(service => {
        projectRevenue += service.revenue_amount || 0;
        projectClients.add(service.client_id);
        allClients.add(service.client_id);
      });
    }

    // Process intelligence subscriptions
    if (intelligenceRevenue) {
      intelligenceRevenue.forEach(sub => {
        intelligenceMonthlyRevenue += sub.monthly_amount || 300;
        allClients.add(sub.client_id);
      });
    }

    const totalCurrentRevenue = projectRevenue + intelligenceMonthlyRevenue;

    // Calculate average project value
    const completedProjectCount = completedServices ? completedServices.length : 0;
    const averageProjectValue = completedProjectCount > 0 ?
      projectRevenue / completedProjectCount : 0;

    // Query repeat clients (clients with multiple services)
    const { data: clientHistory, error: historyError } = await supabase
      .from('service_completions')
      .select('client_id')
      .eq('provider', 'Jorge')
      .gte('completed_at', new Date(now.getFullYear(), 0, 1).toISOString()); // This year

    let repeatClients = 0;
    if (clientHistory) {
      const clientCounts = {};
      clientHistory.forEach(service => {
        clientCounts[service.client_id] = (clientCounts[service.client_id] || 0) + 1;
      });
      repeatClients = Object.values(clientCounts).filter(count => count > 1).length;
    }

    // Monthly target (configurable)
    const monthlyTarget = 15000; // $15,000 monthly target

    // Calculate performance metrics
    const revenueData = {
      monthly_target: monthlyTarget,
      current_revenue: totalCurrentRevenue,
      project_revenue: projectRevenue,
      intelligence_revenue: intelligenceMonthlyRevenue,
      average_project: Math.round(averageProjectValue),
      repeat_clients: repeatClients,
      total_clients: allClients.size,
      completion_rate: (totalCurrentRevenue / monthlyTarget) * 100,
      projects_completed: completedProjectCount,
      revenue_sources: {
        supplier_vetting: 0,
        market_entry: 0,
        intelligence: intelligenceMonthlyRevenue
      }
    };

    // Break down revenue by service type
    if (completedServices) {
      completedServices.forEach(service => {
        if (service.service_type === 'supplier-vetting') {
          revenueData.revenue_sources.supplier_vetting += service.revenue_amount || 750;
        } else if (service.service_type === 'market-entry') {
          revenueData.revenue_sources.market_entry += service.revenue_amount || 3200;
        }
      });
    }

    return res.status(200).json({
      success: true,
      revenue: revenueData,
      month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      performance_status: getPerformanceStatus(revenueData.completion_rate),
      projections: calculateMonthlyProjection(revenueData, now),
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching Jorge revenue:', error);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: 'Could not load revenue data'
    });
  }
}

// Determine performance status
function getPerformanceStatus(completionRate) {
  if (completionRate >= 90) return 'exceeding';
  if (completionRate >= 70) return 'on_track';
  if (completionRate >= 50) return 'behind';
  return 'critical';
}

// Calculate end-of-month projection
function calculateMonthlyProjection(revenueData, currentDate) {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const daysPassed = currentDate.getDate();
  const daysRemaining = daysInMonth - daysPassed;

  // Simple projection based on current rate
  const dailyRate = revenueData.current_revenue / daysPassed;
  const projectedTotal = revenueData.current_revenue + (dailyRate * daysRemaining);

  return {
    end_of_month: Math.round(projectedTotal),
    likely_target_hit: projectedTotal >= revenueData.monthly_target * 0.9,
    daily_rate: Math.round(dailyRate),
    days_remaining: daysRemaining
  };
}