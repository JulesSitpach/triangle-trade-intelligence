import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function SubscriptionSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session_id) {
      // Verify the session and get subscription details
      fetch(`/api/stripe/verify-session?session_id=${session_id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSessionData(data.session);
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
  }, [session_id]);

  return (
    <>
      <Head>
        <title>Subscription Successful | TradeFlow Intelligence</title>
        <meta name="description" content="Your subscription has been successfully activated" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Fixed Navigation */}
      <nav className="nav-fixed">
        <div className="nav-container">
          <Link href="/" className="nav-logo-link">
            <div className="nav-logo-icon">T</div>
            <div>
              <div className="nav-logo-text">TradeFlow Intelligence</div>
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
                  Welcome to TradeFlow Intelligence. Your subscription is now active.
                </p>

                <div className="content-card">
                  <h2 className="content-card-title">What's Next?</h2>
                  <div>
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
                      ✓ Explore professional services for expert support
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
                  <Link href="/usmca-workflow" className="hero-secondary-button">
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
              © 2024 TradeFlow Intelligence. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
