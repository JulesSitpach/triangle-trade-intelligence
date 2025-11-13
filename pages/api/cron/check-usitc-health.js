/**
 * USITC API Health Check Cron Job
 *
 * Runs daily to check if USITC DataWeb API is back online.
 * When service returns, sends notification and logs to database.
 *
 * Schedule: Daily at 09:00 UTC (3 AM CST)
 * Endpoint: /api/cron/check-usitc-health
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Verify cron secret (security)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('❌ [USITC-HEALTH] Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🔍 [USITC-HEALTH] Starting daily health check...');

  try {
    // Test USITC API with simple request
    const testHsCode = '85423200'; // Known good code (semiconductors)
    const response = await fetch('https://datawebws.usitc.gov/dataweb/api/v2/report2/runReport', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.USITC_API_KEY
      },
      body: JSON.stringify({
        reportName: 'Tariff Rate',
        reportParameters: {
          htsNumber: testHsCode
        }
      }),
      timeout: 10000 // 10 second timeout
    });

    const isHealthy = response.status === 200;
    const statusCode = response.status;

    // Log health check result to database
    const { error: logError } = await supabase
      .from('api_health_logs')
      .insert({
        api_name: 'usitc_dataweb',
        status_code: statusCode,
        is_healthy: isHealthy,
        response_time_ms: 0, // Could measure this
        checked_at: new Date().toISOString(),
        error_message: isHealthy ? null : await response.text()
      });

    if (logError) {
      console.error('⚠️ [USITC-HEALTH] Failed to log health check:', logError);
    }

    // If API just came back online, send notification
    if (isHealthy) {
      console.log('✅ [USITC-HEALTH] API is healthy! Checking if this is a recovery...');

      // Check if API was previously down
      const { data: recentLogs } = await supabase
        .from('api_health_logs')
        .select('is_healthy')
        .eq('api_name', 'usitc_dataweb')
        .order('checked_at', { ascending: false })
        .limit(2); // Get last 2 checks

      const wasDown = recentLogs && recentLogs.length > 1 && !recentLogs[1].is_healthy;

      if (wasDown) {
        console.log('🎉 [USITC-HEALTH] API RECOVERED! Sending notification...');

        // Log recovery event
        await supabase
          .from('dev_issues')
          .insert({
            issue_type: 'api_recovery',
            severity: 'info',
            title: 'USITC API Back Online',
            description: `USITC DataWeb API has recovered and is now responding with 200 OK. Integration can be activated.`,
            metadata: {
              api: 'usitc_dataweb',
              status_code: statusCode,
              recovery_time: new Date().toISOString()
            }
          });

        // TODO: Send email notification to admin
        // await sendAdminEmail('USITC API Recovery', 'API is back online...');
      }

      return res.status(200).json({
        status: 'healthy',
        message: 'USITC API is online',
        statusCode: statusCode,
        recovery: wasDown,
        nextCheck: '24 hours'
      });
    } else {
      console.log(`⚠️ [USITC-HEALTH] API still down (${statusCode})`);

      return res.status(200).json({
        status: 'unhealthy',
        message: `USITC API returned ${statusCode}`,
        statusCode: statusCode,
        nextCheck: '24 hours'
      });
    }

  } catch (error) {
    console.error('❌ [USITC-HEALTH] Health check failed:', error.message);

    // Log error to database
    await supabase
      .from('api_health_logs')
      .insert({
        api_name: 'usitc_dataweb',
        status_code: 0,
        is_healthy: false,
        checked_at: new Date().toISOString(),
        error_message: error.message
      });

    return res.status(200).json({
      status: 'error',
      message: error.message,
      nextCheck: '24 hours'
    });
  }
}
