// Daily Policy Monitoring API Endpoint
// Runs automated searches for trade policy changes

import AutomatedTradeResearch from '../../../lib/services/automated-trade-research'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify cron job authorization
  const authToken = req.headers['x-cron-auth']
  if (authToken !== process.env.CRON_AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  console.log('[API] Starting daily policy monitoring...')

  try {
    const researcher = new AutomatedTradeResearch()

    // Run all daily monitoring tasks
    const [
      policyUpdates,
      freshnessUpdates
    ] = await Promise.all([
      researcher.runDailyPolicyMonitoring(),
      researcher.updateDataFreshnessScores()
    ])

    const summary = {
      status: 'success',
      timestamp: new Date().toISOString(),
      execution_time_ms: Date.now() - startTime,
      results: {
        policy_updates_found: policyUpdates.length,
        high_priority_updates: policyUpdates.filter(u => u.relevance_score > 0.8).length,
        freshness_updates: freshnessUpdates.length,
        stale_records: freshnessUpdates.filter(u => u.needs_refresh).length
      },
      next_scheduled_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    // Log significant findings
    if (policyUpdates.length > 0) {
      console.log(`[ALERT] ${policyUpdates.length} policy updates detected`)

      // Send alert email for high-priority updates
      const highPriorityUpdates = policyUpdates.filter(u => u.relevance_score > 0.8)
      if (highPriorityUpdates.length > 0) {
        await sendPolicyAlertEmail(highPriorityUpdates)
      }
    }

    console.log('[API] Daily monitoring completed successfully')
    return res.status(200).json(summary)

  } catch (error) {
    console.error('[ERROR] Daily monitoring failed:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Daily monitoring failed',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

async function sendPolicyAlertEmail(updates) {
  // This would integrate with your email service (SendGrid, etc.)
  console.log(`[EMAIL ALERT] Sending policy alert for ${updates.length} high-priority updates`)

  const emailContent = {
    subject: `🚨 High-Priority Trade Policy Updates Detected`,
    body: `
      ${updates.length} significant trade policy changes detected:

      ${updates.map(update => `
        • ${update.policy_type}: ${update.summary}
          Effective: ${update.effective_date}
          Source: ${update.source_url}
          Score: ${Math.round(update.relevance_score * 100)}%
      `).join('\n')}

      Review immediately at: ${process.env.NEXT_PUBLIC_BASE_URL}/admin/policy-alerts
    `
  }

  // Implementation would send actual emails
  console.log('[EMAIL] Policy alert prepared:', emailContent.subject)
}

const startTime = Date.now()