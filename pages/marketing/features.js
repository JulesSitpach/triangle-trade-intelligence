import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function FeaturesPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <>
      <Head>
        <title>Features - Triangle Intelligence 6-Stage Journey & Working Intelligence Systems</title>
        <meta name="description" content="Verified 6-stage journey from Foundation to Alerts. Beast Master Intelligence, Database Intelligence Bridge, RSS monitoring. 97% deployment ready." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Platform Banner */}
      <div className="bloomberg-accent-banner">
        <span>6-STAGE VERIFIED JOURNEY: Foundation → Product → Routing → Partnership → Hindsight → Alerts</span>
        <span className="bloomberg-status bloomberg-status-success">97% Deployment Ready</span>
      </div>

      {/* Terminal Status Bar */}
      <div className="bloomberg-card" style={{margin: 0, borderRadius: 0, borderBottom: '1px solid var(--bloomberg-gray-700)'}}>
        <div className="bloomberg-status bloomberg-status-success">
          <div className="bloomberg-status-dot"></div>
          TRIANGLE INTELLIGENCE PROFESSIONAL TERMINAL
          <span className="text-muted">SESSION: FEATURES | STATUS: ACTIVE | {isClient ? new Date().toLocaleString() : 'Loading...'}</span>
        </div>
      </div>

      {/* Terminal Navigation */}
      <nav className="bloomberg-nav">
        <div className="bloomberg-container-padded">
          <div className="bloomberg-flex" style={{justifyContent: 'space-between', alignItems: 'center'}}>
            <Link href="/" className="bloomberg-nav-brand">
              <span className="text-success">◢</span>
              TRIANGLE INTELLIGENCE
              <span className="text-primary">PRO v2.1</span>
            </Link>
            <div className="bloomberg-flex" style={{justifyContent: 'flex-end', flexWrap: 'wrap'}}>
              <Link href="/marketing/features" className="bloomberg-nav-link">FEATURES</Link>
              <Link href="/about" className="bloomberg-nav-link">ABOUT</Link>
              <Link href="/pricing" className="bloomberg-nav-link">PRICING</Link>
              <Link href="/marketing/contact" className="bloomberg-nav-link">CONTACT</Link>
              <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
                START FREE ANALYSIS
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), url('/image/datos-financieros.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh'
      }}>

        {/* Hero Section with Terminal Styling */}
        <div className="bloomberg-hero">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-hero-content">
              <h1 className="bloomberg-hero-title">
                6-Stage Verified Journey: Assessment to Implementation
              </h1>
              <p className="bloomberg-hero-subtitle">
                Complete USMCA optimization journey with 6 working intelligence systems. 
                500K+ trade flows analyzed • 97% deployment ready • verified savings through Mexico-based platform.
              </p>
              <div className="bloomberg-hero-actions">
                <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary bloomberg-btn-large">
                  Start Stage 1: Foundation
                </Link>
                <Link href="/dashboard-hub" className="bloomberg-btn bloomberg-btn-secondary bloomberg-btn-large">
                  View Intelligence Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 6-Stage Journey Overview */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">VERIFIED 6-STAGE JOURNEY</h3>
                <span className="bloomberg-status bloomberg-status-success">
                  <div className="bloomberg-status-dot"></div>
                  OPERATIONAL
                </span>
              </div>
              
              <div className="bloomberg-grid bloomberg-grid-3" style={{gap: 'var(--space-lg)'}}>
                <div className="bloomberg-card" style={{background: 'var(--bloomberg-gray-900)', border: '1px solid var(--bloomberg-green)'}}>
                  <div className="bloomberg-card-header">
                    <h4 className="bloomberg-card-title">1. FOUNDATION</h4>
                    <span className="bloomberg-status bloomberg-status-success">ACTIVE</span>
                  </div>
                  <p className="bloomberg-card-subtitle">Business intake with geographic intelligence derivation and foundation data capture.</p>
                  <div className="bloomberg-mb-lg">
                    <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                      • Business profile assessment<br/>
                      • Geographic intelligence derivation<br/>
                      • Import volume analysis<br/>
                      • USMCA optimization potential<br/>
                      • Foundation data capture
                    </div>
                  </div>
                  <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary" style={{width: '100%'}}>
                    Start Foundation
                  </Link>
                </div>

                <div className="bloomberg-card" style={{background: 'var(--bloomberg-gray-900)', border: '1px solid var(--bloomberg-blue)'}}>
                  <div className="bloomberg-card-header">
                    <h4 className="bloomberg-card-title">2. PRODUCT</h4>
                    <span className="bloomberg-status bloomberg-status-info">INTELLIGENCE</span>
                  </div>
                  <p className="bloomberg-card-subtitle">Product intelligence with HS code mapping via server-side APIs and classification systems.</p>
                  <div className="bloomberg-mb-lg">
                    <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                      • HS code intelligence mapping<br/>
                      • Product classification systems<br/>
                      • Tariff rate analysis<br/>
                      • USMCA eligibility verification<br/>
                      • Server-side API integration
                    </div>
                  </div>
                  <Link href="/product" className="bloomberg-btn bloomberg-btn-primary" style={{width: '100%'}}>
                    Access Product Intelligence
                  </Link>
                </div>

                <div className="bloomberg-card" style={{background: 'var(--bloomberg-gray-900)', border: '1px solid var(--bloomberg-yellow)'}}>
                  <div className="bloomberg-card-header">
                    <h4 className="bloomberg-card-title">3. ROUTING</h4>
                    <span className="bloomberg-status bloomberg-status-warning">OPTIMIZATION</span>
                  </div>
                  <p className="bloomberg-card-subtitle">Triangle routing using Database Intelligence Bridge with volatile/stable data separation.</p>
                  <div className="bloomberg-mb-lg">
                    <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                      • Triangle routing optimization<br/>
                      • Database Intelligence Bridge<br/>
                      • Volatile/stable data separation<br/>
                      • 80% API cost reduction<br/>
                      • Real-time route analysis
                    </div>
                  </div>
                  <Link href="/routing" className="bloomberg-btn bloomberg-btn-primary" style={{width: '100%'}}>
                    Optimize Routing
                  </Link>
                </div>
              </div>

              <div className="bloomberg-grid bloomberg-grid-3" style={{gap: 'var(--space-lg)', marginTop: 'var(--space-lg)'}}>
                <div className="bloomberg-card" style={{background: 'var(--bloomberg-gray-900)', border: '1px solid var(--bloomberg-orange)'}}>
                  <div className="bloomberg-card-header">
                    <h4 className="bloomberg-card-title">4. PARTNERSHIP</h4>
                    <span className="bloomberg-status bloomberg-status-warning">NETWORK</span>
                  </div>
                  <p className="bloomberg-card-subtitle">Strategic partner ecosystem and connections with network activation protocols.</p>
                  <div className="bloomberg-mb-lg">
                    <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                      • Partner ecosystem mapping<br/>
                      • Network activation protocols<br/>
                      • Strategic connections<br/>
                      • USMCA partner matching<br/>
                      • Implementation support
                    </div>
                  </div>
                  <Link href="/partnership" className="bloomberg-btn bloomberg-btn-primary" style={{width: '100%'}}>
                    Activate Partnerships
                  </Link>
                </div>

                <div className="bloomberg-card" style={{background: 'var(--bloomberg-gray-900)', border: '1px solid var(--bloomberg-green)'}}>
                  <div className="bloomberg-card-header">
                    <h4 className="bloomberg-card-title">5. HINDSIGHT</h4>
                    <span className="bloomberg-status bloomberg-status-success">LEARNING</span>
                  </div>
                  <p className="bloomberg-card-subtitle">Hindsight pattern extraction to institutional memory with success pattern intelligence.</p>
                  <div className="bloomberg-mb-lg">
                    <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                      • Pattern extraction algorithms<br/>
                      • Institutional memory building<br/>
                      • Success pattern intelligence<br/>
                      • Learning system optimization<br/>
                      • Compound intelligence growth
                    </div>
                  </div>
                  <Link href="/hindsight" className="bloomberg-btn bloomberg-btn-primary" style={{width: '100%'}}>
                    Extract Patterns
                  </Link>
                </div>

                <div className="bloomberg-card" style={{background: 'var(--bloomberg-gray-900)', border: '1px solid var(--bloomberg-red)'}}>
                  <div className="bloomberg-card-header">
                    <h4 className="bloomberg-card-title">6. ALERTS</h4>
                    <span className="bloomberg-status bloomberg-status-error">MONITORING</span>
                  </div>
                  <p className="bloomberg-card-subtitle">Predictive alerts based on volatility tracking with real-time RSS monitoring.</p>
                  <div className="bloomberg-mb-lg">
                    <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                      • Predictive alert generation<br/>
                      • Volatility tracking systems<br/>
                      • Real-time RSS monitoring<br/>
                      • Market intelligence alerts<br/>
                      • Automated notification systems
                    </div>
                  </div>
                  <Link href="/alerts" className="bloomberg-btn bloomberg-btn-primary" style={{width: '100%'}}>
                    Monitor & Alert
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Working Intelligence Systems */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <h2 className="bloomberg-section-title">WORKING INTELLIGENCE SYSTEMS</h2>
            
            {/* Top Row - Core Intelligence */}
            <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mb-xl">
              <div className="bloomberg-card">
                <div className="bloomberg-card-header">
                  <h3 className="bloomberg-card-title">
                    <span className="text-success">🧠</span> BEAST MASTER INTELLIGENCE
                  </h3>
                  <span className="bloomberg-status bloomberg-status-success">OPERATIONAL</span>
                </div>
                <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                  6 interconnected intelligence systems generating compound insights impossible with individual systems.
                </p>
                <div className="bloomberg-mb-lg">
                  <h4 className="bloomberg-card-title" style={{fontSize: '1rem', marginBottom: '0.5rem'}}>COMPOUND INTELLIGENCE:</h4>
                  <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                    • Similarity Intelligence: 240+ workflow sessions for pattern matching<br/>
                    • Seasonal Intelligence: Q4_HEAVY, SUMMER_PREPARATION timing optimization<br/>
                    • Market Intelligence: Real-time volatility (China: 85%, Mexico: 25%)<br/>
                    • Success Pattern Intelligence: 33+ hindsight patterns from database<br/>
                    • Alert Generation Intelligence: Multi-system alert prioritization<br/>
                    • Shipping Intelligence: Capacity constraints, carrier performance
                  </div>
                </div>
                <Link href="/dashboard-hub" className="bloomberg-btn bloomberg-btn-primary" style={{width: '100%'}}>
                  Access Beast Master Dashboard
                </Link>
              </div>

              <div className="bloomberg-card">
                <div className="bloomberg-card-header">
                  <h3 className="bloomberg-card-title">
                    <span className="text-primary">🏗️</span> DATABASE INTELLIGENCE BRIDGE
                  </h3>
                  <span className="bloomberg-status bloomberg-status-info">OPTIMIZED</span>
                </div>
                <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                  Intelligent separation of volatile vs stable data for 80% API cost reduction while maintaining real-time intelligence.
                </p>
                <div className="bloomberg-mb-lg">
                  <h4 className="bloomberg-card-title" style={{fontSize: '1rem', marginBottom: '0.5rem'}}>OPTIMIZATION STRATEGY:</h4>
                  <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                    • Stable Data: USMCA rates (0%) cached forever - zero API costs<br/>
                    • Volatile Data: Tariff changes cached 1-4 hours - API when needed<br/>
                    • Redis-powered rate limiting and caching<br/>
                    • Enterprise-grade performance optimization<br/>
                    • Smart cache expiry and refresh protocols<br/>
                    • Network effects from 500K+ database records
                  </div>
                </div>
                <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary" style={{width: '100%'}}>
                  Experience Optimization
                </Link>
              </div>
            </div>

            {/* Bottom Row - Supporting Systems */}
            <div className="bloomberg-grid bloomberg-grid-3">
              <div className="bloomberg-card">
                <div className="bloomberg-card-header">
                  <h3 className="bloomberg-card-title">
                    <span className="text-warning">📡</span> RSS MARKET MONITORING
                  </h3>
                  <span className="bloomberg-status bloomberg-status-warning">LIVE</span>
                </div>
                <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                  Automated RSS monitoring every 15 minutes with real-time market intelligence and alert generation.
                </p>
                <div className="bloomberg-mb-lg">
                  <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                    • Automated RSS feed monitoring<br/>
                    • 15-minute update cycles<br/>
                    • Real-time market intelligence<br/>
                    • Alert generation and prioritization<br/>
                    • Background service architecture
                  </div>
                </div>
                <Link href="/alerts" className="bloomberg-btn bloomberg-btn-primary" style={{width: '100%'}}>
                  Monitor Markets
                </Link>
              </div>

              <div className="bloomberg-card">
                <div className="bloomberg-card-header">
                  <h3 className="bloomberg-card-title">
                    <span className="text-info">🏆</span> GOLDMINE INTELLIGENCE
                  </h3>
                  <span className="bloomberg-status bloomberg-status-info">ACTIVE</span>
                </div>
                <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                  Database intelligence from 519,341+ records with network effects and institutional learning capabilities.
                </p>
                <div className="bloomberg-mb-lg">
                  <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                    • 519,341+ database records<br/>
                    • Network effects intelligence<br/>
                    • Institutional learning systems<br/>
                    • Pattern recognition algorithms<br/>
                    • Compound intelligence generation
                  </div>
                </div>
                <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary" style={{width: '100%'}}>
                  Access Goldmine
                </Link>
              </div>

              <div className="bloomberg-card">
                <div className="bloomberg-card-header">
                  <h3 className="bloomberg-card-title">
                    <span className="text-success">🌍</span> TRILINGUAL SUPPORT
                  </h3>
                  <span className="bloomberg-status bloomberg-status-success">EN/ES/FR</span>
                </div>
                <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                  700+ translation keys with database-powered i18n system for comprehensive USMCA market coverage.
                </p>
                <div className="bloomberg-mb-lg">
                  <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                    • 700+ translation keys<br/>
                    • Database-powered i18n system<br/>
                    • English/Spanish/French support<br/>
                    • Cultural and regulatory expertise<br/>
                    • USMCA market coverage
                  </div>
                </div>
                <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary" style={{width: '100%'}}>
                  Choose Language
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Performance */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">TECHNICAL PERFORMANCE METRICS</h3>
                <span className="bloomberg-status bloomberg-status-success">
                  <div className="bloomberg-status-dot"></div>
                  OPTIMIZED
                </span>
              </div>
              <div className="bloomberg-grid bloomberg-grid-4">
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-success">97%</div>
                  <div className="bloomberg-metric-label">Deployment Ready</div>
                  <div className="bloomberg-metric-change positive">Tested & Verified</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-primary">80%</div>
                  <div className="bloomberg-metric-label">API Cost Reduction</div>
                  <div className="bloomberg-metric-change positive">Volatile/Stable Strategy</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-warning">85%</div>
                  <div className="bloomberg-metric-label">Query Response Improvement</div>
                  <div className="bloomberg-metric-change positive">2.5s → 0.3s</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-info">6</div>
                  <div className="bloomberg-metric-label">Intelligence Systems</div>
                  <div className="bloomberg-metric-change positive">All Operational</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-card">
              <div className="bloomberg-hero-content">
                <h2 className="bloomberg-hero-title" style={{fontSize: '2rem'}}>
                  Start Your 6-Stage USMCA Optimization Journey
                </h2>
                <p className="bloomberg-hero-subtitle">
                  Begin with Stage 1: Foundation assessment. Complete verified journey through all 6 stages with working intelligence systems supporting every step.
                </p>
                <div className="bloomberg-flex">
                  <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary bloomberg-btn-large">
                    Start Stage 1: Foundation
                  </Link>
                  <Link href="/marketing/contact" className="bloomberg-btn bloomberg-btn-secondary bloomberg-btn-large">
                    Schedule Consultation
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}