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
      description: 'Essential USMCA tools for small importers avoiding 35% tariffs',
      features: [
        'Basic Mexico routing calculator',
        '5 HS code lookups per month',
        'Basic email alerts',
        'Certificate templates (self-complete)'
      ],
      cta: 'Start Starter Trial',
      popular: false
    },
    {
      name: 'Professional',
      price: '$299',
      period: 'per month',
      description: 'Advanced routing analysis with real-time tariff alerts',
      features: [
        'Advanced routing analysis',
        '25 HS code lookups per month',
        'Real-time alerts (email + SMS)',
        'Certificate wizard (guided self-complete)'
      ],
      cta: 'Start Professional Trial',
      popular: true
    },
    {
      name: 'Business',
      price: '$599',
      period: 'per month',
      description: 'Complete USMCA compliance solution for high-volume importers',
      features: [
        'Unlimited HS code lookups',
        'All alert channels',
        'Certificate wizard + validation'
      ],
      cta: 'Start Business Trial',
      popular: false
    }
  ]

  const addOns = [
    {
      name: '📜 USMCA Certificate Generation',
      price: '$250',
      description: 'Professional USMCA certificate with regulatory compliance validation by licensed customs broker'
    },
    {
      name: '🔍 HS Code Classification',
      price: '$200',
      description: 'Licensed customs broker classification with audit-proof documentation'
    },
    {
      name: '🚨 Crisis Response Management',
      price: '$400',
      description: 'Emergency compliance analysis when tariffs change or shipments are held'
    },
    {
      name: '🔍 Supplier Sourcing',
      price: '$450',
      description: 'AI-powered supplier discovery validated by Mexico B2B expert'
    },
    {
      name: '🏭 Manufacturing Feasibility',
      price: '$650',
      description: 'Comprehensive feasibility analysis combining AI research with manufacturing expertise'
    },
    {
      name: '🚀 Market Entry Strategy',
      price: '$550',
      description: 'AI market intelligence validated by on-the-ground Mexico business expertise'
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

      {/* Professional Services */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Professional Services</h2>
            <p className="section-header-subtitle">
              Expert Latin America trade services and customs brokerage support
            </p>
          </div>

          <div className="grid-3-cols">
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
              <h3 className="content-card-title">What service capacity do you have?</h3>
              <p className="content-card-description">
                We're transparent about being a 3-person team. Certificate completion: 40/month, Supplier vetting: 8-10/month, Crisis response: 15 incidents/month.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Why use professional services?</h3>
              <p className="content-card-description">
                SMBs can't complete certificates themselves without costly mistakes. Our experts prevent disasters and save months of research.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">How does the app → services funnel work?</h3>
              <p className="content-card-description">
                Start with $99 app trial, then pay for suppliers ($750 each), certificates ($200 each), and ongoing intelligence ($300/month) as you grow.
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
              <h3 className="content-card-title">Month 1-2: Try the App</h3>
              <p className="content-card-description">Start with $99-$299 app, attempt everything yourself and learn the basics</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Month 2-3: Need Suppliers?</h3>
              <p className="content-card-description">Pay $750 × 3 suppliers = $2,250 to get vetted Mexico partners</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Month 3+: Need Certificates?</h3>
              <p className="content-card-description">Pay $200 × 5 certificates = $1,000 for professional completion</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Month 4: Customs Issues?</h3>
              <p className="content-card-description">Pay $300 per shipment for clearance support when problems arise</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Month 6+: Ongoing Intelligence</h3>
              <p className="content-card-description">Pay $300/month for partnership intelligence and market insights</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">No Long Contracts</h3>
              <p className="content-card-description">Transparent capacity limits, pay as you grow, no hidden fees</p>
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