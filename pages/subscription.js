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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
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

      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {/* Header */}
        <nav style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 0'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Link href="/dashboard" style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1e40af',
              textDecoration: 'none'
            }}>
              ← Back to Dashboard
            </Link>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ color: '#6b7280' }}>{user?.email}</span>
              <Link href="/dashboard" style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '0.375rem',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}>
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '3rem 1.5rem'
        }}>
          {/* Current Subscription */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '2rem',
            marginBottom: '3rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '1rem'
            }}>
              Current Subscription
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e40af', margin: 0 }}>
                  {currentTier} Plan
                </p>
                {currentTier !== 'Trial' && (
                  <p style={{ fontSize: '1.25rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    ${plans.find(p => p.tier === currentTier.toLowerCase())?.monthlyPrice || 0}/month
                  </p>
                )}
              </div>
              {currentTier !== 'Trial' && (
                <button
                  onClick={handleManageBilling}
                  disabled={upgradeLoading === 'manage'}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: upgradeLoading === 'manage' ? 'not-allowed' : 'pointer',
                    opacity: upgradeLoading === 'manage' ? 0.5 : 1
                  }}
                >
                  {upgradeLoading === 'manage' ? 'Loading...' : 'Manage Billing'}
                </button>
              )}
            </div>
          </div>

          {/* Billing Period Toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '2rem',
            gap: '1rem'
          }}>
            <button
              onClick={() => setBillingPeriod('monthly')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: billingPeriod === 'monthly' ? '#3b82f6' : 'white',
                color: billingPeriod === 'monthly' ? 'white' : '#374151',
                border: '2px solid #3b82f6',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: billingPeriod === 'annual' ? '#3b82f6' : 'white',
                color: billingPeriod === 'annual' ? 'white' : '#374151',
                border: '2px solid #3b82f6',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Annual (Save ~15%)
            </button>
          </div>

          {/* Upgrade Options */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              {currentTier === 'Trial' ? 'Choose Your Plan' : 'Upgrade Your Plan'}
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem'
            }}>
              {plans.map((plan) => {
                const isCurrent = isCurrentPlan(plan.tier)
                const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice

                return (
                  <div
                    key={plan.tier}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '0.5rem',
                      padding: '2rem',
                      boxShadow: plan.popular ? '0 10px 30px rgba(59, 130, 246, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                      border: plan.popular ? '2px solid #3b82f6' : isCurrent ? '2px solid #10b981' : '1px solid #e5e7eb',
                      position: 'relative'
                    }}
                  >
                    {plan.popular && (
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '0.25rem 1rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}>
                        Most Popular
                      </div>
                    )}

                    {isCurrent && (
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '1rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '0.25rem 1rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}>
                        Current Plan
                      </div>
                    )}

                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#111827',
                      marginBottom: '0.5rem'
                    }}>
                      {plan.name}
                    </h3>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <span style={{
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        color: '#1e40af'
                      }}>
                        ${price}
                      </span>
                      <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                        /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>

                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      marginBottom: '1.5rem'
                    }}>
                      {plan.features.map((feature, idx) => (
                        <li key={idx} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                          marginBottom: '0.75rem',
                          color: '#374151',
                          fontSize: '0.875rem'
                        }}>
                          <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.commitment && (
                      <div style={{
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fbbf24',
                        borderRadius: '0.375rem',
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        fontSize: '0.75rem',
                        color: '#78350f',
                        textAlign: 'center'
                      }}>
                        <strong>ℹ️ {plan.commitment}</strong>
                      </div>
                    )}

                    <button
                      onClick={() => handleUpgrade(plan.tier)}
                      disabled={isCurrent || upgradeLoading === plan.tier}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: isCurrent ? '#9ca3af' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: isCurrent || upgradeLoading === plan.tier ? 'not-allowed' : 'pointer',
                        opacity: isCurrent || upgradeLoading === plan.tier ? 0.5 : 1
                      }}
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
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #fca5a5'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#dc2626',
                marginBottom: '1rem'
              }}>
                Cancel Subscription
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                Need to cancel your subscription? Access your billing portal to manage cancellation.
              </p>
              <button
                onClick={handleManageBilling}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
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
