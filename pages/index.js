import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import TriangleLayout from '../components/TriangleLayout'
import SimpleSavingsCalculator from '../components/SimpleSavingsCalculator'

export default function HomePage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <>
      <Head>
        <title>TradeFlow Intelligence | USMCA Compliance & Supply Chain Optimization</title>
        <meta name="description" content="Professional trade services platform delivering comprehensive USMCA compliance analysis and supply chain optimization for North American manufacturers and importers." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="TradeFlow Intelligence | USMCA Compliance Platform" />
        <meta property="og:description" content="Professional trade services delivering comprehensive USMCA compliance analysis and supply chain optimization for enterprise clients." />
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
                TradeFlow Intelligence
              </div>
              <div className="nav-logo-subtitle">
                USMCA Compliance Platform
              </div>
            </div>
          </Link>
          <div className="nav-menu">
            <Link href="/solutions" className="nav-menu-link">
              Solutions
            </Link>
            <Link href="/industries" className="nav-menu-link">
              Industries
            </Link>
            <Link href="/intelligence" className="nav-menu-link">
              Intelligence
            </Link>
            <Link href="/services" className="nav-menu-link">
              Services
            </Link>
            <Link href="/pricing" className="nav-menu-link">
              Pricing
            </Link>
            <Link href="/usmca-workflow" className="nav-cta-button">
              Start Analysis
            </Link>
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
          <source src="/image/earth-seamless-loop.webm" type="video/webm" />
          Your browser does not support the video tag.
        </video>
        
        {/* Gradient Overlay */}
        <div className="hero-gradient-overlay" />
        
        {/* Hero Content */}
        <div className="hero-content-container">
          <div className="hero-badge">
            Trade Policy Update: USMCA Optimization Opportunities Available
          </div>
          
          <h1 className="hero-main-title">
            Move The World
          </h1>
          <h2 className="hero-sub-title">
            Enterprise <span className="hero-gradient-text">USMCA Compliance</span><br/>
            <span>& Supply Chain Optimization</span>
          </h2>
          
          <p className="hero-description-text">
            Professional trade services platform delivering comprehensive compliance analysis and supply chain optimization for Fortune 500 manufacturers and importers.
          </p>
          
          <div className="hero-button-group">
            <Link href="/usmca-workflow" className="hero-primary-button">
              Start USMCA Analysis
            </Link>
            <Link href="#calculator" className="hero-secondary-button">
              Calculate Savings
            </Link>
          </div>
        </div>
      </section>

      {isClient && (
        <>
          <section id="calculator" className="main-content gradient-subtle py-16">
            <div className="container-app">
              <SimpleSavingsCalculator />
            </div>
          </section>

          {/* USMCA Compliance Solutions Section */}
          <section className="main-content">
            <div className="container-app">
              <div className="section-header">
                <h2 className="section-header-title">USMCA Compliance Solutions</h2>
                <p className="section-header-subtitle">
                  Professional trade services delivering comprehensive compliance analysis and strategic supply chain optimization for enterprise clients.
                </p>
              </div>
              
              <div className="grid-2-cols">
                <div className="content-card classification">
                  <div className="content-card-icon">HC</div>
                  <h3 className="content-card-title">Trade Classification & Analysis</h3>
                  <p className="content-card-description">
                    Professional harmonized system classification with CBP-verified accuracy for streamlined customs processing and duty optimization.
                  </p>
                  <Link href="/usmca-workflow" className="content-card-link">
                    Start Classification Analysis
                  </Link>
                </div>

                <div className="content-card analysis">
                  <div className="content-card-icon">RA</div>
                  <h3 className="content-card-title">Supply Chain Route Analysis</h3>
                  <p className="content-card-description">
                    Comprehensive assessment of trade corridors through Mexico and Canada to identify cost savings and compliance opportunities.
                  </p>
                  <Link href="/usmca-workflow" className="content-card-link">
                    Analyze Trade Routes
                  </Link>
                </div>

                <div className="content-card certificates">
                  <div className="content-card-icon">CO</div>
                  <h3 className="content-card-title">Certificate of Origin Services</h3>
                  <p className="content-card-description">
                    Complete documentation services with audit-ready compliance records and professional customs broker partnership.
                  </p>
                  <Link href="/usmca-workflow" className="content-card-link">
                    Generate Certificates
                  </Link>
                </div>

                <div className="content-card compliance">
                  <div className="content-card-icon">RC</div>
                  <h3 className="content-card-title">Regulatory Compliance Management</h3>
                  <p className="content-card-description">
                    Expert guidance on evolving trade regulations with real-time updates and implementation support for enterprise clients.
                  </p>
                  <Link href="/trump-tariff-alerts" className="content-card-link">
                    Monitor Regulations
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Industry Insights Section */}
          <section className="main-content">
            <div className="container-app">
              <div className="section-header">
                <h2 className="section-header-title">TradeFlow Intelligence Insights</h2>
                <p className="section-header-subtitle">
                  Professional insights and analysis for strategic supply chain optimization and regulatory compliance management.
                </p>
              </div>
              
              <div className="insights-layout">
                <div className="content-card">
                  <h3 className="content-card-title">USMCA Optimization: Strategic Opportunities</h3>
                  <p className="content-card-description">
                    Comprehensive analysis of North American trade corridors reveals significant cost reduction opportunities through strategic Mexico routing for enterprise manufacturers.
                  </p>
                  <div className="insights-button-group">
                    <Link href="/usmca-workflow" className="btn-primary">
                      Read the Analysis
                    </Link>
                    <Link href="#calculator" className="btn-secondary">
                      Calculate Your Savings
                    </Link>
                  </div>
                </div>
                
                <img 
                  src="/image/datos-financieros.jpg" 
                  alt="Professional Trade Analysis Dashboard"
                  className="insights-image"
                />
              </div>
            </div>
          </section>
        </>
      )}
    </>
  )
}
