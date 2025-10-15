import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import LegalDisclaimer from '../components/LegalDisclaimer'
import Footer from '../components/Footer'

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
      name: '🏥 Trade Health Check',
      serviceId: 'trade-health-check',
      basePrice: 99,
      professionalPrice: 99,  // No discount on this service
      premiumPrice: 99,       // No discount on this service
      description: 'Collaborative assessment by Jorge & Cristina to identify trade optimization opportunities.',
      expert: 'Team Collaboration - Jorge & Cristina (50% each)',
      features: [
        'Complete trade health assessment',
        'Prioritized improvement recommendations',
        'Service recommendation strategy',
        '$99 credit toward any follow-up service',
        '1-week delivery timeline',
        'Perfect entry point for new clients'
      ]
    },
    {
      name: '📜 USMCA Advantage Sprint',
      serviceId: 'usmca-advantage',
      basePrice: 175,
      professionalPrice: 149,  // 15% off
      premiumPrice: 131,       // 25% off
      description: 'Product audit and USMCA qualification roadmap led by Cristina with Jorge\'s support.',
      expert: 'Cristina Lead (70%) • Jorge Support (30%)',
      disclaimer: 'For official USMCA certificates, we partner with trade compliance experts',
      features: [
        'Complete USMCA qualification assessment',
        'Compliance gap analysis',
        'Optimization roadmap with implementation guidance',
        'Product audit and documentation review',
        'Delivered within 1 week',
        'Team collaboration ensures comprehensive coverage'
      ]
    },
    {
      name: '🔧 Supply Chain Optimization',
      serviceId: 'supply-chain-optimization',
      basePrice: 275,
      professionalPrice: 234,  // 15% off
      premiumPrice: 206,       // 25% off
      description: 'Complete supply chain efficiency audit led by Cristina with Jorge\'s sourcing insights.',
      expert: 'Cristina Lead (60%) • Jorge Support (40%)',
      features: [
        'AI analysis validated by compliance expert',
        'Cost reduction opportunities identified',
        'Process optimization recommendations',
        'Logistics efficiency improvements',
        'Delivered within 1-2 weeks',
        'Implementation roadmap included'
      ]
    },
    {
      name: '🚀 Pathfinder Market Entry',
      serviceId: 'pathfinder',
      basePrice: 350,
      professionalPrice: 298,  // 15% off
      premiumPrice: 263,       // 25% off
      description: 'Mexico market entry strategy led by Jorge with Cristina\'s regulatory compliance expertise.',
      expert: 'Jorge Lead (65%) • Cristina Support (35%)',
      features: [
        'Complete Mexico market analysis',
        'Distribution partner recommendations',
        '90-day implementation plan',
        'Regulatory requirements validation',
        'Landed cost calculations',
        'Go-to-market presentation delivered'
      ]
    },
    {
      name: '🛡️ Supply Chain Resilience',
      serviceId: 'supply-chain-resilience',
      basePrice: 450,
      professionalPrice: 383,  // 15% off
      premiumPrice: 338,       // 25% off
      description: 'Alternative supplier discovery and risk mitigation led by Jorge with Cristina\'s compliance verification.',
      expert: 'Jorge Lead (60%) • Cristina Support (40%)',
      features: [
        '3-5 verified alternative supplier options',
        'USMCA qualification status for each',
        'Risk mitigation and contingency plan',
        'Supplier capability assessment',
        'Compliance verification included',
        'Delivered within 2-3 weeks'
      ]
    },
    {
      name: '🆘 Crisis Navigator',
      serviceId: 'crisis-navigator',
      basePrice: 200,
      professionalPrice: 200,  // Monthly retainer (no percentage discount applies)
      premiumPrice: 200,       // Monthly retainer (no percentage discount applies)
      recurring: true,
      description: 'Ongoing monthly retainer for emergency response and regulatory monitoring led by Cristina.',
      expert: 'Cristina Lead (60%) • Jorge Support (40%)',
      features: [
        'Priority 4-hour emergency response time',
        'Monthly regulatory updates and monitoring',
        'Unlimited trade consultation',
        'Emergency compliance resolution',
        'Proactive risk alerts',
        '$200/month ongoing retainer'
      ]
    }
  ]

  const expertise = [
    {
      icon: 'TT',
      title: 'Team Collaboration',
      description: 'All services delivered through Jorge & Cristina collaboration - combining SMB operational experience with enterprise logistics expertise.'
    },
    {
      icon: 'MX',
      title: 'Mexico Trade Bridge',
      description: 'Mexico-based team with bilingual capabilities (Spanish/English) and cultural bridge advantage for North American companies.'
    },
    {
      icon: 'CB',
      title: 'Foreign Trade Consulting',
      description: 'Expert trade guidance and strategic recommendations. For official customs services, we partner with licensed professionals.'
    },
    {
      icon: 'PA',
      title: 'Pay As You Grow',
      description: 'Start with $99 Trade Health Check. Upgrade to Professional ($299/mo) for 15% off or Premium ($599/mo) for 25% off all services.'
    }
  ]

  return (
    <>
      <Head>
        <title>Expert Trade Services | Mexico Trade Bridge Team</title>
        <meta name="description" content="Professional trade consulting and USMCA optimization services from Mexico-based experts. Team collaboration delivers comprehensive supply chain solutions." />
        <meta name="keywords" content="USMCA consulting, trade compliance, supply chain optimization, Mexico market entry, supplier sourcing" />
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
            <Link href="/services" className="nav-menu-link active" onClick={() => setMobileMenuOpen(false)}>Services</Link>
            <Link href="/pricing" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
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
            Team Collaboration Services
          </div>

          <h1 className="hero-main-title">
            Your Mexico Trade Team
          </h1>
          <h2 className="hero-sub-title">
            Expert <span className="hero-yellow-highlight">Trade Consulting & USMCA Optimization</span>
          </h2>

          <p className="hero-description-text">
            All services delivered through expert team collaboration - combining SMB operational experience and Mexico market expertise with 17 years of enterprise logistics and compliance knowledge.
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
              href="#services"
              className="hero-secondary-button"
              aria-label="View all services"
            >
              View All Services
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

      {/* Legal Disclaimer - Before Services */}
      <section className="main-content">
        <div className="container-app">
          <LegalDisclaimer />
        </div>
      </section>

      {/* Service Tiers */}
      <section className="main-content" id="services">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">6 Team Collaboration Services</h2>
            <p className="section-header-subtitle">
              All services combine Jorge's business development expertise with Cristina's compliance and logistics knowledge
            </p>
          </div>

          <div className="grid-3-cols">
            {serviceTiers.map((service, index) => {
              const iconMap = {
                'trade-health-check': 'H',
                'usmca-advantage': 'U',
                'supply-chain-optimization': 'O',
                'pathfinder': 'P',
                'supply-chain-resilience': 'R',
                'crisis-navigator': 'C'
              };
              return (
                <div key={index} className="content-card">
                  <div className="content-card-icon">{iconMap[service.serviceId]}</div>
                  <h3 className="content-card-title">{service.name.substring(3)}</h3>

                <div style={{marginBottom: '12px'}}>
                  <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#134169'}}>
                    ${service.basePrice}{service.recurring ? '/mo' : ''}
                  </div>
                  {!service.recurring && service.basePrice !== 99 && (
                    <>
                      <div style={{fontSize: '0.85rem', color: '#6b7280', marginTop: '4px'}}>
                        Professional: <span style={{color: '#16a34a', fontWeight: '600'}}>${service.professionalPrice}</span> (15% off)
                      </div>
                      <div style={{fontSize: '0.85rem', color: '#6b7280'}}>
                        Premium: <span style={{color: '#16a34a', fontWeight: '600'}}>${service.premiumPrice}</span> (25% off)
                      </div>
                    </>
                  )}
                  {service.basePrice === 99 && (
                    <div style={{fontSize: '0.85rem', color: '#6b7280', marginTop: '4px'}}>
                      No subscriber discounts (entry service)
                    </div>
                  )}
                </div>

                {service.expert && (
                  <p className="content-card-description" style={{fontSize: '0.9rem', marginBottom: '8px', fontWeight: '600', color: '#134169'}}>
                    {service.expert}
                  </p>
                )}
                <p className="content-card-description">{service.description}</p>

                {service.disclaimer && (
                  <p className="content-card-description" style={{fontSize: '0.85rem', fontStyle: 'italic', color: '#6b7280', marginTop: '8px'}}>
                    Note: {service.disclaimer}
                  </p>
                )}

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
            );
            })}
          </div>
        </div>
      </section>

      {/* Team Value Proposition */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Why Team Collaboration Works</h2>
            <p className="section-header-subtitle">
              Every service benefits from both perspectives - operational and compliance expertise combined
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

      {/* Service Approach */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Our Service Approach</h2>
            <p className="section-header-subtitle">
              Start small, scale with confidence - subscriber discounts reward ongoing partnership
            </p>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <h3 className="content-card-title">1. Start with $99 Health Check</h3>
              <p className="content-card-description">
                Begin with Trade Health Check ($99) to identify opportunities. Get $99 credit toward any follow-up service. No subscription required.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">2. Subscribe for Discounts</h3>
              <p className="content-card-description">
                Professional ($299/mo) gets 15% off all services. Premium ($599/mo) gets 25% off plus quarterly strategy calls with Jorge & Cristina.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">3. Request Services as Needed</h3>
              <p className="content-card-description">
                Services range from $175-$450 one-time or $200/month for Crisis Navigator. Subscribers save automatically at checkout.
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
              Begin with our $99 Trade Health Check to identify your biggest opportunities
            </p>
            <div className="hero-button-group">
              <Link
                href="/services/request-form"
                className="hero-primary-button"
                aria-label="Start Trade Health Check"
              >
                Start with $99 Health Check
              </Link>
              <Link
                href="/services/request-form"
                className="hero-secondary-button"
                aria-label="Request specific service"
              >
                Request Specific Service
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
