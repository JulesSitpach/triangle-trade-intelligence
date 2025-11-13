import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getStripe } from '../lib/stripe/client'
import LegalDisclaimer from '../components/LegalDisclaimer'
import Footer from '../components/Footer'

export default function Pricing() {
  const [isClient, setIsClient] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState('monthly')
  const [loading, setLoading] = useState(null)
  const [currentTier, setCurrentTier] = useState(null) // Track user's current subscription
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)

    // Check if user is logged in and get their current tier
    const checkUserTier = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          if (data.user && data.user.subscription_tier) {
            // Store in lowercase for comparison (database has "Starter", "Professional", "Premium")
            setCurrentTier(data.user.subscription_tier.toLowerCase())
            console.log('Current user tier:', data.user.subscription_tier)
          }
        }
      } catch (error) {
        console.error('Error checking user tier:', error)
      }
    }

    checkUserTier()
  }, [])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleSubscribe = async (tier) => {
    try {
      setLoading(tier)

      // Check if user is logged in first
      const authCheck = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (!authCheck.ok) {
        // User not logged in - redirect to signup with selected plan
        router.push(`/signup?plan=${tier}`)
        return
      }

      // If user already has an ACTIVE subscription (changing plans), redirect to customer portal
      // NOTE: Only send to portal if they have a paid tier AND an active Stripe customer ID
      if (currentTier && currentTier !== 'trial') {
        // Try to access customer portal
        const portalResponse = await fetch('/api/stripe/create-portal-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })

        if (portalResponse.ok) {
          // Portal session succeeded - user has active Stripe subscription
          const portalData = await portalResponse.json()
          window.location.href = portalData.url
          return
        } else {
          // Portal session failed - user might have canceled subscription
          // Fall through to checkout flow (don't throw error)
          console.log('Portal access failed, proceeding to checkout for new subscription')
        }
      }

      // User is logged in and doesn't have an active subscription - proceed to Stripe checkout
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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

      // Redirect to Stripe Checkout using the new method
      // NEW: Stripe deprecated redirectToCheckout on Sept 30, 2025
      // Use window.location.href with the checkout URL instead
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Checkout URL not provided by server')
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert(`Subscription error: ${error.message}\n\nIf this persists, please contact triangleintel@gmail.com`)
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    {
      name: 'Free Trial',
      tier: 'trial',
      monthlyPrice: 0,
      annualPrice: 0,
      period: '7 days',
      description: 'Test the platform - no credit card required',
      features: [
        '1 workflow analysis',
        '3 components per workflow',
        'Certificate preview only (no download)',
        'View crisis alerts dashboard',
        'AI HS code classification',
        'No credit card required'
      ],
      cta: 'Start Free Trial',
      popular: false,
      isTrial: true
    },
    {
      name: 'Starter',
      tier: 'starter',
      monthlyPrice: 99,
      annualPrice: 950,
      period: billingPeriod === 'monthly' ? 'per month' : 'per year',
      description: 'For small businesses (10-20 products)',
      features: [
        '15 workflow analyses/month',
        '15 executive summaries/month',
        '30 portfolio briefings/month',
        '10 components per workflow',
        'Unlimited certificate downloads',
        'Daily crisis alert digest',
        'AI HS code classification',
        'Email alert notifications'
      ],
      cta: 'Subscribe to Starter',
      popular: false,
      commitment: null  // No lock
    },
    {
      name: 'Professional',
      tier: 'professional',
      monthlyPrice: 299,
      annualPrice: 2850,
      period: billingPeriod === 'monthly' ? 'per month' : 'per year',
      description: 'For medium businesses (50-100 products)',
      features: [
        '100 workflow analyses/month',
        '100 executive summaries/month',
        '150 portfolio briefings/month',
        '15 components per workflow',
        'Unlimited certificate downloads',
        'Daily crisis alert digest',
        'AI HS code classification',
        'Email alert notifications'
      ],
      cta: 'Subscribe to Professional',
      popular: true,
      commitment: '30-day commitment'  // 30-day lock
    },
    {
      name: 'Premium',
      tier: 'premium',
      monthlyPrice: 599,
      annualPrice: 5750,
      period: billingPeriod === 'monthly' ? 'per month' : 'per year',
      description: 'For large businesses (200+ products)',
      features: [
        '500 workflow analyses/month',
        '500 executive summaries/month',
        '750 portfolio briefings/month',
        '20 components per workflow',
        'Unlimited certificate downloads',
        'Daily crisis alert digest',
        'AI HS code classification',
        'Email alert notifications'
      ],
      cta: 'Subscribe to Premium',
      popular: false,
      commitment: '60-day commitment'  // 60-day lock
    }
  ]

  return (
    <>
      <Head>
        <title>USMCA Compliance Platform Pricing | Affordable Plans for Importers, Exporters & Producers</title>
        <meta name="description" content="Affordable USMCA compliance for importers, exporters, and producers. Plans starting at $99/month with AI-powered automated analysis. Reduce compliance costs with self-serve certificate generation." />
        <meta name="keywords" content="USMCA compliance pricing, trade compliance software cost, HS code classification pricing, Small & Medium business trade platform, trade consulting services" />
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
          {/* Mobile Menu Button */}
          <button 
            className="nav-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            ☰
          </button>
          
          <div className={`nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <Link href="/how-it-works" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
            <Link href="/pricing" className="nav-menu-link active" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/pricing#pricing" className="nav-cta-button" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
            <Link href="/login" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-video-section">
        <video
          className="hero-video-element"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            e.target.playbackRate = 0.8;
          }}
          onError={(e) => {
            console.warn('Video failed to load:', e);
            e.target.style.display = 'none';
          }}
        >
          <source src="/image/earth-seamless-loop.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Gradient Overlay */}
        <div className="hero-gradient-overlay" />
        
        {/* Hero Content */}
        <div className="hero-content-container">
          <div className="hero-badge">
            Transparent Pricing Plans
          </div>
          
          <h1 className="hero-main-title">
            Professional Trade Compliance
          </h1>
          <h2 className="hero-sub-title">
            For <span className="hero-yellow-highlight">Importers, Exporters & Producers</span>
          </h2>

          <p className="hero-description-text">
            Self-serve USMCA compliance platform for businesses. Generate certificates, monitor tariff policy changes, and analyze qualification. Plans start at $99/month with AI-powered analysis.
          </p>
          
          <div className="hero-button-group">
            <Link
              href="#pricing"
              className="hero-primary-button"
              aria-label="View pricing plans and start free trial"
            >
              Try Free - No Credit Card
            </Link>
            <Link
              href="#pricing"
              className="hero-secondary-button"
              aria-label="View pricing plans"
            >
              View Plans
            </Link>
          </div>

          {/* Trial Benefits */}
          <div className="hero-trial-benefits">
            <div className="trial-benefit-item">✓ 1 workflow analysis</div>
            <div className="trial-benefit-item">✓ 3 components</div>
            <div className="trial-benefit-item">✓ Certificate preview</div>
            <div className="trial-benefit-item">✓ Crisis alerts dashboard</div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="main-content" id="pricing">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Subscription Plans</h2>
            <p className="section-header-subtitle">
              USMCA qualification analysis, HS code classification, certificate generation, and daily policy alert monitoring
            </p>

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
                Annual (Save up to 20%)
              </button>
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '2rem'}}>
            {plans.map((plan, index) => (
              <div key={index} className={`content-card ${plan.popular ? 'popular-plan' : ''}`}>
                {plan.popular && <div className="popular-badge">Most Popular</div>}
                {plan.badge && <div className="popular-badge">{plan.badge}</div>}
                <h3 className="content-card-title">{plan.name}</h3>
                <div className="price-display">
                  <p className="text-body">
                    <strong>${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice}</strong>
                    {' '}{plan.period}
                  </p>
                  {billingPeriod === 'annual' && !plan.isTrial && (
                    <p className="text-body">
                      ${Math.round(plan.annualPrice / 12)}/month
                    </p>
                  )}
                </div>
                <p className="content-card-description">{plan.description}</p>

                <div>
                  {plan.features.map((feature, idx) => (
                    <p key={idx} className="text-body">
                      ✓ {feature}
                    </p>
                  ))}
                </div>

                {plan.isTrial ? (
                  <Link
                    href="/signup?plan=trial"
                    className="content-card-link btn-primary"
                  >
                    {plan.cta}
                  </Link>
                ) : currentTier === plan.tier ? (
                  <button
                    disabled
                    className="content-card-link btn-secondary"
                    style={{cursor: 'not-allowed', opacity: 0.6}}
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.tier)}
                    disabled={loading === plan.tier}
                    className="content-card-link btn-primary"
                  >
                    {loading === plan.tier ? 'Loading...' :
                      currentTier ? 'Change Plan' : plan.cta}
                  </button>
                )}

                {/* Commitment Notice */}
                {plan.commitment && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fcd34d',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    color: '#78350f',
                    textAlign: 'center'
                  }}>
                    <strong>ℹ️ {plan.commitment}</strong>
                    <p style={{marginTop: '0.5rem', marginBottom: 0, fontSize: '0.8rem'}}>
                      Cannot downgrade during lock period. Ensures stable compliance workflow.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Disclaimer - After Pricing */}
      <section className="main-content">
        <div className="container-app">
          <LegalDisclaimer />
        </div>
      </section>

      {/* Removed: Sample screenshots, FAQ, and Growth Path sections - keeping pricing page focused and clean for busy SMBs */}

      {/* CTA Section */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">
              Ready to Get Started?
            </h2>
            <p className="section-header-subtitle">
              Self-serve USMCA platform - You input data, we calculate compliance
            </p>
            <div className="hero-button-group">
              <Link
                href="#pricing"
                className="hero-primary-button"
                aria-label="View pricing plans and subscribe"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}