import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    tradeFlows: '597,000+',
    savings: '$847M',
    companies: '380+',
    avgSetup: '12.3 days'
  })

  return (
    <>
      <Head>
        <title>Triangle Intelligence Dashboard - Trade Optimization Platform</title>
        <meta name="description" content="Enterprise trade intelligence dashboard with 597K+ trade flows and $847M+ savings generated" />
      </Head>

      {/* Bloomberg Professional Navigation */}
      <header className="bloomberg-nav">
        <div className="bloomberg-flex">
          <div className="bloomberg-nav-brand">Triangle Intelligence</div>
          <div className="bloomberg-flex">
            <Link href="/platform" className="bloomberg-nav-link">Platform</Link>
            <Link href="/pricing" className="bloomberg-nav-link">Pricing</Link>
            <Link href="/about" className="bloomberg-nav-link">About</Link>
            <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero Dashboard Section */}
      <div className="bloomberg-container">
        <section className="bloomberg-section">
          <div className="bloomberg-card">
            <div className="bloomberg-text-center bloomberg-mb-xl">
              <h1 className="bloomberg-hero-title">Trade Intelligence Dashboard</h1>
              <p className="bloomberg-hero-subtitle">
                Real-time USMCA triangle routing intelligence with enterprise-grade market data
              </p>
            </div>

            {/* Key Metrics Grid - Bloomberg Style */}
            <div className="bloomberg-grid bloomberg-grid-4 bloomberg-mb-xl">
              <div className="bloomberg-card">
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-success">{stats.tradeFlows}</div>
                  <div className="bloomberg-metric-label">Trade Flows Analyzed</div>
                </div>
                <div className="bloomberg-status bloomberg-status-success">LIVE</div>
              </div>

              <div className="bloomberg-card">
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-success">{stats.savings}</div>
                  <div className="bloomberg-metric-label">Total Savings Generated</div>
                </div>
                <div className="bloomberg-status bloomberg-status-success">ACTIVE</div>
              </div>

              <div className="bloomberg-card">
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-success">{stats.companies}</div>
                  <div className="bloomberg-metric-label">Protected Companies</div>
                </div>
                <div className="bloomberg-status bloomberg-status-success">GROWING</div>
              </div>

              <div className="bloomberg-card">
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-success">{stats.avgSetup}</div>
                  <div className="bloomberg-metric-label">Average Setup Time</div>
                </div>
                <div className="bloomberg-status bloomberg-status-success">OPTIMIZED</div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Platform Features - Bloomberg Terminal Style */}
        <section className="bloomberg-section">
          <div className="bloomberg-text-center bloomberg-mb-xl">
            <h2 className="bloomberg-card-title">TRIANGLE INTELLIGENCE PLATFORM</h2>
            <p className="bloomberg-card-subtitle">Enterprise-grade trade optimization powered by 597K+ global trade flows</p>
          </div>

          <div className="bloomberg-grid bloomberg-grid-3">
            {/* Trade Intelligence */}
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">Trade Intelligence</h3>
                <div className="bloomberg-status bloomberg-status-success">ONLINE</div>
              </div>
              <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                Real-time analysis of global trade flows with AI-powered pattern recognition for optimal USMCA routing opportunities.
              </p>
              <div className="bloomberg-mb-lg">
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value">597K+</div>
                  <div className="bloomberg-metric-label">Live Trade Flows</div>
                </div>
              </div>
              <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
                Access Intelligence →
              </Link>
            </div>

            {/* Route Optimization */}
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">Route Optimization</h3>
                <div className="bloomberg-status bloomberg-status-success">ACTIVE</div>
              </div>
              <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                Advanced triangle routing algorithms leveraging Mexico and Canada USMCA corridors for maximum tariff reduction.
              </p>
              <div className="bloomberg-mb-lg">
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value">0%</div>
                  <div className="bloomberg-metric-label">USMCA Tariff Rate</div>
                </div>
              </div>
              <Link href="/routing" className="bloomberg-btn bloomberg-btn-primary">
                Optimize Routes →
              </Link>
            </div>

            {/* Market Intelligence */}
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">Market Intelligence</h3>
                <div className="bloomberg-status bloomberg-status-error">URGENT</div>
              </div>
              <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                Live monitoring of bilateral tariff changes, trade policy updates, and emergency response protocols.
              </p>
              <div className="bloomberg-mb-lg">
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-error">25-50%</div>
                  <div className="bloomberg-metric-label">Bilateral Tariff Risk</div>
                </div>
              </div>
              <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
                Get Protected →
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Access Navigation */}
        <section className="bloomberg-section">
          <div className="bloomberg-card">
            <h3 className="bloomberg-card-title bloomberg-mb-lg">Platform Access</h3>
            <div className="bloomberg-grid bloomberg-grid-4">
              <Link href="/foundation" className="bloomberg-btn bloomberg-btn-secondary">
                Business Setup
              </Link>
              <Link href="/product" className="bloomberg-btn bloomberg-btn-secondary">
                Product Analysis
              </Link>
              <Link href="/routing" className="bloomberg-btn bloomberg-btn-secondary">
                Route Planning
              </Link>
              <Link href="/pricing" className="bloomberg-btn bloomberg-btn-primary">
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Emergency Alert Banner */}
        <section className="bloomberg-section">
          <div className="bloomberg-card border-error">
            <div className="bloomberg-flex">
              <div>
                <h4 className="bloomberg-card-title text-error">🚨 Trade War Alert: US-Canada Tariff Escalation</h4>
                <p className="bloomberg-card-subtitle">
                  New bilateral tariffs threaten $2.1B in trade. USMCA triangle routing provides immediate protection.
                </p>
              </div>
              <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
                Protect Now →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}