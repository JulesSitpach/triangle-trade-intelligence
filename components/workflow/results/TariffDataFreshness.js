/**
 * TARIFF DATA FRESHNESS INDICATOR
 * ===============================
 * Shows users when tariff data was last updated
 * Alerts when data is stale (>24 hours for US/CA, >7 days for MX)
 * Indicates data source (live API, cached, or offline)
 *
 * This component is critical for compliance - users must know
 * if they're using current rates or cached data from before
 * Trump tariff changes.
 */

import React from 'react';

export default function TariffDataFreshness({ results, destination = 'US' }) {
  // Extract last update time from results
  const getDataFreshness = () => {
    if (!results?.component_origins || results.component_origins.length === 0) {
      return null;
    }

    // Get the most recent update time from all components
    const lastUpdates = results.component_origins
      .map(c => new Date(c.last_updated || c.cached_at))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => b - a);

    return lastUpdates[0];
  };

  const getDataSource = () => {
    if (!results?.component_origins || results.component_origins.length === 0) {
      return 'unknown';
    }

    // Check data sources in components
    const sources = new Set(
      results.component_origins
        .map(c => c.data_source || c.cache_source || 'unknown')
    );

    if (sources.has('USITC DataWeb API') || sources.has('OpenRouter')) {
      return 'live';
    }
    if (sources.has('AI-detected from RSS feeds')) {
      return 'ai_detected';
    }
    return 'cached';
  };

  const calculateFreshness = () => {
    const lastUpdate = getDataFreshness();
    if (!lastUpdate) return null;

    const now = new Date();
    const ageMs = now - lastUpdate;
    const ageHours = ageMs / (1000 * 60 * 60);
    const ageDays = ageHours / 24;

    // Thresholds vary by destination
    const thresholds = {
      'US': { warning: 24, critical: 72 },      // US: change every 2 hours, warn after 24h
      'CA': { warning: 90 * 24, critical: 180 * 24 },  // Canada: slower changes
      'MX': { warning: 365 * 24, critical: 999 * 24 }  // Mexico: stable rates
    };

    const threshold = thresholds[destination] || thresholds['US'];

    return {
      lastUpdate,
      ageHours,
      ageDays,
      status: ageHours > threshold.critical ? 'critical' :
              ageHours > threshold.warning ? 'warning' : 'fresh',
      daysAgo: Math.floor(ageDays),
      hoursAgo: Math.floor(ageHours)
    };
  };

  const freshness = calculateFreshness();
  const source = getDataSource();

  if (!freshness) {
    return (
      <div className="tariff-freshness tariff-freshness-unknown">
        <span>⚠️ No tariff data available</span>
      </div>
    );
  }

  const statusIcons = {
    'live': { icon: '🟢', text: 'Live Data' },
    'ai_detected': { icon: '🤖', text: 'AI-Detected Updates' },
    'cached': { icon: '🟡', text: 'Cached Data' },
    'critical': { icon: '🔴', text: 'Stale Data' }
  };

  const statusDisplay = statusIcons[freshness.status] || statusIcons['cached'];
  const sourceDisplay = statusIcons[source] || { icon: '❓', text: 'Unknown' };

  return (
    <div className={`tariff-freshness tariff-freshness-${freshness.status}`}>
      <div className="freshness-content">
        <div className="freshness-header">
          <span className="freshness-icon">{sourceDisplay.icon}</span>
          <span className="freshness-label">
            {freshness.status === 'fresh' && `✅ Current rates (${freshness.hoursAgo}h old)`}
            {freshness.status === 'warning' && `⚠️ Rates from ${freshness.daysAgo} days ago`}
            {freshness.status === 'critical' && `🚨 STALE: Rates from ${freshness.daysAgo}+ days ago`}
          </span>
        </div>

        <div className="freshness-details">
          <span className="detail">
            {freshness.lastUpdate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <span className="detail-source">
            {source === 'live' && 'Real-time from USITC'}
            {source === 'ai_detected' && 'Detected from policy announcements'}
            {source === 'cached' && 'From database cache'}
          </span>
        </div>

        {freshness.status !== 'fresh' && (
          <div className="freshness-warning">
            ⚠️ For compliance, verify current rates at{' '}
            <a href="https://ustr.gov" target="_blank" rel="noopener noreferrer">
              USTR.gov
            </a>
            {destination === 'US' && ', '}<a href="https://usitc.gov" target="_blank" rel="noopener noreferrer">
              USITC.gov
            </a>
            {destination === 'US' && ', '}<a href="https://cbp.gov/trade" target="_blank" rel="noopener noreferrer">
              CBP Trade
            </a>
          </div>
        )}

        {freshness.status === 'critical' && (
          <div className="freshness-action">
            <button
              onClick={() => window.location.reload()}
              className="btn-recalculate"
            >
              🔄 Recalculate with Fresh Data
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .tariff-freshness {
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          border-left: 4px solid;
          background-color: #f9fafb;
        }

        .tariff-freshness-fresh {
          border-left-color: #10b981;
          background-color: #ecfdf5;
        }

        .tariff-freshness-warning {
          border-left-color: #f59e0b;
          background-color: #fffbeb;
        }

        .tariff-freshness-critical {
          border-left-color: #ef4444;
          background-color: #fef2f2;
        }

        .tariff-freshness-unknown {
          border-left-color: #6b7280;
          background-color: #f3f4f6;
        }

        .freshness-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .freshness-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          font-size: 0.95rem;
        }

        .freshness-icon {
          font-size: 1.25rem;
        }

        .freshness-label {
          color: #1f2937;
        }

        .freshness-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .detail {
          font-family: 'Courier New', monospace;
        }

        .detail-source {
          font-style: italic;
        }

        .freshness-warning {
          font-size: 0.85rem;
          color: #92400e;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(146, 64, 14, 0.2);
        }

        .freshness-warning a {
          color: #b45309;
          text-decoration: underline;
          font-weight: 500;
        }

        .freshness-warning a:hover {
          color: #92400e;
        }

        .freshness-action {
          padding-top: 0.75rem;
        }

        .btn-recalculate {
          background-color: #ef4444;
          color: white;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .btn-recalculate:hover {
          background-color: #dc2626;
        }
      `}</style>
    </div>
  );
}
