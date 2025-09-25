// Automated Research Scheduler
// Manages cron jobs and scheduling for trade research automation

import cron from 'node-cron'
import AutomatedTradeResearch from '../services/automated-trade-research'

class AutomatedResearchScheduler {
  constructor() {
    this.researcher = new AutomatedTradeResearch()
    this.scheduledJobs = new Map()
    this.isInitialized = false
  }

  // Initialize all scheduled jobs
  init() {
    if (this.isInitialized) {
      console.log('[SCHEDULER] Already initialized, skipping...')
      return
    }

    console.log('[SCHEDULER] Initializing automated trade research scheduler...')

    this.scheduleJobs()
    this.isInitialized = true

    console.log(`[SCHEDULER] ${this.scheduledJobs.size} jobs scheduled successfully`)
  }

  scheduleJobs() {
    // 1. DAILY POLICY MONITORING - Every day at 6 AM UTC
    const dailyPolicyJob = cron.schedule('0 6 * * *', async () => {
      console.log('[CRON] Running daily policy monitoring...')
      try {
        await this.researcher.runDailyPolicyMonitoring()
        console.log('[CRON] Daily policy monitoring completed')
      } catch (error) {
        console.error('[CRON ERROR] Daily policy monitoring failed:', error)
        await this.handleJobError('daily_policy_monitoring', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })

    this.scheduledJobs.set('daily_policy_monitoring', {
      job: dailyPolicyJob,
      description: 'Daily trade policy monitoring and alerts',
      schedule: '0 6 * * *',
      lastRun: null,
      nextRun: null
    })

    // 2. WEEKLY TARIFF VERIFICATION - Every Sunday at 3 AM UTC
    const weeklyTariffJob = cron.schedule('0 3 * * 0', async () => {
      console.log('[CRON] Running weekly tariff verification...')
      try {
        await this.researcher.runWeeklyTariffVerification()
        console.log('[CRON] Weekly tariff verification completed')
      } catch (error) {
        console.error('[CRON ERROR] Weekly tariff verification failed:', error)
        await this.handleJobError('weekly_tariff_verification', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })

    this.scheduledJobs.set('weekly_tariff_verification', {
      job: weeklyTariffJob,
      description: 'Weekly tariff rate verification and staging',
      schedule: '0 3 * * 0',
      lastRun: null,
      nextRun: null
    })

    // 3. USMCA MONITORING - Every Tuesday and Friday at 2 PM UTC
    const usmcaMonitoringJob = cron.schedule('0 14 * * 2,5', async () => {
      console.log('[CRON] Running USMCA rules monitoring...')
      try {
        await this.researcher.runUSMCAMonitoring()
        console.log('[CRON] USMCA monitoring completed')
      } catch (error) {
        console.error('[CRON ERROR] USMCA monitoring failed:', error)
        await this.handleJobError('usmca_monitoring', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })

    this.scheduledJobs.set('usmca_monitoring', {
      job: usmcaMonitoringJob,
      description: 'USMCA rules and qualification monitoring',
      schedule: '0 14 * * 2,5',
      lastRun: null,
      nextRun: null
    })

    // 4. TRUMP POLICY INTELLIGENCE - Every 4 hours during business days
    const trumpPolicyJob = cron.schedule('0 */4 * * 1-5', async () => {
      console.log('[CRON] Running Trump policy intelligence...')
      try {
        await this.researcher.runTrumpPolicyIntelligence()
        console.log('[CRON] Trump policy intelligence completed')
      } catch (error) {
        console.error('[CRON ERROR] Trump policy intelligence failed:', error)
        await this.handleJobError('trump_policy_intelligence', error)
      }
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    })

    this.scheduledJobs.set('trump_policy_intelligence', {
      job: trumpPolicyJob,
      description: 'High-frequency Trump administration policy monitoring',
      schedule: '0 */4 * * 1-5',
      lastRun: null,
      nextRun: null
    })

    // 5. DATA FRESHNESS SCORING - Every 6 hours
    const freshnessJob = cron.schedule('0 */6 * * *', async () => {
      console.log('[CRON] Updating data freshness scores...')
      try {
        await this.researcher.updateDataFreshnessScores()
        console.log('[CRON] Data freshness scoring completed')
      } catch (error) {
        console.error('[CRON ERROR] Data freshness scoring failed:', error)
        await this.handleJobError('data_freshness_scoring', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })

    this.scheduledJobs.set('data_freshness_scoring', {
      job: freshnessJob,
      description: 'Update data freshness and verification priorities',
      schedule: '0 */6 * * *',
      lastRun: null,
      nextRun: null
    })

    // 6. HIGH-PRIORITY PRODUCT MONITORING - Every 2 hours during business hours
    const highPriorityJob = cron.schedule('0 */2 8-18 * * 1-5', async () => {
      console.log('[CRON] Running high-priority product monitoring...')
      try {
        await this.runHighPriorityProductMonitoring()
        console.log('[CRON] High-priority monitoring completed')
      } catch (error) {
        console.error('[CRON ERROR] High-priority monitoring failed:', error)
        await this.handleJobError('high_priority_monitoring', error)
      }
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    })

    this.scheduledJobs.set('high_priority_monitoring', {
      job: highPriorityJob,
      description: 'Monitor high-impact products (mangoes, cars, electronics)',
      schedule: '0 */2 8-18 * * 1-5',
      lastRun: null,
      nextRun: null
    })
  }

  // Start all scheduled jobs
  start() {
    console.log('[SCHEDULER] Starting all scheduled jobs...')

    for (const [jobName, jobInfo] of this.scheduledJobs) {
      try {
        jobInfo.job.start()
        jobInfo.nextRun = this.getNextRunTime(jobInfo.schedule)

        console.log(`[SCHEDULER] ✓ ${jobName} started - Next run: ${jobInfo.nextRun}`)
      } catch (error) {
        console.error(`[SCHEDULER ERROR] Failed to start ${jobName}:`, error)
      }
    }

    console.log(`[SCHEDULER] All ${this.scheduledJobs.size} jobs started successfully`)
  }

  // Stop all scheduled jobs
  stop() {
    console.log('[SCHEDULER] Stopping all scheduled jobs...')

    for (const [jobName, jobInfo] of this.scheduledJobs) {
      try {
        jobInfo.job.stop()
        console.log(`[SCHEDULER] ✓ ${jobName} stopped`)
      } catch (error) {
        console.error(`[SCHEDULER ERROR] Failed to stop ${jobName}:`, error)
      }
    }

    console.log('[SCHEDULER] All jobs stopped')
  }

  // Get status of all jobs
  getStatus() {
    const status = {
      scheduler_initialized: this.isInitialized,
      total_jobs: this.scheduledJobs.size,
      jobs: {}
    }

    for (const [jobName, jobInfo] of this.scheduledJobs) {
      status.jobs[jobName] = {
        description: jobInfo.description,
        schedule: jobInfo.schedule,
        running: jobInfo.job.running,
        last_run: jobInfo.lastRun,
        next_run: jobInfo.nextRun
      }
    }

    return status
  }

  // Manual job execution
  async runJobManually(jobName) {
    const jobInfo = this.scheduledJobs.get(jobName)

    if (!jobInfo) {
      throw new Error(`Job '${jobName}' not found`)
    }

    console.log(`[MANUAL] Running ${jobName} manually...`)

    try {
      switch (jobName) {
        case 'daily_policy_monitoring':
          await this.researcher.runDailyPolicyMonitoring()
          break
        case 'weekly_tariff_verification':
          await this.researcher.runWeeklyTariffVerification()
          break
        case 'usmca_monitoring':
          await this.researcher.runUSMCAMonitoring()
          break
        case 'trump_policy_intelligence':
          await this.researcher.runTrumpPolicyIntelligence()
          break
        case 'data_freshness_scoring':
          await this.researcher.updateDataFreshnessScores()
          break
        case 'high_priority_monitoring':
          await this.runHighPriorityProductMonitoring()
          break
        default:
          throw new Error(`Unknown job: ${jobName}`)
      }

      jobInfo.lastRun = new Date().toISOString()
      console.log(`[MANUAL] ${jobName} completed successfully`)

      return { success: true, completed_at: jobInfo.lastRun }

    } catch (error) {
      console.error(`[MANUAL ERROR] ${jobName} failed:`, error)
      await this.handleJobError(jobName, error)
      throw error
    }
  }

  // High-priority product monitoring
  async runHighPriorityProductMonitoring() {
    const highPriorityProducts = [
      '0811905200', // Mangoes
      '8703210000', // Cars 1000-1500cc
      '8517620000', // Smartphones
      '8471300000', // Portable computers
      '6203420010'  // Cotton trousers
    ]

    for (const hsCode of highPriorityProducts) {
      try {
        // Verify current tariff rate
        const currentRate = await this.researcher.verifyTariffRate(hsCode, 'US')

        console.log(`[HIGH PRIORITY] Checked ${hsCode}: ${currentRate.rate}%`)

        // Check for recent policy changes affecting this product
        const policyChecks = await this.checkProductPolicyChanges(hsCode)

        if (policyChecks.changesDetected) {
          console.log(`[ALERT] Policy changes detected for ${hsCode}`)
          await this.sendHighPriorityAlert(hsCode, policyChecks)
        }

      } catch (error) {
        console.error(`[ERROR] High-priority check failed for ${hsCode}:`, error)
      }
    }
  }

  async checkProductPolicyChanges(hsCode) {
    // Check for recent policy changes affecting specific products
    // This would integrate with the policy monitoring system
    return {
      changesDetected: Math.random() > 0.9, // Simulate rare but important changes
      changes: ['Section 301 tariff increase', 'USMCA qualification criteria update']
    }
  }

  async sendHighPriorityAlert(hsCode, changes) {
    console.log(`[HIGH PRIORITY ALERT] Product ${hsCode} affected by policy changes`)
    // Implementation would send immediate alerts to affected customers
  }

  async handleJobError(jobName, error) {
    console.error(`[JOB ERROR] ${jobName} failed:`, error.message)

    // Log error to database or monitoring system
    // Send error alerts to admin team
    // Implement retry logic if appropriate

    const errorReport = {
      job_name: jobName,
      error_message: error.message,
      error_stack: error.stack,
      timestamp: new Date().toISOString(),
      retry_scheduled: false
    }

    console.log(`[ERROR REPORT] ${JSON.stringify(errorReport, null, 2)}`)
  }

  getNextRunTime(cronExpression) {
    // This would calculate the next run time based on cron expression
    // For now, return a placeholder
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
}

// Export singleton instance
const scheduler = new AutomatedResearchScheduler()

export default scheduler
export { AutomatedResearchScheduler }