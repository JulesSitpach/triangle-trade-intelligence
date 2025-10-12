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
      professionalPrice: 200,  // Monthly retainer (no percentage discount applies)
      premiumPrice: 200,       // Monthly retainer (no percentage discount applies)
      description: 'Ongoing monthly retainer for emergency response and regulatory monitoring led by compliance expert',
      recurring: true
    }
  ]

  return (
    <>
      <Head>
        <title>USMCA Compliance Platform Pricing | Affordable Plans for Small Importers</title>
        <meta name="description" content="Affordable USMCA compliance for small importers. Plans starting at $99/month with expert trade consulting support. Save $10k-20k/year in time." />
        <meta name="keywords" content="USMCA compliance pricing, trade compliance software cost, HS code classification pricing, small business trade platform, trade consulting services" />
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
            Affordable USMCA compliance for small businesses who can't afford full-time trade compliance teams. Plans start at $99/month with expert trade consulting support.
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
                <p><strong>Professional Services (below):</strong> Our expert team does the work for you. They complete assessments, validate strategies, find suppliers, and handle crises. Pay only when you need expert help.</p>
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
              Our expert team does the work for you - pay only when you need help
            </p>
          </div>

          <div className="grid-3-cols">
            {addOns.map((addon, index) => (
              <div key={index} className="content-card">
                <h3 className="content-card-title">{addon.name}</h3>

                <div style={{marginBottom: '12px'}}>
                  <div style={{fontSize: '1.75rem', fontWeight: 'bold', color: '#134169'}}>
                    ${addon.basePrice}{addon.recurring ? '/mo' : ''}
                  </div>
                  {!addon.recurring && addon.basePrice !== 99 && (
                    <>
                      <div style={{fontSize: '0.85rem', color: '#6b7280', marginTop: '4px'}}>
                        Professional: <span style={{color: '#16a34a', fontWeight: '600'}}>${addon.professionalPrice}</span> (15% off)
                      </div>
                      <div style={{fontSize: '0.85rem', color: '#6b7280'}}>
                        Premium: <span style={{color: '#16a34a', fontWeight: '600'}}>${addon.premiumPrice}</span> (25% off)
                      </div>
                    </>
                  )}
                  {addon.basePrice === 99 && (
                    <div style={{fontSize: '0.85rem', color: '#6b7280', marginTop: '4px'}}>
                      No subscriber discounts (entry service)
                    </div>
                  )}
                  {addon.recurring && (
                    <div style={{fontSize: '0.85rem', color: '#6b7280', marginTop: '4px'}}>
                      Monthly retainer (no percentage discount)
                    </div>
                  )}
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
              <h3 className="content-card-title">Start with Health Check</h3>
              <p className="content-card-description">$99 (no discounts) - Expert team assesses your trade opportunities</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Need USMCA Help?</h3>
              <p className="content-card-description">$175 base / $149 Professional / $131 Premium - Compliance-led qualification roadmap</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Supply Chain Issues?</h3>
              <p className="content-card-description">$450 base / $383 Professional / $338 Premium - Sourcing specialist finds alternative Mexico suppliers</p>
            </div>

            <div className="content-card">
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