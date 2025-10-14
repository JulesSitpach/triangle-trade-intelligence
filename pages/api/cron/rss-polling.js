/**
 * VERCEL CRON JOB - RSS POLLING
 * Called every 30 minutes by Vercel Cron
 * Polls Bloomberg, Reuters, and Federal Register for trade policy updates
 * Part of referral trial activation - real-time monitoring for Adam & Anthony
 */

const RSSPollingEngine = require('../../../lib/services/rss-polling-engine');

export default async function handler(req, res) {
  // Verify this is a Vercel Cron request
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // In production, verify cron secret
  if (process.env.NODE_ENV === 'production') {
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.log('🚫 Unauthorized cron request');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
  }

  const startTime = Date.now();

  try {
    console.log('🔄 RSS Polling Cron Job Started:', new Date().toISOString());

    // Initialize RSS polling engine
    const rssEngine = new RSSPollingEngine();

    // Poll all active feeds
    const result = await rssEngine.pollAllFeeds();

    const executionTime = Date.now() - startTime;

    console.log('✅ RSS Polling Cron Job Completed:', {
      executionTime: `${executionTime}ms`,
      successful: result.successful,
      failed: result.failed,
      total: result.total
    });

    return res.status(200).json({
      success: true,
      message: 'RSS polling completed successfully',
      execution_time_ms: executionTime,
      feeds_polled: result.total || 0,
      successful_polls: result.successful || 0,
      failed_polls: result.failed || 0,
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
