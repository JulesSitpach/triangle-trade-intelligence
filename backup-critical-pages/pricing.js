import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Pricing() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const plans = [
    {
      name: 'Professional',
      price: '$299',
      period: 'per month',
      description: 'Perfect for growing businesses with regular compliance needs',
      features: [
        'Unlimited HS code classifications',
        'Basic compliance checking',
        'Standard certificate generation',
        'Email support',
        'API access (1000 calls/month)',
        'Basic reporting dashboard'
      ],
      cta: 'Start Professional Trial',
      popular: false
    },
    {
      name: 'Enterprise',
      price: '$799',
      period: 'per month',
      description: 'Advanced features for large-scale operations and integrations',
      features: [
        'Priority API access (unlimited)',
        'Advanced analytics dashboard',
        'Custom integration support',
        'Dedicated phone support',
        'White-label certificates',
        'Advanced reporting & analytics',
        'Multi-user team management',
        'SLA guarantees'
      ],
      cta: 'Contact Sales',
      popular: true
    },
    {
      name: 'Enterprise+',
      price: 'Custom',
      period: 'pricing',
      description: 'Fully customized solution for enterprise-scale deployments',
      features: [
        'White-label deployment',
        'On-premise installation',
        'Custom API development',
        'Dedicated account management',
        'Priority feature development',
        'Custom compliance workflows',
        'Advanced security options',
        '24/7 priority support'
      ],
      cta: 'Schedule Consultation',
      popular: false
    }
  ]

  const addOns = [
    {
      name: 'Expert Consultation',
      price: '$150/hour',
      description: 'One-on-one sessions with certified trade experts'
    },
    {
      name: 'Custom Integration',
      price: 'From $2,500',
      description: 'Custom API integration with your existing systems'
    },
    {
      name: 'Team Training',
      price: '$1,200/session',
      description: 'USMCA compliance training for up to 20 team members'
    },
    {
      name: 'Audit Preparation',
      price: '$3,000',
      description: 'Complete documentation review and customs audit prep'
    }
  ]

  return (
    <>
      <Head>
        <title>USMCA Compliance Platform Pricing | Professional & Enterprise Plans</title>
        <meta name="description" content="Transparent pricing for professional USMCA compliance software. Plans starting at $299/month with enterprise API access, priority support, and custom integrations." />
        <meta name="keywords" content="USMCA compliance pricing, trade compliance software cost, HS code classification pricing, enterprise trade platform" />
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
            <Link href="/solutions" className="nav-menu-link">Solutions</Link>
            <Link href="/industries" className="nav-menu-link">Industries</Link>
            <Link href="/intelligence" className="nav-menu-link">Intelligence</Link>
            <Link href="/services" className="nav-menu-link">Services</Link>
            <Link href="/pricing" className="nav-menu-link">Pricing</Link>
            <Link href="/usmca-workflow" className="nav-cta-button">Start Analysis</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="main-content" style={{ paddingTop: '120px' }}>
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">
              Transparent Pricing for Professional Trade Compliance
            </h1>
            <p className="section-header-subtitle">
              Choose the plan that fits your business needs. All plans include our AI-enhanced classification system and government-verified trade data.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="main-content">
        <div className="container-app">
          <div className="grid-3-cols">
            {plans.map((plan, index) => (
              <div key={index} className={`content-card ${plan.popular ? 'analysis' : ''}`} style={{ position: 'relative' }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--blue-600)',
                    color: 'white',
                    padding: '0.25rem 1rem',
                    borderRadius: '999px',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    Most Popular
                  </div>
                )}
                
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h3 className="content-card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{plan.name}</h3>
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--navy-900)' }}>{plan.price}</span>
                    {plan.period && <span style={{ color: 'var(--gray-600)', marginLeft: '0.5rem' }}>/{plan.period}</span>}
                  </div>
                  <p className="content-card-description" style={{ textAlign: 'center' }}>{plan.description}</p>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} style={{ padding: '0.5rem 0', color: 'var(--gray-700)' }}>
                      <span style={{ color: 'var(--green-600)', marginRight: '0.5rem' }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link 
                  href="/usmca-workflow" 
                  className={plan.popular ? 'btn-primary btn-large' : 'btn-secondary btn-large'}
                  style={{ width: '100%', textAlign: 'center', display: 'block' }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-on Services */}
      <section className="main-content" style={{ backgroundColor: 'var(--gray-50)' }}>
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Professional Services Add-Ons</h2>
            <p className="section-header-subtitle">
              Enhance your compliance program with expert consulting and custom implementation services
            </p>
          </div>

          <div className="grid-2-cols">
            {addOns.map((addon, index) => (
              <div key={index} className="content-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <h3 className="content-card-title">{addon.name}</h3>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--blue-600)' }}>
                    {addon.price}
                  </div>
                </div>
                <p className="content-card-description">{addon.description}</p>
                <Link href="/usmca-workflow" className="content-card-link">
                  Learn More
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
              <h3 className="content-card-title">Is there a free trial?</h3>
              <p className="content-card-description">
                Yes! All plans include a 14-day free trial with full access to features. No credit card required to start.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Can I upgrade or downgrade anytime?</h3>
              <p className="content-card-description">
                Absolutely. You can change plans at any time, and we'll prorate the billing automatically.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">What's included in API access?</h3>
              <p className="content-card-description">
                All 42 specialized endpoints, including HS classification, USMCA qualification, and certificate generation APIs.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Do you offer custom enterprise pricing?</h3>
              <p className="content-card-description">
                Yes, we offer volume discounts and custom pricing for large enterprises. Contact our sales team for details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="main-content" style={{ backgroundColor: 'var(--navy-900)', color: 'white' }}>
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title" style={{ color: 'white' }}>
              ROI Calculator: See Your Savings
            </h2>
            <p className="section-header-subtitle" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Most clients save 10-25% on their total import costs, typically paying for the platform within the first month
            </p>
          </div>

          <div className="grid-3-cols">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--green-400)', marginBottom: '0.5rem' }}>
                $250K+
              </div>
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Average Annual Savings</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>For $5M+ import volume</p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--blue-400)', marginBottom: '0.5rem' }}>
                30 Days
              </div>
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Typical ROI Timeline</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>Platform pays for itself</p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--amber-400)', marginBottom: '0.5rem' }}>
                95%
              </div>
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Customer Satisfaction</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>Enterprise client retention</p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/usmca-workflow" className="btn-primary btn-large">
              Calculate Your Savings
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}