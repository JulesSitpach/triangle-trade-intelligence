/**
 * Subscription Service - Handles subscription validation and context for agent responses
 * Integrates with agent API endpoints to provide subscription-aware responses
 */

import { createClient } from '@supabase/supabase-js';
import { logDevIssue, DevIssue } from '../utils/logDevIssue.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ FIX (Nov 1): Match database CHECK constraint - tier names MUST be capitalized
// Database: CHECK (subscription_tier IN ('Trial', 'Starter', 'Professional', 'Premium'))
const SUBSCRIPTION_TIERS = {
  Trial: {
    name: 'Trial',
    monthly_classifications: 5,
    monthly_certificates: 2,
    features: ['basic_classification', 'simple_certificate'],
    price: 0
  },
  Starter: {
    name: 'Starter',
    monthly_classifications: 25,
    monthly_certificates: 10,
    features: ['basic_classification', 'web_verification', 'confidence_scoring', 'certificate_generation', 'crisis_alerts'],
    price: 199
  },
  Professional: {
    name: 'Professional',
    monthly_classifications: 100,
    monthly_certificates: 50,
    features: ['basic_classification', 'web_verification', 'confidence_scoring', 'certificate_generation', 'crisis_alerts', 'expert_validation', 'priority_support'],
    price: 499
  },
  Premium: {
    name: 'Premium',
    monthly_classifications: -1, // Unlimited
    monthly_certificates: -1, // Unlimited
    features: ['all_features', 'dedicated_support', 'custom_integration', 'api_access'],
    price: 999
  }
};

/**
 * Get user subscription details
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Subscription details
 */
export async function getUserSubscription(userId) {
  try {
    // ✅ FIX (Nov 1): Query user_profiles table (subscription_tier column), not user_subscriptions
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('subscription_tier, trial_ends_at, created_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      await DevIssue.apiError('database_service', 'subscription-service.getUserSubscription', error, {
        userId,
        operation: 'SELECT',
        table: 'user_profiles'
      });
    }

    if (!profile) {
      await logDevIssue({
        type: 'missing_data',
        severity: 'medium',
        component: 'database_service',
        message: 'User profile not found in database, defaulting to Trial',
        data: {
          userId,
          table: 'user_profiles',
          fallbackTier: 'Trial'
        }
      });
    }

    if (error || !profile) {
      // Default to Trial if no profile found
      return {
        user_id: userId,
        tier: 'Trial',
        status: 'active',
        usage_classifications: 0,
        usage_certificates: 0,
        period_start: new Date().toISOString(),
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      };
    }

    // Convert user_profiles format to subscription format
    return {
      user_id: userId,
      tier: profile.subscription_tier || 'Trial',
      status: 'active',
      usage_classifications: 0, // TODO: Track usage in separate table if needed
      usage_certificates: 0,
      period_start: profile.created_at || new Date().toISOString(),
      period_end: profile.trial_ends_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  } catch (error) {
    await logDevIssue({
      type: 'api_error',
      severity: 'critical',
      component: 'database_service',
      message: 'Database connection error fetching user subscription',
      data: {
        error: error.message,
        stack: error.stack,
        userId,
        table: 'user_profiles'
      }
    });
    console.error('Error fetching user subscription:', error);
    // Return trial subscription as fallback
    return {
      user_id: userId,
      tier: 'Trial',
      status: 'active',
      usage_classifications: 0,
      usage_certificates: 0,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }
}

/**
 * Get available features for a subscription tier
 * @param {string} tier - Subscription tier
 * @returns {Array} Available features
 */
export function getAvailableFeatures(tier) {
  return SUBSCRIPTION_TIERS[tier]?.features || SUBSCRIPTION_TIERS.trial.features;
}

/**
 * Check if user has exceeded usage limits
 * @param {Object} subscription - User subscription object
 * @param {string} serviceType - Type of service ('classification' or 'certificate')
 * @returns {boolean} Whether usage limit is exceeded
 */
export function isUsageLimitExceeded(subscription, serviceType) {
  const tierLimits = SUBSCRIPTION_TIERS[subscription.tier];
  if (!tierLimits) return true;

  if (serviceType === 'classification') {
    return tierLimits.monthly_classifications !== -1 &&
           subscription.usage_classifications >= tierLimits.monthly_classifications;
  }

  if (serviceType === 'certificate') {
    return tierLimits.monthly_certificates !== -1 &&
           subscription.usage_certificates >= tierLimits.monthly_certificates;
  }

  return false;
}

/**
 * Increment usage counter for a user
 * @param {string} userId - User ID
 * @param {string} serviceType - Service type ('classification' or 'certificate')
 * @returns {Promise<boolean>} Success status
 */
export async function incrementUsage(userId, serviceType) {
  try {
    // ✅ FIX (Nov 1): Usage tracking not yet implemented in database
    // user_profiles table doesn't have usage_classifications/usage_certificates columns
    // TODO: Create separate usage_tracking table if needed for production

    // For now, just return success without database update
    // This prevents classification API from failing when usage tracking is called
    console.log(`📊 [USAGE-TRACKING] Would increment ${serviceType} for user ${userId} (not implemented yet)`);
    return true;
  } catch (error) {
    console.error('Error in incrementUsage:', error);
    return false;
  }
}

/**
 * Generate subscription context for agent responses
 * @param {Object} subscription - User subscription object
 * @param {string} serviceType - Service type being requested
 * @returns {Object} Subscription context object
 */
export function generateSubscriptionContext(subscription, serviceType = 'classification') {
  const tierLimits = SUBSCRIPTION_TIERS[subscription.tier];
  const currentUsage = serviceType === 'classification' ?
    subscription.usage_classifications : subscription.usage_certificates;
  const limit = serviceType === 'classification' ?
    tierLimits.monthly_classifications : tierLimits.monthly_certificates;

  const isUnlimited = limit === -1;
  const usageRemaining = isUnlimited ? 'Unlimited' : `${currentUsage}/${limit}`;
  const isLimitExceeded = !isUnlimited && currentUsage >= limit;

  return {
    plan: subscription.tier,
    plan_name: tierLimits.name,
    usage_remaining: usageRemaining,
    features_available: tierLimits.features,
    upgrade_needed: isLimitExceeded,
    usage_status: isLimitExceeded ? 'limit_exceeded' : 'within_limits',
    next_tier: getNextTier(subscription.tier),
    upgrade_benefits: getUpgradeBenefits(subscription.tier)
  };
}

/**
 * Get the next subscription tier for upgrades
 * @param {string} currentTier - Current subscription tier
 * @returns {string|null} Next tier or null if already at highest
 */
function getNextTier(currentTier) {
  const tiers = ['Trial', 'Starter', 'Professional', 'Premium'];
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
}

/**
 * Get upgrade benefits for current tier
 * @param {string} currentTier - Current subscription tier
 * @returns {Object} Upgrade benefits
 */
function getUpgradeBenefits(currentTier) {
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return null;

  const nextTierData = SUBSCRIPTION_TIERS[nextTier];
  const currentTierData = SUBSCRIPTION_TIERS[currentTier];

  return {
    tier: nextTier,
    name: nextTierData.name,
    price: nextTierData.price,
    additional_classifications: nextTierData.monthly_classifications === -1 ?
      'Unlimited' : nextTierData.monthly_classifications - currentTierData.monthly_classifications,
    additional_certificates: nextTierData.monthly_certificates === -1 ?
      'Unlimited' : nextTierData.monthly_certificates - currentTierData.monthly_certificates,
    new_features: nextTierData.features.filter(f => !currentTierData.features.includes(f))
  };
}

/**
 * Main function to add subscription context to agent responses
 * @param {Object} request - API request object with user info
 * @param {Object} agentResponse - Original agent response
 * @param {string} serviceType - Service type ('classification' or 'certificate')
 * @returns {Promise<Object>} Enhanced response with subscription context
 */
export async function addSubscriptionContext(request, agentResponse, serviceType = 'classification') {
  try {
    // Extract user ID from request (adjust based on your auth implementation)
    const userId = request.user?.id || request.userId || 'anonymous';

    if (userId === 'anonymous') {
      // Return trial context for anonymous users
      agentResponse.subscription_context = generateSubscriptionContext({
        tier: 'Trial',
        usage_classifications: 0,
        usage_certificates: 0
      }, serviceType);
      return agentResponse;
    }

    // Get user subscription
    const userSubscription = await getUserSubscription(userId);

    // Check if usage limit exceeded
    const limitExceeded = isUsageLimitExceeded(userSubscription, serviceType);

    if (limitExceeded) {
      // Return limited response if usage exceeded
      agentResponse = {
        ...agentResponse,
        usage_limited: true,
        message: `You've reached your ${serviceType} limit for this month. Upgrade to continue.`
      };
    } else {
      // Increment usage counter for successful requests
      await incrementUsage(userId, serviceType);
    }

    // Add subscription context to response
    agentResponse.subscription_context = generateSubscriptionContext(userSubscription, serviceType);

    return agentResponse;
  } catch (error) {
    console.error('Error adding subscription context:', error);
    // Return original response with trial context on error
    agentResponse.subscription_context = generateSubscriptionContext({
      tier: 'Trial',
      usage_classifications: 0,
      usage_certificates: 0
    }, serviceType);
    return agentResponse;
  }
}