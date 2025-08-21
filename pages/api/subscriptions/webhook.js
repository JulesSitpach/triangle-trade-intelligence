import { stripe } from '../../../lib/stripe'
import { getServerSupabaseClient } from '../../../lib/supabase-client'
import { buffer } from 'micro'
import { logInfo, logError, logDBQuery, logSecurity } from '../../../lib/production-logger'

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
    logError('Missing STRIPE_WEBHOOK_SECRET environment variable')
    return res.status(500).json({ error: 'Webhook secret not configured' })
  }

  let event
  let rawBody

  try {
    rawBody = await buffer(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    logSecurity('Webhook signature verification failed', {
      errorMessage: err.message
    })
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  const supabase = getServerSupabaseClient()

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
        logInfo('Unhandled webhook event type', {
          eventType: event.type,
          eventId: event.id
        })
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
    logError('Webhook processing error', {
      errorType: error.name,
      message: error.message,
      eventType: event.type,
      eventId: event.id
    })
    
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
    logInfo('Checkout session completed', {
      sessionId: session.id,
      mode: session.mode
    })
    
    if (session.mode === 'subscription') {
      // Get the subscription
      const subscription = await stripe.subscriptions.retrieve(session.subscription)
      await handleSubscriptionChange(subscription)
    }
  }

  async function handleSubscriptionChange(subscription) {
    logInfo('Subscription change processed', {
      subscriptionId: subscription.id,
      status: subscription.status
    })
    
    const userId = subscription.metadata.userId
    if (!userId || userId === 'anonymous') {
      logError('No user ID in subscription metadata', {
        subscriptionId: subscription.id
      })
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
      logError('Failed to upsert subscription', {
        errorType: error.name,
        message: error.message,
        subscriptionId: subscription.id
      })
      throw error
    }

    // Initialize usage tracking for new billing period
    await initializeUsageTracking(userId, subscription)
  }

  async function handleSubscriptionDeleted(subscription) {
    logInfo('Subscription deleted', {
      subscriptionId: subscription.id
    })
    
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      logError('Failed to update deleted subscription', {
        errorType: error.name,
        message: error.message,
        subscriptionId: subscription.id
      })
      throw error
    }
  }

  async function handlePaymentSucceeded(invoice) {
    logInfo('Payment succeeded', {
      invoiceId: invoice.id,
      hasSubscription: !!invoice.subscription
    })
    
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
        logError('Failed to activate subscription after payment', {
          errorType: error.name,
          message: error.message,
          invoiceId: invoice.id
        })
      }
    }
  }

  async function handlePaymentFailed(invoice) {
    logInfo('Payment failed', {
      invoiceId: invoice.id,
      hasSubscription: !!invoice.subscription
    })
    
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
        logError('Failed to mark subscription past due', {
          errorType: error.name,
          message: error.message,
          invoiceId: invoice.id
        })
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
      logError('Failed to initialize usage tracking', {
        errorType: error.name,
        message: error.message,
        userId
      })
    }
  }
}