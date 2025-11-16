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

          <p className="hero-description-text mt-8">
            Tariff policies change constantly. We monitor Section 301, Section 232, and USMCA updates daily - and alert you only when it affects YOUR components.
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
              Most businesses find out about tariff changes AFTER they&apos;ve already paid higher rates for 2-3 months. That&apos;s money you can&apos;t get back.
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
              <img
                src="/image/samples/component level alerts.png"
                alt="Component-level alerts preview"
                className="screenshot-thumbnail mb-4"
                onClick={() => openModal('/image/samples/component level alerts.png')}
              />
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
              <img
                src="/image/samples/301 alert.png"
                alt="Section 301 policy alerts preview"
                className="screenshot-thumbnail mb-4"
                onClick={() => openModal('/image/samples/301 alert.png')}
              />
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

      {/* Portfolio Briefing - THE FOCUS */}
      <section className="main-content homepage-section-gray">
        <div className="container-app homepage-container-narrow">
          <div className="section-header homepage-section-header-centered">
            <h2 className="section-header-title">Strategic Portfolio Reports</h2>
            <p className="homepage-subtitle">
              Alerts tell you WHAT changed. Reports tell you what to DO about it.
            </p>
          </div>

          <div className="grid-2-cols">
            <div className="content-card">
              <img
                src="/image/samples/🇺🇸🇨🇦🇲🇽 USMCA 2026 Market Intelligence.png"
                alt="Portfolio briefing preview"
                className="screenshot-thumbnail mb-4"
                onClick={() => openModal('/image/samples/🇺🇸🇨🇦🇲🇽 USMCA 2026 Market Intelligence.png')}
              />
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
              <img
                src="/image/samples/alerts critical descistions.png"
                alt="Strategic recommendations preview"
                className="screenshot-thumbnail mb-4"
                onClick={() => openModal('/image/samples/alerts critical descistions.png')}
              />
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
              These aren&apos;t generic reports. Every briefing is specific to your components, your volumes, and the exact policies affecting you.
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
              <img
                src="/image/samples/alerts daboard overview.png"
                alt="Alert dashboard preview"
                className="screenshot-thumbnail mb-4"
                onClick={() => openModal('/image/samples/alerts daboard overview.png')}
              />
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
              <img
                src="/image/samples/alerts report.png"
                alt="Report library preview"
                className="screenshot-thumbnail mb-4"
                onClick={() => openModal('/image/samples/alerts report.png')}
              />
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
