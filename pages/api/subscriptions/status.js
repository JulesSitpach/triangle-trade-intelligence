import { getSupabaseClient } from '../../../lib/supabase-client'
import { hasFeatureAccess, checkUsageLimit } from '../../../lib/stripe'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const supabase = getSupabaseClient()

    // Get user's current subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw subError
    }

    // Get current usage data
    let usage = null
    if (subscription) {
      const { data: usageData, error: usageError } = await supabase
        .from('subscription_usage')
        .select('*')
        .eq('user_id', userId)
        .lte('current_period_start', 'now()')
        .gte('current_period_end', 'now()')
        .single()

      if (usageError && usageError.code !== 'PGRST116') {
        console.error('Usage query error:', usageError)
      } else if (usageData) {
        usage = usageData
      }
    }

    // If no subscription, return free tier info
    if (!subscription) {
      return res.status(200).json({
        hasSubscription: false,
        tier: 'FREE',
        status: 'inactive',
        features: {
          marcus_ai: false,
          beast_master: false,
          unlimited_analyses: false,
          custom_api: false,
          priority_support: false,
          real_time_alerts: false
        },
        limits: {
          monthlyAnalyses: { allowed: true, limit: 5, remaining: 5, usage: 0 },
          savedRoutes: { allowed: true, limit: 2, remaining: 2, usage: 0 },
          alertChannels: { allowed: false, limit: 0, remaining: 0, usage: 0 }
        }
      })
    }

    // Calculate feature access
    const features = {
      marcus_ai: hasFeatureAccess(subscription.tier, 'marcus_ai'),
      beast_master: hasFeatureAccess(subscription.tier, 'beast_master'),
      unlimited_analyses: hasFeatureAccess(subscription.tier, 'unlimited_analyses'),
      custom_api: hasFeatureAccess(subscription.tier, 'custom_api'),
      priority_support: hasFeatureAccess(subscription.tier, 'priority_support'),
      real_time_alerts: hasFeatureAccess(subscription.tier, 'real_time_alerts')
    }

    // Calculate usage limits
    const currentUsage = usage ? {
      monthlyAnalyses: usage.monthly_analyses || 0,
      savedRoutes: usage.saved_routes || 0,
      alertChannels: usage.alert_channels || 0,
      marcusConsultations: usage.marcus_consultations || 0
    } : {
      monthlyAnalyses: 0,
      savedRoutes: 0,
      alertChannels: 0,
      marcusConsultations: 0
    }

    const limits = {
      monthlyAnalyses: checkUsageLimit(subscription.tier, 'monthlyAnalyses', currentUsage.monthlyAnalyses),
      savedRoutes: checkUsageLimit(subscription.tier, 'savedRoutes', currentUsage.savedRoutes),
      alertChannels: checkUsageLimit(subscription.tier, 'alertChannels', currentUsage.alertChannels),
      marcusConsultations: checkUsageLimit(subscription.tier, 'marcusConsultations', currentUsage.marcusConsultations)
    }

    res.status(200).json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        stripeCustomerId: subscription.stripe_customer_id
      },
      features,
      limits,
      usage: currentUsage
    })

  } catch (error) {
    console.error('Subscription status error:', error)
    res.status(500).json({ 
      error: 'Failed to get subscription status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}