/**
 * Admin Sales Dashboard API
 * Returns sales funnel metrics, user conversion data, and activity stats
 * Restricted to admin users only
 * USES COOKIE-BASED AUTHENTICATION (triangle_session)
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verify session cookie (same logic as /api/auth/me)
function verifySession(cookieValue) {
  try {
    if (!cookieValue) return null;

    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const { data, sig } = JSON.parse(decoded);

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('CRITICAL: JWT_SECRET environment variable must be configured');
      return null;
    }

    // Convert data object to string for HMAC verification
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const expectedSig = crypto.createHmac('sha256', secret)
      .update(dataString)
      .digest('hex');

    if (sig !== expectedSig) {
      console.error('Session signature verification failed');
      return null;
    }

    // Parse the data string to get the session object
    const sessionData = typeof data === 'string' ? JSON.parse(data) : data;

    // Check expiration (7 days)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - sessionData.timestamp > sevenDaysMs) {
      console.error('Session expired');
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access using cookie-based session
    const cookies = parse(req.headers.cookie || '');
    const sessionCookie = cookies.triangle_session;

    if (!sessionCookie) {
      return res.status(401).json({
        error: 'Unauthorized - No session found',
        hint: 'Please log in to access admin features'
      });
    }

    const session = verifySession(sessionCookie);

    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized - Invalid session',
        hint: 'Your session may have expired. Please log in again.'
      });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin, role')
      .eq('user_id', session.userId)
      .single();

    const isAdmin = profile?.is_admin === true || profile?.role === 'admin' || session.isAdmin === true;

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Forbidden - Admin access required',
        hint: 'You must be an administrator to view sales data'
      });
    }

    // Fetch sales funnel data
    const { data: prospects, error: prospectsError } = await supabase
      .from('sales_prospects')
      .select('*')
      .order('created_at', { ascending: false });

    if (prospectsError) throw prospectsError;

    // Fetch user conversion data
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        email,
        company_name,
        subscription_tier,
        status,
        trial_ends_at,
        created_at,
        analyses_this_month,
        workflow_completions,
        certificates_generated,
        total_savings
      `)
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    // Fetch recent activity
    const { data: recentWorkflows, error: workflowsError } = await supabase
      .from('workflow_completions')
      .select(`
        id,
        company_name,
        qualification_status,
        estimated_annual_savings,
        completed_at,
        user_id
      `)
      .order('completed_at', { ascending: false })
      .limit(50);

    if (workflowsError) throw workflowsError;

    // Calculate funnel metrics
    const funnelMetrics = {
      initial_contact: prospects.filter(p => p.stage === 'initial_contact').length,
      demo_scheduled: prospects.filter(p => p.stage === 'demo_scheduled').length,
      demo_completed: prospects.filter(p => p.stage === 'demo_completed').length,
      trial_active: prospects.filter(p => p.stage === 'trial_active').length,
      negotiating: prospects.filter(p => p.stage === 'negotiating').length,
      won: prospects.filter(p => p.stage === 'won').length,
      lost: prospects.filter(p => p.stage === 'lost').length,
    };

    // Calculate user metrics
    const userMetrics = {
      total: users.length,
      trial: users.filter(u => u.subscription_tier === 'Trial').length,
      starter: users.filter(u => u.subscription_tier === 'Starter').length,
      professional: users.filter(u => u.subscription_tier === 'Professional').length,
      premium: users.filter(u => u.subscription_tier === 'Premium').length,
      active: users.filter(u => u.status === 'active').length,
      trial_expired: users.filter(u => u.status === 'trial_expired').length,
    };

    // Calculate revenue metrics (rough estimates)
    const revenueMetrics = {
      mrr: (
        users.filter(u => u.subscription_tier === 'Starter').length * 99 +
        users.filter(u => u.subscription_tier === 'Professional').length * 299 +
        users.filter(u => u.subscription_tier === 'Premium').length * 799
      ),
      arr: (
        users.filter(u => u.subscription_tier === 'Starter').length * 99 * 12 +
        users.filter(u => u.subscription_tier === 'Professional').length * 299 * 12 +
        users.filter(u => u.subscription_tier === 'Premium').length * 799 * 12
      ),
    };

    // Calculate activity metrics
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activityMetrics = {
      workflows_30d: recentWorkflows.filter(w =>
        new Date(w.completed_at) >= thirtyDaysAgo
      ).length,
      workflows_7d: recentWorkflows.filter(w =>
        new Date(w.completed_at) >= sevenDaysAgo
      ).length,
      qualified_30d: recentWorkflows.filter(w =>
        new Date(w.completed_at) >= thirtyDaysAgo &&
        w.qualification_status === 'QUALIFIED'
      ).length,
      total_savings_30d: recentWorkflows
        .filter(w => new Date(w.completed_at) >= thirtyDaysAgo)
        .reduce((sum, w) => sum + (parseFloat(w.estimated_annual_savings) || 0), 0),
    };

    // Return comprehensive dashboard data
    return res.status(200).json({
      success: true,
      data: {
        funnel: funnelMetrics,
        users: userMetrics,
        revenue: revenueMetrics,
        activity: activityMetrics,
        prospects: prospects.slice(0, 20), // Recent 20 prospects
        recentUsers: users.slice(0, 20), // Recent 20 users
        recentWorkflows: recentWorkflows.slice(0, 20), // Recent 20 workflows
      },
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Admin sales data error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
