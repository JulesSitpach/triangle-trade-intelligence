/**
 * DATA SOURCE BADGE COMPONENT
 * Displays transparent data source labeling for all AI and database responses
 *
 * Usage:
 *   <DataSourceBadge source="openrouter_api" label="✓ AI Analysis (OpenRouter)" />
 *   <DataSourceBadge source="anthropic_api" label="⚠️ Fallback AI" cached_at="Jan 10" />
 *   <DataSourceBadge source="database_cache" label="⚠️ Cached Data" />
 *   <DataSourceBadge source="none" label="❌ No Data Available" error="..." />
 */

import React from 'react';

export default function DataSourceBadge({
  source,
  label,
  is_cached = false,
  cached_at = null,
  warning = null,
  error = null,
  troubleshooting = null,
  cost_estimate = null
}) {
  // Determine badge style based on source
  const getBadgeClass = () => {
    switch (source) {
      case 'openrouter_api':
        return 'badge-success'; // Green - real-time AI
      case 'anthropic_api':
        return 'badge-warning'; // Yellow - fallback AI
      case 'database_cache':
      case 'database':
        return 'badge-warning'; // Yellow - cached data
      case 'none':
        return 'badge-error'; // Red - no data
      default:
        return 'badge-secondary'; // Gray - unknown
    }
  };

  return (
    <div className="data-source-container">
      {/* Main Badge */}
      <span className={`data-source-badge ${getBadgeClass()}`}>
        {label}
      </span>

      {/* Cached Indicator */}
      {is_cached && cached_at && (
        <span className="cached-indicator">
          (Cached: {cached_at})
        </span>
      )}

      {/* Cost Estimate (for AI requests) */}
      {cost_estimate && (
        <span className="cost-estimate" title={`${cost_estimate.tokens?.total || 0} tokens`}>
          ~${cost_estimate.cost_usd?.total || '0.000000'}
        </span>
      )}

      {/* Warning Message */}
      {warning && (
        <div className="data-source-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">{warning}</span>
        </div>
      )}

      {/* Error State */}
      {error && source === 'none' && (
        <div className="data-source-error">
          <h4>❌ Data Unavailable</h4>
          <p>{error}</p>

          {troubleshooting && (
            <details className="troubleshooting-details">
              <summary>Troubleshooting Information</summary>

              <div className="troubleshooting-content">
                {/* OpenRouter Status */}
                {troubleshooting.openrouter && (
                  <div className="service-status">
                    <strong>OpenRouter:</strong>
                    <span className={troubleshooting.openrouter.api_key_configured ? 'status-warning' : 'status-error'}>
                      {troubleshooting.openrouter.api_key_configured ? '⚠️ Error' : '❌ Not Configured'}
                    </span>
                    {troubleshooting.openrouter.error && (
                      <code>{troubleshooting.openrouter.error}</code>
                    )}
                  </div>
                )}

                {/* Anthropic Status */}
                {troubleshooting.anthropic && (
                  <div className="service-status">
                    <strong>Anthropic:</strong>
                    <span className={troubleshooting.anthropic.api_key_configured ? 'status-warning' : 'status-error'}>
                      {troubleshooting.anthropic.api_key_configured ? '⚠️ Error' : '❌ Not Configured'}
                    </span>
                    {troubleshooting.anthropic.error && (
                      <code>{troubleshooting.anthropic.error}</code>
                    )}
                  </div>
                )}

                {/* Database Cache Status */}
                {troubleshooting.database_cache && (
                  <div className="service-status">
                    <strong>Database Cache:</strong>
                    <span className="status-info">
                      {troubleshooting.database_cache.available ? '✓ Available' : '❌ Empty'}
                    </span>
                    {troubleshooting.database_cache.reason && (
                      <span className="status-reason">({troubleshooting.database_cache.reason})</span>
                    )}
                  </div>
                )}

                {/* Next Steps */}
                {troubleshooting.next_steps && (
                  <div className="next-steps">
                    <strong>Next Steps:</strong>
                    <ul>
                      {troubleshooting.next_steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Database Status */}
      {troubleshooting?.database_errors && (
        <details className="database-errors">
          <summary>Database Status</summary>
          <div className="error-list">
            {Object.entries(troubleshooting.database_errors).map(([key, error]) => (
              error && (
                <div key={key} className="error-item">
                  <strong>{key}:</strong> <code>{error}</code>
                </div>
              )
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

/**
 * Helper function to extract badge props from API response
 */
export function extractBadgeProps(apiResponse) {
  return {
    source: apiResponse.source || 'none',
    label: apiResponse.label || 'Unknown Source',
    is_cached: apiResponse.is_cached || false,
    cached_at: apiResponse.cached_at || null,
    warning: apiResponse.warning || null,
    error: apiResponse.error || null,
    troubleshooting: apiResponse.troubleshooting || null,
    cost_estimate: apiResponse.cost_estimate || null
  };
}
