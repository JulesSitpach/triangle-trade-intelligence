import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function ProfessionalServices() {
  const [isClient, setIsClient] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const serviceTiers = [
    {
      name: 'USMCA Certificate Completion',
      price: '$200 per certificate',
      description: 'Professional completion of your USMCA certificate from your product data.',
      features: [
        'Expert completes your USMCA certificate',
        'Turnaround: 3-5 business days',
        'Capacity: 40 certificates/month',
        'Prevents costly mistakes',
        'Professional documentation',
        'Compliance verification'
      ]
    },
    {
      name: 'HS Code Classification & Verification',
      price: '$150 per product',
      description: 'Professional HS code research and verification with complete documentation.',
      features: [
        'Professional HS code research',
        'Verification with documentation',
        'Justification documentation',
        'Capacity: 60 classifications/month',
        'Prevents thousands in penalties',
        'Expert validation'
      ]
    },
    {
      name: 'Mexico Supplier Vetting & Introduction',
      price: '$750 per supplier',
      description: 'Research, vet, and introduce verified Mexico/Latin America suppliers.',
      features: [
        'Supplier research and vetting',
        'Verified supplier profiles',
        'Introduction call included',
        'Capacity: 8-10 suppliers/month',
        'Saves months of research',
        'Prevents bad partnerships'
      ]
    },
    {
      name: 'Mexico Market Entry Strategy',
      price: '$400/hour (2-hour minimum)',
      description: 'Strategic consultation for entering Mexico/Latin America markets.',
      features: [
        'Market entry strategy consultation',
        'Written market entry plan',
        'Supplier recommendations',
        'Capacity: 15 hours/month available',
        'Premium strategy work',
        'Latin America specialist'
      ]
    },
    {
      name: 'Partnership Intelligence Briefing',
      price: '$300/month',
      description: 'Monthly report on Canada-Mexico partnership opportunities.',
      features: [
        'Monthly partnership opportunities report',
        '2-page actionable briefings',
        'CPKC and TC Energy deal tracking',
        'Capacity: Scalable to 20+ clients',
        'Real-time intelligence',
        '$60B+ in tracked partnerships'
      ]
    },
    {
      name: 'Customs Clearance Support',
      price: '$300 per shipment',
      description: 'Document review, customs issue resolution, expedited clearance.',
      features: [
        'Document review and validation',
        'Customs issue resolution',
        'Expedited clearance support',
        'Emergency rate: $500 same-day',
        'Capacity: 30 shipments/month',
        'Prevents costly delays'
      ]
    },
    {
      name: 'Crisis Response (Tariff Changes)',
      price: '$500 per incident',
      description: 'Emergency tariff analysis + action plan when regulations change.',
      features: [
        'Emergency tariff analysis',
        'Action plan development',
        'Same day for subscribers',
        '24hrs for others',
        'Capacity: 15 incidents/month',
        'Premium crisis response'
      ]
    }
  ]

  const expertise = [
    {
      icon: 'TT',
      title: 'Transparent Team',
      description: '3-person team with clear capacity limits. No overselling, no false promises - just honest service delivery.'
    },
    {
      icon: 'MX',
      title: 'Mexico Specialist',
      description: 'Focus on Mexico routing and Latin America partnerships. Specialized knowledge in USMCA triangle routing opportunities.'
    },
    {
      icon: 'CB',
      title: 'Customs Brokerage',
      description: 'Licensed customs clearance support with real capacity for 30 shipments/month and emergency same-day service.'
    },
    {
      icon: 'PA',
      title: 'Pay As You Grow',
      description: 'Start with $99 app trial, pay for services as needed. No long contracts, transparent pricing structure.'
    }
  ]

  return (
    <>
      <Head>
        <title>Expert USMCA Consulting Services | Implementation & Training Support</title>
        <meta name="description" content="Professional USMCA consulting, implementation support, and compliance training from certified trade experts. Custom solutions for enterprise manufacturers." />
        <meta name="keywords" content="USMCA consulting, trade compliance training, customs broker services, implementation support, audit preparation" />
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
            Expert USMCA Consulting Services
          </div>
          
          <h1 className="hero-main-title">
            Professional Trade Services
          </h1>
          <h2 className="hero-sub-title">
            Expert <span className="hero-gradient-text">Implementation</span>
          </h2>
          
          <p className="hero-description-text">
            Professional consulting, implementation support, and compliance training from certified trade experts. Custom solutions designed for enterprise manufacturers and importers.
          </p>
          
          <div className="hero-button-group">
            <Link 
              href="/usmca-workflow" 
              className="hero-primary-button"
              aria-label="Schedule expert consultation"
            >
              Schedule Consultation
            </Link>
            <Link 
              href="#services" 
              className="hero-secondary-button"
              aria-label="View all services"
            >
              View Services
            </Link>
          </div>
        </div>
      </section>

      {/* Service Tiers */}
      <section className="main-content" id="services">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Latin America Trade Services & Customs Brokerage</h2>
            <p className="section-header-subtitle">
              Expert Mexico routing services with transparent capacity limits - honest about being a 3-person team
            </p>
          </div>

          <div className="grid-3-cols">
            {serviceTiers.map((service, index) => (
              <div key={index} className="content-card">
                <h3 className="content-card-title">{service.name}</h3>
                <p className="text-body">{service.price}</p>
                <p className="content-card-description">{service.description}</p>

                <div>
                  {service.features.map((feature, idx) => (
                    <p key={idx} className="text-body">
                      ✓ {feature}
                    </p>
                  ))}
                </div>

                <Link href="/usmca-workflow" className="content-card-link">
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise Areas */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Why Choose Our Services</h2>
            <p className="section-header-subtitle">
              Honest about our capacity, focused on Mexico expertise, transparent pricing with no hidden fees
            </p>
          </div>

          <div className="grid-2-cols">
            {expertise.map((expert, index) => (
              <div key={index} className="content-card">
                <div className="content-card-icon">{expert.icon}</div>
                <h3 className="content-card-title">{expert.title}</h3>
                <p className="content-card-description">{expert.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Honest Business Reality */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Honest Business Reality</h2>
            <p className="section-header-subtitle">
              Transparent about being a 3-person team targeting ~$89K/month = $1.07M/year revenue
            </p>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <h3 className="content-card-title">App Revenue (Lead Generation)</h3>
              <p className="content-card-description">~$37K/month from Mexico routing app subscriptions</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Services Revenue (High Margin)</h3>
              <p className="content-card-description">~$52K/month from Latin America trade services and customs brokerage</p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">What We Don't Offer</h3>
              <p className="content-card-description">No training programs, 24/7 support, custom development, or on-site visits</p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Approach */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Our Service Approach</h2>
            <p className="section-header-subtitle">
              Low-risk start, transparent capacity, pay-as-you-grow with expert Mexico routing guidance
            </p>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <h3 className="content-card-title">1. Start with App Trial</h3>
              <p className="content-card-description">
                Begin with $99-$299 Mexico routing app to test our platform and understand your needs before committing to services.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">2. Pay for What You Need</h3>
              <p className="content-card-description">
                As you grow, pay for specific services: suppliers ($750), certificates ($200), clearance support ($300), intelligence ($300/month).
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">3. Transparent Limits</h3>
              <p className="content-card-description">
                We're honest about capacity: 40 certificates/month, 8-10 suppliers/month, 30 shipments/month, 15 crisis responses/month.
              </p>
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
              Schedule a consultation with our certified trade experts to discuss your compliance needs and implementation requirements
            </p>
            <div className="hero-button-group">
              <Link 
                href="/usmca-workflow" 
                className="hero-primary-button"
                aria-label="Schedule expert consultation"
              >
                Schedule Consultation
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