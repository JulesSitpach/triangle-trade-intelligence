import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function ProfessionalServices() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

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
      <section className="main-content" style={{ paddingTop: '120px', backgroundColor: 'var(--navy-900)', color: 'white' }}>
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title" style={{ color: 'white', fontSize: '3rem' }}>
              Expert USMCA Consulting & Implementation Services
            </h1>
            <p className="section-header-subtitle" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.25rem' }}>
              Professional consulting, implementation support, and compliance training from certified trade experts. Custom solutions designed for enterprise manufacturers and importers.
            </p>
            <div style={{ marginTop: '2rem' }}>
              <Link href="#consultation" className="btn-primary btn-large" style={{ marginRight: '1rem' }}>
                Schedule Consultation
              </Link>
              <Link href="#services" className="btn-secondary btn-large">
                View Services
              </Link>
            </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <h3 className="content-card-title">{service.name}</h3>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--blue-600)' }}>
                    {service.price}
                  </div>
                </div>
                
                <p className="content-card-description">{service.description}</p>
                
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
                  {service.features.map((feature, idx) => (
                    <li key={idx} style={{ padding: '0.25rem 0', color: 'var(--gray-700)' }}>
                      <span style={{ color: 'var(--green-600)', marginRight: '0.5rem' }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link href="/usmca-workflow" className="content-card-link">
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise Areas */}
      <section className="main-content" style={{ backgroundColor: 'var(--gray-50)' }}>
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
          
          <div className="grid-4-cols">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--green-600)', marginBottom: '0.5rem' }}>
                500+
              </div>
              <h3 className="content-card-title">Clients Served</h3>
              <p className="content-card-description">Enterprise manufacturers and importers</p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--blue-600)', marginBottom: '0.5rem' }}>
                $50M+
              </div>
              <h3 className="content-card-title">Savings Generated</h3>
              <p className="content-card-description">Total client tariff savings achieved</p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--navy-600)', marginBottom: '0.5rem' }}>
                98%
              </div>
              <h3 className="content-card-title">Success Rate</h3>
              <p className="content-card-description">Successful implementations</p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--amber-600)', marginBottom: '0.5rem' }}>
                25+
              </div>
              <h3 className="content-card-title">Years Experience</h3>
              <p className="content-card-description">Combined team expertise</p>
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Process */}
      <section className="main-content" style={{ backgroundColor: 'var(--gray-50)' }}>
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
      <section className="main-content" id="consultation" style={{ backgroundColor: 'var(--blue-600)', color: 'white' }}>
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title" style={{ color: 'white' }}>
              Ready to Get Started?
            </h2>
            <p className="section-header-subtitle" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Schedule a consultation with our certified trade experts to discuss your compliance needs and implementation requirements
            </p>
            <div style={{ marginTop: '2rem' }}>
              <Link href="/usmca-workflow" className="btn-primary btn-large" style={{ marginRight: '1rem' }}>
                Schedule Consultation
              </Link>
              <Link href="/pricing" className="btn-secondary btn-large">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}