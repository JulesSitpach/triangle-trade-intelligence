/**
 * SubscriptionContext Component
 * Displays subscription status, usage, and agent intelligence badges
 * Integrates with agent responses to show subscription-aware features
 */

import React from 'react';

export default function SubscriptionContext({
  subscriptionContext,
  agentIntelligence,
  className = ""
}) {
  if (!subscriptionContext) {
    return null;
  }

  const {
    plan,
    plan_name,
    usage_remaining,
    usage_status,
    upgrade_needed,
    next_tier,
    upgrade_benefits,
    features_available
  } = subscriptionContext;

  // Style variants based on plan tier
  const planStyles = {
    trial: 'border-yellow-200 bg-yellow-50',
    professional: 'border-blue-200 bg-blue-50',
    business: 'border-green-200 bg-green-50',
    enterprise: 'border-purple-200 bg-purple-50'
  };

  const planBadgeStyles = {
    trial: 'bg-yellow-100 text-yellow-800',
    professional: 'bg-blue-100 text-blue-800',
    business: 'bg-green-100 text-green-800',
    enterprise: 'bg-purple-100 text-purple-800'
  };

  return (
    <div className={`subscription-context ${planStyles[plan]} ${className}`}>
      {/* Plan Badge and Usage */}
      <div className="subscription-header">
        <div className={`plan-badge ${planBadgeStyles[plan]}`}>
          {plan_name} Plan
        </div>
        <div className="usage-info">
          {usage_status === 'limit_exceeded' ? (
            <span className="usage-exceeded">❌ Limit Reached</span>
          ) : (
            <span className="usage-normal">📊 {usage_remaining}</span>
          )}
        </div>
      </div>

      {/* Agent Intelligence Badges */}
      {agentIntelligence && (
        <div className="agent-intelligence">
          {agentIntelligence.web_verification?.performed && (
            <div className="intelligence-badge web-verified">
              🔍 Web-verified classification ({agentIntelligence.web_verification.sources_consulted} sources)
            </div>
          )}

          {agentIntelligence.confidence && (
            <div className="intelligence-badge confidence">
              📊 {agentIntelligence.confidence} confidence
            </div>
          )}

          {agentIntelligence.data_freshness && (
            <div className="intelligence-badge freshness">
              🕒 Data verified {agentIntelligence.data_freshness}
            </div>
          )}

          {features_available?.includes('expert_validation') && (
            <div className="intelligence-badge expert-validation">
              👨‍💼 Expert validation available
            </div>
          )}
        </div>
      )}

      {/* Upgrade Prompt */}
      {upgrade_needed && next_tier && upgrade_benefits && (
        <div className="upgrade-prompt">
          <div className="upgrade-header">
            ⚠️ Usage limit reached for {plan_name}
          </div>
          <div className="upgrade-benefits">
            <strong>Upgrade to {upgrade_benefits.name} (${upgrade_benefits.price}/month):</strong>
            <ul>
              {upgrade_benefits.additional_classifications !== 0 && (
                <li>+{upgrade_benefits.additional_classifications} classifications</li>
              )}
              {upgrade_benefits.additional_certificates !== 0 && (
                <li>+{upgrade_benefits.additional_certificates} certificates</li>
              )}
              {upgrade_benefits.new_features?.map((feature, index) => (
                <li key={index}>{formatFeatureName(feature)}</li>
              ))}
            </ul>
            <button className="btn-upgrade">
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Feature List for Current Plan */}
      {!upgrade_needed && features_available && (
        <div className="current-features">
          <div className="features-header">✅ Your Plan Includes:</div>
          <div className="features-list">
            {features_available.map((feature, index) => (
              <span key={index} className="feature-tag">
                {formatFeatureName(feature)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format feature names for display
function formatFeatureName(feature) {
  const featureMap = {
    'basic_classification': 'Basic HS Classification',
    'web_verification': 'Web Search Verification',
    'confidence_scoring': 'AI Confidence Scores',
    'certificate_generation': 'USMCA Certificates',
    'crisis_alerts': 'Trade Crisis Alerts',
    'expert_validation': 'Expert Review',
    'priority_support': 'Priority Support',
    'all_features': 'All Features',
    'dedicated_support': 'Dedicated Support',
    'custom_integration': 'Custom API Integration',
    'api_access': 'Full API Access'
  };

  return featureMap[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Compact version for inline display
 */
export function SubscriptionBadge({ subscriptionContext, className = "" }) {
  if (!subscriptionContext) return null;

  const { plan, plan_name, usage_remaining, usage_status } = subscriptionContext;

  const badgeStyles = {
    trial: 'badge-yellow',
    professional: 'badge-blue',
    business: 'badge-green',
    enterprise: 'badge-purple'
  };

  return (
    <div className={`subscription-badge ${badgeStyles[plan]} ${className}`}>
      <span className="plan-name">{plan_name}</span>
      <span className="usage-info">
        {usage_status === 'limit_exceeded' ? '❌ Limit' : usage_remaining}
      </span>
    </div>
  );
}

/**
 * Intelligence badges component for agent features
 */
export function AgentIntelligenceBadges({
  agentIntelligence,
  subscriptionContext,
  className = ""
}) {
  if (!agentIntelligence || !subscriptionContext) return null;

  const { features_available } = subscriptionContext;

  return (
    <div className={`agent-intelligence-badges ${className}`}>
      {agentIntelligence.web_verification?.performed &&
       features_available?.includes('web_verification') && (
        <div className="intelligence-badge web-verified">
          🔍 Web-verified ({agentIntelligence.web_verification.sources_consulted} sources)
        </div>
      )}

      {agentIntelligence.confidence &&
       features_available?.includes('confidence_scoring') && (
        <div className="intelligence-badge confidence">
          📊 {agentIntelligence.confidence} confidence
        </div>
      )}

      {agentIntelligence.data_freshness && (
        <div className="intelligence-badge freshness">
          🕒 Verified today
        </div>
      )}

      {features_available?.includes('expert_validation') && (
        <div className="intelligence-badge expert-available">
          👨‍💼 Expert validation included
        </div>
      )}
    </div>
  );
}