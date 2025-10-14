import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import TriangleLayout from '../components/TriangleLayout'
import SimpleSavingsCalculator from '../components/SimpleSavingsCalculator'
import Footer from '../components/Footer'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
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
        <title>Triangle Trade Intelligence | USMCA Compliance & Supply Chain Optimization</title>
        <meta name="description" content="Professional trade services platform delivering comprehensive USMCA compliance analysis and supply chain optimization for North American manufacturers and importers." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          .pain-points-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            margin-bottom: 3rem;
          }
          @media (max-width: 768px) {
            .pain-points-grid {
              grid-template-columns: 1fr;
              gap: 1.5rem;
            }
          }
        `}</style>
        <meta property="og:title" content="Triangle Trade Intelligence | USMCA Compliance Platform" />
        <meta property="og:description" content="Professional trade services delivering comprehensive USMCA compliance analysis and supply chain optimization for small manufacturers and importers." />

        {/* Structured Data (JSON-LD) for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Triangle Trade Intelligence Platform",
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
                "name": "Triangle Trade Intelligence",
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
                Triangle Trade Intelligence
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
              <>
                <Link href="/login" className="nav-cta-button" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link href="/signup" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
                  Sign Up
                </Link>
              </>
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
            Small Business <span className="hero-gradient-text">USMCA Compliance</span><br/>
            <span>& Supply Chain Optimization</span>
          </h2>

          <p className="hero-description-text">
            Professional trade services platform delivering comprehensive compliance analysis and supply chain optimization for small manufacturers and importers who can't afford full-time trade compliance teams.
          </p>
          
          <div className="hero-button-group">
            <Link
              href="/usmca-workflow?reset=true"
              className="hero-primary-button"
              aria-label="Start USMCA qualification analysis"
            >
              Start USMCA Analysis
            </Link>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="hero-secondary-button"
                aria-label="Go to my dashboard"
              >
                My Dashboard
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="hero-secondary-button"
                aria-label="View pricing plans"
              >
                View Pricing
              </Link>
            )}
          </div>
        </div>
      </section>

      <section id="calculator" className="main-content gradient-subtle">
        <div className="container-app">
          <SimpleSavingsCalculator />
        </div>
      </section>

      {/* Why Small Businesses Need This */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Why Small Manufacturers Need USMCA Compliance</h2>
            <p className="section-header-subtitle">
              You can't afford a full-time compliance team, but you can't afford to ignore USMCA benefits either.
            </p>
          </div>

          <div className="pain-points-grid">
            <div className="content-card">
              <div className="card-icon">💸</div>
              <h3 className="content-card-title">Losing Money on Tariffs</h3>
              <p className="content-card-description">
                Many SMBs pay 6-25% tariffs on imports from China, Mexico, or Canada without realizing they could qualify for 0% tariffs under USMCA.
              </p>
            </div>

            <div className="content-card">
              <div className="card-icon">❓</div>
              <h3 className="content-card-title">Don't Know If You Qualify</h3>
              <p className="content-card-description">
                USMCA rules are complex. You need 55-75% regional content, but calculating this requires expertise you don't have in-house.
              </p>
            </div>

            <div className="content-card">
              <div className="card-icon">⚠️</div>
              <h3 className="content-card-title">Supply Chain at Risk</h3>
              <p className="content-card-description">
                Tariff changes, trade disputes, and supplier disruptions can destroy your margins overnight. You need early warning and alternatives.
              </p>
            </div>

            <div className="content-card">
              <div className="card-icon">📄</div>
              <h3 className="content-card-title">Certificate Confusion</h3>
              <p className="content-card-description">
                Need a USMCA certificate but don't know where to start? Wrong paperwork means customs delays and lost revenue.
              </p>
            </div>

            <div className="content-card">
              <div className="card-icon">🌎</div>
              <h3 className="content-card-title">Want to Enter Mexico Market</h3>
              <p className="content-card-description">
                Mexico offers huge opportunities, but finding reliable suppliers or distributors without local connections is nearly impossible.
              </p>
            </div>

            <div className="content-card">
              <div className="card-icon">🚨</div>
              <h3 className="content-card-title">No Emergency Plan</h3>
              <p className="content-card-description">
                When customs holds your shipment or tariffs spike, you need expert help immediately—but hiring a consultant takes weeks.
              </p>
            </div>
          </div>

          <div className="content-card">
            <h3 className="content-card-title">Our Solution: AI Analysis + Expert Team</h3>
            <p className="content-card-description">
              Canadian-owned platform with Mexico-based bilingual experts (Jorge & Cristina). We combine AI-powered analysis with 15+ years of trade expertise—at SMB-friendly prices starting at $99/month.
            </p>
            <div className="hero-button-group">
              <Link href="/usmca-workflow?reset=true" className="btn-primary">
                Check If You Qualify
              </Link>
              <Link href="/services" className="btn-secondary">
                View Expert Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="main-content" style={{backgroundColor: '#f0f9ff'}}>
        <div className="container-app">
          <div className="content-card" style={{textAlign: 'center'}}>
            <h2 className="section-header-title">Affordable Subscriptions for SMBs</h2>
            <p className="section-header-subtitle">
              Plans starting at $99/month • Unlimited analyses • Real-time trade alerts • Subscriber discounts on expert services
            </p>
            <div className="hero-button-group">
              <Link href="/pricing" className="btn-primary">
                View All Plans
              </Link>
              <Link href="/usmca-workflow?reset=true" className="btn-secondary">
                Try Analysis First
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Expert Services Teaser */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Not Qualified Yet? We Can Help.</h2>
            <p className="section-header-subtitle">
              Mexico-based bilingual expert team (Jorge & Cristina) with 15+ years of trade experience helps you restructure supply chains, find alternative suppliers, and achieve USMCA compliance.
            </p>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <div className="card-icon">🏥</div>
              <h3 className="content-card-title">Trade Health Check</h3>
              <p className="content-card-description">
                Complete assessment with prioritized action plan. Starting at $99.
              </p>
            </div>

            <div className="content-card">
              <div className="card-icon">📜</div>
              <h3 className="content-card-title">USMCA Qualification</h3>
              <p className="content-card-description">
                Gap analysis and roadmap to achieve compliance. Starting at $175.
              </p>
            </div>

            <div className="content-card">
              <div className="card-icon">🛡️</div>
              <h3 className="content-card-title">Supply Chain Services</h3>
              <p className="content-card-description">
                Alternative suppliers, Mexico sourcing, crisis response. Starting at $275.
              </p>
            </div>
          </div>

          <div className="content-card" style={{backgroundColor: '#fef3c7', textAlign: 'center'}}>
            <h3 className="content-card-title" style={{color: '#92400e'}}>💡 Subscribers Save 15-25% on All Services</h3>
            <p className="content-card-description" style={{color: '#92400e', marginBottom: '1rem'}}>
              Professional subscribers get 15% off • Premium subscribers get 25% off all expert services
            </p>
            <div className="hero-button-group">
              <Link href="/services" className="btn-primary">
                View All Services
              </Link>
              <Link href="/services/request-form" className="btn-secondary">
                Request Service
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Insights Section */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Triangle Trade Intelligence Insights</h2>
            <p className="section-header-subtitle">
              Professional insights and analysis for strategic supply chain optimization and regulatory compliance management.
            </p>
          </div>

          <div className="insights-layout">
            <div className="content-card">
              <h3 className="content-card-title">USMCA Optimization: Strategic Opportunities</h3>
              <p className="content-card-description">
                Comprehensive analysis of North American trade corridors reveals significant cost reduction opportunities through strategic Mexico routing for small manufacturers and importers. Find out if you qualify in under 5 minutes.
              </p>
              <div className="insights-button-group">
                <Link href="/usmca-workflow?reset=true" className="btn-primary">
                  Start Your Analysis
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
  )
}
