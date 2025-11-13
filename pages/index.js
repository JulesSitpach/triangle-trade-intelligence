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
            Are you paying tariffs when you could qualify for duty-free status?
          </p>

          <div className="hero-button-group">
            <Link
              href="/signup"
              className="hero-primary-button"
              aria-label="Start free analysis"
            >
              Start Free Analysis →
            </Link>
          </div>
        </div>
      </section>

      {/* You're Not Alone */}
      <section className="main-content">
        <div className="container-app" style={{maxWidth: '800px'}}>
          <div className="section-header">
            <h2 className="section-header-title">You&apos;re Not Alone</h2>
          </div>

          <div className="text-body" style={{fontSize: '1.1rem', lineHeight: '1.8', color: '#374151'}}>
            <p style={{marginBottom: '1.5rem'}}>
              You&apos;re managing imports, dealing with customs brokers, and trying to keep costs down. Meanwhile:
            </p>

            <ul style={{paddingLeft: '1.5rem', marginBottom: '1.5rem'}}>
              <li style={{marginBottom: '0.75rem'}}>Tariff policies change every week</li>
              <li style={{marginBottom: '0.75rem'}}>Your customs broker charges $500 per certificate</li>
              <li style={{marginBottom: '0.75rem'}}>You don&apos;t have time to research USMCA rules</li>
              <li style={{marginBottom: '0.75rem'}}>You suspect you&apos;re overpaying but don&apos;t know how to check</li>
            </ul>

            <p style={{fontWeight: 600, color: '#1e3a8a'}}>
              You&apos;re right to be frustrated. Small businesses get stuck paying tariffs that larger competitors avoid - simply because they have trade compliance teams and you don&apos;t.
            </p>
          </div>
        </div>
      </section>

      {/* What If You Had Your Own Trade Team */}
      <section className="main-content gradient-subtle">
        <div className="container-app" style={{maxWidth: '800px'}}>
          <div className="section-header">
            <h2 className="section-header-title">What If You Had Your Own Trade Team?</h2>
          </div>

          <div className="text-body" style={{fontSize: '1.1rem', lineHeight: '1.8', color: '#374151'}}>
            <p style={{marginBottom: '1.5rem'}}>
              That&apos;s what this platform does. It handles the complex USMCA calculations and tariff research that normally requires:
            </p>

            <ul style={{paddingLeft: '1.5rem', marginBottom: '1.5rem'}}>
              <li style={{marginBottom: '0.75rem'}}>A customs broker ($300-500 per analysis)</li>
              <li style={{marginBottom: '0.75rem'}}>A trade compliance specialist (6+ hours of research)</li>
              <li style={{marginBottom: '0.75rem'}}>Daily monitoring of tariff policy changes</li>
              <li style={{marginBottom: '0.75rem'}}>Expert knowledge of USMCA rules and RVC calculations</li>
            </ul>

            <p style={{fontWeight: 600, fontSize: '1.25rem', color: '#1e3a8a'}}>
              Now you can do it yourself in 5 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Built For Business Owners Who Are On Their Own */}
      <section className="main-content">
        <div className="container-app" style={{maxWidth: '800px'}}>
          <div className="section-header">
            <h2 className="section-header-title">Built For Business Owners Who Are On Their Own</h2>
          </div>

          <div className="text-body" style={{fontSize: '1.1rem', lineHeight: '1.8', color: '#374151'}}>
            <div style={{marginBottom: '2rem'}}>
              <p style={{fontWeight: 600, marginBottom: '0.5rem'}}>You don&apos;t need to become a trade expert.</p>
              <p>Answer questions about your product and suppliers - we handle the technical analysis.</p>
            </div>

            <div style={{marginBottom: '2rem'}}>
              <p style={{fontWeight: 600, marginBottom: '0.5rem'}}>You don&apos;t need to monitor tariff changes.</p>
              <p>We track Section 301, Section 232, and USMCA rule updates daily.</p>
            </div>

            <div>
              <p style={{fontWeight: 600, marginBottom: '0.5rem'}}>You don&apos;t need to trust our math blindly.</p>
              <p>Download the analysis, verify with your customs broker, then decide.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Example */}
      <section className="main-content gradient-subtle">
        <div className="container-app" style={{maxWidth: '800px'}}>
          <div className="section-header">
            <h2 className="section-header-title">Real Example: Electronics Importer</h2>
          </div>

          <div className="text-body" style={{fontSize: '1.1rem', lineHeight: '1.8', color: '#374151'}}>
            <p style={{marginBottom: '1rem'}}><strong>Before:</strong> Paying 25% Section 301 tariffs on China-sourced components</p>
            <p style={{marginBottom: '1rem'}}><strong>After:</strong> Discovered 72% USMCA qualification through Mexico assembly</p>
            <p style={{marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.25rem', color: '#059669'}}>Annual Savings: $43,750 in eliminated tariffs</p>
            <p style={{fontStyle: 'italic', color: '#6b7280'}}>They didn&apos;t know they qualified. They were just trying to keep their business running.</p>
          </div>
        </div>
      </section>

      {/* Your Situation, Your Control */}
      <section className="main-content">
        <div className="container-app" style={{maxWidth: '800px'}}>
          <div className="section-header">
            <h2 className="section-header-title">Your Situation, Your Control</h2>
          </div>

          <div className="text-body" style={{fontSize: '1.1rem', lineHeight: '1.8', color: '#374151'}}>
            <p style={{marginBottom: '1.5rem'}}>
              This isn&apos;t another service where you wait for consultants to call you back. You:
            </p>

            <ul style={{paddingLeft: '1.5rem', marginBottom: '1.5rem'}}>
              <li style={{marginBottom: '0.75rem'}}>Run the analysis yourself whenever you need it</li>
              <li style={{marginBottom: '0.75rem'}}>See the calculations and methodology</li>
              <li style={{marginBottom: '0.75rem'}}>Verify the results with your own broker</li>
              <li style={{marginBottom: '0.75rem'}}>Generate certificates on your own timeline</li>
            </ul>

            <p style={{fontWeight: 600, fontSize: '1.25rem', color: '#1e3a8a'}}>
              You own the data. You make the decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Start Free */}
      <section className="main-content gradient-subtle">
        <div className="container-app" style={{maxWidth: '700px', textAlign: 'center'}}>
          <h2 className="section-header-title">Start Free - See If You Qualify</h2>
          <p className="text-body" style={{fontSize: '1.1rem', marginBottom: '2rem'}}>
            14-day free trial • No credit card required • Full platform access
          </p>
          <p className="text-body" style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '2rem', color: '#1e3a8a'}}>
            Find out in 5 minutes if you&apos;re overpaying tariffs.
          </p>
          <Link href="/signup" className="btn-primary" style={{fontSize: '1.2rem', padding: '1rem 2.5rem'}}>
            Start Free Analysis →
          </Link>
        </div>
      </section>

      {/* Questions */}
      <section className="main-content">
        <div className="container-app" style={{maxWidth: '800px'}}>
          <div className="section-header">
            <h2 className="section-header-title">Questions?</h2>
          </div>

          <div style={{display: 'grid', gap: '2rem'}}>
            <div>
              <h3 style={{fontSize: '1.25rem', fontWeight: 600, color: '#1e3a8a', marginBottom: '0.75rem'}}>
                &quot;What if I get the inputs wrong?&quot;
              </h3>
              <p className="text-body" style={{fontSize: '1.05rem', lineHeight: '1.7'}}>
                We guide you through each field and explain what information we need. Plus you can verify results with your broker before filing.
              </p>
            </div>

            <div>
              <h3 style={{fontSize: '1.25rem', fontWeight: 600, color: '#1e3a8a', marginBottom: '0.75rem'}}>
                &quot;Is this legally valid?&quot;
              </h3>
              <p className="text-body" style={{fontSize: '1.05rem', lineHeight: '1.7'}}>
                Yes. We generate official USMCA Form D certificates. You verify accuracy and your broker files with CBP.
              </p>
            </div>

            <div>
              <h3 style={{fontSize: '1.25rem', fontWeight: 600, color: '#1e3a8a', marginBottom: '0.75rem'}}>
                &quot;What if my situation is complex?&quot;
              </h3>
              <p className="text-body" style={{fontSize: '1.05rem', lineHeight: '1.7'}}>
                Start with our platform for the analysis. If you need consulting help, at least you&apos;ll know exactly what questions to ask.
              </p>
            </div>
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
