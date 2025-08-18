import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function AboutPage() {
  const [stats, setStats] = useState({
    companies: 240,
    savings: 1850000,
    loading: true
  })
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/clean-stats')
      if (response.ok) {
        const data = await response.json()
        setStats({
          companies: data.stats.triangleRouting.stage1 + data.stats.triangleRouting.stage2,
          savings: Math.round(data.stats.database.totalTradeValue * 0.15),
          loading: false
        })
      }
    } catch (error) {
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  return (
    <>
      <Head>
        <title>Triangle Intelligence Professional Terminal - About</title>
        <meta name="description" content="Enterprise-grade trade optimization platform. Professional terminal for triangle routing intelligence. Bloomberg-class financial technology." />
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
          <span className="text-muted">SESSION: ABOUT | STATUS: ACTIVE | {isClient ? new Date().toLocaleString() : 'Loading...'}</span>
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
                Emergency Response Team: Business Survival Crisis
              </h1>
              <p className="bloomberg-hero-subtitle">
                North American emergency response team providing immediate business protection during USMCA treaty collapse threat. 
                <span className="text-warning">USMCA government assistance programs active</span> • 
                <span className="text-success">{stats.companies}+ businesses already protected</span>
              </p>
            </div>
          </div>
        </div>

        {/* Live Team Statistics */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">LIVE TEAM PERFORMANCE METRICS</h3>
                <span className="bloomberg-status bloomberg-status-success">
                  <div className="bloomberg-status-dot"></div>
                  REAL-TIME
                </span>
              </div>
              <div className="bloomberg-grid bloomberg-grid-4">
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-success">{stats.loading ? '240+' : stats.companies + '+'}</div>
                  <div className="bloomberg-metric-label">Companies Protected</div>
                  <div className="bloomberg-metric-change positive">+15 This Week</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-primary">${stats.loading ? '1.85M' : (stats.savings / 1000000).toFixed(1) + 'M'}</div>
                  <div className="bloomberg-metric-label">Crisis Savings Secured</div>
                  <div className="bloomberg-metric-change positive">+23.7% YoY</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-data">3</div>
                  <div className="bloomberg-metric-label">USMCA Countries</div>
                  <div className="bloomberg-metric-change neutral">Full Coverage</div>
                </div>
                <div className="bloomberg-metric">
                  <div className="bloomberg-metric-value text-warning">24/7</div>
                  <div className="bloomberg-metric-label">Emergency Response</div>
                  <div className="bloomberg-metric-change positive">Always Active</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Emergency Response Capabilities */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <h2 className="bloomberg-section-title">EMERGENCY RESPONSE CAPABILITIES</h2>
            <div className="bloomberg-grid bloomberg-grid-2">
              
              <div className="bloomberg-card">
                <div className="bloomberg-card-header">
                  <h3 className="bloomberg-card-title">
                    <span className="text-error">🚨</span> Crisis Response System
                  </h3>
                  <span className="bloomberg-status bloomberg-status-error">ACTIVE</span>
                </div>
                <p className="bloomberg-card-subtitle">Crisis business survival platform built during USMCA treaty threat with real-time monitoring and immediate activation protocols.</p>
                <div className="bloomberg-mb-lg">
                  <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                    • 24/7 USMCA treaty monitoring<br/>
                    • Immediate crisis alert system<br/>
                    • Emergency partnership activation<br/>
                    • Real-time threat assessment<br/>
                    • Automated protection protocols
                  </div>
                </div>
              </div>

              <div className="bloomberg-card">
                <div className="bloomberg-card-header">
                  <h3 className="bloomberg-card-title">
                    <span className="text-warning">🛡️</span> Business Protection
                  </h3>
                  <span className="bloomberg-status bloomberg-status-warning">URGENT</span>
                </div>
                <p className="bloomberg-card-subtitle">Emergency partnership activation for immediate USMCA collapse protection with guaranteed business continuity.</p>
                <div className="bloomberg-mb-lg">
                  <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                    • Triangle routing optimization<br/>
                    • Emergency supply chain rerouting<br/>
                    • Tariff impact mitigation<br/>
                    • Business continuity planning<br/>
                    • Risk assessment and monitoring
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* USMCA Network Team */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">USMCA EMERGENCY RESPONSE NETWORK</h3>
                <span className="bloomberg-status bloomberg-status-success">
                  <div className="bloomberg-status-dot"></div>
                  TRILINGUAL
                </span>
              </div>
              
              <div className="bloomberg-grid bloomberg-grid-3">
                <div className="bloomberg-card" style={{background: 'var(--bloomberg-gray-900)', border: '1px solid var(--bloomberg-blue)'}}>
                  <div className="bloomberg-card-header">
                    <h4 className="bloomberg-card-title">🇺🇸 United States</h4>
                    <span className="bloomberg-status bloomberg-status-info">MARKET INTELLIGENCE</span>
                  </div>
                  <p className="bloomberg-card-subtitle">Market intelligence and crisis monitoring with advanced analytics and real-time tariff tracking systems.</p>
                  <div className="bloomberg-metric bloomberg-mb-lg">
                    <div className="bloomberg-metric-value text-data">597K+</div>
                    <div className="bloomberg-metric-label">Trade Records Monitored</div>
                  </div>
                </div>

                <div className="bloomberg-card" style={{background: 'var(--bloomberg-gray-900)', border: '1px solid var(--bloomberg-green)'}}>
                  <div className="bloomberg-card-header">
                    <h4 className="bloomberg-card-title">🇨🇦 Canada</h4>
                    <span className="bloomberg-status bloomberg-status-success">PLATFORM TECHNOLOGY</span>
                  </div>
                  <p className="bloomberg-card-subtitle">Built crisis technology platform with institutional-grade infrastructure and emergency response automation.</p>
                  <div className="bloomberg-metric bloomberg-mb-lg">
                    <div className="bloomberg-metric-value text-data">24/7</div>
                    <div className="bloomberg-metric-label">Platform Monitoring</div>
                  </div>
                </div>

                <div className="bloomberg-card" style={{background: 'var(--bloomberg-gray-900)', border: '1px solid var(--bloomberg-orange)'}}>
                  <div className="bloomberg-card-header">
                    <h4 className="bloomberg-card-title">🇲🇽 Mexico</h4>
                    <span className="bloomberg-status bloomberg-status-warning">PARTNERSHIP ACTIVATION</span>
                  </div>
                  <p className="bloomberg-card-subtitle">Emergency partnership activation and supply chain network coordination across Latin American markets.</p>
                  <div className="bloomberg-metric bloomberg-mb-lg">
                    <div className="bloomberg-metric-value text-data">0%</div>
                    <div className="bloomberg-metric-label">USMCA Tariff Rate</div>
                  </div>
                </div>
              </div>

              <div className="bloomberg-card" style={{background: 'var(--bloomberg-gray-800)', marginTop: 'var(--space-lg)'}}>
                <h4 className="bloomberg-card-title bloomberg-mb-md">TRILINGUAL CRISIS COMMUNICATION</h4>
                <p className="bloomberg-mb-lg">
                  Emergency specialist network across all three USMCA countries for immediate crisis implementation with native-language support and cultural expertise.
                </p>
                <div className="bloomberg-grid bloomberg-grid-3">
                  <div className="bloomberg-metric">
                    <div className="bloomberg-metric-value text-primary">English</div>
                    <div className="bloomberg-metric-label">Primary Operations</div>
                  </div>
                  <div className="bloomberg-metric">
                    <div className="bloomberg-metric-value text-success">Español</div>
                    <div className="bloomberg-metric-label">Latin Markets</div>
                  </div>
                  <div className="bloomberg-metric">
                    <div className="bloomberg-metric-value text-warning">Français</div>
                    <div className="bloomberg-metric-label">Quebec Operations</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">EMERGENCY BUSINESS PROTECTION</h3>
                <span className="bloomberg-status bloomberg-status-error">
                  <div className="bloomberg-status-dot"></div>
                  IMMEDIATE ACTION REQUIRED
                </span>
              </div>
              
              <div className="bloomberg-hero-content">
                <h2 className="bloomberg-hero-title" style={{fontSize: '2rem'}}>
                  Emergency Business Protection Available Now
                </h2>
                <p className="bloomberg-hero-subtitle">
                  USMCA treaty under threat. 85% of goods could lose 0% protection. Emergency response team ready for immediate activation with guaranteed business continuity protection.
                </p>
                
                <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mb-xl">
                  <div className="bloomberg-metric">
                    <div className="bloomberg-metric-value text-error">$1.8T</div>
                    <div className="bloomberg-metric-label">Trade at Risk</div>
                  </div>
                  <div className="bloomberg-metric">
                    <div className="bloomberg-metric-value text-success">100x+</div>
                    <div className="bloomberg-metric-label">ROI Guarantee</div>
                  </div>
                </div>
                
                <div className="bloomberg-flex">
                  <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary bloomberg-btn-large">
                    Emergency Protection Assessment
                  </Link>
                  <Link href="/pricing" className="bloomberg-btn bloomberg-btn-secondary bloomberg-btn-large">
                    Crisis Response Pricing
                  </Link>
                </div>
                
                <p style={{marginTop: 'var(--space-lg)', fontSize: '0.875rem', color: 'var(--bloomberg-gray-400)'}}>
                  Emergency assessment • Business survival protection • You maintain control
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}