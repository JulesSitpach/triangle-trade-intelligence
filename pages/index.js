import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import TriangleLayout from '../components/TriangleLayout'
import SimpleSavingsCalculator from '../components/SimpleSavingsCalculator'
import LegalDisclaimer from '../components/LegalDisclaimer'
import Footer from '../components/Footer'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <>
      <Head>
        <title>Triangle Trade Intelligence | USMCA Compliance & Supply Chain Optimization</title>
        <meta name="description" content="Professional trade services platform delivering comprehensive USMCA compliance analysis and supply chain optimization for North American manufacturers and importers." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
            <Link href="/about" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
            <Link href="/signup" className="nav-cta-button" onClick={() => setMobileMenuOpen(false)}>
              Get Started
            </Link>
            <Link href="/login" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
              Sign In
            </Link>
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
            <span className="hero-yellow-highlight">Small & Medium Business</span><br/>
            <span>USMCA Compliance & Supply Chain Optimization</span>
          </h2>

          <p className="hero-description-text">
            Professional trade services platform delivering comprehensive compliance analysis and supply chain optimization for Small & Medium manufacturers and importers who can&apos;t afford full-time trade compliance teams.
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
              href="/services"
              className="hero-secondary-button"
              aria-label="View professional services"
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

      {/* Mexico Trade Bridge - Competitive Advantage Section */}
      <section className="main-content" style={{background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'}}>
        <div className="container-app">
          <div className="section-header" style={{textAlign: 'center', marginBottom: '3rem'}}>
            <h2 className="section-header-title" style={{color: '#fff', fontSize: '2.5rem'}}>
              Your Mexico Trade Bridge Advantage
            </h2>
            <p className="section-header-subtitle" style={{color: '#e0f2fe', fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto'}}>
              Canadian-owned platform with Mexico-based operations delivering North American business standards with Mexico market access and insights.
            </p>
          </div>

          <div className="feature-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '3rem'}}>
            {/* USMCA Triangle Routing */}
            <div className="card" style={{background: 'rgba(255, 255, 255, 0.95)', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🔺</div>
              <h3 className="card-title" style={{color: '#1e3a8a', fontSize: '1.5rem', marginBottom: '1rem'}}>
                USMCA Triangle Routing
              </h3>
              <p className="text-body" style={{color: '#334155', lineHeight: '1.6'}}>
                Maximize tariff savings through strategic Canada → Mexico → US/Latin America routing. Leverage USMCA&apos;s 0% preferential rates and Mexico&apos;s geographic advantages.
              </p>
              <ul style={{marginTop: '1rem', paddingLeft: '1.5rem', color: '#475569'}}>
                <li>Zero tariffs on USMCA-qualified goods</li>
                <li>Shorter lead times vs. Asian suppliers</li>
                <li>Same-time-zone collaboration</li>
              </ul>
            </div>

            {/* Mexico Nearshoring */}
            <div className="card" style={{background: 'rgba(255, 255, 255, 0.95)', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🇲🇽</div>
              <h3 className="card-title" style={{color: '#1e3a8a', fontSize: '1.5rem', marginBottom: '1rem'}}>
                Mexico Nearshoring Benefits
              </h3>
              <p className="text-body" style={{color: '#334155', lineHeight: '1.6'}}>
                Access Mexico&apos;s skilled workforce and manufacturing infrastructure with our bilingual team (Spanish/English) providing complete USMCA market coverage.
              </p>
              <ul style={{marginTop: '1rem', paddingLeft: '1.5rem', color: '#475569'}}>
                <li>17-year enterprise logistics expertise</li>
                <li>Fortune 500 best practices at SMB scale</li>
                <li>Mexico supplier relationships ready</li>
              </ul>
            </div>

            {/* Future-Proof Strategy */}
            <div className="card" style={{background: 'rgba(255, 255, 255, 0.95)', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🛡️</div>
              <h3 className="card-title" style={{color: '#1e3a8a', fontSize: '1.5rem', marginBottom: '1rem'}}>
                Future-Proof Your Supply Chain
              </h3>
              <p className="text-body" style={{color: '#334155', lineHeight: '1.6'}}>
                Mexico proximity benefits remain regardless of trade agreements. Build relationships now for resilience against tariff volatility and geopolitical shifts.
              </p>
              <ul style={{marginTop: '1rem', paddingLeft: '1.5rem', color: '#475569'}}>
                <li>Reduce dependency on distant suppliers</li>
                <li>3-5 day shipping vs 30-45 from Asia</li>
                <li>Agile response to market changes</li>
              </ul>
            </div>
          </div>

          {/* Trust Factor Banner */}
          <div className="card" style={{background: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255,255,255,0.3)', padding: '2rem', marginTop: '3rem', textAlign: 'center'}}>
            <p style={{color: '#e0f2fe', fontSize: '1.1rem', lineHeight: '1.8', margin: 0}}>
              <strong style={{color: '#fff', fontSize: '1.3rem'}}>Canadian-Founded, Mexico-Based Excellence:</strong><br/>
              15+ years high-tech experience (IBM, Cognos, Mitel, LinkedIn) combined with Mexico-based bilingual trade experts.
              North American business standards with Mexico market access and cultural insights.
            </p>
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
            <h2 className="section-header-title">Why Small & Medium Manufacturers Need USMCA Compliance</h2>
            <p className="section-header-subtitle">
              You can&apos;t afford a full-time compliance team, but you can&apos;t afford to ignore USMCA benefits either.
            </p>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <div className="content-card-icon">$</div>
              <h3 className="content-card-title">Losing Money on Tariffs</h3>
              <p className="content-card-description">
                Many SMBs pay 6-25% tariffs on imports from China, Mexico, or Canada without realizing they could qualify for 0% tariffs under USMCA.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">?</div>
              <h3 className="content-card-title">Don&apos;t Know If You Qualify</h3>
              <p className="content-card-description">
                USMCA rules are complex. You need 55-75% regional content, but calculating this requires expertise you don&apos;t have in-house.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">⚠</div>
              <h3 className="content-card-title">Supply Chain at Risk</h3>
              <p className="content-card-description">
                Tariff changes, trade disputes, and supplier disruptions can destroy your margins overnight. You need early warning and alternatives.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">C</div>
              <h3 className="content-card-title">Certificate Confusion</h3>
              <p className="content-card-description">
                Need a USMCA certificate but don&apos;t know where to start? Wrong paperwork means customs delays and lost revenue.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">M</div>
              <h3 className="content-card-title">Want to Enter Mexico Market</h3>
              <p className="content-card-description">
                Mexico offers huge opportunities, but finding reliable suppliers or distributors without local connections is nearly impossible.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">!</div>
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
              <Link href="/signup" className="btn-primary">
                Try Free Analysis
              </Link>
              <Link href="/services" className="btn-secondary">
                View Expert Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer - Visible before pricing and services */}
      <section className="main-content">
        <div className="container-app">
          <LegalDisclaimer />
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
              <Link href="/signup" className="btn-secondary">
                Try Free Analysis
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
              <div className="content-card-icon">H</div>
              <h3 className="content-card-title">Trade Health Check</h3>
              <p className="content-card-description">
                Complete assessment with prioritized action plan. Starting at $99.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">U</div>
              <h3 className="content-card-title">USMCA Qualification</h3>
              <p className="content-card-description">
                Gap analysis and roadmap to achieve compliance. Starting at $175.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">S</div>
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
                <Link href="/signup" className="btn-primary">
                  Try Free Analysis
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
