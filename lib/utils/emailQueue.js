/**
 * Email Queue System
 * Reliable email delivery with retry logic
 *
 * Usage:
 *   import { queueEmail } from '@/lib/utils/emailQueue';
 *
 *   await queueEmail({
 *     to: 'user@example.com',
 *     subject: 'Crisis Alert',
 *     html: '<html>...</html>',
 *     emailType: 'crisis_alert',
 *     userId: 'uuid',
 *     priority: 1  // 1=highest, 10=lowest
 *   });
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from './production-logger.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Queue an email for delivery
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {string} [options.text] - Plain text email body
 * @param {string} options.emailType - Type of email (crisis_alert, service_confirmation, etc.)
 * @param {string} [options.userId] - User ID (optional)
 * @param {string} [options.relatedId] - Related entity ID (alert ID, service request ID, etc.)
 * @param {number} [options.priority] - Priority 1-10 (1=highest, default=5)
 * @param {Date} [options.scheduledFor] - When to send (default=now)
 * @param {Object} [options.metadata] - Additional data for email template
 * @returns {Promise<{success: boolean, emailId?: string, error?: string}>}
 */
export async function queueEmail({
  to,
  subject,
  html,
  text = null,
  emailType,
  userId = null,
  relatedId = null,
  priority = 5,
  scheduledFor = new Date(),
  metadata = null
}) {
  try {
    // Validate required fields
    if (!to || !subject || !html || !emailType) {
      throw new Error('Missing required email fields: to, subject, html, emailType');
    }

    // Insert into email_queue table
    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        recipient_email: to,
        subject: subject,
        html_body: html,
        text_body: text,
        email_type: emailType,
        user_id: userId,
        related_id: relatedId,
        priority: priority,
        scheduled_for: scheduledFor.toISOString(),
        metadata: metadata,
        status: 'pending',
        retry_count: 0,
        max_retries: 3
      })
      .select('id')
      .single();

    if (error) {
      logError('Failed to queue email', {
        error: error.message,
        to,
        subject,
        emailType
      });

      return {
        success: false,
        error: error.message
      };
    }

    logInfo('Email queued successfully', {
      emailId: data.id,
      to,
      subject,
      emailType,
      priority,
      scheduledFor
    });

    return {
      success: true,
      emailId: data.id
    };

  } catch (error) {
    logError('Email queue error', {
      error: error.message,
      to,
      subject,
      emailType
    });

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get pending emails to process
 * @param {number} limit - Max emails to fetch
 * @returns {Promise<Array>} Pending emails
 */
export async function getPendingEmails(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: true })  // Priority 1 first
      .order('scheduled_for', { ascending: true })  // Oldest first
      .limit(limit);

    if (error) throw error;

    return data || [];

  } catch (error) {
    logError('Failed to fetch pending emails', { error: error.message });
    return [];
  }
}

/**
 * Get failed emails eligible for retry
 * @param {number} limit - Max emails to fetch
 * @returns {Promise<Array>} Failed emails ready to retry
 */
export async function getRetryEmails(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'failed')
      .lt('retry_count', supabase.rpc('max_retries'))
      .lte('next_retry_at', new Date().toISOString())
      .order('next_retry_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return data || [];

  } catch (error) {
    logError('Failed to fetch retry emails', { error: error.message });
    return [];
  }
}

/**
 * Mark email as sent
 * @param {string} emailId - Email queue ID
 * @param {string} resendMessageId - Resend API message ID
 */
export async function markEmailSent(emailId, resendMessageId = null) {
  try {
    const { error } = await supabase
      .from('email_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        resend_message_id: resendMessageId
      })
      .eq('id', emailId);

    if (error) throw error;

    logInfo('Email marked as sent', { emailId, resendMessageId });

  } catch (error) {
    logError('Failed to mark email as sent', {
      error: error.message,
      emailId
    });
  }
}

/**
 * Mark email as failed and schedule retry
 * @param {string} emailId - Email queue ID
 * @param {string} errorMessage - Error description
 * @param {string} errorCode - Error code (optional)
 */
export async function markEmailFailed(emailId, errorMessage, errorCode = null) {
  try {
    // Use database function to handle retry logic
    const { error } = await supabase.rpc('mark_email_failed', {
      email_id: emailId,
      error_msg: errorMessage,
      error_code_val: errorCode
    });

    if (error) throw error;

    logInfo('Email marked as failed (will retry)', {
      emailId,
      errorMessage,
      errorCode
    });

  } catch (error) {
    logError('Failed to mark email as failed', {
      error: error.message,
      emailId
    });
  }
}

/**
 * Cancel a queued email
 * @param {string} emailId - Email queue ID
 */
export async function cancelEmail(emailId) {
  try {
    const { error } = await supabase
      .from('email_queue')
      .update({
        status: 'cancelled'
      })
      .eq('id', emailId)
      .in('status', ['pending', 'failed']);  // Can only cancel pending/failed

    if (error) throw error;

    logInfo('Email cancelled', { emailId });

  } catch (error) {
    logError('Failed to cancel email', {
      error: error.message,
      emailId
    });
  }
}

/**
 * Get email queue statistics
 * @returns {Promise<Object>} Queue stats
 */
export async function getEmailQueueStats() {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .select('status, email_type')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Aggregate stats
    const stats = {
      total: data.length,
      byStatus: {},
      byType: {}
    };

    data.forEach(email => {
      stats.byStatus[email.status] = (stats.byStatus[email.status] || 0) + 1;
      stats.byType[email.email_type] = (stats.byType[email.email_type] || 0) + 1;
    });

    return stats;

  } catch (error) {
    logError('Failed to get email queue stats', { error: error.message });
    return { total: 0, byStatus: {}, byType: {} };
  }
}
