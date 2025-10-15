/**
 * Email Monitoring Service for SMB Subscribers
 *
 * PHASE 1: Manual Curation (Week 1-2)
 * - Weekly digest of USMCA policy changes
 * - You manually curate from customs.gov, trade.gov (30 min/week)
 * - SendGrid sends to all subscribers
 *
 * PHASE 2: HS Code Specific Alerts (Week 3-4)
 * - Store user's HS codes from workflow
 * - You manually check customs.gov for tariff changes (15 min/day)
 * - Send targeted emails when HS code affected
 *
 * PHASE 3: SMS Alerts (Optional)
 * - Twilio integration for urgent changes
 * - Charge $20/month extra for SMS
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * PHASE 1: Weekly Digest
 * You manually curate policy changes, this sends to all subscribers
 */
export async function sendWeeklyDigest(digestContent) {
  try {
    // Get all subscribers with email_notifications enabled
    const { data: subscribers, error } = await supabase
      .from('user_profiles')
      .select('email, full_name, subscription_tier')
      .in('subscription_tier', ['professional', 'business', 'enterprise'])
      .eq('email_notifications', true);

    if (error) throw error;

    console.log(`📧 Sending weekly digest to ${subscribers.length} subscribers`);

    // Send via SendGrid (you'll configure this separately)
    const emailResults = await Promise.all(
      subscribers.map(subscriber =>
        sendDigestEmail(subscriber, digestContent)
      )
    );

    // Log delivery
    await supabase.from('email_logs').insert({
      type: 'weekly_digest',
      recipients_count: subscribers.length,
      sent_at: new Date().toISOString(),
      content_summary: digestContent.subject
    });

    return {
      success: true,
      sent: emailResults.filter(r => r.success).length,
      failed: emailResults.filter(r => !r.success).length
    };

  } catch (error) {
    console.error('Weekly digest error:', error);
    throw error;
  }
}

/**
 * PHASE 2: HS Code Specific Alert
 * When you notice a tariff change for specific HS code, send targeted alert
 */
export async function sendHSCodeAlert(hsCode, alertContent) {
  try {
    // Find users who have this HS code in their workflow data
    const { data: users, error } = await supabase
      .from('usmca_workflows')
      .select('user_id, hs_code, company_name')
      .eq('hs_code', hsCode)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get unique users (one per user_id)
    const uniqueUsers = Array.from(
      new Map(users.map(u => [u.user_id, u])).values()
    );

    // Get their email preferences
    const { data: subscribers } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, subscription_tier')
      .in('id', uniqueUsers.map(u => u.user_id))
      .in('subscription_tier', ['professional', 'business', 'enterprise'])
      .eq('email_notifications', true);

    console.log(`🚨 Sending HS code alert (${hsCode}) to ${subscribers.length} affected users`);

    // Send targeted emails
    const emailResults = await Promise.all(
      subscribers.map(subscriber => {
        const userData = uniqueUsers.find(u => u.user_id === subscriber.id);
        return sendHSCodeAlertEmail(subscriber, hsCode, userData.company_name, alertContent);
      })
    );

    // Log alert
    await supabase.from('email_logs').insert({
      type: 'hs_code_alert',
      hs_code: hsCode,
      recipients_count: subscribers.length,
      sent_at: new Date().toISOString(),
      content_summary: alertContent.subject
    });

    return {
      success: true,
      sent: emailResults.filter(r => r.success).length,
      hsCode: hsCode,
      affectedUsers: subscribers.length
    };

  } catch (error) {
    console.error('HS code alert error:', error);
    throw error;
  }
}

/**
 * Send digest email via SendGrid
 */
async function sendDigestEmail(subscriber, content) {
  try {
    // SendGrid integration (you'll add API key to .env.local)
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: subscriber.email, name: subscriber.full_name }],
          subject: content.subject
        }],
        from: {
          email: 'updates@triangleintelligence.com',
          name: 'Triangle Trade Intelligence'
        },
        content: [{
          type: 'text/html',
          value: generateDigestHTML(subscriber, content)
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`SendGrid error: ${response.statusText}`);
    }

    return { success: true, email: subscriber.email };

  } catch (error) {
    console.error(`Failed to send to ${subscriber.email}:`, error);
    return { success: false, email: subscriber.email, error: error.message };
  }
}

/**
 * Send HS code alert email
 */
async function sendHSCodeAlertEmail(subscriber, hsCode, companyName, content) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: subscriber.email, name: subscriber.full_name }],
          subject: `🚨 Tariff Alert: HS Code ${hsCode} - ${content.subject}`
        }],
        from: {
          email: 'alerts@triangleintelligence.com',
          name: 'Triangle Trade Intelligence Alerts'
        },
        content: [{
          type: 'text/html',
          value: generateAlertHTML(subscriber, hsCode, companyName, content)
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`SendGrid error: ${response.statusText}`);
    }

    return { success: true, email: subscriber.email };

  } catch (error) {
    console.error(`Failed to send alert to ${subscriber.email}:`, error);
    return { success: false, email: subscriber.email, error: error.message };
  }
}

/**
 * Generate HTML for weekly digest email
 */
function generateDigestHTML(subscriber, content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly USMCA Digest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: #134169; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Triangle Trade Intelligence</h1>
    <p style="margin: 5px 0 0 0; opacity: 0.9;">Weekly USMCA Policy Digest</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">

    <p>Hi ${subscriber.full_name || 'there'},</p>

    <p>Here's what happened this week in USMCA and trade policy:</p>

    ${content.sections.map(section => `
      <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #134169; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #134169;">${section.title}</h3>
        <p style="margin: 0;">${section.content}</p>
        ${section.action ? `<p style="margin: 10px 0 0 0; font-weight: 600; color: #dc2626;">⚠️ Action Needed: ${section.action}</p>` : ''}
      </div>
    `).join('')}

    <div style="margin: 30px 0 20px 0; padding: 20px; background: #eff6ff; border-radius: 8px;">
      <p style="margin: 0 0 10px 0; font-weight: 600; color: #134169;">Need help with any of these changes?</p>
      <p style="margin: 0;">Reply to this email or schedule a call with Jorge or Cristina.</p>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      You're receiving this because you're subscribed to Triangle Trade Intelligence ${subscriber.subscription_tier} plan.
      <br><br>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/settings" style="color: #134169;">Manage email preferences</a>
    </p>
  </div>

</body>
</html>
  `.trim();
}

/**
 * Generate HTML for HS code alert email
 */
function generateAlertHTML(subscriber, hsCode, companyName, content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tariff Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">🚨 Tariff Alert</h1>
    <p style="margin: 5px 0 0 0; opacity: 0.9;">This affects your business: ${companyName}</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">

    <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 10px 0; color: #dc2626;">HS Code: ${hsCode}</h2>
      <p style="margin: 0; font-size: 18px; font-weight: 600;">${content.changeType}</p>
    </div>

    <h3 style="color: #134169;">What Changed:</h3>
    <p>${content.description}</p>

    <h3 style="color: #134169;">Impact on Your Business:</h3>
    <p>${content.impact}</p>

    ${content.action ? `
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-weight: 600; color: #92400e;">⚠️ Action Required:</p>
        <p style="margin: 10px 0 0 0;">${content.action}</p>
      </div>
    ` : ''}

    <div style="margin: 30px 0 20px 0; padding: 20px; background: #eff6ff; border-radius: 8px;">
      <p style="margin: 0 0 10px 0; font-weight: 600; color: #134169;">Need Help?</p>
      <p style="margin: 0;">
        ${subscriber.subscription_tier === 'business' || subscriber.subscription_tier === 'enterprise'
          ? 'Schedule your included strategy call to discuss this change.'
          : 'Upgrade to Professional or Business tier for expert guidance on handling this change.'
        }
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
         style="display: inline-block; margin-top: 15px; padding: 12px 24px; background: #134169; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Go to Dashboard
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      This alert was sent because we detected changes affecting HS code ${hsCode} from your USMCA analysis.
      <br><br>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/settings" style="color: #134169;">Manage alert preferences</a>
    </p>
  </div>

</body>
</html>
  `.trim();
}

/**
 * PHASE 3: Crisis Alert
 * Send crisis alerts from crisis-alert-service queue after admin approval
 */
export async function sendCrisisAlert(alertData) {
  try {
    // Get subscribers based on alert severity
    const tiers = alertData.crisisLevel === 'high'
      ? ['professional', 'business', 'enterprise']
      : ['business', 'enterprise']; // Only higher tiers for medium/low alerts

    const { data: subscribers, error } = await supabase
      .from('user_profiles')
      .select('email, full_name, subscription_tier')
      .in('subscription_tier', tiers)
      .eq('email_notifications', true);

    if (error) throw error;

    console.log(`🚨 Sending crisis alert to ${subscribers.length} subscribers`);

    // Send via SendGrid
    const emailResults = await Promise.all(
      subscribers.map(subscriber =>
        sendCrisisAlertEmail(subscriber, alertData)
      )
    );

    // Log delivery
    await supabase.from('email_logs').insert({
      type: 'crisis_alert',
      crisis_level: alertData.crisisLevel,
      recipients_count: subscribers.length,
      sent_at: new Date().toISOString(),
      content_summary: alertData.title
    });

    return {
      success: true,
      recipientCount: emailResults.filter(r => r.success).length,
      failed: emailResults.filter(r => !r.success).length
    };

  } catch (error) {
    console.error('Crisis alert error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send crisis alert email via SendGrid
 */
async function sendCrisisAlertEmail(subscriber, alertData) {
  try {
    const severityColors = {
      high: '#dc2626',
      medium: '#f59e0b',
      low: '#3b82f6'
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: subscriber.email, name: subscriber.full_name }],
          subject: `🚨 Trade Crisis Alert: ${alertData.title}`
        }],
        from: {
          email: 'alerts@triangleintelligence.com',
          name: 'Triangle Trade Intelligence Crisis Alerts'
        },
        content: [{
          type: 'text/html',
          value: generateCrisisAlertHTML(subscriber, alertData, severityColors[alertData.crisisLevel])
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`SendGrid error: ${response.statusText}`);
    }

    return { success: true, email: subscriber.email };

  } catch (error) {
    console.error(`Failed to send crisis alert to ${subscriber.email}:`, error);
    return { success: false, email: subscriber.email, error: error.message };
  }
}

/**
 * Generate HTML for crisis alert email
 */
function generateCrisisAlertHTML(subscriber, alertData, severityColor) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trade Crisis Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">🚨 ${alertData.crisisLevel.toUpperCase()} Priority Alert</h1>
    <p style="margin: 5px 0 0 0; opacity: 0.9;">${alertData.title}</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">

    <div style="background: #fef2f2; border: 2px solid ${severityColor}; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 10px 0; color: ${severityColor};">What Happened:</h2>
      <p style="margin: 0; font-size: 16px;">${alertData.description}</p>
    </div>

    ${alertData.affectedProducts && alertData.affectedProducts.length > 0 ? `
      <h3 style="color: #134169;">Affected Products:</h3>
      <ul style="margin: 10px 0; padding-left: 20px;">
        ${alertData.affectedProducts.map(product => `<li>${product}</li>`).join('')}
      </ul>
    ` : ''}

    ${alertData.financialImpact ? `
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-weight: 600; color: #92400e;">💰 Estimated Financial Impact:</p>
        <p style="margin: 10px 0 0 0;">${alertData.financialImpact}</p>
      </div>
    ` : ''}

    ${alertData.recommendations && alertData.recommendations.length > 0 ? `
      <h3 style="color: #134169;">Recommended Actions:</h3>
      <ol style="margin: 10px 0; padding-left: 20px;">
        ${alertData.recommendations.map(rec => `<li style="margin-bottom: 10px;">${rec}</li>`).join('')}
      </ol>
    ` : ''}

    <div style="margin: 30px 0 20px 0; padding: 20px; background: #eff6ff; border-radius: 8px;">
      <p style="margin: 0 0 10px 0; font-weight: 600; color: #134169;">Need Expert Help?</p>
      <p style="margin: 0;">Schedule a crisis response consultation with Cristina (Trade Compliance Expert, 17 years logistics experience) to develop your response strategy.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/services"
         style="display: inline-block; margin-top: 15px; padding: 12px 24px; background: #134169; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Request Crisis Response Service
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      You're receiving this crisis alert as a ${subscriber.subscription_tier} subscriber.
      <br><br>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/settings" style="color: #134169;">Manage alert preferences</a>
    </p>
  </div>

</body>
</html>
  `.trim();
}

/**
 * Helper: Get all unique HS codes from workflows for monitoring
 */
export async function getActiveHSCodes() {
  try {
    const { data, error } = await supabase
      .from('usmca_workflows')
      .select('hs_code, user_id, company_name')
      .not('hs_code', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by HS code with user count
    const hsCodes = {};
    data.forEach(row => {
      if (!hsCodes[row.hs_code]) {
        hsCodes[row.hs_code] = {
          code: row.hs_code,
          users: new Set(),
          companies: []
        };
      }
      hsCodes[row.hs_code].users.add(row.user_id);
      if (!hsCodes[row.hs_code].companies.includes(row.company_name)) {
        hsCodes[row.hs_code].companies.push(row.company_name);
      }
    });

    // Convert to array sorted by user count
    return Object.values(hsCodes)
      .map(item => ({
        hs_code: item.code,
        user_count: item.users.size,
        company_examples: item.companies.slice(0, 3)
      }))
      .sort((a, b) => b.user_count - a.user_count);

  } catch (error) {
    console.error('Error getting HS codes:', error);
    return [];
  }
}
