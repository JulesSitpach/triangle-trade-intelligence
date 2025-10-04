/**
 * POST /api/admin/approve-crisis-alert
 *
 * Approves a crisis alert and sends it via SendGrid email-monitoring-service
 */

import { sendCrisisAlert } from '../../../lib/services/email-monitoring-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { alertId, alertData, action } = req.body;

    if (!alertId || !alertData) {
      return res.status(400).json({ error: 'Missing alertId or alertData' });
    }

    // Handle dismiss action
    if (action === 'dismiss') {
      return res.status(200).json({
        success: true,
        message: 'Alert dismissed',
        alertId
      });
    }

    // Send via SendGrid using email-monitoring-service
    const result = await sendCrisisAlert(alertData);

    if (!result.success) {
      throw new Error(result.error || 'Failed to send crisis alert');
    }

    res.status(200).json({
      success: true,
      message: `Crisis alert sent to ${result.recipientCount} subscribers`,
      alertId,
      recipientCount: result.recipientCount
    });
  } catch (error) {
    console.error('Error approving crisis alert:', error);
    res.status(500).json({
      error: error.message || 'Failed to approve crisis alert'
    });
  }
}
