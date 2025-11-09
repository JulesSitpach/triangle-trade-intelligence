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

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
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

    // === PREVENT MULTIPLE SUBSCRIPTIONS: Cancel any existing active subscriptions ===
    // 🔧 FIX (Nov 9, 2025): Query Stripe API directly (subscriptions table doesn't exist)
    try {
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: session.customer,
        status: 'active',
        limit: 100
      });

      if (existingSubscriptions.data.length > 0) {
        console.log(`⚠️ Found ${existingSubscriptions.data.length} active subscription(s) for customer ${session.customer}`);

        for (const oldSub of existingSubscriptions.data) {
          // Don't cancel the subscription we just created
          if (oldSub.id === session.subscription) {
            console.log(`✅ Keeping new subscription: ${oldSub.id}`);
            continue;
          }

          try {
            // Cancel old subscription immediately (not at period end)
            await stripe.subscriptions.cancel(oldSub.id);
            console.log(`✅ Canceled old subscription: ${oldSub.id}`);
          } catch (cancelError) {
            console.error(`❌ Failed to cancel old subscription ${oldSub.id}:`, cancelError.message);
            await logDevIssue({
              type: 'api_error',
              severity: 'critical',
              component: 'stripe_webhook',
              message: 'Failed to cancel old subscription during upgrade - USER BEING DOUBLE-BILLED',
              data: {
                userId,
                oldSubscriptionId: oldSub.id,
                newSubscriptionId: session.subscription,
                customerId: session.customer,
                error: cancelError.message
              }
            });
          }
        }
      }
    } catch (stripeError) {
      console.error(`❌ Failed to query Stripe for existing subscriptions:`, stripeError.message);
      await logDevIssue({
        type: 'api_error',
        severity: 'critical',
        component: 'stripe_webhook',
        message: 'Failed to query Stripe subscriptions - potential double billing',
        data: {
          userId,
          customerId: session.customer,
          error: stripeError.message
        }
      });
    }

    // 🚨 CRITICAL: Update user_profiles.subscription_tier to match
    // Without this, users pay but stay on Trial tier!
    // ✅ NEW (Nov 8, 2025): Set 30-day rolling period dates (not calendar month)
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30); // 30 days from now

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        subscription_tier: tierName,
        status: 'active',
        stripe_customer_id: session.customer,
        subscription_period_start: now.toISOString(),
        subscription_period_end: periodEnd.toISOString()
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
 * 🔧 SIMPLIFIED (Nov 9, 2025): No subscriptions table - Stripe is source of truth
 */
async function handleSubscriptionCreated(subscription) {
  console.log('Processing customer.subscription.created:', subscription.id);

  // Just log the event - user_profiles.subscription_tier already updated in handleSubscriptionPurchase
  console.log(`✅ Subscription created: ${subscription.id} (status: ${subscription.status})`);
  console.log(`   Period: ${new Date(subscription.current_period_start * 1000).toISOString()} → ${new Date(subscription.current_period_end * 1000).toISOString()}`);
}

/**
 * Handle customer.subscription.updated event
 * 🔧 SIMPLIFIED (Nov 9, 2025): Update user_profiles.subscription_period dates on renewal
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('Processing customer.subscription.updated:', subscription.id);

  try {
    // Get user_id from customer metadata
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata?.user_id;

    if (!userId) {
      console.warn(`⚠️ No user_id in customer metadata for subscription ${subscription.id}`);
      return;
    }

    console.log(`✅ Subscription updated: ${subscription.id} (status: ${subscription.status})`);

    // Update user_profiles with new billing period dates (for renewals)
    const periodStart = new Date(subscription.current_period_start * 1000);
    const periodEnd = new Date(subscription.current_period_end * 1000);

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        subscription_period_start: periodStart.toISOString(),
        subscription_period_end: periodEnd.toISOString(),
        status: subscription.status === 'active' ? 'active' : subscription.status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (profileError) {
      await logDevIssue({
        type: 'api_error',
        severity: 'high',
        component: 'stripe_webhook',
        message: 'Failed to update user_profiles subscription period on renewal',
        data: {
          userId,
          subscriptionId: subscription.id,
          error: profileError.message
        }
      });
      console.error('❌ Failed to update user profile period:', profileError);
    } else {
      console.log(`✅ User profile period updated for user ${userId}`);
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
 * 🔧 SIMPLIFIED (Nov 9, 2025): Query Stripe for remaining active subscriptions
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('Processing customer.subscription.deleted:', subscription.id);

  try {
    // Get user_id from customer metadata
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata?.user_id;

    if (!userId) {
      console.warn('⚠️ No user_id in customer metadata - cannot update user profile');
      return;
    }

    console.log(`✅ Subscription canceled: ${subscription.id}`);

    // Check if user has any OTHER active subscriptions in Stripe
    const remainingSubscriptions = await stripe.subscriptions.list({
      customer: subscription.customer,
      status: 'active',
      limit: 100
    });

    if (remainingSubscriptions.data.length === 0) {
      // No active subscriptions left - downgrade to trial_expired
      console.log(`⬇️ No active subscriptions remaining for user ${userId} - setting to trial_expired`);

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          subscription_tier: 'Trial',
          status: 'trial_expired', // Read-only: can view past work, cannot create new
          trial_ends_at: new Date().toISOString(), // Set to now (expired)
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (profileError) {
        await logDevIssue({
          type: 'api_error',
          severity: 'critical',
          component: 'stripe_webhook',
          message: 'CRITICAL: Failed to downgrade user after subscription cancellation',
          data: {
            userId,
            subscriptionId: subscription.id,
            error: profileError.message
          }
        });
        console.error('❌ Failed to update user status:', profileError);
      } else {
        console.log('✅ User downgraded to trial_expired (read-only access)');
      }
    } else {
      // User still has other active subscriptions
      console.log(`✅ User ${userId} still has ${remainingSubscriptions.data.length} active subscription(s) - no downgrade needed`);
    }

  } catch (error) {
    await logDevIssue({
      type: 'api_error',
      severity: 'high',
      component: 'stripe_webhook',
      message: 'Error in subscription.deleted handler',
      data: {
        subscriptionId: subscription.id,
        error: error.message,
        stack: error.stack
      }
    });
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

/**
 * Handle charge.refunded event
 * Revoke certificates when user receives refund to prevent abuse
 */
async function handleChargeRefunded(charge) {
  console.log('Processing charge.refunded:', charge.id);

  try {
    // Get customer and user_id
    const customer = await stripe.customers.retrieve(charge.customer);
    const userId = customer.metadata?.user_id;

    if (!userId) {
      await logDevIssue({
        type: 'missing_data',
        severity: 'high',
        component: 'stripe_webhook',
        message: 'No user_id in customer metadata for refunded charge - cannot revoke certificates',
        data: {
          chargeId: charge.id,
          customerId: charge.customer,
          amount: charge.amount / 100,
          currency: charge.currency
        }
      });
      console.warn('No user_id in customer metadata for refunded charge');
      return;
    }

    // Mark certificates created after charge as revoked
    const chargeCreatedAt = new Date(charge.created * 1000);

    const { data: revokedCerts, error } = await supabase
      .from('workflow_completions')
      .update({
        certificate_status: 'revoked_refund',
        download_disabled: true,
        revoked_at: new Date().toISOString(),
        revoked_reason: `Stripe charge ${charge.id} refunded - ${charge.amount / 100} ${charge.currency.toUpperCase()}`
      })
      .eq('user_id', userId)
      .gte('created_at', chargeCreatedAt.toISOString())
      .is('certificate_status', null) // Only revoke certificates that haven't been revoked before
      .select();

    if (error) {
      throw error;
    }

    console.log(`✅ Revoked ${revokedCerts?.length || 0} certificates for user ${userId} due to refund`);

    // Log security event for tracking
    await DevIssue.securityEvent('stripe_webhook', 'charge_refunded', {
      userId,
      chargeId: charge.id,
      amount: charge.amount / 100,
      currency: charge.currency,
      certificatesRevoked: revokedCerts?.length || 0,
      refundReason: charge.refunds?.data?.[0]?.reason || 'unknown'
    });

    // Update user profile to flag refund abuse if multiple refunds
    const { data: previousRefunds } = await supabase
      .from('webhook_events')
      .select('event_id')
      .eq('event_type', 'charge.refunded')
      .like('payload', `%${userId}%`);

    if (previousRefunds && previousRefunds.length >= 2) {
      await DevIssue.securityEvent('stripe_webhook', 'multiple_refunds_detected', {
        userId,
        refundCount: previousRefunds.length + 1,
        severity: 'high',
        message: 'User has requested multiple refunds - possible abuse pattern'
      });
    }

  } catch (error) {
    await logDevIssue({
      type: 'api_error',
      severity: 'high',
      component: 'stripe_webhook',
      message: 'Failed to revoke certificates after refund - SECURITY RISK',
      data: {
        chargeId: charge.id,
        error: error.message,
        stack: error.stack
      }
    });
    console.error('Error handling charge.refunded:', error);
  }
}
