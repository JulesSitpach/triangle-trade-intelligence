/**
 * POST /api/admin/resolve-dev-issue
 * Marks a development issue as resolved
 */

import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '../../../lib/auth/verify-admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const adminCheck = await verifyAdmin(req);
    if (!adminCheck.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { issue_id, resolution_notes } = req.body;

    if (!issue_id) {
      return res.status(400).json({ error: 'issue_id required' });
    }

    // Update issue as resolved
    const { data, error } = await supabase
      .from('dev_issues')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: adminCheck.userId,
        resolution_notes: resolution_notes || 'Resolved by admin'
      })
      .eq('id', issue_id)
      .select()
      .single();

    if (error) {
      console.error('Failed to resolve dev issue:', error);
      return res.status(500).json({ error: 'Failed to resolve issue' });
    }

    return res.status(200).json({
      success: true,
      message: 'Issue marked as resolved',
      issue: data
    });

  } catch (error) {
    console.error('Error in resolve-dev-issue API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
