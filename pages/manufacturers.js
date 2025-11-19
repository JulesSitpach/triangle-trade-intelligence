import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSimpleAuth } from '../lib/contexts/SimpleAuthContext'
import SimpleSavingsCalculator from '../components/SimpleSavingsCalculator'
import LegalDisclaimer from '../components/LegalDisclaimer'
import Footer from '../components/Footer'

export default function ManufacturersPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('manufacturer') // Default to importer
  const router = useRouter()
  const { user, logout, loading } = useSimpleAuth()

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [loading, user, router])

  const handleGetStarted = (e) => {
    e.preventDefault()
    if (user) {
      router.push('/dashboard')
    } else {
      router.push('/pricing#pricing')
    }
    setMobileMenuOpen(false)
  }

  // Content for each user type
  const contentByType = {
    importer: {
      badge: 'Trade Policy Update: USMCA Optimization Opportunities Available',
      headline: '70% of SMBs Qualify for USMCA',
      highlightText: "But Don't Know It",
      description: 'Are you paying tariffs when you could qualify for duty-free status?',
      notAloneText: "You're running a profitable business, but confused about USMCA qualification and uncertain about tariff costs. Meanwhile:",
      painPoints: [
        { title: 'Tariff Policies Change Every Week', desc: 'Section 301, Section 232, USMCA updates—impossible to track alone' },
        { title: 'Broker Consulting Fees Add Up Fast', desc: '$200-400/hour every time you need supply chain impact analysis' },
        { title: 'No Time to Research USMCA Rules', desc: "RVC calculations, origin rules, preference criteria—it's a second job" },
        { title: "You Suspect You're Overpaying", desc: "But you don't have a trade team to verify if you qualify" }
      ],
      empathy: "You're right to be frustrated. Small businesses get stuck paying tariffs that larger competitors avoid—simply because they have trade compliance teams and you don't.",
      exampleTitle: 'Real Example: Electronics Importer',
      exampleBefore: 'Paying 25% Section 301 tariffs on China-sourced components',
      exampleAfter: 'Discovered 72% USMCA qualification through Mexico assembly',
      exampleSavings: 'Annual Savings: $43,750 in eliminated tariffs',
      exampleNote: "They didn't know they qualified. They were just trying to keep their business running."
    },
    exporter: {
      badge: 'Win More B2B Contracts: USMCA Certificate Generation',
      headline: 'Your Buyers Are Paying 25% Tariffs',
      highlightText: 'On YOUR Products',
      description: 'Provide USMCA certificates so your customers qualify for duty-free import',
      notAloneText: "You're making quality products, but losing B2B deals to certificate-ready competitors. Meanwhile:",
      painPoints: [
        { title: 'Lost Deals to USMCA-Ready Competitors', desc: 'Buyers choose suppliers who provide compliant certificates—costing you contracts' },
        { title: 'Customer Complaints About Tariff Costs', desc: 'Your products are great, but import duties make you too expensive vs local suppliers' },
        { title: 'Manual Certificate Paperwork Takes Days', desc: 'Each customer request requires hours of documentation and customs research' },
        { title: 'No Way to Prove USMCA Qualification', desc: "You know your products qualify, but can't provide the required Form D certificates" }
      ],
      empathy: "You're losing deals because you can't document what you already know—that your products qualify for duty-free treatment under USMCA.",
      exampleTitle: 'Real Example: Furniture Exporter (Mexico → US)',
      exampleBefore: 'Losing B2B contracts because US buyers paid 10% import duties',
      exampleAfter: 'Started providing USMCA certificates, documented 85% regional content',
      exampleSavings: 'Won 3 new contracts worth $180K/year with duty-free certification',
      exampleNote: "They had the qualifying products all along. They just couldn't prove it until now."
    },
    manufacturer: {
      badge: 'Manufacturer Documentation: Prove Your USMCA Origin',
      headline: 'Your Distributors Need Certificates',
      highlightText: "You Can't Provide Them",
      description: 'Generate compliant USMCA certificates showing your products qualify for duty-free status',
      notAloneText: "You're making quality products in North America, but drowning in certificate requests. Meanwhile:",
      painPoints: [
        { title: 'Distributor Certificate Requests Pile Up', desc: "Every customer asks for USMCA Form D, but you don't have the time or expertise to create them" },
        { title: 'RVC Calculations Are Confusing', desc: 'Regional Value Content thresholds vary by industry—electronics 65%, automotive 75%, textiles 55%' },
        { title: 'Origin Rules Keep Changing', desc: 'USMCA 2026 renegotiation, Section 301 updates, new tariff classifications—impossible to track' },
        { title: 'Manual Documentation Takes 6+ Hours', desc: "Calculating bill of materials, origin tracing, percentage calculations—it's a second full-time job" }
      ],
      empathy: "You manufacture in North America. Your products qualify. But proving it to customs authorities and B2B buyers requires documentation you don't have time to create.",
      exampleTitle: 'Real Example: Auto Parts Manufacturer (Mexico)',
      exampleBefore: 'Manually calculating RVC for each distributor request, taking 8 hours per certificate',
      exampleAfter: 'Platform documented 78% regional content in 10 minutes with AI-powered BOM analysis',
      exampleSavings: 'Now provides certificates same-day, enabling distributors to save $125K/year in tariffs',
      exampleNote: "They were already compliant. They just needed a way to document it quickly."
    }
  }

  const content = contentByType[activeTab]

  return (
    <>
      <Head>
        <title>USMCA Origin Certificate Generator for Manufacturers | Triangle Trade Intelligence</title>
        <meta name="description" content="Manufacturers: Prove your USMCA origin. Our AI platform generates compliant certificates for distributors in 10 minutes. Enable your customers to save on tariffs." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="USMCA Certificate Generator for Manufacturers" />
        <meta property="og:description" content="AI-powered USMCA certificate generation for manufacturers. Prove your products qualify for duty-free treatment." />
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
          <button
            className="nav-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            ☰
          </button>

          <div className={`nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {loading ? (
              null
            ) : user ? (
              <>
                <Link href="/dashboard" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/usmca-workflow" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
                  Workflows
                </Link>
                <div className="admin-dropdown">
                  <span
                    className="nav-menu-link"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    style={{cursor: 'pointer'}}
                  >
                    {user?.email?.split('@')[0] || 'User'} ▼
                  </span>
                  {userDropdownOpen && (
                    <div className="admin-dropdown-menu">
                      <Link href="/subscription" className="admin-dropdown-item">
                        Subscription/Billing
                      </Link>
                      <button onClick={logout} className="admin-dropdown-item">
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/certificate-of-origin" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
                  Certificate
                </Link>
                <Link href="/ongoing-alerts" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
                  Alerts
                </Link>
                <Link href="/pricing" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
                  Pricing
                </Link>
                <button
                  onClick={handleGetStarted}
                  className="nav-menu-link"
                  style={{background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1rem'}}
                >
                  Get Started
                </button>
                <Link href="/login" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
              </>
            )}
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
          {/* User Type Tabs */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setActiveTab('importer')}
              style={{
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: activeTab === 'importer' ? '2px solid #fbbf24' : '2px solid rgba(255, 255, 255, 0.3)',
                backgroundColor: activeTab === 'importer' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)'
              }}
            >
              I IMPORT
            </button>
            <button
              onClick={() => setActiveTab('exporter')}
              style={{
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: activeTab === 'exporter' ? '2px solid #fbbf24' : '2px solid rgba(255, 255, 255, 0.3)',
                backgroundColor: activeTab === 'exporter' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)'
              }}
            >
              I EXPORT
            </button>
            <button
              onClick={() => setActiveTab('manufacturer')}
              style={{
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: activeTab === 'manufacturer' ? '2px solid #fbbf24' : '2px solid rgba(255, 255, 255, 0.3)',
                backgroundColor: activeTab === 'manufacturer' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)'
              }}
            >
              I MANUFACTURE
            </button>
          </div>

          <div className="hero-badge">
            {content.badge}
          </div>

          <h1 className="hero-main-title">
            {content.headline}<br/>
            <span className="hero-yellow-highlight">{content.highlightText}</span>
          </h1>

          <p className="hero-description-text">
            {content.description}
          </p>

          <div className="hero-button-group">
            <Link
              href="/signup"
              className="hero-primary-button"
              aria-label="Start free analysis"
            >
              Try Free - 1 Analysis, No Credit Card
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

      {/* You're Not Alone Section */}
      <section className="main-content" style={{ paddingTop: '3rem', paddingBottom: '1rem' }}>
        <div className="container-app">
          <h2 style={{
            fontSize: '3rem',
            fontWeight: '700',
            color: 'var(--navy-900)',
            textAlign: 'center',
            marginBottom: '0.5rem'
          }}>
            {activeTab === 'importer' ? 'Importers' : activeTab === 'exporter' ? 'Exporters' : 'Manufacturers'}
          </h2>
          <h3 className="section-header-title" style={{ marginBottom: '1rem', fontSize: '1.75rem' }}>You're Not Alone</h3>
          <p className="section-header-subtitle" style={{ fontSize: '1.125rem', maxWidth: '800px', margin: '0 auto 2rem' }}>
            {content.notAloneText}
          </p>

          {/* Pain Points Grid */}
          <div className="grid-2-cols">
            {content.painPoints.map((pain, index) => (
              <div key={index} className="content-card">
                <h3 className="content-card-title">
                  {pain.title}
                </h3>
                <p className="content-card-description">
                  {pain.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Empathy Statement */}
          <div className="homepage-empathy-box">
            <p>
              {content.empathy}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="main-content" style={{ paddingTop: '1rem' }}>
        <div className="container-app text-center">
          <h2 className="section-header-title">Ready to Provide USMCA Certificates?</h2>
          <p className="section-header-subtitle">
            Join manufacturers who are providing USMCA certificates and enabling their distributors to save with Triangle Intelligence.
          </p>
          <Link href="/signup" className="btn-primary">
            Try Free - 1 Analysis, No Credit Card
          </Link>
        </div>
      </section>

      <LegalDisclaimer />
      <Footer />
    </>
  )
}
