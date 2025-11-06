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
        <meta name="description" content="AI-powered USMCA compliance software for importers, exporters, and producers. Automated certificate generation, real-time tariff alerts, and HS code classification. $99/month." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Triangle Trade Intelligence | AI-Powered USMCA Compliance" />
        <meta property="og:description" content="AI-powered USMCA compliance software with automated certificate generation and real-time tariff alerts for importers, exporters, and producers." />

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
                "Real-Time Tariff Alerts",
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
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            opacity: 0.75
          }}
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

      {/* Platform Features - What The App Does */}
      <section className="main-content" style={{background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'}}>
        <div className="container-app">
          <div className="section-header" style={{textAlign: 'center', marginBottom: '3rem'}}>
            <h2 className="section-header-title" style={{color: '#fff', fontSize: '2.5rem'}}>
              AI-Powered USMCA Compliance Platform
            </h2>
            <p className="section-header-subtitle" style={{color: '#e0f2fe', fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto'}}>
              Automated compliance tools built for importers, exporters, and producers trading in North America.
            </p>
          </div>

          <div className="feature-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '3rem'}}>
            {/* AI-Powered Analysis */}
            <div className="card" style={{background: 'rgba(255, 255, 255, 0.95)', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🤖</div>
              <h3 className="card-title" style={{color: '#1e3a8a', fontSize: '1.5rem', marginBottom: '1rem'}}>
                AI Classification & Analysis
              </h3>
              <p className="text-body" style={{color: '#334155', lineHeight: '1.6'}}>
                AI automatically classifies your products with correct HS codes, calculates USMCA qualification, and generates compliance reports in minutes.
              </p>
              <ul style={{marginTop: '1rem', paddingLeft: '1.5rem', color: '#475569'}}>
                <li>Automated HS code suggestions</li>
                <li>Regional Value Content calculations</li>
                <li>Instant qualification status</li>
              </ul>
            </div>

            {/* Real-Time Alerts */}
            <div className="card" style={{background: 'rgba(255, 255, 255, 0.95)', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🚨</div>
              <h3 className="card-title" style={{color: '#1e3a8a', fontSize: '1.5rem', marginBottom: '1rem'}}>
                24/7 Policy Monitoring
              </h3>
              <p className="text-body" style={{color: '#334155', lineHeight: '1.6'}}>
                Platform monitors Federal Register, USTR, and government sources 24/7. Get automated alerts when tariff changes affect your products.
              </p>
              <ul style={{marginTop: '1rem', paddingLeft: '1.5rem', color: '#475569'}}>
                <li>Real-time tariff change detection</li>
                <li>Section 301/232 tracking</li>
                <li>Daily email digest of relevant changes</li>
              </ul>
            </div>

            {/* Automated Certificates */}
            <div className="card" style={{background: 'rgba(255, 255, 255, 0.95)', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📜</div>
              <h3 className="card-title" style={{color: '#1e3a8a', fontSize: '1.5rem', marginBottom: '1rem'}}>
                Certificate Generation
              </h3>
              <p className="text-body" style={{color: '#334155', lineHeight: '1.6'}}>
                Automatically generate USMCA Certificate of Origin (Form D) with all required fields pre-filled from your analysis data.
              </p>
              <ul style={{marginTop: '1rem', paddingLeft: '1.5rem', color: '#475569'}}>
                <li>Official USMCA Form D format</li>
                <li>Edit fields before download</li>
                <li>PDF ready for customs submission</li>
              </ul>
            </div>
          </div>

          {/* Self-Serve Platform Banner */}
          <div className="card" style={{background: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255,255,255,0.3)', padding: '2rem', marginTop: '3rem', textAlign: 'center'}}>
            <p style={{color: '#e0f2fe', fontSize: '1.1rem', lineHeight: '1.8', margin: 0}}>
              <strong style={{color: '#fff', fontSize: '1.3rem'}}>Self-Serve SaaS Platform:</strong><br/>
              No consultants. No meetings. No human bottlenecks. Just AI-powered automated analysis available 24/7.
              Built for importers, exporters, and producers who need compliance tools, not consulting services.
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

      {/* See It In Action - Product Screenshots */}
      <section className="main-content" style={{background: '#f9fafb'}}>
        <div className="container-app">
          <div className="section-header" style={{textAlign: 'center', marginBottom: '3rem'}}>
            <h2 className="section-header-title">See It In Action</h2>
            <p className="section-header-subtitle">
              Real screenshots from the Triangle Trade Intelligence Platform
            </p>
          </div>

          {/* Feature Showcase Grid */}
          <div style={{display: 'grid', gap: '3rem'}}>

            {/* USMCA Analysis Results */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center'}}>
              <div>
                <h3 style={{fontSize: '1.75rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '1rem'}}>
                  Instant USMCA Qualification Results
                </h3>
                <p style={{fontSize: '1.125rem', color: '#475569', lineHeight: '1.7', marginBottom: '1rem'}}>
                  Get immediate qualification status with detailed component breakdown, tariff savings calculations, and regional value content analysis. No manual calculations required.
                </p>
                <ul style={{paddingLeft: '1.5rem', color: '#475569', fontSize: '1rem', lineHeight: '1.8'}}>
                  <li>Real-time qualification status (Qualified/Not Qualified/Needs Review)</li>
                  <li>Component-by-component tariff rate analysis</li>
                  <li>Annual savings projections</li>
                  <li>MFN vs USMCA rate comparisons</li>
                </ul>
              </div>
              <div style={{borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)'}}>
                <img
                  src="/image/samples/results.png"
                  alt="USMCA qualification results showing component breakdown and tariff savings"
                  style={{width: '100%', height: 'auto', display: 'block'}}
                />
              </div>
            </div>

            {/* AI-Powered Strategic Analysis */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center'}}>
              <div style={{borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', order: -1}}>
                <img
                  src="/image/samples/result ai.png"
                  alt="AI-generated strategic analysis and recommendations"
                  style={{width: '100%', height: 'auto', display: 'block'}}
                />
              </div>
              <div>
                <h3 style={{fontSize: '1.75rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '1rem'}}>
                  AI-Powered Strategic Intelligence
                </h3>
                <p style={{fontSize: '1.125rem', color: '#475569', lineHeight: '1.7', marginBottom: '1rem'}}>
                  Get consulting-grade strategic analysis powered by AI. Our system analyzes your supply chain against USMCA requirements and provides actionable recommendations.
                </p>
                <ul style={{paddingLeft: '1.5rem', color: '#475569', fontSize: '1rem', lineHeight: '1.8'}}>
                  <li>Supply chain vulnerability assessment</li>
                  <li>USMCA 2026 renegotiation impact analysis</li>
                  <li>Sourcing optimization recommendations</li>
                  <li>Risk mitigation strategies</li>
                </ul>
              </div>
            </div>

            {/* Crisis Alerts Dashboard */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center'}}>
              <div>
                <h3 style={{fontSize: '1.75rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '1rem'}}>
                  Real-Time Crisis Alerts & Policy Monitoring
                </h3>
                <p style={{fontSize: '1.125rem', color: '#475569', lineHeight: '1.7', marginBottom: '1rem'}}>
                  Platform monitors Federal Register, USTR, and government sources 24/7. Get component-specific alerts when tariff changes affect your products.
                </p>
                <ul style={{paddingLeft: '1.5rem', color: '#475569', fontSize: '1rem', lineHeight: '1.8'}}>
                  <li>Section 301/232 tariff change detection</li>
                  <li>Component-level alert matching</li>
                  <li>Severity-based color coding (Critical/High/Medium/Low)</li>
                  <li>Email notifications for urgent updates</li>
                </ul>
              </div>
              <div style={{borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)'}}>
                <img
                  src="/image/samples/alerts.png"
                  alt="Crisis alerts dashboard showing tariff changes and policy updates"
                  style={{width: '100%', height: 'auto', display: 'block'}}
                />
              </div>
            </div>

            {/* USMCA Certificate Preview */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center'}}>
              <div style={{borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', order: -1}}>
                <img
                  src="/image/samples/certificate preview.png"
                  alt="USMCA Certificate of Origin preview with editable fields"
                  style={{width: '100%', height: 'auto', display: 'block'}}
                />
              </div>
              <div>
                <h3 style={{fontSize: '1.75rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '1rem'}}>
                  Official USMCA Certificate Generation
                </h3>
                <p style={{fontSize: '1.125rem', color: '#475569', lineHeight: '1.7', marginBottom: '1rem'}}>
                  Automatically generate USMCA Certificate of Origin (Form D) with all required fields pre-filled from your analysis. Edit any field before download.
                </p>
                <ul style={{paddingLeft: '1.5rem', color: '#475569', fontSize: '1rem', lineHeight: '1.8'}}>
                  <li>Official USMCA Form D format</li>
                  <li>All fields auto-populated from analysis</li>
                  <li>Edit any field before download</li>
                  <li>PDF ready for customs submission</li>
                </ul>
              </div>
            </div>

            {/* Dashboard Overview */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center'}}>
              <div>
                <h3 style={{fontSize: '1.75rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '1rem'}}>
                  Comprehensive Dashboard & History
                </h3>
                <p style={{fontSize: '1.125rem', color: '#475569', lineHeight: '1.7', marginBottom: '1rem'}}>
                  Access all your USMCA analyses, certificates, and alerts from one centralized dashboard. Track qualification status and monitor your supply chain.
                </p>
                <ul style={{paddingLeft: '1.5rem', color: '#475569', fontSize: '1rem', lineHeight: '1.8'}}>
                  <li>View all past USMCA analyses</li>
                  <li>Download certificates anytime</li>
                  <li>Track active policy alerts</li>
                  <li>Monitor subscription usage</li>
                </ul>
              </div>
              <div style={{borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)'}}>
                <img
                  src="/image/samples/dashboard.png"
                  alt="User dashboard showing USMCA analyses and certificates"
                  style={{width: '100%', height: 'auto', display: 'block'}}
                />
              </div>
            </div>

          </div>

          {/* CTA Button */}
          <div style={{textAlign: 'center', marginTop: '3rem'}}>
            <Link href="/pricing" className="btn-primary" style={{fontSize: '1.2rem', padding: '1rem 2rem'}}>
              Try It Free - Start Your First Analysis
            </Link>
            <p style={{marginTop: '1rem', color: '#6b7280'}}>
              No credit card required for trial • 1 free USMCA analysis included
            </p>
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
              <h3 className="content-card-title">Strategic Recommendations</h3>
              <p className="content-card-description">
                AI-generated portfolio briefings with USMCA optimization strategies.
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
