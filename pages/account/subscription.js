import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TriangleLayout from '../../components/TriangleLayout';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';
import { SUBSCRIPTION_TIERS, TIER_LIMITS } from '../../config/subscription-limits';
import { logDevIssue, DevIssue } from '../../lib/utils/logDevIssue.js';

export default function SubscriptionManagement() {
  const { user } = useSimpleAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTier, setProcessingTier] = useState(null); // Track which tier is being processed
  const [hasStripeSubscription, setHasStripeSubscription] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/account/subscription');
      return;
    }

    // Check if user has an active Stripe subscription
    checkStripeSubscription();
  }, [user, router]);

  const checkStripeSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/check-subscription', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setHasStripeSubscription(data.hasSubscription);
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TriangleLayout>
        <div className="main-content">
          <div className="container-app">
            <div className="hero-badge">Loading subscription details...</div>
          </div>
        </div>
      </TriangleLayout>
    );
  }

  const currentTier = user?.subscription_tier || 'Trial';
  const tierLimits = TIER_LIMITS[currentTier] || TIER_LIMITS[SUBSCRIPTION_TIERS.FREE_TRIAL];

  // Define all available tiers with Stripe Price IDs
  const availableTiers = [
    {
      name: 'Trial',
      tier: SUBSCRIPTION_TIERS.FREE_TRIAL,
      price: '$0',
      priceId: null, // No Stripe price for trial
      features: [
        '7-day free trial',
        '1 USMCA analysis',
        '3 components max',
        'Certificate preview only',
        'View crisis alerts'
      ],
      disabled: currentTier === 'Trial'
    },
    {
      name: 'Starter',
      tier: SUBSCRIPTION_TIERS.STARTER,
      price: '$99',
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY || 'price_1SJNzrH7Z3LOEdfVM1NctBEL',
      features: [
        '10 analyses per month',
        '10 components per analysis',
        'Full certificate download',
        'Email alerts (high/critical)',
        'Trade health check'
      ],
      disabled: currentTier === 'Starter'
    },
    {
      name: 'Professional',
      tier: SUBSCRIPTION_TIERS.PROFESSIONAL,
      price: '$299',
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY || 'price_1SJO4YH7Z3LOEdfV6K7m1m5E',
      features: [
        '100 analyses per month',
        '25 components per analysis',
        '15% service discounts',
        'All email alerts',
        'Priority support (48hr)',
        'Supplier discovery'
      ],
      popular: true,
      disabled: currentTier === 'Professional'
    },
    {
      name: 'Premium',
      tier: SUBSCRIPTION_TIERS.PREMIUM,
      price: '$599',
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY || 'price_1SJO74H7Z3LOEdfV04EZveFT',
      features: [
        'Unlimited analyses',
        'Unlimited components',
        '25% service discounts',
        'Quarterly strategy calls',
        'Priority support (24hr)',
        'Custom intelligence reports'
      ],
      disabled: currentTier === 'Premium'
    }
  ];

  const handleTierChange = async (priceId, tierName) => {
    setIsProcessing(true);
    setProcessingTier(tierName); // Mark this specific tier as processing

    try {
      // Determine if it's an upgrade or downgrade
      const tierHierarchy = { 'Trial': 0, 'Starter': 1, 'Professional': 2, 'Premium': 3 };
      const currentTierLevel = tierHierarchy[currentTier] || 0;
      const targetTierLevel = tierHierarchy[tierName] || 0;
      const isUpgrade = targetTierLevel > currentTierLevel;

      console.log(`🔄 ${isUpgrade ? 'Upgrading' : 'Downgrading'} to ${tierName}...`);

      // If no existing Stripe subscription, always use checkout
      if (!hasStripeSubscription) {
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            priceId: priceId,
            tier: tierName.toLowerCase(),
            billing_period: 'monthly'
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create checkout session');
        }

        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } else {
        // Existing subscriber - use update endpoint (immediate change with proration)
        const response = await fetch('/api/stripe/update-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            priceId: priceId,
            tier: tierName.toLowerCase()
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update subscription');
        }

        const data = await response.json();
        console.log('✅ Subscription updated:', data);

        // Refresh the page to show updated tier
        alert(`Successfully ${isUpgrade ? 'upgraded' : 'downgraded'} to ${tierName}!`);
        window.location.reload();
      }

    } catch (error) {
      console.error('❌ Tier change error:', error);
      await DevIssue.apiError('subscription_page', '/api/stripe/tier-change', error, {
        tier: tierName,
        priceId: priceId,
        currentTier
      });
      alert(`Failed to change plan: ${error.message}`);
      setIsProcessing(false);
      setProcessingTier(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      console.log('🔄 Opening Stripe Customer Portal...');
      setIsProcessing(true);

      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to open customer portal');
      }

      const data = await response.json();
      console.log('✅ Portal session created, redirecting...');

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }

    } catch (error) {
      console.error('❌ Portal error:', error);
      await DevIssue.apiError('subscription_page', '/api/stripe/create-portal-session', error, {
        currentTier
      });
      alert(`Failed to open customer portal: ${error.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Head>
        <title>Subscription & Billing - Triangle Trade Intelligence</title>
        <meta name="description" content="Manage your subscription and billing" />
      </Head>

      <TriangleLayout>
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1 className="dashboard-title">💳 Subscription & Billing</h1>
            <p className="dashboard-subtitle">Manage your plan, upgrade, or cancel your subscription</p>
          </div>

          {/* Current Plan */}
          <div className="form-section">
            <h2 className="form-section-title">Current Plan: {tierLimits.tier_label}</h2>
            <p className="text-body">
              {currentTier === 'Trial' ? (
                <>7-day free trial • No credit card required</>
              ) : (
                <>Monthly subscription • {tierLimits.monthly_price ? `$${tierLimits.monthly_price}/mo` : 'Custom pricing'}</>
              )}
            </p>

            <div className="service-request-card border-left-green">
              <div className="text-bold">Your Benefits:</div>
              <ul className="list-simple">
                {tierLimits.analyses_per_month === null ? (
                  <li>✓ Unlimited USMCA analyses</li>
                ) : (
                  <li>✓ {tierLimits.analyses_per_month || tierLimits.analyses_total} analysis{(tierLimits.analyses_per_month || tierLimits.analyses_total) > 1 ? 'es' : ''} {tierLimits.analyses_per_month ? 'per month' : 'total'}</li>
                )}
                {tierLimits.components_per_analysis === null ? (
                  <li>✓ Unlimited components per analysis</li>
                ) : (
                  <li>✓ Up to {tierLimits.components_per_analysis} components per analysis</li>
                )}
                {tierLimits.certificate_download && <li>✓ Full certificate download</li>}
                {tierLimits.email_notifications && <li>✓ Email crisis alerts</li>}
                {tierLimits.service_discounts > 0 && <li>✓ {Math.round(tierLimits.service_discounts * 100)}% off professional services</li>}
                {tierLimits.priority_support && <li>✓ Priority support ({tierLimits.support_response_hours}hr response)</li>}
                {tierLimits.quarterly_strategy_calls && <li>✓ Quarterly strategy calls with experts</li>}
              </ul>
            </div>
          </div>

          {/* All Available Plans */}
          <div className="form-section">
            <h2 className="form-section-title">
              {currentTier === 'Trial' ? 'Subscribe to Continue' : 'All Available Plans'}
            </h2>
            <p className="form-section-description">
              {currentTier === 'Trial'
                ? 'Choose a plan to continue analyzing after your 7-day trial'
                : 'Compare plans and change your subscription anytime'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
              {availableTiers.map((tier) => (
                <div
                  key={tier.tier}
                  className={`service-request-card ${tier.disabled ? 'border-left-blue' : tier.popular ? 'border-left-green' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  <div className="text-bold">
                    {tier.name}
                    {tier.disabled && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#3b82f6' }}>✓ Current</span>}
                    {tier.popular && !tier.disabled && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#16a34a' }}>⭐ Popular</span>}
                  </div>
                  <div className="text-body" style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                    {tier.price}<span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/mo</span>
                  </div>
                  <ul className="list-simple" style={{ flexGrow: 1 }}>
                    {tier.features.map((feature, i) => (
                      <li key={i}>✓ {feature}</li>
                    ))}
                  </ul>
                  <div className="action-buttons">
                    {tier.disabled ? (
                      <button disabled style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        cursor: 'not-allowed',
                        opacity: '0.8'
                      }}>
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTierChange(tier.priceId, tier.name)}
                        disabled={isProcessing}
                        className="btn-primary"
                      >
                        {processingTier === tier.name ? 'Processing...' : `Switch to ${tier.name}`}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cancel Subscription (for paid users) */}
          {currentTier !== 'Trial' && (
            <div className="form-section">
              <div className="service-request-card border-left-red">
                <div className="text-bold">Cancel Subscription</div>
                <p className="text-body">
                  Cancel your subscription at any time. You'll retain access until the end of your current billing period.
                </p>
                <div className="action-buttons">
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel your subscription?\n\nYou will lose access to:\n• Unlimited analyses\n• Service discounts\n• Priority support\n• All premium features\n\nYour subscription will remain active until the end of your current billing period.')) {
                        handleManageSubscription();
                      }
                    }}
                    disabled={isProcessing}
                    className="btn-delete"
                  >
                    {isProcessing ? 'Processing...' : '⚠️ Cancel Subscription'}
                  </button>
                </div>
                <p className="text-body" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  Need to update payment method or view billing history?{' '}
                  <button
                    onClick={handleManageSubscription}
                    disabled={isProcessing}
                    className="nav-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Open billing portal →
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </TriangleLayout>
    </>
  );
}
