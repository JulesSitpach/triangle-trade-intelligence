import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized access
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔍 [CRON] Starting stale policy rate check...');

    // Find expired rates that aren't already marked stale
    const { data: expiredRates, error: fetchError } = await supabase
      .from('policy_tariffs_cache')
      .select('*')
      .lt('expires_at', new Date().toISOString())
      .eq('is_stale', false);

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch rates' });
    }

    if (!expiredRates || expiredRates.length === 0) {
      console.log('✅ [CRON] No expired rates found - all rates are fresh');
      return res.status(200).json({
        success: true,
        message: 'No stale rates found',
        stale_count: 0
      });
    }

    // Mark rates as stale
    const updates = expiredRates.map(rate => ({
      ...rate,
      is_stale: true,
      stale_reason: `Expired on ${new Date(rate.expires_at).toLocaleDateString()}`,
      updated_at: new Date().toISOString()
    }));

    const { error: updateError } = await supabase
      .from('policy_tariffs_cache')
      .upsert(updates, { onConflict: 'hs_code' });

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to mark rates as stale' });
    }

    // Group by policy type for email summary
    const section301Count = expiredRates.filter(r => r.section_301 > 0).length;
    const section232Count = expiredRates.filter(r => r.section_232 > 0).length;
    const ieepaCount = expiredRates.filter(r => r.ieepa_reciprocal > 0).length;

    console.log(`⚠️ [CRON] Marked ${expiredRates.length} rates as stale:`, {
      section_301: section301Count,
      section_232: section232Count,
      ieepa: ieepaCount
    });

    // Send email notification to admin
    const emailHtml = `
      <h2>🚨 Stale Policy Rates Alert</h2>
      <p>The following tariff policy rates have expired and need verification:</p>

      <div style="background: #fef2f2; border: 2px solid #fca5a5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin-top: 0;">Summary</h3>
        <ul>
          <li><strong>Total Expired:</strong> ${expiredRates.length} HS codes</li>
          <li><strong>Section 301 (China):</strong> ${section301Count} HS codes</li>
          <li><strong>Section 232 (Steel/Aluminum):</strong> ${section232Count} HS codes</li>
          <li><strong>IEEPA Reciprocal:</strong> ${ieepaCount} HS codes</li>
        </ul>
      </div>

      <h3>Expired Rates (First 10)</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
            <th style="padding: 8px; text-align: left;">HS Code</th>
            <th style="padding: 8px; text-align: left;">Section 301</th>
            <th style="padding: 8px; text-align: left;">Section 232</th>
            <th style="padding: 8px; text-align: left;">Expired</th>
          </tr>
        </thead>
        <tbody>
          ${expiredRates.slice(0, 10).map(rate => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px; font-family: monospace;">${rate.hs_code}</td>
              <td style="padding: 8px;">${rate.section_301 > 0 ? `${(rate.section_301 * 100).toFixed(1)}%` : '-'}</td>
              <td style="padding: 8px;">${rate.section_232 > 0 ? `${(rate.section_232 * 100).toFixed(1)}%` : '-'}</td>
              <td style="padding: 8px; color: #dc2626;">${new Date(rate.expires_at).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${expiredRates.length > 10 ? `<p style="color: #6b7280; font-size: 14px;">...and ${expiredRates.length - 10} more</p>` : ''}

      <div style="margin-top: 24px; padding: 16px; background: #f0f9ff; border-radius: 8px;">
        <p style="margin: 0;">
          <strong>Action Required:</strong>
          <a href="https://triangle-trade-intelligence.vercel.app/admin/dev-dashboard" style="color: #2563eb; text-decoration: none;">
            Visit Admin Dashboard
          </a>
          to update these rates.
        </p>
      </div>

      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
        This is an automated notification from Triangle Intelligence Platform.<br>
        Cron job runs daily at midnight UTC.
      </p>
    `;

    // Send email using Resend
    try {
      await resend.emails.send({
        from: 'Triangle Intelligence <noreply@triangle-trade-intelligence.vercel.app>',
        to: process.env.ADMIN_EMAIL || 'nature098@icloud.com', // Use env variable for admin email
        subject: `🚨 ${expiredRates.length} Policy Rates Need Update`,
        html: emailHtml
      });

      console.log('✅ [CRON] Email notification sent to admin');
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Don't fail the entire cron job if email fails
    }

    return res.status(200).json({
      success: true,
      stale_count: expiredRates.length,
      breakdown: {
        section_301: section301Count,
        section_232: section232Count,
        ieepa: ieepaCount
      }
    });
  } catch (error) {
    console.error('Stale rate flagging error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
