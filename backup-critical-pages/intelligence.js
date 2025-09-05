import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function TradeIntelligence() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const intelligenceServices = [
    {
      icon: 'TA',
      title: 'Tariff Impact Analysis',
      description: 'Real-time duty rate monitoring and cost projections with predictive analytics for strategic planning.',
      features: ['Real-time rate monitoring', 'Cost impact projections', 'Predictive analytics', 'Strategic planning tools']
    },
    {
      icon: 'SR',
      title: 'Supply Chain Risk Assessment',
      description: 'Multi-country sourcing optimization strategies with risk analysis and contingency planning.',
      features: ['Multi-country analysis', 'Risk assessment', 'Sourcing optimization', 'Contingency planning']
    },
    {
      icon: 'MO',
      title: 'Market Opportunity Identification',
      description: 'USMCA advantage analysis by product category with competitive positioning insights.',
      features: ['Category analysis', 'Competitive insights', 'Market opportunities', 'Advantage mapping']
    },
    {
      icon: 'TP',
      title: 'Trade Policy Monitoring',
      description: 'Regulatory change alerts and compliance updates with expert analysis and implementation guidance.',
      features: ['Policy change alerts', 'Compliance updates', 'Expert analysis', 'Implementation guidance']
    }
  ]

  const reports = [
    {
      title: 'USMCA Optimization Report',
      description: 'Comprehensive analysis of North American trade corridors with strategic recommendations',
      link: '/usmca-workflow'
    },
    {
      title: 'Tariff Monitor Dashboard',
      description: 'Real-time tariff change tracking with automated alerts and impact analysis',
      link: '/trump-tariff-alerts'
    },
    {
      title: 'Supply Chain Intelligence',
      description: 'Market analysis and sourcing optimization for USMCA compliance advantages',
      link: '/solutions'
    }
  ]

  return (
    <>
      <Head>
        <title>Trade Intelligence & Market Analysis | USMCA Optimization Insights</title>
        <meta name="description" content="Professional trade intelligence platform delivering market analysis, tariff forecasting, and supply chain optimization insights for North American manufacturers." />
        <meta name="keywords" content="trade intelligence, tariff analysis, supply chain optimization, USMCA market analysis, trade policy monitoring" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Fixed Navigation */}
      <nav className="nav-fixed">
        <div className="nav-container">
          <Link href="/" className="nav-logo-link">
            <div className="nav-logo-icon">T</div>
            <div>
              <div className="nav-logo-text">TradeFlow Intelligence</div>
              <div className="nav-logo-subtitle">USMCA Compliance Platform</div>
            </div>
          </Link>
          <div className="nav-menu">
            <Link href="/solutions" className="nav-menu-link">Solutions</Link>
            <Link href="/industries" className="nav-menu-link">Industries</Link>
            <Link href="/intelligence" className="nav-menu-link">Intelligence</Link>
            <Link href="/services" className="nav-menu-link">Services</Link>
            <Link href="/pricing" className="nav-menu-link">Pricing</Link>
            <Link href="/usmca-workflow" className="nav-cta-button">Start Analysis</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="main-content" style={{ paddingTop: '120px', backgroundColor: 'var(--navy-900)', color: 'white' }}>
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title" style={{ color: 'white', fontSize: '3rem' }}>
              Professional Trade Intelligence & Market Analysis
            </h1>
            <p className="section-header-subtitle" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.25rem' }}>
              Strategic insights, tariff forecasting, and supply chain optimization powered by real-time data and expert analysis. Make informed trade decisions with confidence.
            </p>
            <div style={{ marginTop: '2rem' }}>
              <Link href="/trump-tariff-alerts" className="btn-primary btn-large" style={{ marginRight: '1rem' }}>
                View Live Alerts
              </Link>
              <Link href="#intelligence" className="btn-secondary btn-large">
                Explore Intelligence
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence Services */}
      <section className="main-content" id="intelligence">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Professional Trade Intelligence Services</h2>
            <p className="section-header-subtitle">
              Data-driven insights and strategic analysis to optimize your trade operations and maximize USMCA benefits
            </p>
          </div>

          <div className="grid-2-cols">
            {intelligenceServices.map((service, index) => (
              <div key={index} className="content-card">
                <div className="content-card-icon">{service.icon}</div>
                <h3 className="content-card-title">{service.title}</h3>
                <p className="content-card-description">{service.description}</p>
                
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
                  {service.features.map((feature, idx) => (
                    <li key={idx} style={{ padding: '0.25rem 0', color: 'var(--gray-700)' }}>
                      <span style={{ color: 'var(--blue-600)', marginRight: '0.5rem' }}>▶</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Reports */}
      <section className="main-content" style={{ backgroundColor: 'var(--gray-50)' }}>
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Featured Intelligence Reports</h2>
            <p className="section-header-subtitle">
              Access our latest trade intelligence reports and market analysis
            </p>
          </div>

          <div className="grid-3-cols">
            {reports.map((report, index) => (
              <div key={index} className="content-card">
                <h3 className="content-card-title">{report.title}</h3>
                <p className="content-card-description">{report.description}</p>
                <Link href={report.link} className="content-card-link">
                  Access Report
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Data Dashboard */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Live Trade Intelligence Dashboard</h2>
          </div>
          
          <div className="insights-layout">
            <div className="content-card">
              <h3 className="content-card-title">Real-Time Market Monitoring</h3>
              <p className="content-card-description">
                Our intelligence platform monitors tariff changes, policy updates, and market conditions across North American trade corridors 24/7, delivering actionable insights when you need them most.
              </p>
              <div className="insights-button-group">
                <Link href="/trump-tariff-alerts" className="btn-primary">
                  View Live Dashboard
                </Link>
                <Link href="/usmca-workflow" className="btn-secondary">
                  Start Analysis
                </Link>
              </div>
            </div>
            
            <img 
              src="/image/datos-financieros.jpg" 
              alt="Trade Intelligence Dashboard"
              className="insights-image"
            />
          </div>
        </div>
      </section>

      {/* Intelligence Metrics */}
      <section className="main-content" style={{ backgroundColor: 'var(--blue-600)', color: 'white' }}>
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title" style={{ color: 'white' }}>
              Intelligence Platform Performance
            </h2>
          </div>
          
          <div className="grid-4-cols">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>
                24/7
              </div>
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Monitoring</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>Continuous market surveillance</p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>
&lt;5min
              </div>
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Alert Speed</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>Rapid change notifications</p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>
                15+
              </div>
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Data Sources</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>Government and market feeds</p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>
                99.9%
              </div>
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Uptime</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>Enterprise reliability</p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/trump-tariff-alerts" className="btn-primary btn-large">
              Access Intelligence Platform
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}