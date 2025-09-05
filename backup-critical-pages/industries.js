import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Industries() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const industries = [
    {
      icon: 'AU',
      title: 'Automotive',
      description: 'Specialized USMCA compliance for automotive parts, components, and manufacturing with industry-specific qualification rules.',
      benefits: ['Automotive-specific HS codes', 'Parts qualification analysis', 'Manufacturing compliance', 'Supply chain optimization'],
      keywords: 'Automotive USMCA compliance, auto parts classification'
    },
    {
      icon: 'EL',
      title: 'Electronics',
      description: 'Electronics trade classification with function-first logic for accurate HS code determination and tariff optimization.',
      benefits: ['Electronic component analysis', 'Function-based classification', 'Semiconductor compliance', 'Technology imports'],
      keywords: 'Electronics trade classification, semiconductor imports'
    },
    {
      icon: 'TX',
      title: 'Textiles & Apparel',
      description: 'Textile industry compliance with specialized rules of origin and yarn-forward requirements for maximum savings.',
      benefits: ['Yarn-forward analysis', 'Fabric classification', 'Apparel rules of origin', 'Textile tariff optimization'],
      keywords: 'Textile tariff optimization, apparel USMCA rules'
    },
    {
      icon: 'CH',
      title: 'Chemicals',
      description: 'Chemical industry trade compliance with precise molecular classification and specialized safety requirements.',
      benefits: ['Chemical classification', 'Molecular analysis', 'Safety compliance', 'Regulatory monitoring'],
      keywords: 'Chemical industry USMCA benefits, chemical classification'
    },
    {
      icon: 'MD',
      title: 'Medical Devices',
      description: 'Medical device import compliance with FDA coordination and specialized health product classifications.',
      benefits: ['FDA compliance coordination', 'Medical device classification', 'Health product rules', 'Regulatory updates'],
      keywords: 'Medical device import compliance, FDA trade rules'
    },
    {
      icon: 'FD',
      title: 'Food & Agriculture',
      description: 'Food processing and agricultural product compliance with USDA coordination and specialized food safety rules.',
      benefits: ['USDA coordination', 'Food safety compliance', 'Agricultural classifications', 'Processing rules'],
      keywords: 'Food processing trade rules, agricultural USMCA'
    }
  ]

  return (
    <>
      <Head>
        <title>Industry-Specific USMCA Solutions | Automotive, Electronics, Textiles & More</title>
        <meta name="description" content="Specialized USMCA compliance solutions for automotive, electronics, textiles, chemicals, medical devices, and food manufacturing industries." />
        <meta name="keywords" content="Automotive USMCA compliance, Electronics trade classification, Textile tariff optimization, Medical device import compliance, Food processing trade rules, Chemical industry USMCA benefits" />
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
              Sector-Specific Trade Compliance Expertise
            </h1>
            <p className="section-header-subtitle" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.25rem' }}>
              Industry-tailored HS code databases, specialized qualification rules, and sector-specific savings opportunities. Reduce compliance costs while maximizing USMCA benefits.
            </p>
            <div style={{ marginTop: '2rem' }}>
              <Link href="/usmca-workflow" className="btn-primary btn-large" style={{ marginRight: '1rem' }}>
                Analyze Your Industry
              </Link>
              <Link href="#industries" className="btn-secondary btn-large">
                View Industries
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="main-content" id="industries">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Industry-Specific Solutions</h2>
            <p className="section-header-subtitle">
              Specialized USMCA compliance tailored to your industry's unique requirements and opportunities
            </p>
          </div>

          <div className="grid-3-cols">
            {industries.map((industry, index) => (
              <div key={index} className="content-card">
                <div className="content-card-icon">{industry.icon}</div>
                <h3 className="content-card-title">{industry.title}</h3>
                <p className="content-card-description">{industry.description}</p>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--navy-700)' }}>
                    Industry Benefits:
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {industry.benefits.map((benefit, idx) => (
                      <li key={idx} style={{ padding: '0.25rem 0', color: 'var(--gray-700)', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--green-600)', marginRight: '0.5rem' }}>✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Link href="/usmca-workflow" className="content-card-link">
                  Start Industry Analysis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Benefits */}
      <section className="main-content" style={{ backgroundColor: 'var(--gray-50)' }}>
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Why Industry-Specific Matters</h2>
            <p className="section-header-subtitle">
              Generic trade compliance misses industry nuances that can cost you significant savings
            </p>
          </div>
          
          <div className="grid-2-cols">
            <div className="content-card">
              <h3 className="content-card-title">Specialized Classification Logic</h3>
              <p className="content-card-description">
                Our AI understands that automotive electrical wire classifies as conductors (Chapter 85), not copper products (Chapter 74), ensuring accurate duty rates for your specific industry.
              </p>
            </div>
            
            <div className="content-card">
              <h3 className="content-card-title">Industry-Specific Regulations</h3>
              <p className="content-card-description">
                Each industry has unique USMCA qualification requirements. Our platform incorporates textile yarn-forward rules, automotive content calculations, and medical device FDA coordination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title">Industry Success Metrics</h2>
          </div>
          
          <div className="grid-4-cols">
            <div className="content-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--green-600)', marginBottom: '0.5rem' }}>
                25%
              </div>
              <h3 className="content-card-title">Average Tariff Savings</h3>
              <p className="content-card-description">Typical savings through industry-specific USMCA optimization</p>
            </div>
            
            <div className="content-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--blue-600)', marginBottom: '0.5rem' }}>
                500+
              </div>
              <h3 className="content-card-title">Enterprise Clients</h3>
              <p className="content-card-description">Fortune 500 manufacturers trust our industry expertise</p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--navy-600)', marginBottom: '0.5rem' }}>
                95%
              </div>
              <h3 className="content-card-title">Classification Accuracy</h3>
              <p className="content-card-description">Industry-specific AI delivers superior accuracy</p>
            </div>
            
            <div className="content-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--amber-600)', marginBottom: '0.5rem' }}>
                &lt;400ms
              </div>
              <h3 className="content-card-title">Response Time</h3>
              <p className="content-card-description">Enterprise-grade performance for all industries</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="main-content" style={{ backgroundColor: 'var(--blue-600)', color: 'white' }}>
        <div className="container-app">
          <div className="section-header">
            <h2 className="section-header-title" style={{ color: 'white' }}>
              Ready to Optimize Your Industry's Trade Compliance?
            </h2>
            <p className="section-header-subtitle" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Get industry-specific analysis and discover specialized USMCA opportunities for your sector
            </p>
            <div style={{ marginTop: '2rem' }}>
              <Link href="/usmca-workflow" className="btn-primary btn-large">
                Start Industry Analysis
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}