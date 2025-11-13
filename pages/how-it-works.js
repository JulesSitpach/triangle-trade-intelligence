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
            <Link href="/how-it-works" className="nav-menu-link active" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
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
          <div className="hero-badge">
            5-Minute Self-Service Analysis
          </div>

          <h1 className="hero-main-title">
            How It Works
          </h1>

          <p className="hero-description-text" style={{marginTop: '2rem'}}>
            You don&apos;t need to be a trade expert. Just answer questions about your business - we&apos;ll handle the complex calculations.
          </p>
        </div>
      </section>

      {/* Step 1: Company Info */}
      <section className="main-content" style={{paddingTop: '5rem', paddingBottom: '5rem'}}>
        <div className="container-app" style={{maxWidth: '1000px'}}>
          <div className="section-header" style={{marginBottom: '3rem'}}>
            <h2 className="section-header-title">Step 1: Tell Us About Your Company</h2>
            <p style={{fontSize: '1.1rem', color: '#059669', fontWeight: 600, marginTop: '0.5rem'}}>Time: 2 minutes</p>
          </div>

          <h3 style={{fontSize: '1.35rem', fontWeight: 700, color: '#111827', marginBottom: '2rem', textAlign: 'center'}}>
            What we need to know:
          </h3>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '3rem'}}>
            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              borderLeft: '4px solid #1e3a8a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0}}>
                Company name, address, and tax ID
              </p>
            </div>

            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              borderLeft: '4px solid #1e3a8a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0}}>
                Where you manufacture or assemble your product
              </p>
            </div>

            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              borderLeft: '4px solid #1e3a8a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0}}>
                Your destination market (US, Canada, or Mexico)
              </p>
            </div>

            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              borderLeft: '4px solid #1e3a8a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0}}>
                Annual trade volume
              </p>
            </div>
          </div>

          <div style={{
            background: '#1e3a8a',
            color: '#fff',
            padding: '2.5rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{fontWeight: 600, fontSize: '1.15rem', marginBottom: '0.75rem'}}>Why this matters:</p>
            <p style={{fontSize: '1.1rem', margin: 0, lineHeight: '1.7'}}>
              This basic information goes directly onto your USMCA certificate. We also use your manufacturing location and destination to determine which tariff rates apply.
            </p>
          </div>
        </div>
      </section>

      {/* Step 2: Components */}
      <section className="main-content" style={{background: '#f9fafb', paddingTop: '5rem', paddingBottom: '5rem'}}>
        <div className="container-app" style={{maxWidth: '1000px'}}>
          <div className="section-header" style={{marginBottom: '3rem'}}>
            <h2 className="section-header-title">Step 2: Add Your Components</h2>
            <p style={{fontSize: '1.1rem', color: '#059669', fontWeight: 600, marginTop: '0.5rem'}}>Time: 3 minutes for 5-10 components</p>
          </div>

          <h3 style={{fontSize: '1.35rem', fontWeight: 700, color: '#111827', marginBottom: '2rem', textAlign: 'center'}}>
            What we need:
          </h3>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem'}}>
            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              borderTop: '4px solid #1e3a8a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0}}>
                Component descriptions (simple language is fine - &quot;aluminum housing&quot; or &quot;power supply&quot;)
              </p>
            </div>

            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              borderTop: '4px solid #1e3a8a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0}}>
                Country of origin for each component
              </p>
            </div>

            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              borderTop: '4px solid #1e3a8a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0}}>
                Value percentage of each component
              </p>
            </div>
          </div>

          <h3 style={{fontSize: '1.35rem', fontWeight: 700, color: '#111827', marginBottom: '2rem', textAlign: 'center'}}>
            What we do automatically:
          </h3>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '3rem'}}>
            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              borderLeft: '4px solid #059669',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0}}>
                Classify each component with the correct HS code
              </p>
            </div>

            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              borderLeft: '4px solid #059669',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0}}>
                Look up current tariff rates (MFN, USMCA, Section 301, Section 232)
              </p>
            </div>

            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              borderLeft: '4px solid #059669',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0}}>
                Flag any policy risks on specific components
              </p>
            </div>

            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              borderLeft: '4px solid #059669',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0}}>
                Calculate potential savings for each component
              </p>
            </div>
          </div>

          <div style={{
            background: '#1e3a8a',
            color: '#fff',
            padding: '2.5rem',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <p style={{fontSize: '1.15rem', margin: 0, lineHeight: '1.7', fontWeight: 600}}>
              Don&apos;t worry if you don&apos;t know HS codes. Our AI classifies components based on your descriptions. You&apos;ll see the suggested HS code and can verify it with your broker later.
            </p>
          </div>

            {/* Component table screenshot */}
            <div style={{marginTop: '2rem', textAlign: 'center'}}>
              <a href="/image/samples/alerts.png" target="_blank" rel="noopener noreferrer" style={{display: 'inline-block'}}>
                <img
                  src="/image/samples/alerts.png"
                  alt="Component table showing HS codes, origins, and tariff alerts"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }}
                />
              </a>
              <p style={{fontStyle: 'italic', marginTop: '1rem', color: '#6b7280', fontSize: '0.9rem'}}>
                Click to view full size - Real example: Component table showing which parts have tariff exposure and which qualify for USMCA savings
              </p>
            </div>
        </div>
      </section>

      {/* Step 3: Results */}
      <section className="main-content" style={{paddingTop: '5rem', paddingBottom: '5rem'}}>
        <div className="container-app" style={{maxWidth: '1000px'}}>
          <div className="section-header" style={{marginBottom: '3rem'}}>
            <h2 className="section-header-title">Step 3: See Your Complete Analysis</h2>
            <p style={{fontSize: '1.1rem', color: '#059669', fontWeight: 600, marginTop: '0.5rem'}}>Time: 2 minutes to review</p>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '3rem'}}>
            {/* USMCA Qualification Status */}
            <div style={{
              background: '#fff',
              padding: '2.5rem',
              borderRadius: '12px',
              border: '2px solid #1e3a8a',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.35rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '1.5rem'}}>
                USMCA Qualification Status
              </h3>
              <div style={{display: 'grid', gap: '1rem'}}>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Whether you qualify (yes/no)
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Your exact regional content percentage
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Required threshold for your industry
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Safety margin (how close you are to the threshold)
                </p>
              </div>
            </div>

            {/* Financial Impact */}
            <div style={{
              background: '#fff',
              padding: '2.5rem',
              borderRadius: '12px',
              border: '2px solid #059669',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.35rem', fontWeight: 700, color: '#059669', marginBottom: '1.5rem'}}>
                Financial Impact
              </h3>
              <div style={{display: 'grid', gap: '1rem'}}>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Current annual savings (if qualified)
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Potential savings with supply chain changes
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Policy risk exposure (Section 301, Section 232)
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Component-by-component tariff breakdown
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: '#1e3a8a',
            color: '#fff',
            padding: '2.5rem',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <p style={{fontSize: '1.15rem', margin: 0, lineHeight: '1.7', fontWeight: 600}}>
              Whether you&apos;re overpaying tariffs, what your supply chain risks are, and exactly where your money is going.
            </p>
          </div>

            {/* Results dashboard screenshot */}
          <div style={{marginTop: '2rem', textAlign: 'center'}}>
            <a href="/image/samples/results.png" target="_blank" rel="noopener noreferrer" style={{display: 'inline-block'}}>
              <img
                src="/image/samples/results.png"
                alt="Results dashboard showing qualification status and financial breakdown"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
              />
            </a>
            <p style={{fontStyle: 'italic', marginTop: '1rem', color: '#6b7280', fontSize: '0.9rem'}}>
              Click to view full size - Real example: Company qualified at 65% RVC with $59,500 annual savings, but 35% China exposure flagged
            </p>
          </div>
        </div>
      </section>

      {/* Step 4: Strategic Recommendations */}
      <section className="main-content" style={{background: '#f9fafb', paddingTop: '5rem', paddingBottom: '5rem'}}>
        <div className="container-app" style={{maxWidth: '1000px'}}>
          <div className="section-header" style={{marginBottom: '3rem'}}>
            <h2 className="section-header-title">Step 4: Get Strategic Recommendations</h2>
            <p style={{fontSize: '1.1rem', color: '#059669', fontWeight: 600, marginTop: '0.5rem'}}>Time: 5 minutes to review strategic options</p>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '3rem'}}>
            {/* Executive Advisory Report */}
            <div style={{
              background: '#fff',
              padding: '2.5rem',
              borderRadius: '12px',
              border: '2px solid #1e3a8a',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.35rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '1.5rem'}}>
                Executive Advisory Report
              </h3>
              <div style={{display: 'grid', gap: '1rem'}}>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Root cause analysis of your supply chain structure
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Financial scenarios (current state vs. alternatives)
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Specific supplier recommendations with ROI calculations
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Timeline and implementation roadmap
                </p>
              </div>
            </div>

            {/* 3-Phase Action Plan */}
            <div style={{
              background: '#fff',
              padding: '2.5rem',
              borderRadius: '12px',
              border: '2px solid #059669',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.35rem', fontWeight: 700, color: '#059669', marginBottom: '1.5rem'}}>
                3-Phase Action Plan
              </h3>
              <div style={{display: 'grid', gap: '1rem'}}>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  <strong>Phase 1:</strong> Immediate actions (supplier assessment, documentation audit)
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  <strong>Phase 2:</strong> Validation steps (trial shipments, quality testing)
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  <strong>Phase 3:</strong> Full implementation (migration timeline, cost commitments)
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: '#1e3a8a',
            color: '#fff',
            padding: '2.5rem',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <p style={{fontSize: '1.15rem', margin: 0, lineHeight: '1.7', fontWeight: 600}}>
              This isn&apos;t generic advice. Every recommendation is specific to your components, your volumes, and your business situation.
            </p>
          </div>

          {/* Executive advisory screenshots */}
          <div style={{marginTop: '2rem', textAlign: 'center'}}>
            <a href="/image/samples/result ai.png" target="_blank" rel="noopener noreferrer" style={{display: 'inline-block'}}>
              <img
                src="/image/samples/result ai.png"
                alt="Executive advisory showing strategic analysis"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  marginBottom: '1.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
              />
            </a>
            <a href="/image/samples/result ai 2.png" target="_blank" rel="noopener noreferrer" style={{display: 'inline-block'}}>
              <img
                src="/image/samples/result ai 2.png"
                alt="Strategic roadmap with phases and actions"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
              />
            </a>
            <p style={{fontStyle: 'italic', marginTop: '1rem', color: '#6b7280', fontSize: '0.9rem'}}>
              Click to view full size - Real example: Company shown nearshoring opportunity with 12-18 month timeline and payback analysis
            </p>
          </div>
        </div>
      </section>

      {/* Step 5: Certificate */}
      <section className="main-content" style={{paddingTop: '5rem', paddingBottom: '5rem'}}>
        <div className="container-app" style={{maxWidth: '1000px'}}>
          <div className="section-header" style={{marginBottom: '3rem'}}>
            <h2 className="section-header-title">Step 5: Download Your Certificate (If Qualified)</h2>
            <p style={{fontSize: '1.1rem', color: '#059669', fontWeight: 600, marginTop: '0.5rem'}}>Time: 2 minutes to edit and download</p>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '3rem'}}>
            {/* Certificate Preview (Editable) */}
            <div style={{
              background: '#fff',
              padding: '2.5rem',
              borderRadius: '12px',
              border: '2px solid #1e3a8a',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.35rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '1.5rem'}}>
                Certificate Preview (Editable)
              </h3>
              <div style={{display: 'grid', gap: '1rem'}}>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ All fields pre-filled from your analysis
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Edit importer/exporter/producer information
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Verify product description and HS codes
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Modify blanket period dates if needed
                </p>
              </div>
            </div>

            {/* Final Certificate */}
            <div style={{
              background: '#fff',
              padding: '2.5rem',
              borderRadius: '12px',
              border: '2px solid #059669',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{fontSize: '1.35rem', fontWeight: 700, color: '#059669', marginBottom: '1.5rem'}}>
                Final Certificate
              </h3>
              <div style={{display: 'grid', gap: '1rem'}}>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Official USMCA Form D format
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Ready for your customs broker to file with CBP
                </p>
                <p style={{fontSize: '1.05rem', color: '#374151', margin: 0, padding: '0.75rem', background: '#f9fafb', borderRadius: '6px'}}>
                  ✓ Valid for one year (blanket certificate)
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: '#1e3a8a',
            color: '#fff',
            padding: '2.5rem',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <p style={{fontSize: '1.15rem', margin: 0, lineHeight: '1.7', fontWeight: 600}}>
              Review each field, make any corrections, then download the final PDF.
            </p>
          </div>

          <div style={{
            background: '#fef3c7',
            padding: '2.5rem',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '3rem',
            border: '1px solid #fcd34d'
          }}>
            <p style={{fontWeight: 600, fontSize: '1.15rem', color: '#78350f', marginBottom: '0.75rem'}}>If you don&apos;t qualify:</p>
            <p style={{fontSize: '1.05rem', color: '#78350f', margin: 0, lineHeight: '1.7'}}>
              We show you exactly what changes would get you there - like nearshoring specific components or changing manufacturing location.
            </p>
          </div>

          {/* Certificate preview screenshot */}
          <div style={{marginTop: '2rem', textAlign: 'center'}}>
            <a href="/image/samples/certificate preview.png" target="_blank" rel="noopener noreferrer" style={{display: 'inline-block'}}>
              <img
                src="/image/samples/certificate preview.png"
                alt="Editable certificate preview showing all form fields"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
              />
            </a>
            <p style={{fontStyle: 'italic', marginTop: '1rem', color: '#6b7280', fontSize: '0.9rem'}}>
              Click to view full size - You can edit all fields before finalizing the certificate
            </p>
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
