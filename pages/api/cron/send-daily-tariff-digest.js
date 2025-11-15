/**
 * DAILY TARIFF DIGEST CRON JOB
 * Sends 1 email per user bundling all tariff changes from previous 24 hours
 * Scheduled: 8 AM UTC daily (Vercel cron)
 *
 * Flow:
 * 1. Query tariff_changes_log for changes from last 24h that haven't been sent
 * 2. Group changes by affected user
 * 3. Create digest email with all changes for that user
 * 4. Queue email via email_queue system
 * 5. Mark changes as processed
 */

import { createClient } from '@supabase/supabase-js';
import { queueEmail } from '../../../lib/utils/emailQueue.js';
import { logInfo, logError } from '../../../lib/utils/production-logger.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Verify Vercel cron or GitHub Actions
  const authHeader = req.headers.authorization;
  const userAgent = req.headers['user-agent'] || '';
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === 'production') {
    const isVercelCron = authHeader === `Bearer ${cronSecret}`;
    const isGitHubActions = userAgent.includes('curl') || userAgent.includes('GitHub-Actions');

    if (!isVercelCron && !isGitHubActions) {
      logError('Unauthorized daily digest request', { userAgent });
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const startTime = Date.now();
  let emailsSent = 0;
  let errors = [];

  try {
    logInfo('📧 Daily tariff digest job started');

    // 1. Get all unprocessed tariff changes from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: changes, error: changesError } = await supabase
      .from('tariff_changes_log')
      .select('*')
      .eq('is_processed', false)
      .gte('created_at', yesterday)
      .order('created_at', { ascending: false });

    if (changesError) throw changesError;

    if (!changes || changes.length === 0) {
      logInfo('📧 No tariff changes to digest');
      return res.status(200).json({
        success: true,
        message: 'No changes to digest',
        emails_sent: 0
      });
    }

    logInfo(`📊 Found ${changes.length} tariff changes to digest`);

    // 2. Get all active users with notifications enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, email, email_preferences')
      .eq('email_notifications', true)
      .neq('email_notifications', false);

    if (profilesError) throw profilesError;

    // 3. For each user, find affected changes and send digest
    for (const profile of profiles || []) {
      try {
        // ✅ CHECK EMAIL PREFERENCES: Skip if all components & market intel are unchecked
        const emailPrefs = profile.email_preferences || {};
        const hasAnyPreferenceEnabled = Object.values(emailPrefs).some(val => val !== false);

        if (!hasAnyPreferenceEnabled && Object.keys(emailPrefs).length > 0) {
          logInfo(`⏭️ Skipping user ${profile.user_id}: All email preferences disabled`);
          continue;
        }

        // Find changes affecting this user's workflows
        const userChanges = await findUserAffectedChanges(profile.user_id, changes);

        if (userChanges.length > 0) {
          // Get user email
          const { data: { user }, error: userError } = await supabase
            .auth.admin.getUserById(profile.user_id);

          if (userError || !user?.email) {
            logError(`Could not fetch email for user ${profile.user_id}:`, userError?.message);
            continue;
          }

          // Create digest email
          const digestEmail = createDigestEmail(userChanges);

          // Queue email
          const result = await queueEmail({
            to: user.email,
            subject: `📊 Daily Tariff Update Digest - ${new Date().toLocaleDateString()}`,
            html: digestEmail.html,
            text: digestEmail.text,
            emailType: 'daily_tariff_digest',
            priority: 1,  // High priority
            metadata: {
              changes_count: userChanges.length,
              change_ids: userChanges.map(c => c.id)
            }
          });

          if (result.success) {
            emailsSent++;
            logInfo(`✉️ Queued daily digest for ${user.email} (${userChanges.length} changes)`);

            // Track that we've sent digest for these changes
            await trackDigestSent(profile.user_id, userChanges, result.emailId);
          } else {
            errors.push({
              user_email: user.email,
              error: result.error
            });
            logError(`Failed to queue digest for ${user.email}:`, result.error);
          }
        }
      } catch (err) {
        logError(`Error processing digest for user ${profile.user_id}:`, err.message);
        errors.push({
          user_id: profile.user_id,
          error: err.message
        });
      }
    }

    // 4. Mark all processed changes as processed
    const changeIds = changes.map(c => c.id);
    if (changeIds.length > 0) {
      const { error: updateError } = await supabase
        .from('tariff_changes_log')
        .update({
          is_processed: true,
          processed_at: new Date().toISOString()
        })
        .in('id', changeIds);

      if (updateError) {
        logError('Failed to mark changes as processed:', updateError.message);
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      success: true,
      emails_sent: emailsSent,
      changes_processed: changes.length,
      errors: errors.length > 0 ? errors : undefined,
      duration_ms: duration
    };

    logInfo('✅ Daily tariff digest completed', summary);

    return res.status(200).json(summary);

  } catch (error) {
    logError('Daily digest cron job error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Find tariff changes affecting a specific user's workflows
 */
async function findUserAffectedChanges(userId, allChanges) {
  try {
    // Get user's workflows
    const { data: workflows, error } = await supabase
      .from('workflow_sessions')
      .select('hs_code, component_origins, business_type, supplier_country')
      .eq('user_id', userId);

    if (error) {
      console.error(`Could not fetch workflows for user ${userId}:`, error.message);
      return [];
    }

    if (!workflows || workflows.length === 0) {
      return [];
    }

    // Match changes to user's workflows
    const affectedChanges = allChanges.filter(change => {
      // Check if user has any matching workflows
      return workflows.some(w => {
        // Match by HS code
        if (w.hs_code === change.hs_code) return true;

        // Match by component origins
        if (w.component_origins && Array.isArray(w.component_origins)) {
          if (w.component_origins.some(c => c.hs_code === change.hs_code)) return true;
        }

        // Match by industry (infer from HS code chapter)
        const hsChapter = change.hs_code?.substring(0, 2);
        const industryMap = {
          '84': 'machinery',
          '85': 'electronics',
          '87': 'automotive',
          '72': 'steel',
          '76': 'aluminum',
          '61': 'textiles',
          '62': 'textiles'
        };
        const industry = industryMap[hsChapter];
        if (industry && w.business_type === industry) return true;

        // Match Section 301 (China)
        if (change.change_type === 'section_301' && (w.supplier_country === 'CN' || w.supplier_country === 'China')) {
          return true;
        }

        return false;
      });
    });

    return affectedChanges;
  } catch (err) {
    console.error('Error finding affected changes:', err.message);
    return [];
  }
}

/**
 * Create HTML and text email for daily digest
 */
function createDigestEmail(changes) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let textBody = `Daily Tariff Update Digest - ${today}\n`;
  textBody += `═══════════════════════════════════════\n\n`;
  textBody += `We detected ${changes.length} tariff rate change(s) affecting your products:\n\n`;

  let htmlBody = `<html><body><div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333;">`;
  htmlBody += `<h2 style="color: #2c3e50;">📊 Daily Tariff Update Digest</h2>`;
  htmlBody += `<p style="color: #7f8c8d; font-size: 14px;">${today}</p>`;
  htmlBody += `<p>We detected ${changes.length} tariff rate change(s) affecting your products:</p>`;
  htmlBody += `<hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">`;

  changes.forEach((change, idx) => {
    const impact = change.new_rate - change.old_rate;
    const impactDir = impact > 0 ? '📈 INCREASED' : '📉 DECREASED';
    const impactColor = impact > 0 ? '#e74c3c' : '#27ae60';

    textBody += `${idx + 1}. ${change.change_type.toUpperCase()}\n`;
    textBody += `   HS Code: ${change.hs_code}\n`;
    textBody += `   Rate: ${change.old_rate}% → ${change.new_rate}% ${impactDir}\n`;
    textBody += `   Effective: ${change.effective_date || 'Immediately'}\n`;
    textBody += `   Confidence: ${(change.confidence * 100).toFixed(0)}%\n\n`;

    htmlBody += `<div style="background: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid ${impactColor}; border-radius: 4px;">`;
    htmlBody += `<h4 style="margin: 0 0 10px 0; color: #2c3e50;">${idx + 1}. ${change.change_type.toUpperCase()}</h4>`;
    htmlBody += `<p style="margin: 5px 0;"><strong>HS Code:</strong> ${change.hs_code}</p>`;
    htmlBody += `<p style="margin: 5px 0;"><strong>Rate Change:</strong> <span style="color: ${impactColor}; font-weight: bold;">${change.old_rate}% → ${change.new_rate}% ${impactDir}</span></p>`;
    htmlBody += `<p style="margin: 5px 0;"><strong>Effective:</strong> ${change.effective_date || 'Immediately'}</p>`;
    htmlBody += `<p style="margin: 5px 0; font-size: 12px; color: #7f8c8d;"><strong>Confidence:</strong> ${(change.confidence * 100).toFixed(0)}%</p>`;
    htmlBody += `</div>`;
  });

  textBody += `\n═══════════════════════════════════════\n`;
  textBody += `Next Steps:\n`;
  textBody += `1. Log into Triangle Trade Intelligence\n`;
  textBody += `2. Review your affected workflows\n`;
  textBody += `3. Recalculate USMCA analysis with updated rates\n`;
  textBody += `4. Update any active certificates if needed\n\n`;
  textBody += `Questions? Contact: support@triangle-trade-intelligence.com\n`;
  textBody += `---\n`;
  textBody += `Triangle Trade Intelligence\n`;
  textBody += `Daily tariff monitoring for USMCA compliance (updates detected within 24 hours)\n`;
  textBody += `Digest generated: ${new Date().toLocaleString()}\n`;

  htmlBody += `<hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">`;
  htmlBody += `<h3 style="color: #2c3e50; margin-top: 20px;">📋 Next Steps</h3>`;
  htmlBody += `<ol>`;
  htmlBody += `<li>Log into Triangle Trade Intelligence</li>`;
  htmlBody += `<li>Review your affected workflows</li>`;
  htmlBody += `<li>Recalculate USMCA analysis with updated rates</li>`;
  htmlBody += `<li>Update any active certificates if needed</li>`;
  htmlBody += `</ol>`;
  htmlBody += `<p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">`;
  htmlBody += `Questions? Contact: <a href="mailto:support@triangle-trade-intelligence.com">support@triangle-trade-intelligence.com</a></p>`;
  htmlBody += `<hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">`;
  htmlBody += `<p style="color: #95a5a6; font-size: 12px;">Triangle Trade Intelligence | Daily tariff monitoring for USMCA compliance (updates detected within 24 hours)</p>`;
  htmlBody += `<p style="color: #95a5a6; font-size: 10px;">Digest generated: ${new Date().toLocaleString()}</p>`;
  htmlBody += `</div></body></html>`;

  return { text: textBody, html: htmlBody };
}

/**
 * Track that daily digest was sent for these changes
 */
async function trackDigestSent(userId, changes, emailId) {
  const changeIds = changes.map(c => c.id);

  const { error } = await supabase
    .from('daily_digest_sent')
    .insert({
      user_id: userId,
      sent_at: new Date().toISOString(),
      changes_count: changes.length,
      email_id: emailId,
      tariff_change_ids: changeIds
    });

  if (error) {
    console.error('Failed to track digest sent:', error.message);
  }
}
