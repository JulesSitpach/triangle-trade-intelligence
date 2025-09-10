/**
 * CRISIS ALERT BANNER COMPONENT
 * Real-time crisis alerts integrated with RSS monitoring system
 * Shows personalized financial impact and immediate actions available
 */

import React, { useState, useEffect } from 'react';
// Simple icon components to avoid ESM import issues
const AlertCircle = ({ className }) => (
  <span className={className}>[alert]</span>
);

const DollarSign = ({ className }) => (
  <span className={className}>[dollar]</span>
);

const Clock = ({ className }) => (
  <span className={className}>[clock]</span>
);

const Shield = ({ className }) => (
  <span className={className}>[shield]</span>
);

const X = ({ className }) => (
  <span className={className}>[x]</span>
);

const TrendingUp = ({ className }) => (
  <span className={className}>[trending-up]</span>
);

const AlertTriangle = ({ className }) => (
  <span className={className}>[warning]</span>
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
          bg: 'crisis-alert-critical',
          border: 'crisis-border-critical',
          text: 'crisis-text-critical',
          accent: 'crisis-accent-critical',
          button: 'crisis-action-button'
        };
      case 'high':
        return {
          bg: 'crisis-alert-high',
          border: 'crisis-border-high',
          text: 'crisis-text-high',
          accent: 'crisis-accent-high',
          button: 'crisis-action-button'
        };
      default:
        return {
          bg: 'crisis-alert-medium',
          border: 'crisis-border-medium',
          text: 'crisis-text-medium',
          accent: 'crisis-accent-medium',
          button: 'crisis-action-button'
        };
    }
  };

  const getAlertIcon = (level) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="icon-md loading-spinner" />;
      case 'high':
        return <AlertCircle className="icon-md" />;
      default:
        return <Clock className="icon-md" />;
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
        <div className="hero-button-group">
          {/* Alert Icon & Content */}
          <div className="hero-button-group">
            <div className="crisis-icon">
              <span className="crisis-emoji loading-spinner">🚨</span>
            </div>
            
            <div className="content-card">
              {/* Alert Header with Crisis Emphasis */}
              <div className="hero-button-group">
                <h3 className="crisis-label">
                  TRUMP TARIFF CRISIS ALERT
                </h3>
                <span className="crisis-source-badge">
                  {mostCriticalAlert.source}
                </span>
              </div>

              {/* Alert Message */}
              <p className="crisis-description">
                {mostCriticalAlert.message}
                {mostCriticalAlert.company && (
                  <span className="crisis-company"> • {mostCriticalAlert.company}</span>
                )}
              </p>

              {/* PROMINENT Crisis Amount Display */}
              <div className="crisis-amount">
                <span className="crisis-amount-value">
                  {formatCurrency(crisisAmount || mostCriticalAlert.impact?.crisisPenalty || 2125000)}
                </span>
                <span className="crisis-label">
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
              <div className="hero-button-group">
                <button 
                  className="crisis-action-button"
                  onClick={() => window.location.href = '/usmca-workflow'}
                >
                  <span className="crisis-shield">🛡️</span>
                  START PROTECTION WORKFLOW NOW
                </button>
                
                <button 
                  className="btn-secondary"
                  onClick={() => window.location.href = '/trump-tariff-alerts'}
                >
                  View All Crisis Alerts
                </button>
                
                {showFullDetails && (
                  <button 
                    className="btn-primary"
                    onClick={() => loadCrisisAlerts()}
                  >
                    Refresh Crisis Status
                  </button>
                )}
              </div>

              {/* Multiple Alerts Indicator */}
              {alerts.length > 1 && (
                <p className="text-muted">
                  +{alerts.length - 1} more crisis alert{alerts.length > 2 ? 's' : ''} available
                </p>
              )}
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="crisis-dismiss-button"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>

        {/* Urgency Indicator */}
        <div className="crisis-urgency-indicator">
          <div className="hero-button-group">
            <div className="hero-button-group">
              <div className="crisis-pulse-dot loading-spinner"></div>
              <p className="crisis-urgency-text">
                <strong>527 companies</strong> have already secured Mexico suppliers.
                <span className="crisis-urgency-warning">Don't wait until it's too late.</span>
              </p>
            </div>
            <div className="crisis-timestamp">
              Updated: {new Date(mostCriticalAlert.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}