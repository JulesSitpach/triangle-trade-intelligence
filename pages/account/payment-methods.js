import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function AddPaymentMethodForm({ onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create setup intent
      const response = await fetch('/api/payment-methods/create-setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create setup intent');
      }

      // Confirm card setup
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        data.client_secret,
        {
          payment_method: {
            card: elements.getElement(CardElement)
          }
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      alert('Payment method added successfully!');
      onSuccess();
    } catch (err) {
      console.error('Error adding payment method:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-method-form">
      <div className="card-element-container">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4'
                }
              },
              invalid: {
                color: '#9e2146'
              }
            }
          }}
        />
      </div>

      {error && (
        <p className="error-message">{error}</p>
      )}

      <div className="hero-button-group">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="btn-primary"
        >
          {loading ? 'Adding...' : 'Add Payment Method'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payment-methods/list');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment methods');
      }

      setPaymentMethods(data.payment_methods || []);
      setDefaultPaymentMethod(data.default_payment_method);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId) => {
    try {
      setActionLoading(paymentMethodId);
      const response = await fetch('/api/payment-methods/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method_id: paymentMethodId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set default payment method');
      }

      alert(data.message);
      await fetchPaymentMethods();
    } catch (err) {
      console.error('Error setting default:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (paymentMethodId) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      setActionLoading(paymentMethodId);
      const response = await fetch('/api/payment-methods/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method_id: paymentMethodId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove payment method');
      }

      alert(data.message);
      await fetchPaymentMethods();
    } catch (err) {
      console.error('Error removing payment method:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getCardBrandIcon = (brand) => {
    const icons = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳'
    };
    return icons[brand?.toLowerCase()] || '💳';
  };

  return (
    <>
      <Head>
        <title>Payment Methods | TradeFlow Intelligence</title>
        <meta name="description" content="Manage your payment methods" />
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
            <Link href="/account/payment-methods" className="nav-menu-link">Payment Methods</Link>
          </div>
        </div>
      </nav>

      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">Payment Methods</h1>
            <p className="section-header-subtitle">
              Manage your saved payment methods
            </p>
          </div>

          {loading ? (
            <div className="content-card">
              <p className="text-body">Loading payment methods...</p>
            </div>
          ) : error ? (
            <div className="content-card">
              <h3 className="content-card-title">Error Loading Payment Methods</h3>
              <p className="content-card-description">{error}</p>
              <button onClick={fetchPaymentMethods} className="btn-primary">
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Add New Payment Method */}
              {showAddForm ? (
                <div className="content-card">
                  <h2 className="content-card-title">Add New Payment Method</h2>
                  <Elements stripe={stripePromise}>
                    <AddPaymentMethodForm
                      onSuccess={() => {
                        setShowAddForm(false);
                        fetchPaymentMethods();
                      }}
                      onCancel={() => setShowAddForm(false)}
                    />
                  </Elements>
                </div>
              ) : (
                <div className="content-card">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="btn-primary"
                  >
                    + Add Payment Method
                  </button>
                </div>
              )}

              {/* Payment Methods List */}
              {paymentMethods.length === 0 ? (
                <div className="content-card">
                  <h3 className="content-card-title">No Payment Methods</h3>
                  <p className="content-card-description">
                    Add a payment method to manage your subscription billing.
                  </p>
                </div>
              ) : (
                <div className="content-card">
                  <h2 className="content-card-title">Your Payment Methods</h2>

                  <div className="payment-methods-list">
                    {paymentMethods.map((pm) => (
                      <div key={pm.id} className="payment-method-item">
                        <div className="payment-method-info">
                          <span className="card-icon">
                            {getCardBrandIcon(pm.card.brand)}
                          </span>
                          <div className="card-details">
                            <span className="card-brand">
                              {pm.card.brand.toUpperCase()}
                            </span>
                            <span className="card-number">
                              •••• {pm.card.last4}
                            </span>
                            <span className="card-expiry">
                              Expires {pm.card.exp_month}/{pm.card.exp_year}
                            </span>
                          </div>
                          {pm.is_default && (
                            <span className="default-badge">Default</span>
                          )}
                        </div>

                        <div className="payment-method-actions">
                          {!pm.is_default && (
                            <button
                              onClick={() => handleSetDefault(pm.id)}
                              disabled={actionLoading === pm.id}
                              className="btn-secondary"
                            >
                              {actionLoading === pm.id ? 'Setting...' : 'Set Default'}
                            </button>
                          )}
                          <button
                            onClick={() => handleRemove(pm.id)}
                            disabled={actionLoading === pm.id}
                            className="btn-secondary"
                          >
                            {actionLoading === pm.id ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Back to Subscription */}
              <div className="content-card">
                <div className="hero-button-group">
                  <Link href="/account/subscription" className="hero-secondary-button">
                    Back to Subscription
                  </Link>
                </div>
              </div>
            </>
          )}
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
