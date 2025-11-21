/**
 * DAILY TARIFF CACHE HEALTH CHECK - CRON ENDPOINT
 *
 * PURPOSE:
 * Run automated daily validation of policy_tariffs_cache data integrity.
 * Alerts team if critical issues detected.
 *
 * VERCEL CRON CONFIGURATION:
 * Add to vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/validate-tariff-health",
 *       "schedule": "0 8 * * *"
 *     }
 *   ]
 * }
 *
 * SCHEDULE: Daily at 8:00 AM UTC
 *
 * ENVIRONMENT VARIABLES:
 * - CRON_SECRET: Secret key to prevent unauthorized cron triggers (optional)
 * - SLACK_WEBHOOK_URL: Send alerts to Slack (optional)
 *
 * USAGE:
 * - Vercel cron: Automatic daily execution
 * - Manual test: GET /api/cron/validate-tariff-health?secret=YOUR_SECRET
 *
 * RESPONSE:
 * - 200: Health checks passed
 * - 500: Critical issues detected
 *
 * Created: November 20, 2025
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Validate cron secret (if configured)
 */
function validateCronSecret(req) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return true; // No secret configured, allow all
  }

  const providedSecret = req.query.secret || req.headers['x-vercel-signature'];
  return providedSecret === cronSecret;
}

/**
 * Send alert to Slack (if configured)
 */
async function sendSlackAlert(message, severity = 'warning') {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return; // No Slack configured
  }

  const color = severity === 'critical' ? '#FF0000' : '#FFA500';
  const emoji = severity === 'critical' ? '🚨' : '⚠️';

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${emoji} Tariff Cache Health Alert`,
        attachments: [{
          color,
          text: message,
          footer: 'Triangle Intelligence Platform',
          ts: Math.floor(Date.now() / 1000)
        }]
      })
    });
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

/**
 * CHECK 1: No section_301 = 0
 */
async function checkSection301Zeros() {
  const { count, error } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .eq('section_301', 0);

  if (error) {
    return { name: 'Section 301 Zeros', passed: false, message: `Database error: ${error.message}`, severity: 'critical' };
  }

  if (count > 0) {
    return { name: 'Section 301 Zeros', passed: false, message: `Found ${count} codes with section_301 = 0 (should be null or positive)`, severity: 'critical' };
  }

  return { name: 'Section 301 Zeros', passed: true, message: 'No codes with section_301 = 0' };
}

/**
 * CHECK 2: Section 232 zeros (some legitimate)
 */
async function checkSection232Zeros() {
  const { count } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .eq('section_232', 0);

  const expectedExemptions = 47;
  const passed = count <= expectedExemptions + 5;

  if (!passed) {
    return { name: 'Section 232 Zeros', passed: false, message: `Found ${count} codes with section_232 = 0 (expected ~${expectedExemptions})`, severity: 'warning' };
  }

  return { name: 'Section 232 Zeros', passed: true, message: `${count} codes with section_232 = 0 (within range)` };
}

/**
 * CHECK 3: Ghost codes (both tariffs null)
 */
async function checkGhostCodes() {
  const { count } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .is('section_301', null)
    .is('section_232', null);

  if (count > 0) {
    return { name: 'Ghost Codes', passed: false, message: `Found ${count} codes with both tariffs null`, severity: 'warning' };
  }

  return { name: 'Ghost Codes', passed: true, message: 'No ghost codes' };
}

/**
 * CHECK 4: Steel codes have Section 232
 */
async function checkSteelSection232() {
  const { count } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .like('hs_code', '73%')
    .is('section_232', null);

  if (count > 0) {
    return { name: 'Steel Section 232', passed: false, message: `Found ${count} Chapter 73 codes without section_232`, severity: 'warning' };
  }

  return { name: 'Steel Section 232', passed: true, message: 'All Chapter 73 codes have section_232' };
}

/**
 * CHECK 5: Data freshness
 */
async function checkDataFreshness() {
  const { count: total } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true });

  const { count: fresh90d } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .gte('verified_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  const staleCount = total - fresh90d;
  const stalePercent = ((staleCount / total) * 100).toFixed(1);
  const passed = stalePercent < 5;

  if (!passed) {
    return { name: 'Data Freshness', passed: false, message: `${stalePercent}% of data is stale (>90 days)`, severity: 'warning' };
  }

  return { name: 'Data Freshness', passed: true, message: `${stalePercent}% stale (${staleCount} codes)` };
}

/**
 * CHECK 6: HS code format
 */
async function checkHSCodeFormat() {
  const { count: withPeriods } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .like('hs_code', '%.%');

  if (withPeriods > 50) {
    return { name: 'HS Code Format', passed: false, message: `${withPeriods} codes have periods (need normalization)`, severity: 'warning' };
  }

  return { name: 'HS Code Format', passed: true, message: `Only ${withPeriods} codes with format issues` };
}

/**
 * CHECK 7: Rate ranges
 */
async function checkTariffRateRanges() {
  const { count } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .or('section_301.gt.1.0,section_232.gt.1.0');

  if (count > 0) {
    return { name: 'Rate Ranges', passed: false, message: `${count} codes with rates >1.0 (stored as percentage instead of decimal)`, severity: 'critical' };
  }

  return { name: 'Rate Ranges', passed: true, message: 'All rates in valid range (0.0-1.0)' };
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate cron secret
  if (!validateCronSecret(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🏥 Running daily tariff cache health check...');

  try {
    // Run all checks
    const checks = await Promise.all([
      checkSection301Zeros(),
      checkSection232Zeros(),
      checkGhostCodes(),
      checkSteelSection232(),
      checkDataFreshness(),
      checkHSCodeFormat(),
      checkTariffRateRanges()
    ]);

    // Categorize results
    const passed = checks.filter(c => c.passed);
    const warnings = checks.filter(c => !c.passed && c.severity === 'warning');
    const critical = checks.filter(c => !c.passed && c.severity === 'critical');

    // Build response
    const response = {
      timestamp: new Date().toISOString(),
      summary: {
        total: checks.length,
        passed: passed.length,
        warnings: warnings.length,
        critical: critical.length
      },
      checks: checks.map(c => ({
        name: c.name,
        status: c.passed ? 'PASS' : (c.severity === 'critical' ? 'CRITICAL' : 'WARNING'),
        message: c.message
      }))
    };

    // Send alerts if issues detected
    if (critical.length > 0) {
      const criticalMessages = critical.map(c => `• ${c.name}: ${c.message}`).join('\n');
      await sendSlackAlert(
        `🚨 *CRITICAL TARIFF CACHE ISSUES*\n\n${criticalMessages}\n\nImmediate action required!`,
        'critical'
      );

      console.error('❌ Critical issues detected:', criticalMessages);
      return res.status(500).json({ ...response, status: 'CRITICAL' });
    }

    if (warnings.length > 0) {
      const warningMessages = warnings.map(c => `• ${c.name}: ${c.message}`).join('\n');
      await sendSlackAlert(
        `⚠️ *Tariff Cache Warnings*\n\n${warningMessages}\n\nReview recommended.`,
        'warning'
      );

      console.warn('⚠️ Warnings detected:', warningMessages);
      return res.status(200).json({ ...response, status: 'WARNING' });
    }

    // All checks passed
    console.log('✅ All health checks passed');
    return res.status(200).json({ ...response, status: 'HEALTHY' });

  } catch (error) {
    console.error('❌ Health check failed:', error);

    await sendSlackAlert(
      `🚨 *Health Check Script Failed*\n\nError: ${error.message}\n\nCheck server logs.`,
      'critical'
    );

    return res.status(500).json({
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
