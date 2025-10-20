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
            <Link href="/pricing" className="nav-cta-button" onClick={() => setMobileMenuOpen(false)}>
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
            70% of SMBs Qualify for USMCA<br/>
            <span className="hero-yellow-highlight">But Don&apos;t Know It</span>
          </h1>

          <p className="hero-description-text" style={{fontSize: '1.5rem', marginTop: '2rem'}}>
            Are you paying 6-25% tariffs when you could pay <strong>0%</strong>?<br/>
            Find out if you qualify in 5 minutes. Get your certificate. Stay protected.
          </p>
          
          <div className="hero-button-group">
            <Link
              href="/pricing"
              className="hero-primary-button"
              aria-label="View pricing plans and start free trial"
            >
              Start Free Trial
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

      {/* How It Works - 3 Simple Steps */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header" style={{textAlign: 'center'}}>
            <h2 className="section-header-title">Get Your USMCA Certificate in 3 Simple Steps</h2>
            <p className="section-header-subtitle">
              Most SMBs already qualify—they just don&apos;t know it. Find out in 5 minutes.
            </p>
          </div>

          <div className="grid-3-cols">
            <div className="content-card" style={{textAlign: 'center'}}>
              <div className="content-card-icon" style={{fontSize: '3rem', marginBottom: '1rem'}}>1️⃣</div>
              <h3 className="content-card-title">Tell Us About Your Product</h3>
              <p className="content-card-description">
                Don&apos;t know your HS code? No problem.<br/>
                Our AI helps you classify your product correctly.
              </p>
            </div>

            <div className="content-card" style={{textAlign: 'center'}}>
              <div className="content-card-icon" style={{fontSize: '3rem', marginBottom: '1rem'}}>2️⃣</div>
              <h3 className="content-card-title">Check If You Qualify</h3>
              <p className="content-card-description">
                See your qualification status instantly.<br/>
                Get recommendations to qualify if you&apos;re close.
              </p>
            </div>

            <div className="content-card" style={{textAlign: 'center'}}>
              <div className="content-card-icon" style={{fontSize: '3rem', marginBottom: '1rem'}}>3️⃣</div>
              <h3 className="content-card-title">Preview & Download Certificate</h3>
              <p className="content-card-description">
                Download official certificate for customs.<br/>
                Continue with alerts to stay protected.
              </p>
            </div>
          </div>

          <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <Link href="/pricing" className="btn-primary" style={{fontSize: '1.2rem', padding: '1rem 2rem'}}>
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Alert Monitoring Section */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header" style={{textAlign: 'center'}}>
            <h2 className="section-header-title">We Watch Trade Policy So You Don&apos;t Have To</h2>
            <p className="section-header-subtitle">
              Tariff changes happen fast. Get alerts before they hurt your business.
            </p>
          </div>

          <div className="grid-3-cols">
            <div className="content-card" style={{textAlign: 'center'}}>
              <div className="content-card-icon" style={{fontSize: '3rem', marginBottom: '1rem'}}>🚨</div>
              <h3 className="content-card-title">Real-Time Tariff Alerts</h3>
              <p className="content-card-description">
                Know immediately when tariffs change on your products.
              </p>
            </div>

            <div className="content-card" style={{textAlign: 'center'}}>
              <div className="content-card-icon" style={{fontSize: '3rem', marginBottom: '1rem'}}>⚠️</div>
              <h3 className="content-card-title">Supply Chain Warnings</h3>
              <p className="content-card-description">
                Get early warnings about supplier risks and trade disputes.
              </p>
            </div>

            <div className="content-card" style={{textAlign: 'center'}}>
              <div className="content-card-icon" style={{fontSize: '3rem', marginBottom: '1rem'}}>💡</div>
              <h3 className="content-card-title">Mexico Alternatives</h3>
              <p className="content-card-description">
                Recommendations for Mexico-based alternative suppliers.
              </p>
            </div>
          </div>

          <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <p style={{fontSize: '1.2rem', marginBottom: '1rem'}}>
              <strong>Plans starting at $99/month</strong> after 7-day free trial
            </p>
            <Link href="/pricing" className="btn-secondary">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <section id="calculator" className="main-content">
        <div className="container-app">
          <SimpleSavingsCalculator />
        </div>
      </section>

      {/* Need Help? Simple CTA */}
      <section className="main-content" style={{backgroundColor: '#fef3c7'}}>
        <div className="container-app">
          <div className="content-card" style={{textAlign: 'center', background: 'transparent', border: 'none'}}>
            <h2 className="section-header-title" style={{color: '#92400e'}}>
              Don&apos;t Qualify Yet? Need Help?
            </h2>
            <p className="section-header-subtitle" style={{color: '#92400e', fontSize: '1.2rem'}}>
              Mexico-based bilingual expert team helps you restructure supply chains, find alternative suppliers, and achieve USMCA compliance.
            </p>
            <div className="hero-button-group" style={{marginTop: '2rem'}}>
              <Link href="/services" className="btn-primary">
                View Expert Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="main-content">
        <div className="container-app">
          <LegalDisclaimer />
        </div>
      </section>

      <Footer />
    </>
  )
}
