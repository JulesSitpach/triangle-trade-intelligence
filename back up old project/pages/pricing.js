import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'

export default function CrisisPricingPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <>
      <Head>
        <title>Triangle Intelligence Professional Terminal - Pricing</title>
        <meta name="description" content="Professional trade optimization terminal licensing. Annual license $23,760. Enterprise-grade triangle routing intelligence platform." />
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
          <span className="text-muted">SESSION: PRICING | STATUS: ACTIVE | {isClient ? new Date().toLocaleString() : 'Loading...'}</span>
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
              <Link href="/dashboard" className="bloomberg-nav-link">SOLUTIONS</Link>
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
                PROFESSIONAL TERMINAL LICENSING
              </h1>
              <p className="bloomberg-hero-subtitle">
                Enterprise-grade trade optimization terminal with institutional-quality triangle routing intelligence and USMCA crisis protection.
              </p>
              <div className="bloomberg-hero-actions">
                <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary bloomberg-btn-large">
                  INITIALIZE TERMINAL ACCESS
                </Link>
                <Link href="/about" className="bloomberg-btn bloomberg-btn-secondary bloomberg-btn-large">
                  PLATFORM OVERVIEW
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Metrics */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">LICENSING OVERVIEW</h3>
                <span className="bloomberg-status bloomberg-status-success">
                  <div className="bloomberg-status-dot"></div>
                  ACTIVE
                </span>
              </div>
              <div className="bloomberg-grid bloomberg-grid-3">
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-primary">$23,760</div>
                  <div className="bloomberg-metric-label">ANNUAL LICENSE</div>
                  <div className="bloomberg-metric-change bloomberg-metric-neutral">Professional Grade</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-data">$1,980</div>
                  <div className="bloomberg-metric-label">MONTHLY EQUIVALENT</div>
                  <div className="bloomberg-metric-change bloomberg-metric-neutral">Per Terminal</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-success">15-30</div>
                  <div className="bloomberg-metric-label">DAY ROI PERIOD</div>
                  <div className="bloomberg-metric-change bloomberg-metric-positive">Guaranteed</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Terminal Licensing Tiers */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <h2 className="bloomberg-section-title">TERMINAL LICENSING MATRIX</h2>
            <p className="bloomberg-section-subtitle">Enterprise-grade trade optimization platform with emergency business protection</p>

            <div className="bloomberg-grid bloomberg-grid-3">
            
              {/* Emergency Response: $497/month */}
              <div className="bloomberg-card">
                <div className="bloomberg-card-header">
                  <div className="bloomberg-status bloomberg-status-warning">EMERGENCY RESPONSE</div>
                  <span className="bloomberg-status bloomberg-status-info">MOST POPULAR</span>
                </div>
                <h3 className="bloomberg-card-title">Business Survival Protection</h3>
                <p className="bloomberg-card-subtitle">Immediate USMCA crisis protection with triangle routing intelligence for SMBs facing trade war impacts.</p>
                
                <div className="bloomberg-metric bloomberg-mb-lg">
                  <div className="bloomberg-metric-value text-primary">$497</div>
                  <div className="bloomberg-metric-label">/month</div>
                </div>

                <div className="bloomberg-mb-lg">
                  <h4 className="bloomberg-card-title" style={{fontSize: '1rem', marginBottom: '0.5rem'}}>INCLUDED:</h4>
                  <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                    • Triangle routing intelligence<br/>
                    • USMCA treaty protection<br/>
                    • Emergency business assessment<br/>
                    • 597K+ trade flow access<br/>
                    • Basic crisis monitoring<br/>
                    • Email support
                  </div>
                </div>

                <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary" style={{width: '100%'}}>
                  Secure Protection
                </Link>
              </div>

              {/* Crisis Management: $997/month */}
              <div className="bloomberg-card">
                <div className="bloomberg-card-header">
                  <div className="bloomberg-status bloomberg-status-error">CRISIS MANAGEMENT</div>
                  <span className="bloomberg-status bloomberg-status-success">RECOMMENDED</span>
                </div>
                <h3 className="bloomberg-card-title">Advanced Protection</h3>
                <p className="bloomberg-card-subtitle">Complete crisis management with advanced analytics, dedicated support, and priority access to emergency resources.</p>
                
                <div className="bloomberg-metric bloomberg-mb-lg">
                  <div className="bloomberg-metric-value text-warning">$997</div>
                  <div className="bloomberg-metric-label">/month</div>
                </div>

                <div className="bloomberg-mb-lg">
                  <h4 className="bloomberg-card-title" style={{fontSize: '1rem', marginBottom: '0.5rem'}}>INCLUDED:</h4>
                  <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                    • Everything in Emergency Response<br/>
                    • Advanced analytics dashboard<br/>
                    • Predictive crisis alerts<br/>
                    • Priority partnership matching<br/>
                    • Phone & chat support<br/>
                    • Dedicated crisis specialist
                  </div>
                </div>

                <button className="bloomberg-btn bloomberg-btn-secondary" style={{width: '100%'}}>
                  Coming Q1 2025
                </button>
              </div>

              {/* Enterprise Protection: Custom */}
              <div className="bloomberg-card">
                <div className="bloomberg-card-header">
                  <div className="bloomberg-status bloomberg-status-success">ENTERPRISE</div>
                  <span className="bloomberg-status bloomberg-status-error">WHITE GLOVE</span>
                </div>
                <h3 className="bloomberg-card-title">Enterprise Protection</h3>
                <p className="bloomberg-card-subtitle">Custom enterprise solutions with dedicated team, API access, and comprehensive business protection programs.</p>
                
                <div className="bloomberg-metric bloomberg-mb-lg">
                  <div className="bloomberg-metric-value text-success">Custom</div>
                  <div className="bloomberg-metric-label">PRICING + CONSULTATION</div>
                </div>

                <div className="bloomberg-mb-lg">
                  <h4 className="bloomberg-card-title" style={{fontSize: '1rem', marginBottom: '0.5rem'}}>INCLUDED:</h4>
                  <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                    • Everything in Crisis Management<br/>
                    • Custom terminal deployment<br/>
                    • API & data feeds access<br/>
                    • Dedicated account management<br/>
                    • 24/7 white-glove support<br/>
                    • Custom integrations
                  </div>
                </div>

                <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary" style={{width: '100%'}}>
                  Request Consultation
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Crisis Statistics */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">USMCA CRISIS BY THE NUMBERS</h3>
                <span className="bloomberg-status bloomberg-status-error">
                  <div className="bloomberg-status-dot"></div>
                  URGENT
                </span>
              </div>
              <div className="bloomberg-grid bloomberg-grid-4">
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-error">$1.8T</div>
                  <div className="bloomberg-metric-label">Trade at Risk</div>
                  <div className="bloomberg-metric-change negative">+15% This Quarter</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-warning">85%</div>
                  <div className="bloomberg-metric-label">Goods Losing Protection</div>
                  <div className="bloomberg-metric-change negative">Accelerating</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-primary">$5B</div>
                  <div className="bloomberg-metric-label">Ontario Emergency Fund</div>
                  <div className="bloomberg-metric-change neutral">Active</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-error">Late 2025</div>
                  <div className="bloomberg-metric-label">USMCA Review Date</div>
                  <div className="bloomberg-metric-change negative">Approaching</div>
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
                  Emergency Business Protection Available Now
                </h2>
                <p className="bloomberg-hero-subtitle">
                  Don&apos;t wait for the USMCA crisis to impact your business. Start with Emergency Response protection today and upgrade as your needs grow. 240+ companies already protected.
                </p>
                <div className="bloomberg-flex">
                  <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary bloomberg-btn-large">
                    Start Emergency Assessment
                  </Link>
                  <Link href="/about" className="bloomberg-btn bloomberg-btn-secondary bloomberg-btn-large">
                    Learn About Our Team
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
