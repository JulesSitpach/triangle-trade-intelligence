/**
 * Trade Alerts Dashboard
 * Manual monitoring dashboard to test RSS feed detection
 */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
// Bloomberg-compliant: SVG icons removed per compliance requirements

export default function TradeAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState(null)
  const [lastChecked, setLastChecked] = useState(null)

  const checkAlerts = async () => {
    setLoading(true)
    
    try {
      console.log('🔍 Checking trade alerts...')
      
      const response = await fetch('/api/trade-alerts/monitor')
      const data = await response.json()
      
      if (data.success) {
        setAlerts(data.alerts)
        setSummary(data.summary)
        setLastChecked(new Date().toLocaleString())
        console.log(`✅ Found ${data.alerts.length} alerts`)
      } else {
        console.error('❌ Alert check failed:', data.error)
      }
    } catch (error) {
      console.error('❌ Error checking alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatSavings = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    } else {
      return `$${amount}`
    }
  }

  const getUrgencyColor = (score) => {
    if (score > 30) return 'confidence-high'
    if (score > 15) return 'confidence-medium'
    return 'confidence-low'
  }

  return (
    <>
      <Head>
        <title>Trade Alerts - Triangle Intelligence Monitor</title>
      </Head>

      <div className="platform-container">
        {/* Navigation */}
        <nav className="platform-nav">
          <div className="nav-container">
            <Link href="/" className="nav-brand">Triangle Intelligence</Link>
            <ul className="nav-links">
              <li><Link href="/dashboard" className="nav-link">Dashboard</Link></li>
              <li><Link href="/foundation" className="nav-link">Analysis</Link></li>
              <li><Link href="/trade-alerts" className="nav-link active">Trade Alerts</Link></li>
            </ul>
          </div>
        </nav>

        <div className="stage-container">
          {/* Header */}
          <div className="stage-header">
            <div className="stage-icon">
              <span className="bloomberg-status bloomberg-status-warning">⚠️</span>
            </div>
            <h1 className="stage-title">Trade Alert Monitor</h1>
            <p className="stage-subtitle">
              Real-time monitoring of government RSS feeds for trade disruptions
            </p>
          </div>

          {/* Controls */}
          <div className="data-card">
            <div className="form-actions">
              <button 
                onClick={checkAlerts}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Checking Feeds...' : 'Check Trade Alerts'}
              </button>
              {lastChecked && (
                <span className="text-sm text-gray-600">
                  Last checked: {lastChecked}
                </span>
              )}
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div className="database-stats">
              <h3>Alert Summary</h3>
              <div className="database-stats-grid">
                <div className="database-stat">
                  <div className="database-stat-value">{summary.totalAlerts}</div>
                  <div className="database-stat-label">Total Alerts</div>
                </div>
                <div className="database-stat">
                  <div className="database-stat-value">{summary.highUrgency}</div>
                  <div className="database-stat-label">High Urgency</div>
                </div>
                <div className="database-stat">
                  <div className="database-stat-value">{summary.withSolutions}</div>
                  <div className="database-stat-label">With Solutions</div>
                </div>
                <div className="database-stat">
                  <div className="database-stat-value">{summary.sources.length}</div>
                  <div className="database-stat-label">Sources</div>
                </div>
              </div>
              <div className="confidence-indicator confidence-high">
                Sources: {summary.sources.join(', ')}
              </div>
            </div>
          )}

          {/* Alerts List */}
          {alerts.length > 0 && (
            <div className="data-card">
              <div className="data-card-header">
                <h3 className="data-card-title">Detected Trade Alerts</h3>
              </div>

              {alerts.map((alert, index) => (
                <div key={index} className="data-card" style={{ marginBottom: 'var(--space-4)' }}>
                  <div className="data-card-header">
                    <h4 className="data-card-title">{alert.title}</h4>
                    <div className="data-card-badges">
                      <div className={`confidence-indicator ${getUrgencyColor(alert.urgencyScore)}`}>
                        Urgency: {alert.urgencyScore}
                      </div>
                      <div className="confidence-indicator confidence-medium">
                        Relevance: {alert.relevanceScore}
                      </div>
                    </div>
                  </div>

                  <div className="intelligence-grid">
                    {/* Detection Details */}
                    <div className="intelligence-card">
                      <div className="intelligence-card-header">
                        <span className="bloomberg-status bloomberg-status-warning">⚠️</span>
                        <span className="intelligence-card-title">Detection</span>
                      </div>
                      <div className="intelligence-card-description">
                        <strong>Source:</strong> {alert.source}<br/>
                        <strong>Countries:</strong> {alert.detected.countries.join(', ') || 'None'}<br/>
                        <strong>Products:</strong> {alert.detected.products.join(', ') || 'None'}<br/>
                        <strong>HS Codes:</strong> {alert.detected.hsCodes?.join(', ') || 'None'}<br/>
                        <strong>Tariff Rates:</strong> {alert.detected.tariffRates?.join(', ') || 'None'}
                      </div>
                    </div>

                    {/* Database Matches */}
                    {alert.databaseMatches && (
                      <div className="intelligence-card">
                        <div className="intelligence-card-header">
                          <span className="bloomberg-status bloomberg-status-success">📈</span>
                          <span className="intelligence-card-title">Database Impact</span>
                        </div>
                        <div className="intelligence-card-description">
                          <strong>Trade Value:</strong> {formatSavings(alert.databaseMatches.totalValue)}<br/>
                          <strong>Affected Routes:</strong> {alert.databaseMatches.affectedRoutes}<br/>
                          <strong>Matches:</strong> {alert.databaseMatches.count} HS codes
                        </div>
                      </div>
                    )}

                    {/* Solutions */}
                    {alert.solutions.length > 0 && (
                      <div className="intelligence-card">
                        <div className="intelligence-card-header">
                          <span className="bloomberg-status bloomberg-status-success">💰</span>
                          <span className="intelligence-card-title">Solutions ({alert.solutions.length})</span>
                        </div>
                        <div className="intelligence-card-description">
                          {alert.solutions.map((solution, i) => (
                            <div key={i} style={{ marginBottom: 'var(--space-2)' }}>
                              <strong>{solution.route}</strong><br/>
                              {solution.description}<br/>
                              <span className="confidence-indicator confidence-high">
                                Savings: {formatSavings(solution.estimatedSavings)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Link to original */}
                  <div className="form-actions">
                    <a 
                      href={alert.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-small"
                    >
                      View Original →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No alerts message */}
          {alerts.length === 0 && !loading && lastChecked && (
            <div className="alert alert-info">
              <div className="alert-message">
                No trade alerts detected in recent government RSS feeds. This is normal - alerts are only generated for significant trade policy changes.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}