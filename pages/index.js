import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import TriangleLayout from '../components/TriangleLayout'
import SimpleSavingsCalculator from '../components/SimpleSavingsCalculator'
import Footer from '../components/Footer'

export default function HomePage() {
  const [isClient, setIsClient] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Check if user is logged in
    const checkAuth = () => {
      const currentUser = localStorage.getItem('current_user')
      const userSession = localStorage.getItem('triangle_user_session')
      setIsLoggedIn(!!(currentUser || userSession))
    }

    checkAuth()
  }, [])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <>
      <Head>
        <title>TradeFlow Intelligence | USMCA Compliance & Supply Chain Optimization</title>
        <meta name="description" content="Professional trade services platform delivering comprehensive USMCA compliance analysis and supply chain optimization for North American manufacturers and importers." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="TradeFlow Intelligence | USMCA Compliance Platform" />
        <meta property="og:description" content="Professional trade services delivering comprehensive USMCA compliance analysis and supply chain optimization for enterprise clients." />

        {/* Structured Data (JSON-LD) for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Triangle Intelligence Platform",
              "applicationCategory": "BusinessApplication",
              "description": "Professional USMCA compliance analysis and certificate generation platform for North American importers and exporters.",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "99",
                "priceCurrency": "USD",
                "priceSpecification": {
                  "@type": "UnitPriceSpecification",
                  "price": "99.00",
                  "priceCurrency": "USD",
                  "unitText": "MONTH"
                }
              },
              "provider": {
                "@type": "Organization",
                "name": "Triangle Intelligence",
                "url": "https://triangleintelligence.com",
                "logo": "https://triangleintelligence.com/logo.png",
                "contactPoint": {
                  "@type": "ContactPoint",
                  "email": "legal@triangleintelligence.com",
                  "contactType": "Customer Service"
                }
              },
              "featureList": [
                "USMCA Qualification Analysis",
                "Certificate of Origin Generation",
                "HS Code Classification",
                "Mexico Supplier Sourcing",
                "Trade Compliance Consulting"
              ]
            })
          }}
        />
      </Head>

      {/* Fixed Navigation */}
      <nav className="nav-fixed">
        <div className="nav-container">
          <Link href="/" className="nav-logo-link">
            <div className="nav-logo-icon">
              T
            </div>
            <div>
              <div className="nav-logo-text">
                TradeFlow Intelligence
              </div>
              <div className="nav-logo-subtitle">
                USMCA Compliance Platform
              </div>
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
            <Link href="/solutions" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
              Solutions
            </Link>
            <Link href="/industries" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
              Industries
            </Link>
            <Link href="/intelligence" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
              Intelligence
            </Link>
            <Link href="/services" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
              Services
            </Link>
            <Link href="/pricing" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard" className="nav-cta-button" onClick={() => setMobileMenuOpen(false)}>
                My Dashboard
              </Link>
            ) : (
              <Link href="/login" className="nav-cta-button" onClick={() => setMobileMenuOpen(false)}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Video Hero Section */}
      <section className="hero-video-section">
        <video
          className="hero-video-element"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            e.target.playbackRate = 0.8; // Slow down to 50% speed
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
            Trade Policy Update: USMCA Optimization Opportunities Available
          </div>
          
          <h1 className="hero-main-title">
            Move The World
          </h1>
          <h2 className="hero-sub-title">
            Enterprise <span className="hero-gradient-text">USMCA Compliance</span><br/>
            <span>& Supply Chain Optimization</span>
          </h2>
          
          <p className="hero-description-text">
            Professional trade services platform delivering comprehensive compliance analysis and supply chain optimization for Fortune 500 manufacturers and importers.
          </p>
          
          <div className="hero-button-group">
            {isLoggedIn ? (
              <Link
                href="/usmca-workflow"
                className="hero-primary-button"
                aria-label="Start comprehensive USMCA compliance analysis workflow"
              >
                Start USMCA Analysis
              </Link>
            ) : (
              <Link
                href="/login"
                className="hero-primary-button"
                aria-label="Sign in to access USMCA compliance analysis"
              >
                Sign In to Start Analysis
              </Link>
            )}
            <Link
              href="#calculator"
              className="hero-secondary-button"
              aria-label="Scroll to tariff savings calculator section"
            >
              Calculate Savings
            </Link>
          </div>
        </div>
      </section>

      {isClient && (
        <>
          <section id="calculator" className="main-content gradient-subtle">
            <div className="container-app">
              <SimpleSavingsCalculator />
            </div>
          </section>

          {/* USMCA Compliance Solutions Section */}
          <section className="main-content">
            <div className="container-app">
              <div className="section-header">
                <h2 className="section-header-title">USMCA Compliance Solutions</h2>
                <p className="section-header-subtitle">
                  Professional trade services delivering comprehensive compliance analysis and strategic supply chain optimization for enterprise clients.
                </p>
              </div>
              
              <div className="grid-2-cols">
                <div className="content-card classification">
                  <div className="content-card-icon" aria-hidden="true">HC</div>
                  <h3 className="content-card-title">Trade Classification & Analysis</h3>
                  <p className="content-card-description">
                    Professional harmonized system classification with CBP-verified accuracy for streamlined customs processing and duty optimization.
                  </p>
                  <Link 
                    href="/usmca-workflow" 
                    className="content-card-link"
                    aria-label="Start trade classification and analysis workflow"
                  >
                    Start Classification Analysis
                  </Link>
                </div>

                <div className="content-card analysis">
                  <div className="content-card-icon" aria-hidden="true">RA</div>
                  <h3 className="content-card-title">Supply Chain Route Analysis</h3>
                  <p className="content-card-description">
                    Comprehensive assessment of trade corridors through Mexico and Canada to identify cost savings and compliance opportunities.
                  </p>
                  <Link 
                    href="/usmca-workflow" 
                    className="content-card-link"
                    aria-label="Start supply chain route analysis and optimization"
                  >
                    Analyze Trade Routes
                  </Link>
                </div>

                <div className="content-card certificates">
                  <div className="content-card-icon" aria-hidden="true">CO</div>
                  <h3 className="content-card-title">Certificate of Origin Services</h3>
                  <p className="content-card-description">
                    Complete documentation services with audit-ready compliance records and professional customs broker partnership.
                  </p>
                  <Link 
                    href="/usmca-workflow" 
                    className="content-card-link"
                    aria-label="Start certificate of origin generation and documentation services"
                  >
                    Generate Certificates
                  </Link>
                </div>

                <div className="content-card compliance">
                  <div className="content-card-icon" aria-hidden="true">RC</div>
                  <h3 className="content-card-title">Regulatory Compliance Management</h3>
                  <p className="content-card-description">
                    Expert guidance on evolving trade regulations with real-time updates and implementation support for enterprise clients.
                  </p>
                  <Link 
                    href="/trade-risk-alternatives" 
                    className="content-card-link"
                    aria-label="Access real-time regulatory compliance monitoring and alerts"
                  >
                    Monitor Regulations
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Industry Insights Section */}
          <section className="main-content">
            <div className="container-app">
              <div className="section-header">
                <h2 className="section-header-title">TradeFlow Intelligence Insights</h2>
                <p className="section-header-subtitle">
                  Professional insights and analysis for strategic supply chain optimization and regulatory compliance management.
                </p>
              </div>
              
              <div className="insights-layout">
                <div className="content-card">
                  <h3 className="content-card-title">USMCA Optimization: Strategic Opportunities</h3>
                  <p className="content-card-description">
                    Comprehensive analysis of North American trade corridors reveals significant cost reduction opportunities through strategic Mexico routing for enterprise manufacturers.
                  </p>
                  <div className="insights-button-group">
                    <Link href="/usmca-workflow" className="btn-primary">
                      Read the Analysis
                    </Link>
                    <Link href="#calculator" className="btn-secondary">
                      Calculate Your Savings
                    </Link>
                    <Link href="/services/logistics-support" className="btn-secondary">
                      🚨 Don't Qualify? Get Expert Help
                    </Link>
                  </div>
                </div>
                
                <img 
                  src="/image/datos-financieros.jpg" 
                  alt="Professional Trade Analysis Dashboard"
                  className="insights-image"
                />
              </div>
            </div>
          </section>

          <Footer />
        </>
      )}
    </>
  )
}
