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
      <section className="main-content" style={{background: '#f9fafb', paddingTop: '5rem', paddingBottom: '5rem'}}>
        <div className="container-app" style={{maxWidth: '1000px'}}>
          <div className="section-header" style={{textAlign: 'center', marginBottom: '3rem'}}>
            <h2 className="section-header-title">You&apos;re Not Alone</h2>
            <p style={{fontSize: '1.25rem', color: '#4b5563', maxWidth: '800px', margin: '2rem auto 0', lineHeight: '1.7'}}>
              You&apos;re managing imports, dealing with customs brokers, and trying to keep costs down. Meanwhile:
            </p>
          </div>

          {/* 2x2 Grid of Pain Points */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '3.5rem'}}>
            {/* Card 1: Tariff Policies */}
            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              borderLeft: '4px solid #dc2626',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem'}}>
                Tariff Policies Change Every Week
              </h3>
              <p style={{color: '#6b7280', fontSize: '1rem', lineHeight: '1.6', marginBottom: 0}}>
                Section 301, Section 232, USMCA updates—impossible to track alone
              </p>
            </div>

            {/* Card 2: Broker Costs */}
            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              borderLeft: '4px solid #dc2626',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem'}}>
                Brokers Charge $500 Per Certificate
              </h3>
              <p style={{color: '#6b7280', fontSize: '1rem', lineHeight: '1.6', marginBottom: 0}}>
                And you need a new one every time your supply chain changes
              </p>
            </div>

            {/* Card 3: No Time */}
            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              borderLeft: '4px solid #dc2626',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem'}}>
                No Time to Research USMCA Rules
              </h3>
              <p style={{color: '#6b7280', fontSize: '1rem', lineHeight: '1.6', marginBottom: 0}}>
                RVC calculations, origin rules, preference criteria—it&apos;s a second job
              </p>
            </div>

            {/* Card 4: Suspect Overpaying */}
            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              borderLeft: '4px solid #dc2626',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem'}}>
                You Suspect You&apos;re Overpaying
              </h3>
              <p style={{color: '#6b7280', fontSize: '1rem', lineHeight: '1.6', marginBottom: 0}}>
                But you don&apos;t have a trade team to verify if you qualify
              </p>
            </div>
          </div>

          {/* Empathy Statement - Dark Blue Box */}
          <div style={{
            background: '#1e3a8a',
            color: '#fff',
            padding: '3rem',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <p style={{fontSize: '1.25rem', lineHeight: '1.8', marginBottom: 0, fontWeight: 500}}>
              You&apos;re right to be frustrated. Small businesses get stuck paying tariffs that larger competitors avoid—simply because they have trade compliance teams and you don&apos;t.
            </p>
          </div>
        </div>
      </section>

      {/* What If You Had Your Own Trade Team */}
      <section className="main-content" style={{paddingTop: '5rem', paddingBottom: '5rem'}}>
        <div className="container-app" style={{maxWidth: '1000px'}}>
          <div className="section-header" style={{textAlign: 'center', marginBottom: '3rem'}}>
            <h2 className="section-header-title">What If You Had Your Own Trade Team?</h2>
            <p style={{fontSize: '1.25rem', color: '#4b5563', maxWidth: '800px', margin: '2rem auto 0', lineHeight: '1.7'}}>
              That&apos;s what this platform does. It handles the complex USMCA calculations and tariff research that normally requires:
            </p>
          </div>

          {/* 2x2 Grid - What You'd Need */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '3.5rem'}}>
            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem'}}>
                A Customs Broker
              </h3>
              <p style={{color: '#6b7280', fontSize: '1rem', lineHeight: '1.6', marginBottom: 0}}>
                $300-500 per analysis
              </p>
            </div>

            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem'}}>
                A Trade Compliance Specialist
              </h3>
              <p style={{color: '#6b7280', fontSize: '1rem', lineHeight: '1.6', marginBottom: 0}}>
                6+ hours of research
              </p>
            </div>

            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem'}}>
                Daily Policy Monitoring
              </h3>
              <p style={{color: '#6b7280', fontSize: '1rem', lineHeight: '1.6', marginBottom: 0}}>
                Tariff policy changes
              </p>
            </div>

            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem'}}>
                Expert Knowledge
              </h3>
              <p style={{color: '#6b7280', fontSize: '1rem', lineHeight: '1.6', marginBottom: 0}}>
                USMCA rules and RVC calculations
              </p>
            </div>
          </div>

          {/* Green Success Box */}
          <div style={{
            background: '#059669',
            color: '#fff',
            padding: '3rem',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <p style={{fontSize: '1.5rem', lineHeight: '1.8', marginBottom: 0, fontWeight: 600}}>
              Now you can do it yourself in 5 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Built For Business Owners Who Are On Their Own */}
      <section className="main-content" style={{background: '#f9fafb', paddingTop: '5rem', paddingBottom: '5rem'}}>
        <div className="container-app" style={{maxWidth: '1000px'}}>
          <div className="section-header" style={{textAlign: 'center', marginBottom: '3.5rem'}}>
            <h2 className="section-header-title">Built For Business Owners Who Are On Their Own</h2>
          </div>

          {/* 3 Cards in Row */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem'}}>
            <div style={{
              background: '#fff',
              padding: '2.5rem',
              borderRadius: '8px',
              borderTop: '4px solid #1e3a8a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '1rem'}}>
                You don&apos;t need to become a trade expert
              </h3>
              <p style={{color: '#6b7280', fontSize: '1rem', lineHeight: '1.6', marginBottom: 0}}>
                Answer questions about your product and suppliers - we handle the technical analysis
              </p>
            </div>

            <div style={{
              background: '#fff',
              padding: '2.5rem',
              borderRadius: '8px',
              borderTop: '4px solid #1e3a8a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '1rem'}}>
                You don&apos;t need to monitor tariff changes
              </h3>
              <p style={{color: '#6b7280', fontSize: '1rem', lineHeight: '1.6', marginBottom: 0}}>
                We track Section 301, Section 232, and USMCA rule updates daily
              </p>
            </div>

            <div style={{
              background: '#fff',
              padding: '2.5rem',
              borderRadius: '8px',
              borderTop: '4px solid #1e3a8a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '1rem'}}>
                You don&apos;t need to trust our math blindly
              </h3>
              <p style={{color: '#6b7280', fontSize: '1rem', lineHeight: '1.6', marginBottom: 0}}>
                Download the analysis, verify with your customs broker, then decide
              </p>
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
      <section className="main-content" style={{paddingTop: '5rem', paddingBottom: '5rem'}}>
        <div className="container-app" style={{maxWidth: '800px'}}>
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            padding: '4rem 3rem',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(30, 58, 138, 0.2)'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '1.5rem',
              lineHeight: '1.2'
            }}>
              Start Free - See If You Qualify
            </h2>

            <div style={{
              display: 'inline-flex',
              gap: '1.5rem',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '2rem',
              flexWrap: 'wrap'
            }}>
              <span style={{color: '#fff', fontSize: '1.1rem', fontWeight: 500}}>14-day free trial</span>
              <span style={{color: 'rgba(255,255,255,0.6)'}}>•</span>
              <span style={{color: '#fff', fontSize: '1.1rem', fontWeight: 500}}>No credit card required</span>
              <span style={{color: 'rgba(255,255,255,0.6)'}}>•</span>
              <span style={{color: '#fff', fontSize: '1.1rem', fontWeight: 500}}>Full platform access</span>
            </div>

            <p style={{
              fontSize: '1.35rem',
              fontWeight: 600,
              color: '#fef3c7',
              marginBottom: '2.5rem',
              lineHeight: '1.6'
            }}>
              Find out in 5 minutes if you&apos;re overpaying tariffs.
            </p>

            <Link
              href="/signup"
              style={{
                display: 'inline-block',
                background: '#fff',
                color: '#1e3a8a',
                fontSize: '1.25rem',
                fontWeight: 700,
                padding: '1.25rem 3rem',
                borderRadius: '8px',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)';
              }}
            >
              Start Free Analysis →
            </Link>
          </div>
        </div>
      </section>

      {/* Questions */}
      <section className="main-content" style={{background: '#f9fafb', paddingTop: '5rem', paddingBottom: '5rem'}}>
        <div className="container-app" style={{maxWidth: '1000px'}}>
          <div className="section-header" style={{marginBottom: '3.5rem'}}>
            <h2 className="section-header-title">Questions?</h2>
          </div>

          <div style={{display: 'grid', gap: '1.5rem'}}>
            <div style={{
              background: '#fff',
              padding: '2.5rem',
              borderRadius: '8px',
              borderLeft: '4px solid #1e3a8a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.35rem', fontWeight: 700, color: '#111827', marginBottom: '1rem'}}>
                &quot;What if I get the inputs wrong?&quot;
              </h3>
              <p style={{fontSize: '1.05rem', lineHeight: '1.7', color: '#6b7280', margin: 0}}>
                We guide you through each field and explain what information we need. Plus you can verify results with your broker before filing.
              </p>
            </div>

            <div style={{
              background: '#fff',
              padding: '2.5rem',
              borderRadius: '8px',
              borderLeft: '4px solid #1e3a8a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.35rem', fontWeight: 700, color: '#111827', marginBottom: '1rem'}}>
                &quot;Is this legally valid?&quot;
              </h3>
              <p style={{fontSize: '1.05rem', lineHeight: '1.7', color: '#6b7280', margin: 0}}>
                Yes. We generate official USMCA Form D certificates. You verify accuracy and your broker files with CBP.
              </p>
            </div>

            <div style={{
              background: '#fff',
              padding: '2.5rem',
              borderRadius: '8px',
              borderLeft: '4px solid #1e3a8a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.35rem', fontWeight: 700, color: '#111827', marginBottom: '1rem'}}>
                &quot;What if my situation is complex?&quot;
              </h3>
              <p style={{fontSize: '1.05rem', lineHeight: '1.7', color: '#6b7280', margin: 0}}>
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
