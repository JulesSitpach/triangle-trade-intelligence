import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function HomePage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <>
      <Head>
        <title>Triangle Intelligence Professional Services</title>
        <meta name="description" content="The trade intelligence world in full focus built on next gen technology." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Crisis Alert Banner */}
      <div className="bloomberg-accent-banner">
        <span>TRADE WAR ALERT: USMCA Treaty Under Review - Emergency Business Protection Active</span>
        <span className="bloomberg-status bloomberg-status-warning">597K+ Trade Flows Monitored</span>
      </div>

      {/* Terminal Status Bar */}
      <div className="bloomberg-card" style={{margin: 0, borderRadius: 0, borderBottom: '1px solid var(--bloomberg-gray-700)'}}>
        <div className="bloomberg-status bloomberg-status-success">
          <div className="bloomberg-status-dot"></div>
          TRIANGLE INTELLIGENCE PROFESSIONAL TERMINAL
          <span className="text-muted">SESSION: HOME | STATUS: ACTIVE | {isClient ? new Date().toLocaleString() : 'Loading...'}</span>
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
              <Link href="/foundation" className="bloomberg-nav-link">PLATFORM</Link>
              <Link href="/dashboard-hub" className="bloomberg-nav-link">SOLUTIONS</Link>
              <Link href="/about" className="bloomberg-nav-link">INSIGHTS</Link>
              <Link href="/pricing" className="bloomberg-nav-link">SUPPORT</Link>
              <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
                ACCESS TERMINAL
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main style={{
        backgroundColor: 'var(--bloomberg-bg-primary)',
        color: 'var(--bloomberg-text-primary)',
        minHeight: '100vh'
      }}>
        <div className="bloomberg-main-background">
        {/* Hero Section with Terminal Styling */}
        <div className="bloomberg-hero">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-hero-content">
              <h1 className="bloomberg-hero-title">
                The financial world in full focus built on next gen technology.
              </h1>
              <p className="bloomberg-hero-subtitle">
                Power your decision making with best-in-class tariff data, triangle routing analytics and 
                access to a global USMCA community - all from one fully integrated solution.
              </p>
              <div className="bloomberg-hero-actions">
                <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary bloomberg-btn-large">
                  Order a Terminal Subscription
                </Link>
                <Link href="/pricing" className="bloomberg-btn bloomberg-btn-secondary bloomberg-btn-large">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Market Status */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">LIVE MARKET INTELLIGENCE</h3>
                <span className="bloomberg-status bloomberg-status-success">
                  <div className="bloomberg-status-dot"></div>
                  REAL-TIME
                </span>
              </div>
              <div className="bloomberg-grid bloomberg-grid-4">
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-primary">597K+</div>
                  <div className="bloomberg-metric-label">Trade Flow Records</div>
                  <div className="bloomberg-metric-change bloomberg-metric-positive">+12.5% This Month</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-success">$847M</div>
                  <div className="bloomberg-metric-label">Total Savings Tracked</div>
                  <div className="bloomberg-metric-change bloomberg-metric-positive">+23.7% YoY</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-success">0%</div>
                  <div className="bloomberg-metric-label">USMCA Tariff Rate</div>
                  <div className="bloomberg-metric-change bloomberg-metric-neutral">Treaty Protected</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-error">25-50%</div>
                  <div className="bloomberg-metric-label">Direct Import Tariffs</div>
                  <div className="bloomberg-metric-change bloomberg-metric-negative">Rising Risk</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Terminal Products */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <h2 className="bloomberg-section-title">OUR PRODUCTS</h2>
            
            {/* Top Row - 3 Main Products */}
            <div className="bloomberg-grid bloomberg-grid-3 bloomberg-mb-xl">
              {/* Triangle Terminal */}
              <div className="bloomberg-card">
                <h3 className="bloomberg-card-title bloomberg-font-bold">
                  Triangle Terminal
                </h3>
                <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                  Professional trade routing and tariff optimization platform for enterprise clients.
                </p>
                <div className="bloomberg-flex">
                  <Link href="/dashboard" className="bloomberg-btn bloomberg-btn-primary">
                    Access Terminal
                  </Link>
                </div>
              </div>

              {/* Data Intelligence */}
              <div className="bloomberg-card">
                <h3 className="bloomberg-card-title bloomberg-font-bold">
                  Data Intelligence
                </h3>
                <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                  Real-time trade data, tariff analysis and market intelligence powered by 597K+ trade flows.
                </p>
                <div className="bloomberg-flex">
                  <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
                    View Data
                  </Link>
                </div>
              </div>

              {/* Trading Analytics */}
              <div className="bloomberg-card">
                <h3 className="bloomberg-card-title bloomberg-font-bold">
                  Trading Analytics
                </h3>
                <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                  Advanced analytics for triangle routing strategies and USMCA optimization.
                </p>
                <div className="bloomberg-flex">
                  <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
                    Start Analysis
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Row - 3 Additional Products */}
            <div className="bloomberg-grid bloomberg-grid-3">
              {/* Risk Management */}
              <div className="bloomberg-card">
                <h3 className="bloomberg-card-title bloomberg-font-bold">
                  Risk Management
                </h3>
                <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                  Monitor political risk, tariff volatility and supply chain disruptions in real-time.
                </p>
                <div className="bloomberg-flex">
                  <Link href="/alerts" className="bloomberg-btn bloomberg-btn-primary">
                    Monitor Risk
                  </Link>
                </div>
              </div>

              {/* Compliance Monitor */}
              <div className="bloomberg-card">
                <h3 className="bloomberg-card-title bloomberg-font-bold">
                  Compliance Monitor
                </h3>
                <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                  USMCA compliance tracking and regulatory change alerts for seamless operations.
                </p>
                <div className="bloomberg-flex">
                  <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
                    Check Compliance
                  </Link>
                </div>
              </div>

              {/* Market Indices */}
              <div className="bloomberg-card">
                <h3 className="bloomberg-card-title bloomberg-font-bold">
                  Market Indices
                </h3>
                <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                  Track market performance, trade volume indices and economic indicators across USMCA region.
                </p>
                <div className="bloomberg-flex">
                  <Link href="/markets" className="bloomberg-btn bloomberg-btn-primary">
                    View Markets
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* USMCA Crisis Intelligence */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">USMCA TREATY CRISIS MONITOR</h3>
                <span className="bloomberg-status bloomberg-status-error">
                  <div className="bloomberg-status-dot"></div>
                  URGENT
                </span>
              </div>
              
              {/* Crisis Description */}
              <div className="bloomberg-mb-lg">
                <h4 className="bloomberg-card-title bloomberg-mb-md">Emergency Business Protection</h4>
                <p className="bloomberg-mb-lg">USMCA treaty under review. 85% of goods could lose 0% protection status. Emergency response team providing immediate business survival protection across all three USMCA countries.</p>
                <div className="bloomberg-flex">
                  <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
                    Emergency Assessment
                  </Link>
                  <Link href="/pricing" className="bloomberg-btn bloomberg-btn-secondary">
                    Crisis Pricing
                  </Link>
                </div>
              </div>
              
              {/* Crisis Metrics */}
              <div className="bloomberg-grid bloomberg-grid-4">
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-error">$1.8T</div>
                  <div className="bloomberg-metric-label">Trade at Risk</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-warning">85%</div>
                  <div className="bloomberg-metric-label">Goods Losing Protection</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-success">240+</div>
                  <div className="bloomberg-metric-label">Companies Protected</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-primary">2025</div>
                  <div className="bloomberg-metric-label">USMCA Review Date</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        </div>
      </main>
    </>
  )
}