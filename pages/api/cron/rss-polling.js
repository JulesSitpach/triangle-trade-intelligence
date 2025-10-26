/**
 * VERCEL CRON JOB - RSS POLLING + TARIFF SYNC
 * Called every 2 hours by Vercel Cron (Pro Plan - faster alerts for competitive advantage)
 * Polls USITC, USTR, Federal Register, and Financial Times for tariff policy updates
 * Also syncs live tariff rates from USITC DataWeb API for October 2025 accuracy
 * Laser-focused keywords: tariff announcements, Section 301/232, USMCA changes, port fees
 */

import RSSPollingEngine from '../../../lib/services/rss-polling-engine.js';
import usitcTariffSync from '../../../lib/services/usitc-tariff-sync.js';

export default async function handler(req, res) {
  // Verify this is a Vercel Cron request OR GitHub Actions
  const authHeader = req.headers.authorization;
  const userAgent = req.headers['user-agent'] || '';
  const cronSecret = process.env.CRON_SECRET;

  // In production, verify cron secret OR allow GitHub Actions
  if (process.env.NODE_ENV === 'production') {
    const isVercelCron = authHeader === `Bearer ${cronSecret}`;
    const isGitHubActions = userAgent.includes('curl') || userAgent.includes('GitHub-Actions');

    if (!isVercelCron && !isGitHubActions) {
      console.log('🚫 Unauthorized cron request', { userAgent });
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - This endpoint can only be called by Vercel Cron or GitHub Actions'
      });
    }

    console.log('✅ Authorized request:', isVercelCron ? 'Vercel Cron' : 'GitHub Actions');
  }

  const startTime = Date.now();

  try {
    console.log('🔄 Tariff Update Cron Job Started:', new Date().toISOString());

    const startRss = Date.now();
    const startSync = Date.now();

    // Initialize RSS polling engine
    const rssEngine = new RSSPollingEngine();

    // Poll all active feeds
    const rssResult = await rssEngine.pollAllFeeds();
    const rssTime = Date.now() - startRss;

    console.log('✅ RSS Polling Completed:', {
      executionTime: `${rssTime}ms`,
      successful: rssResult.successful,
      failed: rssResult.failed,
      total: rssResult.total
    });

    // Sync real-time tariff rates from USITC API
    console.log('🔄 Syncing USITC tariff rates...');
    const syncResult = await usitcTariffSync.syncUSITCTariffRates();
    const syncTime = Date.now() - startSync;

    console.log('✅ USITC Tariff Sync Completed:', {
      executionTime: `${syncTime}ms`,
      updated: syncResult.updated,
      errors: syncResult.errors
    });

    const executionTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      message: 'Tariff updates completed successfully',
      execution_time_ms: executionTime,
      rss_polling: {
        feeds_polled: rssResult.total || 0,
        successful_polls: rssResult.successful || 0,
        failed_polls: rssResult.failed || 0,
        duration_ms: rssTime
      },
      tariff_sync: {
        codes_updated: syncResult.updated || 0,
        errors: syncResult.errors || 0,
        duration_ms: syncTime
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;

    console.error('❌ RSS Polling Cron Job Failed:', error);

    return res.status(500).json({
      success: false,
      error: 'RSS polling failed',
      message: error.message,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    });
  }
}

// Vercel Cron specific configuration
export const config = {
  maxDuration: 60, // Max 60 seconds execution time
  api: {
    bodyParser: false,
    externalResolver: true
  }
};
