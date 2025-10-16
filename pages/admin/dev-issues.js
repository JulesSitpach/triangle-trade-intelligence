/**
 * Admin Dev Issues Dashboard
 * Shows code bugs and missing data issues - NOT user errors
 * Purpose: Help developers fix bugs exposed by "fail loudly" strategy
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function DevIssuesDashboard() {
  const router = useRouter();
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('unresolved'); // 'all', 'unresolved', 'critical'

  useEffect(() => {
    loadDevIssues();
  }, [filter]);

  const loadDevIssues = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/dev-issues?filter=${filter}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load dev issues');
      }

      const data = await response.json();
      setIssues(data.issues || []);
    } catch (error) {
      console.error('Failed to load dev issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markResolved = async (issueId, resolutionNotes) => {
    try {
      const response = await fetch('/api/admin/resolve-dev-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          issue_id: issueId,
          resolution_notes: resolutionNotes
        })
      });

      if (response.ok) {
        loadDevIssues(); // Reload list
      }
    } catch (error) {
      console.error('Failed to mark issue as resolved:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';  // Red
      case 'high': return '#ea580c';      // Orange
      case 'medium': return '#ca8a04';    // Yellow
      case 'low': return '#65a30d';       // Green
      default: return '#6b7280';          // Gray
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">🐛 Development Issues</h1>
        <p className="dashboard-subtitle">
          Code bugs and missing data exposed by "fail loudly" strategy - NOT user errors
        </p>
      </div>

      {/* Filters */}
      <div className="dashboard-actions">
        <div className="dashboard-actions-left">
          <button
            className={filter === 'unresolved' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setFilter('unresolved')}
          >
            🚨 Unresolved
          </button>
          <button
            className={filter === 'critical' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setFilter('critical')}
            style={{marginLeft: '0.5rem'}}
          >
            ⚠️ Critical Only
          </button>
          <button
            className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setFilter('all')}
            style={{marginLeft: '0.5rem'}}
          >
            📋 All Issues
          </button>
        </div>
        <div className="dashboard-actions-right">
          <button
            className="btn-secondary"
            onClick={loadDevIssues}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Issues List */}
      <div className="element-spacing">
        {isLoading ? (
          <div className="text-body">Loading dev issues...</div>
        ) : issues.length === 0 ? (
          <div className="alert alert-success">
            <div className="alert-content">
              <div className="alert-title">✅ No Issues Found</div>
              <div className="text-body">
                {filter === 'unresolved'
                  ? 'All dev issues have been resolved!'
                  : 'No dev issues logged yet'}
              </div>
            </div>
          </div>
        ) : (
          <div className="element-spacing">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="card"
                style={{
                  borderLeft: `4px solid ${getSeverityColor(issue.severity)}`,
                  marginBottom: '1rem'
                }}
              >
                {/* Issue Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{
                        backgroundColor: getSeverityColor(issue.severity),
                        color: 'white',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {issue.severity}
                      </span>
                      <span className="text-body" style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {issue.component}
                      </span>
                      <span className="text-body" style={{
                        fontSize: '0.875rem',
                        color: '#9ca3af'
                      }}>
                        {issue.issue_type}
                      </span>
                    </div>
                    <h3 className="card-title" style={{marginBottom: '0.5rem'}}>
                      {issue.message}
                    </h3>
                    {issue.certificate_number && (
                      <div className="text-body" style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        Certificate: {issue.certificate_number}
                      </div>
                    )}
                  </div>

                  {!issue.resolved && (
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        const notes = prompt('Resolution notes (optional):');
                        if (notes !== null) {
                          markResolved(issue.id, notes || 'Resolved');
                        }
                      }}
                      style={{fontSize: '0.875rem'}}
                    >
                      ✓ Mark Resolved
                    </button>
                  )}
                </div>

                {/* Issue Details */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginBottom: '0.75rem'
                }}>
                  <details>
                    <summary style={{
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '0.875rem'
                    }}>
                      Context Data (click to expand)
                    </summary>
                    <pre style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}>
                      {JSON.stringify(issue.context_data, null, 2)}
                    </pre>
                  </details>
                </div>

                {/* Issue Metadata */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  fontSize: '0.75rem',
                  color: '#6b7280'
                }}>
                  <div>
                    <strong>Created:</strong> {new Date(issue.created_at).toLocaleString()}
                  </div>
                  {issue.occurrence_count > 1 && (
                    <div>
                      <strong>Occurrences:</strong> {issue.occurrence_count}
                    </div>
                  )}
                  {issue.resolved && (
                    <div style={{color: '#16a34a'}}>
                      <strong>✓ Resolved:</strong> {new Date(issue.resolved_at).toLocaleString()}
                    </div>
                  )}
                </div>

                {issue.resolution_notes && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}>
                    <strong>Resolution:</strong> {issue.resolution_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
