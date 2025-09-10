/**
 * DYNAMIC RSS ALERTS COMPONENT
 * Displays real-time alerts from government RSS feeds matched to user's HS codes
 * Replaces hardcoded alerts with live feed data
 */

import { useState, useEffect } from 'react';

// Simple icon components
const AlertTriangle = ({ className }) => (
  <span className={className}>[warning]</span>
);

const ExternalLink = ({ className }) => (
  <span className={className}>[external-link]</span>
);

const Clock = ({ className }) => (
  <span className={className}>[clock]</span>
);

const Flag = ({ className }) => (
  <span className={className}>[flag]</span>
);

const TrendingUp = ({ className }) => (
  <span className={className}>[trending-up]</span>
);

const RefreshCw = ({ className }) => (
  <span className={className}>[refresh]</span>
);

export default function DynamicRSSAlerts({ 
  hsCode = '851712', 
  companyName = 'Phoenix Electronics Inc',
  showHistorical = false,
  autoRefresh = true,
  refreshInterval = 300000 // 5 minutes
}) {
  const [alerts, setAlerts] = useState([]);
  const [historicalAlerts, setHistoricalAlerts] = useState([]);
  const [impactAnalysis, setImpactAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Fetch dynamic alerts
  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        hsCode,
        companyName,
        includeHistory: showHistorical ? 'true' : 'false'
      });

      const response = await fetch(`/api/dynamic-rss-alerts?${params}`);
      const data = await response.json();

      if (data.success) {
        setAlerts(data.alerts || []);
        setHistoricalAlerts(data.historicalAlerts || []);
        setImpactAnalysis(data.impactAnalysis);
        setLastRefresh(new Date());
      } else {
        setError(data.error || 'Failed to fetch alerts');
      }
    } catch (err) {
      setError('Network error: Unable to fetch real-time alerts');
      console.error('RSS alerts fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and auto-refresh setup
  useEffect(() => {
    fetchAlerts();

    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [hsCode, companyName, showHistorical, autoRefresh, refreshInterval]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get severity styling
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return 'alert alert-error';
      case 'high':
        return 'alert alert-warning';
      case 'medium':
        return 'alert alert-warning';
      default:
        return 'alert alert-info';
    }
  };

  // Get alert type icon and label
  const getAlertTypeInfo = (alertType) => {
    const types = {
      section_301: { label: 'Section 301', icon: AlertTriangle, color: 'status-error' },
      antidumping: { label: 'Antidumping', icon: TrendingUp, color: 'status-warning' },
      countervailing: { label: 'Countervailing', icon: TrendingUp, color: 'status-warning' },
      emergency: { label: 'Emergency', icon: AlertTriangle, color: 'status-error' },
      ruling: { label: 'CBP Ruling', icon: Flag, color: 'status-info' },
      classification: { label: 'Classification', icon: Flag, color: 'status-info' },
      trade_agreement: { label: 'USMCA/Trade', icon: Flag, color: 'status-success' },
      tariff_change: { label: 'Tariff Change', icon: TrendingUp, color: 'status-warning' },
      general_trade: { label: 'Trade News', icon: Flag, color: 'text-muted' }
    };
    
    return types[alertType] || types.general_trade;
  };

  // Loading state
  if (isLoading && alerts.length === 0) {
    return (
      <div className="content-card">
        <div className="loading-spinner">
          <div className="hero-button-group">
            <div className="icon-md loading-spinner"></div>
            <div className="loading-spinner"></div>
          </div>
          <div className="element-spacing">
            {[1, 2, 3].map(i => (
              <div key={i} className="content-card">
                <div className="loading-spinner"></div>
                <div className="loading-spinner"></div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-muted">
          Fetching live alerts from government RSS feeds...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="alert alert-error">
        <div className="hero-button-group">
          <AlertTriangle className="icon-md status-error" />
          <h3 className="content-card-title">
            Unable to Fetch Live Alerts
          </h3>
        </div>
        <p className="text-body">{error}</p>
        <button
          onClick={fetchAlerts}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="element-spacing">
      {/* Header */}
      <div className="content-card">
        <div className="hero-button-group">
          <div>
            <h2 className="content-card-title">
              Live Government Alerts
            </h2>
            <p className="text-body">
              Real-time alerts for HS Code {hsCode} from {Object.keys(impactAnalysis?.sources || {}).length || '13'} government RSS feeds
            </p>
          </div>
          <div className="hero-button-group">
            {lastRefresh && (
              <div className="hero-button-group text-muted">
                <Clock className="icon-sm" />
                <span>Updated {formatDate(lastRefresh)}</span>
              </div>
            )}
            <button
              onClick={fetchAlerts}
              disabled={isLoading}
              className="btn-primary"
            >
              <RefreshCw className={`icon-sm ${isLoading ? 'loading-spinner' : ''}`} />
              <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Impact Analysis Summary */}
        {impactAnalysis && (
          <div className="content-card analysis">
            <h3 className="content-card-title">Impact Analysis</h3>
            <div className="grid-3-cols">
              <div>
                <span className="text-muted">Current MFN Rate:</span>
                <span className="calculator-metric-value primary">{impactAnalysis.currentMFNRate}%</span>
              </div>
              <div>
                <span className="text-muted">USMCA Rate:</span>
                <span className="calculator-metric-value success">{impactAnalysis.currentUSMCARate}%</span>
              </div>
              <div>
                <span className="text-muted">Risk Level:</span>
                <span className={`calculator-metric-value ${
                  impactAnalysis.riskLevel === 'high' ? 'error' :
                  impactAnalysis.riskLevel === 'medium' ? 'warning' :
                  'success'
                }`}>
                  {impactAnalysis.riskLevel.toUpperCase()}
                </span>
              </div>
            </div>
            {impactAnalysis.maxPotentialIncrease > 0 && (
              <div className="alert alert-warning">
                <p className="text-body">
                  <strong>Potential Impact:</strong> Up to {impactAnalysis.potentialCostIncrease} tariff increase detected
                </p>
                <p className="text-muted">
                  {impactAnalysis.recommendedAction}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Alerts */}
      {alerts.length > 0 ? (
        <div className="element-spacing">
          {alerts.map((alert, index) => {
            const typeInfo = getAlertTypeInfo(alert.alertType);
            const IconComponent = typeInfo.icon;

            return (
              <div
                key={alert.id || index}
                className={`content-card ${getSeverityStyle(alert.severity)}`}
              >
                <div className="hero-button-group">
                  <div className="hero-button-group">
                    <IconComponent className={`icon-sm ${typeInfo.color}`} />
                    <div>
                      <span className="status-label">
                        {typeInfo.label}
                      </span>
                      <span className="text-muted">
                        {alert.source} • {alert.country}
                      </span>
                    </div>
                  </div>
                  <div className="text-muted">
                    <div>{formatDate(alert.pubDate)}</div>
                    <div className="calculator-metric-value primary">
                      Relevance: {Math.round(alert.relevanceScore * 100)}%
                    </div>
                  </div>
                </div>

                <h3 className="content-card-title">
                  {alert.title}
                </h3>

                <p className="text-body">
                  {alert.description}
                </p>

                <div className="hero-button-group">
                  <div className="hero-button-group">
                    {alert.hsCodeMatch && (
                      <span className="status-info">
                        HS Match: {alert.hsCodeMatch}
                      </span>
                    )}
                    {alert.companyImpact && (
                      <span className="status-primary">
                        Company: {alert.companyImpact}
                      </span>
                    )}
                    {alert.affectedProducts?.length > 0 && (
                      <span className="status-success">
                        {alert.affectedProducts.length} Products
                      </span>
                    )}
                  </div>

                  <a
                    href={alert.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="content-card-link"
                  >
                    <span>Read More</span>
                    <ExternalLink className="icon-sm" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="alert alert-success">
          <Flag className="icon-lg status-success" />
          <h3 className="content-card-title">
            No Immediate Threats Detected
          </h3>
          <p className="text-body">
            Our monitoring of {Object.keys(impactAnalysis?.sources || {}).length || '13'} government RSS feeds 
            shows no immediate tariff threats for your HS code {hsCode}.
          </p>
          <p className="text-muted">
            We'll continue monitoring and alert you of any changes.
          </p>
        </div>
      )}

      {/* Historical Alerts */}
      {showHistorical && historicalAlerts.length > 0 && (
        <div className="content-card">
          <h3 className="content-card-title">
            Recent Historical Alerts (Last 30 Days)
          </h3>
          <div className="element-spacing">
            {historicalAlerts.slice(0, 5).map((alert, index) => (
              <div key={index} className="content-card">
                <div className="hero-button-group">
                  <div>
                    <h4 className="content-card-title">
                      {alert.item_title}
                    </h4>
                    <p className="text-muted">
                      {alert.feed_description}
                    </p>
                  </div>
                  <span className="text-muted">
                    {formatDate(alert.item_date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Attribution */}
      <div className="text-muted text-center">
        Live data from CBP, USITC, Federal Register, CBSA, DOF, and other government sources.
        Updated every {Math.round(refreshInterval / 60000)} minutes.
      </div>
    </div>
  );
}