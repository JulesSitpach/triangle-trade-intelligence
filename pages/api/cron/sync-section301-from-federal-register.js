/**
 * CRON JOB: Sync Section 301 Tariff Rates from Federal Register
 *
 * Schedule: Daily at 06:00 UTC
 * Purpose: Replace manual hardcoded rate updates with automated Federal Register monitoring
 *
 * Vercel Cron Configuration:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-section301-from-federal-register",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 */

import { federalRegisterSection301Sync } from '../../../lib/services/federal-register-section301-sync.js';

export default async function handler(req, res) {
  // Verify this is a legitimate cron request (not user-initiated)
  const authHeader = req.headers.authorization;
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized - Invalid cron secret' });
  }

  // Only allow POST from Vercel cron
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[CRON] Starting Federal Register Section 301 sync...');

    const result = await federalRegisterSection301Sync.syncSection301FromFederalRegister();

    console.log('[CRON] Section 301 sync completed:', result);

    return res.status(200).json({
      success: true,
      message: 'Section 301 rates synced from Federal Register',
      result
    });

  } catch (error) {
    console.error('[CRON] Section 301 sync failed:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
