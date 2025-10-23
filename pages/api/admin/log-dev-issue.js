/**
 * Admin Logging Endpoint
 * POST /api/admin/log-dev-issue
 *
 * Receives error/issue logs from the application and stores them in the dev_issues table
 * for debugging and monitoring purposes
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // ✅ ALLOW POST ONLY
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const {
      issue_type,
      severity,
      component,
      message,
      data,
      user_id,
      certificate_number
    } = req.body;

    // ✅ VALIDATE REQUIRED FIELDS
    if (!issue_type || !severity || !component || !message) {
      console.warn('⚠️ Log endpoint missing required fields', { issue_type, severity, component, message });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: issue_type, severity, component, message'
      });
    }

    // ✅ INSERT INTO dev_issues TABLE
    const { data: insertedIssue, error: dbError } = await supabase
      .from('dev_issues')
      .insert([
        {
          issue_type,
          severity,
          component,
          message,
          issue_data: data || {},
          user_id,
          certificate_number,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (dbError) {
      // ✅ LOG INTERNAL ERROR BUT STILL RESPOND OK
      // (Don't want to break the application over logging failures)
      console.error('❌ Failed to insert dev issue into database:', {
        dbError: dbError.message,
        originalIssue: { issue_type, component, message }
      });

      // Still return 200 - don't break the app if logging fails
      return res.status(200).json({
        success: true,
        message: 'Issue received (storage failed, but logged locally)',
        issue_logged_locally: true
      });
    }

    // ✅ LOG LOCALLY AS WELL
    const emoji = {
      'critical': '🚨',
      'high': '⚠️',
      'medium': '⚡',
      'low': 'ℹ️'
    }[severity] || 'ℹ️';

    console.log(
      `${emoji} DEV ISSUE [${severity.toUpperCase()}]: ${component} - ${message}`,
      data || {}
    );

    // ✅ RETURN SUCCESS
    return res.status(200).json({
      success: true,
      message: 'Issue logged successfully',
      issue_id: insertedIssue?.id
    });

  } catch (error) {
    // ✅ HANDLE UNEXPECTED ERRORS
    console.error('❌ Unexpected error in log-dev-issue endpoint:', error);

    // Still return 200 - don't break the app
    return res.status(200).json({
      success: true,
      message: 'Issue received (endpoint error, but logged locally)',
      error_details: error.message
    });
  }
}
