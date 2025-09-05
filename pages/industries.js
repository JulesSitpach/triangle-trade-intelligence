import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Industries() {
  const [isClient, setIsClient] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const industries = [
    {
      icon: 'AU',
      title: 'Automotive',
      description: 'Specialized USMCA compliance for automotive parts, components, and manufacturing with industry-specific qualification rules.',
      benefits: ['Automotive-specific HS codes', 'Parts qualification analysis', 'Manufacturing compliance', 'Supply chain optimization']
    },
    {
      icon: 'EL',
      title: 'Electronics',
      description: 'Electronics trade classification with function-first logic for accurate HS code determination and tariff optimization.',
      benefits: ['Electronic component analysis', 'Function-based classification', 'Semiconductor compliance', 'Technology imports']
    },
    {
      icon: 'TX',
      title: 'Textiles & Apparel',
      description: 'Textile industry compliance with specialized rules of origin and yarn-forward requirements for maximum savings.',
      benefits: ['Yarn-forward analysis', 'Fabric classification', 'Apparel rules of origin', 'Textile tariff optimization']
    },
    {
      icon: 'CH',
      title: 'Chemicals',
      description: 'Chemical industry trade compliance with precise molecular classification and specialized safety requirements.',
      benefits: ['Chemical classification', 'Molecular analysis', 'Safety compliance', 'Regulatory monitoring']
    },
    {
      icon: 'MD',
      title: 'Medical Devices',
      description: 'Medical device import compliance with FDA coordination and specialized health product classifications.',
      benefits: ['FDA compliance coordination', 'Medical device classification', 'Health product rules', 'Regulatory updates']
    },
    {
      icon: 'FD',
      title: 'Food & Agriculture',
      description: 'Food processing and agricultural product compliance with USDA coordination and specialized food safety rules.',
      benefits: ['USDA coordination', 'Food safety compliance', 'Agricultural classifications', 'Processing rules']
    }
  ]

  return (
    <>
      <Head>
        <title>Industry-Specific USMCA Solutions | Automotive, Electronics, Textiles & More</title>
        <meta name="description" content="Specialized USMCA compliance solutions for automotive, electronics, textiles, chemicals, medical devices, and food manufacturing industries." />
        <meta name="keywords" content="Automotive USMCA compliance, Electronics trade classification, Textile tariff optimization, Medical device import compliance, Food processing trade rules, Chemical industry USMCA benefits" />
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
            Industry-Specific USMCA Expertise
          </div>
          
          <h1 className="hero-main-title">
            Sector-Specific Trade Compliance
          </h1>
          <h2 className="hero-sub-title">
            Industry-Tailored <span className="hero-gradient-text">Precision</span>
          </h2>
          
          <p className="hero-description-text">
            Industry-tailored HS code databases, specialized qualification rules, and sector-specific savings opportunities. Reduce compliance costs while maximizing USMCA benefits for your industry.
          </p>
          
          <div className="hero-button-group">
            <Link 
              href="/usmca-workflow" 
              className="hero-primary-button"
              aria-label="Start industry-specific USMCA analysis"
            >
              Analyze Your Industry
            </Link>
            <Link 
              href="#industries" 
              className="hero-secondary-button"
              aria-label="View all supported industries"
            >
              View Industries
            </Link>
          </div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="main-content" id="industries">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Industry-Specific Solutions</h2>
            <p className="section-header-subtitle">
              Specialized USMCA compliance tailored to your industry's unique requirements and opportunities
            </p>
          </div>

          <div className="grid-3-cols">
            {industries.map((industry, index) => (
              <div key={index} className="content-card">
                <div className="content-card-icon">{industry.icon}</div>
                <h3 className="content-card-title">{industry.title}</h3>
                <p className="content-card-description">{industry.description}</p>
                
                <div>
                  {industry.benefits.map((benefit, idx) => (
                    <p key={idx} className="text-body">
                      ✓ {benefit}
                    </p>
                  ))}
                </div>
                
                <Link href="/usmca-workflow" className="content-card-link">
                  Start Industry Analysis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Benefits */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Why Industry-Specific Matters</h2>
            <p className="section-header-subtitle">
              Generic trade compliance misses industry nuances that can cost you significant savings
            </p>
          </div>
          
          <div className="grid-2-cols">
            <div className="content-card">
              <h3 className="content-card-title">Specialized Classification Logic</h3>
              <p className="content-card-description">
                Our AI understands that automotive electrical wire classifies as conductors (Chapter 85), not copper products (Chapter 74), ensuring accurate duty rates for your specific industry.
              </p>
            </div>
            
            <div className="content-card">
              <h3 className="content-card-title">Industry-Specific Regulations</h3>
              <p className="content-card-description">
                Each industry has unique USMCA qualification requirements. Our platform incorporates textile yarn-forward rules, automotive content calculations, and medical device FDA coordination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Industry Success Metrics</h2>
          </div>
          
          <div className="grid-3-cols">
            <div className="content-card">
              <h3 className="content-card-title">Average Tariff Savings</h3>
              <p className="content-card-description">25% typical savings through industry-specific USMCA optimization</p>
            </div>
            
            <div className="content-card">
              <h3 className="content-card-title">Enterprise Clients</h3>
              <p className="content-card-description">500+ Fortune 500 manufacturers trust our industry expertise</p>
            </div>
            
            <div className="content-card">
              <h3 className="content-card-title">Classification Accuracy</h3>
              <p className="content-card-description">95% industry-specific AI delivers superior accuracy with &lt;400ms response time</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">
              Ready to Optimize Your Industry's Trade Compliance?
            </h2>
            <p className="section-header-subtitle">
              Get industry-specific analysis and discover specialized USMCA opportunities for your sector
            </p>
            <div className="hero-button-group">
              <Link 
                href="/usmca-workflow" 
                className="hero-primary-button"
                aria-label="Start industry-specific USMCA analysis workflow"
              >
                Start Industry Analysis
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