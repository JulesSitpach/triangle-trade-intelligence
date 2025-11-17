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
        '15 AI credits/month (workflows + summaries)',
        '10 components per workflow',
        'Executive summaries (1 credit each),',
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
        '100 AI credits/month (workflows + summaries)',
        '15 components per workflow',
        'Executive summaries (1 credit each),',
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
        '500 AI credits/month (workflows + summaries)',
        '20 components per workflow',
        'Executive summaries (1 credit each)',
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
            <Link href="/certificate-of-origin" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Certificate</Link>
            <Link href="/ongoing-alerts" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Alerts</Link>
            <Link href="/pricing" className="nav-menu-link active" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/pricing#pricing" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
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

          <div className="pricing-cards-grid">
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
                  <div className="alert-warning text-center">
                    <strong>ℹ️ {plan.commitment}</strong>
                    <p className="form-help">
                      Cannot downgrade during lock period. Ensures stable compliance workflow.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included in All Plans */}
      <section className="main-content" style={{ backgroundColor: '#f0f9ff' }}>
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">What&apos;s Included in All Plans</h2>
            <p className="section-header-subtitle">
              Every subscription includes access to our complete data infrastructure
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            border: '1px solid #dbeafe',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#2563eb', fontWeight: 'bold' }}>✓</span> Access to 12,118 HS code database (official USITC rates)
              </p>
              <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#2563eb', fontWeight: 'bold' }}>✓</span> AI-powered HS code classification for missing codes
              </p>
              <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#2563eb', fontWeight: 'bold' }}>✓</span> Real-time Section 301/232 policy rate lookups via AI
              </p>
              <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#2563eb', fontWeight: 'bold' }}>✓</span> Daily tariff change monitoring (Federal Register RSS)
              </p>
              <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#2563eb', fontWeight: 'bold' }}>✓</span> USMCA certificate generation (official Form D format)
              </p>
            </div>

            <div style={{
              backgroundColor: '#fefce8',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #fef08a'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#854d0e', marginBottom: '0.5rem' }}>
                <strong>Data Freshness Notice:</strong>
              </p>
              <p style={{ fontSize: '0.875rem', color: '#854d0e', lineHeight: '1.5' }}>
                Database updated November 2025. AI fallback provides real-time lookups for current policy rates.
                Users must verify rates with official sources or licensed customs brokers before customs submission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer - After Pricing */}
      <section className="main-content">
        <div className="container-app">
          <LegalDisclaimer />
        </div>
      </section>

      {/* Cost Savings Comparison */}
      <section className="main-content" style={{ backgroundColor: '#ecfdf5' }}>
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Save 45-70% on Compliance Costs</h2>
            <p className="section-header-subtitle">
              Even with broker validation, users save significantly vs traditional approach
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            border: '1px solid #bbf7d0',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {/* Comparison Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.95rem'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0fdf4' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #16a34a', fontWeight: '600' }}>Company Size</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #16a34a', fontWeight: '600' }}>Traditional Cost</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #16a34a', fontWeight: '600' }}>Platform + Broker</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #16a34a', fontWeight: '600', color: '#16a34a' }}>Your Savings</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                      <strong>Small</strong><br/>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>$5M imports</span>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>$5,000-8,000/year</td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>$1,500-2,500/year</td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#16a34a', fontWeight: '600' }}>
                      $3,500-5,500<br/>
                      <span style={{ fontSize: '0.85rem' }}>(60-70% savings)</span>
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                      <strong>Medium</strong><br/>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>$20M imports</span>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>$12,000-18,000/year</td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>$4,000-6,000/year</td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#16a34a', fontWeight: '600' }}>
                      $8,000-12,000<br/>
                      <span style={{ fontSize: '0.85rem' }}>(65-70% savings)</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                      <strong>Large</strong><br/>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>$100M imports</span>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>$180,000-220,000/year</td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>$100,000-120,000/year</td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#16a34a', fontWeight: '600' }}>
                      $80,000-100,000<br/>
                      <span style={{ fontSize: '0.85rem' }}>(45-50% savings)</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Key Insight */}
            <div style={{
              backgroundColor: '#fefce8',
              padding: '1.25rem',
              borderRadius: '6px',
              border: '1px solid #fef08a',
              marginTop: '1.5rem'
            }}>
              <p style={{ fontWeight: '600', color: '#854d0e', marginBottom: '0.5rem' }}>
                Key insight:
              </p>
              <p style={{ color: '#854d0e', marginBottom: '0' }}>
                Our platform does the heavy lifting (HS classification, RVC calculation, certificate drafting).
                Your broker just validates in <strong>1 hour</strong> instead of creating from scratch in <strong>10 hours</strong>.
              </p>
            </div>

            {/* Strongest Selling Point */}
            <div style={{
              backgroundColor: '#1e3a8a',
              color: 'white',
              padding: '1.25rem',
              borderRadius: '6px',
              marginTop: '1rem',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0' }}>
                Use our platform + get broker validation = <strong>Save 65-75%</strong> vs broker-only approach
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Frequently Asked Questions</h2>
          </div>

          <div style={{
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {/* Broker Usage FAQ */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '2rem',
              border: '1px solid #e2e8f0',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1e3a8a',
                marginBottom: '1rem'
              }}>
                Q: Should I still use a customs broker?
              </h3>
              <p className="text-body" style={{ marginBottom: '1.5rem' }}>
                <strong>A: It depends on your risk tolerance and transaction complexity:</strong>
              </p>

              {/* Low Risk Scenario */}
              <div style={{
                backgroundColor: '#f0fdf4',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #bbf7d0',
                marginBottom: '1rem'
              }}>
                <p style={{ fontWeight: '600', color: '#166534', marginBottom: '0.5rem' }}>
                  🟢 Low-risk scenario (platform only):
                </p>
                <ul style={{ paddingLeft: '1.5rem', margin: '0', color: '#166534' }}>
                  <li>Simple supply chains (5-10 components)</li>
                  <li>Clear USMCA qualification (70%+ RVC)</li>
                  <li>Stable suppliers with good documentation</li>
                  <li>Lower transaction values (&lt;$50,000)</li>
                </ul>
                <p style={{ marginTop: '0.5rem', fontWeight: '500', color: '#166534' }}>
                  Cost: $99-299/month platform only
                </p>
              </div>

              {/* Medium Risk Scenario */}
              <div style={{
                backgroundColor: '#fefce8',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #fef08a',
                marginBottom: '1rem'
              }}>
                <p style={{ fontWeight: '600', color: '#854d0e', marginBottom: '0.5rem' }}>
                  🟡 Medium-risk scenario (platform + broker review):
                </p>
                <ul style={{ paddingLeft: '1.5rem', margin: '0', color: '#854d0e' }}>
                  <li>Moderate complexity (10-20 components)</li>
                  <li>Borderline qualification (55-65% RVC)</li>
                  <li>First-time USMCA claims</li>
                  <li>Higher transaction values ($50,000-200,000)</li>
                </ul>
                <p style={{ marginTop: '0.5rem', fontWeight: '500', color: '#854d0e' }}>
                  Cost: Platform ($99-299/month) + broker review ($200-400 one-time)
                </p>
              </div>

              {/* High Risk Scenario */}
              <div style={{
                backgroundColor: '#fff7ed',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #fed7aa',
                marginBottom: '1rem'
              }}>
                <p style={{ fontWeight: '600', color: '#9a3412', marginBottom: '0.5rem' }}>
                  🟠 High-risk scenario (platform + broker partnership):
                </p>
                <ul style={{ paddingLeft: '1.5rem', margin: '0', color: '#9a3412' }}>
                  <li>Complex supply chains (20+ components)</li>
                  <li>Multiple transformation processes</li>
                  <li>High transaction values ($200,000+)</li>
                  <li>History of CBP audits</li>
                </ul>
                <p style={{ marginTop: '0.5rem', fontWeight: '500', color: '#9a3412' }}>
                  Cost: Platform ($299-599/month) + broker ($200-400/hour as needed)
                </p>
              </div>

              {/* Very High Risk Scenario */}
              <div style={{
                backgroundColor: '#fef2f2',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #fecaca',
                marginBottom: '1rem'
              }}>
                <p style={{ fontWeight: '600', color: '#991b1b', marginBottom: '0.5rem' }}>
                  🔴 Very high-risk scenario (full broker management):
                </p>
                <ul style={{ paddingLeft: '1.5rem', margin: '0', color: '#991b1b' }}>
                  <li>Automotive/textile (high CBP scrutiny)</li>
                  <li>Section 301 tariff exposure</li>
                  <li>Questionable origin documentation</li>
                  <li>Previous CBP penalties</li>
                </ul>
                <p style={{ marginTop: '0.5rem', fontWeight: '500', color: '#991b1b' }}>
                  Cost: Full broker services ($500-2,000+/month retainer)
                </p>
              </div>

              <div style={{
                backgroundColor: '#f8fafc',
                padding: '1rem',
                borderRadius: '6px',
                marginTop: '1rem'
              }}>
                <p className="text-body" style={{ fontStyle: 'italic', marginBottom: '0' }}>
                  <strong>Our recommendation:</strong> Use the platform for analysis and certificate generation,
                  then consult a licensed customs broker for high-value or complex transactions.
                  The platform helps you prepare better questions and documentation, reducing broker billable hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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