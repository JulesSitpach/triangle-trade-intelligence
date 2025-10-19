/**
 * Email Queue Processor Cron Job
 *
 * Runs every 5 minutes to:
 * 1. Send pending emails
 * 2. Retry failed emails
 *
 * Setup in Vercel:
 * 1. Go to Project Settings → Cron Jobs
 * 2. Add: `/api/cron/process-email-queue`
 * 3. Schedule: `*/5 * * * *` (every 5 minutes)
 * 4. Add `CRON_SECRET` environment variable
 *
 * Or use external cron (cron-job.org):
 * - URL: https://triangle-trade-intelligence.vercel.app/api/cron/process-email-queue
 * - Header: Authorization: Bearer ${CRON_SECRET}
 * - Schedule: Every 5 minutes
 */

import { Resend } from 'resend';
import {
  getPendingEmails,
  getRetryEmails,
  markEmailSent,
  markEmailFailed
} from '../../../lib/utils/emailQueue.js';
import { logInfo, logError } from '../../../lib/utils/production-logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Security: Verify cron secret
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return res.status(500).json({
      error: 'CRON_SECRET not configured'
    });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    logError('Unauthorized cron request', {
      providedAuth: authHeader ? 'present' : 'missing'
    });

    return res.status(401).json({
      error: 'Unauthorized'
    });
  }

  try {
    logInfo('Email queue processing started');

    let sentCount = 0;
    let failedCount = 0;
    let errors = [];

    // 1. Process pending emails
    const pendingEmails = await getPendingEmails(10);  // Process 10 at a time

    for (const email of pendingEmails) {
      try {
        // Send email via Resend
        const result = await resend.emails.send({
          from: 'Triangle Intelligence <no-reply@triangleintel.com>',
          to: email.recipient_email,
          subject: email.subject,
          html: email.html_body,
          text: email.text_body || stripHtml(email.html_body)
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        // Mark as sent
        await markEmailSent(email.id, result.data?.id);
        sentCount++;

        logInfo('Email sent successfully', {
          emailId: email.id,
          to: email.recipient_email,
          subject: email.subject,
          resendMessageId: result.data?.id
        });

      } catch (error) {
        // Mark as failed (will retry)
        await markEmailFailed(email.id, error.message, error.code);
        failedCount++;
        errors.push({
          emailId: email.id,
          to: email.recipient_email,
          error: error.message
        });

        logError('Email send failed', {
          emailId: email.id,
          to: email.recipient_email,
          error: error.message
        });
      }
    }

    // 2. Retry failed emails
    const retryEmails = await getRetryEmails(5);  // Process 5 retries at a time

    for (const email of retryEmails) {
      try {
        // Send email via Resend
        const result = await resend.emails.send({
          from: 'Triangle Intelligence <no-reply@triangleintel.com>',
          to: email.recipient_email,
          subject: email.subject,
          html: email.html_body,
          text: email.text_body || stripHtml(email.html_body)
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        // Mark as sent
        await markEmailSent(email.id, result.data?.id);
        sentCount++;

        logInfo('Email retry successful', {
          emailId: email.id,
          to: email.recipient_email,
          retryCount: email.retry_count + 1,
          resendMessageId: result.data?.id
        });

      } catch (error) {
        // Mark as failed again (will retry if retries remaining)
        await markEmailFailed(email.id, error.message, error.code);
        failedCount++;
        errors.push({
          emailId: email.id,
          to: email.recipient_email,
          retryCount: email.retry_count + 1,
          error: error.message
        });

        logError('Email retry failed', {
          emailId: email.id,
          to: email.recipient_email,
          retryCount: email.retry_count + 1,
          error: error.message
        });
      }
    }

    // Return summary
    const summary = {
      success: true,
      processed: pendingEmails.length + retryEmails.length,
      sent: sentCount,
      failed: failedCount,
      errors: errors.length > 0 ? errors : undefined
    };

    logInfo('Email queue processing completed', summary);

    return res.status(200).json(summary);

  } catch (error) {
    logError('Email queue processing error', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Strip HTML tags for plain text fallback
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
function stripHtml(html) {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
