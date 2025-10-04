/**
 * GET /api/admin/crisis-alerts-queue
 *
 * Retrieves queued alerts from crisis-alert-service for admin review
 */

import { crisisAlertService } from '../../../lib/services/crisis-alert-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get queued alerts from crisis-alert-service
    const queuedAlerts = crisisAlertService.getQueuedAlerts();

    // Sort by severity and date
    const sortedAlerts = queuedAlerts
      .sort((a, b) => {
        // High severity first
        if (a.alert.crisisLevel === 'high' && b.alert.crisisLevel !== 'high') return -1;
        if (a.alert.crisisLevel !== 'high' && b.alert.crisisLevel === 'high') return 1;

        // Then by date (newest first)
        return new Date(b.queuedAt) - new Date(a.queuedAt);
      });

    res.status(200).json({
      success: true,
      count: sortedAlerts.length,
      alerts: sortedAlerts
    });
  } catch (error) {
    console.error('Error fetching crisis alerts queue:', error);
    res.status(500).json({ error: 'Failed to fetch crisis alerts queue' });
  }
}
