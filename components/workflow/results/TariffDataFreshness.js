/**
 * TARIFF DATA FRESHNESS WARNING COMPONENT
 * Displays warning if tariff rates are stale or if last update was more than threshold ago
 * Shown on results page to ensure users know if data is current
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

export default function TariffDataFreshness() {
  const [freshness, setFreshness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFreshnessStatus();
  }, []);

  const fetchFreshnessStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tariff-data-freshness');

      if (!response.ok) {
        throw new Error('Failed to fetch freshness status');
      }

      const data = await response.json();
      setFreshness(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tariff data freshness:', err);
      setError(err.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="tariff-freshness-loading">
        <Clock size={16} />
        <span>Checking tariff data freshness...</span>
      </div>
    );
  }

  if (!freshness) {
    return null;
  }

  const { is_fresh, metadata, last_sync, days_old } = freshness;

  // Calculate hours since last update
  const hoursSinceSync = last_sync
    ? Math.floor((Date.now() - new Date(last_sync.sync_timestamp).getTime()) / (1000 * 60 * 60))
    : null;

  const isStale = is_fresh === false;
  const isWarning = hoursSinceSync && hoursSinceSync > 12;

  return (
    <div className={`tariff-freshness-banner ${isStale ? 'stale' : isWarning ? 'warning' : 'fresh'}`}>
      <div className="freshness-content">
        <div className="freshness-icon">
          {isStale ? (
            <AlertTriangle size={20} className="warning-icon" />
          ) : (
            <CheckCircle size={20} className="success-icon" />
          )}
        </div>

        <div className="freshness-text">
          <div className="freshness-header">
            {isStale ? (
              <>
                <strong>⚠️ Tariff rates may be outdated</strong>
                <p className="freshness-description">
                  Data last updated {hoursSinceSync} hours ago. Section 301 rates can change with 30-day notice from USTR.
                </p>
              </>
            ) : isWarning ? (
              <>
                <strong>ℹ️ Tariff data is {hoursSinceSync} hours old</strong>
                <p className="freshness-description">
                  For critical decisions, verify Section 301 rates at USTR.gov
                </p>
              </>
            ) : (
              <>
                <strong>✅ Tariff data current</strong>
                <p className="freshness-description">
                  Last updated {hoursSinceSync} hours ago from USITC API
                </p>
              </>
            )}
          </div>

          <div className="freshness-details">
            <div className="detail-item">
              <span className="detail-label">Section 301 Rates:</span>
              <span className={metadata?.find(m => m.key === 'section_301_rates')?.warning_threshold_minutes < 1440 ? 'urgent' : ''}>
                Updated {getMetadataAge('section_301_rates', metadata)}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">MFN Rates:</span>
              <span>Updated {getMetadataAge('mfn_rates', metadata)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">USMCA Rates:</span>
              <span>Updated {getMetadataAge('usmca_rates', metadata)}</span>
            </div>
          </div>

          {isStale && (
            <button
              className="btn-refresh-rates"
              onClick={fetchFreshnessStatus}
              aria-label="Refresh tariff rates"
            >
              <RefreshCw size={16} />
              <span>Check for updates</span>
            </button>
          )}
        </div>
      </div>

      <div className="freshness-footer">
        <p className="freshness-notice">
          💡 <strong>User Responsibility:</strong> Your tariff savings calculations are based on rates as of {new Date(last_sync?.sync_timestamp).toLocaleDateString()}.
          Trade policy changes frequently. Verify Section 301 rates at <a href="https://ustr.gov" target="_blank" rel="noopener noreferrer">USTR.gov</a> before finalizing contracts.
        </p>
      </div>

      <style jsx>{`
        .tariff-freshness-banner {
          background-color: #f0f4f8;
          border-left: 4px solid #2196F3;
          padding: 16px;
          margin: 16px 0;
          border-radius: 4px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .tariff-freshness-banner.fresh {
          border-left-color: #4CAF50;
          background-color: #f1f8f4;
        }

        .tariff-freshness-banner.warning {
          border-left-color: #FF9800;
          background-color: #fff8f0;
        }

        .tariff-freshness-banner.stale {
          border-left-color: #f44336;
          background-color: #fdf1f0;
        }

        .freshness-content {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .freshness-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .warning-icon {
          color: #f44336;
        }

        .success-icon {
          color: #4CAF50;
        }

        .freshness-text {
          flex-grow: 1;
        }

        .freshness-header {
          margin-bottom: 8px;
        }

        .freshness-header strong {
          display: block;
          font-size: 14px;
          margin-bottom: 4px;
          color: #1a1a1a;
        }

        .freshness-description {
          font-size: 12px;
          color: #666;
          margin: 0;
        }

        .freshness-details {
          font-size: 12px;
          margin: 8px 0;
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .detail-label {
          font-weight: 500;
          color: #333;
        }

        .detail-item span:last-child {
          color: #666;
        }

        .detail-item span.urgent {
          color: #f44336;
          font-weight: 500;
        }

        .btn-refresh-rates {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          padding: 6px 12px;
          background-color: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-refresh-rates:hover {
          background-color: #1976D2;
        }

        .freshness-footer {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }

        .freshness-notice {
          font-size: 11px;
          color: #666;
          margin: 0;
          line-height: 1.4;
        }

        .freshness-notice a {
          color: #2196F3;
          text-decoration: none;
        }

        .freshness-notice a:hover {
          text-decoration: underline;
        }

        .tariff-freshness-loading {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #999;
          font-size: 12px;
          padding: 8px;
        }
      `}</style>
    </div>
  );
}

/**
 * Helper function to format metadata age
 */
function getMetadataAge(key, metadata) {
  if (!metadata) return 'unknown';

  const item = metadata.find(m => m.key === key);
  if (!item || !item.last_updated_timestamp) return 'unknown';

  const ageMs = Date.now() - new Date(item.last_updated_timestamp).getTime();
  const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
  const ageDays = Math.floor(ageHours / 24);

  if (ageDays > 0) return `${ageDays}d ago`;
  if (ageHours > 0) return `${ageHours}h ago`;

  const ageMinutes = Math.floor(ageMs / (1000 * 60));
  return `${ageMinutes}m ago`;
}
