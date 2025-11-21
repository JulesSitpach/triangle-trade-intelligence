import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Footer from '../components/Footer'
import LegalDisclaimer from '../components/LegalDisclaimer'

export default function CertificateOfOriginPage() {
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
        <title>USMCA Certificate of Origin | Triangle Trade Intelligence</title>
        <meta name="description" content="Generate official USMCA certificates in 5 minutes. Self-service qualification analysis and Form D certificate generation without becoming a trade expert." />
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
            <Link href="/certificate-of-origin" className="nav-menu-link active" onClick={() => setMobileMenuOpen(false)}>Certificate</Link>
            <Link href="/ongoing-alerts" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Alerts</Link>
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
            Official USMCA Form D Certificate
          </div>

          <h1 className="hero-main-title">
            USMCA Certificate of Origin<br/>
            <span className="hero-yellow-highlight">Generate in 5 Minutes</span>
          </h1>

          <p className="hero-description-text">
            For importers, exporters, and manufacturers. Answer simple questions about your product - we calculate qualification and generate your official Form D certificate.
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

      {/* Use Cases Section */}
      <section className="main-content homepage-section-gray" style={{ paddingTop: '3rem', paddingBottom: '1rem' }}>
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Who Is This For?</h2>
          </div>

          <div className="grid-3-cols">
            <div className="content-card">
              <h3 className="content-card-title">Importers</h3>
              <p className="content-card-description">
                Verify USMCA qualification before paying tariffs. See if your products qualify for duty-free status and calculate potential savings.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Exporters</h3>
              <p className="content-card-description">
                Provide USMCA certificates to your B2B buyers. Help them qualify for duty-free import and win more contracts.
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">Manufacturers</h3>
              <p className="content-card-description">
                Respond to distributor certificate requests quickly. Document your products qualify for USMCA preferential treatment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Step 1: Company Info */}
      <section className="main-content">
        <div className="container-app max-w-4xl">
          <div className="section-header">
            <h2 className="section-header-title">Step 1: Tell Us About Your Company</h2>
            <p className="section-header-subtitle">Time: 2 minutes</p>
          </div>

          <div className="grid-2-cols mb-12">
            <div className="content-card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                <div>
                  <h3 className="content-card-title">Company Information:</h3>
                  <ul className="content-card-description">
                    <li className="mb-3">✓ Company name, address, and tax ID</li>
                    <li className="mb-3">✓ Where you source or manufacture your product</li>
                    <li className="mb-3">✓ Your destination market (US, Canada, or Mexico)</li>
                    <li className="mb-3">✓ Annual trade volume (for importers/exporters)</li>
                  </ul>
                </div>
                <div>
                  <img
                    src="/image/samples/compnay inforatnion page filled.png"
                    alt="Company information form filled preview"
                    className="screenshot-thumbnail"
                    style={{ width: '100%', height: 'auto' }}
                    onClick={() => openModal('/image/samples/compnay inforatnion page filled.png')}
                  />
                </div>
              </div>
            </div>

            <div className="content-card">
              <div style={{ display: 'flex', marginBottom: '1.5rem' }}>
                <img
                  src="/image/samples/dashobard.png"
                  alt="Dashboard tracking all analyses preview"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '50%' }}
                  onClick={() => openModal('/image/samples/dashobard.png')}
                />
              </div>
              <h3 className="content-card-title">Product Details:</h3>
              <ul className="content-card-description">
                <li className="mb-3">✓ Track all your analyses in one place</li>
                <li className="mb-3">✓ See qualification status at a glance</li>
                <li className="mb-3">✓ Download certificates anytime</li>
                <li className="mb-3">✓ Monitor policy alerts affecting your products</li>
              </ul>
            </div>
          </div>

          <div className="homepage-empathy-box">
            <p className="font-bold text-lg mb-3">Why this matters:</p>
            <p className="text-lg m-0 leading-relaxed">
              This basic information goes directly onto your USMCA certificate. We use your sourcing/manufacturing location and destination market to determine which tariff rates apply and calculate your potential savings.
            </p>
          </div>
        </div>
      </section>

      {/* Step 2: Components */}
      <section className="main-content bg-gray-50 py-20">
        <div className="container-app max-w-4xl">
          <div className="section-header mb-12">
            <h2 className="section-header-title">Step 2: Add Your Components</h2>
            <p className="text-lg font-bold mt-2 text-emerald-600">Time: 3 minutes for 5-10 components</p>
          </div>

          <div className="grid-2-cols mb-12">
            <div className="content-card">
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <img
                  src="/image/samples/product information.png"
                  alt="Product information form preview"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '100%' }}
                  onClick={() => openModal('/image/samples/product information.png')}
                />
                <img
                  src="/image/samples/component 2.png"
                  alt="Component details preview"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '100%' }}
                  onClick={() => openModal('/image/samples/component 2.png')}
                />
              </div>
              <h3 className="content-card-title">What we need:</h3>
              <ul className="content-card-description">
                <li className="mb-3">✓ Component descriptions (simple language is fine - &quot;aluminum housing&quot; or &quot;power supply&quot;)</li>
                <li className="mb-3">✓ Country of origin for each component</li>
                <li className="mb-3">✓ Value percentage of each component</li>
              </ul>
            </div>

            <div className="content-card">
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <img
                  src="/image/samples/component table collapsed.png"
                  alt="Component table collapsed view"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '100%' }}
                  onClick={() => openModal('/image/samples/component table collapsed.png')}
                />
                <img
                  src="/image/samples/component table expanded on china.png"
                  alt="Component table expanded with tariff analysis"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '100%' }}
                  onClick={() => openModal('/image/samples/component table expanded on china.png')}
                />
              </div>
              <h3 className="content-card-title">What we do automatically:</h3>
              <ul className="content-card-description">
                <li className="mb-3">✓ Classify each component with the correct HS code</li>
                <li className="mb-3">✓ Look up current tariff rates (MFN, USMCA, Section 301, Section 232)</li>
                <li className="mb-3">✓ Flag any policy risks on specific components</li>
                <li className="mb-3">✓ Calculate potential savings for each component</li>
              </ul>
            </div>
          </div>

          <div className="homepage-empathy-box mb-12">
            <p className="text-lg m-0 font-bold leading-relaxed">
              Don&apos;t worry if you don&apos;t know HS codes. Our AI classifies components based on your descriptions. You&apos;ll see the suggested HS code and can verify it with your broker later.
            </p>
          </div>
        </div>
      </section>

      {/* Step 3: USMCA Qualification */}
      <section className="main-content py-20">
        <div className="container-app max-w-4xl">
          <div className="section-header mb-12">
            <h2 className="section-header-title">Step 3: USMCA Qualification & Strategic Report</h2>
            <p className="text-lg font-bold mt-2 text-emerald-600">Time: 2 minutes to review</p>
          </div>

          <div className="grid-2-cols mb-12">
            <div className="content-card">
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <img
                  src="/image/samples/USMCA Compliance Analysis Results top page.png"
                  alt="USMCA qualification status preview"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '100%' }}
                  onClick={() => openModal('/image/samples/USMCA Compliance Analysis Results top page.png')}
                />
                <img
                  src="/image/samples/Your USMCA Impact.png"
                  alt="Your USMCA impact analysis"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '100%' }}
                  onClick={() => openModal('/image/samples/Your USMCA Impact.png')}
                />
              </div>
              <h3 className="content-card-title text-blue-900">
                Do You Qualify?
              </h3>
              <ul className="content-card-description">
                <li className="mb-3">✓ Whether you qualify (yes/no)</li>
                <li className="mb-3">✓ Your exact regional content percentage</li>
                <li className="mb-3">✓ Required threshold for your industry</li>
                <li className="mb-3">✓ Safety margin (how close you are to the threshold)</li>
              </ul>
            </div>

            {/* Executive Advisory Report */}
            <div className="content-card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                <div>
                  <h3 className="content-card-title">
                    Executive Advisory Report
                  </h3>
                  <ul className="content-card-description">
                    <li className="mb-3">✓ Root cause analysis of your supply chain structure</li>
                    <li className="mb-3">✓ Financial scenarios (current state vs. alternatives)</li>
                    <li className="mb-3">✓ Specific supplier recommendations with ROI calculations</li>
                    <li className="mb-3">✓ Timeline and implementation roadmap</li>
                  </ul>
                </div>
                <div>
                  <img
                    src="/image/samples/executinve summary results page.png"
                    alt="Executive summary results preview"
                    className="screenshot-thumbnail"
                    style={{ width: '100%', height: 'auto' }}
                    onClick={() => openModal('/image/samples/executinve summary results page.png')}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="homepage-empathy-box mb-12">
            <p className="text-lg m-0 font-bold leading-relaxed">
              See your qualification status instantly and get strategic recommendations. If you qualify, continue to download your certificate. If not, we show you exactly what needs to change.
            </p>
          </div>
        </div>
      </section>


      {/* Step 4: Certificate */}
      <section className="main-content py-20">
        <div className="container-app max-w-4xl">
          <div className="section-header mb-12">
            <h2 className="section-header-title">Step 4: Download Your Certificate (If Qualified)</h2>
            <p className="text-lg font-bold mt-2 text-emerald-600">Time: 2 minutes to edit and download</p>
          </div>

          <div className="grid-2-cols mb-12">
            {/* Certificate Preview (Editable) */}
            <div className="content-card">
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <img
                  src="/image/samples/certificate information.png"
                  alt="Certificate information form preview"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '100%' }}
                  onClick={() => openModal('/image/samples/certificate information.png')}
                />
                <img
                  src="/image/samples/certificate preview.png"
                  alt="Certificate preview"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '100%' }}
                  onClick={() => openModal('/image/samples/certificate preview.png')}
                />
              </div>
              <h3 className="content-card-title">
                Certificate Preview (Editable)
              </h3>
              <ul className="content-card-description">
                <li className="mb-3">✓ All fields pre-filled from your analysis</li>
                <li className="mb-3">✓ Edit importer/exporter/producer information</li>
                <li className="mb-3">✓ Verify product description and HS codes</li>
                <li className="mb-3">✓ Modify blanket period dates if needed</li>
              </ul>
            </div>

            {/* Final Certificate */}
            <div className="content-card">
              <div style={{ display: 'flex', marginBottom: '1.5rem' }}>
                <img
                  src="/image/samples/certificate download.png"
                  alt="Final certificate download"
                  className="screenshot-thumbnail"
                  style={{ flex: '1 1 0', minWidth: '200px', maxWidth: '50%' }}
                  onClick={() => openModal('/image/samples/certificate download.png')}
                />
              </div>
              <h3 className="content-card-title">
                Final Certificate
              </h3>
              <ul className="content-card-description">
                <li className="mb-3">✓ Official USMCA Form D format</li>
                <li className="mb-3">✓ Ready for your customs broker to file with CBP</li>
                <li className="mb-3">✓ Valid for one year (blanket certificate)</li>
              </ul>
            </div>
          </div>

          <div className="homepage-empathy-box mb-8">
            <p className="text-lg m-0 font-bold leading-relaxed">
              Review each field, make any corrections, then download the final PDF.
            </p>
          </div>

          <div className="homepage-success-box mb-12">
            <p className="font-bold text-lg mb-3">If you don&apos;t qualify:</p>
            <p className="m-0 text-lg">
              We show you exactly what changes would get you there - like nearshoring specific components or changing manufacturing location.
            </p>
          </div>
        </div>
      </section>

      {/* What If You're Not Sure */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">What Happens If You&apos;re Not Sure?</h2>
          </div>

          <div className="content-card">
            <p className="content-card-description mb-6">
              That&apos;s normal. Most small business owners aren&apos;t trade compliance experts.
            </p>

            <h3 className="content-card-title">You can:</h3>
            <ol className="content-card-description pl-6 mb-8">
              <li className="mb-3">Run the analysis to see what it says</li>
              <li className="mb-3">Download the detailed results and strategic recommendations</li>
              <li className="mb-3">Share everything with your customs broker for verification</li>
              <li className="mb-3">Edit the certificate based on their feedback</li>
              <li className="mb-3">Download the final version when you&apos;re confident</li>
            </ol>

            <p className="content-card-description">
              <strong>You&apos;re not locked into anything.</strong> Think of this as the research tool that gives you the information to make informed decisions with your broker.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="main-content">
        <div className="container-app text-center max-w-2xl">
          <h2 className="section-header-title">Ready to See If You Qualify?</h2>
          <p className="text-body text-lg mb-8">
            14-day free trial • No credit card • Full platform access
          </p>
          <Link href="/signup" className="btn-primary text-xl px-10 py-4">
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
