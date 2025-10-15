/**
 * RESEND EMAIL ALERT SERVICE
 * Sends personalized crisis alerts to users via email
 * THE retention mechanism - users stay subscribed because alerts come to them
 */

import { Resend } from 'resend';

class ResendAlertService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'alerts@triangle-trade-intelligence.com';
  }

  /**
   * Send crisis alert email to affected users
   */
  async sendCrisisAlert(alert, user) {
    try {
      console.log(`📧 Sending crisis alert email to ${user.email}`);

      const emailHtml = this.generateAlertEmailHTML(alert, user);
      const emailSubject = this.generateSubject(alert);

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: user.email,
        subject: emailSubject,
        html: emailHtml
      });

      console.log(`✅ Email sent to ${user.email}:`, result.id);
      return { success: true, messageId: result.id };

    } catch (error) {
      console.error(`❌ Failed to send email to ${user.email}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate email subject line based on alert severity
   */
  generateSubject(alert) {
    const emoji = alert.severity_level === 'critical' ? '🚨' :
                  alert.severity_level === 'high' ? '⚠️' : 'ℹ️';

    // Keep subject concise and urgent
    return `${emoji} Trade Alert: ${alert.title.substring(0, 50)}${alert.title.length > 50 ? '...' : ''}`;
  }

  /**
   * Generate beautiful HTML email
   */
  generateAlertEmailHTML(alert, user) {
    const severityColor = alert.severity_level === 'critical' ? '#dc2626' :
                         alert.severity_level === 'high' ? '#f59e0b' : '#3b82f6';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trade Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">

    <!-- Header -->
    <div style="background-color: #ffffff; padding: 30px; border-radius: 12px 12px 0 0; border-bottom: 4px solid ${severityColor};">
      <div style="font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 8px;">
        Triangle Trade Intelligence
      </div>
      <div style="font-size: 14px; color: #6b7280;">
        Real-Time Government Alert
      </div>
    </div>

    <!-- Alert Badge -->
    <div style="background-color: ${severityColor}; padding: 16px 30px; color: #ffffff;">
      <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
        ${alert.severity_level.toUpperCase()} ALERT
      </div>
    </div>

    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 30px;">

      <!-- Alert Title -->
      <h1 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 16px 0; line-height: 1.4;">
        ${alert.title}
      </h1>

      <!-- Alert Description -->
      <div style="font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
        ${alert.description || ''}
      </div>

      <!-- Source Information -->
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">
          Official Source
        </div>
        <div style="font-size: 14px; color: #111827; font-weight: 500;">
          ${alert.feed_category === 'government' ? 'U.S. Government' : 'Trade News'}
        </div>
        <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
          ${this.formatDate(alert.created_at)}
        </div>
      </div>

      <!-- Business Impact -->
      ${alert.business_impact ? `
      <div style="margin-bottom: 24px;">
        <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px;">
          Impact on Your Business
        </div>
        <div style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          ${alert.business_impact}
        </div>
      </div>
      ` : ''}

      <!-- Affected HS Codes -->
      ${alert.affected_hs_codes && alert.affected_hs_codes.length > 0 ? `
      <div style="margin-bottom: 24px;">
        <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px;">
          Affected HS Codes
        </div>
        <div style="font-family: monospace; font-size: 13px; color: #4b5563;">
          ${alert.affected_hs_codes.join(', ')}
        </div>
      </div>
      ` : ''}

      <!-- Keywords Matched -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px;">
          Crisis Keywords Detected
        </div>
        <div style="font-size: 13px; color: #6b7280;">
          ${(alert.keywords_matched || []).join(', ')}
        </div>
      </div>

      <!-- Recommended Actions -->
      ${alert.recommended_actions ? `
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 24px;">
        <div style="font-size: 14px; font-weight: 600; color: #065f46; margin-bottom: 8px;">
          ✅ Recommended Actions
        </div>
        <div style="font-size: 14px; color: #047857; line-height: 1.6;">
          ${alert.recommended_actions.replace(/;/g, '<br>•')}
        </div>
      </div>
      ` : ''}

      <!-- Call to Action -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://triangle-trade-intelligence.vercel.app/trade-risk-alternatives"
           style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
          View Full Alert Dashboard →
        </a>
      </div>

      <!-- Professional Services CTA (for high/critical alerts) -->
      ${(alert.severity_level === 'critical' || alert.severity_level === 'high') ? `
      <div style="background-color: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin-top: 24px;">
        <div style="font-size: 16px; font-weight: 600; color: #92400e; margin-bottom: 8px;">
          🎯 Need Expert Help?
        </div>
        <div style="font-size: 14px; color: #78350f; margin-bottom: 16px;">
          Our Mexico-based team can help you navigate this crisis and protect your business.
        </div>
        <a href="https://triangle-trade-intelligence.vercel.app/services/request-form"
           style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">
          Request Crisis Consultation
        </a>
      </div>
      ` : ''}

    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 24px 30px; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
      <div style="font-size: 13px; color: #6b7280; line-height: 1.6;">
        <strong>Why you received this alert:</strong><br>
        This alert matches your trade profile: ${user.company_name || user.email}
        ${user.primaryHSCode ? `<br>HS Code: ${user.primaryHSCode}` : ''}
        ${user.businessType ? `<br>Industry: ${user.businessType}` : ''}
      </div>

      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <div style="font-size: 12px; color: #9ca3af;">
          Triangle Trade Intelligence - Real-Time USMCA Compliance & Trade Alerts<br>
          <a href="https://triangle-trade-intelligence.vercel.app/account/settings"
             style="color: #6b7280; text-decoration: underline;">
            Manage alert preferences
          </a>
        </div>
      </div>
    </div>

  </div>
</body>
</html>
    `;
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  /**
   * Send batch alerts to multiple users
   */
  async sendBatchAlerts(alert, users) {
    const results = [];

    for (const user of users) {
      const result = await this.sendCrisisAlert(alert, user);
      results.push({
        userId: user.id,
        email: user.email,
        ...result
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Get affected users from database based on alert criteria
   * Filters by subscription tier and applies severity-based filtering
   */
  async getAffectedUsers(alert, supabase) {
    try {
      // Query ALL paid users with email notifications enabled
      // Explicitly exclude Trial users (they can view alerts but receive no emails)
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, company_name, subscription_tier')
        .eq('email_notifications', true)
        .in('subscription_tier', ['Starter', 'Professional', 'Premium', 'Enterprise']);

      if (error) {
        console.error('Error fetching affected users:', error);
        return [];
      }

      // Apply tier-based severity filtering
      const filteredUsers = (users || []).filter(user => {
        const tier = user.subscription_tier;
        const severity = alert.severity_level?.toLowerCase();

        // Starter tier: Only high/critical alerts
        if (tier === 'Starter') {
          return severity === 'high' || severity === 'critical';
        }

        // Professional, Premium, Enterprise: All alert levels
        return true;
      });

      console.log(`📧 Alert "${alert.title}" (${alert.severity_level}): ${filteredUsers.length} users qualified`);
      console.log(`   - Total users: ${users.length}, Filtered by severity: ${filteredUsers.length}`);

      return filteredUsers;

    } catch (error) {
      console.error('Error getting affected users:', error);
      return [];
    }
  }
}

export default new ResendAlertService();
