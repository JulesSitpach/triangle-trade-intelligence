import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Footer from '../components/Footer'
import LegalDisclaimer from '../components/LegalDisclaimer'

export default function OngoingAlertsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [modalImage, setModalImage] = useState(null)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const openModal = (imageSrc) => {
    setModalImage(imageSrc)
  }

  const closeModal = () => {
    setModalImage(null)
  }

  return (
    <>
      <Head>
        <title>Ongoing Tariff Alerts & Reports | Triangle Trade Intelligence</title>
        <meta name="description" content="Daily tariff policy monitoring with personalized alerts and strategic portfolio reports. Stay ahead of Section 301, Section 232, and USMCA changes." />
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
            <Link href="/certificate-of-origin" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Certificate</Link>
            <Link href="/ongoing-alerts" className="nav-menu-link active" onClick={() => setMobileMenuOpen(false)}>Alerts</Link>
            <Link href="/pricing" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/signup" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
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
          <div className="hero-badge">
            Daily Tariff Policy Monitoring
          </div>

          <h1 className="hero-main-title">
            Ongoing Alerts & Reports<br/>
            <span className="hero-yellow-highlight">Stay Ahead of Policy Changes</span>
          </h1>

          <p className="hero-description-text">
            For importers, exporters, and manufacturers. Tariff policies change constantly. We monitor Section 301, Section 232, and USMCA updates daily - and alert you only when it affects YOUR components.
          </p>

          <div className="hero-button-group">
            <Link
              href="/signup"
              className="hero-primary-button"
              aria-label="Start monitoring"
            >
              Start Free Trial →
            </Link>
          </div>
        </div>
      </section>

      {/* Who Needs Ongoing Alerts */}
      <section className="main-content homepage-section-gray" style={{ paddingTop: '3rem', paddingBottom: '1rem' }}>
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Who Needs Ongoing Alerts?</h2>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <h3 className="content-card-title">Importers</h3>
              <p className="content-card-description">
                Avoid overpaying when tariffs increase. Get notified 30 days before Section 301 or Section 232 rate changes affect your products - giving you time to adjust pricing or find alternative suppliers.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Exporters</h3>
              <p className="content-card-description">
                Notify your B2B buyers when policy changes affect their duty-free status. Maintain competitive advantage by proactively addressing tariff impacts before your buyers discover them.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Manufacturers</h3>
              <p className="content-card-description">
                Know when policy changes could invalidate certificates you provided to distributors. Get alerts when USMCA thresholds or origin rules change, so you can update documentation before customs issues arise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Alerts Matter */}
      <section className="main-content homepage-section-gray">
        <div className="container-app homepage-container-narrow">
          <div className="section-header homepage-section-header-centered">
            <h2 className="section-header-title">Why Ongoing Monitoring Matters</h2>
            <p className="homepage-subtitle">
              You generated your certificate. Great. But tariff policies don&apos;t stay frozen.
            </p>
          </div>

          <div className="grid-2-cols">
            <div className="content-card">
              <h3 className="content-card-title">
                Section 301 Changes Weekly
              </h3>
              <p className="content-card-description">
                China tariffs get adjusted with 30-day notice. Miss the announcement? You&apos;re paying more than necessary.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">
                USMCA Rules Update
              </h3>
              <p className="content-card-description">
                Regional content thresholds and origin rules can change. Your qualifying certificate might not qualify next year.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">
                Section 232 Surprises
              </h3>
              <p className="content-card-description">
                Steel, aluminum, and strategic goods face sudden tariff adjustments with national security justifications.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">
                You Can&apos;t Monitor Everything
              </h3>
              <p className="content-card-description">
                Federal Register, USTR announcements, CBP rulings - impossible to track alone while running your business.
              </p>
            </div>
          </div>

          <div className="homepage-empathy-box">
            <p>
              Most importers, exporters, and manufacturers find out about tariff changes AFTER they&apos;ve already paid higher rates for 2-3 months. That&apos;s money you can&apos;t get back.
            </p>
          </div>
        </div>
      </section>

      {/* What We Monitor */}
      <section className="main-content homepage-section-white">
        <div className="container-app homepage-container-narrow">
          <div className="section-header homepage-section-header-centered">
            <h2 className="section-header-title">What We Monitor For You</h2>
          </div>

          <div className="grid-2-cols">
            <div className="content-card">
              <div style={{ display: 'flex', marginBottom: '1.5rem' }}>
                <img
                  src="/image/samples/Tariff Policy Threats biggest threat number 1.png"
                  alt="Tariff policy threats for components"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '50%' }}
                  onClick={() => openModal('/image/samples/Tariff Policy Threats biggest threat number 1.png')}
                />
              </div>
              <h3 className="content-card-title">Component-Level Alerts</h3>
              <p className="content-card-description">
                ✓ Specific to YOUR HS codes and origin countries
              </p>
              <p className="content-card-description">
                ✓ Section 301 rate adjustments (China tariffs)
              </p>
              <p className="content-card-description">
                ✓ Section 232 national security tariffs
              </p>
              <p className="content-card-description">
                ✓ USMCA threshold changes
              </p>
            </div>

            <div className="content-card">
              <div style={{ display: 'flex', marginBottom: '1.5rem' }}>
                <img
                  src="/image/samples/Tariff Policy Threats biggest threat number 2.png"
                  alt="Section 301 policy alerts preview"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '50%' }}
                  onClick={() => openModal('/image/samples/Tariff Policy Threats biggest threat number 2.png')}
                />
              </div>
              <h3 className="content-card-title">Live Policy Alerts (Section 301, 232)</h3>
              <p className="content-card-description">
                ✓ Country-wide tariff changes (e.g., all China imports)
              </p>
              <p className="content-card-description">
                ✓ Industry-specific policy shifts
              </p>
              <p className="content-card-description">
                ✓ Trade agreement updates (USMCA renegotiation)
              </p>
              <p className="content-card-description">
                ✓ Reciprocal tariff announcements
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We're Monitoring - 3 Streams */}
      <section className="main-content homepage-section-gray">
        <div className="container-app homepage-container-narrow">
          <div className="section-header homepage-section-header-centered">
            <h2 className="section-header-title">What We&apos;re Monitoring Right Now</h2>
            <p className="homepage-subtitle">
              Forward-looking intelligence on 2026 policy changes - not just current rates
            </p>
          </div>

          {/* Stream 1: USMCA */}
          <div className="content-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #2563eb' }}>
            <h3 style={{ color: '#2563eb', fontSize: '1.2rem', marginBottom: '1rem' }}>
              📅 Stream 1: USMCA Renegotiation Watch
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                  <strong>Timeline:</strong> January-March 2026
                </p>
                <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                  <strong>What to Watch:</strong> Cumulation rule changes, Chinese PCBA component restrictions
                </p>
              </div>
              <div>
                <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                  <strong>Monitoring:</strong> Weekly (USTR, Mexico Economy Ministry, Canadian Global Affairs)
                </p>
                <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                  <strong>Why It Matters:</strong> Could force PCBA sourcing changes within 90 days
                </p>
              </div>
            </div>
          </div>

          {/* Stream 2: Section 301 */}
          <div className="content-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #dc2626' }}>
            <h3 style={{ color: '#dc2626', fontSize: '1.2rem', marginBottom: '1rem' }}>
              📊 Stream 2: Section 301 Tariff Rate Cycles
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                  <strong>Timeline:</strong> March-April rate reviews, April-May announcements
                </p>
                <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                  <strong>What to Watch:</strong> HS 8534.00.00 (PCBA) rate changes (currently 15-25%)
                </p>
              </div>
              <div>
                <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                  <strong>Monitoring:</strong> Daily (USTR.gov tracker, trade press)
                </p>
                <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                  <strong>Why It Matters:</strong> 5-10% rate increase = significant cost impact
                </p>
              </div>
            </div>
            {/* Dollar Impact Callout */}
            <div style={{
              backgroundColor: '#fef2f2',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #fecaca',
              marginTop: '1rem',
              textAlign: 'center'
            }}>
              <p style={{ color: '#991b1b', fontWeight: '600', fontSize: '1.1rem', marginBottom: '0' }}>
                💰 Impact Example: 5-10% rate increase on $4M China imports = <strong>$200k-$400k annual cost increase</strong>
              </p>
            </div>
          </div>

          {/* Stream 3: Mexican Supply Chain */}
          <div className="content-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #059669' }}>
            <h3 style={{ color: '#059669', fontSize: '1.2rem', marginBottom: '1rem' }}>
              🔍 Stream 3: Mexican Labor & Aluminum Sourcing
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                  <strong>Timeline:</strong> Quarterly deep dives (ongoing)
                </p>
                <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                  <strong>What to Watch:</strong> Labor verification rules, Section 232 aluminum sourcing
                </p>
              </div>
              <div>
                <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                  <strong>Monitoring:</strong> Quarterly (Diario Oficial, aluminum industry reports)
                </p>
                <p className="text-body" style={{ marginBottom: '0.5rem' }}>
                  <strong>Why It Matters:</strong> Tightening could force supplier restructuring
                </p>
              </div>
            </div>
          </div>

          {/* Critical Intelligence Gaps - Highlighted Box */}
          <div style={{
            backgroundColor: '#fefce8',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '2px solid #fef08a',
            marginTop: '2rem'
          }}>
            <h3 style={{ color: '#854d0e', marginBottom: '1rem' }}>
              ⚠️ Critical Intelligence Gaps We Identify
            </h3>
            <p style={{ color: '#854d0e', marginBottom: '0.5rem' }}>
              <strong>Gap 1:</strong> What specific HS codes might be affected by cumulation rule changes?
            </p>
            <p style={{ color: '#854d0e', marginBottom: '1rem' }}>
              <strong>Gap 2:</strong> Are your Mexican suppliers compliant with tightening labor verification?
            </p>
            <p style={{ color: '#854d0e', fontStyle: 'italic', marginBottom: '0' }}>
              These gaps should be addressed through supplier conversations in Q4 2025 - before the 2026 changes hit.
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/signup" className="btn-primary">
              Start Monitoring These Streams - Free Trial →
            </Link>
          </div>
        </div>
      </section>

      {/* Portfolio Briefing - THE FOCUS */}
      <section className="main-content homepage-section-white">
        <div className="container-app homepage-container-narrow">
          <div className="section-header homepage-section-header-centered">
            <h2 className="section-header-title">Strategic Portfolio Reports</h2>
            <p className="homepage-subtitle">
              Alerts tell you WHAT changed. Reports tell you what to DO about it.
            </p>
          </div>

          <div className="grid-2-cols">
            <div className="content-card">
              <div style={{ display: 'flex', marginBottom: '1.5rem' }}>
                <img
                  src="/image/samples/alerts dashboard expanded 🇺🇸🇨🇦🇲🇽 USMCA 2026 alerts.png"
                  alt="Portfolio briefing dashboard preview"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '50%' }}
                  onClick={() => openModal('/image/samples/alerts dashboard expanded 🇺🇸🇨🇦🇲🇽 USMCA 2026 alerts.png')}
                />
              </div>
              <h3 className="content-card-title">Bottom Line Impact Analysis</h3>
              <p className="content-card-description">
                ✓ Which components are affected by new policies
              </p>
              <p className="content-card-description">
                ✓ Financial impact on your specific supply chain
              </p>
              <p className="content-card-description">
                ✓ Timeline of when changes take effect
              </p>
              <p className="content-card-description">
                ✓ Confidence scoring on each recommendation
              </p>
            </div>

            <div className="content-card">
              <div style={{ display: 'flex', marginBottom: '1.5rem' }}>
                <img
                  src="/image/samples/alerts dasboard Executive Advisory Industrias del Norte  close up active alerts affecting your supply chain.png"
                  alt="Executive advisory close-up preview"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '50%' }}
                  onClick={() => openModal('/image/samples/alerts dasboard Executive Advisory Industrias del Norte  close up active alerts affecting your supply chain.png')}
                />
              </div>
              <h3 className="content-card-title">Strategic Considerations</h3>
              <p className="content-card-description">
                ✓ Supplier diversification opportunities
              </p>
              <p className="content-card-description">
                ✓ Mexico nearshoring ROI calculations
              </p>
              <p className="content-card-description">
                ✓ CBP binding ruling guidance (Form 29)
              </p>
              <p className="content-card-description">
                ✓ 3-phase action plan with timeline
              </p>
            </div>
          </div>

          <div className="homepage-success-box">
            <p>
              These aren&apos;t generic reports. Whether you&apos;re importing, exporting, or manufacturing - every briefing is specific to your components, your volumes, and the exact policies affecting you.
            </p>
          </div>
        </div>
      </section>

      {/* Alert Dashboard */}
      <section className="main-content homepage-section-white">
        <div className="container-app homepage-container-narrow">
          <div className="section-header homepage-section-header-centered">
            <h2 className="section-header-title">Your Alert Dashboard</h2>
            <p className="homepage-subtitle">
              One place to see all alerts, reports, and policy updates.
            </p>
          </div>

          <div className="grid-2-cols">
            <div className="content-card">
              <div style={{ display: 'flex', marginBottom: '1.5rem' }}>
                <img
                  src="/image/samples/full alerts dashboard .png"
                  alt="Full alert dashboard preview"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '50%' }}
                  onClick={() => openModal('/image/samples/full alerts dashboard .png')}
                />
              </div>
              <h3 className="content-card-title">Active Alerts</h3>
              <p className="content-card-description">
                ✓ Color-coded by severity (Critical/High/Medium/Low)
              </p>
              <p className="content-card-description">
                ✓ Status tracking (New/Updated/Resolved)
              </p>
              <p className="content-card-description">
                ✓ Organized by component
              </p>
              <p className="content-card-description">
                ✓ Click to expand for full details
              </p>
            </div>

            <div className="content-card">
              <div style={{ display: 'flex', marginBottom: '1.5rem' }}>
                <img
                  src="/image/samples/full report of alerts dasboard Executive Advisory Industrias del Norte.png"
                  alt="Full executive report preview"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '50%' }}
                  onClick={() => openModal('/image/samples/full report of alerts dasboard Executive Advisory Industrias del Norte.png')}
                />
              </div>
              <h3 className="content-card-title">Report Library</h3>
              <p className="content-card-description">
                ✓ Portfolio briefings for each policy change
              </p>
              <p className="content-card-description">
                ✓ Historical analysis archive
              </p>
              <p className="content-card-description">
                ✓ Download as PDF for broker review
              </p>
              <p className="content-card-description">
                ✓ Share with your team or consultants
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Email Digest System */}
      <section className="main-content homepage-section-gray">
        <div className="container-app homepage-container-narrow">
          <div className="section-header homepage-section-header-centered">
            <h2 className="section-header-title">Weekly Email Digest</h2>
            <p className="homepage-subtitle">
              We bundle all changes into one weekly email. No alert fatigue.
            </p>
          </div>

          <div className="content-card">
            <h3 className="content-card-title">What You Get Every Week (Monday 8 AM UTC)</h3>
            <div className="grid gap-4">
              <p className="content-card-description">
                ✓ Summary of all tariff changes detected in the last 7 days
              </p>
              <p className="content-card-description">
                ✓ Which of YOUR components are affected
              </p>
              <p className="content-card-description">
                ✓ Rate impact (old rate → new rate)
              </p>
              <p className="content-card-description">
                ✓ Confidence level on each detected change
              </p>
              <p className="content-card-description">
                ✓ Immediate action steps (if any)
              </p>
              <p className="content-card-description">
                ✓ Link to full portfolio briefing report
              </p>
            </div>
          </div>

          <div className="homepage-empathy-box">
            <p className="font-bold text-lg mb-3">No Alert Spam:</p>
            <p className="text-lg m-0 leading-relaxed">
              We don&apos;t send multiple emails per week. We bundle everything into ONE weekly digest. If nothing changed that affects you? No email.
            </p>
          </div>
        </div>
      </section>

      {/* Real Example */}
      <section className="main-content homepage-section-white">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Real Example: Section 301 Alert</h2>
          </div>

          <div className="grid-2-cols">
            <div className="content-card">
              <h3 className="content-card-title">What Happened</h3>
              <p className="content-card-description">
                USTR announced 25% → 30% tariff increase on Chinese semiconductors (HS 8542.31.00), effective in 30 days.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">What We Did</h3>
              <p className="content-card-description">
                ✓ Sent alert to users with this HS code from China
              </p>
              <p className="content-card-description">
                ✓ Generated portfolio briefing with Mexico supplier ROI
              </p>
              <p className="content-card-description">
                ✓ Showed 18-month payback timeline for nearshoring
              </p>
              <p className="content-card-description">
                ✓ Provided 3-phase migration plan with supplier contacts
              </p>
            </div>
          </div>

          <div className="section-header">
            <p className="section-header-subtitle">
              User had 30 days to act - not 30 days to research and THEN act. They migrated 2 components to Mexico before the tariff hit.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="main-content">
        <div className="container-app text-center max-w-2xl">
          <h2 className="section-header-title">Start Monitoring Today</h2>
          <p className="text-body text-lg mb-8">
            14-day free trial • No credit card • Full platform access
          </p>
          <Link href="/signup" className="btn-primary text-xl px-10 py-4">
            Start Free Trial →
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

      {/* Screenshot Modal */}
      {modalImage && (
        <div className="screenshot-modal-overlay" onClick={closeModal}>
          <div className="screenshot-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="screenshot-modal-close" onClick={closeModal}>
              ×
            </button>
            <img
              src={modalImage}
              alt="Screenshot enlarged view"
              className="screenshot-modal-image"
            />
          </div>
        </div>
      )}
    </>
  )
}
