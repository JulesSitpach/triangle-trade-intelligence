/**
 * STATE MONITORING COMPONENT
 * Development tool for monitoring unified state management
 * Shows real-time state, performance metrics, and debugging info
 */

import { useState, useEffect } from 'react'
import { useTriangleState, useJourney } from '../lib/state/TriangleStateContext'
import { getPerformanceMetrics } from '../lib/state/statePersistence'

export default function StateMonitor({ isVisible = false, onToggle }) {
  const { state, actions } = useTriangleState()
  const { getProgress } = useJourney()
  const [showDetails, setShowDetails] = useState(false)
  const [performanceData, setPerformanceData] = useState(null)
  
  // Update performance data periodically
  useEffect(() => {
    if (!isVisible) return
    
    const updatePerformance = () => {
      try {
        const metrics = getPerformanceMetrics()
        setPerformanceData(metrics)
      } catch (error) {
        console.error('Failed to get performance metrics:', error)
      }
    }
    
    updatePerformance()
    const interval = setInterval(updatePerformance, 2000)
    
    return () => clearInterval(interval)
  }, [isVisible])
  
  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="bloomberg-btn bloomberg-btn-primary state-monitor-toggle"
        title="Open State Monitor"
      >
        📊
      </button>
    )
  }

  const journeyProgress = getProgress()
  
  return (
    <div className="bloomberg-card state-monitor">
      <div className="bloomberg-card-header">
        <h3 className="bloomberg-card-title text-primary">🔬 State Monitor</h3>
        <div className="bloomberg-flex bloomberg-gap-sm">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="bloomberg-btn bloomberg-btn-ghost"
          >
            {showDetails ? 'Less' : 'More'}
          </button>
          <button
            onClick={onToggle}
            className="bloomberg-btn bloomberg-btn-ghost text-danger"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Journey Progress */}
      <div className="bloomberg-mb-md">
        <h4 className="text-success bloomberg-text-sm bloomberg-mb-sm">📍 Journey Status</h4>
        <div className="bloomberg-code-block">
          <div>Current: {journeyProgress.currentPage || 'None'}</div>
          <div>Progress: {journeyProgress.progress}%</div>
          <div>Completed: {journeyProgress.completedPages.join(', ') || 'None'}</div>
          <div>Next: {journeyProgress.nextPage || 'Complete'}</div>
          <div>Session: {state.journey.sessionId}</div>
        </div>
      </div>

      {/* Page Data Status */}
      <div className="bloomberg-mb-md">
        <h4 className="text-warning bloomberg-text-sm bloomberg-mb-sm">📄 Page Data</h4>
        <div className="bloomberg-code-block">
          {['foundation', 'product', 'routing', 'partnership', 'hindsight', 'alerts'].map(page => (
            <div key={page} className="bloomberg-flex bloomberg-justify-between bloomberg-py-xs bloomberg-border-b">
              <span className="bloomberg-text-capitalize">{page}:</span>
              <span className={`bloomberg-text-xs ${state[page] ? 'text-success' : 'text-muted'}`}>
                {state[page] ? `✓ ${Object.keys(state[page]).length} fields` : '○ Empty'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Intelligence Status */}
      <div className="bloomberg-mb-md">
        <h4 className="text-purple bloomberg-text-sm bloomberg-mb-sm">🧠 Intelligence</h4>
        <div className="bloomberg-code-block">
          <div>Analysis Results: {Object.keys(state.intelligence.analysisResults).length}</div>
          <div>Confidence Scores: {Object.keys(state.intelligence.confidenceScores).length}</div>
          <div>Pattern Matches: {state.intelligence.patternMatches.length}</div>
        </div>
      </div>

      {/* Performance Metrics */}
      {performanceData && (
        <div className="bloomberg-mb-md">
          <h4 className="text-danger bloomberg-text-sm bloomberg-mb-sm">⚡ Performance</h4>
          <div className="bloomberg-code-block">
            <div>Operations: {performanceData.totalOperations}</div>
            <div>Errors: {performanceData.totalErrors}</div>
            <div>Error Rate: {performanceData.errorRate}</div>
            <div>Avg Latency: {performanceData.averageLatency?.toFixed(2)}ms</div>
          </div>
        </div>
      )}

      {/* Real-time Data */}
      <div className="bloomberg-mb-md">
        <h4 className="text-info bloomberg-text-sm bloomberg-mb-sm">📡 Real-time</h4>
        <div className="bloomberg-code-block">
          <div>Stats: {state.realTime.stats ? '✓ Loaded' : '○ None'}</div>
          <div>Alerts: {state.realTime.alerts.length}</div>
          <div>Market Data: {state.realTime.marketData ? '✓ Current' : '○ None'}</div>
        </div>
      </div>

      {/* UI State */}
      <div className={showDetails ? 'bloomberg-mb-md' : ''}>
        <h4 className="text-pink bloomberg-text-sm bloomberg-mb-sm">🎨 UI State</h4>
        <div className="bloomberg-code-block">
          <div>Loading: {state.ui.isLoading ? 'Yes' : 'No'}</div>
          <div>Errors: {state.ui.errors.length}</div>
          <div>Language: {state.ui.language}</div>
        </div>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div>
          <h4 className="text-muted bloomberg-text-sm bloomberg-mt-md bloomberg-mb-sm">🔍 Detailed State</h4>
          <pre className="bloomberg-code-block bloomberg-text-xs bloomberg-overflow-auto bloomberg-max-h-200">
            {JSON.stringify(
              {
                journey: state.journey,
                intelligence: state.intelligence,
                realTime: state.realTime,
                ui: state.ui,
                performance: state.performance
              },
              null,
              2
            )}
          </pre>
          
          {/* Action Buttons */}
          <div className="bloomberg-mt-sm bloomberg-flex bloomberg-gap-sm bloomberg-flex-wrap">
            <button
              onClick={() => actions.clearErrors()}
              className="bloomberg-btn bloomberg-btn-ghost text-danger bloomberg-text-xs"
            >
              Clear Errors
            </button>
            
            <button
              onClick={() => {
                if (confirm('Reset all state? This cannot be undone.')) {
                  actions.resetState()
                }
              }}
              className="bloomberg-btn bloomberg-btn-ghost text-danger bloomberg-text-xs"
            >
              Reset State
            </button>
            
            <button
              onClick={() => {
                const health = actions.getDataHealth()
                alert(JSON.stringify(health, null, 2))
              }}
              className="bloomberg-btn bloomberg-btn-ghost text-success bloomberg-text-xs"
            >
              Health Check
            </button>
          </div>
        </div>
      )}
    </div>
  )
}