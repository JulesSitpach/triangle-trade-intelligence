import { stripe } from '../../../lib/stripe'
import { getSupabaseClient } from '../../../lib/supabase-client'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, returnUrl } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const supabase = getSupabaseClient()

    // Get user's subscription to find customer ID
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !subscription) {
      return res.status(404).json({ error: 'No active subscription found' })
    }

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })

    // Log portal access
    try {
      await supabase.from('subscription_events').insert({
        user_id: userId,
        event_type: 'portal_session_created',
        event_data: {
          session_id: portalSession.id,
          customer_id: subscription.stripe_customer_id
        }
      })
    } catch (dbError) {
      console.error('Failed to log portal session:', dbError)
      // Don't fail the request for logging errors
    }

    res.status(200).json({
      portalUrl: portalSession.url
    })

  } catch (error) {
    console.error('Create portal session error:', error)
    res.status(500).json({ 
      error: 'Failed to create portal session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}