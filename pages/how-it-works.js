import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Footer from '../components/Footer'
import LegalDisclaimer from '../components/LegalDisclaimer'

export default function HowItWorksPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <>
      <Head>
        <title>How It Works | Triangle Trade Intelligence</title>
        <meta name="description" content="Step-by-step guide to USMCA qualification analysis. Run your own trade compliance analysis in 5 minutes without becoming an expert." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Fixed Navigation */}
      <nav className="nav-fixed">
        <div className="nav-container">
          <Link href="/" className="nav-logo-link">
            <div className="nav-logo-icon">T</div>
            <div>
              <div className="nav-logo-text">Triangle Trade Intelligence</div>
              <div className="nav-logo-subtitle">USMCA Compliance Platform</div>
            </div>
          </Link>
          <button
            className="nav-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            ☰
          </button>

          <div className={`nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <Link href="/pricing" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/signup" className="nav-cta-button" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
            <Link href="/login" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
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

        <div className="hero-gradient-overlay" />

        <div className="hero-content-container">
          <h1 className="hero-main-title">How It Works</h1>
          <p className="hero-description-text" style={{marginTop: '2rem'}}>
            You don&apos;t need to be a trade expert. Just answer questions about your business - we&apos;ll handle the complex calculations.
          </p>
        </div>
      </section>

      {/* Step 1: Company Info */}
      <section className="main-content">
        <div className="container-app" style={{maxWidth: '900px'}}>
          <div className="section-header">
            <h2 className="section-header-title">Step 1: Tell Us About Your Company</h2>
          </div>

          <div className="text-body" style={{fontSize: '1.1rem', lineHeight: '1.8'}}>
            <h3 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem'}}>What we need to know:</h3>
            <ul style={{paddingLeft: '1.5rem', marginBottom: '2rem'}}>
              <li style={{marginBottom: '0.5rem'}}>Company name, address, and tax ID</li>
              <li style={{marginBottom: '0.5rem'}}>Where you manufacture or assemble your product</li>
              <li style={{marginBottom: '0.5rem'}}>Your destination market (US, Canada, or Mexico)</li>
              <li style={{marginBottom: '0.5rem'}}>Annual trade volume</li>
            </ul>

            <div style={{background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
              <p style={{fontWeight: 600, marginBottom: '0.5rem'}}>Why this matters:</p>
              <p style={{marginBottom: 0}}>
                This basic information goes directly onto your USMCA certificate. We also use your manufacturing location and destination to determine which tariff rates apply.
              </p>
            </div>

            <p style={{fontWeight: 600, color: '#059669'}}>Time: 2 minutes</p>
          </div>
        </div>
      </section>

      {/* Step 2: Components */}
      <section className="main-content gradient-subtle">
        <div className="container-app" style={{maxWidth: '900px'}}>
          <div className="section-header">
            <h2 className="section-header-title">Step 2: Add Your Components</h2>
          </div>

          <div className="text-body" style={{fontSize: '1.1rem', lineHeight: '1.8'}}>
            <h3 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem'}}>What we need:</h3>
            <ul style={{paddingLeft: '1.5rem', marginBottom: '2rem'}}>
              <li style={{marginBottom: '0.5rem'}}>Component descriptions (simple language is fine - &quot;aluminum housing&quot; or &quot;power supply&quot;)</li>
              <li style={{marginBottom: '0.5rem'}}>Country of origin for each component</li>
              <li style={{marginBottom: '0.5rem'}}>Value percentage of each component</li>
            </ul>

            <h3 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem'}}>What we do automatically:</h3>
            <ul style={{paddingLeft: '1.5rem', marginBottom: '2rem'}}>
              <li style={{marginBottom: '0.5rem'}}>Classify each component with the correct HS code</li>
              <li style={{marginBottom: '0.5rem'}}>Look up current tariff rates (MFN, USMCA, Section 301, Section 232)</li>
              <li style={{marginBottom: '0.5rem'}}>Flag any policy risks on specific components</li>
              <li style={{marginBottom: '0.5rem'}}>Calculate potential savings for each component</li>
            </ul>

            <div style={{background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
              <p style={{fontWeight: 600}}>
                Don&apos;t worry if you don&apos;t know HS codes. Our AI classifies components based on your descriptions. You&apos;ll see the suggested HS code and can verify it with your broker later.
              </p>
            </div>

            <p style={{fontWeight: 600, color: '#059669'}}>Time: 3 minutes for 5-10 components</p>

            {/* Placeholder for screenshot */}
            <div style={{background: '#e5e7eb', padding: '3rem', borderRadius: '8px', marginTop: '2rem', textAlign: 'center', color: '#6b7280'}}>
              <p style={{fontStyle: 'italic', marginBottom: 0}}>Screenshot: Component table showing HS codes, origins, and tariff alerts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Step 3: Results */}
      <section className="main-content">
        <div className="container-app" style={{maxWidth: '900px'}}>
          <div className="section-header">
            <h2 className="section-header-title">Step 3: See Your Complete Analysis</h2>
          </div>

          <div className="text-body" style={{fontSize: '1.1rem', lineHeight: '1.8'}}>
            <h3 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem'}}>Your results dashboard shows:</h3>

            <div style={{marginBottom: '2rem'}}>
              <p style={{fontWeight: 600, marginBottom: '0.75rem'}}>USMCA Qualification Status</p>
              <ul style={{paddingLeft: '1.5rem'}}>
                <li style={{marginBottom: '0.5rem'}}>Whether you qualify (yes/no)</li>
                <li style={{marginBottom: '0.5rem'}}>Your exact regional content percentage</li>
                <li style={{marginBottom: '0.5rem'}}>Required threshold for your industry</li>
                <li style={{marginBottom: '0.5rem'}}>Safety margin (how close you are to the threshold)</li>
              </ul>
            </div>

            <div style={{marginBottom: '2rem'}}>
              <p style={{fontWeight: 600, marginBottom: '0.75rem'}}>Financial Impact</p>
              <ul style={{paddingLeft: '1.5rem'}}>
                <li style={{marginBottom: '0.5rem'}}>Current annual savings (if qualified)</li>
                <li style={{marginBottom: '0.5rem'}}>Potential savings with supply chain changes</li>
                <li style={{marginBottom: '0.5rem'}}>Policy risk exposure (Section 301, Section 232)</li>
                <li style={{marginBottom: '0.5rem'}}>Component-by-component tariff breakdown</li>
              </ul>
            </div>

            <div style={{background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
              <p style={{fontWeight: 600, marginBottom: '0.5rem'}}>What this tells you:</p>
              <p style={{marginBottom: 0}}>
                Whether you&apos;re overpaying tariffs, what your supply chain risks are, and exactly where your money is going.
              </p>
            </div>

            <p style={{fontWeight: 600, color: '#059669', marginBottom: '2rem'}}>Time: 2 minutes to review</p>

            {/* Placeholder for screenshot */}
            <div style={{background: '#e5e7eb', padding: '3rem', borderRadius: '8px', textAlign: 'center', color: '#6b7280'}}>
              <p style={{fontStyle: 'italic', marginBottom: 0}}>Screenshot: Results dashboard showing qualification status and financial breakdown</p>
            </div>
          </div>
        </div>
      </section>

      {/* Step 4: Strategic Recommendations */}
      <section className="main-content gradient-subtle">
        <div className="container-app" style={{maxWidth: '900px'}}>
          <div className="section-header">
            <h2 className="section-header-title">Step 4: Get Strategic Recommendations</h2>
          </div>

          <div className="text-body" style={{fontSize: '1.1rem', lineHeight: '1.8'}}>
            <h3 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem'}}>After your analysis, you receive:</h3>

            <div style={{marginBottom: '2rem'}}>
              <p style={{fontWeight: 600, marginBottom: '0.75rem'}}>Executive Advisory Report</p>
              <ul style={{paddingLeft: '1.5rem'}}>
                <li style={{marginBottom: '0.5rem'}}>Root cause analysis of your supply chain structure</li>
                <li style={{marginBottom: '0.5rem'}}>Financial scenarios (current state vs. alternatives)</li>
                <li style={{marginBottom: '0.5rem'}}>Specific supplier recommendations with ROI calculations</li>
                <li style={{marginBottom: '0.5rem'}}>Timeline and implementation roadmap</li>
              </ul>
            </div>

            <div style={{marginBottom: '2rem'}}>
              <p style={{fontWeight: 600, marginBottom: '0.75rem'}}>3-Phase Action Plan</p>
              <ul style={{paddingLeft: '1.5rem'}}>
                <li style={{marginBottom: '0.5rem'}}>Phase 1: Immediate actions (supplier assessment, documentation audit)</li>
                <li style={{marginBottom: '0.5rem'}}>Phase 2: Validation steps (trial shipments, quality testing)</li>
                <li style={{marginBottom: '0.5rem'}}>Phase 3: Full implementation (migration timeline, cost commitments)</li>
              </ul>
            </div>

            <div style={{background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
              <p style={{fontWeight: 600}}>
                This isn&apos;t generic advice. Every recommendation is specific to your components, your volumes, and your business situation.
              </p>
            </div>

            <p style={{fontWeight: 600, color: '#059669'}}>Time: 5 minutes to review strategic options</p>

            {/* Placeholder for screenshots */}
            <div style={{background: '#e5e7eb', padding: '3rem', borderRadius: '8px', marginTop: '2rem', marginBottom: '1rem', textAlign: 'center', color: '#6b7280'}}>
              <p style={{fontStyle: 'italic', marginBottom: 0}}>Screenshot: Executive advisory showing strategic analysis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Step 5: Certificate */}
      <section className="main-content">
        <div className="container-app" style={{maxWidth: '900px'}}>
          <div className="section-header">
            <h2 className="section-header-title">Step 5: Download Your Certificate (If Qualified)</h2>
          </div>

          <div className="text-body" style={{fontSize: '1.1rem', lineHeight: '1.8'}}>
            <h3 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem'}}>If you qualify for USMCA:</h3>

            <div style={{marginBottom: '2rem'}}>
              <p style={{fontWeight: 600, marginBottom: '0.75rem'}}>Certificate Preview (Editable)</p>
              <ul style={{paddingLeft: '1.5rem'}}>
                <li style={{marginBottom: '0.5rem'}}>All fields pre-filled from your analysis</li>
                <li style={{marginBottom: '0.5rem'}}>Edit importer/exporter/producer information</li>
                <li style={{marginBottom: '0.5rem'}}>Verify product description and HS codes</li>
                <li style={{marginBottom: '0.5rem'}}>Modify blanket period dates if needed</li>
              </ul>
            </div>

            <div style={{background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
              <p style={{fontWeight: 600, marginBottom: '0.5rem'}}>What you do:</p>
              <p style={{marginBottom: 0}}>
                Review each field, make any corrections, then download the final PDF.
              </p>
            </div>

            <div style={{marginBottom: '2rem'}}>
              <p style={{fontWeight: 600, marginBottom: '0.75rem'}}>Final Certificate</p>
              <ul style={{paddingLeft: '1.5rem'}}>
                <li style={{marginBottom: '0.5rem'}}>Official USMCA Form D format</li>
                <li style={{marginBottom: '0.5rem'}}>Ready for your customs broker to file with CBP</li>
                <li style={{marginBottom: '0.5rem'}}>Valid for one year (blanket certificate)</li>
              </ul>
            </div>

            <div style={{background: '#fef3c7', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
              <p style={{fontWeight: 600, marginBottom: '0.5rem'}}>If you don&apos;t qualify:</p>
              <p style={{marginBottom: 0}}>
                We show you exactly what changes would get you there - like nearshoring specific components or changing manufacturing location.
              </p>
            </div>

            <p style={{fontWeight: 600, color: '#059669'}}>Time: 2 minutes to edit and download</p>

            {/* Placeholder for screenshot */}
            <div style={{background: '#e5e7eb', padding: '3rem', borderRadius: '8px', marginTop: '2rem', textAlign: 'center', color: '#6b7280'}}>
              <p style={{fontStyle: 'italic', marginBottom: 0}}>Screenshot: Editable certificate preview and final certificate</p>
            </div>
          </div>
        </div>
      </section>

      {/* What If You're Not Sure */}
      <section className="main-content gradient-subtle">
        <div className="container-app" style={{maxWidth: '800px'}}>
          <div className="section-header">
            <h2 className="section-header-title">What Happens If You&apos;re Not Sure?</h2>
          </div>

          <div className="text-body" style={{fontSize: '1.1rem', lineHeight: '1.8'}}>
            <p style={{marginBottom: '1.5rem'}}>That&apos;s normal. Most small business owners aren&apos;t trade compliance experts.</p>

            <p style={{fontWeight: 600, marginBottom: '1rem'}}>You can:</p>
            <ol style={{paddingLeft: '1.5rem', marginBottom: '2rem'}}>
              <li style={{marginBottom: '0.75rem'}}>Run the analysis to see what it says</li>
              <li style={{marginBottom: '0.75rem'}}>Download the detailed results and strategic recommendations</li>
              <li style={{marginBottom: '0.75rem'}}>Share everything with your customs broker for verification</li>
              <li style={{marginBottom: '0.75rem'}}>Edit the certificate based on their feedback</li>
              <li style={{marginBottom: '0.75rem'}}>Download the final version when you&apos;re confident</li>
            </ol>

            <p style={{fontWeight: 600, color: '#1e3a8a'}}>
              You&apos;re not locked into anything. Think of this as the research tool that gives you the information to make informed decisions with your broker.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="main-content">
        <div className="container-app" style={{maxWidth: '700px', textAlign: 'center'}}>
          <h2 className="section-header-title">Ready to See If You Qualify?</h2>
          <p className="text-body" style={{fontSize: '1.1rem', marginBottom: '2rem'}}>
            14-day free trial • No credit card • Full platform access
          </p>
          <Link href="/signup" className="btn-primary" style={{fontSize: '1.2rem', padding: '1rem 2.5rem'}}>
            Start Free Analysis →
          </Link>
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
