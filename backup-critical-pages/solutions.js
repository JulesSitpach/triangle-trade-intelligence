import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function ComplianceSolutions() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const services = [
    {
      icon: 'AI',
      title: 'HS Code Classification Software',
      description: 'AI-contextualized product classification with 34,476 government records for precise trade compliance.',
      features: ['AI-enhanced classification', 'Government-verified data', 'Sub-400ms response time', 'Universal industry coverage'],
      link: '/usmca-workflow'
    },
    {
      icon: 'UC',
      title: 'USMCA Qualification Calculator',
      description: 'Automated regional content analysis and savings projections with real-time compliance checking.',
      features: ['Regional content analysis', 'Automated calculations', 'Real-time qualification', 'Savings projections'],
      link: '/usmca-workflow'
    },
    {
      icon: 'CO',
      title: 'Certificate of Origin Generator',
      description: 'Professional PDF certificates with customs broker validation and audit-ready documentation.',
      features: ['Professional PDF output', 'Customs broker validation', 'Audit-ready records', 'Automated generation'],
      link: '/usmca-workflow'
    },
    {
      icon: 'TM',
      title: 'Trade Compliance Monitoring',
      description: 'Real-time tariff alerts and regulatory change notifications for proactive compliance management.',
      features: ['Real-time monitoring', 'Tariff change alerts', 'Regulatory updates', 'Risk notifications'],
      link: '/trump-tariff-alerts'
    }
  ]

  return (
    <>
      <Head>
        <title>USMCA Compliance Solutions | Trade Classification & Certificate Generation</title>
        <meta name="description" content="Professional USMCA compliance platform with AI-powered HS code classification, tariff savings calculator, and automated certificate of origin generation for importers and manufacturers." />
        <meta name="keywords" content="USMCA compliance software, HS code classification, certificate of origin generator, trade compliance platform, tariff optimization" />
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
              Automate USMCA Compliance with Enterprise-Grade Precision
            </h1>
            <p className="section-header-subtitle" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.25rem' }}>
              Reduce tariff costs by up to 25% with AI-enhanced trade classification, real-time qualification checking, and professional certificate generation. Trusted by Fortune 500 manufacturers.
            </p>
            <div style={{ marginTop: '2rem' }}>
              <Link href="/usmca-workflow" className="btn-primary btn-large" style={{ marginRight: '1rem' }}>
                Start Free Analysis
              </Link>
              <Link href="#services" className="btn-secondary btn-large">
                View Solutions
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Professional USMCA Compliance Solutions</h2>
            <p className="section-header-subtitle">
              Comprehensive trade compliance platform with AI-enhanced classification and automated certificate generation
            </p>
          </div>

          <div className="grid-2-cols">
            {services.map((service, index) => (
              <div key={index} className="content-card">
                <div className="content-card-icon">{service.icon}</div>
                <h3 className="content-card-title">{service.title}</h3>
                <p className="content-card-description">{service.description}</p>
                
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
                  {service.features.map((feature, idx) => (
                    <li key={idx} style={{ padding: '0.25rem 0', color: 'var(--gray-700)' }}>
                      <span style={{ color: 'var(--green-600)', marginRight: '0.5rem' }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link href={service.link} className="content-card-link">
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="main-content" style={{ backgroundColor: 'var(--gray-50)' }}>
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Why Choose TradeFlow Intelligence</h2>
          </div>
          
          <div className="grid-3-cols">
            <div className="content-card">
              <h3 className="content-card-title">AI-Enhanced Accuracy</h3>
              <p className="content-card-description">
                Our AI-contextualized classification system understands product function over material composition, delivering enterprise-grade accuracy across all industries.
              </p>
            </div>
            
            <div className="content-card">
              <h3 className="content-card-title">Government-Verified Data</h3>
              <p className="content-card-description">
                Built on 34,476 comprehensive government trade records with zero hardcoded values for precise, audit-ready compliance.
              </p>
            </div>
            
            <div className="content-card">
              <h3 className="content-card-title">Enterprise Performance</h3>
              <p className="content-card-description">
                Sub-400ms API response times, 42 specialized endpoints, and enterprise-grade security for mission-critical compliance workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="main-content" style={{ backgroundColor: 'var(--blue-600)', color: 'white' }}>
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title" style={{ color: 'white' }}>
              Ready to Optimize Your Trade Compliance?
            </h2>
            <p className="section-header-subtitle" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Start your free USMCA analysis and discover potential tariff savings for your products
            </p>
            <div style={{ marginTop: '2rem' }}>
              <Link href="/usmca-workflow" className="btn-primary btn-large">
                Start Free Analysis
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}