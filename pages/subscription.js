import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function SubscriptionManagement() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgradeLoading, setUpgradeLoading] = useState(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState('monthly')
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
        } else {
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (tier) => {
    try {
      setUpgradeLoading(tier)

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tier: tier.toLowerCase(),
          billing_period: billingPeriod
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Checkout URL not provided')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert(`Upgrade error: ${error.message}`)
    } finally {
      setUpgradeLoading(null)
    }
  }

  const handleManageBilling = async () => {
    try {
      setUpgradeLoading('manage')

      // Redirect to Stripe Customer Portal
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to access billing portal')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Billing portal error:', error)
      alert(`Unable to access billing portal: ${error.message}`)
    } finally {
      setUpgradeLoading(null)
    }
  }

  const plans = [
    {
      name: 'Starter',
      tier: 'starter',
      monthlyPrice: 99,
      annualPrice: 950,
      features: [
        '15 workflow analyses/month',
        '15 executive summaries/month',
        '30 portfolio briefings/month',
        '10 components per workflow',
        'Unlimited certificate downloads',
        'Daily crisis alert digest',
        'Email alert notifications'
      ],
      commitment: null
    },
    {
      name: 'Professional',
      tier: 'professional',
      monthlyPrice: 299,
      annualPrice: 2850,
      features: [
        '100 workflow analyses/month',
        '100 executive summaries/month',
        '150 portfolio briefings/month',
        '15 components per workflow',
        'Unlimited certificate downloads',
        'Daily crisis alert digest',
        'Email alert notifications'
      ],
      commitment: '30-day commitment',
      popular: true
    },
    {
      name: 'Premium',
      tier: 'premium',
      monthlyPrice: 599,
      annualPrice: 5750,
      features: [
        '500 workflow analyses/month',
        '500 executive summaries/month',
        '750 portfolio briefings/month',
        '20 components per workflow',
        'Unlimited certificate downloads',
        'Daily crisis alert digest',
        'Email alert notifications'
      ],
      commitment: '60-day commitment'
    }
  ]

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-app text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const currentTier = user?.subscription_tier || 'Trial'
  const isCurrentPlan = (tier) => currentTier.toLowerCase() === tier.toLowerCase()

  return (
    <>
      <Head>
        <title>Subscription Management | Triangle Trade Intelligence</title>
        <meta name="description" content="Manage your subscription and upgrade your plan" />
      </Head>

      <div className="main-content">
        {/* Header */}
        <nav className="nav-fixed">
          <div className="nav-container">
            <Link href="/dashboard" className="nav-logo-link">
              ← Back to Dashboard
            </Link>
            <div className="nav-menu">
              <span className="text-body">{user?.email}</span>
              <Link href="/dashboard" className="btn-primary">
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container-app">
          {/* Current Subscription */}
          <div className="content-card">
            <h2 className="content-card-title">
              Current Subscription
            </h2>
            <div className="dashboard-actions">
              <div>
                <p className="section-header-title">
                  {currentTier} Plan
                </p>
                {currentTier !== 'Trial' && (
                  <p className="section-header-subtitle">
                    ${plans.find(p => p.tier === currentTier.toLowerCase())?.monthlyPrice || 0}/month
                  </p>
                )}
              </div>
              {currentTier !== 'Trial' && (
                <button
                  onClick={handleManageBilling}
                  disabled={upgradeLoading === 'manage'}
                  className="btn-secondary"
                >
                  {upgradeLoading === 'manage' ? 'Loading...' : 'Manage Billing'}
                </button>
              )}
            </div>
          </div>

          {/* Billing Period Toggle */}
          <div className="hero-button-group">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={billingPeriod === 'monthly' ? 'btn-primary' : 'btn-secondary'}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={billingPeriod === 'annual' ? 'btn-primary' : 'btn-secondary'}
            >
              Annual (Save ~15%)
            </button>
          </div>

          {/* Upgrade Options */}
          <div className="section-header">
            <h2 className="section-header-title text-center">
              {currentTier === 'Trial' ? 'Choose Your Plan' : 'Upgrade Your Plan'}
            </h2>

            <div className="pricing-cards-grid">
              {plans.map((plan) => {
                const isCurrent = isCurrentPlan(plan.tier)
                const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice

                return (
                  <div
                    key={plan.tier}
                    className={`content-card ${plan.popular ? 'popular-plan' : ''}`}
                  >
                    {plan.popular && (
                      <div className="popular-badge">
                        Most Popular
                      </div>
                    )}

                    {isCurrent && (
                      <div className="badge badge-success" style={{position: 'absolute', top: '-12px', right: '1rem'}}>
                        Current Plan
                      </div>
                    )}

                    <h3 className="content-card-title">
                      {plan.name}
                    </h3>

                    <div className="price-display">
                      <p className="text-body">
                        <strong>${price}</strong>
                        {' '}/{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                      </p>
                    </div>

                    <div>
                      {plan.features.map((feature, idx) => (
                        <p key={idx} className="text-body">
                          ✓ {feature}
                        </p>
                      ))}
                    </div>

                    {plan.commitment && (
                      <div className="alert-warning text-center">
                        <strong>ℹ️ {plan.commitment}</strong>
                      </div>
                    )}

                    <button
                      onClick={() => handleUpgrade(plan.tier)}
                      disabled={isCurrent || upgradeLoading === plan.tier}
                      className={isCurrent ? 'btn-secondary' : 'btn-primary'}
                    >
                      {upgradeLoading === plan.tier ? 'Processing...' : isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cancel Subscription Section */}
          {currentTier !== 'Trial' && (
            <div className="content-card" style={{border: '1px solid #fca5a5'}}>
              <h3 className="content-card-title" style={{color: '#dc2626'}}>
                Cancel Subscription
              </h3>
              <p className="text-body">
                Need to cancel your subscription? Access your billing portal to manage cancellation.
              </p>
              <button
                onClick={handleManageBilling}
                className="btn-primary"
                style={{backgroundColor: '#dc2626'}}
              >
                Manage Billing & Cancellation
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
