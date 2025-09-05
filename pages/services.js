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
      name: 'Compliance Consultation',
      price: '$150/hour',
      description: 'Expert trade classification review and optimization strategies with certified customs professionals.',
      features: [
        'One-on-one expert consultation',
        'Trade classification review',
        'USMCA optimization strategies',
        'Customs compliance guidance',
        'Documentation review',
        'Strategic planning support'
      ]
    },
    {
      name: 'Implementation Support',
      price: 'From $2,500',
      description: 'Custom workflow integration and system deployment with dedicated technical support.',
      features: [
        'Custom API integration',
        'Workflow configuration',
        'System deployment',
        'Technical documentation',
        'User training sessions',
        'Go-live support'
      ]
    },
    {
      name: 'Team Training Programs',
      price: '$1,200/session',
      description: 'USMCA compliance certification for internal teams with comprehensive training materials.',
      features: [
        'Up to 20 participants',
        'USMCA compliance certification',
        'Interactive workshops',
        'Training materials included',
        'Progress assessments',
        'Ongoing support access'
      ]
    },
    {
      name: 'Audit Preparation',
      price: 'From $3,000',
      description: 'Complete documentation review and customs compliance validation for audit readiness.',
      features: [
        'Documentation audit',
        'Compliance gap analysis',
        'Risk assessment',
        'Remediation planning',
        'Mock audit sessions',
        'CBP interaction support'
      ]
    }
  ]

  const expertise = [
    {
      icon: 'CE',
      title: 'Certified Experts',
      description: 'Licensed customs brokers and trade compliance professionals with decades of experience in USMCA regulations.'
    },
    {
      icon: 'CS',
      title: 'Custom Solutions',
      description: 'Tailored compliance strategies designed specifically for your industry, products, and business requirements.'
    },
    {
      icon: 'ES',
      title: 'Enterprise Support',
      description: 'Dedicated account management and priority support for large-scale implementations and ongoing operations.'
    },
    {
      icon: 'PI',
      title: 'Proven Implementation',
      description: 'Successfully deployed compliance solutions for Fortune 500 manufacturers across diverse industries.'
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
            <h2 className="section-header-title">Professional Service Offerings</h2>
            <p className="section-header-subtitle">
              Comprehensive consulting and implementation services tailored to your compliance needs and business objectives
            </p>
          </div>

          <div className="grid-2-cols">
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
            <h2 className="section-header-title">Our Expertise</h2>
            <p className="section-header-subtitle">
              Professional credentials and proven experience delivering enterprise-grade compliance solutions
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

      {/* Success Stories */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Client Success Metrics</h2>
          </div>
          
          <div className="grid-3-cols">
            <div className="content-card">
              <h3 className="content-card-title">Clients Served</h3>
              <p className="content-card-description">500+ enterprise manufacturers and importers successfully served</p>
            </div>
            
            <div className="content-card">
              <h3 className="content-card-title">Savings Generated</h3>
              <p className="content-card-description">$50M+ total client tariff savings achieved through expert guidance</p>
            </div>
            
            <div className="content-card">
              <h3 className="content-card-title">Success Rate</h3>
              <p className="content-card-description">98% successful implementations with 25+ years combined team expertise</p>
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Process */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Our Implementation Process</h2>
            <p className="section-header-subtitle">
              Structured approach to ensure successful deployment and adoption of compliance solutions
            </p>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <h3 className="content-card-title">1. Discovery & Assessment</h3>
              <p className="content-card-description">
                Comprehensive analysis of your current processes, compliance requirements, and optimization opportunities.
              </p>
            </div>
            
            <div className="content-card">
              <h3 className="content-card-title">2. Custom Configuration</h3>
              <p className="content-card-description">
                Platform customization and workflow configuration tailored to your specific business requirements and industry needs.
              </p>
            </div>
            
            <div className="content-card">
              <h3 className="content-card-title">3. Training & Go-Live</h3>
              <p className="content-card-description">
                Comprehensive team training, system deployment, and ongoing support to ensure successful adoption and operation.
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