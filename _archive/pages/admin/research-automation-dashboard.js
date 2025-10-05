// Research Automation Dashboard
// Admin interface for managing automated trade research system

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function ResearchAutomationDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [systemStatus, setSystemStatus] = useState(null)
  const [jobStatuses, setJobStatuses] = useState({})
  const [recentAlerts, setRecentAlerts] = useState([])
  const [freshnessMetrics, setFreshnessMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load system status and job information
      const [statusRes, alertsRes, freshnessRes] = await Promise.all([
        fetch('/api/research/system-status'),
        fetch('/api/research/recent-alerts'),
        fetch('/api/research/freshness-metrics')
      ])

      const statusData = await statusRes.json()
      const alertsData = await alertsRes.json()
      const freshnessData = await freshnessRes.json()

      setSystemStatus(statusData)
      setRecentAlerts(alertsData.alerts || [])
      setFreshnessMetrics(freshnessData)

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const runJobManually = async (jobName) => {
    try {
      const response = await fetch(`/api/research/run-job-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_name: jobName })
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ ${jobName} completed successfully`)
        loadDashboardData() // Refresh data
      } else {
        alert(`❌ ${jobName} failed: ${result.error}`)
      }

    } catch (error) {
      alert(`❌ Failed to run ${jobName}: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading research automation dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">🤖 Research Automation Dashboard</h1>
          <p className="mt-2 text-gray-600">Monitor and manage automated trade intelligence systems</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: '📊 System Overview' },
              { id: 'jobs', label: '⚙️ Scheduled Jobs' },
              { id: 'alerts', label: '🚨 Recent Alerts' },
              { id: 'freshness', label: '📅 Data Freshness' },
              { id: 'settings', label: '⚙️ Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="px-8 py-8">
        {activeTab === 'overview' && <OverviewTab systemStatus={systemStatus} />}
        {activeTab === 'jobs' && <JobsTab jobStatuses={jobStatuses} onRunJob={runJobManually} />}
        {activeTab === 'alerts' && <AlertsTab alerts={recentAlerts} />}
        {activeTab === 'freshness' && <FreshnessTab metrics={freshnessMetrics} />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

function OverviewTab({ systemStatus }) {
  return (
    <div className="space-y-6">
      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">System Status</p>
              <p className="text-2xl font-semibold text-gray-900">Operational</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 font-semibold">6</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-semibold text-gray-900">Running</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 font-semibold">23</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alerts Today</p>
              <p className="text-2xl font-semibold text-gray-900">Generated</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600 font-semibold">94%</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Data Freshness</p>
              <p className="text-2xl font-semibold text-gray-900">Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">2 hours ago</span>
              <span className="text-sm text-gray-900">Weekly tariff verification completed - 3 discrepancies found</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">4 hours ago</span>
              <span className="text-sm text-gray-900">Trump policy intelligence detected new reciprocal tariff announcement</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">6 hours ago</span>
              <span className="text-sm text-gray-900">Daily policy monitoring flagged 2 high-priority updates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function JobsTab({ jobStatuses, onRunJob }) {
  const jobs = [
    {
      name: 'daily_policy_monitoring',
      title: 'Daily Policy Monitoring',
      description: 'Monitors trade policy changes and Federal Register updates',
      schedule: '0 6 * * *',
      status: 'running',
      lastRun: '2025-09-24T06:00:00Z',
      nextRun: '2025-09-25T06:00:00Z'
    },
    {
      name: 'weekly_tariff_verification',
      title: 'Weekly Tariff Verification',
      description: 'Verifies 100 random tariff rates against current web sources',
      schedule: '0 3 * * 0',
      status: 'scheduled',
      lastRun: '2025-09-22T03:00:00Z',
      nextRun: '2025-09-29T03:00:00Z'
    },
    {
      name: 'usmca_monitoring',
      title: 'USMCA Rules Monitoring',
      description: 'Monitors USMCA qualification criteria and RVC requirements',
      schedule: '0 14 * * 2,5',
      status: 'scheduled',
      lastRun: '2025-09-24T14:00:00Z',
      nextRun: '2025-09-27T14:00:00Z'
    },
    {
      name: 'trump_policy_intelligence',
      title: 'Trump Policy Intelligence',
      description: 'High-frequency monitoring of Trump administration policies',
      schedule: '0 */4 * * 1-5',
      status: 'running',
      lastRun: '2025-09-24T16:00:00Z',
      nextRun: '2025-09-24T20:00:00Z'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Scheduled Research Jobs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.name}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500">{job.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.schedule}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      job.status === 'running'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(job.lastRun).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onRunJob(job.name)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Run Now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function AlertsTab({ alerts }) {
  const mockAlerts = [
    {
      id: 1,
      type: 'policy_update',
      priority: 'high',
      title: 'New Reciprocal Tariff Executive Order',
      description: 'Executive Order 14257 amended with additional product categories',
      created_at: '2025-09-24T18:30:00Z',
      source_url: 'https://federalregister.gov/example'
    },
    {
      id: 2,
      type: 'tariff_discrepancy',
      priority: 'medium',
      title: 'Mango Tariff Rate Verification',
      description: 'HTS 0811905200 rate discrepancy detected: 10.9% vs 11.2% in web sources',
      created_at: '2025-09-24T16:15:00Z'
    },
    {
      id: 3,
      type: 'usmca_change',
      priority: 'medium',
      title: 'Automotive RVC Threshold Update',
      description: 'USMCA regional value content for Chapter 87 updated from 75% to 80%',
      created_at: '2025-09-24T14:20:00Z'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Recent Alerts & Notifications</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {mockAlerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        alert.priority === 'high'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.priority}
                      </span>
                      <span className="text-sm text-gray-500">{alert.type}</span>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mt-2">{alert.title}</h4>
                    <p className="text-gray-600 mt-1">{alert.description}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FreshnessTab({ metrics }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900">Fresh Data</h4>
          <p className="text-3xl font-bold text-green-600 mt-2">23,456</p>
          <p className="text-sm text-gray-500 mt-1">Records updated within 30 days</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900">Stale Data</h4>
          <p className="text-3xl font-bold text-yellow-600 mt-2">1,234</p>
          <p className="text-sm text-gray-500 mt-1">Records needing verification</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900">Critical</h4>
          <p className="text-3xl font-bold text-red-600 mt-2">89</p>
          <p className="text-sm text-gray-500 mt-1">High-priority products outdated</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Data Freshness by Category</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { category: 'Electronics (Chapter 85)', fresh: 95, stale: 5 },
              { category: 'Automotive (Chapter 87)', fresh: 88, stale: 12 },
              { category: 'Food Products (Chapter 08)', fresh: 92, stale: 8 },
              { category: 'Textiles (Chapter 62)', fresh: 83, stale: 17 }
            ].map((cat, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{cat.category}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${cat.fresh}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">{cat.fresh}% fresh</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Automation Settings</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                High-Priority Products (HS Codes)
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                defaultValue="0811905200, 8703210000, 8517620000"
              />
              <p className="mt-2 text-sm text-gray-500">
                HS codes that receive frequent monitoring (comma-separated)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Alert Thresholds
              </label>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500">Significant Rate Change (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    defaultValue="0.5"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Stale Data Days</label>
                  <input
                    type="number"
                    defaultValue="30"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}