import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Pricing() {
  const [isClient, setIsClient] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const plans = [
    {
      name: 'Starter',
      price: '$99',
      period: 'per month',
      description: 'Basic Mexico routing calculator for testing and small scale use',
      features: [
        'Basic Mexico routing calculator',
        '5 HS code lookups per month',
        'Basic tariff alerts (email only)',
        'Certificate templates (you complete yourself)',
        'Email support (no phone)',
        'Limited lookups force upgrade when you get serious'
      ],
      cta: 'Start Starter Trial',
      popular: false
    },
    {
      name: 'Professional',
      price: '$299',
      period: 'per month',
      description: 'Advanced Mexico routing analysis with real-time alerts',
      features: [
        'Advanced Mexico routing analysis',
        '25 HS code lookups per month',
        'Real-time crisis alerts (email + SMS)',
        'Certificate wizard (guidance but you complete)',
        'Priority email support (24hr response)',
        'Canada-Mexico partnership intelligence alerts',
        'You still need help completing certificates → services'
      ],
      cta: 'Start Professional Trial',
      popular: true
    },
    {
      name: 'Business',
      price: '$599',
      period: 'per month',
      description: 'Unlimited lookups with completed certificates included',
      features: [
        'Unlimited HS code lookups',
        'Real-time alerts (all channels)',
        'Certificate wizard + validation',
        'Email support (4hr response)',
        '2 completed certificates included per month',
        'Monthly partnership intelligence report',
        'Crisis response playbook',
        'Includes some certificates to get you hooked'
      ],
      cta: 'Start Business Trial',
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
            <Link href="/solutions" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Solutions</Link>
            <Link href="/industries" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Industries</Link>
            <Link href="/intelligence" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Intelligence</Link>
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
            Enterprise <span className="hero-gradient-text">Pricing</span>
          </h2>
          
          <p className="hero-description-text">
            Choose the plan that fits your business needs. All plans include our AI-enhanced classification system and government-verified trade data with transparent pricing.
          </p>
          
          <div className="hero-button-group">
            <Link 
              href="/usmca-workflow" 
              className="hero-primary-button"
              aria-label="Start free trial"
            >
              Start Free Trial
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
            <h2 className="section-header-title">Choose Your Plan</h2>
            <p className="section-header-subtitle">
              All plans include AI-enhanced classification, government-verified data, and professional support
            </p>
          </div>

          <div className="grid-3-cols">
            {plans.map((plan, index) => (
              <div key={index} className="content-card">
                <h3 className="content-card-title">{plan.name}</h3>
                <p className="text-body">{plan.price} {plan.period && `/ ${plan.period}`}</p>
                <p className="content-card-description">{plan.description}</p>
                
                <div>
                  {plan.features.map((feature, idx) => (
                    <p key={idx} className="text-body">
                      ✓ {feature}
                    </p>
                  ))}
                </div>
                
                <Link href="/usmca-workflow" className="content-card-link">
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-on Services */}
      <section className="main-content gradient-subtle">
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
                <h3 className="content-card-title">{addon.name}</h3>
                <p className="text-body">{addon.price}</p>
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
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">ROI Calculator: See Your Savings</h2>
            <p className="section-header-subtitle">
              Most clients save 10-25% on their total import costs, typically paying for the platform within the first month
            </p>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <h3 className="content-card-title">Average Annual Savings</h3>
              <p className="content-card-description">$250K+ for $5M+ import volume with professional optimization</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Typical ROI Timeline</h3>
              <p className="content-card-description">30 days - platform pays for itself within first month of use</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Customer Satisfaction</h3>
              <p className="content-card-description">95% enterprise client retention with proven results</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">
              Ready to Calculate Your Savings?
            </h2>
            <p className="section-header-subtitle">
              Start your free trial and see how much you can save with professional USMCA compliance
            </p>
            <div className="hero-button-group">
              <Link 
                href="/usmca-workflow" 
                className="hero-primary-button"
                aria-label="Calculate savings with free trial"
              >
                Calculate Your Savings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="content-card">
        <div className="container-app">
          {/* Footer Content */}
          <div className="grid-3-cols">
            {/* Company Information */}
            <div>
              <h3 className="section-header-title">TradeFlow Intelligence</h3>
              <p className="text-body">
                Professional USMCA compliance platform delivering trade classification, supply chain optimization, and regulatory guidance for North American manufacturers.
              </p>
            </div>
            
            {/* Solutions Links */}
            <div>
              <h4 className="content-card-title">Solutions</h4>
              <div>
                <p className="text-body">
                  <Link href="/usmca-workflow" className="nav-link">USMCA Analysis</Link>
                </p>
                <p className="text-body">
                  <Link href="/industries" className="nav-link">Industries</Link>
                </p>
                <p className="text-body">
                  <Link href="/services" className="nav-link">Trade Services</Link>
                </p>
                <p className="text-body">
                  <Link href="/pricing" className="nav-link">Pricing</Link>
                </p>
              </div>
            </div>
            
            {/* Company & Legal Links */}
            <div>
              <h4 className="content-card-title">Company</h4>
              <div>
                <p className="text-body">
                  <Link href="/intelligence" className="nav-link">Intelligence</Link>
                </p>
                <p className="text-body">
                  <Link href="/contact" className="nav-link">Contact</Link>
                </p>
                <p className="text-body">
                  <Link href="/privacy-policy" className="nav-link">Privacy Policy</Link>
                </p>
                <p className="text-body">
                  <Link href="/terms-of-service" className="nav-link">Terms of Service</Link>
                </p>
              </div>
            </div>
          </div>
          
          {/* Copyright Bar */}
          <div className="section-header">
            <p className="text-body">
              © 2024 TradeFlow Intelligence. All rights reserved.
            </p>
            <p className="text-body">
              Professional trade compliance platform for enterprise clients.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}