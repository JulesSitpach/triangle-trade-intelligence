import { stripe } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';
import { sendCustomerConfirmationEmail, sendAdminNotificationEmail } from '../../../lib/services/email-service';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue';

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
    await logDevIssue({
      type: 'missing_data',
      severity: 'critical',
      component: 'stripe_webhook',
      message: 'Missing stripe-signature header in webhook request',
      data: { headers: req.headers }
    });
    console.error('Missing stripe-signature header');
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    await logDevIssue({
      type: 'missing_data',
      severity: 'critical',
      component: 'stripe_webhook',
      message: 'STRIPE_WEBHOOK_SECRET environment variable not configured',
      data: { environment: process.env.NODE_ENV }
    });
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
    await logDevIssue({
      type: 'validation_error',
      severity: 'critical',
      component: 'stripe_webhook',
      message: 'Webhook signature verification failed - possible security issue',
      data: {
        error: err.message,
        signature: sig?.substring(0, 20) + '...',
        bufferLength: buf?.length
      }
    });
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`Received Stripe webhook event: ${event.type} (ID: ${event.id})`);

  // IDEMPOTENCY CHECK: Prevent duplicate event processing
  try {
    const { data: existingEvent, error: checkError } = await supabase
      .from('webhook_events')
      .select('event_id, processed_at')
      .eq('event_id', event.id)
      .single();

    if (existingEvent) {
      console.log(`⚠️ Webhook event ${event.id} already processed at ${existingEvent.processed_at} - skipping`);
      return res.status(200).json({
        received: true,
        message: 'Event already processed (idempotent)',
        event_id: event.id,
        processed_at: existingEvent.processed_at
      });
    }

    // Event not processed yet, record it
    const { error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        payload: event.data.object
      });

    if (insertError && insertError.code === '23505') {
      // Unique constraint violation - race condition, event was just processed
      console.log(`⚠️ Race condition: Event ${event.id} was processed by another instance - skipping`);
      return res.status(200).json({
        received: true,
        message: 'Event already processed (race condition)',
        event_id: event.id
      });
    }

    if (insertError) {
      throw insertError;
    }

    console.log(`✅ Event ${event.id} recorded for processing`);

  } catch (error) {
    console.error('Idempotency check error:', error);
    // Continue processing - don't block on idempotency errors
  }

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
    await logDevIssue({
      type: 'api_error',
      severity: 'critical',
      component: 'stripe_webhook',
      message: `Webhook handler failed for event type: ${event?.type || 'unknown'}`,
      data: {
        eventType: event?.type,
        eventId: event?.id,
        error: error.message,
        stack: error.stack
      }
    });
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
    await logDevIssue({
      type: 'missing_data',
      severity: 'critical',
      component: 'stripe_webhook',
      message: 'Missing user_id in checkout session metadata',
      data: {
        sessionId: session.id,
        metadata: session.metadata,
        mode: session.mode
      }
    });
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
 * Handle service payment completed and update service request
 */
async function handleServicePaymentCompleted(session) {
  const { user_id, service_id, service_name, service_request_id } = session.metadata;

  console.log(`Processing service payment: ${service_name} (request ${service_request_id})`);

  try {
    // Service request already exists from checkout creation
    // Update status from 'pending_payment' to 'pending' (awaiting expert)
    const { data: serviceRequest, error: updateError } = await supabase
      .from('service_requests')
      .update({
        status: 'pending', // Awaiting specialist action
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', service_request_id)
      .select()
      .single();

    if (updateError) {
      await logDevIssue({
        type: 'api_error',
        severity: 'critical',
        component: 'stripe_webhook',
        message: 'Failed to update service request after successful payment - FINANCIAL DATA MISMATCH',
        data: {
          service_request_id,
          sessionId: session.id,
          service_id,
          error: updateError.message,
          payment_intent: session.payment_intent
        }
      });
      console.error('Failed to update service request:', updateError);
      throw updateError;
    }

    console.log(`✅ Service request updated: ${serviceRequest.id} - Status: pending`);

    // Get customer email from service request
    const customerEmail = serviceRequest.subscriber_data?.contact_email || session.customer_email;
    const companyName = serviceRequest.company_name || serviceRequest.subscriber_data?.company_name;

    console.log(`📧 Customer email: ${customerEmail}`);
    console.log(`🏢 Company: ${companyName}`);

    // Send confirmation email to customer
    if (customerEmail) {
      await sendCustomerConfirmationEmail({
        customerEmail,
        companyName,
        serviceName: service_name,
        serviceType: service_id,
        price: serviceRequest.price,
        orderId: serviceRequest.id
      });
    }

    // Send notification to admin team (both Jorge and Cristina for all services)
    await sendAdminNotificationEmail({
      serviceName: service_name,
      serviceType: service_id,
      companyName,
      customerEmail,
      price: serviceRequest.price,
      orderId: serviceRequest.id,
      subscriberData: serviceRequest.subscriber_data
    });

  } catch (error) {
    await logDevIssue({
      type: 'api_error',
      severity: 'critical',
      component: 'stripe_webhook',
      message: 'Service payment processing failed after successful Stripe payment',
      data: {
        sessionId: session.id,
        service_id: session.metadata?.service_id,
        service_request_id: session.metadata?.service_request_id,
        error: error.message,
        stack: error.stack
      }
    });
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

  console.log(`Processing subscription purchase for user: ${userId}, tier: ${tier}`);

  try {
    // Get tier name for display (capitalize first letter)
    const tierName = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Professional';

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
      tier_id: tier || 'professional',           // ✅ FIXED: Use tier_id not tier
      tier_name: tierName,                       // ✅ FIXED: Use tier_name
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

    console.log('✅ Subscription record updated for user:', userId);

    // 🚨 CRITICAL FIX: Update user_profiles.subscription_tier to match
    // Without this, users pay but stay on Trial tier!
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        subscription_tier: tierName,
        status: 'active'
      })
      .eq('user_id', userId);

    if (profileError) {
      await logDevIssue({
        type: 'api_error',
        severity: 'critical',
        component: 'stripe_webhook',
        message: 'CRITICAL: Failed to update user_profiles.subscription_tier after payment',
        data: {
          userId,
          tier: tierName,
          sessionId: session.id,
          error: profileError.message
        }
      });
      console.error('💥 Failed to update user profile tier:', profileError);
      // Don't throw - subscription was saved, this is a secondary update
    } else {
      console.log('✅ User profile subscription_tier updated to:', tierName);
    }

  } catch (error) {
    await logDevIssue({
      type: 'api_error',
      severity: 'critical',
      component: 'stripe_webhook',
      message: 'Failed to save subscription to database after successful payment',
      data: {
        userId,
        sessionId: session.id,
        subscriptionId: session.subscription,
        tier: session.metadata?.tier,
        error: error.message
      }
    });
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
      await logDevIssue({
        type: 'missing_data',
        severity: 'high',
        component: 'stripe_webhook',
        message: 'Missing user_id in customer metadata for subscription.created',
        data: {
          subscriptionId: subscription.id,
          customerId: subscription.customer
        }
      });
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
      await logDevIssue({
        type: 'api_error',
        severity: 'high',
        component: 'stripe_webhook',
        message: 'Failed to update subscription periods in database',
        data: {
          subscriptionId: subscription.id,
          userId,
          error: error.message
        }
      });
      console.error('Error updating subscription periods:', error);
    }
  } catch (error) {
    await logDevIssue({
      type: 'api_error',
      severity: 'high',
      component: 'stripe_webhook',
      message: 'Error in subscription.created handler',
      data: {
        subscriptionId: subscription.id,
        error: error.message
      }
    });
    console.error('Error in subscription.created handler:', error);
  }
}

/**
 * Handle customer.subscription.updated event
 * CRITICAL: Also update user_profiles.subscription_tier when plan changes
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('Processing customer.subscription.updated:', subscription.id);

  try {
    // === STEP 1: Get user_id from customer metadata ===
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata?.user_id;

    if (!userId) {
      console.warn(`⚠️ No user_id in customer metadata for subscription ${subscription.id}`);
      // Still update subscription table, but can't update user_profiles without userId
    }

    // === STEP 2: Update subscriptions table with new periods and status ===
    const { data: updatedSub, error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)
      .select('tier_id')
      .single();

    if (subError) {
      console.error('Error updating subscription:', subError);
      return;
    }

    console.log('✅ Subscription updated:', subscription.id);

    // === STEP 3: If user_id found, update user_profiles.subscription_tier ===
    // This handles plan upgrades (e.g., Trial → Professional)
    if (userId && updatedSub?.tier_id) {
      const tierName = updatedSub.tier_id.charAt(0).toUpperCase() + updatedSub.tier_id.slice(1);

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          subscription_tier: tierName,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (profileError) {
        await logDevIssue({
          type: 'api_error',
          severity: 'high',
          component: 'stripe_webhook',
          message: 'Failed to update user_profiles.subscription_tier on plan change',
          data: {
            userId,
            subscriptionId: subscription.id,
            newTier: tierName,
            error: profileError.message
          }
        });
        console.error('❌ Failed to update user profile tier:', profileError);
      } else {
        console.log(`✅ User profile tier updated to ${tierName} for user ${userId}`);
      }
    }

  } catch (error) {
    await logDevIssue({
      type: 'api_error',
      severity: 'high',
      component: 'stripe_webhook',
      message: 'Error in subscription.updated handler',
      data: {
        subscriptionId: subscription.id,
        error: error.message,
        stack: error.stack
      }
    });
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

  // Log critical payment failure
  await logDevIssue({
    type: 'api_error',
    severity: 'critical',
    component: 'stripe_webhook',
    message: 'PAYMENT FAILED - Customer payment attempt failed',
    data: {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      attemptCount: invoice.attempt_count,
      nextPaymentAttempt: invoice.next_payment_attempt
    }
  });

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
      await logDevIssue({
        type: 'api_error',
        severity: 'critical',
        component: 'stripe_webhook',
        message: 'Failed to record failed invoice in database - FINANCIAL DATA LOSS RISK',
        data: {
          invoiceId: invoice.id,
          error: error.message
        }
      });
      console.error('Error recording failed invoice:', error);
    }

    // TODO: Send email notification to user about failed payment
    console.log('Payment failed for invoice:', invoice.id);
  } catch (error) {
    await logDevIssue({
      type: 'api_error',
      severity: 'critical',
      component: 'stripe_webhook',
      message: 'Error in invoice.payment_failed handler',
      data: {
        invoiceId: invoice.id,
        error: error.message
      }
    });
    console.error('Error in invoice.payment_failed handler:', error);
  }
}
