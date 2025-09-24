import { useState, useEffect } from 'react';
import AdminNavigation from '../../components/AdminNavigation';

export default function AgentPerformanceDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
    const interval = setInterval(loadPerformanceData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = async () => {
    try {
      const [metricsRes, logsRes, patternsRes] = await Promise.all([
        fetch('/api/agents/performance?action=metrics'),
        fetch('/api/agents/performance?action=logs&limit=50'),
        fetch('/api/agents/performance?action=patterns')
      ]);

      const metricsData = await metricsRes.json();
      const logsData = await logsRes.json();
      const patternsData = await patternsRes.json();

      setMetrics(metricsData.data);
      setLogs(logsData.data);
      setPatterns(patternsData.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading performance data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <AdminNavigation />
        <div className="dashboard-content">
          <p>Loading agent performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminNavigation />

      <div className="dashboard-content">
        <div className="section-header">
          <h1 className="page-title">🤖 Agent Performance Dashboard</h1>
          <p className="section-subtitle">
            Monitor multi-agent orchestration performance and collaboration patterns
          </p>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <h3 className="metric-title">Total Interactions</h3>
            <div className="metric-value">{metrics?.totalInteractions || 0}</div>
            <p className="metric-subtitle">Agent orchestrations executed</p>
          </div>

          <div className="metric-card">
            <h3 className="metric-title">Success Rate</h3>
            <div className="metric-value">{metrics?.successRate?.toFixed(1) || 0}%</div>
            <p className="metric-subtitle">
              {metrics?.successfulInteractions || 0} successful completions
            </p>
          </div>

          <div className="metric-card">
            <h3 className="metric-title">Average Confidence</h3>
            <div className="metric-value">{metrics?.averageConfidence?.toFixed(0) || 0}%</div>
            <p className="metric-subtitle">Overall confidence score</p>
          </div>

          <div className="metric-card">
            <h3 className="metric-title">Escalation Rate</h3>
            <div className="metric-value">
              {(metrics?.escalationRate * 100)?.toFixed(1) || 0}%
            </div>
            <p className="metric-subtitle">Escalated to expert services</p>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Agent Performance Breakdown</h2>

          <div className="agent-performance-grid">
            <div className="agent-card">
              <h3 className="agent-name">📝 Form Assistant</h3>
              <div className="agent-stats">
                <div className="stat-item">
                  <span className="stat-label">Calls:</span>
                  <span className="stat-value">
                    {metrics?.agentPerformance?.formAssistant?.calls || 0}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Confidence:</span>
                  <span className="stat-value">
                    {metrics?.agentPerformance?.formAssistant?.avgConfidence?.toFixed(0) || 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="agent-card">
              <h3 className="agent-name">🏷️ Classification</h3>
              <div className="agent-stats">
                <div className="stat-item">
                  <span className="stat-label">Calls:</span>
                  <span className="stat-value">
                    {metrics?.agentPerformance?.classification?.calls || 0}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Confidence:</span>
                  <span className="stat-value">
                    {metrics?.agentPerformance?.classification?.avgConfidence?.toFixed(0) || 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="agent-card">
              <h3 className="agent-name">✅ Validation</h3>
              <div className="agent-stats">
                <div className="stat-item">
                  <span className="stat-label">Calls:</span>
                  <span className="stat-value">
                    {metrics?.agentPerformance?.validation?.calls || 0}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Confidence:</span>
                  <span className="stat-value">
                    {metrics?.agentPerformance?.validation?.avgConfidence?.toFixed(0) || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Collaboration Patterns</h2>

          <div className="patterns-grid">
            <div className="pattern-card">
              <h3 className="pattern-title">Form → Classification</h3>
              <div className="pattern-value">{patterns?.formToClassification || 0}</div>
              <p className="pattern-subtitle">Agent handoffs</p>
            </div>

            <div className="pattern-card">
              <h3 className="pattern-title">Classification → Validation</h3>
              <div className="pattern-value">{patterns?.classificationToValidation || 0}</div>
              <p className="pattern-subtitle">Agent handoffs</p>
            </div>

            <div className="pattern-card">
              <h3 className="pattern-title">Successful Completions</h3>
              <div className="pattern-value">{patterns?.successfulCompletions || 0}</div>
              <p className="pattern-subtitle">Ready to submit</p>
            </div>

            <div className="pattern-card">
              <h3 className="pattern-title">Validation Escalations</h3>
              <div className="pattern-value">{patterns?.validationEscalations || 0}</div>
              <p className="pattern-subtitle">Expert recommended</p>
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Recent Orchestration Logs</h2>

          <div className="logs-container">
            {logs.length === 0 ? (
              <p className="empty-state">No orchestration logs yet</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Orchestration ID</th>
                    <th>Event</th>
                    <th>Agent</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={index}>
                      <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="orchestration-id">{log.orchestrationId.slice(-8)}</td>
                      <td>
                        <span className={`event-badge event-${log.event}`}>
                          {log.event}
                        </span>
                      </td>
                      <td>{log.data?.agent || '-'}</td>
                      <td className="log-details">
                        {log.data?.confidence && `Confidence: ${log.data.confidence}%`}
                        {log.data?.duration && ` | ${log.data.duration}ms`}
                        {log.data?.fieldsPopulated && ` | ${log.data.fieldsPopulated} fields`}
                        {log.data?.hsCode && ` | HS: ${log.data.hsCode}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">💡 Phase 2 Insights</h2>

          <div className="insights-grid">
            <div className="insight-card">
              <h3 className="insight-title">Agent Collaboration Efficiency</h3>
              <p className="insight-description">
                Form Assistant successfully hands off to Classification in{' '}
                <strong>{patterns?.formToClassification || 0}</strong> cases.
                This sequential flow is working as designed for Phase 1.
              </p>
            </div>

            <div className="insight-card">
              <h3 className="insight-title">Escalation Intelligence</h3>
              <p className="insight-description">
                <strong>{(metrics?.escalationRate * 100)?.toFixed(0) || 0}%</strong> of
                certificates trigger expert escalation. Phase 2 will add context-aware
                routing to appropriate services (Jorge vs Cristina).
              </p>
            </div>

            <div className="insight-card">
              <h3 className="insight-title">Confidence Calibration</h3>
              <p className="insight-description">
                Average confidence of <strong>{metrics?.averageConfidence?.toFixed(0) || 0}%</strong>{' '}
                suggests agents are conservative. Phase 2 will track actual acceptance
                rates to fine-tune confidence thresholds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}