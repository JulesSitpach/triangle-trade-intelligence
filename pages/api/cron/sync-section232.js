/**
 * CRON JOB: Sync Section 232 Tariff Rates
 * Schedule: Daily at 06:30 UTC
 */

import { section232Sync } from '../../../lib/services/section232-sync.js';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[CRON] Starting Section 232 sync...');

    const result = await section232Sync.syncSection232Rates();

    console.log('[CRON] Section 232 sync completed:', result);

    return res.status(200).json({
      success: true,
      message: 'Section 232 rates synced',
      result
    });

  } catch (error) {
    console.error('[CRON] Section 232 sync failed:', error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
