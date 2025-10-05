import { stripe } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Disable body parser to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Helper function to read raw body as buffer
 */
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Stripe Webhook Handler
 * POST /api/stripe/webhook
 *
 * Handles Stripe events:
 * - checkout.session.completed: Create subscription record
 * - customer.subscription.updated: Update subscription status
 * - customer.subscription.deleted: Cancel subscription
 * - invoice.payment_succeeded: Record successful payment
 * - invoice.payment_failed: Handle failed payment
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const buf = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('Missing stripe-signature header');
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`Received Stripe webhook event: ${event.type}`);

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout.session.completed:', session.id);

  const userId = session.metadata?.user_id;
  const serviceId = session.metadata?.service_id;

  if (!userId) {
    console.error('No user_id in session metadata');
    return;
  }

  try {
    // Check if this is a one-time service payment or subscription
    if (session.mode === 'payment' && serviceId) {
      // Handle one-time service purchase
      await handleServicePaymentCompleted(session);
    } else if (session.mode === 'subscription') {
      // Handle subscription purchase
      await handleSubscriptionPurchase(session, userId);
    }
  } catch (error) {
    console.error('Error in checkout.session.completed:', error);
    throw error;
  }
}

/**
 * Handle service payment completed and create service request
 */
async function handleServicePaymentCompleted(session) {
  const { user_id, service_id, service_name, service_request_data } = session.metadata;

  console.log(`Processing service payment: ${service_name} for user ${user_id}`);

  try {
    // Parse service request data from metadata
    const requestData = service_request_data ? JSON.parse(service_request_data) : {};

    // Determine which team handles this service
    const assigned_to = ['supplier-sourcing', 'manufacturing-feasibility', 'market-entry'].includes(service_id)
      ? 'Jorge'
      : 'Cristina';

    // Create service request in database
    const { data: serviceRequest, error: insertError } = await supabase
      .from('service_requests')
      .insert([{
        user_id: user_id,
        service_type: service_id,
        client_company: requestData.company_name || 'Unknown Company',
        client_info: requestData.client_info || {},
        service_details: requestData.service_details || {},
        subscriber_data: requestData.subscriber_data || {},
        status: 'pending', // Awaiting specialist action
        assigned_to: assigned_to,
        price: session.amount_total / 100, // Convert from cents to dollars
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        paid_at: new Date().toISOString(),
        intake_form_completed: true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create service request:', insertError);
      throw insertError;
    }

    console.log(`Service request created: ${serviceRequest.id} - Assigned to ${assigned_to}`);

    // TODO: Send email notification to specialist (Jorge or Cristina)
    // TODO: Send confirmation email to customer
  } catch (error) {
    console.error('Error processing service payment:', error);
    throw error;
  }
}

/**
 * Handle subscription purchase from checkout session
 */
async function handleSubscriptionPurchase(session, userId) {
  const tier = session.metadata?.tier;
  const billingPeriod = session.metadata?.billing_period;

  console.log(`Processing subscription purchase for user: ${userId}`);

  try {
    // Update or create subscription record in database
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      tier: tier || 'professional',
      billing_period: billingPeriod || 'monthly',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Temporary, will be updated by subscription.created
      updated_at: new Date().toISOString()
    };

    if (existingSubscription) {
      // Update existing subscription
      await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id);
    } else {
      // Create new subscription
      await supabase
        .from('subscriptions')
        .insert([{ ...subscriptionData, created_at: new Date().toISOString() }]);
    }

    console.log('Subscription record updated for user:', userId);
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(subscription) {
  console.log('Processing customer.subscription.created:', subscription.id);

  try {
    // Get user ID from customer metadata
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata?.user_id;

    if (!userId) {
      console.error('No user_id in customer metadata');
      return;
    }

    // Update subscription with accurate period dates
    const { error } = await supabase
      .from('subscriptions')
      .update({
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        status: subscription.status,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription periods:', error);
    }
  } catch (error) {
    console.error('Error in subscription.created handler:', error);
  }
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('Processing customer.subscription.updated:', subscription.id);

  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription:', error);
    } else {
      console.log('Subscription updated:', subscription.id);
    }
  } catch (error) {
    console.error('Error in subscription.updated handler:', error);
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('Processing customer.subscription.deleted:', subscription.id);

  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error canceling subscription:', error);
    } else {
      console.log('Subscription canceled:', subscription.id);
    }
  } catch (error) {
    console.error('Error in subscription.deleted handler:', error);
  }
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Processing invoice.payment_succeeded:', invoice.id);

  try {
    // Record successful payment
    const { error } = await supabase
      .from('invoices')
      .insert([{
        stripe_invoice_id: invoice.id,
        stripe_customer_id: invoice.customer,
        stripe_subscription_id: invoice.subscription,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'paid',
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error recording invoice:', error);
    } else {
      console.log('Invoice recorded:', invoice.id);
    }
  } catch (error) {
    console.error('Error in invoice.payment_succeeded handler:', error);
  }
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice) {
  console.log('Processing invoice.payment_failed:', invoice.id);

  try {
    // Record failed payment
    const { error } = await supabase
      .from('invoices')
      .insert([{
        stripe_invoice_id: invoice.id,
        stripe_customer_id: invoice.customer,
        stripe_subscription_id: invoice.subscription,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'payment_failed',
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error recording failed invoice:', error);
    }

    // TODO: Send email notification to user about failed payment
    console.log('Payment failed for invoice:', invoice.id);
  } catch (error) {
    console.error('Error in invoice.payment_failed handler:', error);
  }
}
