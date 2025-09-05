import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function ComplianceSolutions() {
  const [isClient, setIsClient] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const services = [
    {
      icon: 'AI',
      title: 'HS Code Classification Software',
      description: 'AI-contextualized product classification with 34,476 government records for precise trade compliance.',
      features: ['AI-enhanced classification', 'Government-verified data', 'Sub-400ms response time', 'Universal industry coverage'],
      link: '/usmca-workflow'
    },
    {
      icon: 'UC',
      title: 'USMCA Qualification Calculator',
      description: 'Automated regional content analysis and savings projections with real-time compliance checking.',
      features: ['Regional content analysis', 'Automated calculations', 'Real-time qualification', 'Savings projections'],
      link: '/usmca-workflow'
    },
    {
      icon: 'CO',
      title: 'Certificate of Origin Generator',
      description: 'Professional PDF certificates with customs broker validation and audit-ready documentation.',
      features: ['Professional PDF output', 'Customs broker validation', 'Audit-ready records', 'Automated generation'],
      link: '/usmca-workflow'
    },
    {
      icon: 'TM',
      title: 'Trade Compliance Monitoring',
      description: 'Real-time tariff alerts and regulatory change notifications for proactive compliance management.',
      features: ['Real-time monitoring', 'Tariff change alerts', 'Regulatory updates', 'Risk notifications'],
      link: '/trump-tariff-alerts'
    }
  ]

  return (
    <>
      <Head>
        <title>USMCA Compliance Solutions | Trade Classification & Certificate Generation</title>
        <meta name="description" content="Professional USMCA compliance platform with AI-powered HS code classification, tariff savings calculator, and automated certificate of origin generation for importers and manufacturers." />
        <meta name="keywords" content="USMCA compliance software, HS code classification, certificate of origin generator, trade compliance platform, tariff optimization" />
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
        <div className="hero-gradient-overlay" />
        <div className="hero-content-container">
          <div className="hero-badge">
            Enterprise USMCA Compliance Platform
          </div>
          
          <h1 className="hero-main-title">
            Automate USMCA Compliance
          </h1>
          <h2 className="hero-sub-title">
            Enterprise-Grade <span className="hero-gradient-text">Precision</span>
          </h2>
          
          <p className="hero-description-text">
            Reduce tariff costs by up to 25% with AI-enhanced trade classification, real-time qualification checking, and professional certificate generation. Trusted by Fortune 500 manufacturers.
          </p>
          
          <div className="hero-button-group">
            <Link 
              href="/usmca-workflow" 
              className="hero-primary-button"
              aria-label="Start comprehensive USMCA compliance analysis"
            >
              Start Free Analysis
            </Link>
            <Link 
              href="#services" 
              className="hero-secondary-button"
              aria-label="View detailed compliance solutions"
            >
              View Solutions
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Professional USMCA Compliance Solutions</h2>
            <p className="section-header-subtitle">
              Comprehensive trade compliance platform with AI-enhanced classification and automated certificate generation
            </p>
          </div>

          <div className="grid-2-cols">
            {services.map((service, index) => (
              <div key={index} className="content-card">
                <div className="content-card-icon">{service.icon}</div>
                <h3 className="content-card-title">{service.title}</h3>
                <p className="content-card-description">{service.description}</p>
                
                <div className="trust-indicators-grid">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="trust-indicator">
                      <span className="trust-indicator-value">✓</span>
                      <div className="trust-indicator-label">{feature}</div>
                    </div>
                  ))}
                </div>
                
                <Link href={service.link} className="content-card-link">
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Why Choose TradeFlow Intelligence</h2>
          </div>
          
          <div className="grid-3-cols">
            <div className="content-card">
              <h3 className="content-card-title">AI-Enhanced Accuracy</h3>
              <p className="content-card-description">
                Our AI-contextualized classification system understands product function over material composition, delivering enterprise-grade accuracy across all industries.
              </p>
            </div>
            
            <div className="content-card">
              <h3 className="content-card-title">Government-Verified Data</h3>
              <p className="content-card-description">
                Built on 34,476 comprehensive government trade records with zero hardcoded values for precise, audit-ready compliance.
              </p>
            </div>
            
            <div className="content-card">
              <h3 className="content-card-title">Enterprise Performance</h3>
              <p className="content-card-description">
                Sub-400ms API response times, 42 specialized endpoints, and enterprise-grade security for mission-critical compliance workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="hero-video-section">
        <div className="hero-gradient-overlay" />
        <div className="hero-content-container">
          <h2 className="hero-main-title">
            Ready to Optimize Your Trade Compliance?
          </h2>
          <p className="hero-description-text">
            Start your free USMCA analysis and discover potential tariff savings for your products
          </p>
          <div className="hero-button-group">
            <Link 
              href="/usmca-workflow" 
              className="hero-primary-button"
              aria-label="Start free USMCA compliance analysis workflow"
            >
              Start Free Analysis
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}