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

      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      if (!stripe) {
        throw new Error('Stripe failed to load. Please refresh and try again.')
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      })

      if (error) {
        throw new Error(error.message)
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
      description: 'Try the platform risk-free for 7 days - no credit card required',
      features: [
        '1 USMCA workflow analysis',
        '3 components per analysis',
        '3 portfolio briefings',
        'Certificate preview (watermarked)',
        'View crisis alerts dashboard',
        'AI HS code suggestions',
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
      description: 'For small importers & exporters (10-20 products)',
      features: [
        '15 USMCA workflow analyses per month',
        '10 components per analysis',
        '50 portfolio briefings per month',
        'Unlimited certificate downloads',
        'Real-time crisis alerts',
        'AI HS code classification',
        'Email notifications'
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
      description: 'For medium manufacturers (50-100 products)',
      features: [
        '100 USMCA workflow analyses per month',
        '15 components per analysis',
        '200 portfolio briefings per month',
        'Unlimited certificate downloads',
        'Real-time crisis alerts with AI impact scoring',
        'Detailed compliance guidance',
        'Priority support'
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
      description: 'For large enterprises (200+ products)',
      features: [
        '500 USMCA workflow analyses per month',
        '20 components per analysis',
        '1,000 portfolio briefings per month',
        'Unlimited certificate downloads',
        'Real-time crisis alerts with AI impact scoring',
        'Advanced portfolio briefing reports',
        'Priority AI analysis queue',
        'Dedicated account support'
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
            <Link href="/about" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>About</Link>
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
            Affordable USMCA compliance for Small & Medium businesses who can't afford full-time trade compliance teams. Plans start at $99/month with AI-powered automated analysis.
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
            <div className="trial-benefit-item">✓ 1 free USMCA analysis</div>
            <div className="trial-benefit-item">✓ 3 components analyzed</div>
            <div className="trial-benefit-item">✓ Certificate preview</div>
            <div className="trial-benefit-item">✓ Crisis alerts dashboard</div>
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
            <h2 className="section-header-title">App Subscription Plans</h2>
            <p className="section-header-subtitle">
              AI-powered tools: USMCA qualification checks, HS code suggestions, AI-generated certificates, and trade policy alerts
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

      {/* Sample Alert - Real Scenario */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">🚨 What You Get: Trade Risk Alerts</h2>
            <p className="section-header-subtitle">
              Real-time monitoring with AI-powered recommendations
            </p>
          </div>

          <div className="content-card" style={{maxWidth: '900px', margin: '0 auto'}}>
            <div style={{borderLeft: '4px solid #dc2626', padding: '16px', backgroundColor: '#fef2f2', borderRadius: '4px'}}>
              <div style={{display: 'flex', alignItems: 'center', marginBottom: '12px'}}>
                <span style={{fontSize: '1.5rem', marginRight: '12px'}}>⚠️</span>
                <div>
                  <h3 style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#dc2626', margin: 0}}>CRITICAL SUPPLY CHAIN RISK</h3>
                  <p style={{fontSize: '0.85rem', color: '#6b7280', margin: 0}}>Alert ID: RISK-2025-001 • Detected: January 13, 2025</p>
                </div>
              </div>

              <h4 style={{fontSize: '1rem', fontWeight: '600', color: '#134169', marginBottom: '8px'}}>
                China Electronics Tariffs Increase to 60% on Mobile Phone Components
              </h4>

              <p style={{fontSize: '0.9rem', marginBottom: '12px'}}>
                New Section 301 tariffs on Chinese electronics components (HS 8517.12, 8517.70) affect companies importing mobile phone parts. Products with significant Chinese component sourcing face major cost increases.
              </p>

              <div style={{backgroundColor: '#fff', padding: '12px', borderRadius: '4px', marginBottom: '12px', border: '1px solid #e5e7eb'}}>
                <p style={{fontSize: '0.85rem', fontWeight: '600', color: '#134169', marginBottom: '8px'}}>Impact on Your Business:</p>
                <p style={{fontSize: '0.85rem'}}>• Companies with 100% Mexico sourcing (like RTW Logistics): ✓ No impact</p>
                <p style={{fontSize: '0.85rem'}}>• Companies with Chinese components: ⚠️ 60% tariff increase on affected parts</p>
                <p style={{fontSize: '0.85rem'}}>• Estimated industry-wide impact: $2.8B in additional costs</p>
              </div>

              <div style={{backgroundColor: '#dcfce7', padding: '12px', borderRadius: '4px', marginBottom: '12px'}}>
                <p style={{fontSize: '0.85rem', fontWeight: '600', color: '#16a34a', marginBottom: '8px'}}>AI-Recommended Actions:</p>
                <p style={{fontSize: '0.85rem'}}>✓ If sourcing from China: Transition to Mexico suppliers to avoid tariffs</p>
                <p style={{fontSize: '0.85rem'}}>✓ Maintain USMCA qualification to preserve duty-free status</p>
                <p style={{fontSize: '0.85rem'}}>✓ Timeline: Act within 90 days before enforcement</p>
              </div>
            </div>
            <p style={{fontSize: '0.85rem', color: '#6b7280', marginTop: '16px', textAlign: 'center', fontStyle: 'italic'}}>
              Professional & Premium subscribers get real-time alerts with AI analysis
            </p>
          </div>
        </div>
      </section>

      {/* What Subscribers Get */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">What Professional & Premium Subscribers Get</h2>
            <p className="section-header-subtitle">
              AI-powered compliance tools that save you time and money
            </p>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <div className="content-card-icon">A</div>
              <h3 className="content-card-title">AI Supply Chain Analysis</h3>
              <p className="content-card-description">
                AI analyzes your component origins to identify geopolitical risks,
                tariff exposure, and supply chain vulnerabilities. Get specific,
                actionable recommendations based on your actual supply chain.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">∞</div>
              <h3 className="content-card-title">High-Volume USMCA Checks</h3>
              <p className="content-card-description">
                Professional tier: 100 analyses/month. Premium tier: 500 analyses/month.
                Check multiple products, scenarios, and suppliers. Instant AI-powered HS code suggestions
                and qualification calculations. No hidden per-analysis fees.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">$</div>
              <h3 className="content-card-title">ROI for Importers, Exporters & Producers</h3>
              <p className="content-card-description">
                DIY USMCA compliance costs $50-100/hr of your time. Hiring a customs
                broker full-time: $60k+/year. Our platform: $299-599/month with
                AI-powered automation. Save $10k-50k per year.
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
                Sign up for free (no credit card required), run your first USMCA analysis, get AI-powered HS code suggestions, generate certificate templates, and see your potential tariff savings. Upgrade anytime to unlock unlimited analyses and real-time trade alerts.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">What can I do with Triangle?</h3>
              <p className="content-card-description">
                Analyze USMCA qualification for your products, get AI-powered HS code suggestions, generate certificate templates, monitor supply chain risks with real-time trade alerts, and calculate potential tariff savings using Mexico-based suppliers.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Do I need licensing or certifications?</h3>
              <p className="content-card-description">
                Triangle provides AI-powered analysis and recommendations. For official USMCA certificates and customs filings, you'll need to work with a licensed customs broker - we help you prepare the analysis they need.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">What's included in my subscription?</h3>
              <p className="content-card-description">
                <strong>Starter ($99/mo):</strong> 10 USMCA analyses, basic alerts. <strong>Professional ($299/mo):</strong> 100 analyses, real-time crisis alerts, portfolio briefing. <strong>Premium ($599/mo):</strong> 500 analyses, advanced AI features, 20 components per analysis.
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
              <h3 className="content-card-title">Week 1: Free Trial</h3>
              <p className="content-card-description">7 days free - Test with 1 USMCA analysis (3 components), see how AI classifies your products</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">2</div>
              <h3 className="content-card-title">Month 1-2: Starter Plan</h3>
              <p className="content-card-description">$99/month - 10 analyses to test different products and suppliers, build your compliance knowledge base</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">3</div>
              <h3 className="content-card-title">Month 3+: Professional</h3>
              <p className="content-card-description">$299/month - 100 analyses/month, real-time crisis alerts, portfolio briefing reports for growing trade volume</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">4</div>
              <h3 className="content-card-title">High Volume: Premium</h3>
              <p className="content-card-description">$599/month - 500 analyses/month, advanced AI features, 20 components per analysis for complex supply chains</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">A</div>
              <h3 className="content-card-title">All Plans Include</h3>
              <p className="content-card-description">AI HS code classification, tariff calculations, USMCA qualification checks, certificate generation, crisis alerts</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">∞</div>
              <h3 className="content-card-title">No Hidden Fees</h3>
              <p className="content-card-description">Flat monthly pricing, no per-analysis charges, no setup fees, cancel anytime (subject to commitment period)</p>
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
              Subscribe to access professional USMCA compliance tools and AI-powered trade analysis
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