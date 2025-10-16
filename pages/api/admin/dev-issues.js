/**
 * GET /api/admin/dev-issues
 * Fetches development issues for admin dashboard
 */

import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '../../../lib/auth/verify-admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const adminCheck = await verifyAdmin(req);
    if (!adminCheck.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { filter = 'unresolved' } = req.query;

    let query = supabase
      .from('dev_issues')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filter === 'unresolved') {
      query = query.eq('resolved', false);
    } else if (filter === 'critical') {
      query = query.eq('severity', 'critical');
    }

    const { data: issues, error } = await query.limit(100);

    if (error) {
      console.error('Failed to fetch dev issues:', error);
      return res.status(500).json({ error: 'Failed to fetch dev issues' });
    }

    return res.status(200).json({
      success: true,
      issues: issues || [],
      count: issues?.length || 0
    });

  } catch (error) {
    console.error('Error in dev-issues API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
