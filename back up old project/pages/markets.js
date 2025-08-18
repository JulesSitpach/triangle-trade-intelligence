import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'

export default function MarketsPage() {
  const [selectedMarket, setSelectedMarket] = useState('usa')
  
  const markets = {
    usa: {
      title: 'United States Market',
      flag: '🇺🇸',
      description: 'Optimize your imports into the largest consumer market in North America',
      keyPorts: ['Los Angeles', 'Long Beach', 'New York/New Jersey', 'Savannah', 'Seattle'],
      advantages: [
        'Largest consumer market ($25T+ economy)',
        'Advanced logistics infrastructure',
        'Strong IP protection laws',
        'Diverse business ecosystem',
        'Access to 330M+ consumers'
      ],
      triangleOpportunities: [
        {
          route: 'China → Mexico → USA',
          description: 'Leverage Mexico\'s manufacturing expertise and USMCA benefits',
          savings: 'Up to 28% tariff savings',
          complexity: 'Medium',
          timeframe: '60-90 days implementation'
        },
        {
          route: 'Asia → Canada → USA',
          description: 'Utilize Canada\'s advanced logistics and processing capabilities',
          savings: 'Up to 25% tariff savings',
          complexity: 'Low-Medium',
          timeframe: '45-60 days implementation'
        }
      ],
      industries: ['Electronics', 'Automotive', 'Textiles', 'Manufacturing', 'Consumer Goods'],
      caseStudy: {
        company: 'TechCorp Electronics',
        industry: 'Consumer Electronics',
        challenge: 'High tariffs on smartphone accessories from China',
        solution: 'Triangle route through Mexican assembly facility',
        result: '$340K annual savings (22% reduction)',
        timeToValue: '75 days'
      }
    },
    canada: {
      title: 'Canada Market',
      flag: '🇨🇦',
      description: 'Access sophisticated consumers and leverage strategic USMCA positioning',
      keyPorts: ['Vancouver', 'Toronto', 'Montreal', 'Halifax'],
      advantages: [
        'Sophisticated consumer base',
        'Excellent trade infrastructure',
        'Strong regulatory framework',
        'Natural resources abundance',
        'Gateway to US market'
      ],
      triangleOpportunities: [
        {
          route: 'Asia → Canada → USA',
          description: 'Process goods in Canada before final US destination',
          savings: 'Up to 25% tariff optimization',
          complexity: 'Low',
          timeframe: '30-45 days implementation'
        },
        {
          route: 'Europe → Canada Direct',
          description: 'Leverage CETA agreement for European imports',
          savings: 'Up to 15% duty reduction',
          complexity: 'Low',
          timeframe: '30-60 days implementation'
        }
      ],
      industries: ['Natural Resources', 'Technology', 'Manufacturing', 'Agriculture', 'Energy'],
      caseStudy: {
        company: 'MapleTech Manufacturing',
        industry: 'Industrial Equipment',
        challenge: 'Complex European machinery imports',
        solution: 'Direct CETA routing with Canadian processing',
        result: '$180K annual savings (18% reduction)',
        timeToValue: '45 days'
      }
    },
    mexico: {
      title: 'Mexico Market',
      flag: '🇲🇽',
      description: 'Tap into manufacturing excellence and strategic USMCA advantages',
      keyPorts: ['Tijuana', 'Mexicali', 'Nuevo Laredo', 'Veracruz'],
      advantages: [
        'World-class manufacturing base',
        'Competitive labor costs',
        'Strategic USMCA positioning',
        'Growing middle class (130M+ people)',
        'Excellent US connectivity'
      ],
      triangleOpportunities: [
        {
          route: 'Asia → Mexico → USA',
          description: 'Leverage Mexico\'s manufacturing and assembly expertise',
          savings: 'Up to 28% tariff optimization',
          complexity: 'Medium-High',
          timeframe: '90-120 days implementation'
        },
        {
          route: 'China → Mexico → North America',
          description: 'Full supply chain optimization through Mexican facilities',
          savings: 'Up to 32% total cost reduction',
          complexity: 'High',
          timeframe: '120-180 days implementation'
        }
      ],
      industries: ['Automotive', 'Electronics', 'Textiles', 'Aerospace', 'Medical Devices'],
      caseStudy: {
        company: 'AutoParts Internacional',
        industry: 'Automotive Components',
        challenge: 'High US tariffs on Chinese automotive parts',
        solution: 'Triangle routing with Mexican assembly and finishing',
        result: '$650K annual savings (31% reduction)',
        timeToValue: '110 days'
      }
    }
  }

  const currentMarket = markets[selectedMarket]

  return (
    <>
      <Head>
        <title>USMCA Markets - Triangle Intelligence Platform</title>
        <meta name="description" content="Optimize your trade routes across USA, Canada, and Mexico with Triangle Intelligence" />
      </Head>
      
      <nav className="bloomberg-nav">
        <Link href="/" className="bloomberg-nav-brand">Triangle Intelligence</Link>
        
        <div className="nav-links">
          <Link href="/pricing" className="bloomberg-nav-link">Pricing</Link>
          <Link href="/signup" className="bloomberg-nav-link">Sign Up</Link>
          <Link href="/stage1" className="bloomberg-btn bloomberg-btn-primary">Free Analysis</Link>
        </div>
      </nav>
      
      <main className="main">
        <div className="container">
          
          {/* Hero Section */}
          <section className="markets-hero">
            <h1 className="markets-title">USMCA Triangle Optimization</h1>
            <p className="markets-subtitle">
              Maximize your trade efficiency across the world's most integrated trade bloc
            </p>
            
            <div className="markets-overview">
              <div className="markets-stat">
                <span className="markets-stat-number">$28T+</span>
                <span className="markets-stat-label">Combined GDP</span>
              </div>
              <div className="markets-stat">
                <span className="markets-stat-number">500M+</span>
                <span className="markets-stat-label">Consumers</span>
              </div>
              <div className="markets-stat">
                <span className="markets-stat-number">15</span>
                <span className="markets-stat-label">Optimized Ports</span>
              </div>
              <div className="markets-stat">
                <span className="markets-stat-number">28%</span>
                <span className="markets-stat-label">Max Tariff Savings</span>
              </div>
            </div>
          </section>

          {/* Market Selection */}
          <section className="markets-selection">
            <div className="markets-tabs">
              {Object.entries(markets).map(([key, market]) => (
                <button
                  key={key}
                  className={`markets-tab ${selectedMarket === key ? 'markets-tab-active' : ''}`}
                  onClick={() => setSelectedMarket(key)}
                >
                  <span className="markets-tab-flag">{market.flag}</span>
                  <span className="markets-tab-title">{market.title.replace(' Market', '')}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Market Details */}
          <section className="markets-detail">
            <div className="markets-detail-header">
              <div className="markets-detail-flag">{currentMarket.flag}</div>
              <div className="markets-detail-info">
                <h2 className="markets-detail-title">{currentMarket.title}</h2>
                <p className="markets-detail-description">{currentMarket.description}</p>
              </div>
            </div>

            <div className="markets-detail-grid">
              
              {/* Advantages */}
              <div className="markets-section">
                <h3 className="markets-section-title">Key Advantages</h3>
                <ul className="markets-advantages-list">
                  {currentMarket.advantages.map((advantage, index) => (
                    <li key={index} className="markets-advantage-item">
                      ✓ {advantage}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Ports */}
              <div className="markets-section">
                <h3 className="markets-section-title">Strategic Ports</h3>
                <div className="markets-ports">
                  {currentMarket.keyPorts.map((port, index) => (
                    <span key={index} className="markets-port-tag">
                      🚢 {port}
                    </span>
                  ))}
                </div>
              </div>

              {/* Industries */}
              <div className="markets-section">
                <h3 className="markets-section-title">Key Industries</h3>
                <div className="markets-industries">
                  {currentMarket.industries.map((industry, index) => (
                    <span key={index} className="markets-industry-tag">
                      {industry}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Triangle Opportunities */}
          <section className="triangle-opportunities">
            <h2 className="triangle-opportunities-title">Triangle Route Opportunities</h2>
            
            <div className="triangle-routes-grid">
              {currentMarket.triangleOpportunities.map((opportunity, index) => (
                <div key={index} className="triangle-route-card">
                  <h3 className="triangle-route-name">{opportunity.route}</h3>
                  <p className="triangle-route-description">{opportunity.description}</p>
                  
                  <div className="triangle-route-details">
                    <div className="triangle-route-detail">
                      <span className="triangle-route-label">Potential Savings:</span>
                      <span className="triangle-route-value triangle-savings">{opportunity.savings}</span>
                    </div>
                    <div className="triangle-route-detail">
                      <span className="triangle-route-label">Complexity:</span>
                      <span className="triangle-route-value">{opportunity.complexity}</span>
                    </div>
                    <div className="triangle-route-detail">
                      <span className="triangle-route-label">Implementation:</span>
                      <span className="triangle-route-value">{opportunity.timeframe}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Case Study */}
          <section className="markets-case-study">
            <h2 className="case-study-title">Success Story: {currentMarket.caseStudy.company}</h2>
            
            <div className="case-study-card">
              <div className="case-study-header">
                <div className="case-study-info">
                  <h3 className="case-study-company">{currentMarket.caseStudy.company}</h3>
                  <p className="case-study-industry">{currentMarket.caseStudy.industry}</p>
                </div>
                <div className="case-study-result">
                  <span className="case-study-savings">{currentMarket.caseStudy.result}</span>
                  <span className="case-study-time">Achieved in {currentMarket.caseStudy.timeToValue}</span>
                </div>
              </div>
              
              <div className="case-study-content">
                <div className="case-study-section">
                  <h4 className="case-study-section-title">Challenge</h4>
                  <p className="case-study-text">{currentMarket.caseStudy.challenge}</p>
                </div>
                
                <div className="case-study-section">
                  <h4 className="case-study-section-title">Solution</h4>
                  <p className="case-study-text">{currentMarket.caseStudy.solution}</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="markets-cta-section">
            <div className="markets-cta-content">
              <h2 className="markets-cta-title">Ready to Optimize Your {currentMarket.title}?</h2>
              <p className="markets-cta-subtitle">
                Start your free analysis and discover triangle routing opportunities in your target market
              </p>
              
              <div className="markets-cta-buttons">
                <Link href="/stage1" className="btn btn-primary btn-large">
                  Start Free {currentMarket.title.replace(' Market', '')} Analysis
                </Link>
                <Link href="/signup" className="btn btn-secondary btn-large">
                  View Pricing Plans
                </Link>
              </div>
              
              <div className="markets-cta-note">
                Analysis customized for {currentMarket.title} regulations and opportunities
              </div>
            </div>
          </section>

        </div>
      </main>
    </>
  )
}