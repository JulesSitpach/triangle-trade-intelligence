/**
 * Admin API: Send HS Code Alert
 * POST /api/admin/send-hs-alert
 *
 * When you notice a tariff change for specific HS code, send targeted alert
 *
 * Usage:
 * 1. Check customs.gov daily (15 min)
 * 2. Notice tariff change for HS code
 * 3. Go to /admin/email-digest page
 * 4. Fill in alert details
 * 5. Send to affected users only
 */

import { sendHSCodeAlert } from '../../../lib/services/email-monitoring-service';
import { withAdmin } from '../../../lib/middleware/auth-middleware';

export default withAdmin(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { hsCode, subject, changeType, description, impact, action } = req.body;

    // Validate
    if (!hsCode || !subject || !description) {
      return res.status(400).json({
        error: 'Need hsCode, subject, and description'
      });
    }

    console.log(`🚨 Admin sending HS code alert: ${hsCode}`);
    console.log(`   Change: ${changeType}`);
    console.log(`   Sent by: ${req.user.email}`);

    // Send alert to affected users
    const result = await sendHSCodeAlert(hsCode, {
      subject,
      changeType,
      description,
      impact,
      action
    });

    return res.status(200).json({
      success: true,
      message: `Alert sent to ${result.sent} affected users`,
      hsCode: hsCode,
      affectedUsers: result.affectedUsers,
      sent: result.sent,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Send HS alert error:', error);
    return res.status(500).json({
      error: 'Failed to send alert',
      details: error.message
    });
  }
});
