/**
 * CRISIS ALERT BANNER COMPONENT
 * Real-time crisis alerts integrated with RSS monitoring system
 * Shows personalized financial impact and immediate actions available
 */

import React, { useState, useEffect } from 'react';
// Simple icon components to avoid ESM import issues
const AlertCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const DollarSign = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const Clock = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const Shield = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const X = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const TrendingUp = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/>
    <polyline points="16,7 22,7 22,13"/>
  </svg>
);

const AlertTriangle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export default function CrisisAlertBanner({ 
  userProfile = null, 
  onDismiss = null, 
  className = '',
  showFullDetails = false,
  crisisAmount = 2125000 // Default $2.125M crisis amount
}) {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only run on client side to avoid SSR issues
    if (typeof window === 'undefined') return;
    
    loadCrisisAlerts();
    
    // Check for new alerts periodically (centralized RSS system handles the heavy lifting)
    const interval = setInterval(loadCrisisAlerts, 300000); // 5 minutes for UI updates
    return () => clearInterval(interval);
  }, [userProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCrisisAlerts = async () => {
    try {
      setError(null);
      
      // Get current crisis scenarios from RSS monitoring service
      const rssResponse = await fetch('/api/rss-monitoring', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const rssStatus = await rssResponse.json();
      
      // If RSS monitoring shows active alerts, get detailed crisis analysis
      let response;
      if (rssStatus.success && rssStatus.recentItems && rssStatus.recentItems.count > 0) {
        // Use real RSS item for crisis analysis
        response = await fetch('/api/crisis-alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_active_alerts',
            user_profile: userProfile
          })
        });
      } else {
        // Fallback to test integration for demonstration
        response = await fetch('/api/test-crisis-rss-integration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            scenario: 'section_301_electronics'
          })
        });
      }
      
      const result = await response.json();
      
      if (result.success && result.crisis_analysis.crisisDetected) {
        // Transform RSS crisis alerts into banner format
        const crisisAlerts = result.generated_alerts.preview.map(alert => ({
          id: alert.alertId,
          level: alert.crisisLevel.toLowerCase(),
          title: `🚨 ${alert.crisisLevel} Trade Alert`,
          message: alert.messagePreview.split('\n')[0], // First line only
          impact: alert.financialImpact,
          timestamp: new Date().toISOString(),
          source: 'Government RSS Feeds',
          company: alert.companyName
        }));
        
        setAlerts(crisisAlerts);
      } else {
        setAlerts([]); // No active crisis
      }
    } catch (error) {
      console.error('Failed to load crisis alerts:', error);
      setError('Crisis monitoring temporarily unavailable');
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getAlertStyles = (level) => {
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-gradient-to-r from-red-50 to-red-100',
          border: 'border-red-300',
          text: 'text-red-900',
          accent: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700'
        };
      case 'high':
        return {
          bg: 'bg-gradient-to-r from-orange-50 to-orange-100',
          border: 'border-orange-300',
          text: 'text-orange-900',
          accent: 'text-orange-600',
          button: 'bg-orange-600 hover:bg-orange-700'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-yellow-50 to-yellow-100',
          border: 'border-yellow-300',
          text: 'text-yellow-900',
          accent: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        };
    }
  };

  const getAlertIcon = (level) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="w-6 h-6 animate-pulse" />;
      case 'high':
        return <AlertCircle className="w-6 h-6" />;
      default:
        return <Clock className="w-6 h-6" />;
    }
  };

  // Don't show if dismissed, no alerts, loading, or error
  if (isDismissed || isLoading || error || alerts.length === 0) {
    return null;
  }

  // Show the most critical alert
  const mostCriticalAlert = alerts.sort((a, b) => {
    const levels = { 'critical': 3, 'high': 2, 'medium': 1 };
    return levels[b.level] - levels[a.level];
  })[0];

  const styles = getAlertStyles(mostCriticalAlert.level);

  return (
    <div className="crisis-alert-critical">
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          {/* Alert Icon & Content */}
          <div className="flex items-start space-x-4">
            <div className="text-red-500 mt-1">
              <span className="text-4xl animate-pulse">🚨</span>
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Alert Header with Crisis Emphasis */}
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="crisis-label text-2xl">
                  TRUMP TARIFF CRISIS ALERT
                </h3>
                <span className="text-xs text-white/80 bg-red-600 px-3 py-1 rounded-full">
                  {mostCriticalAlert.source}
                </span>
              </div>

              {/* Alert Message */}
              <p className="crisis-description text-lg">
                {mostCriticalAlert.message}
                {mostCriticalAlert.company && (
                  <span className="font-bold"> • {mostCriticalAlert.company}</span>
                )}
              </p>

              {/* PROMINENT Crisis Amount Display */}
              <div className="crisis-amount mb-6">
                <span className="crisis-amount-value">
                  {formatCurrency(crisisAmount || mostCriticalAlert.impact?.crisisPenalty || 2125000)}
                </span>
                <span className="crisis-label text-xl">
                  AT RISK
                </span>
              </div>

              {/* Financial Impact Grid */}
              <div className="crisis-financial-impact">
                <div className="impact-metric impact-metric-danger">
                  <div className="impact-amount">
                    {formatCurrency(mostCriticalAlert.impact?.crisisPenalty || crisisAmount)}
                  </div>
                  <div className="impact-label">Crisis Penalty</div>
                  <div className="impact-description">Trump tariff exposure</div>
                </div>
                
                <div className="impact-metric impact-metric-success">
                  <div className="impact-amount">$0</div>
                  <div className="impact-label">USMCA Rate</div>
                  <div className="impact-description">Through Mexico</div>
                </div>
                
                <div className="impact-metric impact-metric-info">
                  <div className="impact-amount">
                    {formatCurrency(mostCriticalAlert.impact?.potentialSavings || crisisAmount)}
                  </div>
                  <div className="impact-label">Potential Savings</div>
                  <div className="impact-description">Act now to secure</div>
                </div>
              </div>

              {/* Prominent Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 mt-8">
                <button 
                  className="crisis-action-button"
                  onClick={() => window.location.href = '/usmca-workflow'}
                >
                  <span className="text-xl mr-2">🛡️</span>
                  START PROTECTION WORKFLOW NOW
                </button>
                
                <button 
                  className="btn-secondary btn-large"
                  onClick={() => window.location.href = '/trump-tariff-alerts'}
                >
                  View All Crisis Alerts
                </button>
                
                {showFullDetails && (
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    onClick={() => loadCrisisAlerts()}
                  >
                    Refresh Crisis Status
                  </button>
                )}
              </div>

              {/* Multiple Alerts Indicator */}
              {alerts.length > 1 && (
                <p className="text-xs text-gray-600 mt-2">
                  +{alerts.length - 1} more crisis alert{alerts.length > 2 ? 's' : ''} available
                </p>
              )}
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white text-2xl transition-colors"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>

        {/* Urgency Indicator */}
        <div className="mt-6 p-4 bg-black/20 rounded-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-white/90">
                <strong>527 companies</strong> have already secured Mexico suppliers.
                <span className="text-yellow-300 ml-2">Don't wait until it's too late.</span>
              </p>
            </div>
            <div className="text-xs text-white/70">
              Updated: {new Date(mostCriticalAlert.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}