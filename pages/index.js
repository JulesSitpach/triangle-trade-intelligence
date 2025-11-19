import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSimpleAuth } from '../lib/contexts/SimpleAuthContext'
import TriangleLayout from '../components/TriangleLayout'
import SimpleSavingsCalculator from '../components/SimpleSavingsCalculator'
import LegalDisclaimer from '../components/LegalDisclaimer'
import Footer from '../components/Footer'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('importer') // importer, exporter, manufacturer
  const router = useRouter()
  const { user, logout, loading } = useSimpleAuth()

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Smart "Get Started" - logged in → dashboard, logged out → pricing section
  const handleGetStarted = (e) => {
    e.preventDefault()
    if (user) {
      router.push('/dashboard')
    } else {
      router.push('/pricing#pricing')  // ✅ Scroll to pricing section on pricing page
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

          {/* ✅ SMART NAVIGATION - Shows different links based on auth status */}
          <div className={`nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {loading ? (
              // Loading state - show minimal nav while checking auth
              null
            ) : user ? (
              // 🔐 LOGGED IN NAVIGATION
              <>
                <Link href="/dashboard" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/usmca-workflow" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
                  Workflows
                </Link>
                <div className="admin-dropdown">
                  <button
                    className="btn-primary"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    style={{marginLeft: '8px'}}
                  >
                    👤 {user?.email?.split('@')[0] || 'User'}
                    <span style={{marginLeft: '4px'}}>▼</span>
                  </button>
                  {userDropdownOpen && (
                    <div className="admin-dropdown-menu">
                      <Link href="/dashboard" className="admin-dropdown-item">
                        Dashboard
                      </Link>
                      <Link href="/subscription" className="admin-dropdown-item">
                        Subscription
                      </Link>
                      <button onClick={logout} className="admin-dropdown-item">
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // 🌍 LOGGED OUT NAVIGATION
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
              onMouseEnter={(e) => {
                if (activeTab !== 'importer') {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'importer') {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                }
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
              onMouseEnter={(e) => {
                if (activeTab !== 'exporter') {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'exporter') {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                }
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
              onMouseEnter={(e) => {
                if (activeTab !== 'manufacturer') {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'manufacturer') {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                }
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

          <p className="hero-description-text homepage-margin-top-2">
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

      {/* You're Not Alone */}
      <section className="main-content homepage-section-gray">
        <div className="container-app homepage-container-narrow">
          <div className="section-header homepage-section-header-centered">
            <h2 className="section-header-title">You&apos;re Not Alone</h2>
            <p className="homepage-subtitle">
              {activeTab === 'importer' && "You're managing imports, dealing with customs brokers, and trying to keep costs down. Meanwhile:"}
              {activeTab === 'exporter' && "You're shipping great products, but losing deals because of tariff complications. Meanwhile:"}
              {activeTab === 'manufacturer' && "You're making quality products in North America, but drowning in certificate requests. Meanwhile:"}
            </p>
          </div>

          {/* 2x2 Grid of Pain Points - Dynamic */}
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

          {/* Empathy Statement - Dark Blue Box */}
          <div className="homepage-empathy-box">
            <p>
              {content.empathy}
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

      {/* Real Example - Dynamic */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">{content.exampleTitle}</h2>
          </div>

          <div className="grid-2-cols">
            <div className="content-card">
              <h3 className="content-card-title">Before</h3>
              <p className="content-card-description">
                {content.exampleBefore}
              </p>
            </div>

            <div className="content-card">
              <h3 className="content-card-title">After</h3>
              <p className="content-card-description">
                {content.exampleAfter}
              </p>
              <p className="content-card-description">
                <strong>{content.exampleSavings}</strong>
              </p>
            </div>
          </div>

          <div className="section-header">
            <p className="section-header-subtitle">
              {content.exampleNote}
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
            Try Free - 1 Analysis, No Credit Card
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

      {/* Best of Both Worlds - Platform + Broker Savings */}
      <section className="main-content" style={{ backgroundColor: '#ecfdf5' }}>
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Best of Both Worlds</h2>
            <p className="section-header-subtitle">
              Use our platform for analysis, get broker validation when needed - save 65-75% either way
            </p>
          </div>

          <div className="content-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{
              backgroundColor: '#fefce8',
              padding: '1.25rem',
              borderRadius: '6px',
              border: '1px solid #fef08a',
              marginBottom: '1.5rem'
            }}>
              <p style={{ fontWeight: '600', color: '#854d0e', marginBottom: '0.5rem' }}>
                Key insight:
              </p>
              <p style={{ color: '#854d0e', marginBottom: '0' }}>
                Our platform does the heavy lifting (HS classification, RVC calculation, certificate drafting).
                Your broker just validates in <strong>1 hour</strong> instead of creating from scratch in <strong>10 hours</strong>.
              </p>
            </div>

            <div style={{
              backgroundColor: '#1e3a8a',
              color: 'white',
              padding: '1.25rem',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0' }}>
                Platform + Broker Validation = <strong>Save 65-75%</strong> vs broker-only approach
              </p>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link href="/pricing#pricing" className="btn-primary">
                See Cost Comparison →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Frequently Asked Questions</h2>
          </div>

          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="content-card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                Q: Do I still need a customs broker?
              </h3>
              <p className="text-body" style={{ marginBottom: '0' }}>
                For low-risk situations (simple supply chains, clear qualification), you can use the platform alone.
                For higher-value or complex transactions, use the platform for analysis and have your broker validate.
                Either way, you save 65-75% compared to broker-only approach.
              </p>
            </div>

            <div className="content-card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                Q: How accurate is the tariff data?
              </h3>
              <p className="text-body" style={{ marginBottom: '0' }}>
                75% of lookups use official USITC database (12,118 HS codes). 25% use real-time AI research for current
                Section 301/232 policy rates. All rates are informational - verify with official sources before customs submission.
              </p>
            </div>

            <div className="content-card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                Q: What&apos;s included in the free trial?
              </h3>
              <p className="text-body" style={{ marginBottom: '0' }}>
                1 complete workflow analysis, up to 3 components, certificate preview (no download), and access to crisis alerts dashboard.
                No credit card required.
              </p>
            </div>

            <div className="content-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                Q: How long does an analysis take?
              </h3>
              <p className="text-body" style={{ marginBottom: '0' }}>
                5 minutes or less. Enter company info, add components with origins, and get USMCA qualification results with
                tariff savings calculations instantly.
              </p>
            </div>
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
