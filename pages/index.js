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
            <Link href="/certificate-of-origin" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
              Certificate
            </Link>
            <Link href="/ongoing-alerts" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
              Alerts
            </Link>
            <Link href="/pricing" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </Link>
            <Link href="/signup" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
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

          <p className="hero-description-text homepage-margin-top-2">
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

          {/* Data Freshness Trust Badge */}
          <div style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backdropFilter: 'blur(10px)'
            }}>
              <span style={{ color: '#10b981', fontSize: '1.1rem' }}>✓</span>
              <span style={{ color: 'white', fontSize: '0.875rem' }}>
                <strong>12,118</strong> HS codes (USITC official)
              </span>
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backdropFilter: 'blur(10px)'
            }}>
              <span style={{ color: '#10b981', fontSize: '1.1rem' }}>✓</span>
              <span style={{ color: 'white', fontSize: '0.875rem' }}>
                <strong>Real-time</strong> AI tariff lookups
              </span>
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backdropFilter: 'blur(10px)'
            }}>
              <span style={{ color: '#10b981', fontSize: '1.1rem' }}>✓</span>
              <span style={{ color: 'white', fontSize: '0.875rem' }}>
                <strong>Daily</strong> policy monitoring
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* You're Not Alone */}
      <section className="main-content homepage-section-gray">
        <div className="container-app homepage-container-narrow">
          <div className="section-header homepage-section-header-centered">
            <h2 className="section-header-title">You&apos;re Not Alone</h2>
            <p className="homepage-subtitle">
              You&apos;re managing imports, dealing with customs brokers, and trying to keep costs down. Meanwhile:
            </p>
          </div>

          {/* 2x2 Grid of Pain Points */}
          <div className="grid-2-cols">
            {/* Card 1: Tariff Policies */}
            <div className="content-card">
              <h3 className="content-card-title">
                Tariff Policies Change Every Week
              </h3>
              <p className="content-card-description">
                Section 301, Section 232, USMCA updates—impossible to track alone
              </p>
            </div>

            {/* Card 2: Broker Costs */}
            <div className="content-card">
              <h3 className="content-card-title">
                Broker Consulting Fees Add Up Fast
              </h3>
              <p className="content-card-description">
                $200-400/hour every time you need supply chain impact analysis
              </p>
            </div>

            {/* Card 3: No Time */}
            <div className="content-card">
              <h3 className="content-card-title">
                No Time to Research USMCA Rules
              </h3>
              <p className="content-card-description">
                RVC calculations, origin rules, preference criteria—it&apos;s a second job
              </p>
            </div>

            {/* Card 4: Suspect Overpaying */}
            <div className="content-card">
              <h3 className="content-card-title">
                You Suspect You&apos;re Overpaying
              </h3>
              <p className="content-card-description">
                But you don&apos;t have a trade team to verify if you qualify
              </p>
            </div>
          </div>

          {/* Empathy Statement - Dark Blue Box */}
          <div className="homepage-empathy-box">
            <p>
              You&apos;re right to be frustrated. Small businesses get stuck paying tariffs that larger competitors avoid—simply because they have trade compliance teams and you don&apos;t.
            </p>
          </div>
        </div>
      </section>

      {/* What If You Had Your Own Trade Team */}
      <section className="main-content homepage-section-white">
        <div className="container-app homepage-container-narrow">
          <div className="section-header homepage-section-header-centered">
            <h2 className="section-header-title">What If You Had Your Own Trade Team?</h2>
            <p className="homepage-subtitle">
              That&apos;s what this platform does. It handles the complex USMCA calculations and tariff research that normally requires:
            </p>
          </div>

          {/* 2x2 Grid - What You'd Need */}
          <div className="grid-2-cols">
            <div className="content-card">
              <h3 className="content-card-title">
                A Customs Broker
              </h3>
              <p className="content-card-description">
                $300-500 per analysis
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">
                A Trade Compliance Specialist
              </h3>
              <p className="content-card-description">
                6+ hours of research
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">
                Daily Policy Monitoring
              </h3>
              <p className="content-card-description">
                Tariff policy changes
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">
                Expert Knowledge
              </h3>
              <p className="content-card-description">
                USMCA rules and RVC calculations
              </p>
            </div>
          </div>

          {/* Green Success Box */}
          <div className="homepage-success-box">
            <p>
              Now you can do it yourself in 5 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Built For Business Owners Who Are On Their Own */}
      <section className="main-content homepage-section-gray">
        <div className="container-app homepage-container-narrow">
          <div className="section-header homepage-section-header-centered">
            <h2 className="section-header-title">Built For Business Owners Who Are On Their Own</h2>
          </div>

          {/* 3 Cards in Row */}
          <div className="grid-3-cols">
            <div className="content-card">
              <h3 className="content-card-title">
                You don&apos;t need to become a trade expert
              </h3>
              <p className="content-card-description">
                Answer questions about your product and suppliers - we handle the technical analysis
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">
                You don&apos;t need to monitor tariff changes
              </h3>
              <p className="content-card-description">
                We track Section 301, Section 232, and USMCA rule updates daily
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">
                You don&apos;t need to trust our math blindly
              </h3>
              <p className="content-card-description">
                Download the analysis, verify with your customs broker, then decide
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Example */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Real Example: Electronics Importer</h2>
          </div>

          <div className="grid-2-cols">
            <div className="content-card">
              <h3 className="content-card-title">Before</h3>
              <p className="content-card-description">
                Paying 25% Section 301 tariffs on China-sourced components
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">After</h3>
              <p className="content-card-description">
                Discovered 72% USMCA qualification through Mexico assembly
              </p>
              <p className="content-card-description">
                <strong>Annual Savings: $43,750 in eliminated tariffs</strong>
              </p>
            </div>
          </div>

          <div className="section-header">
            <p className="section-header-subtitle">
              They didn&apos;t know they qualified. They were just trying to keep their business running.
            </p>
          </div>
        </div>
      </section>

      {/* Your Situation, Your Control */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Your Situation, Your Control</h2>
            <p className="section-header-subtitle">
              This isn&apos;t another service where you wait for consultants to call you back. You:
            </p>
          </div>

          <div className="content-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <ul className="bullet-list">
              <li className="text-body">Run the analysis yourself whenever you need it</li>
              <li className="text-body">See the calculations and methodology</li>
              <li className="text-body">Verify the results with your own broker</li>
              <li className="text-body">Generate certificates on your own timeline</li>
            </ul>
          </div>

          <div className="section-header">
            <p className="section-header-subtitle">
              <strong>You own the data. You make the decisions.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Start Free */}
      <section className="main-content">
        <div className="container-app text-center">
          <h2 className="section-header-title">Start Free - See If You Qualify</h2>

          <div className="hero-trial-benefits">
            <div className="trial-benefit-item">14-day free trial</div>
            <div className="trial-benefit-item">No credit card required</div>
            <div className="trial-benefit-item">Full platform access</div>
          </div>

          <p className="section-header-subtitle">
            Find out in 5 minutes if you&apos;re overpaying tariffs.
          </p>

          <Link href="/signup" className="btn-primary">
            Start Free Analysis →
          </Link>
        </div>
      </section>

      {/* Questions */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Questions?</h2>
          </div>

          <div className="grid-2-cols">
            <div className="content-card">
              <h3 className="content-card-title">
                &quot;What if I get the inputs wrong?&quot;
              </h3>
              <p className="content-card-description">
                We guide you through each field and explain what information we need. Plus you can verify results with your broker before filing.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">
                &quot;Is this legally valid?&quot;
              </h3>
              <p className="content-card-description">
                Yes. We generate official USMCA Form D certificates. You verify accuracy and your broker files with CBP.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">
                &quot;What if my situation is complex?&quot;
              </h3>
              <p className="content-card-description">
                Start with our platform for the analysis. If you need consulting help, at least you&apos;ll know exactly what questions to ask.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Removed: Long "See It In Action" screenshot galleries, "Alert Monitoring", and calculator sections - keeping homepage focused for busy SMBs */}

      {/* Data Transparency Section */}
      <section className="main-content" style={{ backgroundColor: '#f8fafc' }}>
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Always Current, Always Transparent</h2>
            <p className="section-header-subtitle">
              Unlike competitors with quarterly-updated databases, we use a hybrid approach for maximum accuracy
            </p>
          </div>

          <div className="grid-3-cols" style={{ marginTop: '2rem' }}>
            <div className="content-card">
              <div style={{ fontSize: '2.5rem', color: '#2563eb', marginBottom: '0.5rem' }}>75%</div>
              <h3 className="content-card-title">Instant Database</h3>
              <p className="content-card-description">
                12,118 HS codes from official USITC Harmonized Tariff Schedule
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Response time: &lt;100ms
              </p>
            </div>

            <div className="content-card">
              <div style={{ fontSize: '2.5rem', color: '#7c3aed', marginBottom: '0.5rem' }}>25%</div>
              <h3 className="content-card-title">AI Real-Time Lookup</h3>
              <p className="content-card-description">
                Claude 3.5 Haiku fetches current Section 301/232 rates for codes not in database
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Response time: 2-3 seconds (always current)
              </p>
            </div>

            <div className="content-card">
              <div style={{ fontSize: '2.5rem', color: '#059669', marginBottom: '0.5rem' }}>24h</div>
              <h3 className="content-card-title">Daily Policy Monitoring</h3>
              <p className="content-card-description">
                Federal Register RSS feeds detect tariff policy changes within 24 hours
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Alert window: Same business day
              </p>
            </div>
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{ marginBottom: '1rem', color: '#1f2937' }}>Data Sources & Accuracy</h4>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '1.6', color: '#4b5563' }}>
              <li><strong>Primary:</strong> USITC Harmonized Tariff Schedule (official government data, 12,118 codes)</li>
              <li><strong>Fallback:</strong> AI-powered research via OpenRouter (Claude 3.5 Haiku) for current policy rates</li>
              <li><strong>Policy Tracking:</strong> Federal Register RSS feeds for Section 301/232 changes</li>
              <li><strong>Last Updated:</strong> November 2025 (database refresh), AI provides real-time lookups</li>
            </ul>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
              <strong>Verification Required:</strong> All tariff rates are for informational purposes. Users must verify with official USITC sources or licensed customs brokers before making business decisions.
            </p>
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
