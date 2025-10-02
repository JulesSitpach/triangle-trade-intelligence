import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SubscriptionManagement() {
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription/current');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subscription');
      }

      setSubscription(data.subscription);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (immediate = false) => {
    try {
      setActionLoading('cancel');
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      alert(data.message);
      setShowCancelModal(false);
      await fetchSubscription();
    } catch (err) {
      console.error('Error canceling subscription:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async () => {
    try {
      setActionLoading('reactivate');
      const response = await fetch('/api/subscription/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate subscription');
      }

      alert(data.message);
      await fetchSubscription();
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSubscription = async () => {
    if (!selectedTier) return;

    try {
      setActionLoading('update');
      const response = await fetch('/api/subscription/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: selectedTier })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription');
      }

      alert(data.message);
      setShowUpgradeModal(false);
      await fetchSubscription();
    } catch (err) {
      console.error('Error updating subscription:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
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
      enterprise: 'Enterprise'
    };
    return names[tier] || tier;
  };

  const getBillingDisplayName = (period) => {
    const names = {
      monthly: 'Monthly',
      annual: 'Annual'
    };
    return names[period] || period;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'status-active',
      canceled: 'status-canceled',
      past_due: 'status-warning',
      unpaid: 'status-warning',
      trialing: 'status-trial'
    };
    return colors[status] || 'status-default';
  };

  return (
    <>
      <Head>
        <title>Subscription Management | TradeFlow Intelligence</title>
        <meta name="description" content="Manage your subscription and billing" />
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
          <div className="nav-menu">
            <Link href="/dashboard" className="nav-menu-link">Dashboard</Link>
            <Link href="/account/subscription" className="nav-menu-link">Subscription</Link>
          </div>
        </div>
      </nav>

      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">Subscription Management</h1>
            <p className="section-header-subtitle">
              Manage your plan, billing, and payment settings
            </p>
          </div>

          {loading ? (
            <div className="content-card">
              <p className="text-body">Loading subscription details...</p>
            </div>
          ) : error ? (
            <div className="content-card">
              <h3 className="content-card-title">Error Loading Subscription</h3>
              <p className="content-card-description">{error}</p>
              <button onClick={fetchSubscription} className="btn-primary">
                Retry
              </button>
            </div>
          ) : !subscription ? (
            <div className="content-card">
              <h3 className="content-card-title">No Active Subscription</h3>
              <p className="content-card-description">
                You don't have an active subscription. Subscribe to access premium features.
              </p>
              <div className="hero-button-group">
                <Link href="/pricing" className="hero-primary-button">
                  View Plans
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Current Subscription */}
              <div className="content-card">
                <h2 className="content-card-title">Current Subscription</h2>

                <div className="subscription-details">
                  <div className="detail-row">
                    <span className="detail-label">Plan:</span>
                    <span className="detail-value">
                      {getTierDisplayName(subscription.tier)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Billing:</span>
                    <span className="detail-value">
                      {getBillingDisplayName(subscription.billing_period)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value ${getStatusColor(subscription.status)}`}>
                      {subscription.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Current Period:</span>
                    <span className="detail-value">
                      {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                    </span>
                  </div>

                  {subscription.cancel_at_period_end && (
                    <div className="detail-row warning">
                      <span className="detail-label">⚠️ Scheduled Cancellation:</span>
                      <span className="detail-value">
                        Your subscription will end on {formatDate(subscription.current_period_end)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="grid-2-cols">
                {/* Change Plan */}
                <div className="content-card">
                  <h3 className="content-card-title">Change Plan</h3>
                  <p className="content-card-description">
                    Upgrade or downgrade your subscription tier
                  </p>
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="btn-primary"
                    disabled={subscription.cancel_at_period_end}
                  >
                    Change Plan
                  </button>
                </div>

                {/* Cancel or Reactivate */}
                <div className="content-card">
                  <h3 className="content-card-title">
                    {subscription.cancel_at_period_end ? 'Reactivate' : 'Cancel'} Subscription
                  </h3>
                  <p className="content-card-description">
                    {subscription.cancel_at_period_end
                      ? 'Resume your subscription and continue enjoying premium features'
                      : 'Cancel your subscription at the end of the billing period'}
                  </p>
                  {subscription.cancel_at_period_end ? (
                    <button
                      onClick={handleReactivate}
                      className="btn-primary"
                      disabled={actionLoading === 'reactivate'}
                    >
                      {actionLoading === 'reactivate' ? 'Processing...' : 'Reactivate Subscription'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="btn-secondary"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="content-card">
                <h3 className="content-card-title">More Options</h3>
                <div className="hero-button-group">
                  <Link href="/account/invoices" className="hero-secondary-button">
                    View Invoices
                  </Link>
                  <Link href="/account/payment-methods" className="hero-secondary-button">
                    Payment Methods
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="content-card-title">Cancel Subscription?</h3>
            <p className="content-card-description">
              Your subscription will remain active until {formatDate(subscription?.current_period_end)}.
              After that, you'll lose access to premium features.
            </p>
            <div className="hero-button-group">
              <button
                onClick={() => handleCancelSubscription(false)}
                className="btn-primary"
                disabled={actionLoading === 'cancel'}
              >
                {actionLoading === 'cancel' ? 'Processing...' : 'Cancel at Period End'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn-secondary"
              >
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade/Downgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="content-card-title">Change Subscription Plan</h3>
            <p className="content-card-description">
              Current plan: {getTierDisplayName(subscription?.tier)}
            </p>

            <div className="plan-selector">
              <button
                onClick={() => setSelectedTier('professional')}
                className={selectedTier === 'professional' ? 'plan-option selected' : 'plan-option'}
                disabled={subscription?.tier === 'professional'}
              >
                Professional - $99/month
                {subscription?.tier === 'professional' && ' (Current)'}
              </button>
              <button
                onClick={() => setSelectedTier('business')}
                className={selectedTier === 'business' ? 'plan-option selected' : 'plan-option'}
                disabled={subscription?.tier === 'business'}
              >
                Business - $299/month
                {subscription?.tier === 'business' && ' (Current)'}
              </button>
              <button
                onClick={() => setSelectedTier('enterprise')}
                className={selectedTier === 'enterprise' ? 'plan-option selected' : 'plan-option'}
                disabled={subscription?.tier === 'enterprise'}
              >
                Enterprise - $599/month
                {subscription?.tier === 'enterprise' && ' (Current)'}
              </button>
            </div>

            <div className="hero-button-group">
              <button
                onClick={handleUpdateSubscription}
                className="btn-primary"
                disabled={!selectedTier || actionLoading === 'update'}
              >
                {actionLoading === 'update' ? 'Processing...' : 'Update Plan'}
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
