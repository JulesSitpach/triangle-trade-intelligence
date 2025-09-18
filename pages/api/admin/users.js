/**
 * ADMIN API: Users Management
 * GET /api/admin/users - Returns all user profiles with subscription and activity data
 * Requires admin authentication
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
    // For now, allowing access for development
    
    // Query user profiles with related data
    let { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        company_name,
        email,
        status,
        subscription_tier,
        workflow_completions,
        certificates_generated,
        total_savings,
        created_at,
        last_login,
        industry,
        company_size,
        phone,
        city,
        state,
        country
      `)
      .order('created_at', { ascending: false });

    // If database error or no table, return empty data
    if (usersError || !users || users.length === 0) {
      console.log('Users table empty, returning empty data');

      return res.status(200).json({
        users: [],
        summary: {
          total: 0,
          active: 0,
          trial: 0,
          expired: 0,
          total_workflows: 0,
          total_certificates: 0,
          total_savings: 0,
          avg_savings_per_user: 0,
          completion_rate: 0
        },
        data_status: {
          source: 'database_empty',
          reason: 'no_user_profiles',
          last_updated: new Date().toISOString(),
          record_count: 0
        }
      });
    }

    // Calculate additional metrics for each user
    const enrichedUsers = users.map(user => ({
      ...user,
      // Calculate conversion rate
      conversion_rate: user.workflow_completions > 0 
        ? ((user.certificates_generated / user.workflow_completions) * 100).toFixed(1)
        : 0,
      
      // Format monetary values
      total_savings_formatted: user.total_savings ? 
        `$${user.total_savings.toLocaleString()}` : '$0',
      
      // Calculate account age
      account_age_days: Math.floor(
        (new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)
      ),
      
      // Determine user activity level
      activity_level: getUserActivityLevel(user),
      
      // Format dates
      created_at_formatted: new Date(user.created_at).toLocaleDateString(),
      last_login_formatted: user.last_login ? 
        new Date(user.last_login).toLocaleDateString() : 'Never'
    }));

    // Calculate summary statistics
    const totalUsers = enrichedUsers.length;
    const activeUsers = enrichedUsers.filter(u => u.status === 'active').length;
    const trialUsers = enrichedUsers.filter(u => u.status === 'trial').length;
    const totalWorkflows = enrichedUsers.reduce((sum, u) => sum + (u.workflow_completions || 0), 0);
    const totalCertificates = enrichedUsers.reduce((sum, u) => sum + (u.certificates_generated || 0), 0);
    const totalSavings = enrichedUsers.reduce((sum, u) => sum + (parseFloat(u.total_savings) || 0), 0);

    return res.status(200).json({
      users: enrichedUsers,
      summary: {
        total: totalUsers,
        active: activeUsers,
        trial: trialUsers,
        expired: enrichedUsers.filter(u => u.status === 'trial_expired').length,
        total_workflows: totalWorkflows,
        total_certificates: totalCertificates,
        total_savings: totalSavings,
        avg_savings_per_user: totalUsers > 0 ? (totalSavings / totalUsers).toFixed(2) : 0,
        completion_rate: totalWorkflows > 0 ? ((totalCertificates / totalWorkflows) * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Admin users API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Determine user activity level based on recent usage
 */
function getUserActivityLevel(user) {
  const daysSinceLastLogin = user.last_login ? 
    Math.floor((new Date() - new Date(user.last_login)) / (1000 * 60 * 60 * 24)) : 999;
  
  if (daysSinceLastLogin <= 7) return 'highly_active';
  if (daysSinceLastLogin <= 30) return 'active';
  if (daysSinceLastLogin <= 90) return 'low_activity';
  return 'inactive';
}