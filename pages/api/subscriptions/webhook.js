import { stripe } from '../../../lib/stripe'
import { getSupabaseClient } from '../../../lib/supabase-client'
import { buffer } from 'micro'

// Disable Next.js body parsing for webhooks
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
    return res.status(500).json({ error: 'Webhook secret not configured' })
  }

  let event
  let rawBody

  try {
    rawBody = await buffer(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  const supabase = getSupabaseClient()

  try {
    // Log the event
    await supabase.from('subscription_events').insert({
      event_type: event.type,
      stripe_event_id: event.id,
      event_data: event.data,
      processed: false
    })

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark event as processed
    await supabase
      .from('subscription_events')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .eq('stripe_event_id', event.id)

    res.status(200).json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Log error in database
    await supabase
      .from('subscription_events')
      .update({ 
        error_message: error.message,
        processed_at: new Date().toISOString()
      })
      .eq('stripe_event_id', event.id)

    res.status(500).json({ error: 'Webhook processing failed' })
  }

  // Helper functions for handling different events
  async function handleCheckoutSessionCompleted(session) {
    console.log('Checkout session completed:', session.id)
    
    if (session.mode === 'subscription') {
      // Get the subscription
      const subscription = await stripe.subscriptions.retrieve(session.subscription)
      await handleSubscriptionChange(subscription)
    }
  }

  async function handleSubscriptionChange(subscription) {
    console.log('Subscription change:', subscription.id)
    
    const userId = subscription.metadata.userId
    if (!userId || userId === 'anonymous') {
      console.error('No user ID in subscription metadata')
      return
    }

    const tierMapping = {
      [process.env.STRIPE_STARTER_PRICE_ID]: 'STARTER',
      [process.env.STRIPE_PROFESSIONAL_PRICE_ID]: 'PROFESSIONAL', 
      [process.env.STRIPE_ENTERPRISE_PRICE_ID]: 'ENTERPRISE'
    }

    const priceId = subscription.items.data[0]?.price.id
    const tier = tierMapping[priceId] || subscription.metadata.tier

    // Upsert subscription record
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        stripe_price_id: priceId,
        tier: tier,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Failed to upsert subscription:', error)
      throw error
    }

    // Initialize usage tracking for new billing period
    await initializeUsageTracking(userId, subscription)
  }

  async function handleSubscriptionDeleted(subscription) {
    console.log('Subscription deleted:', subscription.id)
    
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Failed to update deleted subscription:', error)
      throw error
    }
  }

  async function handlePaymentSucceeded(invoice) {
    console.log('Payment succeeded:', invoice.id)
    
    if (invoice.subscription) {
      // Ensure subscription is active
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', invoice.subscription)

      if (error) {
        console.error('Failed to activate subscription after payment:', error)
      }
    }
  }

  async function handlePaymentFailed(invoice) {
    console.log('Payment failed:', invoice.id)
    
    if (invoice.subscription) {
      // Mark subscription as past_due
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', invoice.subscription)

      if (error) {
        console.error('Failed to mark subscription past due:', error)
      }
    }
  }

  async function initializeUsageTracking(userId, subscription) {
    // Create usage tracking record for current billing period
    const { error } = await supabase
      .from('subscription_usage')
      .upsert({
        user_id: userId,
        subscription_id: null, // Will be set after subscription is created
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        monthly_analyses: 0,
        saved_routes: 0,
        alert_channels: 0,
        marcus_consultations: 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,current_period_start'
      })

    if (error) {
      console.error('Failed to initialize usage tracking:', error)
    }
  }
}