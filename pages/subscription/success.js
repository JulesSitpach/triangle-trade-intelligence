import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';

export default function SubscriptionSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  const { refreshUser } = useSimpleAuth();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  useEffect(() => {
    if (session_id) {
      // Verify the session and get subscription details
      fetch(`/api/stripe/verify-session?session_id=${session_id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSessionData(data.session);

            // 🚨 CRITICAL: Refresh user context to get updated subscription tier
            // This ensures dashboard shows "Starter" instead of cached "Trial"
            refreshUser().then(() => {
              console.log('✅ User context refreshed with new subscription tier');
            });

            // Countdown timer before redirect
            const countdownInterval = setInterval(() => {
              setRedirectCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(countdownInterval);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);

            // Auto-redirect to dashboard after 3 seconds
            // SimpleAuthContext now has fresh data with "Starter" tier
            setTimeout(() => {
              router.push('/dashboard');
            }, 3000);
          } else {
            setError(data.error || 'Failed to verify session');
          }
        })
        .catch(err => {
          console.error('Error verifying session:', err);
          setError('Failed to load subscription details');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [session_id, router]);

  return (
    <>
      <Head>
        <title>Subscription Successful | Triangle Trade Intelligence</title>
        <meta name="description" content="Your subscription has been successfully activated" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Fixed Navigation */}
      <nav className="nav-fixed">
        <div className="nav-container">
          <Link href="/" className="nav-logo-link">
            <div className="nav-logo-icon">T</div>
            <div>
              <div className="nav-logo-text">Triangle Trade Intelligence</div>
              <div className="nav-logo-subtitle">USMCA Compliance Platform</div>
            </div>
          </Link>
        </div>
      </nav>

      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            {loading ? (
              <>
                <h1 className="section-header-title">Verifying Subscription...</h1>
                <p className="section-header-subtitle">Please wait while we confirm your payment</p>
              </>
            ) : error ? (
              <>
                <h1 className="section-header-title">Verification Error</h1>
                <p className="section-header-subtitle">{error}</p>
                <div className="hero-button-group">
                  <Link href="/pricing" className="hero-primary-button">
                    Back to Pricing
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="success-icon">✓</div>
                <h1 className="section-header-title">Subscription Successful!</h1>
                <p className="section-header-subtitle">
                  Welcome to Triangle Trade Intelligence. Your subscription is now active.
                </p>

                <div className="content-card" style={{backgroundColor: '#E3F2FD', border: '2px solid #2196F3'}}>
                  <h2 className="content-card-title" style={{color: '#1565C0'}}>
                    🎉 Redirecting to Dashboard in {redirectCountdown} seconds...
                  </h2>
                  <div>
                    <p className="text-body">
                      Your subscription is now active! You'll be automatically redirected to your dashboard where you can:
                    </p>
                    <p className="text-body">
                      ✓ Access your dashboard to start analyzing USMCA compliance
                    </p>
                    <p className="text-body">
                      ✓ Run your first product analysis and see potential savings
                    </p>
                    <p className="text-body">
                      ✓ Set up trade alerts for your products
                    </p>
                    <p className="text-body">
                      ✓ Explore professional services for expert support (with subscriber discounts)
                    </p>
                  </div>
                </div>

                {sessionData && (
                  <div className="content-card">
                    <h3 className="content-card-title">Subscription Details</h3>
                    <p className="text-body">Plan: {sessionData.plan || 'Professional'}</p>
                    <p className="text-body">
                      Billing: {sessionData.billing_period || 'Monthly'}
                    </p>
                    <p className="text-body">
                      A confirmation email has been sent to your email address.
                    </p>
                  </div>
                )}

                <div className="hero-button-group">
                  <Link href="/dashboard" className="hero-primary-button">
                    Go to Dashboard
                  </Link>
                  <Link href="/usmca-workflow" className="hero-primary-button">
                    Start Analysis
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="content-card">
        <div className="container-app">
          <div className="section-header">
            <p className="text-body">
              © 2024 Triangle Trade Intelligence. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
