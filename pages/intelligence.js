import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function TradeIntelligence() {
  const [isClient, setIsClient] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const intelligenceServices = [
    {
      icon: 'TA',
      title: 'Tariff Impact Analysis',
      description: 'Real-time duty rate monitoring and cost projections with predictive analytics for strategic planning.',
      features: ['Real-time rate monitoring', 'Cost impact projections', 'Predictive analytics', 'Strategic planning tools']
    },
    {
      icon: 'SR',
      title: 'Supply Chain Risk Assessment',
      description: 'Multi-country sourcing optimization strategies with risk analysis and contingency planning.',
      features: ['Multi-country analysis', 'Risk assessment', 'Sourcing optimization', 'Contingency planning']
    },
    {
      icon: 'MO',
      title: 'Market Opportunity Identification',
      description: 'USMCA advantage analysis by product category with competitive positioning insights.',
      features: ['Category analysis', 'Competitive insights', 'Market opportunities', 'Advantage mapping']
    },
    {
      icon: 'TP',
      title: 'Trade Policy Monitoring',
      description: 'Regulatory change alerts and compliance updates with expert analysis and implementation guidance.',
      features: ['Policy change alerts', 'Compliance updates', 'Expert analysis', 'Implementation guidance']
    }
  ]

  const reports = [
    {
      title: 'USMCA Optimization Report',
      description: 'Comprehensive analysis of North American trade corridors with strategic recommendations',
      link: '/usmca-workflow'
    },
    {
      title: 'Tariff Monitor Dashboard',
      description: 'Real-time tariff change tracking with automated alerts and impact analysis',
      link: '/trade-risk-alternatives'
    },
    {
      title: 'Supply Chain Intelligence',
      description: 'Market analysis and sourcing optimization for USMCA compliance advantages',
      link: '/solutions'
    }
  ]

  return (
    <>
      <Head>
        <title>Trade Intelligence & Market Analysis | USMCA Optimization Insights</title>
        <meta name="description" content="Professional trade intelligence platform delivering market analysis, tariff forecasting, and supply chain optimization insights for North American manufacturers." />
        <meta name="keywords" content="trade intelligence, tariff analysis, supply chain optimization, USMCA market analysis, trade policy monitoring" />
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
            Professional Trade Intelligence Platform
          </div>
          
          <h1 className="hero-main-title">
            Trade Intelligence & Market Analysis
          </h1>
          <h2 className="hero-sub-title">
            Strategic <span className="hero-gradient-text">Insights</span>
          </h2>
          
          <p className="hero-description-text">
            Strategic insights, tariff forecasting, and supply chain optimization powered by real-time data and expert analysis. Make informed trade decisions with confidence.
          </p>
          
          <div className="hero-button-group">
            <Link 
              href="/pricing" 
              className="hero-primary-button"
              aria-label="View live trade intelligence alerts"
            >
              Subscribe for Alerts
            </Link>
            <Link 
              href="#intelligence" 
              className="hero-secondary-button"
              aria-label="Explore intelligence services"
            >
              Explore Intelligence
            </Link>
          </div>
        </div>
      </section>

      {/* Intelligence Services */}
      <section className="main-content" id="intelligence">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Professional Trade Intelligence Services</h2>
            <p className="section-header-subtitle">
              Data-driven insights and strategic analysis to optimize your trade operations and maximize USMCA benefits
            </p>
          </div>

          <div className="grid-2-cols">
            {intelligenceServices.map((service, index) => (
              <div key={index} className="content-card">
                <div className="content-card-icon">{service.icon}</div>
                <h3 className="content-card-title">{service.title}</h3>
                <p className="content-card-description">{service.description}</p>
                
                <div>
                  {service.features.map((feature, idx) => (
                    <p key={idx} className="text-body">
                      ▶ {feature}
                    </p>
                  ))}
                </div>
                
                <Link href="/pricing" className="content-card-link">
                  Access Service
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Reports */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Featured Intelligence Reports</h2>
            <p className="section-header-subtitle">
              Access our latest trade intelligence reports and market analysis
            </p>
          </div>

          <div className="grid-3-cols">
            {reports.map((report, index) => (
              <div key={index} className="content-card">
                <h3 className="content-card-title">{report.title}</h3>
                <p className="content-card-description">{report.description}</p>
                <Link href={report.link} className="content-card-link">
                  Access Report
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intelligence Platform Benefits */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Why Choose TradeFlow Intelligence</h2>
          </div>
          
          <div className="grid-3-cols">
            <div className="content-card">
              <h3 className="content-card-title">Real-Time Monitoring</h3>
              <p className="content-card-description">
                24/7 market surveillance with less than 5-minute alert speed for critical tariff and policy changes affecting your business.
              </p>
            </div>
            
            <div className="content-card">
              <h3 className="content-card-title">Multiple Data Sources</h3>
              <p className="content-card-description">
                15+ government and market feeds integrated for comprehensive trade intelligence with 99.9% platform uptime reliability.
              </p>
            </div>
            
            <div className="content-card">
              <h3 className="content-card-title">Enterprise Performance</h3>
              <p className="content-card-description">
                Professional-grade analytics platform delivering actionable insights when you need them most for strategic decision-making.
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
              Ready to Access Professional Trade Intelligence?
            </h2>
            <p className="section-header-subtitle">
              Get strategic insights and real-time alerts to optimize your trade operations
            </p>
            <div className="hero-button-group">
              <Link 
                href="/pricing" 
                className="hero-primary-button"
                aria-label="Access trade intelligence platform"
              >
                Access Intelligence Platform
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