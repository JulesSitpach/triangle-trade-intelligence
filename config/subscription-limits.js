/**
 * SUBSCRIPTION TIER LIMITS & FEATURE GATES
 * Controls free trial vs paid tier access for conversion optimization
 *
 * Strategy: Give enough free value to demonstrate ROI, gate premium features
 */

export const SUBSCRIPTION_TIERS = {
  FREE_TRIAL: 'Trial',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  PREMIUM: 'Premium'
  // REMOVED: Enterprise tier (not available on pricing page)
};

export const TIER_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE_TRIAL]: {
    // 7-Day Free Trial
    trial_duration_days: 7,

    // USMCA Analysis
    components_per_analysis: 3,
    analyses_total: 1,  // 1 analysis total during 7-day trial
    certificate_download: false,
    certificate_preview: true,
    preview_watermarked: true,

    // Crisis Alerts
    view_crisis_alerts: true,
    email_notifications: false,
    alert_history_days: 7,
    alert_detail_access: true,

    // Professional Services
    service_discounts: 0,
    priority_support: false,

    // Features
    trade_health_check: false,
    supplier_discovery: false,

    // Conversion messaging
    upgrade_cta: 'Subscribe to download certificate and get email alerts',
    tier_label: '7-Day Free Trial',
    tier_color: '#6b7280'
  },

  [SUBSCRIPTION_TIERS.STARTER]: {
    // USMCA Analysis
    components_per_analysis: 10,
    analyses_per_month: 10,
    certificate_download: true,
    certificate_preview: true,
    preview_watermarked: false,

    // Crisis Alerts
    view_crisis_alerts: true,
    email_notifications: true,
    email_severity_filter: ['high', 'critical'], // Only high/critical alerts
    alert_history_days: 30,
    alert_detail_access: true,

    // Professional Services
    service_discounts: 0,
    priority_support: false,

    // Features
    trade_health_check: true,
    supplier_discovery: false,

    // Branding
    tier_label: 'Starter',
    tier_color: '#3b82f6',
    monthly_price: 99
  },

  [SUBSCRIPTION_TIERS.PROFESSIONAL]: {
    // USMCA Analysis
    components_per_analysis: 15, // Aligned with API limits
    analyses_per_month: 100, // 100 analyses per month
    certificate_download: true,
    certificate_preview: true,
    preview_watermarked: false,

    // Crisis Alerts
    view_crisis_alerts: true,
    email_notifications: true,
    email_severity_filter: ['low', 'medium', 'high', 'critical'], // All alerts
    alert_history_days: 90,
    alert_detail_access: true,

    // AI Features
    portfolio_briefing: true,
    advanced_ai_scoring: true,

    // Features
    trade_health_check: true,
    supplier_discovery: true,

    // Branding
    tier_label: 'Professional',
    tier_color: '#8b5cf6',
    monthly_price: 299
  },

  [SUBSCRIPTION_TIERS.PREMIUM]: {
    // USMCA Analysis
    components_per_analysis: 20, // Premium gets 20 components
    analyses_per_month: 500, // ✅ FIXED: 500 analyses/month to prevent AI cost abuse
    certificate_download: true,
    certificate_preview: true,
    preview_watermarked: false,

    // Crisis Alerts
    view_crisis_alerts: true,
    email_notifications: true,
    email_severity_filter: ['low', 'medium', 'high', 'critical'],
    alert_history_days: 365,
    alert_detail_access: true,

    // AI Features
    portfolio_briefing: true,
    advanced_ai_scoring: true,
    priority_ai_queue: true, // Faster AI response times

    // Features
    trade_health_check: true,
    supplier_discovery: true,

    // Branding
    tier_label: 'Premium',
    tier_color: '#f59e0b',
    monthly_price: 599
  }
  // REMOVED: Enterprise tier (not available on pricing page)
};

/**
 * Check if user can add more components
 */
export function canAddComponent(userTier, currentComponentCount) {
  const limits = TIER_LIMITS[userTier] || TIER_LIMITS[SUBSCRIPTION_TIERS.FREE_TRIAL];
  const maxComponents = limits.components_per_analysis;

  // Unlimited components
  if (maxComponents === null) return true;

  // Check against limit
  return currentComponentCount < maxComponents;
}

/**
 * Get component limit message for user
 */
export function getComponentLimitMessage(userTier, currentComponentCount) {
  const limits = TIER_LIMITS[userTier] || TIER_LIMITS[SUBSCRIPTION_TIERS.FREE_TRIAL];
  const maxComponents = limits.components_per_analysis;

  if (maxComponents === null) {
    return `Unlimited components (${limits.tier_label})`;
  }

  return `${currentComponentCount}/${maxComponents} components used (${limits.tier_label})`;
}

/**
 * Check if user can download certificate
 */
export function canDownloadCertificate(userTier) {
  const limits = TIER_LIMITS[userTier] || TIER_LIMITS[SUBSCRIPTION_TIERS.FREE_TRIAL];
  return limits.certificate_download;
}

/**
 * Check if certificate should be watermarked
 */
export function shouldWatermarkCertificate(userTier) {
  const limits = TIER_LIMITS[userTier] || TIER_LIMITS[SUBSCRIPTION_TIERS.FREE_TRIAL];
  return limits.preview_watermarked;
}

/**
 * Check if user can receive email alerts
 */
export function canReceiveEmailAlerts(userTier) {
  const limits = TIER_LIMITS[userTier] || TIER_LIMITS[SUBSCRIPTION_TIERS.FREE_TRIAL];
  return limits.email_notifications;
}

/**
 * Check if user can view crisis alerts in dashboard
 */
export function canViewAlerts(userTier) {
  const limits = TIER_LIMITS[userTier] || TIER_LIMITS[SUBSCRIPTION_TIERS.FREE_TRIAL];
  return limits.view_crisis_alerts;
}

/**
 * Get alert history limit in days
 */
export function getAlertHistoryDays(userTier) {
  const limits = TIER_LIMITS[userTier] || TIER_LIMITS[SUBSCRIPTION_TIERS.FREE_TRIAL];
  return limits.alert_history_days;
}

/**
 * Get service discount percentage
 */
export function getServiceDiscount(userTier) {
  const limits = TIER_LIMITS[userTier] || TIER_LIMITS[SUBSCRIPTION_TIERS.FREE_TRIAL];
  return limits.service_discounts;
}

/**
 * Get upgrade CTA message for free users
 */
export function getUpgradeMessage(userTier, context = 'general') {
  const limits = TIER_LIMITS[userTier] || TIER_LIMITS[SUBSCRIPTION_TIERS.FREE_TRIAL];

  if (userTier !== SUBSCRIPTION_TIERS.FREE_TRIAL) {
    return null; // No upgrade message for paid users
  }

  const messages = {
    component_limit: 'Need more components? Upgrade to Starter ($99/mo) for 10 components per analysis',
    certificate_download: 'Subscribe to download your certificate and use it for customs declarations',
    email_alerts: 'Subscribe to get crisis alerts delivered instantly to your inbox',
    general: limits.upgrade_cta
  };

  return messages[context] || messages.general;
}

/**
 * Check if user should see upgrade prompts
 */
export function shouldShowUpgradePrompts(userTier) {
  return userTier === SUBSCRIPTION_TIERS.FREE_TRIAL;
}

/**
 * Get tier comparison for upgrade modals
 */
export function getTierComparison() {
  return [
    {
      tier: SUBSCRIPTION_TIERS.FREE_TRIAL,
      name: '7-Day Free Trial',
      price: '$0',
      features: [
        '7 days to explore platform',
        '1 USMCA analysis (3 components)',
        'Certificate preview (watermarked)',
        'View alerts (no email)',
        'No service discounts'
      ]
    },
    {
      tier: SUBSCRIPTION_TIERS.STARTER,
      name: 'Starter',
      price: '$99/mo',
      features: [
        '10 analyses per month',
        '10 components per analysis',
        'Full certificate download',
        'Email alerts (high/critical)',
        'Trade health check'
      ],
      popular: false
    },
    {
      tier: SUBSCRIPTION_TIERS.PROFESSIONAL,
      name: 'Professional',
      price: '$299/mo',
      features: [
        '100 analyses per month',
        '15 components per analysis',
        'Full certificate download',
        'All email alerts',
        'Portfolio briefing reports',
        'Advanced AI scoring'
      ],
      popular: true
    },
    {
      tier: SUBSCRIPTION_TIERS.PREMIUM,
      name: 'Premium',
      price: '$599/mo',
      features: [
        '500 analyses per month',
        '20 components per analysis',
        'Full certificate download',
        'All email alerts',
        'Portfolio briefing reports',
        'Advanced AI scoring',
        'Priority AI queue (faster response)',
        '1-year alert history'
      ],
      popular: false
    }
  ];
}

export default {
  SUBSCRIPTION_TIERS,
  TIER_LIMITS,
  canAddComponent,
  getComponentLimitMessage,
  canDownloadCertificate,
  shouldWatermarkCertificate,
  canReceiveEmailAlerts,
  canViewAlerts,
  getAlertHistoryDays,
  getServiceDiscount,
  getUpgradeMessage,
  shouldShowUpgradePrompts,
  getTierComparison
};
