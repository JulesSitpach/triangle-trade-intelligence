/**
 * DATA RETENTION MANAGER - 90-Day Grace Period
 *
 * Cron job runs daily to manage canceled subscription data:
 * - Day 60: Send warning email ("Your data will be deleted in 30 days")
 * - Day 80: Send final warning email ("Your data will be deleted in 10 days")
 * - Day 90: Delete/anonymize user data (GDPR-compliant)
 *
 * Schedule: Daily at 09:00 UTC (4 AM EST / 1 AM PST)
 * Vercel cron: 0 9 * * *
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Verify cron secret (security)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🕐 Starting data retention manager...');

  const now = new Date();
  const results = {
    warnings_60d: 0,
    warnings_80d: 0,
    deletions_90d: 0,
    errors: []
  };

  try {
    // === STEP 1: Send 60-day warnings ===
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: users60d, error: error60d } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name, company_name, canceled_at')
      .eq('status', 'trial_expired')
      .not('canceled_at', 'is', null)
      .is('deletion_warning_sent_at', null) // Haven't sent warning yet
      .lte('canceled_at', sixtyDaysAgo.toISOString());

    if (error60d) {
      console.error('Error fetching 60-day users:', error60d);
      results.errors.push({ stage: '60d_fetch', error: error60d.message });
    } else if (users60d && users60d.length > 0) {
      console.log(`📧 Sending 60-day warnings to ${users60d.length} users...`);

      for (const user of users60d) {
        try {
          await send60DayWarning(user);

          // Mark warning as sent
          await supabase
            .from('user_profiles')
            .update({ deletion_warning_sent_at: now.toISOString() })
            .eq('user_id', user.user_id);

          results.warnings_60d++;
        } catch (emailError) {
          console.error(`Failed to send 60-day warning to ${user.email}:`, emailError);
          results.errors.push({
            stage: '60d_email',
            user: user.email,
            error: emailError.message
          });
        }
      }
    }

    // === STEP 2: Send 80-day final warnings ===
    const eightyDaysAgo = new Date(now);
    eightyDaysAgo.setDate(eightyDaysAgo.getDate() - 80);

    const { data: users80d, error: error80d } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name, company_name, canceled_at')
      .eq('status', 'trial_expired')
      .not('canceled_at', 'is', null)
      .not('deletion_warning_sent_at', 'is', null) // Already sent 60-day warning
      .is('final_warning_sent_at', null) // Haven't sent final warning yet
      .lte('canceled_at', eightyDaysAgo.toISOString());

    if (error80d) {
      console.error('Error fetching 80-day users:', error80d);
      results.errors.push({ stage: '80d_fetch', error: error80d.message });
    } else if (users80d && users80d.length > 0) {
      console.log(`📧 Sending 80-day final warnings to ${users80d.length} users...`);

      for (const user of users80d) {
        try {
          await send80DayFinalWarning(user);

          // Mark final warning as sent
          await supabase
            .from('user_profiles')
            .update({ final_warning_sent_at: now.toISOString() })
            .eq('user_id', user.user_id);

          results.warnings_80d++;
        } catch (emailError) {
          console.error(`Failed to send 80-day warning to ${user.email}:`, emailError);
          results.errors.push({
            stage: '80d_email',
            user: user.email,
            error: emailError.message
          });
        }
      }
    }

    // === STEP 3: Delete/anonymize data at 90 days ===
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: users90d, error: error90d } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name, company_name, canceled_at')
      .eq('status', 'trial_expired')
      .not('canceled_at', 'is', null)
      .lte('canceled_at', ninetyDaysAgo.toISOString());

    if (error90d) {
      console.error('Error fetching 90-day users:', error90d);
      results.errors.push({ stage: '90d_fetch', error: error90d.message });
    } else if (users90d && users90d.length > 0) {
      console.log(`🗑️ Deleting data for ${users90d.length} users past 90-day retention...`);

      for (const user of users90d) {
        try {
          await deleteUserData(user.user_id);
          results.deletions_90d++;
          console.log(`✅ Deleted data for ${user.email}`);
        } catch (deleteError) {
          console.error(`Failed to delete data for ${user.email}:`, deleteError);
          results.errors.push({
            stage: '90d_deletion',
            user: user.email,
            error: deleteError.message
          });
        }
      }
    }

    console.log('✅ Data retention manager completed:', results);

    return res.status(200).json({
      success: true,
      timestamp: now.toISOString(),
      results
    });

  } catch (error) {
    console.error('❌ Data retention manager failed:', error);
    results.errors.push({ stage: 'general', error: error.message });

    return res.status(500).json({
      success: false,
      error: error.message,
      results
    });
  }
}

/**
 * Send 60-day warning email
 */
async function send60DayWarning(user) {
  const deletionDate = new Date(user.canceled_at);
  deletionDate.setDate(deletionDate.getDate() + 90);

  await resend.emails.send({
    from: 'Triangle Trade Intelligence <triangleintel@gmail.com>',
    to: user.email,
    subject: '⚠️ Data Deletion Warning - 30 Days Remaining',
    html: `
      <h2>Your Triangle Trade Intelligence Data Will Be Deleted in 30 Days</h2>

      <p>Hi ${user.full_name || 'there'},</p>

      <p>This is a reminder that your subscription to Triangle Trade Intelligence was canceled on <strong>${new Date(user.canceled_at).toLocaleDateString()}</strong>.</p>

      <p>According to our data retention policy, all your data will be permanently deleted on <strong>${deletionDate.toLocaleDateString()}</strong> (30 days from now).</p>

      <h3>What Will Be Deleted:</h3>
      <ul>
        <li>All USMCA workflow analyses</li>
        <li>All generated certificates</li>
        <li>All trade risk alerts and briefings</li>
        <li>Company profile and settings</li>
        <li>Your account and login credentials</li>
      </ul>

      <h3>How to Keep Your Data:</h3>
      <p>Reactivate your subscription before ${deletionDate.toLocaleDateString()} to prevent data deletion:</p>
      <p><a href="https://triangle-trade-intel.site/subscription" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reactivate Subscription</a></p>

      <p>If you choose not to reactivate, you can still export your data manually from the dashboard before deletion.</p>

      <p>Questions? Reply to this email or contact triangleintel@gmail.com</p>

      <p>Best regards,<br>Triangle Trade Intelligence Team</p>
    `
  });
}

/**
 * Send 80-day final warning email
 */
async function send80DayFinalWarning(user) {
  const deletionDate = new Date(user.canceled_at);
  deletionDate.setDate(deletionDate.getDate() + 90);

  await resend.emails.send({
    from: 'Triangle Trade Intelligence <triangleintel@gmail.com>',
    to: user.email,
    subject: '🚨 FINAL WARNING - Data Deletion in 10 Days',
    html: `
      <h2 style="color: #dc2626;">FINAL WARNING: Your Data Will Be Deleted in 10 Days</h2>

      <p>Hi ${user.full_name || 'there'},</p>

      <p><strong>This is your final warning.</strong> Your Triangle Trade Intelligence data will be permanently deleted on <strong>${deletionDate.toLocaleDateString()}</strong> - just 10 days from now.</p>

      <p>After this date, all your data will be irreversibly removed and cannot be recovered.</p>

      <h3>Last Chance to Keep Your Data:</h3>
      <p><a href="https://triangle-trade-intel.site/subscription" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reactivate Now - 10 Days Left</a></p>

      <h3>What Happens on ${deletionDate.toLocaleDateString()}:</h3>
      <ul>
        <li>❌ All workflow analyses deleted</li>
        <li>❌ All certificates deleted</li>
        <li>❌ All alerts and briefings deleted</li>
        <li>❌ Account permanently closed</li>
        <li>❌ Login credentials removed</li>
      </ul>

      <p><strong>Export your data now</strong> if you want to keep records: <a href="https://triangle-trade-intel.site/dashboard">Go to Dashboard</a></p>

      <p>Questions? Contact triangleintel@gmail.com immediately.</p>

      <p>Best regards,<br>Triangle Trade Intelligence Team</p>
    `
  });
}

/**
 * Delete all user data (GDPR-compliant)
 */
async function deleteUserData(userId) {
  console.log(`🗑️ Starting data deletion for user ${userId}...`);

  // Delete in order (respecting foreign key constraints)
  const tables = [
    'monthly_usage_tracking',
    'user_alert_tracking',
    'workflow_sessions',
    'workflow_completions',
    'invoices',
    'user_profiles'
  ];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error(`Failed to delete from ${table}:`, error);
      throw new Error(`Failed to delete from ${table}: ${error.message}`);
    } else {
      console.log(`✅ Deleted ${table} records for user ${userId}`);
    }
  }

  // Delete from auth.users (final step)
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) {
    console.error(`Failed to delete auth user:`, authError);
    throw new Error(`Failed to delete auth user: ${authError.message}`);
  }

  console.log(`✅ Fully deleted user ${userId} from all tables`);
}
