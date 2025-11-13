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
        <title>Triangle Trade Intelligence | AI-Powered USMCA Compliance Platform</title>
        <meta name="description" content="AI-powered USMCA compliance software for importers, exporters, and producers. Automated certificate generation, daily tariff policy monitoring, and HS code classification. $99/month." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Triangle Trade Intelligence | AI-Powered USMCA Compliance" />
        <meta property="og:description" content="AI-powered USMCA compliance software with automated certificate generation and daily tariff policy monitoring for importers, exporters, and producers." />

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
                "AI-Powered USMCA Qualification Analysis",
                "Automated Certificate of Origin Generation",
                "AI HS Code Classification",
                "Daily Tariff Policy Monitoring",
                "Supply Chain Risk Monitoring"
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
            <Link href="/pricing" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
              Pricing
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
            70% of SMBs Qualify for USMCA<br/>
            <span className="hero-yellow-highlight">But Don&apos;t Know It</span>
          </h1>

          <p className="hero-description-text" style={{marginTop: '2rem'}}>
            Are you paying tariffs when you could qualify for USMCA duty-free status?<br/>
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

      {/* We Understand Your Situation - Empathy First */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header" style={{textAlign: 'center', marginBottom: '3rem'}}>
            <h2 className="section-header-title">We Understand Your Situation</h2>
            <p className="section-header-subtitle">
              Tariffs changing every week. Customs brokers charging $500 per certificate.<br/>
              And you&apos;re just trying to run your business.
            </p>
          </div>

          <div className="grid-2-cols" style={{gap: '2rem'}}>
            {/* Pain Point 1 */}
            <div className="content-card" style={{borderLeft: '4px solid #dc2626'}}>
              <h3 className="content-card-title" style={{color: '#dc2626', fontSize: '1.25rem'}}>
                😰 &quot;Section 301 tariffs changed AGAIN?&quot;
              </h3>
              <p className="content-card-description" style={{marginTop: '0.75rem', color: '#059669', fontWeight: 600}}>
                → We monitor daily. You get alerts within 24 hours.
              </p>
            </div>

            {/* Pain Point 2 */}
            <div className="content-card" style={{borderLeft: '4px solid #dc2626'}}>
              <h3 className="content-card-title" style={{color: '#dc2626', fontSize: '1.25rem'}}>
                😰 &quot;I don&apos;t have time to learn USMCA rules&quot;
              </h3>
              <p className="content-card-description" style={{marginTop: '0.75rem', color: '#059669', fontWeight: 600}}>
                → AI does it. You answer 5 questions, we calculate everything.
              </p>
            </div>

            {/* Pain Point 3 */}
            <div className="content-card" style={{borderLeft: '4px solid #dc2626'}}>
              <h3 className="content-card-title" style={{color: '#dc2626', fontSize: '1.25rem'}}>
                😰 &quot;My broker quoted $500 per certificate&quot;
              </h3>
              <p className="content-card-description" style={{marginTop: '0.75rem', color: '#059669', fontWeight: 600}}>
                → Generate unlimited certificates. $99/month flat rate.
              </p>
            </div>

            {/* Pain Point 4 */}
            <div className="content-card" style={{borderLeft: '4px solid #dc2626'}}>
              <h3 className="content-card-title" style={{color: '#dc2626', fontSize: '1.25rem'}}>
                😰 &quot;What if I get it wrong?&quot;
              </h3>
              <p className="content-card-description" style={{marginTop: '0.75rem', color: '#059669', fontWeight: 600}}>
                → Download the certificate, verify with your broker before filing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* That's Why We Built This */}
      <section className="main-content gradient-subtle">
        <div className="container-app">
          <div className="section-header" style={{textAlign: 'center', marginBottom: '2rem'}}>
            <h2 className="section-header-title">That&apos;s Why We Built This</h2>
          </div>

          <div className="grid-2-cols" style={{gap: '2rem', maxWidth: '900px', margin: '0 auto'}}>
            <div className="content-card">
              <div className="content-card-icon">⚡</div>
              <h3 className="content-card-title">Self-Serve</h3>
              <p className="content-card-description">
                No sales calls, no consultants. Just log in and run your analysis.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">⏱️</div>
              <h3 className="content-card-title">Fast</h3>
              <p className="content-card-description">
                5 minutes vs 2 hours with traditional brokers.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">💰</div>
              <h3 className="content-card-title">Affordable</h3>
              <p className="content-card-description">
                $99/month flat rate vs $500 per certificate.
              </p>
            </div>

            <div className="content-card">
              <div className="content-card-icon">🔄</div>
              <h3 className="content-card-title">Always Current</h3>
              <p className="content-card-description">
                Daily tariff monitoring so you&apos;re never caught off guard.
              </p>
            </div>
          </div>

          <div style={{textAlign: 'center', marginTop: '2.5rem'}}>
            <Link href="/how-it-works" className="btn-secondary" style={{fontSize: '1.1rem'}}>
              See How It Works →
            </Link>
          </div>
        </div>
      </section>

      {/* Removed: Long "See It In Action" screenshot galleries, "Alert Monitoring", and calculator sections - keeping homepage focused for busy SMBs */}

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
