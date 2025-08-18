import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function PlatformPage() {
  const [activeStep, setActiveStep] = useState('analyze')
  const [stats, setStats] = useState({
    companies: 240,
    savings: 1850000,
    loading: true
  })

  useEffect(() => {
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

  const steps = {
    analyze: {
      title: "1. Analyze Your Imports",
      description: "We analyze your current import patterns and identify products that qualify for triangle routing.",
      details: [
        "Review your current import volume and sources",
        "Identify products paying high tariffs (25%+ from China/Asia)",
        "Check which products qualify for USMCA triangle routing",
        "Calculate potential savings based on your actual data"
      ]
    },
    route: {
      title: "2. Find Triangle Routes", 
      description: "We identify the best Mexico or Canada routes for your specific products.",
      details: [
        "Route China → Mexico → USA (0% tariff instead of 25%)",
        "Route India → Canada → USA (0% tariff instead of 50%)", 
        "Use our network of 15+ manufacturing partners",
        "Ensure all routes comply with USMCA requirements"
      ]
    },
    implement: {
      title: "3. Implement & Save",
      description: "We connect you with our partners and help you find new trade relationships.",
      details: [
        "Introduce you to vetted manufacturing partners in Mexico/Canada",
        "Help find new suppliers that can route through triangle countries",
        "Set up new trade relationships with better tariff rates",
        "Handle USMCA compliance documentation",
        "Monitor savings and optimize over time"
      ]
    }
  }

  const currentStep = steps[activeStep]

  return (
    <>
      <Head>
        <title>How It Works | Triangle Intelligence Platform</title>
        <meta name="description" content="See how Triangle Intelligence helps companies save 15-25% on imports through Mexico and Canada triangle routing." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Navigation */}
      <nav className="bloomberg-nav">
        <div className="bloomberg-container bloomberg-flex">
          <Link href="/" className="bloomberg-nav-brand">
            Triangle Intelligence
          </Link>
          
          <div className="bloomberg-flex">
            <Link href="/platform" className="bloomberg-nav-link active">Platform</Link>
            <Link href="/pricing" className="bloomberg-nav-link">Pricing</Link>
            <Link href="/about" className="bloomberg-nav-link">About</Link>
            <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bloomberg-section">
        <div className="bloomberg-container">
          <h1>
            How Triangle Routing Works
          </h1>
          
          <p>
            Our platform helps you save money by routing imports through Mexico and Canada instead of directly from Asia.
          </p>

          <div className="bloomberg-grid">
            <div className="bloomberg-card">
              <div className="bloomberg-metric">
                <div className="bloomberg-metric-value">{stats.companies}+</div>
                <div className="bloomberg-metric-label">Companies Analyzed</div>
              </div>
            </div>
            
            <div className="bloomberg-card">
              <div className="bloomberg-metric">
                <div className="bloomberg-metric-value">597K+</div>
                <div className="bloomberg-metric-label">Trade Flow Database</div>
              </div>
            </div>
            
            <div className="bloomberg-card">
              <div className="bloomberg-metric">
                <div className="bloomberg-metric-value">15-25%</div>
                <div className="bloomberg-metric-label">Typical Savings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Steps */}
      <section className="bloomberg-section">
        <div className="bloomberg-container">
          <h2>Three Simple Steps</h2>

          {/* Step Navigation */}
          <div className="bloomberg-flex">
            {Object.entries(steps).map(([key, step]) => (
              <button
                key={key}
                onClick={() => setActiveStep(key)}
                className={`bloomberg-btn ${activeStep === key ? 'bloomberg-btn-primary' : 'bloomberg-btn-secondary'}`}
              >
                {step.title}
              </button>
            ))}
          </div>

        {/* Step Content */}
        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">{currentStep.title}</h3>
          </div>
          
          <div>
            <p>
              {currentStep.description}
            </p>

            <div>
              {currentStep.details.map((detail, index) => (
                <div key={index}>
                  <span className="bloomberg-metric-positive">✓ </span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>

            {activeStep === 'analyze' && (
              <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
                Start Your Analysis
              </Link>
            )}
          </div>
        </div>
        </div>
      </section>

      {/* Real Results */}
      <section className="bloomberg-section">
        <div className="bloomberg-container">
          <h2>Real Results from Real Companies</h2>

          <div className="bloomberg-grid">
            <div className="bloomberg-card">
            <div className="bloomberg-card-header">
              <h4 className="bloomberg-card-title">Electronics Importer</h4>
              <div className="bloomberg-status bloomberg-status-success">$420K Saved</div>
            </div>
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value">$420K</div>
              <div className="bloomberg-metric-label">Annual Savings</div>
            </div>
            <p>$2.1M in electronics from China. Routed through Mexico manufacturing partner. Reduced tariffs from 25% to 0%.</p>
            </div>

            <div className="bloomberg-card">
            <div className="bloomberg-card-header">
              <h4 className="bloomberg-card-title">Automotive Parts</h4>
              <div className="bloomberg-status bloomberg-status-success">$890K Saved</div>
            </div>
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value">$890K</div>
              <div className="bloomberg-metric-label">Annual Savings</div>
            </div>
            <p>$3.6M in auto parts from India. Triangle route through Canada reduced tariffs from 50% to 0%.</p>
            </div>

            <div className="bloomberg-card">
            <div className="bloomberg-card-header">
              <h4 className="bloomberg-card-title">Consumer Goods</h4>
              <div className="bloomberg-status bloomberg-status-success">$1.2M Saved</div>
            </div>
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value">$1.2M</div>
              <div className="bloomberg-metric-label">Annual Savings</div>
            </div>
            <p>$6M in consumer goods from multiple Asian suppliers. Mixed Mexico/Canada routing strategy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Works */}
      <section className="bloomberg-section">
        <div className="bloomberg-container">
          <h2>Why Triangle Routing Works</h2>

          <div className="bloomberg-grid">
            <div className="bloomberg-card">
            <div className="bloomberg-card-header">
              <h4 className="bloomberg-card-title">Legal & Treaty-Protected</h4>
              <div className="bloomberg-status bloomberg-status-success">USMCA</div>
            </div>
            <p>USMCA (formerly NAFTA) guarantees 0% tariffs between US, Mexico, and Canada. This is locked in by international treaty - not subject to political changes.</p>
            </div>

            <div className="bloomberg-card">
            <div className="bloomberg-card-header">
              <h4 className="bloomberg-card-title">Established Infrastructure</h4>
              <div className="bloomberg-status bloomberg-status-info">15+ Partners</div>
            </div>
            <p>Mexico and Canada have mature manufacturing sectors with existing trade relationships. Our partners have been operating these routes for years.</p>
            </div>

            <div className="bloomberg-card">
            <div className="bloomberg-card-header">
              <h4 className="bloomberg-card-title">Quality Manufacturing</h4>
              <div className="bloomberg-status bloomberg-status-success">Verified</div>
            </div>
            <p>Our manufacturing partners meet the same quality standards as your current suppliers. Many are already producing for major US brands.</p>
            </div>

            <div className="bloomberg-card">
            <div className="bloomberg-card-header">
              <h4 className="bloomberg-card-title">Predictable Costs</h4>
              <div className="bloomberg-status bloomberg-status-info">0% Rate</div>
            </div>
            <p>Unlike volatile bilateral tariffs that change with politics, USMCA rates are stable and predictable. Plan your costs with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bloomberg-section">
        <div className="bloomberg-container">
          <div className="bloomberg-card">
            <h2>Ready to Start Saving?</h2>
            
            <p>
              Get a free analysis of your current imports and see exactly how much you could save with triangle routing.
            </p>
            
            <div className="bloomberg-flex">
              <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
                Start Free Analysis
              </Link>
              <Link href="/pricing" className="bloomberg-btn bloomberg-btn-secondary">
                See Pricing
              </Link>
            </div>
            
            <p>
              Complete analysis in 10-15 minutes • No commitment required
            </p>
          </div>
        </div>
      </section>
    </>
  )
}