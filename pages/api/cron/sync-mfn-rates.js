/**
 * CRON JOB: Sync MFN Base Tariff Rates
 * Schedule: Weekly on Sundays at 03:00 UTC
 */

import { mfnBaseRatesSync } from '../../../lib/services/mfn-base-rates-sync.js';

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
    console.log('[CRON] Starting MFN base rates sync...');

    const result = await mfnBaseRatesSync.syncMFNRates();

    console.log('[CRON] MFN sync completed:', result);

    return res.status(200).json({
      success: true,
      message: 'MFN base rates synced',
      result
    });

  } catch (error) {
    console.error('[CRON] MFN sync failed:', error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
