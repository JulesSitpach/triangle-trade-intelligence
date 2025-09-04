/**
 * DYNAMIC RSS ALERTS COMPONENT
 * Displays real-time alerts from government RSS feeds matched to user's HS codes
 * Replaces hardcoded alerts with live feed data
 */

import { useState, useEffect } from 'react';

// Simple icon components
const AlertTriangle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const ExternalLink = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15,3 21,3 21,9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const Clock = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const Flag = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const TrendingUp = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/>
    <polyline points="16,7 22,7 22,13"/>
  </svg>
);

const RefreshCw = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23,4 23,10 17,10"/>
    <polyline points="1,20 1,14 7,14"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
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
        return 'bg-red-100 border-red-500 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-800';
    }
  };

  // Get alert type icon and label
  const getAlertTypeInfo = (alertType) => {
    const types = {
      section_301: { label: 'Section 301', icon: AlertTriangle, color: 'text-red-600' },
      antidumping: { label: 'Antidumping', icon: TrendingUp, color: 'text-orange-600' },
      countervailing: { label: 'Countervailing', icon: TrendingUp, color: 'text-orange-600' },
      emergency: { label: 'Emergency', icon: AlertTriangle, color: 'text-red-600' },
      ruling: { label: 'CBP Ruling', icon: Flag, color: 'text-blue-600' },
      classification: { label: 'Classification', icon: Flag, color: 'text-blue-600' },
      trade_agreement: { label: 'USMCA/Trade', icon: Flag, color: 'text-green-600' },
      tariff_change: { label: 'Tariff Change', icon: TrendingUp, color: 'text-yellow-600' },
      general_trade: { label: 'Trade News', icon: Flag, color: 'text-gray-600' }
    };
    
    return types[alertType] || types.general_trade;
  };

  // Loading state
  if (isLoading && alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-48"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-gray-200 rounded p-4">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-gray-500 mt-4">
          Fetching live alerts from government RSS feeds...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-800">
            Unable to Fetch Live Alerts
          </h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchAlerts}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Live Government Alerts
            </h2>
            <p className="text-gray-600">
              Real-time alerts for HS Code {hsCode} from {Object.keys(impactAnalysis?.sources || {}).length || '13'} government RSS feeds
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {lastRefresh && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Updated {formatDate(lastRefresh)}</span>
              </div>
            )}
            <button
              onClick={fetchAlerts}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Impact Analysis Summary */}
        {impactAnalysis && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Impact Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current MFN Rate:</span>
                <span className="ml-2 font-medium">{impactAnalysis.currentMFNRate}%</span>
              </div>
              <div>
                <span className="text-gray-600">USMCA Rate:</span>
                <span className="ml-2 font-medium">{impactAnalysis.currentUSMCARate}%</span>
              </div>
              <div>
                <span className="text-gray-600">Risk Level:</span>
                <span className={`ml-2 font-medium ${
                  impactAnalysis.riskLevel === 'high' ? 'text-red-600' :
                  impactAnalysis.riskLevel === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {impactAnalysis.riskLevel.toUpperCase()}
                </span>
              </div>
            </div>
            {impactAnalysis.maxPotentialIncrease > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800">
                  <strong>Potential Impact:</strong> Up to {impactAnalysis.potentialCostIncrease} tariff increase detected
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  {impactAnalysis.recommendedAction}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Alerts */}
      {alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert, index) => {
            const typeInfo = getAlertTypeInfo(alert.alertType);
            const IconComponent = typeInfo.icon;

            return (
              <div
                key={alert.id || index}
                className={`border-l-4 rounded-lg p-4 ${getSeverityStyle(alert.severity)}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`w-5 h-5 ${typeInfo.color}`} />
                    <div>
                      <span className="text-xs font-medium px-2 py-1 rounded bg-white bg-opacity-50">
                        {typeInfo.label}
                      </span>
                      <span className="ml-2 text-xs text-gray-600">
                        {alert.source} • {alert.country}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    <div>{formatDate(alert.pubDate)}</div>
                    <div className="font-medium">
                      Relevance: {Math.round(alert.relevanceScore * 100)}%
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">
                  {alert.title}
                </h3>

                <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                  {alert.description}
                </p>

                <div className="flex justify-between items-center">
                  <div className="flex flex-wrap gap-2">
                    {alert.hsCodeMatch && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        HS Match: {alert.hsCodeMatch}
                      </span>
                    )}
                    {alert.companyImpact && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Company: {alert.companyImpact}
                      </span>
                    )}
                    {alert.affectedProducts?.length > 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {alert.affectedProducts.length} Products
                      </span>
                    )}
                  </div>

                  <a
                    href={alert.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <span>Read More</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <Flag className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            No Immediate Threats Detected
          </h3>
          <p className="text-green-700">
            Our monitoring of {Object.keys(impactAnalysis?.sources || {}).length || '13'} government RSS feeds 
            shows no immediate tariff threats for your HS code {hsCode}.
          </p>
          <p className="text-green-600 text-sm mt-2">
            We'll continue monitoring and alert you of any changes.
          </p>
        </div>
      )}

      {/* Historical Alerts */}
      {showHistorical && historicalAlerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Historical Alerts (Last 30 Days)
          </h3>
          <div className="space-y-3">
            {historicalAlerts.slice(0, 5).map((alert, index) => (
              <div key={index} className="border-l-2 border-gray-300 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">
                      {alert.item_title}
                    </h4>
                    <p className="text-gray-600 text-xs">
                      {alert.feed_description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(alert.item_date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Attribution */}
      <div className="text-xs text-gray-500 text-center">
        Live data from CBP, USITC, Federal Register, CBSA, DOF, and other government sources.
        Updated every {Math.round(refreshInterval / 60000)} minutes.
      </div>
    </div>
  );
}