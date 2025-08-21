import { stripe, SUBSCRIPTION_TIERS } from '../../../lib/stripe'
import { getSupabaseClient } from '../../../lib/supabase-client'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { tier, email, userId, successUrl, cancelUrl } = req.body

    // Validate tier
    if (!SUBSCRIPTION_TIERS[tier]) {
      return res.status(400).json({ error: 'Invalid subscription tier' })
    }

    const tierConfig = SUBSCRIPTION_TIERS[tier]
    const supabase = getSupabaseClient()

    // Create or get Stripe customer
    let customer
    try {
      // Try to find existing customer
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1
      })

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0]
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          email: email,
          metadata: {
            userId: userId || 'anonymous'
          }
        })
      }
    } catch (error) {
      console.error('Error managing Stripe customer:', error)
      return res.status(500).json({ error: 'Failed to create customer' })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/subscription/canceled`,
      subscription_data: {
        metadata: {
          userId: userId || 'anonymous',
          tier: tier
        },
        trial_period_days: tier === 'STARTER' ? 14 : (tier === 'PROFESSIONAL' ? 7 : 0) // Free trial periods
      },
      metadata: {
        userId: userId || 'anonymous',
        tier: tier,
        email: email
      }
    })

    // Log checkout session creation
    if (userId) {
      try {
        await supabase.from('subscription_events').insert({
          user_id: userId,
          event_type: 'checkout_session_created',
          event_data: {
            session_id: session.id,
            tier: tier,
            customer_id: customer.id,
            email: email
          }
        })
      } catch (dbError) {
        console.error('Failed to log checkout session:', dbError)
        // Don't fail the request for logging errors
      }
    }

    res.status(200).json({
      sessionId: session.id,
      sessionUrl: session.url,
      customerId: customer.id
    })

  } catch (error) {
    console.error('Create checkout session error:', error)
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}