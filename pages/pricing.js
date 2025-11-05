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

      // If user already has a subscription (changing plans), redirect to customer portal
      if (currentTier && currentTier !== 'trial') {
        // Redirect to Stripe Customer Portal
        const portalResponse = await fetch('/api/stripe/create-portal-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })

        if (portalResponse.ok) {
          const portalData = await portalResponse.json()
          window.location.href = portalData.url
          return
        } else {
          // Portal session failed (likely no subscription record in database)
          const errorData = await portalResponse.json()
          throw new Error(errorData.message || 'Unable to access subscription portal. Please contact support.')
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
        '1 executive summary',
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
        'Real-time crisis alerts',
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
        'Real-time crisis alerts',
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
        'Real-time crisis alerts',
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
        <meta name="description" content="Affordable USMCA compliance for importers, exporters, and producers. Plans starting at $99/month with AI-powered automated analysis. Save $10k-20k/year in time." />
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
            Self-serve USMCA compliance platform for businesses. Generate certificates, monitor tariff policy changes, and calculate savings. Plans start at $99/month with AI-powered analysis.
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
            <div className="trial-benefit-item">✓ 1 executive summary</div>
            <div className="trial-benefit-item">✓ 3 components</div>
            <div className="trial-benefit-item">✓ Certificate preview</div>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer - Before Pricing */}
      <section className="main-content">
        <div className="container-app">
          <LegalDisclaimer />
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="main-content" id="pricing">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Subscription Plans</h2>
            <p className="section-header-subtitle">
              USMCA qualification analysis, HS code classification, certificate generation, and real-time policy alerts
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

      {/* Sample Certificate - Real Screenshot */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">📜 What You Get: USMCA Certificate of Origin</h2>
            <p className="section-header-subtitle">
              Official USMCA Form D auto-generated from your analysis with all fields pre-filled
            </p>
          </div>

          <div style={{maxWidth: '900px', margin: '0 auto'}}>
            {/* Real Certificate Screenshot */}
            <div style={{borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', marginBottom: '1.5rem'}}>
              <img
                src="/image/samples/certificate preview.png"
                alt="USMCA Certificate of Origin preview with all required fields auto-populated"
                style={{width: '100%', height: 'auto', display: 'block'}}
              />
            </div>

            {/* Certificate Features */}
            <div className="content-card" style={{padding: '2rem'}}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '1rem'}}>
                Certificate Features
              </h3>
              <ul style={{paddingLeft: '1.5rem', color: '#475569', fontSize: '1rem', lineHeight: '1.8'}}>
                <li><strong>Official USMCA Form D format</strong> - Matches government template exactly</li>
                <li><strong>All fields pre-populated</strong> - Company info, product details, HS codes from your analysis</li>
                <li><strong>Edit before download</strong> - Change any field to match your customs requirements</li>
                <li><strong>PDF ready for submission</strong> - Download and attach to your shipments</li>
                <li><strong>Preference criterion included</strong> - Automatically calculates correct criterion (A, B, C, or D)</li>
              </ul>
            </div>

            <p style={{fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem', textAlign: 'center', fontStyle: 'italic'}}>
              Professional & Premium subscribers get unlimited certificate generation • Trial includes certificate preview
            </p>
          </div>
        </div>
      </section>

      {/* Sample Alert - Real Screenshots */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">🚨 What You Get: Trade Risk Alerts</h2>
            <p className="section-header-subtitle">
              Real-time monitoring with AI-powered strategic analysis
            </p>
          </div>

          <div style={{maxWidth: '1100px', margin: '0 auto'}}>
            {/* Alert Dashboard Screenshot */}
            <div style={{borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', marginBottom: '2rem'}}>
              <img
                src="/image/samples/alerts.png"
                alt="Crisis alerts dashboard showing component-level policy changes"
                style={{width: '100%', height: 'auto', display: 'block'}}
              />
            </div>

            {/* AI-Powered Alert Analysis Screenshot */}
            <div style={{borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', marginBottom: '1.5rem'}}>
              <img
                src="/image/samples/alerts ai.png"
                alt="AI-generated strategic briefing with portfolio risk analysis"
                style={{width: '100%', height: 'auto', display: 'block'}}
              />
            </div>

            {/* Alert Features */}
            <div className="content-card" style={{padding: '2rem'}}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '1rem'}}>
                Alert System Features
              </h3>
              <ul style={{paddingLeft: '1.5rem', color: '#475569', fontSize: '1rem', lineHeight: '1.8'}}>
                <li><strong>Component-level matching</strong> - Alerts show exactly which components are affected by tariff changes</li>
                <li><strong>Severity-based color coding</strong> - Critical (red), High (orange), Medium (yellow), Low (blue)</li>
                <li><strong>AI-powered strategic briefing</strong> - Portfolio-level risk analysis with USMCA 2026 renegotiation context</li>
                <li><strong>Real-time monitoring</strong> - Platform watches Federal Register, USTR, and government sources 24/7</li>
                <li><strong>Email notifications</strong> - Daily digest of relevant policy changes affecting your products</li>
                <li><strong>Actionable recommendations</strong> - AI suggests sourcing alternatives and compliance strategies</li>
              </ul>
            </div>

            <p style={{fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem', textAlign: 'center', fontStyle: 'italic'}}>
              Professional & Premium subscribers get unlimited alerts with AI-powered portfolio briefings
            </p>
          </div>
        </div>
      </section>

      {/* What Subscribers Get */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">What's Included</h2>
            <p className="section-header-subtitle">
              Self-serve platform with AI-powered analysis tools
            </p>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <div className="content-card-icon">📊</div>
              <h3 className="content-card-title">Workflow Analysis</h3>
              <p className="content-card-description">
                Analyze products for USMCA qualification. Input components, origin countries, and manufacturing locations. AI calculates regional value content (RVC) and determines eligibility.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">📈</div>
              <h3 className="content-card-title">Executive Summary</h3>
              <p className="content-card-description">
                Strategic analysis shown on results page. AI provides Section 301 exposure analysis, Mexico nearshoring ROI calculations, and supply chain vulnerability assessment for your specific products.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">📋</div>
              <h3 className="content-card-title">Portfolio Briefing</h3>
              <p className="content-card-description">
                Strategic analysis on alerts page. When new policies emerge, AI analyzes how they affect your entire product portfolio with USMCA 2026 renegotiation context and policy impact scenarios.
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

          <div className="grid-2-cols">
            <div className="content-card">
              <h3 className="content-card-title">How do I get started?</h3>
              <p className="content-card-description">
                Sign up for free trial (no credit card), run 1 workflow analysis with 3 components, generate certificate preview, and view crisis alerts. Upgrade to paid plan for unlimited certificates and higher limits.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">What can I do?</h3>
              <p className="content-card-description">
                Run USMCA qualification checks, get AI HS code classification, generate certificates (Form D), monitor tariff policy changes, and calculate potential savings. All self-serve - you input data, we calculate compliance.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Who is responsible for accuracy?</h3>
              <p className="content-card-description">
                You are. This is a self-serve platform - you verify all input data and calculations. For official customs submissions, consult a licensed customs broker. Platform provides tools only, you own accuracy.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">What are the three usage types?</h3>
              <p className="content-card-description">
                <strong>Workflow Analysis:</strong> Product qualification check. <strong>Executive Summary:</strong> Strategic analysis on results page. <strong>Portfolio Briefing:</strong> Policy impact analysis on alerts page when new tariff changes emerge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Growth Path */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Your Growth Path</h2>
            <p className="section-header-subtitle">
              Start small, scale as your cross-border trade volume grows
            </p>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <div className="content-card-icon">1</div>
              <h3 className="content-card-title">Free Trial</h3>
              <p className="content-card-description">Test platform: 1 workflow + 1 executive summary. 3 components. Certificate preview (watermarked). No credit card required.</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">2</div>
              <h3 className="content-card-title">Starter - $99/month</h3>
              <p className="content-card-description">15 workflows + 15 executive summaries + 30 portfolio briefings per month. Unlimited certificates. Real-time alerts. No commitment.</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">3</div>
              <h3 className="content-card-title">Professional - $299/month</h3>
              <p className="content-card-description">100 workflows + 100 executive summaries + 150 portfolio briefings per month. Priority support. 30-day commitment.</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">4</div>
              <h3 className="content-card-title">Premium - $599/month</h3>
              <p className="content-card-description">500 workflows + 500 executive summaries + 750 portfolio briefings per month. 20 components per workflow. 60-day commitment.</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">📊</div>
              <h3 className="content-card-title">All Plans Include</h3>
              <p className="content-card-description">AI HS code classification, RVC calculations, USMCA qualification checks, certificate generation (Form D), real-time policy alerts, email notifications</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">✓</div>
              <h3 className="content-card-title">Flat Pricing</h3>
              <p className="content-card-description">No per-analysis fees, no setup charges, no hidden costs. Cancel anytime (subject to commitment periods). All prices shown are final.</p>
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