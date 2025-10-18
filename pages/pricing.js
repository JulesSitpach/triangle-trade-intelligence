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
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleSubscribe = async (tier) => {
    try {
      setLoading(tier)

      // Call API to create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Important: include auth cookie
        body: JSON.stringify({
          tier: tier.toLowerCase(),
          billing_period: billingPeriod
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // User-friendly error messages
        if (response.status === 401) {
          alert('Please log in to subscribe. Redirecting to login...')
          router.push('/login?redirect=/pricing')
          return
        }
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
      alert(`Subscription error: ${error.message}\n\nIf this persists, please contact support@triangleintelligence.com`)
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    {
      name: 'Starter',
      tier: 'starter',
      monthlyPrice: 99,
      annualPrice: 950,
      period: billingPeriod === 'monthly' ? 'per month' : 'per year',
      description: 'Essential USMCA compliance tools for Small & Medium importers',
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
      description: '100 analyses/month with AI-powered risk assessment',
      features: [
        '100 USMCA analyses per month',
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
        'Quarterly strategy calls with our expert team',
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
      name: '🏥 Trade Health Check',
      serviceId: 'trade-health-check',
      basePrice: 99,
      professionalPrice: 99,  // No discount on entry service
      premiumPrice: 99,       // No discount on entry service
      description: 'Collaborative assessment by our expert team to identify trade optimization opportunities',
      recurring: false
    },
    {
      name: '📜 USMCA Advantage Sprint',
      serviceId: 'usmca-advantage',
      basePrice: 175,
      professionalPrice: 149,  // 15% off
      premiumPrice: 131,       // 25% off
      description: 'Product audit and USMCA qualification roadmap led by compliance expert with business development support',
      recurring: false
    },
    {
      name: '🔧 Supply Chain Optimization',
      serviceId: 'supply-chain-optimization',
      basePrice: 275,
      professionalPrice: 234,  // 15% off
      premiumPrice: 206,       // 25% off
      description: 'Complete supply chain efficiency audit led by compliance expert with sourcing specialist insights',
      recurring: false
    },
    {
      name: '🚀 Pathfinder Market Entry',
      serviceId: 'pathfinder',
      basePrice: 350,
      professionalPrice: 298,  // 15% off
      premiumPrice: 263,       // 25% off
      description: 'Mexico market entry strategy led by business development specialist with regulatory compliance expertise',
      recurring: false
    },
    {
      name: '🛡️ Supply Chain Resilience',
      serviceId: 'supply-chain-resilience',
      basePrice: 450,
      professionalPrice: 383,  // 15% off
      premiumPrice: 338,       // 25% off
      description: 'Alternative supplier discovery and risk mitigation led by sourcing specialist with compliance verification',
      recurring: false
    },
    {
      name: '🆘 Crisis Navigator',
      serviceId: 'crisis-navigator',
      basePrice: 200,
      professionalPrice: 200,  // No subscriber discount
      premiumPrice: 200,       // No subscriber discount
      description: 'Priority emergency response for urgent trade crises and compliance issues led by compliance expert',
      recurring: false
    }
  ]

  return (
    <>
      <Head>
        <title>USMCA Compliance Platform Pricing | Affordable Plans for Small & Medium Importers</title>
        <meta name="description" content="Affordable USMCA compliance for Small & Medium importers. Plans starting at $99/month with expert trade consulting support. Save $10k-20k/year in time." />
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
            <Link href="/services" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Services</Link>
            <Link href="/pricing" className="nav-menu-link active" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/about" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/signup" className="nav-cta-button" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
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
            For <span className="hero-yellow-highlight">Small & Medium Importers</span>
          </h2>

          <p className="hero-description-text">
            Affordable USMCA compliance for Small & Medium businesses who can't afford full-time trade compliance teams. Plans start at $99/month with expert trade consulting support.
          </p>
          
          <div className="hero-button-group">
            <Link
              href="/signup"
              className="hero-primary-button"
              aria-label="Start free trial - no credit card required"
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

      {/* Sample Certificate - Real Data */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">📜 What You Get: USMCA Certificate of Origin</h2>
            <p className="section-header-subtitle">
              Auto-generated from your compliance analysis - example from RTW Logistics
            </p>
          </div>

          <div className="content-card" style={{maxWidth: '900px', margin: '0 auto', padding: '32px', backgroundColor: '#fff'}}>
            <div style={{border: '2px solid #134169', padding: '24px', borderRadius: '8px'}}>
              <div style={{textAlign: 'center', marginBottom: '24px'}}>
                <h3 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#134169'}}>USMCA CERTIFICATE OF ORIGIN</h3>
                <p style={{fontSize: '0.9rem', color: '#6b7280'}}>Certificate #2025-001-USMCA</p>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                <div>
                  <p style={{fontSize: '0.85rem', fontWeight: '600', color: '#134169'}}>Exporter Name:</p>
                  <p style={{fontSize: '0.9rem'}}>RTW LOGISTICS SA DE CV</p>
                </div>
                <div>
                  <p style={{fontSize: '0.85rem', fontWeight: '600', color: '#134169'}}>Product Description:</p>
                  <p style={{fontSize: '0.9rem'}}>Mobile Smart Phone</p>
                </div>
                <div>
                  <p style={{fontSize: '0.85rem', fontWeight: '600', color: '#134169'}}>HS Code:</p>
                  <p style={{fontSize: '0.9rem'}}>8517.12.00</p>
                </div>
                <div>
                  <p style={{fontSize: '0.85rem', fontWeight: '600', color: '#134169'}}>Business Type:</p>
                  <p style={{fontSize: '0.9rem'}}>Electronics & Technology</p>
                </div>
                <div>
                  <p style={{fontSize: '0.85rem', fontWeight: '600', color: '#134169'}}>Manufacturing Location:</p>
                  <p style={{fontSize: '0.9rem'}}>Mexico</p>
                </div>
                <div>
                  <p style={{fontSize: '0.85rem', fontWeight: '600', color: '#134169'}}>Qualification Status:</p>
                  <p style={{fontSize: '0.9rem', color: '#16a34a', fontWeight: '600'}}>✓ QUALIFIED (100% USMCA Content)</p>
                </div>
              </div>

              <div style={{backgroundColor: '#dcfce7', padding: '12px', borderRadius: '4px', marginBottom: '12px'}}>
                <p style={{fontSize: '0.85rem', fontWeight: '600', color: '#16a34a', marginBottom: '8px'}}>Regional Value Content Calculation:</p>
                <p style={{fontSize: '0.85rem'}}>✓ 100% Mexico (Complete manufacturing and assembly)</p>
                <p style={{fontSize: '0.85rem'}}>✓ Required threshold: 65% (exceeded by 35 points)</p>
                <p style={{fontSize: '0.85rem'}}>✓ Annual trade volume: $600,000</p>
              </div>

              <div style={{backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '4px'}}>
                <p style={{fontSize: '0.85rem', fontWeight: '600', color: '#134169', marginBottom: '4px'}}>Certification:</p>
                <p style={{fontSize: '0.85rem', fontStyle: 'italic'}}>This product qualifies as originating under the USMCA agreement and is eligible for preferential tariff treatment.</p>
              </div>
            </div>
            <p style={{fontSize: '0.85rem', color: '#6b7280', marginTop: '16px', textAlign: 'center', fontStyle: 'italic'}}>
              Professional & Premium subscribers get unlimited certificate generation
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

              <Link href="/services" className="btn-primary" style={{fontSize: '0.9rem'}}>
                Get Expert Help Finding Mexico Suppliers
              </Link>
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
                Professional tier: 100 analyses/month. Premium tier: Unlimited analyses.
                Check multiple products, scenarios, and suppliers. Instant AI-powered HS code suggestions
                and qualification calculations. No hidden per-analysis fees.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">$</div>
              <h3 className="content-card-title">ROI for Small & Medium Importers</h3>
              <p className="content-card-description">
                DIY USMCA compliance costs $50-100/hr of your time. Hiring a customs
                broker full-time: $60k+/year. Our platform: $299-599/month with
                expert support when you need it. Save $10k-50k per year.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Services Callout */}
      <section className="main-content">
        <div className="container-app">
          <div className="alert alert-info">
            <div className="alert-content">
              <div className="alert-title">🤝 Need Expert Help?</div>
              <div className="text-body">
                <p><strong>Professional & Premium subscribers save 15-25% on all expert services.</strong> Our Mexico-based team (Jorge & Cristina) provides trade consulting, USMCA optimization, supplier sourcing, and crisis response - pay only when you need help.</p>
                <Link href="/services" className="btn-primary" style={{marginTop: '12px', display: 'inline-block'}}>
                  View All Professional Services
                </Link>
              </div>
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
                Subscribe to start using AI tools immediately. Run your first USMCA analysis, get HS code suggestions, generate certificate templates, and receive trade alerts. Professional services charged separately as needed.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">What makes your professional services different?</h3>
              <p className="content-card-description">
                Professional services by trade compliance expert (17 years enterprise logistics experience) and Mexico B2B specialist (7+ years SMB operational experience). Team collaboration ensures comprehensive coverage combining compliance expertise with business development skills.
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
                <strong>Subscription ($99-599/mo):</strong> AI tools for qualification checks, HS code suggestions, certificate templates, and alerts (10/mo on Starter, 100/mo on Professional, unlimited on Premium). <strong>Professional Services:</strong> Paid separately when you need Jorge or Cristina to do work for you. Professional tier gets 15% discount, Premium gets 25% discount.
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
              <div className="content-card-icon">1</div>
              <h3 className="content-card-title">Month 1: Start with Starter</h3>
              <p className="content-card-description">$99/month for 10 analyses - learn the basics and test USMCA qualification</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">2</div>
              <h3 className="content-card-title">Month 2-3: Upgrade to Professional</h3>
              <p className="content-card-description">$299/month for 100 analyses/month + 15% service discount when you need expert help</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">H</div>
              <h3 className="content-card-title">Start with Health Check</h3>
              <p className="content-card-description">$99 (no discounts) - Expert team assesses your trade opportunities</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">U</div>
              <h3 className="content-card-title">Need USMCA Help?</h3>
              <p className="content-card-description">$175 base / $149 Professional / $131 Premium - Compliance-led qualification roadmap</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">S</div>
              <h3 className="content-card-title">Supply Chain Issues?</h3>
              <p className="content-card-description">$450 base / $383 Professional / $338 Premium - Sourcing specialist finds alternative Mexico suppliers</p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">P</div>
              <h3 className="content-card-title">Upgrade to Premium</h3>
              <p className="content-card-description">$599/month - 25% service discount + quarterly strategy calls with our expert team</p>
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
              Subscribe to access professional USMCA compliance tools and expert trade consulting support
            </p>
            <div className="hero-button-group">
              <Link
                href="/signup"
                className="hero-primary-button"
                aria-label="Start free trial"
              >
                Get Started
              </Link>
              <Link
                href="/services"
                className="hero-secondary-button"
                aria-label="View professional services"
              >
                View Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}