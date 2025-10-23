/**
 * POST /api/admin/log-dev-issue
 * Logs development issues (missing data, bugs) to admin-visible table
 * These are NOT user errors - they are CODE BUGS that need fixing
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      issue_type,        // 'missing_data', 'validation_error', 'api_error', etc.
      severity,          // 'critical', 'high', 'medium', 'low'
      component,         // 'pdf_generator', 'certificate_api', 'workflow', etc.
      message,           // Human-readable description
      data,              // Full context object
      user_id,           // Optional - which user triggered this
      certificate_number // Optional - which certificate
    } = req.body;

    // Log to Supabase admin table
    const { data: loggedIssue, error } = await supabase
      .from('dev_issues')
      .insert({
        issue_type,
        severity,
        component,
        message,
        context_data: data,
        user_id,
        certificate_number,
        created_at: new Date().toISOString(),
        resolved: false
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to log dev issue to database:', error);
      // Don't fail the user's request if logging fails
      return res.status(200).json({
        success: true,
        warning: 'Issue logged to console only - database unavailable'
      });
    }

    console.error(`🚨 DEV ISSUE LOGGED: ${issue_type} - ${message}`, data);

    return res.status(200).json({
      success: true,
      issue_id: loggedIssue.id,
      message: 'Dev issue logged successfully'
    });

  } catch (error) {
    console.error('Error in log-dev-issue API:', error);
    // Don't fail the user's request if logging fails
    return res.status(200).json({
      success: true,
      warning: 'Issue logged to console only'
    });
  }
}
