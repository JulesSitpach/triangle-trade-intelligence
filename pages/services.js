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
      name: 'USMCA Certificate Generation',
      serviceId: 'usmca-certificate',
      basePrice: 250,
      professionalPrice: 212,  // 15% off
      premiumPrice: 188,       // 25% off
      description: 'Professional USMCA certificate with regulatory compliance validation.',
      expert: 'Compliance Services - Licensed Customs Broker',
      features: [
        'Avoid 35% tariffs with proper USMCA compliance',
        'Professional liability coverage',
        'Zero risk of customs rejection',
        'Expert validation of North American content',
        'Complete USMCA Certificate of Origin',
        'Delivered within 24-48 hours'
      ]
    },
    {
      name: 'HS Code Classification',
      serviceId: 'hs-classification',
      basePrice: 200,
      professionalPrice: 170,  // 15% off
      premiumPrice: 150,       // 25% off
      description: 'Licensed customs broker classification with audit-proof documentation.',
      expert: 'Compliance Services - Licensed Customs Broker',
      features: [
        'Audit-proof classifications',
        'Minimize duty payments legally',
        'Avoid costly reclassification penalties',
        'Expert research and documentation',
        'Verified HS code with supporting rationale',
        'Delivered within 1-2 business days'
      ]
    },
    {
      name: 'Crisis Response Management',
      serviceId: 'crisis-response',
      basePrice: 500,
      professionalPrice: 425,  // 15% off
      premiumPrice: 375,       // 25% off
      description: 'Emergency compliance analysis when tariffs change or shipments are held.',
      expert: 'Compliance Services - Licensed Customs Broker',
      features: [
        'Emergency 24-48 hour response',
        'Immediate action plan to minimize damage',
        'Root cause analysis and prevention',
        'Direct expert consultation',
        'Emergency compliance analysis',
        'Direct expert support until resolved'
      ]
    },
    {
      name: 'Supplier Sourcing',
      serviceId: 'supplier-sourcing',
      basePrice: 450,
      professionalPrice: 383,  // 15% off
      premiumPrice: 338,       // 25% off
      description: 'AI-powered supplier discovery validated by Mexico B2B expert.',
      expert: 'Mexico Trade Services - B2B Sales Expert',
      features: [
        'AI-powered supplier discovery with web search',
        'Expert validates findings with industry knowledge',
        'Bilingual advantage for Mexico sourcing',
        'AI supplier analysis validated by expert',
        'Strategic recommendations report',
        'Analysis completed within 3-5 business days'
      ]
    },
    {
      name: 'Manufacturing Feasibility',
      serviceId: 'manufacturing-feasibility',
      basePrice: 650,
      professionalPrice: 552,  // 15% off
      premiumPrice: 488,       // 25% off
      description: 'Comprehensive feasibility analysis combining AI research with manufacturing expertise.',
      expert: 'Mexico Trade Services - B2B Sales Expert',
      features: [
        'Comprehensive AI feasibility analysis',
        'Expert validates locations and cost estimates',
        'Risk assessment with mitigation strategies',
        'USMCA qualification strategy included',
        'Financial projections and timeline',
        'Analysis completed within 5-7 business days'
      ]
    },
    {
      name: 'Market Entry Strategy',
      serviceId: 'market-entry',
      basePrice: 550,
      professionalPrice: 467,  // 15% off
      premiumPrice: 412,       // 25% off
      description: 'AI market intelligence validated by on-the-ground Mexico business expertise.',
      expert: 'Mexico Trade Services - B2B Sales Expert',
      features: [
        'AI-powered market research and analysis',
        'Expert validates opportunities with local knowledge',
        'Competitive landscape assessment',
        'Entry strategy with actionable roadmap',
        'Market opportunity assessment',
        'Analysis completed within 3-5 business days'
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
        <meta name="description" content="Professional USMCA consulting, implementation support, and compliance training from certified trade experts. Affordable solutions for small manufacturers and importers." />
        <meta name="keywords" content="USMCA consulting, trade compliance training, customs broker services, implementation support, audit preparation" />
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
            USMCA Qualification Problem Solving
          </div>

          <h1 className="hero-main-title">
            Don't Qualify? We Can Fix That
          </h1>
          <h2 className="hero-sub-title">
            Expert <span className="hero-gradient-text">Supply Chain Restructuring</span>
          </h2>

          <p className="hero-description-text">
            Failed USMCA qualification? Facing trade risks? Need to restructure through Mexico?
            Licensed customs brokers and Mexico trade specialists help you achieve qualification and maintain compliance.
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
            <h2 className="section-header-title">Restructure Your Supply Chain to Achieve USMCA Qualification</h2>
            <p className="section-header-subtitle">
              Licensed experts fix qualification issues, respond to trade crises, and help you restructure operations through Mexico
            </p>
          </div>

          <div className="grid-3-cols">
            {serviceTiers.map((service, index) => (
              <div key={index} className="content-card">
                <h3 className="content-card-title">{service.name}</h3>

                <div style={{marginBottom: '12px'}}>
                  <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#134169'}}>
                    ${service.basePrice}
                  </div>
                  <div style={{fontSize: '0.85rem', color: '#6b7280', marginTop: '4px'}}>
                    Professional: <span style={{color: '#16a34a', fontWeight: '600'}}>${service.professionalPrice}</span> (15% off)
                  </div>
                  <div style={{fontSize: '0.85rem', color: '#6b7280'}}>
                    Premium: <span style={{color: '#16a34a', fontWeight: '600'}}>${service.premiumPrice}</span> (25% off)
                  </div>
                </div>

                {service.expert && (
                  <p className="content-card-description" style={{fontSize: '0.9rem', marginBottom: '8px'}}>{service.expert}</p>
                )}
                <p className="content-card-description">{service.description}</p>

                <div style={{marginTop: '16px'}}>
                  {service.features.map((feature, idx) => (
                    <p key={idx} className="text-body" style={{marginBottom: '4px'}}>
                      ✓ {feature}
                    </p>
                  ))}
                </div>

                <Link href="/services/request-form" className="btn-primary" style={{marginTop: '16px', display: 'inline-block'}}>
                  Request Service
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
            <h2 className="section-header-title">When You Need Expert Help</h2>
            <p className="section-header-subtitle">
              Our workflow shows qualification issues - our experts fix them through Mexico supply chain restructuring
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
              <h3 className="content-card-title">1. Start with Starter ($99/mo)</h3>
              <p className="content-card-description">
                Begin with $99/month Starter tier for 10 USMCA analyses. Test our platform and understand your qualification issues before upgrading.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">2. Upgrade for Discounts</h3>
              <p className="content-card-description">
                Professional ($299/mo) gets 15% off all services. Premium ($599/mo) gets 25% off plus quarterly strategy calls with Jorge & Cristina.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">3. Pay for Expert Help</h3>
              <p className="content-card-description">
                Services range from $200-$650 base price. Subscribers save 15-25% when they need certificates, supplier sourcing, or crisis response.
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
              <h3 className="section-header-title">Triangle Trade Intelligence</h3>
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
              © 2024 Triangle Trade Intelligence. All rights reserved.
            </p>
            <p className="text-body">
              Professional USMCA compliance for small manufacturers and importers.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}