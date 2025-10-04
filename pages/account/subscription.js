import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TriangleLayout from '../../components/TriangleLayout';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';

export default function SubscriptionManagement() {
  const { user } = useSimpleAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchSubscriptionInfo();
  }, [user, router]);

  const fetchSubscriptionInfo = async () => {
    try {
      setLoading(true);

      // Fetch user profile which contains subscription tier info
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);

        // Set simple subscription info from profile
        setSubscription({
          tier: data.profile?.subscription_tier || 'Trial',
          status: data.profile?.subscription_status || 'active',
          trial_ends_at: data.profile?.trial_ends_at,
          subscription_ends_at: data.profile?.subscription_ends_at
        });
      } else {
        // Fallback to basic info from user object
        setSubscription({
          tier: 'Trial',
          status: 'active',
          trial_ends_at: null,
          subscription_ends_at: null
        });
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      // Use fallback subscription info
      setSubscription({
        tier: 'Trial',
        status: 'active',
        trial_ends_at: null,
        subscription_ends_at: null
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTierDisplayName = (tier) => {
    const names = {
      professional: 'Professional',
      business: 'Business',
      enterprise: 'Professional Plus'
    };
    return names[tier?.toLowerCase()] || tier || 'Professional';
  };

  const getPlanFeatures = (tier) => {
    const features = {
      trial: [
        '5 USMCA compliance analyses per month',
        'Basic certificate generation',
        'Email support',
        'Trade alerts',
        'Basic analytics'
      ],
      starter: [
        '10 USMCA compliance analyses per month',
        'Basic certificate generation',
        'Email support',
        'Trade alerts',
        'Basic analytics'
      ],
      professional: [
        'Unlimited USMCA compliance analyses',
        'Unlimited certificate generation',
        '15% discount on all professional services',
        'Priority email support (48hr response)',
        'Real-time crisis alerts',
        'Advanced trade policy analysis'
      ],
      premium: [
        'Everything in Professional',
        '25% discount on all professional services',
        'Quarterly 1-on-1 strategy calls with Jorge & Cristina',
        'Dedicated Slack/email support',
        'Custom trade intelligence reports',
        'Priority feature requests'
      ],
      business: [
        'Unlimited USMCA compliance analyses',
        'Unlimited certificate generation',
        'Dedicated account manager',
        'Real-time trade alerts',
        'Advanced analytics',
        'API access'
      ],
      enterprise: [
        'Everything in Business',
        'Custom compliance workflows',
        'White-label certificates',
        'Dedicated support team',
        'Custom integrations',
        'SLA guarantees'
      ]
    };
    return features[tier?.toLowerCase()] || features.trial || [];
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

  const currentTier = subscription?.tier?.toLowerCase() || 'trial';
  const isTrial = currentTier === 'trial';

  return (
    <>
      <Head>
        <title>Subscription & Billing - Triangle Trade Intelligence</title>
        <meta name="description" content="Manage your subscription and billing" />
      </Head>

      <TriangleLayout>
        <div className="main-content">
          <div className="container-app">
            <div className="section-header">
              <h1 className="section-title">Subscription & Billing</h1>
              <p className="text-body">
                Manage your plan and view available features
              </p>
            </div>

            {/* Current Plan */}
            <div className="card">
              <h2 className="card-title">Current Plan</h2>

              <div className="form-group">
                <label>Plan Type</label>
                <div className="text-body" style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '0.5rem' }}>
                  {getTierDisplayName(subscription?.tier)}
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <div className="text-body" style={{ color: subscription?.status === 'active' ? '#16a34a' : '#6b7280', marginTop: '0.5rem' }}>
                  {subscription?.status === 'active' ? '✓ Active' : subscription?.status}
                </div>
              </div>

              {isTrial && subscription?.trial_ends_at && (
                <div className="form-group">
                  <label>Trial Expires</label>
                  <div className="text-body" style={{ marginTop: '0.5rem' }}>
                    {formatDate(subscription.trial_ends_at)}
                  </div>
                </div>
              )}

              {!isTrial && subscription?.subscription_ends_at && (
                <div className="form-group">
                  <label>Subscription Renews</label>
                  <div className="text-body" style={{ marginTop: '0.5rem' }}>
                    {formatDate(subscription.subscription_ends_at)}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Plan Features</label>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  {getPlanFeatures(currentTier).map((feature, index) => (
                    <li key={index} className="text-body" style={{ marginBottom: '0.5rem' }}>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Upgrade Options */}
            {isTrial && (
              <div className="card" style={{ backgroundColor: '#f0fdf4', border: '1px solid #16a34a' }}>
                <h2 className="card-title">Upgrade Your Plan</h2>
                <p className="text-body" style={{ marginBottom: '1rem' }}>
                  Unlock unlimited USMCA compliance analyses, advanced analytics, and priority support
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="card">
                    <h3 className="card-title">Professional</h3>
                    <p className="text-body" style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0.5rem 0' }}>
                      $99<span style={{ fontSize: '1rem', fontWeight: '400' }}>/month</span>
                    </p>
                    <p className="text-body">
                      Perfect for growing businesses needing regular compliance analysis
                    </p>
                  </div>

                  <div className="card">
                    <h3 className="card-title">Business</h3>
                    <p className="text-body" style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0.5rem 0' }}>
                      $299<span style={{ fontSize: '1rem', fontWeight: '400' }}>/month</span>
                    </p>
                    <p className="text-body">
                      Unlimited analyses with API access and dedicated support
                    </p>
                  </div>

                  <div className="card">
                    <h3 className="card-title">Enterprise</h3>
                    <p className="text-body" style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0.5rem 0' }}>
                      $599<span style={{ fontSize: '1rem', fontWeight: '400' }}>/month</span>
                    </p>
                    <p className="text-body">
                      Custom workflows and white-label certificates for large organizations
                    </p>
                  </div>
                </div>

                <Link href="/pricing" className="btn-primary">
                  View Full Pricing Details
                </Link>
              </div>
            )}

            {/* Contact for Changes */}
            <div className="card">
              <h2 className="card-title">Need to Make Changes?</h2>
              <p className="text-body" style={{ marginBottom: '1rem' }}>
                To upgrade, downgrade, or cancel your subscription, please contact our support team.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a href="mailto:support@triangleintelligence.com" className="btn-primary">
                  Email Support
                </a>
                <Link href="/contact" className="btn-secondary">
                  Contact Form
                </Link>
              </div>
            </div>

            {/* Billing History Note */}
            <div className="card" style={{ backgroundColor: '#f9fafb' }}>
              <h2 className="card-title">Billing History</h2>
              <p className="text-body">
                For billing history and invoices, please contact support@triangleintelligence.com
              </p>
            </div>
          </div>
        </div>
      </TriangleLayout>
    </>
  );
}
