import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getStripe } from '../lib/stripe/client'
import Footer from '../components/Footer'

export default function Pricing() {
  const [isClient, setIsClient] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState('monthly')
  const [loading, setLoading] = useState(null)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleSubscribe = async (tier) => {
    // TEMPORARY: Stripe disabled for development
    alert('Stripe subscriptions are currently disabled. Please contact support at dev@triangleintelligence.com to set up your subscription.')
    return

    /* DISABLED - Uncomment when Stripe is configured properly
    try {
      setLoading(tier)

      // Call API to create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
        throw new Error('Stripe failed to load')
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert(`Subscription error: ${error.message}`)
    } finally {
      setLoading(null)
    }
    */
  }

  const plans = [
    {
      name: 'Starter',
      tier: 'starter',
      monthlyPrice: 99,
      annualPrice: 950,
      period: billingPeriod === 'monthly' ? 'per month' : 'per year',
      description: 'Essential USMCA compliance tools for small importers',
      features: [
        '10 USMCA analyses per month',
        'Basic trade alerts',
        'Email support',
        'Certificate generation',
        'AI HS code suggestions'
      ],
      cta: 'Subscribe to Starter',
      popular: false
    },
    {
      name: 'Professional',
      tier: 'professional',
      monthlyPrice: 299,
      annualPrice: 2850,
      period: billingPeriod === 'monthly' ? 'per month' : 'per year',
      description: 'Unlimited analyses with AI-powered risk assessment',
      features: [
        'Unlimited USMCA analyses',
        'AI supply chain vulnerability analysis',
        '15% discount on professional services',
        'Priority support (48hr response)',
        'Advanced trade policy analysis'
      ],
      cta: 'Subscribe to Professional',
      popular: true
    },
    {
      name: 'Premium',
      tier: 'premium',
      monthlyPrice: 599,
      annualPrice: 5750,
      period: billingPeriod === 'monthly' ? 'per month' : 'per year',
      description: 'Everything plus quarterly strategy calls with our team',
      features: [
        'Everything in Professional',
        'Quarterly strategy calls with Jorge & Cristina',
        '25% discount on professional services',
        'Dedicated Slack/email support',
        'Custom trade intelligence reports'
      ],
      cta: 'Subscribe to Premium',
      popular: false
    }
  ]

  const addOns = [
    {
      name: '📜 USMCA Certificate Generation',
      serviceId: 'usmca-certificate',
      basePrice: 250,
      professionalPrice: 212,  // 15% off
      premiumPrice: 188,       // 25% off
      description: 'Professional USMCA certificate with regulatory compliance validation by licensed customs broker'
    },
    {
      name: '🔍 HS Code Classification',
      serviceId: 'hs-classification',
      basePrice: 200,
      professionalPrice: 170,  // 15% off
      premiumPrice: 150,       // 25% off
      description: 'Licensed customs broker classification with audit-proof documentation'
    },
    {
      name: '🚨 Crisis Response Management',
      serviceId: 'crisis-response',
      basePrice: 500,
      professionalPrice: 425,  // 15% off
      premiumPrice: 375,       // 25% off
      description: 'Emergency compliance analysis when tariffs change or shipments are held'
    },
    {
      name: '🔍 Supplier Sourcing',
      serviceId: 'supplier-sourcing',
      basePrice: 450,
      professionalPrice: 383,  // 15% off
      premiumPrice: 338,       // 25% off
      description: 'AI-powered supplier discovery validated by Mexico B2B expert'
    },
    {
      name: '🏭 Manufacturing Feasibility',
      serviceId: 'manufacturing-feasibility',
      basePrice: 650,
      professionalPrice: 552,  // 15% off
      premiumPrice: 488,       // 25% off
      description: 'Comprehensive feasibility analysis combining AI research with manufacturing expertise'
    },
    {
      name: '🚀 Market Entry Strategy',
      serviceId: 'market-entry',
      basePrice: 550,
      professionalPrice: 467,  // 15% off
      premiumPrice: 412,       // 25% off
      description: 'AI market intelligence validated by on-the-ground Mexico business expertise'
    }
  ]

  return (
    <>
      <Head>
        <title>USMCA Compliance Platform Pricing | Affordable Plans for Small Importers</title>
        <meta name="description" content="Affordable USMCA compliance for small importers. Plans starting at $99/month with expert support from licensed customs brokers. Save $10k-20k/year in time." />
        <meta name="keywords" content="USMCA compliance pricing, trade compliance software cost, HS code classification pricing, small business trade platform, affordable customs broker" />
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
            <Link href="/services" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Services</Link>
            <Link href="/pricing" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/usmca-workflow" className="nav-cta-button" onClick={() => setMobileMenuOpen(false)}>Start Analysis</Link>
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
            For Small <span className="hero-gradient-text">Importers</span>
          </h2>

          <p className="hero-description-text">
            Affordable USMCA compliance for small businesses who can't afford full-time customs brokers. Plans start at $99/month with expert support from licensed professionals.
          </p>
          
          <div className="hero-button-group">
            <Link
              href="/usmca-workflow"
              className="hero-primary-button"
              aria-label="Start USMCA analysis"
            >
              Start Analysis
            </Link>
            <Link
              href="#pricing"
              className="hero-secondary-button"
              aria-label="View pricing plans"
            >
              View Plans
            </Link>
          </div>
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
                className={billingPeriod === 'monthly' ? 'hero-primary-button' : 'hero-secondary-button'}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={billingPeriod === 'annual' ? 'hero-primary-button' : 'hero-secondary-button'}
              >
                Annual (Save up to 20%)
              </button>
            </div>
          </div>

          <div className="grid-3-cols">
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
                  {billingPeriod === 'annual' && (
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

                <button
                  onClick={() => handleSubscribe(plan.tier)}
                  disabled={loading === plan.tier}
                  className="content-card-link btn-primary"
                >
                  {loading === plan.tier ? 'Loading...' : plan.cta}
                </button>
              </div>
            ))}
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
              <h3 className="content-card-title">🔍 AI Supply Chain Analysis</h3>
              <p className="content-card-description">
                AI analyzes your component origins to identify geopolitical risks,
                tariff exposure, and supply chain vulnerabilities. Get specific,
                actionable recommendations based on your actual supply chain.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">📊 Unlimited USMCA Checks</h3>
              <p className="content-card-description">
                Run unlimited qualification analyses. Check every product, every
                scenario, every supplier. Instant AI-powered HS code suggestions
                and qualification calculations. No per-analysis fees.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">💰 ROI for Small Importers</h3>
              <p className="content-card-description">
                DIY USMCA compliance costs $50-100/hr of your time. Hiring a customs
                broker full-time: $60k+/year. Our platform: $299-599/month with
                expert support when you need it. Save $10k-50k per year.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider: App vs Services */}
      <section className="main-content">
        <div className="container-app">
          <div className="alert alert-info">
            <div className="alert-content">
              <div className="alert-title">📱 App vs 🤝 Professional Services</div>
              <div className="text-body">
                <p><strong>App Subscription (above):</strong> Self-service AI tools you use yourself. Run unlimited qualification checks, get AI suggestions, generate certificate templates, receive alerts.</p>
                <p><strong>Professional Services (below):</strong> Jorge & Cristina do the work for you. They complete certificates, validate classifications, find suppliers, and handle crises. Pay only when you need expert help.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Services */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Professional Services (Separate from App)</h2>
            <p className="section-header-subtitle">
              Jorge & Cristina do the work for you - pay only when you need expert help
            </p>
          </div>

          <div className="grid-3-cols">
            {addOns.map((addon, index) => (
              <div key={index} className="content-card">
                <h3 className="content-card-title">{addon.name}</h3>

                <div style={{marginBottom: '12px'}}>
                  <div style={{fontSize: '1.75rem', fontWeight: 'bold', color: '#134169'}}>
                    ${addon.basePrice}
                  </div>
                  <div style={{fontSize: '0.85rem', color: '#6b7280', marginTop: '4px'}}>
                    Professional: <span style={{color: '#16a34a', fontWeight: '600'}}>${addon.professionalPrice}</span> (15% off)
                  </div>
                  <div style={{fontSize: '0.85rem', color: '#6b7280'}}>
                    Premium: <span style={{color: '#16a34a', fontWeight: '600'}}>${addon.premiumPrice}</span> (25% off)
                  </div>
                </div>

                <p className="content-card-description">{addon.description}</p>
                <Link href="/services/request-form" className="btn-primary">
                  Request Service
                </Link>
              </div>
            ))}
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
                Subscribe to start using AI tools immediately. Run your first USMCA analysis, get HS code suggestions, generate certificate templates, and receive trade alerts. Professional services charged separately as needed.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">What makes your professional services different?</h3>
              <p className="content-card-description">
                Professional services by licensed customs broker (17 years logistics experience) and Mexico B2B specialist (4+ years proven sales track record). We limit monthly service capacity to ensure personalized attention and quality for every client.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Why use professional services?</h3>
              <p className="content-card-description">
                SMBs can't complete certificates themselves without costly mistakes. Our experts prevent disasters and save months of research.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">What's included in my subscription vs paid separately?</h3>
              <p className="content-card-description">
                <strong>Subscription ($99-599/mo):</strong> AI tools for qualification checks, HS code suggestions, certificate templates, and alerts (10/mo on Starter, unlimited on Professional/Premium). <strong>Professional Services:</strong> Paid separately when you need Jorge or Cristina to do work for you. Professional tier gets 15% discount, Premium gets 25% discount.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Strategy */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">The Honest Strategy</h2>
            <p className="section-header-subtitle">
              Low-risk start, pay as you grow, expert help prevents disasters
            </p>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <h3 className="content-card-title">Month 1: Start with Starter</h3>
              <p className="content-card-description">$99/month for 10 analyses - learn the basics and test USMCA qualification</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Month 2-3: Upgrade to Professional</h3>
              <p className="content-card-description">$299/month for unlimited analyses + 15% service discount when you need expert help</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Need Suppliers?</h3>
              <p className="content-card-description">$450 base / $383 Professional / $338 Premium - Get vetted Mexico partners validated by B2B expert</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Need Certificates?</h3>
              <p className="content-card-description">$250 base / $212 Professional / $188 Premium - Licensed customs broker validation</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Crisis Response?</h3>
              <p className="content-card-description">$500 base / $425 Professional / $375 Premium - Emergency compliance when tariffs change</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Upgrade to Premium</h3>
              <p className="content-card-description">$599/month - 25% service discount + quarterly strategy calls with Jorge & Cristina</p>
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
              Subscribe to access professional USMCA compliance tools and expert support from licensed customs brokers
            </p>
            <div className="hero-button-group">
              <Link
                href="/usmca-workflow"
                className="hero-primary-button"
                aria-label="Start USMCA analysis"
              >
                Start USMCA Analysis
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}